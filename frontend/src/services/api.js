import axios from 'axios'
import Cookies from 'js-cookie'

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Axios instance erstellen
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor für Auth-Token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    const sessionToken = Cookies.get('session_token')
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor für Error-Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token abgelaufen oder ungültig
      Cookies.remove('auth_token')
      Cookies.remove('session_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  
  logout: (sessionToken) =>
    api.post('/auth/logout', {}, {
      headers: { 'X-Session-Token': sessionToken }
    }),
  
  validate: () =>
    api.get('/auth/validate'),
}

// Container API
export const containerAPI = {
  // Container auflisten
  list: () =>
    api.get('/containers'),
  
  // Container erstellen
  create: (containerName) =>
    api.post('/containers/create', { containerName }),
  
  // Container starten
  start: (containerId) =>
    api.post(`/containers/${containerId}/start`),
  
  // Container stoppen
  stop: (containerId) =>
    api.post(`/containers/${containerId}/stop`),
  
  // Container löschen
  delete: (containerId) =>
    api.delete(`/containers/${containerId}`),
  
  // Container-Details
  get: (containerId) =>
    api.get(`/containers/${containerId}`),
}

// User API
export const userAPI = {
  // Profil abrufen
  getProfile: () =>
    api.get('/users/profile'),
  
  // Aktivitätslogs abrufen
  getLogs: (limit = 50, offset = 0) =>
    api.get(`/users/logs?limit=${limit}&offset=${offset}`),
  
  // Sessions abrufen
  getSessions: () =>
    api.get('/users/sessions'),
  
  // Session beenden
  deleteSession: (sessionToken) =>
    api.delete(`/users/sessions/${sessionToken}`),
  
  // Alle Sessions beenden
  deleteAllSessions: () =>
    api.delete('/users/sessions'),
}

// Health Check
export const healthAPI = {
  check: () =>
    api.get('/health'),
}

export default api 