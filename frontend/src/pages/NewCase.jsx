import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const SAMPLES = {
  'Ramesh Kumar — Post-MI + T2DM + HTN (65M, Complex)': `DISCHARGE SUMMARY
Patient: Ramesh Kumar | Age: 65 years | Sex: Male | IP No: MED-2026-0341
Admission: 12/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology (ICU → General)

PRIMARY DIAGNOSIS:
1. Acute Myocardial Infarction (STEMI — Anterior wall) — Post Primary PCI with Drug-Eluting Stent to LAD
2. Type 2 Diabetes Mellitus (Known case — 10 years)
3. Hypertension (Known case — 8 years)

INVESTIGATIONS:
- Troponin I: 45.2 ng/mL (critically elevated)
- HbA1c: 8.4%
- Fasting Blood Glucose: 184 mg/dL
- Serum Creatinine: 1.2 mg/dL | eGFR: 62 mL/min
- Blood Pressure: 160/100 mmHg
- Hemoglobin: 12.8 g/dL
- Serum Potassium: 3.9 mEq/L

DISCHARGE MEDICATIONS:
1. Tab Aspirin 75mg — Once daily AFTER breakfast
2. Tab Clopidogrel 75mg — Once daily AFTER breakfast
3. Tab Atorvastatin 80mg — Once daily at NIGHT
4. Tab Metoprolol 25mg — Twice daily
5. Tab Lisinopril 5mg — Once daily MORNING
6. Tab Metformin 500mg — Twice daily WITH meals
7. Tab Amlodipine 5mg — Once daily

ALLERGIES: Penicillin (rash and urticaria)
DIET: Diabetic + Cardiac diet. Low salt. Low fat. Low sugar.
FOLLOW UP: Cardiology in 1 week. Endocrinology in 4 weeks.`,

  'Priya Sharma — Typhoid Recovery (32F, Simple)': `DISCHARGE SUMMARY
Patient: Priya Sharma | Age: 32 years | Sex: Female | IP No: MED-2026-0562
Admission: 09/06/2026 | Discharge: 16/06/2026 | Ward: General Medicine

PRIMARY DIAGNOSIS:
1. Enteric Fever (Typhoid) — Blood culture positive: Salmonella typhi

INVESTIGATIONS:
- Blood Culture: Salmonella typhi (sensitive to cefixime)
- Widal Test: O 1:320, H 1:320
- Hemoglobin: 10.8 g/dL | WBC: 3.2 x 10^9/L
- Serum Creatinine: 0.8 mg/dL | eGFR: 95 mL/min
- Liver enzymes: ALT 68, AST 72 (mild elevation)
- Temperature on admission: 103.4°F

DISCHARGE MEDICATIONS:
1. Tab Cefixime 400mg — Twice daily for 7 more days
2. Tab Paracetamol 500mg — Only if fever
3. ORS sachet — As needed for hydration

ALLERGIES: None Known (NKDA)
DIET: Typhoid diet — soft, easily digestible, bland food only. Avoid spicy/oily food.`,

  'Arjun Singh — CHF + CKD3 + HTN (72M, High Complexity)': `DISCHARGE SUMMARY
Patient: Arjun Singh | Age: 72 years | Sex: Male | IP No: MED-2026-0489
Admission: 05/06/2026 | Discharge: 16/06/2026 | Ward: Cardiology

PRIMARY DIAGNOSIS:
1. Decompensated Congestive Heart Failure (NYHA Class III → Class II) | EF: 35%
2. Chronic Kidney Disease Stage 3 (eGFR 38 mL/min)
3. Hypertension (Known case — 15 years)

INVESTIGATIONS:
- BNP: 210 pg/mL (discharge) | Serum Creatinine: 2.1 mg/dL
- eGFR: 38 mL/min | Serum Potassium: 5.2 mEq/L
- Hemoglobin: 9.8 g/dL | Blood Pressure: 150/95 mmHg

DISCHARGE MEDICATIONS:
1. Tab Furosemide 40mg — Once daily MORNING
2. Tab Losartan 50mg — Once daily
3. Tab Carvedilol 6.25mg — Twice daily WITH food
4. Tab Spironolactone 25mg — Once daily MORNING
5. Tab Atorvastatin 20mg — Once daily NIGHT

ALLERGIES: Penicillin (anaphylaxis), Sulfonamide antibiotics (rash)
DIET: Strict sodium restriction (<1.5g/day). Fluid restriction (1.5L/day). Low potassium diet.`,
}

const MODE_NLP    = 'nlp'
const MODE_GEMINI = 'gemini'

