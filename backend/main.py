"""
FastAPI Main — All API routes + startup data seeding.
Runs on http://localhost:8000
"""
import os
from dotenv import load_dotenv
load_dotenv()  # Load GEMINI_API_KEY from backend/.env

from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import uuid

from models import (
    Base, engine, get_db,
    Patient, Case, CarePlan, User, PatientGamification,
    PatientCreate, PatientOut, CaseCreate,
    CaseSummary, CaseDetail, CarePlanOut, ApproveRequest, StatsOut,
    LoginRequest, UserOut, RegisterRequest, PatientListOut, GamificationState, GamificationSave
)
from knowledge_base import SAMPLE_PATIENTS, SAMPLE_DISCHARGE_TEXTS, DISEASE_KG
from nlp_service import extract_entities
from rule_engine import run_rule_engine
from care_plan_generator import generate_care_plan
from gemini_service import generate_care_plan_gemini

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────

app = FastAPI(
    title="MedCare — Automatic Discharge Care Plan System",
    description="Prototype API for generating personalized post-discharge care plans",
    version="1.0.0-prototype",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://medcare-lvto.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Startup — Create tables + seed sample data
# ─────────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        _seed_sample_data(db)
        _seed_users(db)
    except Exception as e:
        print(f"[SEED] ⚠️  Seeding error (non-fatal): {e}")
    finally:
        db.close()


def _seed_sample_data(db: Session):
    """Idempotent — seeds only what is missing. Safe to call multiple times."""
    created_patients = {}

    # ── Ensure all 3 sample patients exist ──────────────────────────────────
    for sp in SAMPLE_PATIENTS:
        existing = db.query(Patient).filter(Patient.id == sp["id"]).first()
        if existing:
            created_patients[sp["id"]] = existing
            continue
        print(f"[SEED] Creating patient {sp['id']} — {sp['name']}")
        patient = Patient(
            id=sp["id"],
            name=sp["name"],
            age=sp["age"],
            sex=sp["sex"],
            weight_kg=sp["weight_kg"],
            blood_group=sp["blood_group"],
            allergies=sp["allergies"],
            contact=sp["contact"],
            address=sp["address"],
        )
        db.add(patient)
        created_patients[sp["id"]] = patient

    db.commit()

    # ── Ensure each patient has a processed case + care plan ─────────────────
    case_configs = [
        ("P001", "review_required"),   # Ramesh — complex, needs review
        ("P002", "approved"),           # Priya — simple, auto-approved
        ("P003", "review_required"),    # Arjun — most complex, review required
    ]

    for patient_id, target_status in case_configs:
        # Check if this patient already has a case with a care plan
        existing_case = (
            db.query(Case)
            .filter(Case.patient_id == patient_id)
            .first()
        )
        if existing_case and existing_case.care_plan:
            continue  # Already fully seeded

        patient_obj = created_patients[patient_id]
        discharge_text = SAMPLE_DISCHARGE_TEXTS.get(patient_id, "")
        patient_dict = {
            "id": patient_id,
            "name": patient_obj.name,
            "age": patient_obj.age,
            "sex": patient_obj.sex,
            "weight_kg": patient_obj.weight_kg,
            "allergies": patient_obj.allergies or [],
        }

        entities  = extract_entities(discharge_text)
        rules     = run_rule_engine(patient_dict, entities)
        plan_data = generate_care_plan(patient_dict, entities, rules)

        has_critical = any(f.get("severity") == "critical" for f in rules.get("flags", []))
        status = target_status
        if target_status == "review_required" and not has_critical:
            status = "ready"

        if existing_case:
            case_obj = existing_case
        else:
            print(f"[SEED] Creating case for patient {patient_id}")
            case_id  = f"C{patient_id[1:]}-{str(uuid.uuid4())[:6].upper()}"
            case_obj = Case(
                id=case_id,
                patient_id=patient_id,
                discharge_text=discharge_text,
                status=status,
                extracted_entities=entities,
                resolved_rules=rules,
                human_review_flags=rules.get("flags", []),
                processed_at=datetime.utcnow(),
            )
            db.add(case_obj)
            db.flush()

        # Ensure care plan exists for this case
        if not db.query(CarePlan).filter(CarePlan.case_id == case_obj.id).first():
            print(f"[SEED] Creating care plan for case {case_obj.id}")
            cp = CarePlan(
                id=f"CP-{str(uuid.uuid4())[:8].upper()}",
                case_id=case_obj.id,
                plan_data=plan_data,
                approved=(status == "approved"),
                approved_by="Dr. System (Auto-seeded)" if status == "approved" else None,
                approved_at=datetime.utcnow() if status == "approved" else None,
            )
            db.add(cp)

    db.commit()
    print("[SEED] ✅ Sample data seeding complete.")


def _seed_users(db: Session):
    """Idempotent — ensures all demo accounts exist. Safe to call multiple times."""

    # ── Doctor account ────────────────────────────────────────────────────────
    if not db.query(User).filter(User.id == "U-DOCTOR").first():
        print("[SEED] Creating doctor user — doctor / doctor123")
        db.add(User(
            id="U-DOCTOR",
            username="doctor",
            email="doctor@medcare.com",
            password="doctor123",
            role="doctor",
            patient_id=None,
        ))
        db.commit()

    # ── Patient accounts (one per seeded patient) ─────────────────────────────
    PATIENT_ACCOUNTS = {
        "P001": ("ramesh",  "ramesh@gmail.com",  "patient123"),
        "P002": ("priya",   "priya@gmail.com",   "patient123"),
        "P003": ("arjun",   "arjun@gmail.com",   "patient123"),
    }

    for patient_id, (username, email, password) in PATIENT_ACCOUNTS.items():
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            continue  # Patient not yet seeded — skip
        if db.query(User).filter(User.id == f"U-{patient_id}").first():
            continue  # Already exists

        print(f"[SEED] Creating patient user — {username} / {password}")
        db.add(User(
            id=f"U-{patient_id}",
            username=username,
            email=email,
            password=password,
            role="patient",
            patient_id=patient_id,
        ))

    db.commit()
    print("[SEED] ✅ User seeding complete.")
    print("[SEED] 📋 Demo credentials:")
    print("[SEED]   Doctor  → username: doctor   password: doctor123")
    print("[SEED]   Patient → username: ramesh   password: patient123")
    print("[SEED]   Patient → username: priya    password: patient123")
    print("[SEED]   Patient → username: arjun    password: patient123")




# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def _case_to_summary(case: Case) -> dict:
    patient = case.patient
    entities = case.extracted_entities or {}
    diseases = entities.get("diseases", [])
    return {
        "id": case.id,
        "patient_id": case.patient_id,
        "patient_name": patient.name if patient else None,
        "patient_age": patient.age if patient else None,
        "status": case.status,
        "created_at": case.created_at,
        "processed_at": case.processed_at,
        "human_review_flags": case.human_review_flags or [],
        "flag_count": len(case.human_review_flags or []),
        "has_care_plan": case.care_plan is not None,
        "primary_diagnoses": [d.get("name", d.get("code", "")) for d in diseases[:3]],
    }


# ─────────────────────────────────────────────
# Patient Routes
# ─────────────────────────────────────────────

@app.get("/api/patients", response_model=list[PatientOut], tags=["Patients"])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).order_by(Patient.created_at.desc()).all()


