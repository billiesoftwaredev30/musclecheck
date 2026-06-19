# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import engine, Base, SessionLocal
from backend.api.routes import clients_router, sessions_router, rates_router, auth_router, products_router, trainers_router
from backend.services.gym_service import seed_gym_data

# Create Database tables
Base.metadata.create_all(bind=engine)

# Seed database with handwritten daily log entries
db = SessionLocal()
try:
    seed_gym_data(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(clients_router.router, prefix=settings.API_V1_STR)
app.include_router(sessions_router.router, prefix=settings.API_V1_STR)
app.include_router(rates_router.router, prefix=settings.API_V1_STR)
app.include_router(products_router.router, prefix=settings.API_V1_STR)
app.include_router(trainers_router.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}", "docs": "/docs"}