export default function NewCase() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [patient, setPatient] = useState({
    name:'', age:'', sex:'Male', weight_kg:'',
    blood_group:'', allergies:'', contact:'', address:''
  })
  const [docText, setDocText]     = useState('')
  const [patientId, setPatientId] = useState(null)
  const [caseId, setCaseId]       = useState(null)
  const [aiMode, setAiMode]       = useState(MODE_NLP)
  const [geminiReady, setGeminiReady] = useState(false)
  const [genResult, setGenResult] = useState(null)

  const set = (field) => (e) => setPatient(p => ({ ...p, [field]: e.target.value }))

  // Check if Gemini is configured on mount
  useEffect(() => {
    api.getGeminiStatus()
      .then(r => setGeminiReady(r.gemini_configured))
      .catch(() => setGeminiReady(false))
  }, [])

  const handlePatient = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const p = await api.createPatient({
        ...patient,
        age: parseInt(patient.age),
        weight_kg: parseFloat(patient.weight_kg) || null,
        allergies: patient.allergies
          ? patient.allergies.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      })
      setPatientId(p.id)
      setStep(2)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleCase = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const c = await api.createCase({ patient_id: patientId, discharge_text: docText })
      setCaseId(c.id)
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    setLoading(true); setError(null); setGenResult(null)
    try {
      let result
      if (aiMode === MODE_GEMINI) {
        result = await api.generatePlanGemini(caseId)
      } else {
        await api.processCase(caseId)
        result = await api.generatePlan(caseId)
      }
      setGenResult(result)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const STEPS = ['Patient Details', 'Discharge Document', 'Generate Plan']

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">New Discharge Case</div>
          <div className="topbar-sub">Register patient and generate a care plan</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back</button>
        </div>
      </div>

      <div className="page-content">
        {/* Step indicators */}
        <div className="pipeline-steps" style={{ marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={label} className="pipeline-step">
              <div className={`step-circle ${step > i+1 ? 'done' : step === i+1 ? 'active' : 'pending'}`}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="alert danger" style={{ marginBottom: 20 }}>
            <span className="alert-icon">❌</span>
            <div className="alert-content"><div className="alert-title">{error}</div></div>
          </div>
        )}

        {/* ── Step 1: Patient Details ── */}
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">👤 Patient Demographics</div>
                <div className="card-subtitle">Basic patient information for this discharge case</div>
              </div>
            </div>
            <form onSubmit={handlePatient}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required placeholder="Ramesh Kumar" value={patient.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age (years) *</label>
                  <input className="form-input" type="number" required min={0} max={120} placeholder="65" value={patient.age} onChange={set('age')} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Sex *</label>
                  <select className="form-select" value={patient.sex} onChange={set('sex')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input className="form-input" type="number" step="0.1" placeholder="70.0" value={patient.weight_kg} onChange={set('weight_kg')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={patient.blood_group} onChange={set('blood_group')}>
                    <option value="">Unknown</option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Known Drug Allergies <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(comma-separated, e.g. penicillin, sulfonamide)</span></label>
                <input className="form-input" placeholder="penicillin, sulfonamide" value={patient.allergies} onChange={set('allergies')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input className="form-input" placeholder="Name — Phone Number" value={patient.contact} onChange={set('contact')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="City, State" value={patient.address} onChange={set('address')} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Saving Patient...</> : 'Continue → Upload Document'}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Discharge Document ── */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📄 Discharge Document</div>
                <div className="card-subtitle">Paste the discharge summary text (OCR output or typed)</div>
              </div>
            </div>

            <div className="alert info" style={{ marginBottom: 20 }}>
              <span className="alert-icon">💡</span>
              <div className="alert-content">
                <div className="alert-title">Load a sample document to demo the system</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {Object.keys(SAMPLES).map(k => (
                    <button key={k} type="button" className="btn btn-ghost btn-sm" onClick={() => setDocText(SAMPLES[k])}>
                      {k.split('—')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleCase}>
              <div className="form-group">
                <label className="form-label">Discharge Summary Text *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 340, fontFamily: 'Courier New, monospace', fontSize: '0.82rem', lineHeight: 1.7 }}
                  required
                  placeholder="Paste discharge summary here — or click a sample above to load demo data..."
                  value={docText}
                  onChange={e => setDocText(e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {docText.length} characters · {docText.split('\n').length} lines
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Edit Patient</button>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !docText.trim()}>
                  {loading ? <><span className="spinner" /> Creating Case...</> : '🚀 Continue → Choose AI Mode'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: AI Mode Selector + Generate ── */}
        {step === 3 && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">🤖 Choose Generation Method</div>
                <div className="card-subtitle">Select how you want the care plan to be generated</div>
              </div>
            </div>

            {/* AI Mode Toggle */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              {/* NLP Card */}
              <div
                id="mode-nlp"
                onClick={() => setAiMode(MODE_NLP)}
                style={{
                  flex: 1, cursor: 'pointer', borderRadius: 14, padding: '20px 22px',
                  border: `2px solid ${aiMode === MODE_NLP ? 'var(--primary)' : 'var(--border)'}`,
                  background: aiMode === MODE_NLP ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                  transition: 'all 0.2s',
                  boxShadow: aiMode === MODE_NLP ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔬</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>Rule-Based NLP</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Fast, deterministic. Uses keyword extraction + hard-coded medical rules. Works offline. Best for known diagnoses.
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={tagStyle('#22c55e')}>⚡ Instant</span>
                  <span style={tagStyle('#6366f1')}>🔒 Offline</span>
                  <span style={tagStyle('#f59e0b')}>6 diseases</span>
                </div>
              </div>

              {/* Gemini Card */}
              <div
                id="mode-gemini"
                onClick={() => geminiReady && setAiMode(MODE_GEMINI)}
                style={{
                  flex: 1, cursor: geminiReady ? 'pointer' : 'not-allowed',
                  borderRadius: 14, padding: '20px 22px',
                  border: `2px solid ${aiMode === MODE_GEMINI ? '#a855f7' : 'var(--border)'}`,
                  background: aiMode === MODE_GEMINI
                    ? 'rgba(168,85,247,0.08)'
                    : geminiReady ? 'var(--surface)' : 'rgba(0,0,0,0.03)',
                  opacity: geminiReady ? 1 : 0.6,
                  transition: 'all 0.2s',
                  boxShadow: aiMode === MODE_GEMINI ? '0 0 0 3px rgba(168,85,247,0.18)' : 'none',
                  position: 'relative',
                }}
              >
                {!geminiReady && (
                  <div style={{
                    position: 'absolute', top: 10, right: 12,
                    background: '#f59e0b', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                  }}>API KEY REQUIRED</div>
                )}
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✨</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  Gemini AI
                  <span style={{ marginLeft: 8, fontSize: '0.65rem', fontWeight: 600,
                    background: 'linear-gradient(135deg,#a855f7,#6366f1)', color:'#fff',
                    padding:'2px 8px', borderRadius:20 }}>NEW</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  AI-powered. Understands free-text clinically. Handles any diagnosis, drug, or language. Generates richer, personalized plans.
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={tagStyle('#a855f7')}>🧠 Intelligent</span>
                  <span style={tagStyle('#6366f1')}>📋 Any diagnosis</span>
                  <span style={tagStyle('#ec4899')}>🌐 Cloud</span>
                </div>
                {!geminiReady && (
                  <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--amber)',
                    background: 'rgba(245,158,11,0.1)', borderRadius: 8, padding: '6px 10px' }}>
                    Add your key to <code style={{ fontFamily: 'monospace' }}>backend/.env</code> → <code>GEMINI_API_KEY=...</code>
                  </div>
                )}
              </div>
            </div>

            {/* Selected mode summary */}
            <div style={{
              background: aiMode === MODE_GEMINI
                ? 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(99,102,241,0.08))'
                : 'rgba(99,102,241,0.06)',
              border: `1px solid ${aiMode === MODE_GEMINI ? 'rgba(168,85,247,0.3)' : 'rgba(99,102,241,0.2)'}`,
              borderRadius: 10, padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.4rem' }}>{aiMode === MODE_GEMINI ? '✨' : '🔬'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {aiMode === MODE_GEMINI ? 'Gemini AI selected' : 'Rule-Based NLP selected'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {aiMode === MODE_GEMINI
                    ? 'The discharge text will be sent directly to Gemini 2.0 Flash. No NLP pre-processing needed.'
                    : 'Discharge text will be parsed by keyword NLP → rule engine → template generator.'}
                </div>
              </div>
            </div>

            {/* Generate button */}
            {!genResult && (
              <button
                id="btn-generate-plan"
                className="btn btn-primary btn-lg"
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  background: aiMode === MODE_GEMINI
                    ? 'linear-gradient(135deg,#a855f7,#6366f1)'
                    : undefined,
                  width: '100%',
                }}
              >
                {loading
                  ? <><span className="spinner" /> {aiMode === MODE_GEMINI ? 'Gemini is thinking...' : 'Processing & Generating...'}</>
                  : aiMode === MODE_GEMINI
                    ? '✨ Generate with Gemini AI'
                    : '🔬 Generate with NLP Engine'}
              </button>
            )}

            {/* Success result */}
            {genResult && (
              <div style={{ marginTop: 4 }}>
                {/* Fallback warning if Gemini was tried but NLP was used */}
                {genResult.fallback_used && (
                  <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12,
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: 2, fontSize: '0.88rem' }}>
                        Gemini unavailable — fell back to NLP Engine
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {genResult.fallback_reason}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 10, padding: '16px 20px',
                  display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
                      Care Plan Generated Successfully!
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>Method: <strong>{genResult.generation_method === 'gemini' ? '✨ Gemini AI' : '🔬 Rule-Based NLP'}</strong></span>
                      <span>Confidence: <strong>{Math.round((genResult.confidence_score || 0) * 100)}%</strong></span>
                      <span>Needs Review: <strong>{genResult.requires_review ? '⚠️ Yes' : '✅ No'}</strong></span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate(`/cases/${caseId}`)}
                    style={{ flex: 1 }}
                  >
                    View Case & Care Plan →
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setGenResult(null); setError(null) }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function tagStyle(color) {
  return {
    fontSize: '0.7rem', fontWeight: 600,
    padding: '2px 8px', borderRadius: 20,
    background: `${color}20`, color: color,
    border: `1px solid ${color}40`,
  }
}
