from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.core.database import get_db
from backend.models.models import SongRequest
from backend.schemas.schemas import SongRequestCreate, SongRequestUpdate, SongRequestResponse

router = APIRouter(
    prefix="/music",
    tags=["music"]
)

@router.post("/request", response_model=SongRequestResponse)
def request_song(song: SongRequestCreate, db: Session = Depends(get_db)):
    db_song = SongRequest(
        title=song.title,
        requested_by=song.requested_by,
        status="queued"
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

@router.get("/queue", response_model=List[SongRequestResponse])
def get_queue(db: Session = Depends(get_db)):
    return db.query(SongRequest).order_by(SongRequest.created_at.asc()).all()

@router.put("/{request_id}/status", response_model=SongRequestResponse)
def update_song_status(request_id: int, update_data: SongRequestUpdate, db: Session = Depends(get_db)):
    db_song = db.query(SongRequest).filter(SongRequest.id == request_id).first()
    if not db_song:
        raise HTTPException(status_code=404, detail="Song request not found")
    
    db_song.status = update_data.status
    db.commit()
    db.refresh(db_song)
    return db_song

@router.delete("/{request_id}")
def delete_song_request(request_id: int, db: Session = Depends(get_db)):
    db_song = db.query(SongRequest).filter(SongRequest.id == request_id).first()
    if not db_song:
        raise HTTPException(status_code=404, detail="Song request not found")
    
    db.delete(db_song)
    db.commit()
    return {"ok": True}
