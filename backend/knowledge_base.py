"""
Dummy Knowledge Base — All 6 Knowledge Graphs for MedCare Prototype
Simulates Neo4j graph data as Python dictionaries.
"""

# ─────────────────────────────────────────────
# KG-1: Disease Knowledge Graph
# ─────────────────────────────────────────────
DISEASE_KG = {
    "T2DM": {
        "icd10": "E11", "name": "Type 2 Diabetes Mellitus", "category": "chronic",
        "affected_systems": ["endocrine", "cardiovascular", "renal", "neurological"],
        "dietary_restrictions": ["white rice (large portions)","sugar","sweets","fruit juice","maida","sweetened beverages","full cream milk","refined carbs"],
        "dietary_recommendations": ["brown rice","whole wheat roti","oats","barley","dal","non-starchy vegetables","lean protein","bitter gourd","fenugreek seeds"],
        "exercise_protocol": {
            "phase1": {"type": "Light walking", "duration": "15–20 min/day", "intensity": "Low", "precautions": "Check glucose before and after"},
            "phase2": {"type": "Brisk walking + yoga", "duration": "30 min/day", "intensity": "Moderate", "precautions": "Carry glucose tablets"},
            "phase3": {"type": "Aerobic + light resistance", "duration": "45 min/day", "intensity": "Moderate-High", "precautions": "Monitor glucose response"}
        },
        "red_flag_symptoms": ["Blood glucose < 70 mg/dL (hypoglycemia — eat 15g carbs immediately)","Blood glucose > 300 mg/dL","Excessive thirst & urination","Sudden blurred vision","Chest pain or breathlessness"],
        "monitoring": {"Blood Glucose": "Daily — fasting and 2h post-meal", "HbA1c": "Every 3 months", "Kidney Function": "Every 6 months", "Eye Check": "Annual"},
        "recovery_timeline": {"Week 1": "Glucose stabilization & dietary adjustment","Month 1": "Stable glucose levels, medication adherence review","Month 3": "HbA1c recheck, lifestyle integration","Month 6": "Long-term management & complication screening"},
        "do_list": ["Monitor blood sugar twice daily","Take medications at fixed times","Eat small, frequent meals (every 3 hours)","Maintain consistent meal timings","Carry glucose tablets for hypoglycemia episodes","Wear diabetic footwear"],
        "dont_list": ["Skip meals","Consume sugary foods or drinks","Stop medications without consulting doctor","Skip glucose monitoring","Walk barefoot"]
    },
    "HYPERTENSION": {
        "icd10": "I10", "name": "Hypertension (Primary)", "category": "chronic",
        "affected_systems": ["cardiovascular", "renal", "neurological"],
        "dietary_restrictions": ["table salt","pickles","papad","processed foods","canned foods","alcohol","salty snacks","namkeen","packaged chips"],
        "dietary_recommendations": ["fresh fruits","vegetables","whole grains","low-fat curd","banana","coconut water","leafy greens","dal","garlic"],
        "exercise_protocol": {
            "phase1": {"type": "Light walking indoors", "duration": "20 min/day", "intensity": "Low", "precautions": "No Valsalva, check BP before exercise"},
            "phase2": {"type": "Brisk walking", "duration": "30 min/day", "intensity": "Moderate", "precautions": "Stop if BP > 180/110"},
            "phase3": {"type": "Aerobic exercise (walking/cycling)", "duration": "45 min/day", "intensity": "Moderate", "precautions": "No heavy weightlifting"}
        },
        "red_flag_symptoms": ["Blood pressure > 180/120 mmHg (hypertensive crisis)","Severe throbbing headache","Chest pain or tightness","Sudden vision changes","Numbness or weakness on one side of body"],
        "monitoring": {"Blood Pressure": "Twice daily — morning and evening", "Kidney Function": "Every 6 months", "Electrolytes": "Every 3 months", "ECG": "Annual"},
        "recovery_timeline": {"Week 1": "BP monitoring, salt restriction initiation","Month 1": "Stable BP readings, lifestyle changes embedded","Month 3": "Medication effectiveness review","Month 6": "Long-term BP management & organ protection check"},
        "do_list": ["Monitor BP twice daily and log readings","Follow low-sodium DASH diet","Take medications at the same time daily","Manage stress with deep breathing or meditation","Maintain healthy body weight","Exercise regularly"],
        "dont_list": ["Add extra salt to food","Consume pickles, papad, or packaged namkeen","Skip antihypertensive medications","Lift heavy weights","Drink alcohol or smoke"]
    },
    "CKD3": {
        "icd10": "N18.3", "name": "Chronic Kidney Disease Stage 3", "category": "chronic",
        "affected_systems": ["renal", "cardiovascular", "endocrine", "hematological"],
        "dietary_restrictions": ["high protein foods","red meat","banana","orange","potato","tomato","nuts","dairy (excess)","cola drinks","extra salt","phosphorus-rich foods"],
        "dietary_recommendations": ["white rice","white bread","apple","cabbage","cauliflower","white pasta","controlled protein 0.6–0.8g/kg/day","low-potassium vegetables"],
        "exercise_protocol": {
            "phase1": {"type": "Light walking indoors", "duration": "10–15 min/day", "intensity": "Very Low", "precautions": "Monitor BP and breathlessness"},
            "phase2": {"type": "Walking + gentle stretching", "duration": "20 min/day", "intensity": "Low", "precautions": "No heavy exertion"},
            "phase3": {"type": "Light aerobic activity", "duration": "30 min/day", "intensity": "Low-Moderate", "precautions": "Regular renal function monitoring"}
        },
        "red_flag_symptoms": ["Swelling in legs, face, or around eyes","Significant decrease in urine output","Shortness of breath at rest","Confusion or extreme fatigue","Chest pain","Nausea/vomiting persistently"],
        "monitoring": {"Kidney Function (eGFR, Creatinine)": "Monthly", "Electrolytes (K, Na, PO4)": "Monthly", "Blood Pressure": "Daily", "Hemoglobin": "Every 2 months", "Urine Protein": "Every 3 months"},
        "recovery_timeline": {"Week 1": "Dietary restriction initiation, fluid monitoring","Month 1": "Creatinine stabilization review","Month 3": "eGFR reassessment & medication adjustment","Month 6": "Long-term renal function monitoring"},
        "do_list": ["Monitor daily fluid intake and urine output","Follow renal diet strictly","Take phosphate binders as prescribed","Monitor blood pressure daily","Keep all nephrology appointments","Avoid NSAIDs and contrast dyes"],
        "dont_list": ["Consume high-potassium foods (banana, potato)","Use NSAIDs (ibuprofen, naproxen, diclofenac)","Consume excess protein","Use IV contrast without nephrologist approval","Skip fluid restriction guidelines"]
    },
    "POST_MI": {
        "icd10": "I25.2", "name": "Post-Myocardial Infarction (Post-PCI)", "category": "post-acute",
        "affected_systems": ["cardiovascular"],
        "dietary_restrictions": ["saturated fats","trans fats","red meat","full-fat dairy","fried foods","excess salt","alcohol","coconut oil (limit)"],
        "dietary_recommendations": ["oats","fish (sardine, mackerel)","olive oil","walnuts (handful)","vegetables","fruits","whole grains","dal","low-fat dairy","green tea"],
        "exercise_protocol": {
            "phase1": {"type": "Complete bed rest + sitting up", "duration": "10 min sit-out twice daily", "intensity": "Very Low", "precautions": "No exertion, supervised only"},
            "phase2": {"type": "Supervised indoor walking", "duration": "20–30 min/day", "intensity": "Low", "precautions": "Stop if chest pain, HR > 120"},
            "phase3": {"type": "Formal cardiac rehabilitation program", "duration": "45 min, 3x/week", "intensity": "Moderate (supervised)", "precautions": "ECG monitoring required"}
        },
        "red_flag_symptoms": ["Any chest pain or pressure","Shortness of breath at rest or minimal exertion","Palpitations or irregular heartbeat","Sudden dizziness or fainting","Swelling in legs (fluid retention)","Weight gain > 2 kg in 2 days"],
        "monitoring": {"Blood Pressure": "Twice daily", "Heart Rate": "Daily", "Daily Weight": "Every morning before breakfast", "Cardiac Enzymes": "As per cardiologist schedule", "Lipid Profile": "After 6 weeks"},
        "recovery_timeline": {"Week 1": "Complete rest, ICU/cardiac monitoring, no exertion","Weeks 2–4": "Supervised light activity, wound healing (if angioplasty)","Months 2–3": "Formal cardiac rehabilitation program","Month 6": "Functional assessment, return-to-work evaluation"},
        "do_list": ["Take ALL cardiac medications without missing a single dose","Monitor daily weight and report sudden gain (>2 kg in 2 days)","Follow cardiac diet strictly","Attend all cardiology follow-ups","Report any chest discomfort immediately","Keep nitroglycerin spray accessible"],
        "dont_list": ["Lift anything > 5 kg for first 6 weeks","Drive for at least 4 weeks post-procedure","Engage in strenuous exercise without cardiologist clearance","Smoke or be near secondhand smoke","Miss cardiac medications even for a single day","Ignore any chest symptoms — call emergency immediately"]
    },
    "TYPHOID": {
        "icd10": "A01.0", "name": "Enteric Fever (Typhoid)", "category": "acute",
        "affected_systems": ["gastrointestinal", "systemic", "hepatic"],
        "dietary_restrictions": ["spicy food","oily/fried food","raw vegetables","raw salads","street food","carbonated drinks","alcohol","high-fiber roughage (during fever phase)"],
        "dietary_recommendations": ["khichdi","curd rice","moong dal soup","rice kanji","banana","boiled/steamed vegetables","toast","idli","coconut water","ORS","buttermilk","soft cooked dal"],
        "exercise_protocol": {
            "phase1": {"type": "Complete bed rest", "duration": "None — rest only", "intensity": "None", "precautions": "Complete rest during fever phase"},
            "phase2": {"type": "Light indoor walking", "duration": "10 min/day", "intensity": "Very Low", "precautions": "Only when afebrile for 48+ hours"},
            "phase3": {"type": "Gradual return to normal activity", "duration": "20 min walks", "intensity": "Low", "precautions": "Monitor energy levels, don't push"}
        },
        "red_flag_symptoms": ["Fever returning after 48h of being afebrile","Severe abdominal pain or rigidity","Blood in stool","Extreme confusion or drowsiness","Persistent vomiting preventing hydration"],
        "monitoring": {"Temperature": "Every 6 hours", "Fluid Intake": "Log minimum 2.5–3L/day", "Stool Culture": "After completing antibiotic course"},
        "recovery_timeline": {"Week 1": "Fever control, IV/oral hydration, complete rest","Week 2": "Fever resolution, gradual dietary advancement","Week 3": "Light activity introduction, normal diet return","Week 4": "Full recovery, stool culture clearance, return to work"},
        "do_list": ["Complete FULL antibiotic course even if feeling better","Drink only boiled or sealed bottled water","Rest completely during fever phase","Maintain strict hand hygiene (wash before eating, after toilet)","Eat only home-cooked, easily digestible food","Isolate utensils during contagious phase"],
        "dont_list": ["Stop antibiotics early — typhoid will relapse","Eat spicy, oily, or street food","Drink unboiled tap water","Engage in physical activity during fever phase","Share utensils, towels, or toiletries with family members"]
    },
    "HEART_FAILURE": {
        "icd10": "I50.9", "name": "Congestive Heart Failure (CHF)", "category": "chronic",
        "affected_systems": ["cardiovascular", "renal", "pulmonary", "systemic"],
        "dietary_restrictions": ["salt (>2g/day)","excess fluid if severe (>1.5L/day)","alcohol","processed/canned foods","saturated fats","red meat","full-fat dairy"],
        "dietary_recommendations": ["low-sodium diet (<1.5–2g/day)","lean protein (fish, chicken)","vegetables","whole grains","controlled potassium if on ACEi/ARB","small frequent meals"],
        "exercise_protocol": {
            "phase1": {"type": "Bed rest + sitting, passive leg movements", "duration": "5–10 min sit-out", "intensity": "Very Low", "precautions": "Only when hemodynamically stable"},
            "phase2": {"type": "Supervised slow walking", "duration": "15–20 min/day", "intensity": "Low", "precautions": "Stop if breathlessness, O2 sat < 94%"},
            "phase3": {"type": "Structured cardiac rehabilitation", "duration": "30 min, 3x/week", "intensity": "Low-Moderate (supervised)", "precautions": "Continuous monitoring"}
        },
        "red_flag_symptoms": ["Weight gain > 2 kg in 2 days (fluid retention — CALL DOCTOR)","Worsening shortness of breath at rest or lying flat","Increasing leg/ankle swelling","Reduced urine output despite normal fluid intake","Persistent dry cough (new)","Extreme fatigue preventing daily activities"],
        "monitoring": {"Daily Weight": "Every morning before breakfast — same time, same clothes", "Blood Pressure": "Twice daily", "Fluid Intake Log": "All fluids measured and logged", "BNP/NT-proBNP": "As per cardiologist at each visit", "Kidney Function & Electrolytes": "Monthly"},
        "recovery_timeline": {"Week 1": "Aggressive diuresis, fluid removal, symptom control","Month 1": "Medication optimization (target doses)","Month 3": "Functional capacity assessment, cardiac rehab","Month 6": "Long-term management, device therapy consideration if EF remains low"},
        "do_list": ["Weigh yourself EVERY morning before breakfast","Restrict salt to < 1.5g/day","Take diuretics in the morning as prescribed","Log ALL fluid intake (water, tea, soup, juice)","Attend ALL cardiology follow-ups","Elevate legs when sitting to reduce swelling"],
        "dont_list": ["Ignore sudden weight gain — call doctor immediately","Consume salty or processed foods","Drink excess fluids beyond prescribed limit","Stop heart failure medications (beta-blockers, ACEi, diuretics)","Lie completely flat if breathless — use 2–3 pillows","Consume alcohol"]
    }
}

