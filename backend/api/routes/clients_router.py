# backend/api/routes/clients_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from backend.core.database import get_db
from backend.models.models import Client, Subscription, DailySession
from backend.schemas.schemas import ClientCreate, ClientResponse, SubscriptionCreate, SubscriptionResponse, BulkDeleteRequest
from backend.core.config import settings

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("/", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.full_name).all()

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.full_name == client.full_name).first()
    if db_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client with this name already registered"
        )
    new_client = Client(
        full_name=client.full_name,
        status=client.status,
        pt_sessions_remaining=client.pt_sessions_remaining,
        face_descriptor=client.face_descriptor
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, update_data: dict, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    if "full_name" in update_data:
        # Check for unique name if changing name
        existing = db.query(Client).filter(Client.full_name == update_data["full_name"]).first()
        if existing and existing.id != client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another client with this name already exists"
            )

    for key, value in update_data.items():
        if hasattr(db_client, key) and value is not None:
            setattr(db_client, key, value)
            
    db.commit()
    db.refresh(db_client)
    return db_client

@router.post("/{client_id}/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def add_subscription(client_id: int, sub: SubscriptionCreate, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update client status to subscriber
    db_client.status = "subscriber"
    
    # Deactivate existing active subscriptions
    active_subs = db.query(Subscription).filter(
        Subscription.client_id == client_id,
        Subscription.status == "active"
    ).all()
    for active_sub in active_subs:
        active_sub.status = "expired"

    new_sub = Subscription(
        client_id=client_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        amount_paid=sub.amount_paid,
        pt_fee=sub.pt_fee,
        payment_method=sub.payment_method,
        status="active",
        pt_sessions_added=sub.pt_sessions_added
    )
    db_client.pt_sessions_remaining += sub.pt_sessions_added
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.get("/{client_id}/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    subs = db.query(Subscription).filter(Subscription.client_id == client_id).order_by(Subscription.start_date.desc()).all()
    return subs

@router.patch("/subscriptions/{sub_id}", response_model=SubscriptionResponse)
def update_subscription(sub_id: int, update: dict, db: Session = Depends(get_db)):
    db_sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not db_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    for key, value in update.items():
        if hasattr(db_sub, key) and value is not None:
            setattr(db_sub, key, value)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@router.delete("/subscriptions/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(sub_id: int, db: Session = Depends(get_db)):
    db_sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not db_sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    # Revert client status if this was the only active subscription
    client = db.query(Client).filter(Client.id == db_sub.client_id).first()
    db.delete(db_sub)
    db.commit()
    
    # Check if client still has active subs
    if client:
        remaining = db.query(Subscription).filter(
            Subscription.client_id == client.id,
            Subscription.status == "active"
        ).first()
        if not remaining:
            client.status = "member"
            db.commit()
    return

@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_clients(req: BulkDeleteRequest, db: Session = Depends(get_db)):
    db.query(DailySession).filter(DailySession.client_id.in_(req.ids)).update(
        {DailySession.client_id: None}, synchronize_session="fetch"
    )
    db.query(Client).filter(Client.id.in_(req.ids)).delete(synchronize_session="fetch")
    db.commit()
    return

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    # Nullify DailySession references before deleting to avoid FK constraint
    db.query(DailySession).filter(DailySession.client_id == client_id).update(
        {DailySession.client_id: None}, synchronize_session="fetch"
    )
    db.delete(db_client)
    db.commit()
    return


