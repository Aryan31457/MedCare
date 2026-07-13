"""
NLP Service — Keyword & regex-based entity extraction from discharge documents.
Simulates a medical NLP pipeline (spaCy + med7) for the prototype.
"""
import re
from knowledge_base import DISEASE_KG, DRUG_KG, LAB_KG, DRUG_CLASS_MAP

# ─────────────────────────────────────────────
# Keyword Maps
# ─────────────────────────────────────────────

DISEASE_KEYWORDS = {
    "T2DM": ["type 2 diabetes", "t2dm", "t2 dm", "dm2", "diabetes mellitus type 2",
              "type ii diabetes", "niddm", "non-insulin dependent", "hyperglycemia", "diabetic"],
    "HYPERTENSION": ["hypertension", "htn", "high blood pressure", "elevated bp",
                     "systemic hypertension", "primary hypertension", "essential hypertension", "bp elevated"],
    "CKD3": ["chronic kidney disease stage 3", "ckd stage 3", "ckd-3", "ckd3",
              "stage 3 ckd", "moderate ckd", "renal impairment stage 3"],
    "POST_MI": ["myocardial infarction", "heart attack", "stemi", "nstemi", "ami",
                "acute mi", "post mi", "post-mi", "pci", "angioplasty", "drug-eluting stent",
                "des stent", "coronary intervention", "ischemic heart disease"],
    "TYPHOID": ["typhoid", "enteric fever", "salmonella typhi", "typhoid fever", "widal"],
    "HEART_FAILURE": ["heart failure", "cardiac failure", "chf", "congestive heart failure",
                      "lv failure", "left ventricular failure", "decompensated heart failure",
                      "nyha class", "ejection fraction", "ef 3", "ef 4", "cardiomyopathy"]
}

DRUG_KEYWORDS = {
    "METFORMIN":      ["metformin", "glyciphage", "glucophage", "obimet", "cetapin"],
    "AMLODIPINE":     ["amlodipine", "amlip", "amlovas", "norvasc", "stamlo"],
    "ATORVASTATIN":   ["atorvastatin", "lipitor", "atorva", "aztor", "torvast"],
    "ASPIRIN":        ["aspirin", "ecosprin", "loprin", "acetylsalicylic"],
    "LISINOPRIL":     ["lisinopril", "listril", "zestril", "prinivil", "linvas"],
    "FUROSEMIDE":     ["furosemide", "lasix", "frusenex", "frusemide"],
    "LOSARTAN":       ["losartan", "losar", "cozaar", "repace", "losacar"],
    "CLOPIDOGREL":    ["clopidogrel", "plavix", "clopilet", "deplatt"],
    "METOPROLOL":     ["metoprolol", "metolar", "betaloc", "seloken"],
    "CARVEDILOL":     ["carvedilol", "carvidon", "carloc", "dilatrend"],
    "SPIRONOLACTONE": ["spironolactone", "aldactone", "lasilactone"],
    "CEFIXIME":       ["cefixime", "taxim-o", "taxim o", "zifi", "suprax", "cefix"],
    "PARACETAMOL":    ["paracetamol", "crocin", "dolo", "calpol", "acetaminophen", "febex"],
}

LAB_PATTERNS = {
    "Troponin":           [r"troponin\s*[it]?\s*[:\-]?\s*(\d+\.?\d*)\s*(?:ng/ml|ug/l)?"],
    "HbA1c":              [r"hba1c\s*[:\-]?\s*(\d+\.?\d*)\s*%?", r"glycated\s+hemoglobin\s*[:\-]?\s*(\d+\.?\d*)"],
    "eGFR":               [r"egfr\s*[:\-]?\s*(\d+\.?\d*)\s*(?:ml/min|mL/min)?"],
    "Creatinine":         [r"(?:serum\s+)?creatinine\s*[:\-]?\s*(\d+\.?\d*)\s*(?:mg/dl|mg/dL)?"],
    "Hemoglobin":         [r"h(?:ae?)?moglobin\s*[:\-]?\s*(\d+\.?\d*)\s*(?:g/dl)?", r"\bhb\b\s*[:\-]?\s*(\d+\.?\d*)"],
    "Potassium":          [r"(?:serum\s+)?potassium\s*[:\-]?\s*(\d+\.?\d*)\s*(?:meq/l|mmol/l)?", r"\bk\+?\s*[:\-]\s*(\d+\.?\d*)"],
    "Blood_Glucose_Fasting": [r"fasting\s+(?:blood\s+)?glucose\s*[:\-]?\s*(\d+\.?\d*)\s*(?:mg/dl)?", r"fbg\s*[:\-]?\s*(\d+\.?\d*)"],
    "BNP":                [r"bnp\s*[:\-]?\s*(\d+\.?\d*)\s*(?:pg/ml)?"],
}