# ─────────────────────────────────────────────
# KG-2: Drug Knowledge Graph
# ─────────────────────────────────────────────
DRUG_KG = {
    "METFORMIN": {
        "generic": "Metformin", "brands": ["Glyciphage", "Glucophage", "Obimet", "Cetapin"],
        "class": "Biguanide", "indications": ["T2DM"],
        "contraindications": ["CKD Stage 4–5 (eGFR < 30)", "severe heart failure", "liver disease", "active alcohol use"],
        "food_interactions": ["Alcohol — risk of lactic acidosis (avoid completely)"],
        "drug_interactions": ["Contrast dye — hold 48h before IV contrast procedures"],
        "renal_adjustment": {"eGFR_30_60": "Use with caution, reduce dose", "eGFR_lt_30": "CONTRAINDICATED"},
        "typical_dose": "500–2000 mg daily in divided doses", "timing": "WITH meals to reduce GI side effects",
        "side_effects_monitor": ["GI upset (nausea, diarrhea)", "Lactic acidosis (rare — stop if ill)", "Vitamin B12 deficiency (annual check)"],
        "pregnancy_category": "B"
    },
    "AMLODIPINE": {
        "generic": "Amlodipine", "brands": ["Amlip", "Amlovas", "Norvasc", "Stamlo"],
        "class": "Calcium Channel Blocker", "indications": ["hypertension", "angina"],
        "contraindications": ["severe aortic stenosis", "cardiogenic shock"],
        "food_interactions": ["Grapefruit juice — increases drug levels (avoid)"],
        "drug_interactions": ["Simvastatin — limit statin to 20mg if combined", "Cyclosporine — increased amlodipine levels"],
        "renal_adjustment": {"any_stage": "No dose adjustment required"},
        "typical_dose": "5–10 mg once daily", "timing": "Any consistent time daily",
        "side_effects_monitor": ["Ankle edema (very common)", "Flushing", "Headache", "Palpitations"],
        "pregnancy_category": "C"
    },
    "ATORVASTATIN": {
        "generic": "Atorvastatin", "brands": ["Lipitor", "Atorva", "Aztor", "Torvast"],
        "class": "Statin (HMG-CoA Reductase Inhibitor)", "indications": ["hypercholesterolemia", "cardiovascular prevention", "post-MI"],
        "contraindications": ["active liver disease", "pregnancy", "lactation"],
        "food_interactions": ["Grapefruit juice — avoid (increases levels and myopathy risk)"],
        "drug_interactions": ["Amlodipine (mild interaction)", "Erythromycin/clarithromycin (increased statin levels)", "Antifungals (azoles)"],
        "renal_adjustment": {"any_stage": "No dose adjustment required"},
        "typical_dose": "10–80 mg once daily", "timing": "Evening preferred (liver cholesterol synthesis peaks at night)",
        "side_effects_monitor": ["Myopathy/muscle pain (stop if severe)", "Elevated liver enzymes (LFT check at 3 months)", "Rhabdomyolysis (rare — brown urine — emergency)"],
        "pregnancy_category": "X"
    },
    "ASPIRIN": {
        "generic": "Aspirin (Acetylsalicylic Acid)", "brands": ["Ecosprin", "Disprin", "Loprin"],
        "class": "Antiplatelet / NSAID", "indications": ["post-MI", "stroke prevention", "angina", "stent"],
        "contraindications": ["active peptic ulcer", "bleeding disorders", "allergy to NSAIDs", "severe renal failure"],
        "food_interactions": ["Alcohol — significantly increases bleeding risk (avoid)"],
        "drug_interactions": ["Warfarin — synergistic bleeding risk (monitor INR)", "Ibuprofen — reduces aspirin's antiplatelet effect", "SSRIs — increased GI bleed risk"],
        "renal_adjustment": {"eGFR_lt_30": "Avoid if possible, use with caution"},
        "typical_dose": "75–100 mg once daily (antiplatelet dose)", "timing": "After meals to reduce GI upset",
        "side_effects_monitor": ["GI bleeding (black/tarry stools — urgent)", "Easy bruising", "Tinnitus at high doses", "Peptic ulcer"],
        "pregnancy_category": "C (D in 3rd trimester)"
    },
    "LISINOPRIL": {
        "generic": "Lisinopril", "brands": ["Listril", "Zestril", "Prinivil", "Linvas"],
        "class": "ACE Inhibitor", "indications": ["hypertension", "heart failure", "post-MI", "CKD with proteinuria"],
        "contraindications": ["pregnancy (D)", "bilateral renal artery stenosis", "history of ACEi-induced angioedema", "hyperkalemia"],
        "food_interactions": ["Potassium supplements or salt substitutes — hyperkalemia risk", "High potassium foods if on CKD diet"],
        "drug_interactions": ["NSAIDs — reduced antihypertensive effect + AKI risk", "Potassium-sparing diuretics — hyperkalemia", "Lithium — increased lithium toxicity"],
        "renal_adjustment": {"eGFR_30_60": "Start at 5mg, monitor creatinine and K+ closely", "eGFR_lt_30": "Use with extreme caution, nephrologist consultation required"},
        "typical_dose": "5–40 mg once daily", "timing": "Morning consistently",
        "side_effects_monitor": ["Dry persistent cough (switch to ARB if intolerable)", "Angioedema — EMERGENCY — stop immediately", "Hyperkalemia", "First-dose hypotension", "Acute kidney injury"],
        "pregnancy_category": "D"
    },
    "FUROSEMIDE": {
        "generic": "Furosemide", "brands": ["Lasix", "Frusenex", "Frusemide"],
        "class": "Loop Diuretic", "indications": ["heart failure", "edema", "hypertension", "CKD fluid overload"],
        "contraindications": ["anuria", "severe hypovolemia/dehydration", "known sulfonamide allergy (cross-reactivity possible)"],
        "food_interactions": ["Licorice — worsens hypokalemia", "High sodium foods — reduces diuretic effect"],
        "drug_interactions": ["NSAIDs — reduced diuretic effect and renal toxicity", "Aminoglycosides — ototoxicity risk", "Digoxin — hypokalemia increases digoxin toxicity"],
        "renal_adjustment": {"CKD": "Higher doses may be required to achieve diuresis"},
        "typical_dose": "20–80 mg once or twice daily", "timing": "MORNING (avoid evening — prevents disruptive nocturia)",
        "side_effects_monitor": ["Hypokalemia (monitor K+ weekly)", "Dehydration", "Electrolyte imbalance (Na, Mg)", "Hearing loss at very high IV doses"],
        "pregnancy_category": "C"
    },
    "LOSARTAN": {
        "generic": "Losartan", "brands": ["Losar", "Cozaar", "Repace", "Losacar"],
        "class": "Angiotensin Receptor Blocker (ARB)", "indications": ["hypertension", "heart failure", "CKD with proteinuria", "post-MI"],
        "contraindications": ["pregnancy (D)", "bilateral renal artery stenosis"],
        "food_interactions": ["High potassium foods — hyperkalemia risk in CKD"],
        "drug_interactions": ["NSAIDs — reduced effect + AKI risk", "Potassium-sparing diuretics", "Lithium"],
        "renal_adjustment": {"any_stage": "No specific dose adjustment, but monitor creatinine and K+ closely"},
        "typical_dose": "50–100 mg once daily", "timing": "Consistent daily time",
        "side_effects_monitor": ["Hyperkalemia", "Dizziness (first dose)", "Renal function changes (creatinine rise < 30% is acceptable)", "Rarely — angioedema"],
        "pregnancy_category": "D"
    },
    "CLOPIDOGREL": {
        "generic": "Clopidogrel", "brands": ["Plavix", "Clopilet", "Deplatt-A"],
        "class": "Antiplatelet (P2Y12 inhibitor)", "indications": ["post-MI", "ACS", "stent", "stroke prevention"],
        "contraindications": ["active bleeding", "severe liver disease", "hypersensitivity"],
        "food_interactions": ["None significant"],
        "drug_interactions": ["Omeprazole/PPIs — reduce antiplatelet effect (use pantoprazole instead)", "Aspirin — synergistic antiplatelet effect (intentional dual therapy post-stent)"],
        "renal_adjustment": {"any_stage": "No dose adjustment required"},
        "typical_dose": "75 mg once daily", "timing": "Any consistent time",
        "side_effects_monitor": ["Bleeding (bruising, prolonged bleeding from cuts)", "TTP (rare — emergency)", "Rash"],
        "pregnancy_category": "B"
    },
    "METOPROLOL": {
        "generic": "Metoprolol Succinate/Tartrate", "brands": ["Metolar", "Betaloc", "Seloken"],
        "class": "Beta-1 Selective Beta Blocker", "indications": ["hypertension", "heart failure", "post-MI", "angina", "tachyarrhythmia"],
        "contraindications": ["severe bradycardia (HR < 50)", "cardiogenic shock", "acute decompensated heart failure", "severe COPD/asthma"],
        "food_interactions": ["None significant"],
        "drug_interactions": ["Verapamil/Diltiazem — severe bradycardia risk", "Digoxin — additive bradycardia"],
        "renal_adjustment": {"any_stage": "No dose adjustment required"},
        "typical_dose": "25–200 mg daily (titrated slowly)", "timing": "Morning and evening (twice daily) OR morning (once daily SR)",
        "side_effects_monitor": ["Bradycardia (HR < 55 — review dose)", "Fatigue", "Cold extremities", "Masking hypoglycemia symptoms in diabetics", "Worsening of COPD/asthma"],
        "pregnancy_category": "C"
    },
    "CARVEDILOL": {
        "generic": "Carvedilol", "brands": ["Carvidon", "Carloc", "Dilatrend"],
        "class": "Non-selective Beta + Alpha-1 Blocker", "indications": ["heart failure (EF < 40%)", "hypertension", "post-MI"],
        "contraindications": ["severe COPD/asthma", "decompensated heart failure", "severe bradycardia"],
        "food_interactions": ["Food increases absorption (take WITH food)"],
        "drug_interactions": ["Digoxin — increased digoxin levels", "Cyclosporine", "Insulin — mask hypoglycemia"],
        "renal_adjustment": {"any_stage": "No dose adjustment; hepatic caution"},
        "typical_dose": "3.125–25 mg twice daily (start low, titrate slowly over weeks)", "timing": "WITH meals twice daily",
        "side_effects_monitor": ["Dizziness (first-dose hypotension)", "Fatigue", "Bradycardia", "Weight gain (fluid)"],
        "pregnancy_category": "C"
    },
    "SPIRONOLACTONE": {
        "generic": "Spironolactone", "brands": ["Aldactone", "Lasilactone"],
        "class": "Potassium-sparing Diuretic / Aldosterone Antagonist", "indications": ["heart failure (EF < 35%)", "ascites", "resistant hypertension"],
        "contraindications": ["hyperkalemia (K+ > 5.5)", "severe renal failure (eGFR < 30)", "pregnancy"],
        "food_interactions": ["Potassium-rich foods — hyperkalemia risk (monitor K+ closely)"],
        "drug_interactions": ["ACE inhibitors/ARBs — hyperkalemia risk (common combination, monitor K+ weekly initially)", "NSAIDs — reduced diuretic effect"],
        "renal_adjustment": {"eGFR_lt_30": "Avoid — severe hyperkalemia risk"},
        "typical_dose": "25–50 mg once daily", "timing": "Morning",
        "side_effects_monitor": ["Hyperkalemia (CRITICAL — K+ > 5.5 requires dose hold)", "Gynecomastia in men", "Menstrual irregularities", "Renal function deterioration"],
        "pregnancy_category": "D"
    },
    "CEFIXIME": {
        "generic": "Cefixime", "brands": ["Taxim-O", "Zifi", "Suprax", "Cefix"],
        "class": "3rd Generation Cephalosporin (Beta-lactam)", "indications": ["typhoid fever (1st line)", "UTI", "respiratory tract infections"],
        "contraindications": ["cephalosporin allergy", "severe penicillin allergy (cross-reactivity ~2%)"],
        "food_interactions": ["None significant"],
        "drug_interactions": ["Warfarin — increased anticoagulant effect (monitor INR if on warfarin)"],
        "renal_adjustment": {"eGFR_lt_30": "Reduce dose to 200mg once daily"},
        "typical_dose": "200–400 mg twice daily (typhoid: 400mg BD x 14 days)", "timing": "With or without food",
        "side_effects_monitor": ["Allergic reaction (rash, urticaria)", "Diarrhea/C.diff (report if severe)", "Elevated liver enzymes"],
        "pregnancy_category": "B"
    },
    "PARACETAMOL": {
        "generic": "Paracetamol (Acetaminophen)", "brands": ["Crocin", "Dolo 650", "Calpol", "Febex"],
        "class": "Antipyretic / Analgesic", "indications": ["fever", "mild-moderate pain"],
        "contraindications": ["active liver disease", "severe hepatic impairment"],
        "food_interactions": ["Alcohol — hepatotoxicity risk (avoid)"],
        "drug_interactions": ["Warfarin — mild INR increase at high doses"],
        "renal_adjustment": {"eGFR_lt_30": "Increase dosing interval to every 8 hours"},
        "typical_dose": "500–1000 mg every 4–6 hours (max 4g/day)", "timing": "As needed for fever only (not regular)",
        "side_effects_monitor": ["Hepatotoxicity with overdose (emergency)", "Rash (rare)"],
        "pregnancy_category": "A/B"
    }
}

