import axios from 'axios'

// API-Basis-URL
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // In Produktion über nginx Proxy
  : 'http://localhost:3002/api'  // In Entwicklung direkt zum Backend

// Axios-Instanz erstellen
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request-Interceptor für Authentifizierung
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    const sessionToken = localStorage.getItem('sessionToken')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response-Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Token abgelaufen oder ungültig
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('sessionToken')
      
      // Nur umleiten wenn wir nicht bereits auf der Login-Seite sind
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
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
  
  // Dashboard-Statistiken abrufen
  getDashboardStats: () =>
    api.get('/users/dashboard-stats'),
  
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