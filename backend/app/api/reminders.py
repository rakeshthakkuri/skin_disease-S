"""
Reminders API - Medication reminder management
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.db_models import User, Prescription, Reminder

router = APIRouter()


class ReminderCreate(BaseModel):
    prescription_id: Optional[str] = None
    title: str
    message: str
    message_telugu: Optional[str] = None
    frequency: str  # once_daily, twice_daily, three_times_daily
    times: List[str]  # ["09:00", "21:00"]


class ReminderResponse(BaseModel):
    id: str
    prescription_id: Optional[str]
    title: str
    message: str
    message_telugu: Optional[str]
    frequency: str
    times: List[str]
    status: str
    total_acknowledged: int
    created_at: str


@router.post("/create", response_model=ReminderResponse)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a medication reminder."""
    reminder_id = str(uuid.uuid4())[:8]
    
    reminder_obj = Reminder(
        id=reminder_id,
        user_id=current_user.id,
        prescription_id=reminder.prescription_id,
        title=reminder.title,
        message=reminder.message,
        message_telugu=reminder.message_telugu,
        frequency=reminder.frequency,
        times=reminder.times,
        status="active",
        total_acknowledged=0
    )
    
    db.add(reminder_obj)
    db.commit()
    db.refresh(reminder_obj)
    
    return ReminderResponse(
        id=reminder_obj.id,
        prescription_id=reminder_obj.prescription_id,
        title=reminder_obj.title,
        message=reminder_obj.message,
        message_telugu=reminder_obj.message_telugu,
        frequency=reminder_obj.frequency,
        times=reminder_obj.times,
        status=reminder_obj.status,
        total_acknowledged=reminder_obj.total_acknowledged,
        created_at=reminder_obj.created_at.isoformat()
    )


@router.get("/")
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all reminders for current user."""
    reminders = db.execute(
        select(Reminder).where(Reminder.user_id == current_user.id)
        .order_by(Reminder.created_at.desc())
    ).scalars().all()
    
    return [
        {
            "id": r.id,
            "prescription_id": r.prescription_id,
            "title": r.title,
            "message": r.message,
            "message_telugu": r.message_telugu,
            "frequency": r.frequency,
            "times": r.times,
            "status": r.status,
            "total_acknowledged": r.total_acknowledged,
            "created_at": r.created_at.isoformat()
        }
        for r in reminders
    ]


@router.get("/{reminder_id}")
async def get_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reminder by ID (user-specific)."""
    reminder = db.execute(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {
        "id": reminder.id,
        "prescription_id": reminder.prescription_id,
        "title": reminder.title,
        "message": reminder.message,
        "message_telugu": reminder.message_telugu,
        "frequency": reminder.frequency,
        "times": reminder.times,
        "status": reminder.status,
        "total_acknowledged": reminder.total_acknowledged,
        "created_at": reminder.created_at.isoformat()
    }


@router.post("/{reminder_id}/acknowledge")
async def acknowledge_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark reminder as acknowledged (medication taken)."""
    reminder = db.execute(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    reminder.total_acknowledged += 1
    db.commit()
    db.refresh(reminder)
    
    return {
        "reminder_id": reminder_id,
        "acknowledged_at": datetime.now().isoformat(),
        "total_acknowledged": reminder.total_acknowledged
    }


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a reminder."""
    reminder = db.execute(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(reminder)
    db.commit()
    
    return {"message": "Reminder deleted"}


@router.post("/auto-schedule/{prescription_id}")
async def auto_schedule_reminders(
    prescription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Automatically create reminders from prescription medications.
    """
    prescription = db.execute(
        select(Prescription).where(
            Prescription.id == prescription_id,
            Prescription.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    created_reminders = []
    
    for med in prescription.medications:
        # Determine times based on frequency
        freq = med.get("frequency", "once daily").lower()
        if "twice" in freq:
            times = ["09:00", "21:00"]
            frequency = "twice_daily"
        elif "three" in freq:
            times = ["09:00", "14:00", "21:00"]
            frequency = "three_times_daily"
        else:
            times = ["21:00"] if "night" in freq else ["09:00"]
            frequency = "once_daily"
        
        reminder_id = str(uuid.uuid4())[:8]
        reminder = Reminder(
            id=reminder_id,
            user_id=current_user.id,
            prescription_id=prescription_id,
            title=f"Medication: {med['name']}",
            message=f"Time to apply/take {med['name']}. {med.get('instructions', '')}",
            message_telugu=None,
            frequency=frequency,
            times=times,
            status="active",
            total_acknowledged=0
        )
        
        db.add(reminder)
        created_reminders.append({
            "id": reminder_id,
            "prescription_id": prescription_id,
            "title": reminder.title,
            "message": reminder.message,
            "frequency": frequency,
            "times": times,
            "status": "active"
        })
    
    db.commit()
    
    return {
        "prescription_id": prescription_id,
        "reminders_created": len(created_reminders),
        "reminders": created_reminders
    }