# ─────────────────────────────────────────────
# KG-3: Nutrition Knowledge Graph
# ─────────────────────────────────────────────
NUTRITION_KG = {
    "indian_diabetic_plan": {
        "suitable_for": ["T2DM", "T2DM+HYPERTENSION"],
        "breakfast_options": ["Vegetable oats upma (1 cup)","Moong dal chilla (2 pieces) with green chutney","Whole wheat toast (2 slices) + boiled egg white","Besan cheela (2) + curd (1/2 cup)"],
        "lunch_options": ["Brown rice (1 cup) + dal (1/2 cup) + mixed sabzi + curd","2 whole wheat roti + palak paneer (small) + dal","Khichdi (oats/moong dal) + salad"],
        "dinner_options": ["2 whole wheat roti + lauki/tinda/bitter gourd sabzi","Vegetable soup + 1 roti + dal","Brown rice porridge + dal + salad"],
        "snack_options": ["Sprouts chaat (no chaat masala)","Roasted chana (small handful)","Cucumber + lemon + pinch of salt","Buttermilk (no salt)","Apple (medium)"],
        "avoid_strictly": ["White rice (large portions)","Puri, bhatura, paratha with excess ghee","Sweets, mithai, halwa","Packaged juices, cold drinks","Namkeen, chips, biscuits"]
    },
    "indian_cardiac_plan": {
        "suitable_for": ["POST_MI", "HEART_FAILURE", "POST_MI+T2DM"],
        "breakfast_options": ["Oats porridge (unsweetened, low fat milk)","Whole wheat upma with vegetables","2 idli + sambar (low salt)","Poha (beaten rice with vegetables, minimal oil)"],
        "lunch_options": ["Brown rice (small portion) + fish curry (steamed/baked) + vegetables","2 rotis + dal + sabzi (minimal oil, no salt added)","Vegetable soup + roti + curd"],
        "dinner_options": ["1–2 rotis + sabzi + lentil soup","Grilled fish + vegetables + small rice","Dal khichdi + curd"],
        "snack_options": ["Walnuts (4–5)","Almonds (8–10, unsalted)","Apple or pear","Green tea (no sugar)","Roasted makhana"],
        "avoid_strictly": ["Fried foods (samosa, pakoda, puri)","Red meat, full-fat dairy","Pickles, papad, extra salt","Ghee in excess","Alcohol"]
    },
    "indian_renal_plan": {
        "suitable_for": ["CKD3", "CKD3+HEART_FAILURE"],
        "breakfast_options": ["White bread toast (2) + apple + tea (low-milk)","Suji (semolina) upma (low-protein)","Rice porridge (kanji) + low-potassium vegetables"],
        "lunch_options": ["White rice (1 cup) + small portion dal + cabbage/cauliflower sabzi","White bread + cauliflower sabzi (no potato/tomato)"],
        "dinner_options": ["White rice or 1–2 white rotis + beans (white/string) sabzi","Clear vegetable soup (low-K vegetables) + rice"],
        "snack_options": ["Apple", "Puffed rice (muri)", "White bread toast", "Custard apple (limited)"],
        "avoid_strictly": ["Banana, potato, tomato, orange","Dairy in excess (cottage cheese, milk)","Nuts and dry fruits","Cola drinks","Red meat, chicken liver","Processed/canned foods"]
    },
    "typhoid_recovery_plan": {
        "suitable_for": ["TYPHOID"],
        "phase1_fever": ["Coconut water (300ml)","ORS solution (as needed)","Rice kanji (congee)","Clear broth (vegetable)","Barley water"],
        "phase2_recovery": ["Khichdi (moong dal + rice, soft cooked)","Curd rice (plain)","Moong dal soup","Banana (ripe, soft)","Boiled vegetables (carrot, gourd)","Idli (soft, no spice)","Toast with butter"],
        "phase3_normal": ["Gradually reintroduce normal home-cooked food","Start with soft, bland options","Add one new food at a time","Monitor for GI upset"],
        "avoid_throughout": ["Spicy food","Oily/fried food","Raw salads/vegetables","Street food","Carbonated drinks","Alcohol","High fiber roughage"]
    }
}

