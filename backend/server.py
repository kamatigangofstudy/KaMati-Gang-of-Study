from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subject: str
    semester: str
    size: Optional[str] = None
    file_url: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoteCreate(BaseModel):
    title: str
    subject: str
    semester: str
    size: Optional[str] = None
    file_url: Optional[str] = None

class Discussion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author: Optional[str] = "Anonymous"
    replies: int = 0
    upvotes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiscussionCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = "Anonymous"

class Reply(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    discussion_id: str
    content: str
    author: Optional[str] = "Anonymous"
    upvotes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReplyCreate(BaseModel):
    content: str
    author: Optional[str] = "Anonymous"

class Feedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rating: int
    comment: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None
    name: Optional[str] = None

# Helper functions for MongoDB serialization
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back to datetime objects from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "KaMaTi Gang Study Hub API v2.0"}

# Notes endpoints
@api_router.get("/notes", response_model=List[Note])
async def get_notes(subject: Optional[str] = None, semester: Optional[str] = None):
    """Get all notes with optional filters"""
    try:
        filter_query = {}
        if subject:
            filter_query["subject"] = subject
        if semester:
            filter_query["semester"] = semester
        
        notes = await db.notes.find(filter_query).sort("uploaded_at", -1).to_list(length=None)
        return [Note(**parse_from_mongo(note)) for note in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/notes", response_model=Note)
async def create_note(note_data: NoteCreate):
    """Create a new note"""
    try:
        note = Note(**note_data.dict())
        note_dict = prepare_for_mongo(note.dict())
        await db.notes.insert_one(note_dict)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/notes/{note_id}", response_model=Note)
async def get_note(note_id: str):
    """Get a specific note by ID"""
    try:
        note = await db.notes.find_one({"id": note_id})
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return Note(**parse_from_mongo(note))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    try:
        result = await db.notes.delete_one({"id": note_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"message": "Note deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Discussion endpoints
@api_router.get("/discussions", response_model=List[Discussion])
async def get_discussions():
    """Get all discussions"""
    try:
        discussions = await db.discussions.find().sort("created_at", -1).to_list(length=None)
        return [Discussion(**parse_from_mongo(discussion)) for discussion in discussions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/discussions", response_model=Discussion)
async def create_discussion(discussion_data: DiscussionCreate):
    """Create a new discussion"""
    try:
        discussion = Discussion(**discussion_data.dict())
        discussion_dict = prepare_for_mongo(discussion.dict())
        await db.discussions.insert_one(discussion_dict)
        return discussion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/discussions/{discussion_id}", response_model=Discussion)
async def get_discussion(discussion_id: str):
    """Get a specific discussion by ID"""
    try:
        discussion = await db.discussions.find_one({"id": discussion_id})
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        return Discussion(**parse_from_mongo(discussion))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/discussions/{discussion_id}")
async def delete_discussion(discussion_id: str):
    """Delete a discussion"""
    try:
        # Also delete all replies to this discussion
        await db.replies.delete_many({"discussion_id": discussion_id})
        
        # Delete the discussion
        result = await db.discussions.delete_one({"id": discussion_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Discussion not found")
        return {"message": "Discussion deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reply endpoints
@api_router.get("/discussions/{discussion_id}/replies", response_model=List[Reply])
async def get_replies(discussion_id: str):
    """Get all replies for a discussion"""
    try:
        replies = await db.replies.find({"discussion_id": discussion_id}).sort("created_at", 1).to_list(length=None)
        return [Reply(**parse_from_mongo(reply)) for reply in replies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/discussions/{discussion_id}/replies", response_model=Reply)
async def create_reply(discussion_id: str, reply_data: ReplyCreate):
    """Create a new reply to a discussion"""
    try:
        # Check if discussion exists
        discussion = await db.discussions.find_one({"id": discussion_id})
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Create reply
        reply = Reply(discussion_id=discussion_id, **reply_data.dict())
        reply_dict = prepare_for_mongo(reply.dict())
        await db.replies.insert_one(reply_dict)
        
        # Update discussion reply count
        await db.discussions.update_one(
            {"id": discussion_id},
            {"$inc": {"replies": 1}}
        )
        
        return reply
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/replies/{reply_id}")
async def delete_reply(reply_id: str):
    """Delete a reply"""
    try:
        # Get the reply to find which discussion it belongs to
        reply = await db.replies.find_one({"id": reply_id})
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")
        
        # Delete the reply
        await db.replies.delete_one({"id": reply_id})
        
        # Update discussion reply count
        await db.discussions.update_one(
            {"id": reply["discussion_id"]},
            {"$inc": {"replies": -1}}
        )
        
        return {"message": "Reply deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Feedback endpoints
@api_router.post("/feedback", response_model=Feedback)
async def submit_feedback(feedback_data: FeedbackCreate):
    """Submit user feedback"""
    try:
        feedback = Feedback(**feedback_data.dict())
        feedback_dict = prepare_for_mongo(feedback.dict())
        await db.feedback.insert_one(feedback_dict)
        return feedback
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/feedback", response_model=List[Feedback])
async def get_feedback():
    """Get all feedback (admin only)"""
    try:
        feedback_list = await db.feedback.find().sort("created_at", -1).to_list(length=None)
        return [Feedback(**parse_from_mongo(feedback)) for feedback in feedback_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Upvote endpoints
@api_router.post("/discussions/{discussion_id}/upvote")
async def upvote_discussion(discussion_id: str):
    """Upvote a discussion"""
    try:
        result = await db.discussions.update_one(
            {"id": discussion_id},
            {"$inc": {"upvotes": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Discussion not found")
        return {"message": "Discussion upvoted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/replies/{reply_id}/upvote")
async def upvote_reply(reply_id: str):
    """Upvote a reply"""
    try:
        result = await db.replies.update_one(
            {"id": reply_id},
            {"$inc": {"upvotes": 1}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Reply not found")
        return {"message": "Reply upvoted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Search endpoints
@api_router.get("/search/notes")
async def search_notes(q: str, subject: Optional[str] = None, semester: Optional[str] = None):
    """Search notes by title or content"""
    try:
        filter_query = {
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"subject": {"$regex": q, "$options": "i"}}
            ]
        }
        
        if subject:
            filter_query["subject"] = subject
        if semester:
            filter_query["semester"] = semester
        
        notes = await db.notes.find(filter_query).sort("uploaded_at", -1).to_list(length=None)
        return [Note(**parse_from_mongo(note)) for note in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search/discussions")
async def search_discussions(q: str):
    """Search discussions by title or content"""
    try:
        filter_query = {
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"content": {"$regex": q, "$options": "i"}}
            ]
        }
        
        discussions = await db.discussions.find(filter_query).sort("created_at", -1).to_list(length=None)
        return [Discussion(**parse_from_mongo(discussion)) for discussion in discussions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()