import os
import json
from datetime import datetime
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
import aiosqlite
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Create necessary directories
        self.base_dir = Path("transcriptions")
        self.base_dir.mkdir(exist_ok=True)
        
        # Database setup
        self.db_path = self.base_dir / "transcriptions.db"
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database with necessary tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                # Drop existing table if exists
                cursor.execute("DROP TABLE IF EXISTS transcriptions")
                
                # Create new table with updated schema
                cursor.execute("""
                    CREATE TABLE transcriptions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        transcription_text TEXT NOT NULL,
                        ai_insights TEXT,
                        ai_questions TEXT
                    )
                """)
                conn.commit()
                logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise

    async def save_transcription(
        self,
        transcription_text: str,
        ai_insights: Optional[List[str]] = None,
        ai_questions: Optional[List[str]] = None
    ) -> int:
        """Save transcription with AI insights to database"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.cursor()
                await cursor.execute(
                    """
                    INSERT INTO transcriptions 
                    (transcription_text, ai_insights, ai_questions)
                    VALUES (?, ?, ?)
                    """,
                    (
                        transcription_text,
                        json.dumps(ai_insights) if ai_insights else None,
                        json.dumps(ai_questions) if ai_questions else None
                    )
                )
                await db.commit()
                return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error saving transcription: {e}")
            raise

    async def get_transcription(self, transcription_id: int) -> Dict[str, Any]:
        """Retrieve a specific transcription by ID"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    "SELECT * FROM transcriptions WHERE id = ?",
                    (transcription_id,)
                )
                row = await cursor.fetchone()
                if row:
                    id, timestamp, text, insights, questions = row
                    return {
                        "id": id,
                        "timestamp": timestamp,
                        "transcription_text": text,
                        "ai_insights": json.loads(insights) if insights else [],
                        "ai_questions": json.loads(questions) if questions else []
                    }
                return None
        except Exception as e:
            logger.error(f"Error retrieving transcription: {e}")
            raise

    async def get_all_transcriptions(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Retrieve all transcriptions with pagination"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    SELECT * FROM transcriptions 
                    ORDER BY timestamp DESC 
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset)
                )
                rows = await cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "timestamp": row[1],
                        "transcription_text": row[2],
                        "ai_insights": json.loads(row[3]) if row[3] else [],
                        "ai_questions": json.loads(row[4]) if row[4] else []
                    }
                    for row in rows
                ]
        except Exception as e:
            logger.error(f"Error retrieving transcriptions: {e}")
            raise

    async def delete_transcription(self, transcription_id: int) -> bool:
        """Delete a specific transcription by ID"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    "DELETE FROM transcriptions WHERE id = ?",
                    (transcription_id,)
                )
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Error deleting transcription: {e}")
            raise

    async def search_transcriptions(
        self,
        query: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search transcriptions by text content"""
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    """
                    SELECT * FROM transcriptions 
                    WHERE transcription_text LIKE ? 
                    ORDER BY timestamp DESC 
                    LIMIT ? OFFSET ?
                    """,
                    (f"%{query}%", limit, offset)
                )
                rows = await cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "timestamp": row[1],
                        "transcription_text": row[2],
                        "ai_insights": json.loads(row[3]) if row[3] else [],
                        "ai_questions": json.loads(row[4]) if row[4] else []
                    }
                    for row in rows
                ]
        except Exception as e:
            logger.error(f"Error searching transcriptions: {e}")
            raise
