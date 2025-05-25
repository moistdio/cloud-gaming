import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { authAPI } from '../services/api'

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

  // Token aus Cookies laden
  const getToken = () => Cookies.get('auth_token')
  const getSessionToken = () => Cookies.get('session_token')

  // Token in Cookies speichern
  const setTokens = (token, sessionToken) => {
    Cookies.set('auth_token', token, { expires: 1, secure: true, sameSite: 'strict' })
    Cookies.set('session_token', sessionToken, { expires: 1, secure: true, sameSite: 'strict' })
  }

  // Token aus Cookies entfernen
  const removeTokens = () => {
    Cookies.remove('auth_token')
    Cookies.remove('session_token')
  }

  // Benutzer validieren
  const validateUser = async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.validate()
      setUser(response.data.user)
    } catch (error) {
      console.error('Token-Validierung fehlgeschlagen:', error)
      removeTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Login
  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      const { token, sessionToken, user: userData } = response.data
      
      setTokens(token, sessionToken)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || 'Anmeldung fehlgeschlagen'
      return { success: false, error: message }
    }
  }

  // Registrierung
  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register(username, email, password)
      return { success: true, user: response.data.user }
    } catch (error) {
      const message = error.response?.data?.message || 'Registrierung fehlgeschlagen'
      return { success: false, error: message }
    }
  }

  // Logout
  const logout = async () => {
    try {
      const sessionToken = getSessionToken()
      if (sessionToken) {
        await authAPI.logout(sessionToken)
      }
    } catch (error) {
      console.error('Logout-Fehler:', error)
    } finally {
      removeTokens()
      setUser(null)
    }
  }

  // Bei App-Start Benutzer validieren
  useEffect(() => {
    validateUser()
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getToken,
    getSessionToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 