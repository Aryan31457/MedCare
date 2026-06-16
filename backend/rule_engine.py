"""
Rule Engine — Implements all 5 rule types:
  Type 1: Additive rules (stack safely)
  Type 2: Conflicting rules (priority logic + specialist flag)
  Type 3: Allergy override rules (hard stops)
  Type 4: Age-adjusted rules
  Type 5: Lab-triggered rules
Also handles: human review triggers, polypharmacy checks, disease-pair conflict matrix.
"""
from knowledge_base import (
    DISEASE_KG, DRUG_KG, LAB_KG, CONFLICT_MATRIX,
    DRUG_CLASS_MAP, AGE_PROFILES, get_age_group
)


def run_rule_engine(patient_data: dict, extracted_entities: dict) -> dict:
    age = patient_data.get("age", 40)
    age_group = get_age_group(age)
    disease_codes = extracted_entities.get("disease_codes", [])
    drug_codes = extracted_entities.get("drug_codes", [])
    lab_values = extracted_entities.get("lab_values", [])

    # Merge allergies from patient profile + discharge doc
    doc_allergies = [a["allergen"].lower() for a in extracted_entities.get("allergies", [])]
    profile_allergies = [a.lower() for a in patient_data.get("allergies", [])]
    all_allergies = list(set(doc_allergies + profile_allergies))

    result = {
        "age_group": age_group,
        "age_profile": AGE_PROFILES.get(age_group, {}),
        "disease_protocols": {},
        "conflicts": [],
        "allergy_alerts": [],
        "lab_triggered_rules": [],
        "age_adjustments": [],
        "polypharmacy_flag": False,
        "flags": [],
        "safe_rules": [],
        "merged_dietary_restrictions": [],
        "merged_dietary_recommendations": [],
    }

    # ── 1. Disease Protocols ──────────────────────────────────────────────────
    all_restrictions, all_recommendations = [], []
    for code in disease_codes:
        info = DISEASE_KG.get(code, {})
        if not info:
            continue
        result["disease_protocols"][code] = {
            "name": info.get("name", code),
            "dietary_restrictions": info.get("dietary_restrictions", []),
            "dietary_recommendations": info.get("dietary_recommendations", []),
            "exercise_protocol": info.get("exercise_protocol", {}),
            "monitoring": info.get("monitoring", {}),
            "red_flag_symptoms": info.get("red_flag_symptoms", []),
            "do_list": info.get("do_list", []),
            "dont_list": info.get("dont_list", []),
            "recovery_timeline": info.get("recovery_timeline", {}),
        }
        all_restrictions.extend(info.get("dietary_restrictions", []))
        all_recommendations.extend(info.get("dietary_recommendations", []))

    result["merged_dietary_restrictions"] = _dedupe(all_restrictions)
    result["merged_dietary_recommendations"] = _dedupe(all_recommendations)

    # ── 2. Disease Conflict Detection (Type 2) ─────────────────────────────────
    safe_rules_set = set()
    for i, c1 in enumerate(disease_codes):
        for c2 in disease_codes[i + 1:]:
            pair = frozenset([c1, c2])
            if pair in CONFLICT_MATRIX:
                cf = CONFLICT_MATRIX[pair]
                result["conflicts"].append({
                    "disease1": c1,
                    "disease2": c2,
                    "type": cf["type"],
                    "severity": cf["severity"],
                    "conflict_zones": cf["conflict_zones"],
                    "message": cf["message"],
                    "resolution": cf["resolution"],
                })
                for r in cf.get("safe_rules", []):
                    safe_rules_set.add(r)
                if cf["resolution"] in ("specialist_flag", "pharmacist_flag"):
                    result["flags"].append({
                        "id": f"conflict_{c1}_{c2}",
                        "type": "conflict",
                        "severity": cf["severity"],
                        "title": f"⚠️ Disease Conflict: {DISEASE_KG.get(c1,{}).get('name',c1)} + {DISEASE_KG.get(c2,{}).get('name',c2)}",
                        "message": cf["message"],
                        "action_required": "Specialist review before approving care plan",
                    })

    # ── 3. Allergy Override Rules (Type 3 — Hard Stops) ──────────────────────
    for drug_code in drug_codes:
        drug_info = DRUG_KG.get(drug_code, {})
        if not drug_info:
            continue
        generic = drug_info.get("generic", "").lower()
        drug_class = drug_info.get("class", "").lower()

        for allergen in all_allergies:
            blocked, cross_reactive = False, False
            # Direct name match
            if allergen in generic:
                blocked = True
            # Drug class match
            elif allergen in drug_class:
                blocked = True
            # Cross-reactivity lookup
            elif allergen in DRUG_CLASS_MAP:
                for cr_drug in DRUG_CLASS_MAP[allergen]:
                    if cr_drug.lower() in generic or cr_drug.lower() in drug_class:
                        blocked = True
                        cross_reactive = True
                        break

            if blocked:
                severity = "critical" if not cross_reactive else "high"
                note = "(cross-reactivity risk)" if cross_reactive else "(direct class match)"
                alternatives = drug_info.get("class_alternatives", [])
                result["allergy_alerts"].append({
                    "drug_code": drug_code,
                    "drug_name": drug_info.get("generic", drug_code),
                    "allergen": allergen,
                    "severity": severity,
                    "cross_reactive": cross_reactive,
                    "message": (
                        f"⛔ ALLERGY ALERT {note}: {drug_info.get('generic', drug_code)} may be "
                        f"contraindicated due to documented {allergen} allergy."
                    ),
                    "alternatives": alternatives,
                })
                result["flags"].append({
                    "id": f"allergy_{drug_code}_{allergen}",
                    "type": "allergy",
                    "severity": severity,
                    "title": f"⛔ Allergy Alert: {drug_info.get('generic', drug_code)}",
                    "message": (
                        f"Patient has documented {allergen} allergy. "
                        f"{drug_info.get('generic', drug_code)} {note} may be contraindicated."
                    ),
                    "action_required": (
                        f"Pharmacist review required. Consider alternative: {', '.join(alternatives)}"
                        if alternatives else "Pharmacist review required immediately."
                    ),
                })

    # ── 4. Lab-Triggered Rules (Type 5) ──────────────────────────────────────
    for lab in lab_values:
        lab_name = lab["test"]
        value = lab["value"]

        if lab_name == "eGFR":
            if value < 30:
                result["lab_triggered_rules"].append({
                    "trigger": f"eGFR = {value} mL/min → CKD Stage 4",
                    "rules": [
                        "Restrict protein to <0.6g/kg/day",
                        "Strict potassium restriction (avoid banana, potato, tomato, orange)",
                        "Strict phosphorus restriction (avoid dairy, nuts, cola)",
                        "Adjust ALL renally-cleared drug doses",
                        "Nephrology referral mandatory",
                    ],
                    "flag": True,
                })
                result["flags"].append({
                    "id": "lab_egfr_lt30",
                    "type": "lab_critical",
                    "severity": "critical",
                    "title": f"🔴 Critical: eGFR = {value} mL/min (CKD Stage 4)",
                    "message": f"eGFR {value} mL/min indicates Stage 4 CKD. Nephrology referral mandatory. Critical protein, potassium, and phosphorus restriction. Drug dose adjustments required.",
                    "action_required": "Nephrology referral + pharmacist drug dose review",
                })
            elif value < 45:
                result["lab_triggered_rules"].append({
                    "trigger": f"eGFR = {value} mL/min → CKD Stage 3b",
                    "rules": ["Moderate protein restriction", "Reduce potassium-rich foods", "Monitor electrolytes monthly"],
                    "flag": False,
                })

        elif lab_name == "Potassium":
            if value > 5.5:
                result["lab_triggered_rules"].append({
                    "trigger": f"Potassium = {value} mEq/L → Hyperkalemia",
                    "rules": ["Immediately restrict banana, potato, tomato, orange, spinach, nuts", "Review ACEi/ARB/spironolactone doses"],
                    "flag": True,
                })
                result["flags"].append({
                    "id": "lab_hyperkalemia",
                    "type": "lab_critical",
                    "severity": "high",
                    "title": f"🟠 Hyperkalemia: K+ = {value} mEq/L",
                    "message": f"Potassium {value} mEq/L. Strict dietary potassium restriction. Review concurrent ACEi/ARB/spironolactone dosing.",
                    "action_required": "Pharmacist review of potassium-raising medications",
                })
            elif value < 3.0:
                result["lab_triggered_rules"].append({
                    "trigger": f"Potassium = {value} mEq/L → Hypokalemia",
                    "rules": ["Potassium supplementation", "Increase potassium-rich foods if CKD allows", "Review diuretic dose"],
                    "flag": True,
                })
                result["flags"].append({
                    "id": "lab_hypokalemia",
                    "type": "lab_critical",
                    "severity": "high",
                    "title": f"🟠 Hypokalemia: K+ = {value} mEq/L",
                    "message": f"Potassium {value} mEq/L — hypokalemia. Supplement potassium. Review loop diuretic dose.",
                    "action_required": "Electrolyte correction + diuretic review",
                })

        elif lab_name == "HbA1c" and value > 9.0:
            result["lab_triggered_rules"].append({
                "trigger": f"HbA1c = {value}% → Severely uncontrolled T2DM",
                "rules": ["Strict carbohydrate restriction", "Intensify glucose monitoring", "Endocrinology review"],
                "flag": True,
            })
            result["flags"].append({
                "id": "lab_hba1c_critical",
                "type": "lab_critical",
                "severity": "high",
                "title": f"🟠 Uncontrolled Diabetes: HbA1c = {value}%",
                "message": f"HbA1c {value}% is severely above target (<7%). Intensified glucose monitoring and endocrinology review required.",
                "action_required": "Endocrinology review for medication intensification",
            })

        elif lab_name == "Hemoglobin" and value < 8.0:
            result["lab_triggered_rules"].append({
                "trigger": f"Hemoglobin = {value} g/dL → Severe anemia",
                "rules": ["No strenuous exercise — light walking only", "Iron-rich diet", "Consider transfusion if < 7 g/dL"],
                "flag": True,
            })
            result["flags"].append({
                "id": "lab_severe_anemia",
                "type": "lab_critical",
                "severity": "high",
                "title": f"🟠 Severe Anemia: Hb = {value} g/dL",
                "message": f"Hemoglobin {value} g/dL — severe anemia. Exercise restriction. Iron supplementation. Consider erythropoietin if CKD-related.",
                "action_required": "Review anemia management and exercise restrictions",
            })

        elif lab_name == "BNP" and value > 500:
            result["lab_triggered_rules"].append({
                "trigger": f"BNP = {value} pg/mL → Severe heart failure",
                "rules": ["Complete rest — no exercise in Phase 1", "Strict salt <1.5g/day", "Fluid restriction 1.5L/day"],
                "flag": True,
            })
            result["flags"].append({
                "id": "lab_bnp_critical",
                "type": "lab_critical",
                "severity": "critical",
                "title": f"🔴 Severe HF Decompensation: BNP = {value} pg/mL",
                "message": f"BNP {value} pg/mL on discharge indicates severe decompensation. Urgent cardiology review within 1 week mandatory.",
                "action_required": "Urgent cardiology review within 1 week",
            })

    # ── 5. Age-Adjusted Rules (Type 4) ────────────────────────────────────────
    age_profile = AGE_PROFILES.get(age_group, {})
    modifier = age_profile.get("exercise_modifier", 1.0)

    if age_group in ("elderly", "geriatric"):
        result["age_adjustments"] = [
            f"Reduce exercise intensity by {int((1 - modifier) * 100)}% from standard",
            f"Fall risk: {age_profile.get('fall_risk', 'high')} — activate fall prevention protocol",
            "Simplified medication schedule with large-print labels recommended",
            "Cognitive status assessment at each follow-up visit",
            "Caregiver education and training required",
        ]
        if len(drug_codes) >= 5 or age_group == "geriatric":
            result["flags"].append({
                "id": "age_polypharmacy",
                "type": "age_polypharmacy",
                "severity": "medium",
                "title": f"🟡 Elderly Patient + Polypharmacy ({age}, {age_group})",
                "message": (
                    f"Patient is {age} years ({age_group}) with {len(drug_codes)} medications. "
                    "Geriatric medication review recommended to reduce pill burden and interaction risk."
                ),
                "action_required": "Clinical pharmacist geriatric medication review",
            })
    elif age_group == "pediatric":
        result["age_adjustments"] = [
            "Weight-based drug dosing required (mg/kg)",
            "Parent/guardian must be assigned all medication tasks",
            "School and activity reintegration timeline needed",
            "Growth monitoring at all follow-ups",
        ]
        result["flags"].append({
            "id": "pediatric_mandatory_review",
            "type": "pediatric",
            "severity": "critical",
            "title": f"🔴 Pediatric Patient — Human Review Mandatory ({age} years)",
            "message": f"Patient is {age} years old. Pediatric dosing, parent/guardian task assignment, and pediatrician involvement required.",
            "action_required": "Pediatric specialist review mandatory before approval",
        })

    # ── 6. Polypharmacy check ─────────────────────────────────────────────────
    if len(drug_codes) >= 5 and age_group not in ("elderly", "geriatric"):
        result["polypharmacy_flag"] = True
        result["flags"].append({
            "id": "polypharmacy",
            "type": "polypharmacy",
            "severity": "medium",
            "title": f"🟡 Polypharmacy: {len(drug_codes)} Medications",
            "message": f"{len(drug_codes)} medications prescribed simultaneously. Drug-drug interaction complexity is elevated. Clinical pharmacist medication reconciliation recommended.",
            "action_required": "Clinical pharmacist review of complete medication list",
        })

    # ── 7. Hard human-review triggers ─────────────────────────────────────────
    # Always escalate if ANY critically abnormal lab on discharge
    critical_labs = [l for l in lab_values if l.get("is_critical")]
    if critical_labs:
        for cl in critical_labs:
            # Only add a flag if we haven't already flagged this specific lab
            existing_ids = [f["id"] for f in result["flags"]]
            flag_id = f"lab_discharge_critical_{cl['test']}"
            if flag_id not in existing_ids:
                result["flags"].append({
                    "id": flag_id,
                    "type": "lab_critical",
                    "severity": "critical",
                    "title": f"🔴 Critical Lab at Discharge: {cl['test']} = {cl['value']} {cl['unit']}",
                    "message": cl.get("implication", "Critically abnormal lab value at time of discharge."),
                    "action_required": "Clinical review required — labs must be rechecked at follow-up within 48–72h",
                })

    result["safe_rules"] = list(safe_rules_set)
    return result


def _dedupe(items: list) -> list:
    seen, out = set(), []
    for item in items:
        k = item.lower()
        if k not in seen:
            seen.add(k)
            out.append(item)
    return out
