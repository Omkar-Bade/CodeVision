/**
 * AuthContext.jsx — Authentication state and helpers for CodeVision.
 *
 * Replaces the previous Supabase-based implementation with direct calls to
 * the FastAPI /auth/* endpoints.
 *
 * Public API (returned by useAuth()) — intentionally identical to the old
 * Supabase-based shape so LoginPage, RegisterPage, and Navbar need minimal
 * or no changes:
 *
 *   user     — { id, email, full_name } or null
 *   loading  — true while the initial silent refresh is in progress
 *   signUp({ name, email, password })  — register + auto-login
 *   signIn({ email, password })        — login
 *   signOut()                          — logout + clear tokens
 *
 * Token storage:
 *   Access token  — in-memory module variable inside api/index.js (setAccessToken).
 *                   Never written to localStorage or sessionStorage.
 *   Refresh token — sessionStorage['cv_rt'].  Cleared on tab close or explicit
 *                   sign-out.  See api/index.js for the httpOnly cookie upgrade path.
 *
 * Session restoration:
 *   On mount, AuthContext checks sessionStorage for a refresh token and calls
 *   POST /auth/refresh.  If successful, the session is restored silently.
 *   loading=true until this check completes (replaces Supabase's getSession).
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api, { setAccessToken, setSignOutCallback } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Store a token pair: access token in memory, refresh token in sessionStorage.
   * Then fetch the user profile from /auth/me to populate `user` state.
   */
  const _storeTokensAndFetchUser = useCallback(async (accessToken, refreshToken) => {
    setAccessToken(accessToken)
    sessionStorage.setItem('cv_rt', refreshToken)

    const { data } = await api.get('/auth/me')
    setUser(data)  // { id, email, full_name, created_at }
  }, [])

  /**
   * Clear all auth state.  Called on explicit sign-out or when the
   * interceptor determines that the refresh token is invalid/expired.
   */
  const _clearSession = useCallback(() => {
    setAccessToken(null)
    sessionStorage.removeItem('cv_rt')
    setUser(null)
  }, [])

  // Register the clear-session callback with the Axios interceptor so it can
  // sign the user out when a refresh attempt fails (e.g. on a different tab).
  useEffect(() => {
    setSignOutCallback(_clearSession)
  }, [_clearSession])

  // ── Session restoration on mount ─────────────────────────────────────────

  useEffect(() => {
    const restore = async () => {
      const storedRefreshToken = sessionStorage.getItem('cv_rt')

      if (!storedRefreshToken) {
        setLoading(false)
        return
      }

      try {
        const { data } = await api.post('/auth/refresh', {
          refresh_token: storedRefreshToken,
        })
        await _storeTokensAndFetchUser(data.access_token, data.refresh_token)
      } catch {
        // Refresh token is expired or revoked — clear state silently
        _clearSession()
      } finally {
        setLoading(false)
      }
    }

    restore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public auth methods ──────────────────────────────────────────────────

  /**
   * Register a new account.
   * On success, tokens are issued immediately so the user is logged in
   * without a separate login step.
   * Throws on API error (LoginPage/RegisterPage catch and display the message).
   */
  const signUp = useCallback(async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', {
      full_name: name,
      email,
      password,
    })
    await _storeTokensAndFetchUser(data.access_token, data.refresh_token)
  }, [_storeTokensAndFetchUser])

  /**
   * Sign in with email + password.
   * Throws on wrong credentials (message from API: "Incorrect email or password.").
   */
  const signIn = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    await _storeTokensAndFetchUser(data.access_token, data.refresh_token)
  }, [_storeTokensAndFetchUser])

  /**
   * Sign out.  Revokes the refresh token on the server (best-effort),
   * then clears local state.  The access token expires on its own.
   */
  const signOut = useCallback(async () => {
    const storedRefreshToken = sessionStorage.getItem('cv_rt')
    try {
      if (storedRefreshToken) {
        // Best-effort — do not block sign-out on a network failure
        await api.post('/auth/logout', { refresh_token: storedRefreshToken })
      }
    } catch {
      // Ignore errors (network down, token already revoked, etc.)
    } finally {
      _clearSession()
    }
  }, [_clearSession])

  // ── Context value ────────────────────────────────────────────────────────

  const value = { user, loading, signUp, signIn, signOut }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