# ─────────────────────────────────────────────
# KG-4: Lab Value Interpretation Graph
# ─────────────────────────────────────────────
LAB_KG = {
    "HbA1c": {
        "unit": "%", "normal": "<5.7", "pre_diabetic": "5.7–6.4", "diabetic_target": "<7.0", "critical_high": 10.0,
        "implications": {
            "high": {"dietary": "Strict carbohydrate restriction, low-GI diet essential", "exercise": "Stable glucose required before exercise initiation", "flag_threshold": 9.0, "flag_message": "HbA1c severely uncontrolled — consider specialist endocrinology review"}
        },
        "retest": "Every 3 months"
    },
    "eGFR": {
        "unit": "mL/min/1.73m²", "normal": ">90",
        "stages": {"Stage 1": ">90", "Stage 2": "60–89", "Stage 3": "30–59", "Stage 4": "15–29", "Stage 5": "<15"},
        "implications": {
            "low": {"dietary": "eGFR < 30 → Restrict protein, potassium, phosphorus strictly", "exercise": "eGFR < 30 → Only very light activity", "flag_threshold": 30, "flag_message": "eGFR < 30 — CKD Stage 4: nephrology referral required, drug dose adjustments critical"}
        },
        "retest": "Monthly if <60"
    },
    "Hemoglobin": {
        "unit": "g/dL", "normal_male": "13.5–17.5", "normal_female": "12.0–15.5", "critical_low": 7.0,
        "implications": {
            "low": {"dietary": "Increase iron-rich foods: spinach, ragi, dal, jaggery (if not diabetic), pomegranate", "exercise": "Hb < 8 → No strenuous activity; Hb < 7 → complete rest", "flag_threshold": 8.0, "flag_message": "Hemoglobin critically low — consider iron supplementation or erythropoietin; restrict exercise"}
        },
        "retest": "Monthly if anemic"
    },
    "Creatinine": {
        "unit": "mg/dL", "normal_male": "0.7–1.3", "normal_female": "0.6–1.1", "critical_high": 5.0,
        "implications": {
            "high": {"dietary": "Restrict protein, avoid red meat, limit phosphorus-rich foods", "exercise": "Creatinine > 3 → minimal exercise only (walking only)", "flag_threshold": 3.0, "flag_message": "Creatinine significantly elevated — drug dose adjustment required, nephrology consult"}
        },
        "retest": "Monthly"
    },
    "Blood_Glucose_Fasting": {
        "unit": "mg/dL", "normal": "70–100", "pre_diabetic": "100–125", "diabetic": ">126", "critical_high": 300.0, "critical_low": 70.0,
        "implications": {
            "high": {"dietary": "Low-GI diet, avoid refined carbs and sugar", "exercise": "Avoid exercise if FBG > 250 without ketone test"},
            "low": {"dietary": "Ensure regular meals, carry glucose tablets", "exercise": "Do not exercise if FBG < 70"}
        },
        "retest": "Daily for diabetics"
    },
    "Potassium": {
        "unit": "mEq/L", "normal": "3.5–5.0", "critical_high": 6.5, "critical_low": 2.5,
        "implications": {
            "high": {"dietary": "Immediately restrict banana, potato, tomato, orange, spinach, nuts", "exercise": "No exercise until K+ normalized", "flag_threshold": 5.5, "flag_message": "Potassium elevated — review ACEi/ARB and spironolactone doses, restrict dietary potassium"},
            "low": {"dietary": "Increase banana, coconut water, dal, potato (if not CKD)", "exercise": "Correct potassium before exercise", "flag_threshold": 3.0, "flag_message": "Hypokalemia — review diuretic dose, supplement potassium"}
        },
        "retest": "Weekly if on diuretics or ACEi/ARBs"
    },
    "BNP": {
        "unit": "pg/mL", "normal": "<100", "elevated": "100–500", "critical_high": 500,
        "implications": {
            "high": {"dietary": "Strict salt restriction < 1.5g/day, fluid restriction", "exercise": "BNP > 500 → complete rest only", "flag_threshold": 500, "flag_message": "BNP critically elevated — severe heart failure; cardiology urgent review"}
        },
        "retest": "Every 1–2 weeks in acute phase"
    },
    "Troponin": {
        "unit": "ng/mL", "normal": "<0.04", "elevated": ">0.04", "critical_high": 2.0,
        "implications": {
            "high": {"dietary": "Cardiac diet mandatory immediately", "exercise": "No exercise until troponin normalized AND cardiologist clearance", "flag_threshold": 0.04, "flag_message": "Troponin elevated — active cardiac injury; complete exercise restriction"}
        },
        "retest": "Serial per cardiologist protocol"
    }
}

