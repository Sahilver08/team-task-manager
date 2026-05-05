import axios from 'axios'

// ── Axios instance ──────────────────────────────────────────────────────────
// One central instance used by all API functions.
// Base URL reads from Vite's env variable (set in .env file).
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ─────────────────────────────────────────────────────
// Automatically attaches the JWT access token to every request header.
// This way API functions never need to manually add the Authorization header.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ────────────────────────────────────────────────────
// If the server returns 401 (expired/invalid token), clear storage and
// redirect to login. Prevents users from being stuck in a broken auth state.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      // Redirect to login — using window.location so it works outside React
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
