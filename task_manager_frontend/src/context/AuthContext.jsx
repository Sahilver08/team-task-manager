import { createContext, useContext, useState, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'

// ── Context ─────────────────────────────────────────────────────────────────
// Think of this as a global variable any component can read.
// It holds: who is logged in + helper functions to login/logout.
const AuthContext = createContext(null)

// ── Helper: read persisted state from localStorage ───────────────────────────
function getInitialUser() {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

// ── Provider component ───────────────────────────────────────────────────────
// Wrap the entire app in this so every page/component can call useAuth().
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  // Called after a successful login or register API response
  const login = useCallback((data) => {
    const { access, refresh, user: userData } = data

    // Decode the JWT to get extra claims we embedded (email, full_name)
    // This avoids an extra /me/ API call on every page load
    let decoded = {}
    try { decoded = jwtDecode(access) } catch { /* ignore */ }

    const fullUser = { ...userData, ...decoded }

    localStorage.setItem('access_token',  access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('user',          JSON.stringify(fullUser))
    setUser(fullUser)
  }, [])

  // Clear everything on logout
  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(user)

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Custom hook ──────────────────────────────────────────────────────────────
// Usage in any component: const { user, login, logout } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