# ─────────────────────────────────────────────
# KG-5: Exercise & Rehabilitation Graph
# ─────────────────────────────────────────────
EXERCISE_KG = {
    "bed_rest": {"intensity": "none", "allowed_in": ["POST_MI phase1", "HEART_FAILURE acute", "TYPHOID phase1"], "contraindicated_in": []},
    "light_walking": {"intensity": "low", "allowed_in": ["T2DM", "HYPERTENSION", "CKD3", "TYPHOID phase2", "POST_MI phase2", "HEART_FAILURE phase2"], "contraindicated_in": ["POST_MI phase1", "HEART_FAILURE acute decompensated"]},
    "brisk_walking": {"intensity": "moderate", "allowed_in": ["T2DM", "HYPERTENSION", "general"], "contraindicated_in": ["POST_MI (within 4 weeks)", "HEART_FAILURE (unstable)", "CKD3 (advanced)"]},
    "yoga_breathing": {"intensity": "low", "allowed_in": ["T2DM", "HYPERTENSION", "CKD3", "general"], "contraindicated_in": ["POST_MI phase1", "HEART_FAILURE acute"]},
    "cardiac_rehab": {"intensity": "moderate (supervised)", "allowed_in": ["POST_MI phase3", "HEART_FAILURE stable phase3"], "contraindicated_in": ["POST_MI phase1-2", "unstable angina", "decompensated heart failure"]},
    "resistance_training": {"intensity": "moderate-high", "allowed_in": ["T2DM stable", "HYPERTENSION controlled", "general healthy"], "contraindicated_in": ["POST_MI (within 6 weeks)", "HEART_FAILURE", "CKD advanced", "HYPERTENSION uncontrolled"]}
}

