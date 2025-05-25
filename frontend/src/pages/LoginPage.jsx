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
  Stack
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Computer as ComputerIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const result = await login(data.username, data.password)
      
      if (result.success) {
        toast.success(`Willkommen zurück, ${result.user.username}!`)
        navigate('/dashboard')
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
                Cloud Gaming System
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Melden Sie sich an, um auf Ihre virtuellen Desktops zuzugreifen
              </Typography>
            </Box>

            {/* Error Alert */}
            {errors.root && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.root.message}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Benutzername oder E-Mail"
                  variant="outlined"
                  {...register('username', {
                    required: 'Benutzername ist erforderlich'
                  })}
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  {...register('password', {
                    required: 'Passwort ist erforderlich'
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

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Anmeldung läuft...' : 'Anmelden'}
                </Button>
              </Stack>
            </Box>

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                oder
              </Typography>
            </Divider>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Noch kein Konto?{' '}
                <Link
                  to="/register"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Jetzt registrieren
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

export default LoginPage 