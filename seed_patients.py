import sys
import os
import uuid
from datetime import datetime

# Add the current directory to python path to import models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from models import SessionLocal, Base, engine, Patient, Case, CarePlan, User
from nlp_service import extract_entities
from rule_engine import run_rule_engine
from care_plan_generator import generate_care_plan

def seed():
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing data for a clean demo
        print("Clearing existing tables for a clean demonstration...")
        db.query(CarePlan).delete()
        db.query(Case).delete()
        db.query(Patient).delete()
        db.query(User).delete()
        db.commit()
        
        # Create Doctor User
        doctor_user = User(
            id="U-DOCTOR",
            username="doctor",
            email="doctor@medcare.com",
            password="doctor123",
            role="doctor",
            patient_id=None
        )
        db.add(doctor_user)
        db.commit()
        
        # 5 Realistic Patients with distinct diseases
        patients_data = [
            {
                "id": "P-DIABETES",
                "name": "David Miller",
                "age": 58,
                "sex": "Male",
                "weight_kg": 84.5,
                "blood_group": "A+",
                "allergies": ["Metformin"],
                "contact": "+1 (555) 019-2834",
                "address": "104 Maple Ave, Boston, MA",
                "discharge_text": "DISCHARGE SUMMARY\nPatient David Miller, 58-year-old male, admitted for uncontrolled Type 2 Diabetes Mellitus with hyperglycemia. HBA1c was found to be 9.2%. Patient has a known allergy to Metformin causing severe gastrointestinal distress.\nPlan: Initiate Glipizide 5mg daily. Monitor fasting blood glucose levels daily. Refer to diabetic educator. Avoid high glycemic foods."
            },
            {
                "id": "P-CARDIAC",
                "name": "Sarah Jenkins",
                "age": 67,
                "sex": "Female",
                "weight_kg": 68.2,
                "blood_group": "O+",
                "allergies": ["Aspirin"],
                "contact": "+1 (555) 021-9876",
                "address": "402 Spruce Ln, Chicago, IL",
                "discharge_text": "DISCHARGE SUMMARY\nPatient Sarah Jenkins, 67-year-old female, status post Coronary Artery Bypass Graft (CABG) x3. Patient has history of Coronary Artery Disease. Patient has known allergy to Aspirin (causes bronchospasm).\nPlan: Prescribe Clopidogrel 75mg daily as alternative antiplatelet. Initiate Metoprolol Succinate 25mg daily. Maintain low sodium diet. Check blood pressure daily."
            },
            {
                "id": "P-HYPERTENSION",
                "name": "James Cooper",
                "age": 45,
                "sex": "Male",
                "weight_kg": 91.0,
                "blood_group": "B-",
                "allergies": ["Lisinopril"],
                "contact": "+1 (555) 023-4567",
                "address": "78 Pine Rd, Austin, TX",
                "discharge_text": "DISCHARGE SUMMARY\nPatient James Cooper, 45-year-old male, admitted for hypertensive crisis. Blood pressure on admission was 190/110 mmHg. Known allergy to Lisinopril causing angioedema.\nPlan: Start Amlodipine 5mg daily. Daily blood pressure tracking required. Salt restriction to less than 2g daily. Walking exercise 30 minutes daily."
            },
            {
                "id": "P-ASTHMA",
                "name": "Emily Watson",
                "age": 29,
                "sex": "Female",
                "weight_kg": 55.4,
                "blood_group": "AB+",
                "allergies": [],
                "contact": "+1 (555) 025-8910",
                "address": "15 Cedar Dr, Seattle, WA",
                "discharge_text": "DISCHARGE SUMMARY\nPatient Emily Watson, 29-year-old female, admitted for acute asthma exacerbation triggered by seasonal allergies. Peak flow rate was decreased at 250 L/min.\nPlan: Continue Albuterol inhaler 2 puffs every 4-6 hours as needed. Start Budesonide/Formoterol (Symbicort) 2 puffs twice daily. Avoid outdoor pollen and triggers."
            },
            {
                "id": "P-GERD",
                "name": "Robert Chen",
                "age": 71,
                "sex": "Male",
                "weight_kg": 74.0,
                "blood_group": "A-",
                "allergies": ["Omeprazole"],
                "contact": "+1 (555) 027-3141",
                "address": "89 Birch Way, San Francisco, CA",
                "discharge_text": "DISCHARGE SUMMARY\nPatient Robert Chen, 71-year-old male, complaining of severe chest pain determined to be refractory GERD (Gastroesophageal Reflux Disease). Patient is allergic to Omeprazole (causes skin rash).\nPlan: Initiate Famotidine 20mg twice daily as alternative. Avoid acidic foods, chocolate, and caffeine. Do not lie down within 3 hours of eating. Elevate head of bed."
            }
        ]
        
        for idx, p_item in enumerate(patients_data):
            print(f"Seeding Patient {p_item['name']}...")
            
            # Create Patient
            patient = Patient(
                id=p_item["id"],
                name=p_item["name"],
                age=p_item["age"],
                sex=p_item["sex"],
                weight_kg=p_item["weight_kg"],
                blood_group=p_item["blood_group"],
                allergies=p_item["allergies"],
                contact=p_item["contact"],
                address=p_item["address"],
                created_at=datetime.utcnow()
            )
            db.add(patient)
            db.flush()
            
            # Create User for Patient
            patient_username = p_item["id"].split("-")[1].lower() # e.g. "diabetes"
            patient_user = User(
                id=f"U-{p_item['id'].split('-')[1]}",
                username=patient_username,
                email=f"{patient_username}@gmail.com",
                password="patient123",
                role="patient",
                patient_id=patient.id
            )
            db.add(patient_user)
            db.flush()
            
            # Create Case
            case_id = f"C-{p_item['id'].split('-')[1]}"
            print(f"  Creating Case {case_id}...")
            case = Case(
                id=case_id,
                patient_id=patient.id,
                discharge_text=p_item["discharge_text"],
                status="uploaded",
                created_at=datetime.utcnow()
            )
            db.add(case)
            db.flush()
            
            # Run NLP entity extraction
            print("  Running NLP Entity Extraction...")
            entities = extract_entities(case.discharge_text)
            
            # Run Rule Engine
            print("  Running Rule Engine...")
            patient_dict = {
                "id": patient.id,
                "name": patient.name,
                "age": patient.age,
                "sex": patient.sex,
                "weight_kg": patient.weight_kg,
                "allergies": patient.allergies or [],
            }
            rules = run_rule_engine(patient_dict, entities)
            
            has_critical = any(f.get("severity") in ("critical", "high") for f in rules.get("flags", []))
            status = "review_required" if has_critical else "ready"
            
            case.extracted_entities = entities
            case.resolved_rules = rules
            case.human_review_flags = rules.get("flags", [])
            case.status = status
            case.processed_at = datetime.utcnow()
            db.flush()
            
            # Generate Care Plan
            print("  Generating Care Plan...")
            plan_data = generate_care_plan(patient_dict, entities, rules)
            
            # We will pre-approve 3 of the care plans and leave 2 in review_required status
            # to show both states in the dashboard!
            approved = idx < 3
            
            cp = CarePlan(
                id=f"CP-{p_item['id'].split('-')[1]}",
                case_id=case.id,
                plan_data=plan_data,
                approved=approved,
                approved_by="Dr. Arvind Rawat" if approved else None,
                approved_at=datetime.utcnow() if approved else None,
                generated_at=datetime.utcnow()
            )
            db.add(cp)
            db.commit()
            print(f"  Care Plan {cp.id} created (Approved: {approved})")
            
        print("Database Seeding Completed Successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
