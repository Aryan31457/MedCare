"""
Care Plan Generator — Template-based generation using resolved rule engine output.
Generates all 7 sections: Diet, Exercise, Medications, Do's & Don'ts,
Doctor's Note, Daily Schedule, Recovery Timeline.
"""
from datetime import datetime
from knowledge_base import DISEASE_KG, DRUG_KG, NUTRITION_KG, AGE_PROFILES, get_age_group


def generate_care_plan(patient_data: dict, extracted_entities: dict, resolved_rules: dict) -> dict:
    age = patient_data.get("age", 40)
    age_group = get_age_group(age)
    disease_codes = extracted_entities.get("disease_codes", [])
    drugs = extracted_entities.get("drugs", [])
    lab_values = extracted_entities.get("lab_values", [])
    flags = resolved_rules.get("flags", [])
    conflicts = resolved_rules.get("conflicts", [])

    plan = {
        "patient_id": patient_data.get("id"),
        "patient_name": patient_data.get("name"),
        "age_group": age_group,
        "generated_at": datetime.utcnow().isoformat(),
        "primary_diagnoses": [DISEASE_KG.get(c, {}).get("name", c) for c in disease_codes],
        "diet_plan": _diet_plan(disease_codes, age_group, lab_values, patient_data.get("weight_kg", 60)),
        "exercise_plan": _exercise_plan(disease_codes, age_group, lab_values, resolved_rules),
        "medications": _medication_schedule(drugs, resolved_rules.get("allergy_alerts", [])),
          "dos_and_donts": _dos_donts(disease_codes),
        "daily_schedule": _daily_schedule(drugs, disease_codes),
        "recovery_timeline": _recovery_timeline(disease_codes),
        "doctors_note": _doctors_note(patient_data, extracted_entities, resolved_rules),
        "red_flag_symptoms": _red_flags(disease_codes),
        "monitoring_schedule": _monitoring_schedule(disease_codes, lab_values),
        "human_review_flags": flags,
        "conflict_summary": conflicts,
        "requires_human_review": len([f for f in flags if f.get("severity") in ("critical", "high")]) > 0,
        "confidence_score": _confidence(disease_codes, flags),
    }
    return plan


# ─────────────────────────────────────────────
# Section Generators
# ─────────────────────────────────────────────