# ─────────────────────────────────────────────
# KG-6: Age Group Profile Graph
# ─────────────────────────────────────────────
AGE_PROFILES = {
    "pediatric": {"range": "0–12", "exercise_modifier": 0.8, "fall_risk": "moderate", "caregiver_dependency": "high", "special": ["weight-based drug dosing", "parent/guardian task assignment", "school reintegration timeline"]},
    "adolescent": {"range": "13–17", "exercise_modifier": 1.0, "fall_risk": "low", "caregiver_dependency": "low", "special": ["mental health monitoring", "school/sports reintegration"]},
    "adult": {"range": "18–45", "exercise_modifier": 1.0, "fall_risk": "low", "caregiver_dependency": "none", "special": ["work reintegration", "family counseling"]},
    "middle_aged": {"range": "46–60", "exercise_modifier": 0.9, "fall_risk": "low-moderate", "caregiver_dependency": "none", "special": ["comorbidity screening", "metabolic syndrome risk"]},
    "elderly": {"range": "61–75", "exercise_modifier": 0.6, "fall_risk": "high", "caregiver_dependency": "moderate", "special": ["fall prevention protocol", "polypharmacy review (≥5 drugs)", "cognitive monitoring", "simplified medication schedule", "caregiver training"]},
    "geriatric": {"range": "75+", "exercise_modifier": 0.4, "fall_risk": "very high", "caregiver_dependency": "high", "special": ["fall prevention mandatory", "cognitive assessment at each visit", "24/7 caregiver required", "simplify to minimum essential medications", "palliative considerations"]}
}

def get_age_group(age: int) -> str:
    if age <= 12: return "pediatric"
    elif age <= 17: return "adolescent"
    elif age <= 45: return "adult"
    elif age <= 60: return "middle_aged"
    elif age <= 75: return "elderly"
    else: return "geriatric"

