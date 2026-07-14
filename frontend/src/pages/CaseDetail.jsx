import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  Alert,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material'
import { 
  ArrowLeft, 
  Activity, 
  Pill, 
  FlaskConical, 
  AlertTriangle, 
  HeartPulse, 
  ShieldAlert, 
  FileText,
  User,
  Brain,
  CheckCircle,
  Sparkles,
  ClipboardCheck
} from 'lucide-react'

const STEPS = ['Document Uploaded', 'Entities Extracted', 'Rules Applied', 'Plan Approved']
const STEP_FOR_STATUS = { uploaded: 1, processing: 2, review_required: 3, ready: 3, approved: 4 }

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [processing, setProc]   = useState(false)
  const [generating, setGen]    = useState(false)
  const [error, setError]       = useState(null)

  const load = () => api.getCase(id).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const handleProcess = async () => {
    setProc(true); setError(null)
    try { await api.processCase(id); setLoading(true); await load() }
    catch (e) { setError(e.message) }
    finally { setProc(false) }
  }

  const handleGenerate = async () => {
    setGen(true); setError(null)
    try { await api.generatePlan(id); navigate(`/cases/${id}/plan`) }
    catch (e) { setError(e.message) }
    finally { setGen(false) }
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 500, borderRadius: 16, marginTop: 32 }} /></div>
  if (!data)   return <div className="page-content"><Alert severity="error">Case folder not found.</Alert></div>

  const { patient, extracted_entities: ent, resolved_rules: rules, status, human_review_flags: flags = [] } = data
  const isProcessed = !!ent
  const step = STEP_FOR_STATUS[status] || 1

  return (
    <Box>
      {/* Topbar navigation details */}
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: '1px solid #eee8e1', 
        p: '18px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ClipboardCheck size={24} /> {patient?.name || 'Case Folder'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
            Case ID: {id} · {patient?.age}y {patient?.sex} · Ref Status: {status.replace(/_/g, ' ')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!isProcessed && (
            <Button variant="contained" onClick={handleProcess} disabled={processing} startIcon={<Sparkles size={16} />}>
              {processing ? 'Running Engine...' : 'Run Extraction'}
            </Button>
          )}
          {isProcessed && !data.has_care_plan && (
            <Button variant="contained" color="success" onClick={handleGenerate} disabled={generating} startIcon={<Brain size={16} />}>
              {generating ? 'Compiling Plan...' : 'Compile Care Plan'}
            </Button>
          )}
          {data.has_care_plan && (
            <Button variant="contained" onClick={() => navigate(`/cases/${id}/plan`)} startIcon={<FileText size={16} />}>
              View Care Plan
            </Button>
          )}
          <Button variant="outlined" size="small" onClick={() => navigate('/')} startIcon={<ArrowLeft size={14} />}>
            Dashboard
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        )}

        {/* Clinical Pipeline Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 2 }}>
              Clinical Extraction Pipeline
            </Typography>
            <Stepper activeStep={step - 1} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Profile Card & Alerts Columns */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, mb: 4 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px dashed #eee8e1' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <User size={18} /> Demographics
                  </Typography>
                  <Chip size="small" label={status.replace(/_/g, ' ')} color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }} />
                </Box>

                {[
                  ['Patient Name', patient?.name],
                  ['Age / Sex', `${patient?.age}y / ${patient?.sex}`],
                  ['Weight (kg)', patient?.weight_kg ? `${patient.weight_kg} kg` : '—'],
                  ['Blood Group', patient?.blood_group || '—'],
                  ['Emergency Contact', patient?.contact || '—'],
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px dashed #eee8e1', '&:last-child': { borderBottom: 0 } }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{k}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{v}</Typography>
                  </Box>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Known Allergies</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: patient?.allergies?.length ? 'error.main' : 'success.main' }}>
                    {patient?.allergies?.length ? patient.allergies.join(', ').toUpperCase() : 'NKDA (None Known)'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
            {flags.length > 0 ? (
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, pb: 1, borderBottom: '1px dashed #eee8e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={18} style={{ color: '#e11d48' }} /> Audit Warnings
                  </Typography>
                  <Chip size="small" label={`${flags.length} Flags`} color="error" sx={{ fontWeight: 800 }} />
                </Box>
                <Box sx={{ p: 3, flex: 1, overflowY: 'auto', maxHeight: 270 }}>
                  {flags.map((f, i) => (
                    <Alert 
                      key={i} 
                      severity={f.severity === 'critical' ? 'error' : f.severity === 'high' ? 'warning' : 'info'}
                      sx={{ mb: 2, '&:last-child': { mb: 0 } }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{f.title}</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.2 }}>{f.message}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.8, fontWeight: 700, color: 'text.primary' }}>
                        Action: {f.action_required}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Card>
            ) : (
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileText size={18} /> Discharge Summary Data
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.default', 
                    border: '1px solid #eee8e1', 
                    borderRadius: 3, 
                    p: 2,
                    maxHeight: 250,
                    overflowY: 'auto'
                  }}>
                    <pre style={{ 
                      fontSize: '0.78rem', 
                      color: '#4b5563', 
                      fontFamily: 'Courier New, monospace', 
                      lineHeight: 1.5, 
                      whiteSpace: 'pre-wrap',
                      margin: 0
                    }}>
                      {data.discharge_text}
                    </pre>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>

        {/* Extracted Findings Card */}
        {isProcessed && ent && (
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ borderBottom: '1px dashed #eee8e1', pb: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Activity size={18} /> Clinical Findings Profile
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
                  Entity profiles extracted from discharge summary payload
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Diagnoses */}
                {ent.diseases?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <HeartPulse size={16} /> Extracted Diagnoses
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {ent.diseases.map(d => (
                        <Chip 
                          key={d.code}
                          label={`${d.name} (${d.icd10})`}
                          sx={{ bgcolor: 'primary.light' + '10', color: 'primary.dark', border: '1px solid', borderColor: 'primary.light' + '25' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Prescriptions */}
                {ent.drugs?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Pill size={16} /> Extracted Prescriptions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {ent.drugs.map(d => (
                        <Chip 
                          key={d.code}
                          label={`${d.name} ${d.dose ? `(${d.dose})` : ''}`}
                          sx={{ bgcolor: 'info.light' + '10', color: 'info.dark', border: '1px solid', borderColor: 'info.light' + '25' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Lab parameters */}
                {ent.lab_values?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <FlaskConical size={16} /> Lab Measurements
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {ent.lab_values.map(l => (
                        <Chip 
                          key={l.test}
                          label={`${l.test}: ${l.value} ${l.unit}`}
                          color={l.is_critical ? 'error' : 'default'}
                          variant={l.is_critical ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Allergens */}
                {ent.allergies?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ShieldAlert size={16} /> Allergen Indicators
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {ent.allergies.map(a => (
                        <Chip 
                          key={a.allergen}
                          label={a.allergen.toUpperCase()}
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Vitals */}
                {ent.vitals && Object.keys(ent.vitals).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Activity size={16} /> Extracted Vitals
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(ent.vitals).map(([k, v]) => (
                        <Chip 
                          key={k}
                          label={`${k.replace(/_/g,' ').toUpperCase()}: ${v}`}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Rule Interaction Alerts */}
                {rules?.allergy_alerts?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ShieldAlert size={16} /> Severe Prescription Contraindications
                    </Typography>
                    {rules.allergy_alerts.map((a, i) => (
                      <Alert severity="error" sx={{ mb: 1.5, '&:last-child': { mb: 0 } }} key={i}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{a.message}</Typography>
                        {a.alternatives?.length > 0 && (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5, fontWeight: 600 }}>
                            Clinical Alternatives: {a.alternatives.join(', ')}
                          </Typography>
                        )}
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* Contraindications */}
                {rules?.conflicts?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AlertTriangle size={16} /> Disease-to-Drug Conflicts
                    </Typography>
                    {rules.conflicts.map((c, i) => (
                      <Alert severity="warning" sx={{ mb: 1.5, '&:last-child': { mb: 0 } }} key={i}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>{c.type}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{c.disease1} & {c.disease2} Conflict: {c.message}</Typography>
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* Demographics protocol adjustments */}
                {rules?.age_adjustments?.length > 0 && (
                  <Box>
                    <Paper sx={{ p: 2.5, bgcolor: 'background.default', border: '1px solid #eee8e1', borderRadius: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Brain size={16} /> Age Group Protocol Adjustments ({rules.age_group})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {rules.age_adjustments.map((a, i) => (
                          <Typography key={i} variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✦</span> {a}
                          </Typography>
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Process placeholder card */}
        {!isProcessed && (
          <Card sx={{ mt: 3, p: 4, textAlign: 'center' }}>
            <Box sx={{ color: 'primary.main', mb: 2, display: 'flex', justifyContent: 'center' }}><Activity size={48} strokeWidth={1.5} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', mb: 1 }}>Case Ready for Processing</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, maxWidth: 450, mx: 'auto' }}>
              Run the clinical rules engine to identify contraindications, dosage alerts, and compile clinical safety flags.
            </Typography>
            <Button variant="contained" size="large" onClick={handleProcess} disabled={processing}>
              {processing ? <CircularProgress size={24} color="inherit" /> : 'Run Extraction Engine'}
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  )
}
