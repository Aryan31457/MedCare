import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGeminiStatus, fetchCases, fetchStats } from '../redux/dataSlice'
import { api } from '../api/client.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  OutlinedInput
} from '@mui/material'
import {
  User,
  Sparkles,
  Binary,
  ChevronRight,
  ArrowLeft,
  FileText,
  Bot,
  Activity,
  Brain,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'

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
  const [activeStep, setActiveStep] = useState(0)
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
  const [genResult, setGenResult] = useState(null)

  const dispatch = useDispatch()
  const { geminiEnabled: geminiReady, geminiStatus } = useSelector(state => state.data)

  const set = (field) => (e) => setPatient(p => ({ ...p, [field]: e.target.value }))

  // Check if Gemini is configured on mount
  useEffect(() => {
    if (geminiStatus === 'idle') {
      dispatch(fetchGeminiStatus())
    }
  }, [geminiStatus, dispatch])

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
      setActiveStep(1)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleCase = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const c = await api.createCase({ patient_id: patientId, discharge_text: docText })
      setCaseId(c.id)
      setActiveStep(2)
      dispatch(fetchCases(true))
      dispatch(fetchStats(true))
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

  const STEPS = ['Patient Profile', 'Discharge Text', 'AI Synthesis']

  return (
    <Box>
      {/* Topbar */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid #eee8e1', 
        p: '18px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em' }}>
            New Discharge Case
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
            Register patient details and generate home recovery plan
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
      </Box>

      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        {/* Stepper Component */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Patient Profile */}
        {activeStep === 0 && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ color: 'primary.main' }}><User size={22} /></Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Patient Demographics</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Input patient metadata to generate custom follow-ups</Typography>
                </Box>
              </Box>

              <form onSubmit={handlePatient}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      placeholder="Ramesh Kumar"
                      value={patient.name}
                      onChange={set('name')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Age (years)"
                      type="number"
                      placeholder="65"
                      value={patient.age}
                      onChange={set('age')}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Sex</InputLabel>
                      <Select value={patient.sex} label="Sex" onChange={set('sex')}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Weight (kg)</InputLabel>
                      <OutlinedInput
                        type="number"
                        inputProps={{ step: '0.1' }}
                        label="Weight (kg)"
                        placeholder="70.0"
                        value={patient.weight_kg}
                        onChange={set('weight_kg')}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Blood Group</InputLabel>
                      <Select value={patient.blood_group} label="Blood Group" onChange={set('blood_group')}>
                        <MenuItem value="">Unknown</MenuItem>
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                          <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Known Drug Allergies"
                      placeholder="e.g. penicillin, sulfonamide (comma separated)"
                      value={patient.allergies}
                      onChange={set('allergies')}
                      helperText="If no allergies, leave blank or type none."
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Emergency Contact Info"
                      placeholder="Name — Phone Number"
                      value={patient.contact}
                      onChange={set('contact')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Address"
                      placeholder="City, State"
                      value={patient.address}
                      onChange={set('address')}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3.5 }} />

                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{ height: 48, fontSize: '0.95rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <>Continue to Document Upload <ChevronRight size={16} style={{ marginLeft: 6 }} /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Discharge Document */}
        {activeStep === 1 && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ color: 'primary.main' }}><FileText size={22} /></Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Discharge Summary Text</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Paste clinical diagnosis notes, prescriptions, and vital thresholds</Typography>
                </Box>
              </Box>

              <Alert severity="info" icon={<Lightbulb size={20} />} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Sandbox Sandbox Demo templates:</Typography>
                <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mt: 1 }}>
                  {Object.keys(SAMPLES).map(k => (
                    <Button 
                      key={k} 
                      variant="outlined" 
                      size="small" 
                      onClick={() => setDocText(SAMPLES[k])}
                      sx={{ bgcolor: 'background.paper', fontSize: '0.75rem', py: 0.5 }}
                    >
                      {k.split('—')[0].trim()}
                    </Button>
                  ))}
                </Box>
              </Alert>

              <form onSubmit={handleCase}>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  label="Discharge Summary text"
                  placeholder="Paste medical text here..."
                  value={docText}
                  onChange={e => setDocText(e.target.value)}
                  required
                  sx={{ 
                    mb: 1.5,
                    '& .MuiInputBase-input': { fontFamily: 'Courier New, monospace', fontSize: '0.82rem', lineHeight: 1.6 }
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: 'text.secondary', mb: 3.5 }}>
                  {docText.length} characters · {docText.trim() ? docText.split('\n').length : 0} lines
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" onClick={() => setActiveStep(0)} sx={{ flex: 1, height: 46 }}>
                    Edit Demographics
                  </Button>
                  <Button variant="contained" type="submit" disabled={loading || !docText.trim()} sx={{ flex: 2, height: 46 }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : <>Upload & Continue <ChevronRight size={16} style={{ marginLeft: 6 }} /></>}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Synthesis Selection */}
        {activeStep === 2 && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ color: 'primary.main' }}><Bot size={22} /></Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Generation Logic</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Choose the rule synthesis backend</Typography>
                </Box>
              </Box>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Rule-Based NLP Mode */}
                <Grid item xs={12} sm={6}>
                  <Paper 
                    onClick={() => setAiMode(MODE_NLP)}
                    sx={{ 
                      p: 3, 
                      cursor: 'pointer',
                      borderRadius: 4,
                      border: '2px solid',
                      borderColor: aiMode === MODE_NLP ? 'primary.main' : 'divider',
                      bgcolor: aiMode === MODE_NLP ? 'primary.light' + '08' : 'background.paper',
                      transition: 'all 0.25s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Box sx={{ color: 'primary.main', mb: 1.5 }}><Binary size={28} /></Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Deterministic NLP</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        Resolves keyword extractions & matches to database templates offline. Safe and structured.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Chip label="Offline" size="small" sx={{ fontSize: '0.68rem', bgcolor: 'primary.light' + '15', color: 'primary.dark' }} />
                      <Chip label="Instant" size="small" sx={{ fontSize: '0.68rem', bgcolor: 'primary.light' + '15', color: 'primary.dark' }} />
                    </Box>
                  </Paper>
                </Grid>

                {/* Gemini AI Mode */}
                <Grid item xs={12} sm={6}>
                  <Paper 
                    onClick={() => geminiReady && setAiMode(MODE_GEMINI)}
                    sx={{ 
                      p: 3, 
                      cursor: geminiReady ? 'pointer' : 'not-allowed',
                      borderRadius: 4,
                      border: '2px solid',
                      borderColor: aiMode === MODE_GEMINI ? '#8b5cf6' : 'divider',
                      bgcolor: aiMode === MODE_GEMINI ? 'rgba(139, 92, 246, 0.05)' : geminiReady ? 'background.paper' : 'rgba(0,0,0,0.02)',
                      opacity: geminiReady ? 1 : 0.65,
                      transition: 'all 0.25s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    {!geminiReady && (
                      <Chip 
                        label="Key Pending" 
                        size="small" 
                        color="warning" 
                        sx={{ position: 'absolute', top: 12, right: 12, fontSize: '0.65rem', fontWeight: 800 }} 
                      />
                    )}
                    <Box>
                      <Box sx={{ color: geminiReady ? '#8b5cf6' : 'text.disabled', mb: 1.5 }}><Sparkles size={28} /></Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Gemini AI Model</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        Sends text payload to Gemini models. Resolves complex free-text, unstructured follow-up directions.
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      {geminiReady ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label="Cloud AI" size="small" sx={{ fontSize: '0.68rem', bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />
                          <Chip label="Free Text" size="small" sx={{ fontSize: '0.68rem', bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.72rem', color: 'warning.main', bgcolor: 'rgba(234, 88, 12, 0.08)', p: 1, borderRadius: 1.5 }}>
                          Add your key to the backend environment variables to enable.
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Generate actions */}
              {!genResult && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGenerate}
                  disabled={loading}
                  sx={{
                    height: 48,
                    fontSize: '0.95rem',
                    background: aiMode === MODE_GEMINI ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'primary.main',
                    '&:hover': {
                      background: aiMode === MODE_GEMINI ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'primary.dark',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : aiMode === MODE_GEMINI ? (
                    'Synthesize Plan with Gemini AI'
                  ) : (
                    'Run Extraction & Rule Compile'
                  )}
                </Button>
              )}

              {/* Success Result Panel */}
              {genResult && (
                <Box>
                  {genResult.fallback_used && (
                    <Alert severity="warning" sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Gemini AI Offline Fallback</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{genResult.fallback_reason}</Typography>
                    </Alert>
                  )}

                  <Alert 
                    severity="success" 
                    icon={<CheckCircle size={20} />} 
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Care Plan Compiled Successfully!</Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1 }}>
                      <Typography variant="caption">Backend: <strong>{genResult.generation_method === 'gemini' ? 'Gemini AI' : 'NLP rules'}</strong></Typography>
                      <Typography variant="caption">Confidence Score: <strong>{Math.round((genResult.confidence_score || 0) * 100)}%</strong></Typography>
                      <Typography variant="caption">Requires Audit: <strong>{genResult.requires_review ? 'Yes' : 'No'}</strong></Typography>
                    </Box>
                  </Alert>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/cases/${caseId}`)}
                      sx={{ flex: 2, height: 46 }}
                    >
                      Open Case Folder
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => { setGenResult(null); setError(null) }}
                      sx={{ flex: 1, height: 46 }}
                    >
                      Reset
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}
