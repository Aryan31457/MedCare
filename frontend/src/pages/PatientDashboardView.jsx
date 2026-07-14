import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import {
  getLevel,
  generateDailyTasks,
  completeTaskInState,
  logVitalsInState,
  getMotivationalMessage,
  getTodayCompliance,
  getWeeklyHistory,
  BADGES,
  TASK_CATEGORIES
} from '../patient/gamification.js'
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
  TextField,
  LinearProgress,
  Chip,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Drawer,
  Avatar,
  Divider,
  Tooltip
} from '@mui/material'
import {
  HeartPulse,
  LayoutDashboard,
  Utensils,
  Activity,
  Pill,
  AlertTriangle,
  User,
  LogOut,
  RefreshCw,
  Trophy,
  Flame,
  CheckCircle,
  TrendingUp,
  Clock,
  Clock3,
  Dumbbell,
  ShieldAlert,
  ChevronRight,
  ClipboardCheck,
  Check,
  Sparkles,
  Award,
  Star,
  Zap,
  Bookmark,
  Activity as HeartRateIcon
} from 'lucide-react'

const drawerWidth = 260;

// Icon mappings for badges in UI to remove raw emojis
const BADGE_ICONS = {
  first_step:     Award,
  perfect_day:    Star,
  week_warrior:   Flame,
  streak_legend:  Zap,
  med_master:     Pill,
  move_it:        Dumbbell,
  eat_right:      Utensils,
  monitor_master: TrendingUp,
  recovery_star:  Trophy,
}

const CATEGORY_ICONS = {
  medication: Pill,
  exercise:   Activity,
  diet:       Utensils,
  monitoring: HeartRateIcon,
  rest:       Clock
}

