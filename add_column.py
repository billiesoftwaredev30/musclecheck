import os
from backend.core.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE song_requests ADD COLUMN youtube_url VARCHAR;"))
        print("Success")
    except Exception as e:
        print("Error:", e)