def _diet_plan(disease_codes, age_group, lab_values, weight_kg):
    # Determine base caloric target
    caloric_targets = {
        "pediatric": "1200–1800 kcal (weight-based)",
        "adolescent": "2000–2200 kcal",
        "adult": "1800–2200 kcal",
        "middle_aged": "1600–2000 kcal",
        "elderly": "1500–1800 kcal",
        "geriatric": "1400–1600 kcal",
    }
    caloric_target = caloric_targets.get(age_group, "1800–2000 kcal")

    # Protein target (may be modified by CKD)
    protein_target = f"{round(weight_kg * 0.8, 1)}–{round(weight_kg * 1.0, 1)} g/day"
    if "CKD3" in disease_codes:
        protein_target = f"{round(weight_kg * 0.6, 1)}–{round(weight_kg * 0.8, 1)} g/day (CKD-restricted)"

    # Pick appropriate Indian meal plan
    if "CKD3" in disease_codes:
        meal_plan = NUTRITION_KG.get("indian_renal_plan", {})
        plan_name = "Indian Renal Diet (Low-Potassium, Low-Phosphorus, Protein-Controlled)"
        overview = ("A protein-controlled, low-potassium, low-phosphorus diet adapted for Indian cuisine. "
                    "Strict avoidance of banana, potato, tomato, orange, and dairy in excess. "
                    "White rice and white bread preferred over whole grain (lower potassium/phosphorus).")
    elif "POST_MI" in disease_codes or "HEART_FAILURE" in disease_codes:
        meal_plan = NUTRITION_KG.get("indian_cardiac_plan", {})
        plan_name = "Indian Cardiac Diet (Low-Sodium, Low-Saturated Fat, Heart-Healthy)"
        overview = ("A heart-healthy Indian diet focusing on minimal oil, no added salt, and heart-protective foods. "
                    "Includes oats, fish, legumes, and fresh vegetables. Fried foods strictly avoided.")
    elif "TYPHOID" in disease_codes:
        meal_plan = NUTRITION_KG.get("typhoid_recovery_plan", {})
        plan_name = "Typhoid Recovery Diet (Soft, Bland, Easy to Digest)"
        overview = ("Easily digestible, bland, home-cooked food during recovery from typhoid fever. "
                    "Phase 1 (fever): liquids only. Phase 2 (recovery): soft foods like khichdi and curd rice. "
                    "Phase 3: gradual return to normal diet.")
    elif "T2DM" in disease_codes:
        meal_plan = NUTRITION_KG.get("indian_diabetic_plan", {})
        plan_name = "Indian Diabetic Diet (Low-GI, High-Fiber, Controlled Carbohydrate)"
        overview = ("A low-glycemic-index, high-fiber Indian diet designed to maintain stable blood glucose. "
                    "Focused on whole grains, dals, vegetables, and portion control. "
                    "Fixed meal timings are critical.")
    else:
        meal_plan = NUTRITION_KG.get("indian_diabetic_plan", {})
        plan_name = "Balanced Indian Diet"
        overview = "A balanced, wholesome Indian diet. Home-cooked meals preferred. Fresh vegetables, dal, and whole grains form the base."

    # Restrictions merged from all diseases
    all_restrictions = []
    all_recommendations = []
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        all_restrictions.extend(info.get("dietary_restrictions", []))
        all_recommendations.extend(info.get("dietary_recommendations", []))

    # Lab-based additions
    lab_notes = []
    for lab in lab_values:
        if lab["test"] == "eGFR" and lab["value"] < 30:
            lab_notes.append("eGFR < 30: Strict potassium (<2g/day), phosphorus (<800mg/day), and protein restriction mandatory")
        if lab["test"] == "Potassium" and lab["value"] > 5.5:
            lab_notes.append("Hyperkalemia: Avoid banana, potato, tomato, orange, spinach, nuts, and coconut water immediately")
        if lab["test"] == "Hemoglobin" and lab["value"] < 10:
            lab_notes.append("Anemia: Include iron-rich foods — ragi, spinach (if CKD allows), jaggery, pomegranate, and dal")

    return {
        "plan_name": plan_name,
        "overview": overview,
        "caloric_target": caloric_target,
        "protein_target": protein_target,
        "sodium_limit": "<2g/day (approximately 1 teaspoon of salt)" if any(c in disease_codes for c in ["HYPERTENSION", "HEART_FAILURE", "POST_MI"]) else "Normal (avoid excess)",
        "fluid_limit": "1.5L/day — measure all fluids" if "HEART_FAILURE" in disease_codes else "2–3L/day (boiled or bottled water)" if "TYPHOID" in disease_codes else "Normal (2–2.5L/day)",
        "breakfast": meal_plan.get("breakfast_options", meal_plan.get("phase2_recovery", ["Home-cooked light breakfast"])),
        "lunch": meal_plan.get("lunch_options", ["Home-cooked balanced lunch"]),
        "dinner": meal_plan.get("dinner_options", ["Home-cooked light dinner (lighter than lunch)"]),
        "snacks": meal_plan.get("snack_options", ["Roasted chana", "Fruit (appropriate for condition)", "Buttermilk"]),
        "foods_strictly_restricted": list(dict.fromkeys(all_restrictions))[:15],
        "foods_recommended": list(dict.fromkeys(all_recommendations))[:12],
        "lab_based_notes": lab_notes,
        "meal_timing_guidance": (
            "Eat every 3 hours. Never skip meals. Breakfast by 8am, Lunch by 1pm, Dinner by 7:30pm. "
            "No eating after 9pm." if "T2DM" in disease_codes
            else "3 main meals + 2 small snacks. Avoid heavy dinners."
        ),
        "cooking_guidance": "Use minimal oil (1 tsp per meal). Prefer steaming, boiling, roasting over frying. No added table salt.",
    }


