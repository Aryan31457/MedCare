"""
SQLAlchemy ORM models + Pydantic schemas for MedCare prototype.
Uses SQLite for simplicity in the prototype.
"""
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.types import JSON
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./medcare.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────
# SQLAlchemy ORM Models
# ─────────────────────────────────────────────

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=True)
    blood_group = Column(String, nullable=True)
    allergies = Column(JSON, default=[])
    contact = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    cases = relationship("Case", back_populates="patient")

class Case(Base):
    __tablename__ = "cases"
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    discharge_text = Column(Text, nullable=True)
    status = Column(String, default="uploaded")
    # uploaded → processing → review_required | ready → approved
    extracted_entities = Column(JSON, nullable=True)
    resolved_rules = Column(JSON, nullable=True)
    human_review_flags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    patient = relationship("Patient", back_populates="cases")
    care_plan = relationship("CarePlan", back_populates="case", uselist=False)

class CarePlan(Base):
    __tablename__ = "care_plans"
    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    plan_data = Column(JSON, nullable=False)
    approved = Column(Boolean, default=False)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case", back_populates="care_plan")

# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    weight_kg: Optional[float] = None
    blood_group: Optional[str] = None
    allergies: List[str] = []
    contact: Optional[str] = None
    address: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    name: str
    age: int
    sex: str
    weight_kg: Optional[float]
    blood_group: Optional[str]
    allergies: List[str]
    contact: Optional[str]
    address: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    patient_id: str
    discharge_text: str

class CaseSummary(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    human_review_flags: List[Dict] = []
    flag_count: int = 0
    has_care_plan: bool = False
    primary_diagnoses: List[str] = []

class CaseDetail(BaseModel):
    id: str
    patient_id: str
    patient: Optional[PatientOut] = None
    discharge_text: Optional[str] = None
    status: str
    extracted_entities: Optional[Dict] = None
    resolved_rules: Optional[Dict] = None
    human_review_flags: List[Dict] = []
    created_at: datetime
    processed_at: Optional[datetime] = None
    has_care_plan: bool = False

class CarePlanOut(BaseModel):
    id: str
    case_id: str
    plan_data: Dict
    approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    generated_at: datetime
    class Config:
        from_attributes = True

class ApproveRequest(BaseModel):
    approved_by: str
    notes: Optional[str] = None

class StatsOut(BaseModel):
    total_cases: int
    uploaded: int
    processing: int
    review_required: int
    ready: int
    approved: int
    total_patients: int
    flags_pending: int
