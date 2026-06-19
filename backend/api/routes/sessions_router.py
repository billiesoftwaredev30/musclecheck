# backend/api/routes/sessions_router.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.models import DailySession, Client
from backend.schemas.schemas import DailySessionCreate, DailySessionResponse, DashboardMetrics, BulkDeleteRequest
from backend.services.gym_service import get_dashboard_metrics

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/summary", response_model=DashboardMetrics)
def get_summary(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)

@router.post("", response_model=DailySessionResponse, status_code=status.HTTP_201_CREATED)
def log_session(session: DailySessionCreate, db: Session = Depends(get_db)):
    # Check if client_id is provided and valid to link the visit
    db_client = None
    if session.client_id:
        db_client = db.query(Client).filter(Client.id == session.client_id).first()
        # Prevent multiple check-ins
        existing_session = db.query(DailySession).filter(
            DailySession.client_id == session.client_id,
            DailySession.date == session.date
        ).first()
        if existing_session:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Client has already logged in today")
    else:
        # Prevent multiple walk-ins with same exact name
        existing_session = db.query(DailySession).filter(
            DailySession.client_name == session.client_name,
            DailySession.date == session.date
        ).first()
        if existing_session:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="A walk-in with this exact name has already logged in today")

    if session.deduct_coaching:
        from fastapi import HTTPException
        if not db_client:
            raise HTTPException(status_code=400, detail="Cannot deduct coaching session for unregistered client")
        if db_client.pt_sessions_remaining <= 0:
            raise HTTPException(status_code=400, detail="Client has 0 remaining coaching sessions")
        db_client.pt_sessions_remaining -= 1

    if db_client and session.pt_sessions_added > 0:
        db_client.pt_sessions_remaining += session.pt_sessions_added
        
    db_session = DailySession(
        client_name=session.client_name,
        client_id=db_client.id if db_client else None,
        time_in=session.time_in,
        date=session.date,
        client_assist=session.client_assist,
        is_member=session.is_member,
        amount_paid=session.amount_paid,
        pt_fee=session.pt_fee,
        payment_method=session.payment_method,
        deduct_coaching=session.deduct_coaching,
        pt_sessions_added=session.pt_sessions_added
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

from typing import List, Optional
from datetime import date as _date
from fastapi import HTTPException

@router.get("/history", response_model=List[DailySessionResponse])
def get_session_history(date: Optional[_date] = None, db: Session = Depends(get_db)):
    query = db.query(DailySession).order_by(DailySession.date.desc(), DailySession.id.desc())
    if date:
        query = query.filter(DailySession.date == date)
    return query.all()

@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_sessions(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    db.query(DailySession).filter(DailySession.id.in_(req.ids)).delete(synchronize_session="fetch")
    db.commit()
    return

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(DailySession).filter(DailySession.id == session_id).first()
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    db.delete(db_session)
    db.commit()
    return
