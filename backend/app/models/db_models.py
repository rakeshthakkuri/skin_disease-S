"""
SQLAlchemy database models
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class User(Base):
    """User model for authentication and personalization."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    skin_type = Column(String(50), default="normal")
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    diagnoses = relationship("Diagnosis", back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")


class Diagnosis(Base):
    """Diagnosis model for storing skin analysis results."""
    
    __tablename__ = "diagnoses"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    severity = Column(String(50), nullable=False)
    confidence = Column(Integer, nullable=False)
    severity_scores = Column(JSON, nullable=False)
    lesion_counts = Column(JSON, nullable=False)
    affected_areas = Column(JSON, default=[])
    clinical_notes = Column(Text, nullable=False)
    recommended_urgency = Column(String(50), nullable=False)
    image_url = Column(String(500), nullable=False)
    clinical_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="diagnoses")
    prescriptions = relationship("Prescription", back_populates="diagnosis", cascade="all, delete-orphan")


class Prescription(Base):
    """Prescription model for storing treatment recommendations."""
    
    __tablename__ = "prescriptions"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    diagnosis_id = Column(String(50), ForeignKey("diagnoses.id"), nullable=True)
    severity = Column(String(50), nullable=False)
    medications = Column(JSON, nullable=False)
    lifestyle_recommendations = Column(JSON, nullable=False)
    follow_up_instructions = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    status = Column(String(50), default="generated")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="prescriptions")
    diagnosis = relationship("Diagnosis", back_populates="prescriptions")
    reminders = relationship("Reminder", back_populates="prescription", cascade="all, delete-orphan")


class Reminder(Base):
    """Reminder model for medication reminders."""
    
    __tablename__ = "reminders"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    prescription_id = Column(String(50), ForeignKey("prescriptions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    message_telugu = Column(Text, nullable=True)
    frequency = Column(String(50), nullable=False)
    times = Column(JSON, nullable=False)
    status = Column(String(50), default="active")
    total_acknowledged = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    prescription = relationship("Prescription", back_populates="reminders")

