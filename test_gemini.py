import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv('backend/.env')

from backend.gemini_service import generate_care_plan_gemini

patient_data = {"name": "Test", "age": 30, "sex": "Male", "weight_kg": 70, "allergies": []}
discharge_text = "Patient was admitted for testing. Discharged in stable condition."

try:
    res = generate_care_plan_gemini(patient_data, discharge_text)
    print("Success:")
    print(res)
except Exception as e:
    print("Error:", e)
