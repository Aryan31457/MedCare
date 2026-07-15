import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../redux/authSlice.js'
import { api } from '../api/client.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
  Paper,
  Fade,
  CircularProgress,
  OutlinedInput
} from '@mui/material'
import {
  HeartPulse,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  ClipboardList
} from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [tabValue, setTabValue] = useState(0) // 0: Login, 1: Register
  
  // Login fields
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('doctor') // 'doctor' or 'patient'
  
  // Patient fields for registration
  const [patName, setPatName] = useState('')
  const [patAge, setPatAge] = useState('')
  const [patSex, setPatSex] = useState('Male')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setError(null)
    setSuccess(null)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await api.login(usernameOrEmail, loginPassword)
      
      dispatch(loginSuccess({ role: response.role, patientId: response.patient_id }))
      
      if (response.role === 'doctor') {
        navigate('/')
      } else {
        navigate(`/patient/${response.patient_id}`)
      }
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const payload = {
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole
      }

      if (regRole === 'patient') {
        payload.name = patName.trim()
        payload.age = parseInt(patAge) || 0
        payload.sex = patSex
      }

      const response = await api.register(payload)
      setSuccess('Account created successfully! Auto-signing you in...')
      
      // Auto login
      setTimeout(() => {
        dispatch(loginSuccess({ role: response.role, patientId: response.patient_id }))
        if (response.role === 'doctor') {
          navigate('/')
        } else {
          navigate(`/patient/${response.patient_id}`)
        }
      }, 1500)

    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username/email.')
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(0,0,0,0) 70%)',
        top: '10%',
        left: '15%',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%',
        right: '15%',
      },
      p: 3
    }}>
      <Card sx={{ 
        maxWidth: 460, 
        width: '100%', 
        borderRadius: 5, 
        border: '1px solid rgba(255, 255, 255, 0.7)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
        overflow: 'visible'
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header branding */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'inline-flex', p: 1.5, bgcolor: 'primary.light' + '12', borderRadius: 4, color: 'primary.main', mb: 1.5 }}>
              <HeartPulse size={36} strokeWidth={2.5} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: '-0.02em' }}>
              MedCare Portal
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Automated Clinical Discharge Recovery System
            </Typography>
          </Box>

          {/* Form Tabs Switcher */}
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Sign In" sx={{ fontWeight: 700 }} />
            <Tab label="Create Account" sx={{ fontWeight: 700 }} />
          </Tabs>

          {/* Alerts */}
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            </Fade>
          )}
          {success && (
            <Fade in={!!success}>
              <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
            </Fade>
          )}

          {tabValue === 0 ? (
            // Sign In View
            <form onSubmit={handleLoginSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Username or Email</InputLabel>
                  <OutlinedInput
                    label="Username or Email"
                    placeholder="e.g. doctor or ramesh"
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <User size={18} style={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    type={showLoginPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <Lock size={18} style={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end">
                          {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ height: 48, fontSize: '0.95rem', mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <>Sign In <ChevronRight size={16} style={{ marginLeft: 6 }} /></>}
                </Button>
              </Box>
            </form>
          ) : (
            // Register View
            <form onSubmit={handleRegisterSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Username</InputLabel>
                  <OutlinedInput
                    label="Username"
                    placeholder="e.g. johndoe"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <User size={18} style={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Email Address</InputLabel>
                  <OutlinedInput
                    type="email"
                    label="Email Address"
                    placeholder="johndoe@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <Mail size={18} style={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    type={showRegPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <Lock size={18} style={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowRegPassword(!showRegPassword)} edge="end">
                          {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Account Role</InputLabel>
                  <Select
                    value={regRole}
                    label="Account Role"
                    onChange={e => setRegRole(e.target.value)}
                  >
                    <MenuItem value="doctor">Doctor / Clinician</MenuItem>
                    <MenuItem value="patient">Recovering Patient</MenuItem>
                  </Select>
                </FormControl>

                {regRole === 'patient' && (
                  <Paper sx={{ p: 2.5, bgcolor: '#fbfaf8', border: '1px solid #eee8e1', borderRadius: 3 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        fontWeight: 700, 
                        color: 'primary.main', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        mb: 2 
                      }}
                    >
                      <ClipboardList size={14} /> Demographics Setup
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Patient Full Name"
                        placeholder="John Doe"
                        value={patName}
                        onChange={e => setPatName(e.target.value)}
                        required
                        sx={{ bgcolor: 'background.paper' }}
                      />

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          size="small"
                          label="Age"
                          type="number"
                          placeholder="35"
                          value={patAge}
                          onChange={e => setPatAge(e.target.value)}
                          required
                          sx={{ flex: 1, bgcolor: 'background.paper' }}
                        />

                        <FormControl size="small" sx={{ flex: 1, bgcolor: 'background.paper' }}>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={patSex}
                            label="Gender"
                            onChange={e => setPatSex(e.target.value)}
                          >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Paper>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ height: 48, fontSize: '0.95rem', mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <>Create Account <ChevronRight size={16} style={{ marginLeft: 6 }} /></>}
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
