# backend/api/routes/rates_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.schemas.schemas import GymRatesResponse, GymRatesUpdate
from backend.models.models import SystemSettings
from backend.core.database import get_db

router = APIRouter(prefix="/rates", tags=["rates"])

def get_or_create_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/", response_model=GymRatesResponse)
def get_gym_rates(db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    return settings

@router.put("/", response_model=GymRatesResponse)
def update_gym_rates(req: GymRatesUpdate, db: Session = Depends(get_db)):
    settings = get_or_create_settings(db)
    settings.rate_daily_member = req.rate_daily_member
    settings.rate_daily_non_member = req.rate_daily_non_member
    settings.rate_monthly_subscription_1m = req.rate_monthly_subscription_1m
    settings.rate_monthly_subscription_6m = req.rate_monthly_subscription_6m
    settings.rate_monthly_subscription_12m = req.rate_monthly_subscription_12m
    db.commit()
    db.refresh(settings)
    return settings
