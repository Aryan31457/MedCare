import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Utensils,
  Activity,
  Pill,
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  HeartPulse,
  UserCheck,
  CheckCircle,
  ShieldCheck,
  Clock3,
  FlameKindling,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  FlaskConical
} from 'lucide-react'

const TABS = [
  { id:'diet',        label:'Diet Plan', Icon: Utensils },
  { id:'exercise',    label:'Exercise', Icon: Activity },
  { id:'medications', label:'Medications', Icon: Pill },
  { id:'dosdonts',    label:"Do's & Don'ts", Icon: CheckSquare },
  { id:'schedule',    label:'Daily Schedule', Icon: Clock },
  { id:'timeline',    label:'Timeline', Icon: Calendar },
  { id:'redflags',    label:'Red Flags', Icon: AlertTriangle },
  { id:'note',        label:"Doctor's Note", Icon: FileText },
]

export default function CarePlanView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [tabVal, setTabVal] = useState(0)
  const [modal, setModal]   = useState(false)
  const [approver, setApprover] = useState('')
  const [approving, setApproving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    api.getCarePlan(id)
      .then(setPlan)
      .catch(e => setError(e.message))
      .finally(() => setLoad(false))
  }, [id])

  const approve = async () => {
    if (!approver.trim()) return
    setApproving(true)
    try {
      await api.approveCase(id, { approved_by: approver })
      const updated = await api.getCarePlan(id)
      setPlan(updated); setModal(false)
    } catch (e) { setError(e.message) }
    finally { setApproving(false) }
  }

  const handleTabChange = (event, newValue) => {
    setTabVal(newValue)
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height:500, borderRadius:16, marginTop:32 }} /></div>
  if (!plan)   return <div className="page-content"><Alert severity="error">{error || 'Care plan folder not found.'}</Alert></div>

  const d = plan.plan_data
  const flags = d.human_review_flags || []
  const crit  = flags.filter(f => f.severity==='critical')
  const high  = flags.filter(f => f.severity==='high')
  const confPct = Math.round((d.confidence_score||0)*100)
  const activeTabId = TABS[tabVal].id

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      '& .MuiTypography-body2': { fontSize: '0.92rem' },
      '& .MuiTypography-caption': { fontSize: '0.78rem' },
      '& .MuiTypography-subtitle1': { fontSize: '1.05rem' },
      '& .MuiTypography-subtitle2': { fontSize: '0.92rem' },
    }}>
      {/* Topbar navigation */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid #eee8e1',
        p: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeartPulse size={24} /> {d.patient_name} — Care Plan
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
            Diagnoses: {d.primary_diagnoses?.join(' · ')} · {d.age_group} · Synthesis Assurance: {confPct}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {plan.approved
            ? <Chip label={`Approved · ${plan.approved_by}`} color="success" sx={{ height: 38, fontWeight: 700 }} />
            : <Button variant="contained" color="success" onClick={()=>setModal(true)} startIcon={<UserCheck size={16} />}>Approve Plan</Button>
          }
          <Button variant="outlined" size="small" onClick={()=>navigate(`/cases/${id}`)}>← Case Details</Button>
          <Button variant="outlined" size="small" onClick={()=>navigate('/')}>Dashboard</Button>
        </Box>
      </Box>

      <Box sx={{ p: 4, maxWidth: 1440, mx: 'auto', width: '100%' }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Status and warnings alert */}
        {flags.length > 0 && !plan.approved && (
          <Alert 
            severity={crit.length > 0 ? 'error' : 'warning'} 
            action={
              <Button size="small" color="inherit" onClick={()=>navigate('/review')}>
                Review Queue
              </Button>
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {crit.length > 0 ? `${crit.length} Critical` : ''}{crit.length > 0 && high.length > 0 ? ' + ' : ''}{high.length > 0 ? `${high.length} High Priority` : ''} Warnings Pending physician Sign-off
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.2 }}>
              Verification checks: {flags.slice(0, 2).map(f => f.title).join(' · ')}{flags.length > 2 ? ` +${flags.length - 2} more` : ''}
            </Typography>
          </Alert>
        )}

        {plan.approved && (
          <Alert severity="success" icon={<ShieldCheck size={20} />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Care Plan Approved & Signed Off</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.2 }}>
              Authorized by {plan.approved_by} on {plan.approved_at ? new Date(plan.approved_at).toLocaleString('en-IN') : ''}
            </Typography>
          </Alert>
        )}

        {/* Synthesis statistics metrics card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
                <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Model Synthesis Confidence Profile
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Box sx={{ flexGrow: 1, bgcolor: '#eee8e1', height: 8, borderRadius: 5, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: 'primary.main', height: '100%', width: `${confPct}%` }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>{confPct}%</Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  Verified across {d.primary_diagnoses?.length} primary diagnosis parameters, {d.medications?.length || 0} prescriptions, and {flags.length} safety checks.
                </Typography>
              </Box>

              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  {[
                    ['Critical', crit.length, 'error.main'],
                    ['High', high.length, 'warning.main'],
                    ['Medium', flags.filter(f => f.severity === 'medium').length, 'info.main']
                  ].map(([label, count, color]) => (
                    <Box key={label} sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: count > 0 ? color : 'text.disabled' }}>
                        {count}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.disabled' }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tab Controls Bar */}
        <Paper elevation={0} sx={{ borderBottom: '1px solid #eee8e1', mb: 3.5, borderRadius: 0, bgcolor: 'transparent' }}>
          <Tabs 
            value={tabVal} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1 }}
          >
            {TABS.map((t, idx) => {
              const Icon = t.Icon
              return (
                <Tab 
                  key={t.id} 
                  label={t.label} 
                  icon={<Icon size={16} />} 
                  iconPosition="start"
                  sx={{ fontWeight: 700, minHeight: 48 }}
                />
              )
            })}
          </Tabs>
        </Paper>

        {/* Active Tab Panel Content */}
        <Box>
          {activeTabId === 'diet'        && <DietTab        diet={d.diet_plan}/>}
          {activeTabId === 'exercise'    && <ExerciseTab    ex={d.exercise_plan}/>}
          {activeTabId === 'medications' && <MedsTab        meds={d.medications}/>}
          {activeTabId === 'dosdonts'    && <DosDontsTab    dd={d.dos_and_donts}/>}
          {activeTabId === 'schedule'    && <ScheduleTab    sched={d.daily_schedule}/>}
          {activeTabId === 'timeline'    && <TimelineTab    tl={d.recovery_timeline}/>}
          {activeTabId === 'redflags'    && <RedFlagsTab    rf={d.red_flag_symptoms}/>}
          {activeTabId === 'note'        && <NoteTab        note={d.doctors_note} flags={flags} mon={d.monitoring_schedule}/>}
        </Box>
      </Box>

      {/* Approve Modal Confirmation */}
      <Dialog open={modal} onClose={()=>setModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.dark', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <UserCheck /> Confirm Plan Approval
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {flags.length > 0
              ? `Care plan contains ${flags.length} verification warnings. By checking off, you confirm you have verified these clinical alerts.`
              : 'Approve care guidelines and sync data to patient recovery portal.'}
          </Typography>
          
          {crit.length > 0 && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              Ensure critical cardiac/renal conflict rules are resolved.
            </Alert>
          )}

          <TextField
            fullWidth
            label="Physician Signature Credentials"
            placeholder="Dr. Anil Sharma, MD — Reg# MCI-12345"
            value={approver}
            onChange={e=>setApprover(e.target.value)}
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={()=>setModal(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={approve} disabled={!approver.trim() || approving}>
            {approving ? <CircularProgress size={20} color="inherit" /> : 'Sign off Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/* ── Tab Layout Implementations ────────────────────────────────── */

function InfoPill({ label, value }) {
  if (!value) return null
  return (
    <Card sx={{ minWidth: 165, border: '1px solid #eee8e1', bgcolor: 'background.default', flexGrow: 1 }}>
      <CardContent sx={{ p: '14px 18px', '&:last-child': { pb: '14px' } }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.dark', mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

function DietTab({ diet }) {
  if (!diet) return null
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>{diet.plan_name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{diet.overview}</Typography>
      </Box>

      {/* Target pills */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <InfoPill label="Caloric Target" value={diet.caloric_target} />
        <InfoPill label="Protein Target" value={diet.protein_target} />
        <InfoPill label="Sodium Limit" value={diet.sodium_limit} />
        <InfoPill label="Fluid Limit" value={diet.fluid_limit} />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Daily Meal Breakdown
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {[
          ['Breakfast (Morning)', diet.breakfast, Clock],
          ['Lunch (Afternoon)', diet.lunch, Clock3],
          ['Snacks (Evening)', diet.snacks, Clock],
          ['Dinner (Night)', diet.dinner, Clock3]
        ].map(([time, items, Icon]) => (
          <Box key={time} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', bgcolor: '#fbfaf8', border: '1px solid #eee8e1' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Icon size={16} /> {time}
                </Typography>
                <List dense disablePadding>
                  {items?.map((item, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                      <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.82rem', color: 'text.secondary' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Allowed vs Avoid grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CheckCircle size={16} /> Recommended Foods
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {diet.foods_recommended?.map((f, idx) => (
              <Chip 
                key={idx} 
                label={f} 
                size="small" 
                sx={{ bgcolor: 'success.light' + '10', color: 'success.dark', border: '1px solid', borderColor: 'success.light' + '20' }} 
              />
            ))}
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AlertTriangle size={16} /> Strictly Restricted Foods
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {diet.foods_strictly_restricted?.map((f, idx) => (
              <Chip 
                key={idx} 
                label={f} 
                size="small" 
                sx={{ bgcolor: 'error.light' + '10', color: 'error.dark', border: '1px solid', borderColor: 'error.light' + '20' }} 
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Lab Notes */}
      {diet.lab_based_notes?.length > 0 && (
        <Box sx={{ borderTop: '1px dashed #eee8e1', pt: 3.5, mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FlaskConical size={16} /> Lab-Based Modifications
          </Typography>
          {diet.lab_based_notes.map((note, idx) => (
            <Alert severity="info" key={idx} sx={{ mb: 1.5 }}>{note}</Alert>
          ))}
        </Box>
      )}

      {diet.meal_timing_guidance && (
        <Alert severity="success" icon={<Clock size={20} />} sx={{ bgcolor: 'primary.light' + '05', borderColor: 'primary.light' + '15' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Meal Timing Protocol</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>{diet.meal_timing_guidance}</Typography>
        </Alert>
      )}
    </Box>
  )
}

function ExerciseTab({ ex }) {
  if (!ex) return null
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Activity Protocol</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Current phase target: <strong>{ex.current_phase}</strong></Typography>
      </Box>

      {ex.absolute_exercise_restriction && (
        <Alert severity="error" icon={<AlertTriangle size={20} />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Exercise Restriction Active</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>Reason: {ex.restriction_reason}</Typography>
        </Alert>
      )}

      {/* Recovery Phases */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {[
          ['Phase 1 — Immediate', ex.phase1, Clock],
          ['Phase 2 — Active Recovery', ex.phase2, Activity],
          ['Phase 3 — Rehab protocols', ex.phase3, TrendingUp]
        ].map(([label, p, Icon]) => p && (
          <Box key={label} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%', bgcolor: '#fbfaf8', border: '1px solid #eee8e1' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', mt: 1 }}>{p.type}</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>⏱ Duration: <strong>{p.duration}</strong></Typography>
                  <Chip size="small" label={p.intensity} color="primary" sx={{ fontWeight: 700 }} />
                </Box>
                {p.precautions && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 2, pt: 1.5, borderTop: '1px dashed #eee8e1', color: 'text.secondary' }}>
                    <strong>Precaution:</strong> {p.precautions}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Exercise warnings */}
      {ex.contraindications?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AlertTriangle size={16} /> Warnings & Contraindications
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ex.contraindications.map((c, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>⛔</span> {c}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {ex.pre_exercise_checklist?.length > 0 && (
        <Box sx={{ borderTop: '1px dashed #eee8e1', pt: 3.5, mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CheckCircle size={16} /> Pre-Exercise checklist
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ex.pre_exercise_checklist.map((c, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span> {c}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

function MedsTab({ meds }) {
  if (!meds?.length) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography sx={{ color: 'text.secondary' }}>No medications prescribed.</Typography></Box>
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Post-Discharge Prescriptions</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Clinical map of drug dosages, frequencies, and interaction details</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {meds.map((m, idx) => (
          <Box key={idx} sx={{ height: '100%' }}>
            <Card sx={{ 
              height: '100%',
              borderColor: m.allergy_alert ? 'error.light' : 'divider',
              background: m.allergy_alert ? 'rgba(225,29,72,0.01)' : 'background.paper'
            }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%' }}>
                <Box>
                  {m.allergy_alert && (
                    <Chip label="Allergy Interaction Alert" size="small" color="error" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.65rem' }} />
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: m.allergy_alert ? 'error.main' : 'primary.dark' }}>
                      {m.name}
                    </Typography>
                    <Chip size="small" label={m.class} variant="outlined" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Dose</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.dose}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Frequency</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.frequency}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Timing</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>⏰ {m.timing}</Typography>
                    </Box>
                  </Box>

                  {m.allergy_message && (
                    <Alert severity="error" sx={{ mb: 2, py: 0.2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{m.allergy_message}</Typography>
                    </Alert>
                  )}

                  {m.food_interactions?.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2, py: 0.2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Diet interaction: {m.food_interactions.join('; ')}</Typography>
                    </Alert>
                  )}

                  {m.important_notes?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Directions</Typography>
                      <ul style={{ paddingLeft: 14, margin: '2px 0 0 0', fontSize: '0.8rem', color: '#4b5563' }}>
                        {m.important_notes.map((n, idxNote) => <li key={idxNote}>{n}</li>)}
                      </ul>
                    </Box>
                  )}
                </Box>

                {m.side_effects_to_watch?.length > 0 && (
                  <Box sx={{ borderTop: '1px dashed #eee8e1', pt: 2, mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>Monitor Side Effects</Typography>
                    <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                      {m.side_effects_to_watch.map((s, idxSide) => (
                        <Chip key={idxSide} size="small" label={s} sx={{ fontSize: '0.72rem', bgcolor: 'warning.light' + '10', color: 'warning.dark' }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function DosDontsTab({ dd }) {
  if (!dd) return null
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      <Box sx={{ height: '100%' }}>
        <Paper sx={{ p: 3, border: '1px solid #eee8e1', bgcolor: '#fbfaf8', height: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px dashed #eee8e1' }}>
            <CheckCircle size={18} /> Recommended Guidelines
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(dd.dos||[]).map((item, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span> <span>{item}</span>
              </Typography>
            ))}
          </Box>
        </Paper>
      </Box>
      <Box sx={{ height: '100%' }}>
        <Paper sx={{ p: 3, border: '1px solid #eee8e1', bgcolor: '#fbfaf8', height: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px dashed #eee8e1' }}>
            <AlertTriangle size={18} /> Restricted Activities
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(dd.donts||[]).map((item, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>⛔</span> <span>{item}</span>
              </Typography>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

function ScheduleTab({ sched }) {
  if (!sched?.length) return null
  const icons = { medication: Pill, meal: Utensils, exercise: Activity, rest: Clock3 }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Daily Routine Mapping</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Clinical daily timeline of meals, meds, and activities</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
        {sched.map((s, idx) => {
          const Icon = icons[s.category] || Activity
          return (
            <Box 
              key={idx} 
              sx={{ 
                display: 'flex', 
                gap: 3, 
                p: 2, 
                background: 'var(--bg-base)', 
                border: '1px solid var(--border)', 
                borderRadius: 3, 
                alignItems: 'center' 
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.dark', width: 90 }}>
                {s.time}
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {s.activity}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    size="small" 
                    icon={<Icon size={12} />} 
                    label={s.category.toUpperCase()} 
                    sx={{ fontSize: '0.68rem', fontWeight: 700 }} 
                  />
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

function TimelineTab({ tl }) {
  if (!tl) return null
  const entries = Object.entries(tl)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>Recovery Milestones</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Clinician-guided milestones from post-discharge recovery phases</Typography>
      </Box>

      <Box sx={{ position: 'relative', pl: 3, mt: 2 }}>
        <Box sx={{ position: 'absolute', left: 4, top: 12, bottom: 12, width: 2, bgcolor: '#eee8e1' }} />
        {entries.map(([period, milestones], idx) => (
          <Box key={idx} sx={{ mb: 3.5, position: 'relative', '&:last-child': { mb: 0 } }}>
            <Box sx={{ position: 'absolute', left: -21, top: 6, width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid #fff', boxShadow: '0 0 0 3px rgba(13,148,136,0.1)' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark', mb: 1 }}>{period}</Typography>
            <Paper sx={{ p: 2, border: '1px solid #eee8e1', borderRadius: 3, bgcolor: '#fbfaf8' }}>
              {(Array.isArray(milestones) ? milestones : [milestones]).map((m, j) => (
                <Typography key={j} variant="body2" sx={{ color: 'text.secondary', mb: 0.5, '&:last-child': { mb: 0 } }}>
                  ✦ {m}
                </Typography>
              ))}
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function RedFlagsTab({ rf }) {
  if (!rf?.length) return null
  return (
    <Box>
      <Alert severity="error" sx={{ mb: 3.5, p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Emergency Clinical Symptoms Directive</Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
          Patients must visit the nearest ER or call <strong>108 / 112</strong> immediately if they experience any of these warning signs.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rf.map((f, idx) => (
          <Card key={idx} sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlameKindling size={16} /> Symptom Warning: {f.symptom}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                Related condition parameters: {f.related_condition}
              </Typography>
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', border: '1px solid #eee8e1', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Action Directive:</strong> {f.action}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

function NoteTab({ note, flags, mon }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {flags?.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
            Audit History Flags
          </Typography>
          {flags.map((f, idx) => (
            <Alert 
              key={idx} 
              severity={f.severity === 'critical' ? 'error' : f.severity === 'high' ? 'warning' : 'info'}
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{f.title}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.2 }}>{f.message}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.6, fontWeight: 700, color: 'text.primary' }}>
                Required: {f.action_required}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {mon && Object.keys(mon).length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
            Clinical Follow-Up Monitors
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(mon).map(([test, freq]) => (
              <Grid size={{ xs: 12, sm: 4 }} key={test}>
                <Paper sx={{ p: 2, border: '1px solid #eee8e1', bgcolor: '#fbfaf8' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>{test}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.6, mt: 1 }}>
                    <Clock size={12} /> Frequency: {freq}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
          Physician Verification Note
        </Typography>
        <Paper sx={{ p: 2.5, bgcolor: '#fbfaf8', border: '1px solid #eee8e1', borderRadius: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {note}
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
