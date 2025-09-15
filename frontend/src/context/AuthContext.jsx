/**
 * AuthContext.jsx
 *
 * Provides application-wide authentication state:
 *   user     — the logged-in user object (or null)
 *   token    — JWT string (or null)
 *   loading  — true while the initial /auth/me check is in flight
 *
 * Exposed helpers:
 *   loginUser(email, password)  — logs in, stores token, sets user
 *   registerUser(name, email, password)
 *   logoutUser()                — clears token and user state
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { login, register, getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('cv_token'))
  const [loading, setLoading] = useState(true)

  // On mount (or token change): try to hydrate the user from the backend
  useEffect(() => {
    if (!token) { setLoading(false); return }

    getMe()
      .then(({ data }) => setUser(data))
      .catch(() => {
        // Token is invalid or expired — clear it
        localStorage.removeItem('cv_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  // Persist token to localStorage whenever it changes
  const saveToken = (t) => {
    if (t) localStorage.setItem('cv_token', t)
    else   localStorage.removeItem('cv_token')
    setToken(t)
  }

  const loginUser = async (email, password) => {
    const { data } = await login({ email, password })
    saveToken(data.token)
    setUser(data.user)
    return data
  }

  const registerUser = async (name, email, password) => {
    const { data } = await register({ name, email, password })
    saveToken(data.token)
    setUser(data.user)
    return data
  }

  const logoutUser = () => {
    saveToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for convenience
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
