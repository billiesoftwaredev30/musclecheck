from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: str

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    if req.username == settings.ADMIN_USERNAME and req.password == settings.ADMIN_PASSWORD:
        # In a real app, we'd generate a JWT. For now, a simple static token.
        return LoginResponse(success=True, token="admin_auth_token_xyz")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
