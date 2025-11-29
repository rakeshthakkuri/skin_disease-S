"""
Diagnosis API - Image upload and acne severity classification
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
import uuid
import json
from datetime import datetime

from app.ml.acne_classifier import AcneClassifier
from app.ml.multimodal_fusion import MultimodalFusion
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import User, Diagnosis as DiagnosisModel

router = APIRouter()

# Initialize ML models (lazy loading)
_classifier = None
_fusion = None


def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = AcneClassifier()
    return _classifier


def get_fusion():
    global _fusion
    if _fusion is None:
        _fusion = MultimodalFusion()
    return _fusion


class ClinicalMetadata(BaseModel):
    age: int
    skin_type: str = "normal"
    acne_duration_months: int = 6
    previous_treatments: Optional[List[str]] = None
    allergies: Optional[List[str]] = None


class DiagnosisResponse(BaseModel):
    id: str
    severity: str
    confidence: float
    severity_scores: Dict[str, float]
    lesion_counts: Dict[str, int]
    affected_areas: List[str]
    clinical_notes: str
    recommended_urgency: str
    image_url: str
    created_at: str


@router.post("/analyze", response_model=DiagnosisResponse)
async def analyze_skin_image(
    image: UploadFile = File(..., description="Skin image for analysis"),
    clinical_metadata: str = Form(..., description="JSON string of clinical metadata"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze skin image for acne severity classification.
    
    Upload a skin image with clinical metadata to get AI-powered diagnosis.
    """
    # Parse metadata
    try:
        metadata = json.loads(clinical_metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid clinical metadata JSON")
    
    # Validate image
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image contents
    contents = await image.read()
    
    # Validate file size
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size of {max_size_mb}MB"
        )
    
    # Save image
    ext = image.filename.split(".")[-1] if image.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Get ML models
    classifier = get_classifier()
    
    # Check if using Keras model (predictions) or PyTorch (features)
    if classifier.use_keras:
        # For Keras: Get predictions directly from model (no fusion needed for pure model output)
        print("🔍 Using Keras model - getting direct predictions")
        model_predictions = classifier.extract_features(filepath)  # This returns predictions, not features
        classification = classifier.classify(model_predictions, image_path=filepath)
    else:
        # For PyTorch: Use multimodal fusion
        print("🔍 Using PyTorch model - using multimodal fusion")
        fusion = get_fusion()
        image_features = classifier.extract_features(filepath)
        fused_features = fusion.fuse(image_features, metadata)
        classification = classifier.classify(fused_features, image_path=filepath)
    
    # Detect lesions (pass severity to ensure consistency)
    lesion_counts = classifier.detect_lesions(filepath, classification["severity"])
    
    # Generate clinical notes
    clinical_notes = generate_clinical_notes(
        classification["severity"],
        lesion_counts,
        metadata
    )
    
    # Create diagnosis record
    diagnosis_id = str(uuid.uuid4())[:8]
    diagnosis = DiagnosisModel(
        id=diagnosis_id,
        user_id=current_user.id,
        severity=classification["severity"],
        confidence=int(classification["confidence"] * 100),
        severity_scores=classification["all_scores"],
        lesion_counts=lesion_counts,
        affected_areas=classification.get("affected_areas", ["face"]),
        clinical_notes=clinical_notes,
        recommended_urgency=get_urgency(classification["severity"]),
        image_url=f"/uploads/{filename}",
        clinical_metadata=metadata,
    )
    
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)
    
    return DiagnosisResponse(
        id=diagnosis.id,
        severity=diagnosis.severity,
        confidence=diagnosis.confidence / 100.0,
        severity_scores=diagnosis.severity_scores,
        lesion_counts=diagnosis.lesion_counts,
        affected_areas=diagnosis.affected_areas,
        clinical_notes=diagnosis.clinical_notes,
        recommended_urgency=diagnosis.recommended_urgency,
        image_url=diagnosis.image_url,
        created_at=diagnosis.created_at.isoformat()
    )


@router.get("/{diagnosis_id}")
async def get_diagnosis(
    diagnosis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get diagnosis by ID (user-specific)."""
    diagnosis = db.execute(
        select(DiagnosisModel).where(
            DiagnosisModel.id == diagnosis_id,
            DiagnosisModel.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    return {
        "id": diagnosis.id,
        "severity": diagnosis.severity,
        "confidence": diagnosis.confidence / 100.0,
        "severity_scores": diagnosis.severity_scores,
        "lesion_counts": diagnosis.lesion_counts,
        "affected_areas": diagnosis.affected_areas,
        "clinical_notes": diagnosis.clinical_notes,
        "recommended_urgency": diagnosis.recommended_urgency,
        "image_url": diagnosis.image_url,
        "created_at": diagnosis.created_at.isoformat(),
        "metadata": diagnosis.clinical_metadata
    }


@router.get("/")
async def list_diagnoses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all diagnoses for current user."""
    diagnoses = db.execute(
        select(DiagnosisModel).where(DiagnosisModel.user_id == current_user.id)
        .order_by(DiagnosisModel.created_at.desc())
    ).scalars().all()
    
    return [
        {
            "id": d.id,
            "severity": d.severity,
            "confidence": d.confidence / 100.0,
            "severity_scores": d.severity_scores,
            "lesion_counts": d.lesion_counts,
            "affected_areas": d.affected_areas,
            "clinical_notes": d.clinical_notes,
            "recommended_urgency": d.recommended_urgency,
            "image_url": d.image_url,
            "created_at": d.created_at.isoformat(),
            "metadata": d.clinical_metadata
        }
        for d in diagnoses
    ]


def generate_clinical_notes(severity: str, lesion_counts: dict, metadata: dict) -> str:
    """Generate clinical notes based on analysis."""
    notes = []
    
    total = sum(lesion_counts.values())
    
    # Generate severity-specific notes that are consistent with lesion counts
    if severity == "clear":
        if total == 0:
            notes.append("No significant acne lesions detected.")
        else:
            notes.append("Minimal acne lesions detected. Skin appears relatively clear.")
    elif severity == "mild":
        notes.append(f"Mild acne detected with {total} total lesions (primarily comedones and papules).")
    elif severity == "moderate":
        notes.append(f"Moderate acne with {total} total lesions including papules and pustules.")
    elif severity == "severe":
        notes.append(f"Severe acne with {total} total lesions including numerous pustules and nodules.")
    elif severity == "very_severe":
        notes.append(f"Very severe cystic acne with {total} total lesions including nodules and cysts. Requires aggressive treatment.")
    else:
        notes.append(f"Acne severity: {severity}. Total lesions detected: {total}.")
    
    # Add specific lesion breakdown if there are lesions
    if total > 0:
        lesion_details = []
        if lesion_counts.get("nodules", 0) > 0 or lesion_counts.get("cysts", 0) > 0:
            lesion_details.append("nodular/cystic lesions present")
        if lesion_counts.get("pustules", 0) > 5:
            lesion_details.append("multiple inflammatory pustules")
        if lesion_details:
            notes.append("Note: " + ", ".join(lesion_details) + ".")
    
    # Add duration note if chronic
    if metadata.get("acne_duration_months", 0) > 12:
        notes.append("Chronic acne (>12 months) - consider comprehensive treatment plan.")
    
    return " ".join(notes)


def get_urgency(severity: str) -> str:
    """Determine urgency based on severity."""
    urgency_map = {
        "clear": "routine",
        "mild": "routine", 
        "moderate": "soon",
        "severe": "soon",
        "very_severe": "urgent"
    }
    return urgency_map.get(severity, "routine")