ALLERGY_PATTERNS = [
    r"allerg(?:ic|y|ies)\s*(?:to\s*)?[:\-]?\s*([^\n\.,;(]+)",
    r"known\s+allerg(?:y|ies)\s*[:\-]?\s*([^\n\.,;(]+)",
    r"hypersensitivity\s+to\s+([^\n\.,;(]+)",
]

VITAL_PATTERNS = {
    "blood_pressure": r"(?:bp|blood\s+pressure)\s*[:\-]?\s*(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mmhg)?",
    "heart_rate":     r"(?:hr|heart\s+rate|pulse)\s*[:\-]?\s*(\d{2,3})\s*(?:bpm)?",
    "temperature":    r"(?:temp(?:erature)?)\s*[:\-]?\s*(\d{2,3}\.?\d*)\s*[°℃℉]?",
    "weight":         r"(?:(?:discharge\s+)?weight|wt)\s*[:\-]?\s*(\d{2,3}\.?\d*)\s*kg",
}

ALLERGEN_NORMALIZER = {
    "penicillin": "penicillin",
    "amoxicillin": "penicillin",
    "sulfonamide": "sulfonamide",
    "sulfa": "sulfonamide",
    "nsaid": "nsaid",
    "ibuprofen": "nsaid",
    "aspirin": "aspirin",
    "cephalosporin": "cephalosporin",
    "contrast": "contrast_dye",
}

# ─────────────────────────────────────────────
# Main Extraction Function
# ─────────────────────────────────────────────

