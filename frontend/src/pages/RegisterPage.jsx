import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  Chip
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Computer as ComputerIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      // Passwort-Bestätigung prüfen
      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Passwörter stimmen nicht überein' })
        setLoading(false)
        return
      }

      const result = await registerUser(data.username, data.email, data.password)
      
      if (result.success) {
        toast.success(`Registrierung erfolgreich! Willkommen, ${result.user.username}!`)
        navigate('/login')
      } else {
        setError('root', { message: result.error })
      }
    } catch (error) {
      setError('root', { message: 'Ein unerwarteter Fehler ist aufgetreten' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <ComputerIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main', 
                  mb: 2 
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Registrierung
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Erstellen Sie Ihr Cloud Gaming Konto
              </Typography>
              
              {/* Admin-Hinweis */}
              <Chip
                icon={<AdminIcon />}
                label="Der erste Benutzer wird automatisch Administrator"
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Error Alert */}
            {errors.root && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.root.message}
              </Alert>
            )}

            {/* Registration Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Benutzername"
                  variant="outlined"
                  {...register('username', {
                    required: 'Benutzername ist erforderlich',
                    minLength: {
                      value: 3,
                      message: 'Benutzername muss mindestens 3 Zeichen lang sein'
                    },
                    maxLength: {
                      value: 30,
                      message: 'Benutzername darf maximal 30 Zeichen lang sein'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'Nur Buchstaben, Zahlen, _ und - erlaubt'
                    }
                  })}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="E-Mail-Adresse"
                  type="email"
                  variant="outlined"
                  {...register('email', {
                    required: 'E-Mail-Adresse ist erforderlich',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Ungültige E-Mail-Adresse'
                    }
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  {...register('password', {
                    required: 'Passwort ist erforderlich',
                    minLength: {
                      value: 8,
                      message: 'Passwort muss mindestens 8 Zeichen lang sein'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten'
                    }
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Passwort bestätigen"
                  type={showConfirmPassword ? 'text' : 'password'}
                  variant="outlined"
                  {...register('confirmPassword', {
                    required: 'Passwort-Bestätigung ist erforderlich',
                    validate: value => 
                      value === password || 'Passwörter stimmen nicht überein'
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<PersonAddIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Registrierung läuft...' : 'Registrieren'}
                </Button>
              </Stack>
            </Box>

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                oder
              </Typography>
            </Divider>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Bereits ein Konto?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Jetzt anmelden
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            © 2024 Cloud Gaming System. Alle Rechte vorbehalten.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default RegisterPage 