import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Token aus localStorage laden
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  // Token validieren
  const validateToken = async (token) => {
    try {
      const response = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.valid) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('sessionToken')
      }
    } catch (error) {
      console.error('Token-Validierung fehlgeschlagen:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('sessionToken')
    } finally {
      setLoading(false)
    }
  }

  // Registrierung
  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      })

      return {
        success: true,
        user: response.data.user,
        message: response.data.message
      }
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error)
      
      let errorMessage = 'Registrierung fehlgeschlagen'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
        
        // Detaillierte Validierungsfehler
        if (error.response.data.details) {
          const details = error.response.data.details
          if (Array.isArray(details) && details.length > 0) {
            errorMessage = details[0].msg || errorMessage
          }
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Login
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })

      const { token, sessionToken, user: userData } = response.data

      // Token speichern
      localStorage.setItem('token', token)
      localStorage.setItem('sessionToken', sessionToken)
      
      // API-Header setzen
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.defaults.headers.common['X-Session-Token'] = sessionToken

      // User-State aktualisieren
      setUser(userData)
      setIsAuthenticated(true)

      return {
        success: true,
        user: userData,
        message: response.data.message
      }
    } catch (error) {
      console.error('Login fehlgeschlagen:', error)
      
      let errorMessage = 'Anmeldung fehlgeschlagen'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Logout
  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      if (sessionToken) {
        await api.post('/auth/logout', {}, {
          headers: { 'X-Session-Token': sessionToken }
        })
      }
    } catch (error) {
      console.error('Logout-Fehler:', error)
    } finally {
      // Lokale Daten löschen
      localStorage.removeItem('token')
      localStorage.removeItem('sessionToken')
      
      // API-Header entfernen
      delete api.defaults.headers.common['Authorization']
      delete api.defaults.headers.common['X-Session-Token']
      
      // State zurücksetzen
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  // Admin-Prüfung
  const isAdmin = () => {
    return user?.isAdmin === true
  }

  // Benutzer-Rolle abrufen
  const getUserRole = () => {
    if (!user) return 'guest'
    return user.isAdmin ? 'admin' : 'user'
  }

  // Berechtigung prüfen
  const hasPermission = (permission) => {
    if (!user) return false
    
    switch (permission) {
      case 'admin':
        return user.isAdmin
      case 'user':
        return true
      case 'container.create':
        return true
      case 'container.manage':
        return true
      case 'admin.users':
        return user.isAdmin
      case 'admin.system':
        return user.isAdmin
      default:
        return false
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    isAdmin,
    getUserRole,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 