# ─────────────────────────────────────────────
# Multi-Disease Conflict Matrix
# ─────────────────────────────────────────────
CONFLICT_MATRIX = {
    frozenset(["T2DM", "CKD3"]): {
        "type": "conflicting", "severity": "high",
        "conflict_zones": ["Protein targets clash — T2DM allows moderate protein for muscle, CKD restricts to 0.6g/kg", "Potassium — T2DM allows banana, CKD restricts banana completely"],
        "resolution": "specialist_flag",
        "message": "⚠️ Protein and potassium targets conflict between T2DM and CKD Stage 3 management. Use CKD renal diet as the base restriction. Protein target (0.6–0.8g/kg) requires nephrologist + endocrinologist co-agreement.",
        "safe_rules": ["low_sodium", "low_glycemic_index", "restrict_high_potassium_foods", "controlled_carbohydrates"]
    },
    frozenset(["HEART_FAILURE", "CKD3"]): {
        "type": "conflicting", "severity": "high",
        "conflict_zones": ["Fluid management — HF says restrict fluids, CKD also restricts but management differs", "Potassium — Loop diuretics cause hypokalemia, CKD causes hyperkalemia (opposing forces)", "Furosemide high-dose may worsen renal function"],
        "resolution": "specialist_flag",
        "message": "⚠️ Electrolyte management requires cardio-nephrology co-management. Potassium targets must be individualized. Furosemide dose must balance fluid removal vs renal perfusion.",
        "safe_rules": ["strict_salt_restriction", "daily_weight_monitoring", "fluid_intake_log", "weekly_electrolyte_monitoring"]
    },
    frozenset(["T2DM", "HYPERTENSION"]): {
        "type": "additive", "severity": "low",
        "conflict_zones": ["Dietary restrictions are additive — both require low-sodium and low-glycemic diet"],
        "resolution": "additive",
        "message": "✅ T2DM + Hypertension: Apply BOTH restrictions simultaneously. Modified DASH diet with carbohydrate control works well. No fundamental conflict.",
        "safe_rules": ["low_sodium", "low_glycemic_index", "high_fiber", "low_saturated_fat", "DASH_diet_modified"]
    },
    frozenset(["POST_MI", "T2DM"]): {
        "type": "phased", "severity": "medium",
        "conflict_zones": ["Exercise — cardiac restriction (bed rest) conflicts with T2DM need for exercise for glucose control", "Glucose management during cardiac recovery phase needs careful monitoring"],
        "resolution": "phased",
        "message": "⚠️ Exercise introduction must follow cardiac clearance phases. Glucose monitoring is especially important as exercise is reintroduced. Cardiologist must clear each exercise phase.",
        "safe_rules": ["cardiac_diet", "glucose_monitoring_enhanced", "phased_activity_unlock", "aspirin_metformin_timing_check"]
    },
    frozenset(["CKD3", "HYPERTENSION"]): {
        "type": "pharmacist_flag", "severity": "medium",
        "conflict_zones": ["ACEi/ARB use may progressively worsen potassium in CKD", "Aggressive BP control may reduce renal perfusion in CKD"],
        "resolution": "pharmacist_flag",
        "message": "⚠️ Antihypertensive choice and dose must account for renal function. Monthly potassium and creatinine monitoring mandatory. Target BP 130/80 in CKD.",
        "safe_rules": ["strict_salt_restriction", "daily_BP_monitoring", "monthly_renal_function_check", "avoid_NSAIDs"]
    },
    frozenset(["HEART_FAILURE", "HYPERTENSION"]): {
        "type": "additive", "severity": "low",
        "conflict_zones": ["Compatible — both managed with salt restriction and BP control"],
        "resolution": "additive",
        "message": "✅ Heart Failure + Hypertension: Compatible management. Strict salt restriction and BP target < 130/80 serves both. Beta-blocker and ACEi/ARB serve dual purpose.",
        "safe_rules": ["strict_salt_restriction", "fluid_restriction", "daily_weight_monitoring", "BP_monitoring"]
    },
    frozenset(["POST_MI", "HEART_FAILURE"]): {
        "type": "additive", "severity": "low",
        "conflict_zones": ["Both require cardiac management — consistent approach"],
        "resolution": "additive",
        "message": "✅ Post-MI + Heart Failure: Consistent cardiac management. EF monitoring critical. Beta-blockers and ACEi/ARB are cornerstone of both. Strict fluid and sodium restriction.",
        "safe_rules": ["cardiac_diet", "fluid_restriction", "daily_weight_monitoring", "ejection_fraction_monitoring"]
    },
    frozenset(["T2DM", "HEART_FAILURE"]): {
        "type": "conflicting", "severity": "medium",
        "conflict_zones": ["Metformin contraindicated in severe heart failure", "Some diabetes drugs (glitazones) worsen heart failure — avoid", "Fluid restriction may affect medication absorption"],
        "resolution": "pharmacist_flag",
        "message": "⚠️ Diabetes management in heart failure: Metformin contraindicated in severe HF. Avoid glitazones (pioglitazone). SGLT2 inhibitors (empagliflozin) may actually benefit HF — specialist consideration.",
        "safe_rules": ["glucose_monitoring", "avoid_glitazones", "review_metformin_appropriateness", "cardiac_diet"]
    }
}

# ─────────────────────────────────────────────
# Drug Class Cross-Reactivity (for Allergy Checker)
# ─────────────────────────────────────────────
DRUG_CLASS_MAP = {
    "penicillin": ["amoxicillin", "ampicillin", "cloxacillin", "piperacillin", "co-amoxiclav", "flucloxacillin"],
    "beta_lactam": ["penicillin", "amoxicillin", "ampicillin", "cefixime", "ceftriaxone", "cephalexin", "cefuroxime", "cefpodoxime"],
    "cephalosporin": ["cefixime", "ceftriaxone", "cephalexin", "cefuroxime", "cefpodoxime", "cefadroxil"],
    "nsaid": ["ibuprofen", "naproxen", "diclofenac", "indomethacin", "ketorolac", "mefenamic acid", "nimesulide"],
    "sulfonamide": ["furosemide (cross-reactivity ~10%)", "hydrochlorothiazide (cross-reactivity)", "sulfamethoxazole", "sulfasalazine"],
    "statin": ["atorvastatin", "rosuvastatin", "simvastatin", "pravastatin", "lovastatin", "fluvastatin"],
    "acei": ["lisinopril", "ramipril", "enalapril", "perindopril", "captopril", "quinapril"],
    "arb": ["losartan", "telmisartan", "valsartan", "olmesartan", "irbesartan", "candesartan"],
    "macrolide": ["azithromycin", "clarithromycin", "erythromycin", "roxithromycin"]
}

# ─────────────────────────────────────────────
# Sample Patients
# ─────────────────────────────────────────────
SAMPLE_PATIENTS = [
    {
        "id": "P001", "name": "Ramesh Kumar", "age": 65, "sex": "Male",
        "weight_kg": 72.0, "blood_group": "B+",
        "allergies": ["penicillin"],
        "contact": "Suresh Kumar (Son) — 9876543210",
        "address": "42, MG Road, Bengaluru, Karnataka"
    },
    {
        "id": "P002", "name": "Priya Sharma", "age": 32, "sex": "Female",
        "weight_kg": 58.0, "blood_group": "O+",
        "allergies": [],
        "contact": "Rahul Sharma (Husband) — 9123456789",
        "address": "15, Lajpat Nagar, New Delhi"
    },
    {
        "id": "P003", "name": "Arjun Singh", "age": 72, "sex": "Male",
        "weight_kg": 68.0, "blood_group": "A+",
        "allergies": ["penicillin", "sulfonamide"],
        "contact": "Kaur Singh (Wife) — 9988776655",
        "address": "7, Sector 22, Chandigarh, Punjab"
    }
]