@app.post("/api/patients", response_model=PatientOut, status_code=201, tags=["Patients"])
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(
        id=f"P-{str(uuid.uuid4())[:8].upper()}",
        **data.model_dump(),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/api/patients/{patient_id}", response_model=PatientOut, tags=["Patients"])
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    return p


# ─────────────────────────────────────────────
# Case Routes
# ─────────────────────────────────────────────

@app.get("/api/cases", tags=["Cases"])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return [_case_to_summary(c) for c in cases]


@app.post("/api/cases", status_code=201, tags=["Cases"])
def create_case(data: CaseCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    case = Case(
        id=f"C-{str(uuid.uuid4())[:8].upper()}",
        patient_id=data.patient_id,
        discharge_text=data.discharge_text,
        status="uploaded",
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return _case_to_summary(case)


@app.get("/api/cases/{case_id}", tags=["Cases"])
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    p = case.patient
    patient_out = {
        "id": p.id, "name": p.name, "age": p.age, "sex": p.sex,
        "weight_kg": p.weight_kg, "blood_group": p.blood_group,
        "allergies": p.allergies or [], "contact": p.contact,
        "address": p.address, "created_at": p.created_at,
    } if p else None
    return {
        "id": case.id,
        "patient_id": case.patient_id,
        "patient": patient_out,
        "discharge_text": case.discharge_text,
        "status": case.status,
        "extracted_entities": case.extracted_entities,
        "resolved_rules": case.resolved_rules,
        "human_review_flags": case.human_review_flags or [],
        "created_at": case.created_at,
        "processed_at": case.processed_at,
        "has_care_plan": case.care_plan is not None,
    }


@app.post("/api/cases/{case_id}/process", tags=["Cases"])
def process_case(case_id: str, db: Session = Depends(get_db)):
    """Run NLP entity extraction + rule engine on the discharge text."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if not case.discharge_text:
        raise HTTPException(400, "No discharge text to process")

    patient = case.patient
    if not patient:
        raise HTTPException(400, "Patient not found for this case")

    patient_dict = {
        "id": patient.id, "name": patient.name,
        "age": patient.age, "sex": patient.sex,
        "weight_kg": patient.weight_kg,
        "allergies": patient.allergies or [],
    }

    # NLP
    entities = extract_entities(case.discharge_text)
    # Rule Engine
    rules = run_rule_engine(patient_dict, entities)

    has_critical = any(f.get("severity") in ("critical", "high") for f in rules.get("flags", []))
    status = "review_required" if has_critical else "ready"

    case.extracted_entities = entities
    case.resolved_rules = rules
    case.human_review_flags = rules.get("flags", [])
    case.status = status
    case.processed_at = datetime.utcnow()
    db.commit()
    db.refresh(case)

    return {
        "message": f"Processing complete. Status: {status}",
        "status": status,
        "entities_extracted": {
            "diseases": len(entities.get("diseases", [])),
            "drugs": len(entities.get("drugs", [])),
            "lab_values": len(entities.get("lab_values", [])),
            "allergies": len(entities.get("allergies", [])),
        },
        "flags_raised": len(rules.get("flags", [])),
        "extracted_entities": entities,
        "resolved_rules": rules,
    }


@app.post("/api/cases/{case_id}/generate", tags=["Cases"])
def generate_plan(case_id: str, db: Session = Depends(get_db)):
    """Generate the full care plan from resolved rules."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if not case.extracted_entities or not case.resolved_rules:
        raise HTTPException(400, "Case must be processed first (run /process)")

    patient = case.patient
    patient_dict = {
        "id": patient.id, "name": patient.name, "age": patient.age,
        "sex": patient.sex, "weight_kg": patient.weight_kg,
        "allergies": patient.allergies or [],
    }

    plan_data = generate_care_plan(patient_dict, case.extracted_entities, case.resolved_rules)

    # Delete existing plan if regenerating
    existing = db.query(CarePlan).filter(CarePlan.case_id == case_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    cp = CarePlan(
        id=f"CP-{str(uuid.uuid4())[:8].upper()}",
        case_id=case_id,
        plan_data=plan_data,
        approved=False,
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)

    return {
        "message": "Care plan generated successfully",
        "care_plan_id": cp.id,
        "requires_review": plan_data.get("requires_human_review", False),
        "confidence_score": plan_data.get("confidence_score", 0.0),
        "plan_data": plan_data,
    }


@app.post("/api/cases/{case_id}/generate-gemini", tags=["Cases"])
def generate_plan_gemini(case_id: str, db: Session = Depends(get_db)):
    """
    Generate care plan using Gemini AI with automatic NLP fallback.
    - Tries Gemini first (if API key is set and call succeeds with valid JSON).
    - Falls back to NLP + Rule Engine silently on ANY failure:
        quota exceeded, rate limit, bad JSON, network error, missing key, etc.
    Always returns a care plan — never fails.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    if not case.discharge_text:
        raise HTTPException(400, "No discharge text found for this case")

    patient = case.patient
    if not patient:
        raise HTTPException(400, "Patient not found for this case")

    patient_dict = {
        "id": patient.id, "name": patient.name, "age": patient.age,
        "sex": patient.sex, "weight_kg": patient.weight_kg,
        "allergies": patient.allergies or [],
    }

    # ── Attempt 1: Gemini AI ──────────────────────────────────────────────────
    plan_data         = None
    generation_method = "nlp"     # default; overwritten on Gemini success
    fallback_reason   = None

    api_key = os.environ.get("GEMINI_API_KEY", "")
    gemini_enabled = bool(api_key and api_key != "your_gemini_api_key_here")

    if gemini_enabled:
        try:
            plan_data = generate_care_plan_gemini(patient_dict, case.discharge_text)
            generation_method = "gemini"
            print(f"[GEMINI] ✅ Care plan generated via Gemini for case {case_id}")

        except ValueError as exc:
            fallback_reason = f"Gemini config error: {exc}"
            print(f"[GEMINI] ⚠️  Config error — falling back to NLP: {exc}")

        except RuntimeError as exc:
            is_limit = getattr(exc, "is_limit", False)
            tag = "Rate-limit/Quota" if is_limit else "Response error"
            fallback_reason = f"{tag}: {str(exc)[:200]}"
            print(f"[GEMINI] ⚠️  {tag} — falling back to NLP: {exc}")

        except Exception as exc:
            fallback_reason = f"Unexpected error: {str(exc)[:200]}"
            print(f"[GEMINI] ⚠️  Unexpected error — falling back to NLP: {exc}")
    else:
        fallback_reason = "GEMINI_API_KEY not configured"
        print(f"[GEMINI] ⚠️  API key not set — using NLP pipeline")

    # ── Attempt 2: NLP + Rule Engine fallback ─────────────────────────────────
    if plan_data is None:
        try:
            entities  = extract_entities(case.discharge_text)
            rules     = run_rule_engine(patient_dict, entities)
            plan_data = generate_care_plan(patient_dict, entities, rules)
            plan_data["generation_method"] = "nlp"

            # Persist NLP extracted data
            case.extracted_entities = entities
            case.resolved_rules     = rules
            case.human_review_flags = rules.get("flags", [])
            print(f"[NLP] ✅ Fallback NLP care plan generated for case {case_id}")

        except Exception as exc:
            print(f"[NLP] ❌ NLP fallback also failed: {exc}")
            raise HTTPException(500, f"Both Gemini and NLP generation failed: {exc}")

    # ── Persist case status ───────────────────────────────────────────────────
    if not case.extracted_entities:
        case.extracted_entities = {
            "source": generation_method, "disease_codes": [],
            "drugs": [], "drug_codes": [], "lab_values": [], "allergies": []
        }
    if not case.resolved_rules:
        case.resolved_rules = {
            "source": generation_method,
            "flags": plan_data.get("human_review_flags", []),
            "conflicts": [], "allergy_alerts": []
        }

    has_critical = any(
        f.get("severity") in ("critical", "high")
        for f in plan_data.get("human_review_flags", [])
    )
    case.status             = "review_required" if has_critical else "ready"
    case.human_review_flags = plan_data.get("human_review_flags", [])
    case.processed_at       = datetime.utcnow()

    # ── Save Care Plan ────────────────────────────────────────────────────────
    existing = db.query(CarePlan).filter(CarePlan.case_id == case_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    cp = CarePlan(
        id=f"CP-{str(uuid.uuid4())[:8].upper()}",
        case_id=case_id,
        plan_data=plan_data,
        approved=False,
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)

    label = "Gemini AI ✨" if generation_method == "gemini" else "NLP Engine 🔬"
    return {
        "message":           f"Care plan generated via {label}"
                             + (f" (Gemini fell back: {fallback_reason})" if fallback_reason else ""),
        "care_plan_id":      cp.id,
        "requires_review":   plan_data.get("requires_human_review", False),
        "confidence_score":  plan_data.get("confidence_score", 0.0),
        "generation_method": generation_method,
        "gemini_attempted":  gemini_enabled,
        "fallback_used":     fallback_reason is not None,
        "fallback_reason":   fallback_reason,
        "plan_data":         plan_data,
    }


@app.get("/api/gemini-status", tags=["Config"])
def gemini_status():
    """Check if Gemini API key is configured."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    configured = bool(api_key and api_key != "your_gemini_api_key_here")
    return {"gemini_configured": configured}



@app.get("/api/cases/{case_id}/plan", tags=["Cases"])
def get_care_plan(case_id: str, db: Session = Depends(get_db)):
    cp = db.query(CarePlan).filter(CarePlan.case_id == case_id).first()
    if not cp:
        raise HTTPException(404, "Care plan not found. Run /generate first.")
    return {
        "id": cp.id,
        "case_id": cp.case_id,
        "plan_data": cp.plan_data,
        "approved": cp.approved,
        "approved_by": cp.approved_by,
        "approved_at": cp.approved_at,
        "generated_at": cp.generated_at,
    }


@app.put("/api/cases/{case_id}/approve", tags=["Cases"])
def approve_plan(case_id: str, body: ApproveRequest, db: Session = Depends(get_db)):
    cp = db.query(CarePlan).filter(CarePlan.case_id == case_id).first()
    if not cp:
        raise HTTPException(404, "Care plan not found")
    case = db.query(Case).filter(Case.id == case_id).first()

    cp.approved = True
    cp.approved_by = body.approved_by
    cp.approved_at = datetime.utcnow()
    case.status = "approved"
    db.commit()

    return {
        "message": f"Care plan approved by {body.approved_by}",
        "approved_at": cp.approved_at,
        "notes": body.notes,
    }


# ─────────────────────────────────────────────
# Review Queue
# ─────────────────────────────────────────────

@app.get("/api/review", tags=["Review"])
def get_review_queue(db: Session = Depends(get_db)):
    cases = db.query(Case).filter(Case.status == "review_required").order_by(Case.processed_at.desc()).all()
    result = []
    for case in cases:
        flags = case.human_review_flags or []
        critical = [f for f in flags if f.get("severity") == "critical"]
        high = [f for f in flags if f.get("severity") == "high"]
        result.append({
            **_case_to_summary(case),
            "critical_flag_count": len(critical),
            "high_flag_count": len(high),
            "all_flags": flags,
        })
    return result


# ─────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────

@app.get("/api/stats", response_model=StatsOut, tags=["Dashboard"])
def get_stats(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    status_counts = {}
    for c in cases:
        status_counts[c.status] = status_counts.get(c.status, 0) + 1

    all_flags = []
    for c in cases:
        if c.status == "review_required":
            all_flags.extend(c.human_review_flags or [])

    return StatsOut(
        total_cases=len(cases),
        uploaded=status_counts.get("uploaded", 0),
        processing=status_counts.get("processing", 0),
        review_required=status_counts.get("review_required", 0),
        ready=status_counts.get("ready", 0),
        approved=status_counts.get("approved", 0),
        total_patients=db.query(Patient).count(),
        flags_pending=len(all_flags),
    )


@app.post("/api/auth/login", response_model=UserOut, tags=["Authentication"])
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == data.username_or_email) | (User.email == data.username_or_email)
    ).first()
    
    if not user or user.password != data.password:
        raise HTTPException(status_code=400, detail="Invalid username/email or password.")
        
    return user


@app.post("/api/auth/register", response_model=UserOut, status_code=201, tags=["Authentication"])
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or Email already registered.")
        
    patient_id = None
    if data.role == "patient":
        if not data.name:
            raise HTTPException(status_code=400, detail="Name is required for registering a patient.")
        patient = Patient(
            id=f"P-{str(uuid.uuid4())[:8].upper()}",
            name=data.name,
            age=data.age or 0,
            sex=data.sex or "Male",
            allergies=[]
        )
        db.add(patient)
        db.flush()
        patient_id = patient.id

    user = User(
        id=f"U-{str(uuid.uuid4())[:8].upper()}",
        username=data.username,
        email=data.email,
        password=data.password,
        role=data.role,
        patient_id=patient_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user



# ─────────────────────────────────────────────
# Knowledge Base Endpoints
# ─────────────────────────────────────────────

@app.get("/api/kb/diseases", tags=["Knowledge Base"])
def list_diseases():
    return [{"code": k, "name": v.get("name"), "icd10": v.get("icd10"), "category": v.get("category")} for k, v in DISEASE_KG.items()]


@app.get("/api/kb/diseases/{code}", tags=["Knowledge Base"])
def get_disease(code: str):
    info = DISEASE_KG.get(code.upper())
    if not info:
        raise HTTPException(404, "Disease not found")
    return {"code": code.upper(), **info}


# ─────────────────────────────────────────────
# Patient Companion Endpoints
# ─────────────────────────────────────────────

@app.get("/api/patients/all", response_model=list[PatientListOut], tags=["Patient Companion"])
def list_patients_all(db: Session = Depends(get_db)):
    """List all registered patients for selection in the patient view."""
    return db.query(Patient).order_by(Patient.name).all()

@app.get("/api/patients/{patient_id}/plan", tags=["Patient Companion"])
def get_patient_plan(patient_id: str, db: Session = Depends(get_db)):
    """Retrieve the latest approved care plan for the patient recovery portal."""
    case = (
        db.query(Case)
        .filter(Case.patient_id == patient_id)
        .order_by(desc(Case.created_at))
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="No hospital discharge records found for this patient.")
    
    if not case.care_plan:
        raise HTTPException(
            status_code=404,
            detail="Your care plan is currently being generated by the clinical system. Please check back shortly!"
        )
    
    cp = case.care_plan
    pat = case.patient
        
    return {
        "case_id": case.id,
        "patient_id": case.patient_id,
        "patient_name": pat.name if pat else None,
        "patient_age": pat.age if pat else None,
        "patient_sex": pat.sex if pat else None,
        "patient_weight": pat.weight_kg if pat else None,
        "allergies": pat.allergies or [],
        "plan_data": cp.plan_data,
        "approved": cp.approved,
        "approved_by": cp.approved_by,
        "approved_at": cp.approved_at,
        "generated_at": cp.generated_at,
    }

@app.get("/api/patients/{patient_id}/gamification", response_model=GamificationState, tags=["Patient Companion"])
def get_gamification(patient_id: str, db: Session = Depends(get_db)):
    """Retrieve or initialize the patient's recovery gamification state."""
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    state = db.query(PatientGamification).filter(PatientGamification.patient_id == patient_id).first()
    if not state:
        state = PatientGamification(
            patient_id=patient_id,
            xp=0,
            level=1,
            streak=0,
            longest_streak=0,
            last_active_date=None,
            badges=[],
            task_log={},
            vital_log=[]
        )
        db.add(state)
        db.commit()
        db.refresh(state)
        
    return state

@app.post("/api/patients/{patient_id}/gamification", response_model=GamificationState, tags=["Patient Companion"])
def save_gamification(patient_id: str, data: GamificationSave, db: Session = Depends(get_db)):
    """Save the updated recovery checklist and gamification state."""
    state = db.query(PatientGamification).filter(PatientGamification.patient_id == patient_id).first()
    if not state:
        state = PatientGamification(patient_id=patient_id)
        db.add(state)
        
    state.xp = data.xp
    state.level = data.level
    state.streak = data.streak
    state.longest_streak = data.longest_streak
    state.last_active_date = data.last_active_date
    state.badges = data.badges
    state.task_log = data.task_log
    state.vital_log = data.vital_log
    
    db.commit()
    db.refresh(state)
    return state


# Serve static files from frontend/dist in production
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

    @app.get("/{catchall:path}", include_in_schema=False)
    def serve_spa(catchall: str):
        if catchall.startswith("api") or catchall.startswith("docs") or catchall.startswith("redoc") or catchall.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build missing index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