def _exercise_plan(disease_codes, age_group, lab_values, resolved_rules):
    age_profile = AGE_PROFILES.get(age_group, {})
    modifier = age_profile.get("exercise_modifier", 1.0)

    # Determine most restrictive disease
    most_restrictive = None
    if "POST_MI" in disease_codes:
        most_restrictive = "POST_MI"
    elif "HEART_FAILURE" in disease_codes:
        most_restrictive = "HEART_FAILURE"
    elif "CKD3" in disease_codes:
        most_restrictive = "CKD3"
    elif "T2DM" in disease_codes:
        most_restrictive = "T2DM"
    elif "TYPHOID" in disease_codes:
        most_restrictive = "TYPHOID"
    elif "HYPERTENSION" in disease_codes:
        most_restrictive = "HYPERTENSION"

    base_protocol = {}
    if most_restrictive:
        base_protocol = DISEASE_KG.get(most_restrictive, {}).get("exercise_protocol", {})

    # Check for absolute exercise restriction (critical labs)
    absolute_rest = False
    for lab in lab_values:
        if lab["test"] == "Troponin" and lab["value"] > 0.04:
            absolute_rest = True
        if lab["test"] == "BNP" and lab["value"] > 500:
            absolute_rest = True
        if lab["test"] == "Hemoglobin" and lab["value"] < 7.0:
            absolute_rest = True

    current_phase = "Phase 1 — Rest & Recovery"
    if most_restrictive in ("T2DM", "HYPERTENSION"):
        current_phase = "Phase 2 — Active Recovery"

    phase1 = base_protocol.get("phase1", {
        "type": "Complete bed rest, seated activities only",
        "duration": "5–10 min mobility per hour",
        "intensity": "None/Very Low",
        "precautions": "No exertion"
    })
    phase2 = base_protocol.get("phase2", {
        "type": "Light indoor walking",
        "duration": "20 min/day",
        "intensity": "Low",
        "precautions": "Monitor vitals, stop if symptomatic"
    })
    phase3 = base_protocol.get("phase3", {
        "type": "Aerobic exercise (walking/yoga)",
        "duration": "30–45 min/day",
        "intensity": "Moderate",
        "precautions": "Cleared by physician"
    })

    # Apply age modifier to durations
    if modifier < 1.0 and not absolute_rest:
        def _scale(proto):
            d = proto.copy()
            d["intensity"] = d.get("intensity", "Moderate") + f" (reduced {int((1-modifier)*100)}% for age)"
            return d
        phase2 = _scale(phase2)
        phase3 = _scale(phase3)

    age_special = age_profile.get("special", [])
    contraindications = []
    if absolute_rest:
        contraindications.append("⛔ All exercise contraindicated currently — critical lab values require complete rest")
    if "POST_MI" in disease_codes:
        contraindications.append("No lifting > 5 kg for first 6 weeks")
        contraindications.append("No driving for at least 4 weeks post-procedure")
    if "CKD3" in disease_codes:
        contraindications.append("No high-intensity exercise — may worsen renal perfusion")
    if age_group in ("elderly", "geriatric"):
        contraindications.append("All exercise must be supervised — fall prevention protocol active")
        contraindications.append("Use walking aid if required; non-slip footwear mandatory")

    return {
        "current_phase": current_phase,
        "absolute_exercise_restriction": absolute_rest,
        "restriction_reason": "Critical lab values (Troponin/BNP/Hemoglobin)" if absolute_rest else None,
        "phase1": phase1,
        "phase2": phase2,
        "phase3": phase3,
        "phase_progression_criteria": {
            "phase1_to_phase2": "Symptom-free for 48–72 hours; physician clearance; stable vitals",
            "phase2_to_phase3": "2 weeks of Phase 2 completion; physician/physiotherapist sign-off",
        },
        "age_group_considerations": age_special,
        "contraindications": contraindications,
        "pre_exercise_checklist": [
            "Check BP — do not exercise if > 180/110 mmHg" if "HYPERTENSION" in disease_codes else "Check BP before exercise",
            "Check blood glucose (70–250 mg/dL target range)" if "T2DM" in disease_codes else "Ensure adequate hydration",
            "Have water and rest area accessible",
            "Wear supportive, non-slip footwear",
            "Stop immediately if: chest pain, breathlessness, dizziness, palpitations",
        ],
    }


