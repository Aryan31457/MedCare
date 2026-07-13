"""
Gemini AI Care Plan Service.
Uses google-generativeai to generate a structured care plan from a discharge text,
producing the exact same JSON schema as the NLP + rule-engine pipeline.
"""
import os
import json
import re
from datetime import datetime

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Keywords that indicate quota/rate-limit errors from Gemini
_LIMIT_PHRASES = [
    "quota", "rate limit", "resource exhausted", "limit exceeded",
    "too many requests", "429", "billing", "insufficient_quota",
    "rateLimitExceeded", "userRateLimitExceeded", "dailyLimitExceeded",
]


def _is_limit_error(exc: Exception) -> bool:
    """Returns True if the exception is a quota/rate-limit type error."""
    msg = str(exc).lower()
    return any(phrase in msg for phrase in _LIMIT_PHRASES)


def _get_model():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    if not GEMINI_AVAILABLE:
        raise ImportError(
            "google-generativeai package is not installed. Run: pip install google-generativeai"
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


def generate_care_plan_gemini(patient_data: dict, discharge_text: str) -> dict:
    """
    Calls Gemini API with a structured prompt and returns a care plan dict
    matching the exact schema produced by care_plan_generator.py.

    Raises:
        ValueError  — API key not configured
        ImportError — SDK not installed
        RuntimeError(limit=True) — quota / rate-limit hit (check exc.is_limit)
        RuntimeError — any other Gemini / JSON parse failure
    """
    model = _get_model()

    name       = patient_data.get("name", "Patient")
    age        = patient_data.get("age", "Unknown")
    sex        = patient_data.get("sex", "Unknown")
    weight     = patient_data.get("weight_kg", "Unknown")
    allergies  = patient_data.get("allergies", [])
    allergy_str = ", ".join(allergies) if allergies else "None Known"

    prompt = f"""You are an expert clinical AI assistant generating a post-discharge care plan for a patient.

PATIENT PROFILE:
- Name: {name}
- Age: {age} years
- Sex: {sex}
- Weight: {weight} kg
- Known Drug Allergies: {allergy_str}

DISCHARGE SUMMARY:
---
{discharge_text}
---

Generate a COMPLETE, DETAILED care plan strictly as a JSON object.
Output ONLY valid JSON — no markdown, no explanation, no code fences.

The JSON must have EXACTLY these top-level keys:
{{
  "primary_diagnoses": ["string", ...],
  "diet_plan": {{
    "plan_name": "string",
    "overview": "string",
    "caloric_target": "string",
    "protein_target": "string",
    "sodium_limit": "string",
    "fluid_limit": "string",
    "breakfast": ["string", ...],
    "lunch": ["string", ...],
    "dinner": ["string", ...],
    "snacks": ["string", ...],
    "foods_strictly_restricted": ["string", ...],
    "foods_recommended": ["string", ...],
    "lab_based_notes": ["string", ...],
    "meal_timing_guidance": "string",
    "cooking_guidance": "string"
  }},
  "exercise_plan": {{
    "current_phase": "string",
    "absolute_exercise_restriction": false,
    "restriction_reason": null,
    "phase1": {{"type": "string", "duration": "string", "intensity": "string", "precautions": "string"}},
    "phase2": {{"type": "string", "duration": "string", "intensity": "string", "precautions": "string"}},
    "phase3": {{"type": "string", "duration": "string", "intensity": "string", "precautions": "string"}},
    "phase_progression_criteria": {{
      "phase1_to_phase2": "string",
      "phase2_to_phase3": "string"
    }},
    "age_group_considerations": ["string", ...],
    "contraindications": ["string", ...],
    "pre_exercise_checklist": ["string", ...]
  }},
  "medications": [
    {{
      "drug_code": "string",
      "name": "string",
      "brand_examples": ["string"],
      "class": "string",
      "dose": "string",
      "frequency": "string",
      "timing": "string",
      "food_interactions": ["string"],
      "side_effects_to_watch": ["string"],
      "allergy_alert": false,
      "allergy_message": null,
      "alternatives": [],
      "important_notes": ["string"]
    }}
  ],
  "dos_and_donts": {{
    "dos": ["string", ...],
    "donts": ["string", ...]
  }},
  "daily_schedule": [
    {{"time": "HH:MM", "activity": "string", "category": "meal|medication|exercise|monitoring|rest"}}
  ],
  "recovery_timeline": {{
    "Week 1": ["string"],
    "Weeks 2-4": ["string"],
    "Month 1": ["string"],
    "Month 3": ["string"],
    "Month 6": ["string"]
  }},
  "doctors_note": "string (multi-line clinical summary)",
  "red_flag_symptoms": [
    {{"symptom": "string", "related_condition": "string", "action": "string"}}
  ],
  "monitoring_schedule": {{
    "TestName": "frequency string"
  }},
  "human_review_flags": [
    {{"severity": "critical|high|medium", "title": "string", "action_required": "string"}}
  ],
  "conflict_summary": [],
  "requires_human_review": true,
  "confidence_score": 0.88
}}

RULES:
1. Be medically accurate and specific to this patient's diagnoses, labs, and medications.
2. Flag any allergy conflicts (patient is allergic to: {allergy_str}).
3. Set requires_human_review=true if there are critical lab values, drug conflicts, or complex multi-morbidity.
4. The daily_schedule must have at least 8 time slots.
5. Include at least 5 red_flag_symptoms.
6. The doctors_note should be a detailed clinical summary mentioning the patient by name, their conditions, flags, and a disclaimer.
7. For Indian patients, prefer Indian diet options (dal, roti, khichdi, etc.).
8. Output ONLY the JSON object. No markdown. No explanation. No code fences.
"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
    except Exception as exc:
        err = RuntimeError(f"Gemini API call failed: {exc}")
        err.is_limit = _is_limit_error(exc)
        raise err

    # Strip markdown code fences if model ignores instruction
    raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
    raw = raw.strip()

    # Check if the response text itself mentions limit/error phrases
    if any(phrase in raw.lower() for phrase in _LIMIT_PHRASES[:6]):
        err = RuntimeError(f"Gemini returned a limit/error message instead of JSON: {raw[:200]}")
        err.is_limit = True
        raise err

    try:
        plan_data = json.loads(raw)
    except json.JSONDecodeError as exc:
        err = RuntimeError(f"Gemini returned invalid JSON: {exc} | Raw: {raw[:300]}")
        err.is_limit = False
        raise err

    # Inject metadata fields (same as NLP generator)
    plan_data["patient_id"]          = patient_data.get("id")
    plan_data["patient_name"]        = name
    plan_data["age_group"]           = _age_group(age)
    plan_data["generated_at"]        = datetime.utcnow().isoformat()
    plan_data["generation_method"]   = "gemini"

    return plan_data


def _age_group(age) -> str:
    try:
        a = int(age)
    except (TypeError, ValueError):
        return "adult"
    if a < 13:  return "pediatric"
    if a < 18:  return "adolescent"
    if a < 40:  return "adult"
    if a < 60:  return "middle_aged"
    if a < 75:  return "elderly"
    return "geriatric"