SAMPLE_DISCHARGE_TEXTS = {
    "P001": """DISCHARGE SUMMARY
Patient: Ramesh Kumar | Age: 65 years | Sex: Male | IP No: MED-2026-0341
Admission: 12/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology (ICU → General)

PRIMARY DIAGNOSIS:
1. Acute Myocardial Infarction (STEMI — Anterior wall) — Post Primary PCI with Drug-Eluting Stent to LAD
2. Type 2 Diabetes Mellitus (Known case — 10 years, on oral hypoglycemics)
3. Hypertension (Known case — 8 years)

PROCEDURE: Emergency Primary PCI + DES stenting to proximal LAD. Successful TIMI-3 flow achieved.

INVESTIGATIONS AT ADMISSION:
- Troponin I: 45.2 ng/mL (critically elevated)
- HbA1c: 8.4% (poorly controlled)
- Fasting Blood Glucose: 184 mg/dL
- Serum Creatinine: 1.2 mg/dL | eGFR: 62 mL/min/1.73m² (CKD Stage 2)
- Blood Pressure: 160/100 mmHg
- Hemoglobin: 12.8 g/dL
- Serum Potassium: 3.9 mEq/L

DISCHARGE MEDICATIONS:
1. Tab Aspirin 75mg — Once daily AFTER breakfast (do not miss)
2. Tab Clopidogrel 75mg — Once daily AFTER breakfast (dual antiplatelet — do not stop without cardiologist advice)
3. Tab Atorvastatin 80mg — Once daily at NIGHT
4. Tab Metoprolol 25mg — Twice daily (morning and evening with meals)
5. Tab Lisinopril 5mg — Once daily MORNING
6. Tab Metformin 500mg — Twice daily WITH meals (HOLD for 48h if undergoing any dye/contrast procedure)
7. Tab Amlodipine 5mg — Once daily (any consistent time)

KNOWN ALLERGIES: Penicillin (documented reaction: rash and urticaria)
DIET: Diabetic + Cardiac diet. Low salt (<2g/day). Low fat. Low sugar. No fried food.
FOLLOW UP: Cardiology OPD in 1 week. Endocrinology OPD in 4 weeks.
DISCHARGE BP: 130/84 mmHg | HR: 72 bpm | Glucose: 148 mg/dL | Afebrile
""",
    "P002": """DISCHARGE SUMMARY
Patient: Priya Sharma | Age: 32 years | Sex: Female | IP No: MED-2026-0562
Admission: 09/06/2026 | Discharge: 16/06/2026 | Ward: General Medicine

PRIMARY DIAGNOSIS:
1. Enteric Fever (Typhoid) — Blood culture positive: Salmonella typhi (sensitive to cefixime)

INVESTIGATIONS:
- Blood Culture (Day 1): Salmonella typhi — sensitive to Cefixime, Azithromycin
- Widal Test: O antigen 1:320, H antigen 1:320 (positive)
- Hemoglobin: 10.8 g/dL (mild anemia)
- WBC Count: 3.2 x 10^9/L (leukopenia — typical of typhoid)
- Platelet Count: 125 x 10^9/L (mild thrombocytopenia)
- Liver Function: ALT 68 U/L, AST 72 U/L (mild elevation — typhoid hepatitis)
- Temperature on admission: 103.4°F (39.7°C)

DISCHARGE MEDICATIONS:
1. Tab Cefixime 400mg — Twice daily for 7 MORE days (complete full 14-day course — MUST NOT STOP EARLY)
2. Tab Paracetamol 500mg — ONLY if fever (temperature > 100°F); NOT to be taken regularly
3. ORS Sachet — Dissolve in 1L boiled water, sip throughout the day as needed
4. Tab Ferrous Sulfate + Folic Acid — Once daily after meals (for anemia)
5. Multivitamin tablet — Once daily

KNOWN ALLERGIES: None Known (NKDA)
DIET: Typhoid diet — soft, easily digestible, bland food only. Avoid ALL spicy, oily, raw food.
Drink only boiled or sealed bottled water.
FOLLOW UP: Medicine OPD in 1 week. Repeat: LFT, CBC, and stool culture at follow-up.
DISCHARGE CONDITION: Afebrile for 48 hours. Improving. Discharged on patient/family request.
""",
    "P003": """DISCHARGE SUMMARY
Patient: Arjun Singh | Age: 72 years | Sex: Male | IP No: MED-2026-0489
Admission: 05/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology

PRIMARY DIAGNOSIS:
1. Decompensated Congestive Heart Failure (NYHA Class III → Class II on discharge) | EF: 35%
2. Chronic Kidney Disease Stage 3 (eGFR 38 mL/min/1.73m²)
3. Hypertension (Known case — 15 years, on multiple antihypertensives)
4. Anemia of Chronic Kidney Disease (Hb 9.8 g/dL)

INVESTIGATIONS:
- BNP: 892 pg/mL (admission) → 210 pg/mL (discharge — improved)
- Serum Creatinine: 2.1 mg/dL | eGFR: 38 mL/min (CKD Stage 3)
- Serum Potassium: 5.2 mEq/L (high-normal — MONITOR CLOSELY)
- Serum Sodium: 132 mEq/L (mild dilutional hyponatremia)
- Hemoglobin: 9.8 g/dL (anemia of CKD)
- Chest X-Ray: Bilateral pleural effusions (now resolving post-diuresis)
- 2D Echo: EF 35%, dilated LV, Grade II diastolic dysfunction

DISCHARGE MEDICATIONS:
1. Tab Furosemide 40mg — Once daily MORNING (weigh every morning — if weight up >2kg, call doctor)
2. Tab Losartan 50mg — Once daily (reduced from 100mg due to CKD — do NOT increase without nephrology approval)
3. Tab Carvedilol 6.25mg — Twice daily WITH food (do not stop suddenly)
4. Tab Spironolactone 25mg — Once daily MORNING (monitor potassium closely)
5. Tab Atorvastatin 20mg — Once daily at NIGHT
6. Inj Erythropoietin 4000 IU — Subcutaneous injection 3 times per week (Mon/Wed/Fri) for anemia of CKD

KNOWN ALLERGIES: Penicillin (anaphylaxis), Sulfonamide antibiotics (rash)
NOTE: Furosemide has cross-reactivity with sulfonamides (~10% risk) — patient tolerated during admission — continue with monitoring.

DIET: Strict sodium restriction (<1.5g/day). Fluid restriction to 1.5L/day maximum. Low potassium diet.
FOLLOW UP: Cardiology in 1 week. Nephrology in 2 weeks.
EMERGENCY: Return IMMEDIATELY if weight gain >2kg, worsening breathlessness, or legs swelling rapidly.
DISCHARGE WEIGHT: 68kg (admitted at 74kg — 6kg fluid removed)
"""
}
