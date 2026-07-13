"""
init_db.py — Standalone database initializer for MedCare.

Run this script to:
  • Create all tables
  • Seed all demo patients, cases, care plans
  • Create all demo user accounts

Safe to run multiple times — fully idempotent.

Usage:
    cd backend
    source venv/bin/activate   (Linux/Mac)
    python init_db.py

    # OR to wipe and start fresh:
    python init_db.py --reset
"""
import sys
import os
import uuid
from datetime import datetime

# Allow running from any directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models import (
    Base, engine, SessionLocal,
    Patient, Case, CarePlan, User, PatientGamification
)
from knowledge_base import SAMPLE_PATIENTS, SAMPLE_DISCHARGE_TEXTS
from nlp_service import extract_entities
from rule_engine import run_rule_engine
from care_plan_generator import generate_care_plan


def reset_db():
    """Drop all tables and recreate them — WIPES ALL DATA."""
    print("⚠️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped.")


def init_db():
    """Create tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created (or already exist).")


def seed_patients(db):
    """Idempotent — seeds only missing patients."""
    created = {}
    for sp in SAMPLE_PATIENTS:
        existing = db.query(Patient).filter(Patient.id == sp["id"]).first()
        if existing:
            created[sp["id"]] = existing
            print(f"  [skip] Patient {sp['id']} ({sp['name']}) already exists.")
            continue
        p = Patient(
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
        db.add(p)
        created[sp["id"]] = p
        print(f"  [+] Patient {sp['id']} — {sp['name']}")
    db.commit()
    return created


def seed_cases_and_plans(db, created_patients):
    """Idempotent — seeds only missing cases/plans."""
    case_configs = [
        ("P001", "review_required"),
        ("P002", "approved"),
        ("P003", "review_required"),
    ]

    for patient_id, target_status in case_configs:
        patient_obj = created_patients.get(patient_id)
        if not patient_obj:
            print(f"  [skip] Patient {patient_id} not found — skipping case.")
            continue

        existing_case = db.query(Case).filter(Case.patient_id == patient_id).first()
        if existing_case and existing_case.care_plan:
            print(f"  [skip] Case + care plan already exist for patient {patient_id}.")
            continue

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
            print(f"  [~] Using existing case {case_obj.id} for patient {patient_id}.")
        else:
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
            print(f"  [+] Case {case_id} for patient {patient_id} (status: {status})")

        if not db.query(CarePlan).filter(CarePlan.case_id == case_obj.id).first():
            cp = CarePlan(
                id=f"CP-{str(uuid.uuid4())[:8].upper()}",
                case_id=case_obj.id,
                plan_data=plan_data,
                approved=(status == "approved"),
                approved_by="Dr. System (Auto-seeded)" if status == "approved" else None,
                approved_at=datetime.utcnow() if status == "approved" else None,
            )
            db.add(cp)
            print(f"  [+] Care plan for case {case_obj.id}")

    db.commit()


def seed_users(db):
    """Idempotent — seeds only missing demo user accounts."""
    # Doctor
    if not db.query(User).filter(User.id == "U-DOCTOR").first():
        db.add(User(
            id="U-DOCTOR",
            username="doctor",
            email="doctor@medcare.com",
            password="doctor123",
            role="doctor",
            patient_id=None,
        ))
        print("  [+] Doctor  → username: doctor   | password: doctor123")
    else:
        print("  [skip] Doctor account already exists.")

    db.commit()

    # Patient accounts
    accounts = {
        "P001": ("U-P001", "ramesh", "ramesh@gmail.com",  "patient123"),
        "P002": ("U-P002", "priya",  "priya@gmail.com",   "patient123"),
        "P003": ("U-P003", "arjun",  "arjun@gmail.com",   "patient123"),
    }

    for patient_id, (user_id, username, email, password) in accounts.items():
        if not db.query(Patient).filter(Patient.id == patient_id).first():
            print(f"  [skip] Patient {patient_id} missing — skipping user {username}.")
            continue
        if db.query(User).filter(User.id == user_id).first():
            print(f"  [skip] User {username} already exists.")
            continue
        db.add(User(
            id=user_id,
            username=username,
            email=email,
            password=password,
            role="patient",
            patient_id=patient_id,
        ))
        print(f"  [+] Patient → username: {username:<8} | password: {password}")

    db.commit()


def main():
    do_reset = "--reset" in sys.argv

    print("\n" + "="*55)
    print("  MedCare Database Initializer")
    print("="*55)

    if do_reset:
        print("\n⚠️  --reset flag detected. Wiping database...")
        reset_db()

    print("\n[1] Initializing tables...")
    init_db()

    db = SessionLocal()
    try:
        print("\n[2] Seeding patients...")
        created_patients = seed_patients(db)

        print("\n[3] Seeding cases & care plans...")
        seed_cases_and_plans(db, created_patients)

        print("\n[4] Seeding user accounts...")
        seed_users(db)

    finally:
        db.close()

    print("\n" + "="*55)
    print("  ✅ Database initialization complete!")
    print("="*55)
    print("\n📋 Demo Login Credentials:")
    print("  Role    │ Username │ Password")
    print("  ────────┼──────────┼──────────")
    print("  Doctor  │ doctor   │ doctor123")
    print("  Patient │ ramesh   │ patient123")
    print("  Patient │ priya    │ patient123")
    print("  Patient │ arjun    │ patient123")
    print()


if __name__ == "__main__":
    main()