def _medication_schedule(drugs, allergy_alerts):
    alert_drug_codes = {a["drug_code"] for a in allergy_alerts}
    schedule = []
    for drug in drugs:
        drug_info = DRUG_KG.get(drug["code"], {})
        has_alert = drug["code"] in alert_drug_codes
        alert_detail = next((a for a in allergy_alerts if a["drug_code"] == drug["code"]), None)

        timing = drug.get("timing") or drug_info.get("timing", "As directed")
        dose = drug.get("dose") or drug_info.get("typical_dose", "As prescribed")

        schedule.append({
            "drug_code": drug["code"],
            "name": drug_info.get("generic", drug["name"]),
            "brand_examples": drug_info.get("brands", [])[:2],
            "class": drug_info.get("class", ""),
            "dose": dose,
            "frequency": drug.get("frequency") or "Once daily",
            "timing": timing,
            "food_interactions": drug_info.get("food_interactions", []),
            "side_effects_to_watch": drug_info.get("side_effects_monitor", []),
            "allergy_alert": has_alert,
            "allergy_message": alert_detail["message"] if alert_detail else None,
            "alternatives": alert_detail["alternatives"] if alert_detail else [],
            "important_notes": _drug_special_notes(drug["code"]),
        })
    return schedule


def _drug_special_notes(code: str) -> list:
    notes = {
        "ASPIRIN": ["Never stop without cardiologist advice (stent thrombosis risk)", "Take after food to protect stomach"],
        "CLOPIDOGREL": ["Never stop without cardiologist advice — especially within 12 months of stent", "Use pantoprazole if needed (not omeprazole)"],
        "METFORMIN": ["Hold 48h before any contrast/dye procedure", "Take WITH meals to reduce stomach upset"],
        "WARFARIN": ["INR must be checked regularly", "Consistent vitamin K intake essential"],
        "FUROSEMIDE": ["Take in the morning — prevents nighttime urination", "Weigh yourself every morning"],
        "CARVEDILOL": ["Never stop suddenly — taper with physician guidance", "Take WITH food"],
        "METOPROLOL": ["Never stop suddenly — can trigger rebound angina/arrhythmia"],
        "SPIRONOLACTONE": ["Monitor potassium weekly initially — risk of hyperkalemia"],
        "LISINOPRIL": ["Stop immediately and call doctor if swelling of lips/tongue/throat (angioedema)"],
        "CEFIXIME": ["Complete full antibiotic course — do not stop early even if feeling better"],
    }
    return notes.get(code, [])


def _dos_donts(disease_codes):
    all_dos, all_donts = [], []
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        all_dos.extend(info.get("do_list", []))
        all_donts.extend(info.get("dont_list", []))

    # Add universal health dos
    all_dos.extend([
        "Attend ALL scheduled follow-up appointments",
        "Keep a daily health diary (BP, glucose if diabetic, weight)",
        "Call your doctor immediately for any red-flag symptoms",
        "Inform all treating doctors of your complete medication list",
    ])
    all_donts.extend([
        "Do not take any over-the-counter medications without consulting your doctor",
        "Do not share your medications with others",
        "Do not stop any prescribed medication without consulting your doctor",
    ])

    return {
        "dos": list(dict.fromkeys(all_dos)),
        "donts": list(dict.fromkeys(all_donts)),
    }


