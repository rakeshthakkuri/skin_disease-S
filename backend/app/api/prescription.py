"""
Prescription API - NLP-based prescription generation and translation
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid

from app.ml.nlp_prescriber import NLPPrescriber
from app.ml.translator import BilingualTranslator
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.db_models import User, Diagnosis, Prescription

router = APIRouter()

# Initialize NLP models
_prescriber = None
_translator = None


def get_prescriber():
    global _prescriber
    if _prescriber is None:
        _prescriber = NLPPrescriber()
    return _prescriber


def get_translator():
    global _translator
    if _translator is None:
        _translator = BilingualTranslator()
    return _translator


class Medication(BaseModel):
    name: str
    type: str
    dosage: str
    frequency: str
    duration: str
    instructions: str
    warnings: Optional[List[str]] = None


class PrescriptionRequest(BaseModel):
    diagnosis_id: str
    additional_notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: str
    diagnosis_id: str
    severity: str
    medications: List[Medication]
    lifestyle_recommendations: List[str]
    follow_up_instructions: str
    reasoning: str
    status: str
    created_at: str


class TranslateRequest(BaseModel):
    prescription_id: str
    target_language: str  # "en" or "te"


@router.post("/generate", response_model=PrescriptionResponse)
async def generate_prescription(
    request: PrescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered prescription based on diagnosis.
    """
    # Get diagnosis (user-specific)
    diagnosis = db.execute(
        select(Diagnosis).where(
            Diagnosis.id == request.diagnosis_id,
            Diagnosis.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Check if prescription already exists
    existing = db.execute(
        select(Prescription).where(
            Prescription.diagnosis_id == request.diagnosis_id,
            Prescription.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if existing:
        return PrescriptionResponse(
            id=existing.id,
            diagnosis_id=existing.diagnosis_id or "",
            severity=existing.severity,
            medications=existing.medications,
            lifestyle_recommendations=existing.lifestyle_recommendations,
            follow_up_instructions=existing.follow_up_instructions,
            reasoning=existing.reasoning,
            status=existing.status,
            created_at=existing.created_at.isoformat()
        )
    
    # Generate prescription using NLP
    prescriber = get_prescriber()
    prescription_data = prescriber.generate(
        severity=diagnosis.severity,
        lesion_counts=diagnosis.lesion_counts,
        clinical_metadata=diagnosis.clinical_metadata or {},
        additional_notes=request.additional_notes
    )
    
    # Create prescription record
    prescription_id = str(uuid.uuid4())[:8]
    prescription = Prescription(
        id=prescription_id,
        user_id=current_user.id,
        diagnosis_id=request.diagnosis_id,
        severity=diagnosis.severity,
        medications=prescription_data["medications"],
        lifestyle_recommendations=prescription_data["lifestyle_recommendations"],
        follow_up_instructions=prescription_data["follow_up_instructions"],
        reasoning=prescription_data["reasoning"],
        status="generated"
    )
    
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    
    return PrescriptionResponse(
        id=prescription.id,
        diagnosis_id=prescription.diagnosis_id or "",
        severity=prescription.severity,
        medications=prescription.medications,
        lifestyle_recommendations=prescription.lifestyle_recommendations,
        follow_up_instructions=prescription.follow_up_instructions,
        reasoning=prescription.reasoning,
        status=prescription.status,
        created_at=prescription.created_at.isoformat()
    )


@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get prescription by ID (user-specific)."""
    prescription = db.execute(
        select(Prescription).where(
            Prescription.id == prescription_id,
            Prescription.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    return {
        "id": prescription.id,
        "diagnosis_id": prescription.diagnosis_id,
        "severity": prescription.severity,
        "medications": prescription.medications,
        "lifestyle_recommendations": prescription.lifestyle_recommendations,
        "follow_up_instructions": prescription.follow_up_instructions,
        "reasoning": prescription.reasoning,
        "status": prescription.status,
        "created_at": prescription.created_at.isoformat()
    }


@router.get("/")
async def list_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all prescriptions for current user."""
    prescriptions = db.execute(
        select(Prescription).where(Prescription.user_id == current_user.id)
        .order_by(Prescription.created_at.desc())
    ).scalars().all()
    
    return [
        {
            "id": p.id,
            "diagnosis_id": p.diagnosis_id,
            "severity": p.severity,
            "medications": p.medications,
            "lifestyle_recommendations": p.lifestyle_recommendations,
            "follow_up_instructions": p.follow_up_instructions,
            "reasoning": p.reasoning,
            "status": p.status,
            "created_at": p.created_at.isoformat()
        }
        for p in prescriptions
    ]


@router.post("/translate")
async def translate_prescription(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Translate prescription to English or Telugu.
    """
    prescription = db.execute(
        select(Prescription).where(
            Prescription.id == request.prescription_id,
            Prescription.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    translator = get_translator()
    
    translated = translator.translate_prescription(
        medications=prescription.medications,
        recommendations=prescription.lifestyle_recommendations,
        instructions=prescription.follow_up_instructions,
        target_language=request.target_language
    )
    
    return {
        "prescription_id": request.prescription_id,
        "original_language": "en" if request.target_language == "te" else "te",
        "target_language": request.target_language,
        "translated_content": translated,
        "translated_at": datetime.now().isoformat()
    }