def extract_entities(text: str) -> dict:
    tl = text.lower()

    # ── Diseases ────────────────────────────
    diseases, seen_d = [], set()
    for code, keywords in DISEASE_KEYWORDS.items():
        if code in seen_d:
            continue
        for kw in keywords:
            if kw in tl:
                info = DISEASE_KG.get(code, {})
                diseases.append({
                    "code": code,
                    "name": info.get("name", code),
                    "icd10": info.get("icd10", ""),
                    "category": info.get("category", ""),
                    "confidence": 0.92,
                    "matched_term": kw,
                })
                seen_d.add(code)
                break

    # ── Drugs ───────────────────────────────
    drugs, seen_dr = [], set()
    for code, keywords in DRUG_KEYWORDS.items():
        if code in seen_dr:
            continue
        for kw in keywords:
            if kw in tl:
                info = DRUG_KG.get(code, {})
                dose_m = re.search(rf"{re.escape(kw)}\s+(\d+\s*(?:mg|iu|mcg))", tl)
                freq_m = re.search(
                    rf"{re.escape(kw)}[^\.]*?(once daily|twice daily|thrice daily|bd|tds|od|sc\s+3\s+times)",
                    tl,
                )
                drugs.append({
                    "code": code,
                    "name": info.get("generic", code),
                    "class": info.get("class", ""),
                    "dose": dose_m.group(1).strip() if dose_m else "",
                    "frequency": freq_m.group(1).strip() if freq_m else "",
                    "timing": info.get("timing", ""),
                    "food_interactions": info.get("food_interactions", []),
                    "side_effects_monitor": info.get("side_effects_monitor", []),
                    "confidence": 0.90,
                    "matched_term": kw,
                })
                seen_dr.add(code)
                break

    # ── Lab Values ──────────────────────────
    lab_values = []
    seen_lab = set()
    for lab_name, patterns in LAB_PATTERNS.items():
        if lab_name in seen_lab:
            continue
        for pattern in patterns:
            m = re.search(pattern, tl)
            if m:
                try:
                    value = float(m.group(1))
                    lab_info = LAB_KG.get(lab_name, {})
                    lab_values.append({
                        "test": lab_name,
                        "value": value,
                        "unit": lab_info.get("unit", ""),
                        "is_critical": _is_lab_critical(lab_name, value),
                        "implication": _get_lab_implication(lab_name, value),
                    })
                    seen_lab.add(lab_name)
                    break
                except (ValueError, IndexError):
                    continue

    # ── Allergies ───────────────────────────
    raw_allergies = []
    # Explicit NKDA check
    if re.search(r"nkda|no\s+known\s+drug\s+allerg", tl):
        raw_allergies.append({"allergen": "NKDA", "raw_text": "No known drug allergies", "type": "none"})
    else:
        for pattern in ALLERGY_PATTERNS:
            for m in re.finditer(pattern, tl):
                raw = m.group(1).strip().rstrip(".,;:")
                if len(raw) < 3 or len(raw) > 60:
                    continue
                normalized = _normalize_allergen(raw)
                raw_allergies.append({
                    "allergen": normalized,
                    "raw_text": raw,
                    "type": "drug_class" if normalized in ALLERGEN_NORMALIZER.values() else "unknown",
                })
    # Deduplicate
    seen_al = set()
    allergies = []
    for a in raw_allergies:
        if a["allergen"] not in seen_al:
            seen_al.add(a["allergen"])
            allergies.append(a)

    # ── Vitals ──────────────────────────────
    vitals = {}
    for vname, pattern in VITAL_PATTERNS.items():
        m = re.search(pattern, tl)
        if m:
            if vname == "blood_pressure":
                vitals[vname] = f"{m.group(1)}/{m.group(2)} mmHg"
            else:
                vitals[vname] = m.group(1)

    return {
        "diseases": diseases,
        "drugs": drugs,
        "lab_values": lab_values,
        "allergies": [a for a in allergies if a["allergen"] != "NKDA"],
        "vitals": vitals,
        "disease_codes": [d["code"] for d in diseases],
        "drug_codes": [d["code"] for d in drugs],
        "nkda": any(a["allergen"] == "NKDA" for a in allergies),
    }


# ─────────────────────────────────────────────
# Lab Helpers
# ─────────────────────────────────────────────

def _is_lab_critical(lab_name: str, value: float) -> bool:
    info = LAB_KG.get(lab_name, {})
    ch = info.get("critical_high")
    cl = info.get("critical_low")
    if ch and value >= float(ch): return True
    if cl and value <= float(cl): return True
    return False


def _get_lab_implication(lab_name: str, value: float) -> str:
    info = LAB_KG.get(lab_name, {})
    impl = info.get("implications", {})

    thresholds = {
        "eGFR":                [(30, "low"), (60, None)],
        "HbA1c":               [(9, "high"), (7, None)],
        "Potassium":           [(5.5, "high"), (3.0, "low")],
        "BNP":                 [(500, "high"), (100, None)],
        "Troponin":            [(0.04, "high")],
        "Hemoglobin":          [(8.0, "low")],
        "Blood_Glucose_Fasting": [(300, "high"), (70, "low")],
    }

    rules = thresholds.get(lab_name, [])
    for threshold, direction in rules:
        if direction == "high" and value >= threshold:
            return impl.get("high", {}).get("flag_message", f"{lab_name} critically high at {value}")
        if direction == "low" and value <= threshold:
            return impl.get("low", {}).get("flag_message", f"{lab_name} critically low at {value}")

    return f"{lab_name} = {value} {info.get('unit', '')} — within or near normal range"


def _normalize_allergen(raw: str) -> str:
    rl = raw.lower()
    for key, norm in ALLERGEN_NORMALIZER.items():
        if key in rl:
            return norm
    return rl[:40]