// ── Patient Selection Component (Home Route "/") ────────────────────────────
export function PatientSelector({ onLogout }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getPatientsAll()
      .then(setPatients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Loading recovery profiles...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 120%, #fbfaf5, #f3ede2)',
      p: 3
    }}>
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 5, p: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button 
              size="small" 
              color="error" 
              onClick={onLogout}
              startIcon={<LogOut size={14} />}
              sx={{ fontWeight: 700 }}
            >
              Exit Portal
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', p: 1.5, bgcolor: 'primary.light' + '12', borderRadius: 4, color: 'primary.main', mb: 1.5 }}>
              <HeartPulse size={36} strokeWidth={2.5} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em' }}>
              Companion Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, textAlign: 'center' }}>
              Select your patient account to log goals, earn badges, and sync vitals.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            {patients.map(p => (
              <Button
                key={p.id}
                component={Link}
                to={`/patient/${p.id}`}
                variant="outlined"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  p: 2.2,
                  borderRadius: 3.5,
                  borderColor: '#eee8e1',
                  color: 'text.primary',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light' + '05',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.05)'
                  }
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', lineHeight: 1.2 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    {p.age} years old · {p.sex} · ID: {p.id}
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Enter</Typography>
                  <ChevronRight size={16} />
                </Box>
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

// ── Patient Dashboard Component (Route "/patient/:patientId") ───────────────
export function PatientDashboard({ onLogout }) {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [tabVal, setTabVal] = useState(0) // 0: checklist, 1: diet, 2: exercise, 3: meds, 4: redflags
  
  // Data loading states
  const [plan, setPlan] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Vitals form input states
  const [bp, setBp] = useState('')
  const [glucose, setGlucose] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [vitalsMsg, setVitalsMsg] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getPatientPlan(patientId).catch(err => {
        if (err.message.includes('404')) return null;
        throw err;
      }),
      api.getPatientGamification(patientId)
    ])
      .then(([planData, gameData]) => {
        setPlan(planData)
        setGameState(gameData)
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [patientId])

  const syncState = async (updatedState) => {
    setSyncing(true)
    try {
      const saved = await api.savePatientGamification(patientId, updatedState)
      setGameState(saved)
    } catch (e) {
      console.warn("Failed to sync state to server", e)
    } finally {
      setSyncing(false)
    }
  }

  const handleTaskToggle = async (taskId, xpReward, totalTasksCount) => {
    if (!gameState) return
    const nextState = completeTaskInState(gameState, taskId, xpReward, totalTasksCount)
    setGameState(nextState)
    await syncState(nextState)
  }

  const handleVitalsSubmit = async (e) => {
    e.preventDefault()
    if (!bp && !glucose && !weight) return

    setVitalsMsg('Logging...')
    const nextState = logVitalsInState(gameState, { bp, glucose, weight, notes })
    setGameState(nextState)
    await syncState(nextState)

    setBp('')
    setGlucose('')
    setWeight('')
    setNotes('')
    setVitalsMsg('Vitals saved and synced!')
    setTimeout(() => setVitalsMsg(''), 4000)
  }

  const handleTabChange = (event, newValue) => {
    setTabVal(newValue)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Syncing medical portal...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Card sx={{ maxWidth: 460, textAlign: 'center', p: 3 }}>
          <CardContent>
            <AlertTriangle size={48} style={{ color: 'var(--red)', marginBottom: 16 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Connection Error</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{error}</Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Return to Selection</Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Pending care plan state
  if (!plan) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              borderRight: '1px solid #eee8e1',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pb: 3
            },
          }}
        >
          <Box sx={{ p: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee8e1' }}>
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <HeartPulse size={28} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark', lineHeight: 1.2 }}>MedCare</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Companion</Typography>
            </Box>
          </Box>
          <Box sx={{ px: 2.5 }}>
            <Button variant="outlined" color="error" fullWidth onClick={() => navigate('/')} startIcon={<LogOut size={14} />}>
              Exit Portal
            </Button>
          </Box>
        </Drawer>
        <Box sx={{ flexGrow: 1, p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 500, p: 4, textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ fontSize: '4rem', mb: 2 }}>⏳</Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', mb: 1.5 }}>Discharge Plan Pending Review</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, lineHeight: 1.6 }}>
                Your clinical team is currently auditing your digital care plan guidelines. It will automatically show up here as soon as it's signed off.
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>🔄 Refresh Status</Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    )
  }

  const pData = plan.plan_data
  const tasks = generateDailyTasks(pData)
  const todayDone = gameState ? (gameState.task_log[new Date().toISOString().split('T')[0]] || {}) : {}
  const doneCount = Object.values(todayDone).filter(Boolean).length
  const pctDone = getTodayCompliance(gameState, tasks.length)
  const lvlInfo = getLevel(gameState ? gameState.xp : 0)
  const weeklyHistory = getWeeklyHistory(gameState, tasks.length)
  const motivation = getMotivationalMessage(pctDone, gameState ? gameState.streak : 0)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #eee8e1',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pb: 3
          },
        }}
      >
        <Box>
          {/* Brand Header */}
          <Box sx={{ p: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eee8e1' }}>
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <HeartPulse size={28} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em', lineHeight: 1.2 }}>MedCare</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.2 }}>Patient Companion</Typography>
            </Box>
          </Box>

          <List sx={{ px: 1.5, py: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', px: 2, mb: 1 }}>
              Recovery Panel
            </Typography>

            {[
              ['Recovery Hub', LayoutDashboard, 0],
              ['Diet Plan', Utensils, 1],
              ['Exercise Guide', Activity, 2],
              ['Medications', Pill, 3],
              ['Emergency Guide', AlertTriangle, 4]
            ].map(([label, Icon, idx]) => (
              <ListItem key={label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={tabVal === idx}
                  onClick={() => setTabVal(idx)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.2,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light' + '12',
                      color: 'primary.dark',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'primary.light' + '18' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: tabVal === idx ? 'primary.dark' : 'text.secondary' }}>
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: tabVal === idx ? 600 : 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Profile Card Footer */}
        <Box sx={{ px: 2.5, pt: 2, borderTop: '1px solid #eee8e1' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.light' + '15', color: 'primary.main', width: 36, height: 36 }}>
              <User size={18} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}>
                {plan.patient_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {plan.patient_age}y · {plan.patient_sex}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button size="small" variant="text" onClick={() => navigate('/')} sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 0, textDecoration: 'underline' }}>
              Switch User
            </Button>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>|</Typography>
            <Button size="small" variant="text" color="error" onClick={onLogout} sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 0, textDecoration: 'underline' }}>
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Companion Dashboard Body */}
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
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
              Welcome back, {plan.patient_name}!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
              Active Recovery Goals: {pData.primary_diagnoses?.join(' · ')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {syncing ? (
              <Chip size="small" variant="outlined" icon={<CircularProgress size={12} />} label="Syncing..." />
            ) : (
              <Chip size="small" color="success" icon={<Check size={12} />} label="Cloud Synced" sx={{ fontWeight: 700 }} />
            )}
          </Box>
        </Box>

        <Box sx={{ p: 4, flexGrow: 1 }}>
          {/* Tab 0: Gamification Dashboard */}
          {tabVal === 0 && (
            <>
              {/* Gamification Level Board */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #0f766e, #0d9488)', 
                color: '#ffffff', 
                borderRadius: 5,
                mb: 3.5,
                boxShadow: '0 8px 32px rgba(13, 148, 136, 0.15)'
              }}>
                <CardContent sx={{ p: 3.5, '&:last-child': { pb: 3.5 } }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, alignItems: 'center' }}>
                    <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.8, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 4 }}>
                        <Trophy size={40} style={{ color: '#fbbf24' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Level {lvlInfo.level}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>{lvlInfo.name}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>XP Progress</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{gameState?.xp} / {lvlInfo.next ? lvlInfo.next.minXP : gameState?.xp} XP</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={lvlInfo.progress} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4, 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': { bgcolor: '#ffffff' }
                        }} 
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.8, opacity: 0.8, fontSize: '0.72rem' }}>
                        {lvlInfo.next ? `${lvlInfo.xpToNext} XP to Level ${lvlInfo.level + 1}` : 'Top Rank Achieved!'}
                      </Typography>
                    </Box>

                    <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' }, display: 'flex', justifyContent: 'space-around', borderLeft: { md: '1px dashed rgba(255,255,255,0.2)' } }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#fb7185' }}>
                          <Flame size={20} fill="#fb7185" />
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{gameState?.streak}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day Streak</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#38bdf8' }}>
                          <CheckCircle size={20} fill="#38bdf8" style={{ color: '#0f766e' }} />
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{doneCount}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done Today</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Motivation Banner Alert */}
              <Alert 
                severity="success" 
                icon={<Sparkles size={20} />} 
                sx={{ 
                  mb: 3.5, 
                  bgcolor: 'primary.light' + '08', 
                  borderColor: 'primary.light' + '15',
                  color: 'primary.dark',
                  '& .MuiAlert-icon': { color: 'primary.main' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{motivation.text}</Typography>
              </Alert>

              {/* Checklist & Log Columns Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3.5 }}>
                {/* Left checklist */}
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
                  <Card sx={{ height: '100%' }}>
                    <Box sx={{ p: 3, pb: 1, borderBottom: '1px dashed #eee8e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClipboardCheck size={20} /> Daily Checklist
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>
                          Log actions to receive recovery XP and maintain streaks
                        </Typography>
                      </Box>
                      <Chip label={`${pctDone}% Done`} color="success" sx={{ fontWeight: 800 }} />
                    </Box>

                    <List sx={{ p: 2 }}>
                      {tasks.map(t => {
                        const done = !!todayDone[t.id]
                        const meta = TASK_CATEGORIES[t.category] || {}
                        const CategoryIcon = CATEGORY_ICONS[t.category] || Clock
                        return (
                          <ListItem 
                            key={t.id}
                            disablePadding
                            sx={{ 
                              mb: 1.5,
                              border: '1px solid',
                              borderColor: done ? 'primary.light' + '15' : '#eee8e1',
                              borderRadius: 3.5,
                              bgcolor: done ? 'primary.light' + '04' : 'background.paper',
                              transition: 'all 0.2s',
                              '&:last-child': { mb: 0 }
                            }}
                          >
                            <ListItemButton 
                              onClick={() => handleTaskToggle(t.id, t.xp, tasks.length)}
                              sx={{ p: 2, borderRadius: 3.5 }}
                            >
                              <Checkbox 
                                checked={done}
                                color="success"
                                sx={{ mr: 1 }}
                              />
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                p: 1, 
                                bgcolor: meta.bg || 'rgba(0,0,0,0.04)', 
                                color: meta.color || 'text.secondary',
                                borderRadius: 2,
                                mr: 2
                              }}>
                                <CategoryIcon size={18} />
                              </Box>
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textDecoration: done ? 'line-through' : 'none', color: done ? 'text.secondary' : 'text.primary' }}>
                                      {t.title}
                                    </Typography>
                                    {t.period && <Chip label={t.period} size="small" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />}
                                  </Box>
                                }
                                secondary={<Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{t.subtitle}</Typography>}
                              />
                              <Box sx={{ textAlign: 'right', ml: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>+{t.xp}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>XP</Typography>
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Card>
                </Box>

                {/* Right logger and trophies */}
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' }, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Logger */}
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Activity size={18} /> Vitals Tracker
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Log measurements directly to clinical files
                      </Typography>

                      <form onSubmit={handleVitalsSubmit}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                          <Box sx={{ gridColumn: 'span 6' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Blood Pressure"
                              placeholder="120/80"
                              value={bp}
                              onChange={e => setBp(e.target.value)}
                            />
                          </Box>
                          <Box sx={{ gridColumn: 'span 6' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Glucose (mg/dL)"
                              placeholder="130"
                              value={glucose}
                              onChange={e => setGlucose(e.target.value)}
                            />
                          </Box>
                          <Box sx={{ gridColumn: 'span 12' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Weight (kg)"
                              placeholder="72.5"
                              value={weight}
                              onChange={e => setWeight(e.target.value)}
                            />
                          </Box>
                          <Box sx={{ gridColumn: 'span 12' }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="How do you feel?"
                              placeholder="Active, mild fatigue..."
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                            />
                          </Box>
                        </Box>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          fullWidth 
                          sx={{ mt: 2, height: 40 }}
                        >
                          Save & Sync Vitals
                        </Button>
                      </form>

                      {vitalsMsg && (
                        <Alert severity="success" sx={{ mt: 1.5, py: 0.2 }}>
                          {vitalsMsg}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Achievements */}
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Trophy size={18} /> Recovery Trophies
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                        Unlock achievements as you progress in recovery
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                        {BADGES.map(badge => {
                          const unlocked = gameState?.badges?.includes(badge.id)
                          const BadgeIcon = BADGE_ICONS[badge.id] || Award
                          return (
                            <Box key={badge.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title={`${badge.name}: ${badge.desc} (+${badge.xp} XP)`} arrow>
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  width: '100%',
                                  p: 1.5,
                                  borderRadius: 3.5,
                                  border: '1px solid',
                                  borderColor: unlocked ? badge.color + '30' : '#eee8e1',
                                  bgcolor: unlocked ? badge.color + '05' : 'rgba(0,0,0,0.01)',
                                  opacity: unlocked ? 1 : 0.45,
                                  textAlign: 'center'
                                }}>
                                  <Box sx={{ color: unlocked ? badge.color : 'text.disabled', mb: 0.6 }}>
                                    <BadgeIcon size={24} />
                                  </Box>
                                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {badge.name}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                          )
                        })}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Weekly Progress Bar */}
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <TrendingUp size={18} /> Weekly Compliance
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                        Goal completions over the last 7 days
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, pt: 1 }}>
                        {weeklyHistory.map(day => {
                          const pct = day.pct ?? 0
                          const barColor = pct >= 80 ? 'primary.main' : pct >= 40 ? 'warning.main' : 'error.main'
                          return (
                            <Box key={day.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700 }}>{pct}%</Typography>
                              <Box sx={{ height: 46, width: 8, bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid #eee8e1', borderRadius: 4, display: 'flex', alignItems: 'flex-end', my: 0.5 }}>
                                <Box sx={{ height: `${pct}%`, width: '100%', bgcolor: barColor, borderRadius: 4 }} />
                              </Box>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>{day.dayLabel}</Typography>
                            </Box>
                          )
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </>
          )}

          {/* Tab 1: Diet View */}
          {tabVal === 1 && pData.diet_plan && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <DietTab diet={pData.diet_plan} />
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Exercise View */}
          {tabVal === 2 && pData.exercise_plan && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <ExerciseTab ex={pData.exercise_plan} />
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Medications View */}
          {tabVal === 3 && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <MedsTab meds={pData.medications} />
              </CardContent>
            </Card>
          )}

          {/* Tab 4: Red Flags View */}
          {tabVal === 4 && (
            <Card>
              <CardContent sx={{ p: 4 }}>
                <RedFlagsTab rf={pData.red_flag_symptoms} />
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/* ── Inline reusable tabs components identical to Doctor view but embedded ── */

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
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Utensils size={20} /> {diet.plan_name}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{diet.overview}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <InfoPill label="Caloric Target" value={diet.caloric_target} />
        <InfoPill label="Protein Target" value={diet.protein_target} />
        <InfoPill label="Sodium Limit" value={diet.sodium_limit} />
        <InfoPill label="Fluid Limit" value={diet.fluid_limit} />
      </Box>

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
            <AlertTriangle size={16} /> Strictly Avoid
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
    </Box>
  )
}

function ExerciseTab({ ex }) {
  if (!ex) return null
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Dumbbell size={20} /> Rehabilitation Activity Protocol
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Current phase target: <strong>{ex.current_phase}</strong></Typography>
      </Box>

      {ex.absolute_exercise_restriction && (
        <Alert severity="error" icon={<AlertTriangle size={20} />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Exercise Restriction Active</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>Reason: {ex.restriction_reason}</Typography>
        </Alert>
      )}

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
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {ex.contraindications?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AlertTriangle size={16} /> Warnings & Safety Restrictions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ex.contraindications.map((c, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: 'text.secondary', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span> {c}
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
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Pill size={20} /> Prescribed Recovery Medications
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Please take your medications exactly according to the schedules below</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {meds.map((m, idx) => (
          <Box key={idx} sx={{ height: '100%' }}>
            <Card sx={{ 
              height: '100%',
              borderColor: m.allergy_alert ? 'error.light' : 'divider',
              background: m.allergy_alert ? 'rgba(225,29,72,0.01)' : 'background.paper'
            }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                {m.allergy_alert && (
                  <Chip label="Allergen Conflict Warning" size="small" color="error" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.65rem' }} />
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
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={14} /> {m.timing}
                    </Typography>
                  </Box>
                </Box>

                {m.food_interactions?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2, py: 0.2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Food caution: {m.food_interactions.join('; ')}</Typography>
                  </Alert>
                )}

                {m.important_notes?.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Instructions</Typography>
                    <ul style={{ paddingLeft: 14, margin: '2px 0 0 0', fontSize: '0.8rem', color: '#4b5563' }}>
                      {m.important_notes.map((n, idxNote) => <li key={idxNote}>{n}</li>)}
                    </ul>
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

function RedFlagsTab({ rf }) {
  if (!rf?.length) return null
  return (
    <Box>
      <Alert severity="error" sx={{ mb: 3.5, p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle size={18} /> Emergency Symptoms Protocol
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>
          If you experience any of these symptoms, go to the nearest emergency department or call <strong>108 / 112</strong> immediately.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rf.map((f, idx) => (
          <Card key={idx} sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={16} /> Symptom: {f.symptom}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                Condition: {f.related_condition}
              </Typography>
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', border: '1px solid #eee8e1', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>What you should do:</strong> {f.action}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