def _daily_schedule(drugs, disease_codes):
    schedule = [
        {"time": "06:00", "activity": "Wake up. Check and log blood pressure.", "category": "monitoring"},
        {"time": "06:30", "activity": "Light morning walk (Phase 2+) or seated mobility exercises.", "category": "exercise"},
        {"time": "07:00", "activity": "Morning medications with a small glass of water.", "category": "medication"},
        {"time": "07:30", "activity": "Breakfast — as per care plan diet. Log blood glucose if diabetic.", "category": "meal"},
        {"time": "08:00", "activity": "Medications to be taken WITH breakfast (Metformin, Aspirin, Clopidogrel, Carvedilol).", "category": "medication"},
        {"time": "10:30", "activity": "Mid-morning snack (roasted chana, apple, or buttermilk).", "category": "meal"},
        {"time": "11:00", "activity": "Rest or light indoor activity. No strenuous tasks.", "category": "rest"},
        {"time": "13:00", "activity": "Lunch — as per care plan diet. Weigh yourself if Heart Failure patient.", "category": "meal"},
        {"time": "13:30", "activity": "After-lunch medications if prescribed.", "category": "medication"},
        {"time": "14:00–15:30", "activity": "Afternoon rest (mandatory for first 2 weeks post-discharge).", "category": "rest"},
        {"time": "16:00", "activity": "Afternoon snack + check blood pressure.", "category": "meal"},
        {"time": "17:00", "activity": "Light evening walk (20–30 min, Phase 2+ only). Log glucose post-exercise if diabetic.", "category": "exercise"},
        {"time": "19:00", "activity": "Dinner — light, low-oil, home-cooked.", "category": "meal"},
        {"time": "19:30", "activity": "Evening medications (Atorvastatin at night, Furosemide should already be taken in morning).", "category": "medication"},
        {"time": "20:00", "activity": "Family/caregiver check-in. Review any symptoms.", "category": "monitoring"},
        {"time": "21:00", "activity": "Log all medications taken in health diary. Final BP check.", "category": "monitoring"},
        {"time": "21:30", "activity": "Bedtime. No screens 30 min before sleep. Elevate head if breathless.", "category": "rest"},
    ]

    if "T2DM" not in disease_codes:
        schedule = [s for s in schedule if "glucose" not in s["activity"].lower() or "diabetic" not in s["activity"].lower()]
    if "HEART_FAILURE" not in disease_codes:
        schedule = [s for s in schedule if "heart failure" not in s["activity"].lower()]

    return schedule


def _recovery_timeline(disease_codes):
    timeline = {}
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        rt = info.get("recovery_timeline", {})
        name = info.get("name", code)
        for period, milestone in rt.items():
            key = period
            if key not in timeline:
                timeline[key] = []
            timeline[key].append(f"[{name}] {milestone}")

    # Flatten and sort
    ordered = {}
    for period in ["Week 1", "Weeks 2–4", "week2_4", "Month 1", "month1", "Month 3", "month3", "Month 6", "month6"]:
        if period in timeline:
            clean_key = period.replace("_", " ").replace("month", "Month").replace("week", "Week")
            ordered[clean_key] = timeline[period]

    return ordered if ordered else timeline


def _red_flags(disease_codes):
    all_flags = []
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        disease_name = info.get("name", code)
        for symptom in info.get("red_flag_symptoms", []):
            all_flags.append({
                "symptom": symptom,
                "related_condition": disease_name,
                "action": "Call your doctor immediately. Go to Emergency if severe.",
            })
    # Universal red flags
    all_flags.extend([
        {"symptom": "Sudden severe chest pain", "related_condition": "Cardiac Emergency", "action": "Call 108/112 immediately. Do not drive yourself."},
        {"symptom": "Sudden slurred speech or weakness on one side", "related_condition": "Stroke", "action": "Call 108/112 immediately — time-critical emergency."},
        {"symptom": "Difficulty breathing at rest", "related_condition": "Multiple", "action": "Emergency department immediately."},
    ])
    return all_flags


