# backend/api/routes/trainers_router.py
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as _date

from backend.core.database import get_db
from backend.models.models import DailySession, SystemSettings
from backend.schemas.schemas import TrainerPayrollMetrics

router = APIRouter(prefix="/trainers", tags=["trainers"])

@router.get("/payroll", response_model=List[TrainerPayrollMetrics])
def get_trainer_payroll(start_date: _date, end_date: _date, db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).first()
    commission_rate = settings.rate_trainer_commission if settings else 200.0

    sessions = db.query(DailySession).filter(
        DailySession.date >= start_date,
        DailySession.date <= end_date
    ).all()

    trainers = ["JAYSON", "VINCENT", "TIN"]
    payroll_data = []

    for trainer in trainers:
        assists = sum(1 for s in sessions if s.client_assist == trainer)
        total_commission = assists * commission_rate
        payroll_data.append(TrainerPayrollMetrics(
            trainer_name=trainer,
            total_assists=assists,
            total_commission=total_commission
        ))

    return payroll_data
