from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import io

from backend.core.database import get_db
from backend.models.models import SongRequest
from backend.schemas.schemas import SongRequestCreate, SongRequestUpdate, SongRequestResponse

router = APIRouter(
    prefix="/music",
    tags=["music"]
)

from youtubesearchpython import VideosSearch
from gtts import gTTS

@router.get("/tts")
def text_to_speech(text: str):
    """Generate a speech MP3 from the given text using Google TTS."""
    try:
        tts = gTTS(text=text, lang="en", slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(
            mp3_fp,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-cache"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def is_youtube_url(url: str) -> bool:
    return "youtube.com" in url or "youtu.be" in url

@router.post("/request", response_model=SongRequestResponse)
def request_song(song: SongRequestCreate, db: Session = Depends(get_db)):
    title_to_save = song.title.strip()
    youtube_url = None
    
    if is_youtube_url(title_to_save):
        youtube_url = title_to_save
        
    try:
        videos_search = VideosSearch(title_to_save, limit=1)
        result = videos_search.result()
        if result and result.get("result") and len(result["result"]) > 0:
            video = result["result"][0]
            # Always grab the URL if it wasn't provided directly
            if not youtube_url:
                youtube_url = video.get("link")
            # Always grab the beautiful title to display!
            title_to_save = video.get("title", title_to_save)
    except Exception as e:
        pass

    db_song = SongRequest(
        title=title_to_save,
        youtube_url=youtube_url,
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