def _monitoring_schedule(disease_codes, lab_values):
    monitoring = {}
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        for test, frequency in info.get("monitoring", {}).items():
            if test not in monitoring:
                monitoring[test] = frequency
    return monitoring


def _doctors_note(patient_data, entities, rules):
    name = patient_data.get("name", "Patient")
    age = patient_data.get("age", "")
    sex = patient_data.get("sex", "")
    disease_names = [DISEASE_KG.get(c, {}).get("name", c) for c in entities.get("disease_codes", [])]
    drug_count = len(entities.get("drug_codes", []))
    flags = rules.get("flags", [])
    conflicts = rules.get("conflicts", [])
    allergy_alerts = rules.get("allergy_alerts", [])

    diagnosis_str = ", ".join(disease_names) if disease_names else "as documented"
    critical_flags = [f for f in flags if f.get("severity") == "critical"]
    high_flags = [f for f in flags if f.get("severity") == "high"]

    note = f"""PHYSICIAN'S REVIEW NOTE — GENERATED CARE PLAN
{'='*60}
Patient: {name} | Age: {age} | Sex: {sex}
Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}
{'='*60}

CLINICAL SUMMARY:
This care plan was generated for {name} ({age}y/{sex}) presenting with:
{chr(10).join(f'  • {d}' for d in disease_names) if disease_names else '  • Conditions as per discharge summary'}

{drug_count} medications are included in the discharge regimen.

{'='*60}
⚠️  ITEMS REQUIRING PHYSICIAN ATTENTION BEFORE APPROVAL:
{'='*60}
"""
    if not flags:
        note += "  ✅ No critical flags identified. Care plan generated based on standard protocols.\n"
    else:
        if critical_flags:
            note += f"\n🔴 CRITICAL FLAGS ({len(critical_flags)}):\n"
            for f in critical_flags:
                note += f"  • {f['title']}\n    → {f['action_required']}\n"
        if high_flags:
            note += f"\n🟠 HIGH PRIORITY FLAGS ({len(high_flags)}):\n"
            for f in high_flags:
                note += f"  • {f['title']}\n    → {f['action_required']}\n"

    if allergy_alerts:
        note += f"\n⛔ ALLERGY ALERTS ({len(allergy_alerts)}):\n"
        for a in allergy_alerts:
            note += f"  • {a['message']}\n    Alternatives: {', '.join(a.get('alternatives', ['Consult pharmacist']))}\n"

    if conflicts:
        note += f"\n⚡ DISEASE CONFLICTS DETECTED ({len(conflicts)}):\n"
        for c in conflicts:
            note += f"  • {c['disease1']} + {c['disease2']}: {c['type'].upper()} — {c['resolution']}\n"

    note += f"""
{'='*60}
DISCLAIMER:
This care plan is AI-generated and based on standard clinical 
protocols. It MUST be reviewed and approved by a qualified 
physician before being shared with the patient. The treating 
physician bears full clinical responsibility for the final plan.
{'='*60}

Reviewing Physician Signature: ________________________
Date: _______________________  
Medical Registration No.: ___________________________
"""
    return note


def _confidence(disease_codes, flags):
    base = 0.90
    critical_count = len([f for f in flags if f.get("severity") == "critical"])
    high_count = len([f for f in flags if f.get("severity") == "high"])
    # Lower confidence with more complex/conflicting cases
    score = base - (critical_count * 0.08) - (high_count * 0.03) - (max(0, len(disease_codes) - 2) * 0.02)
    return round(max(0.55, min(score, 0.95)), 2)
