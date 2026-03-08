/**
 * AuthContext.jsx
 *
 * Provides a React context that exposes Supabase authentication state and
 * helper methods to every component in the tree.
 *
 * Public API (returned by `useAuth()`):
 *   user     — the current Supabase `User` object, or null when logged out
 *   session  — the full Supabase `Session` (contains JWT tokens), or null
 *   loading  — true while the initial session is being hydrated from storage
 *   signUp   — creates a new account and upserts a row in the `profiles` table
 *   signIn   — signs in with email + password
 *   signOut  — invalidates the current session
 *
 * Usage:
 *   // Wrap your app once at the root level
 *   <AuthProvider>...</AuthProvider>
 *
 *   // Consume anywhere inside the tree
 *   const { user, signIn } = useAuth()
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Initialise context with null so `useAuth` can detect missing providers.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Sign Up ──────────────────────────────────────────────────
  // Creates the Supabase Auth user, then upserts a row in `profiles`
  // so the display name is stored alongside the auth record.
  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },   // stored in auth.users.raw_user_meta_data
    })
    if (error) throw error

    // Upsert profile row (created_at is set by DB default)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email: data.user.email,
      })
    }
    return data
  }

  // ── Sign In ───────────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // ── Sign Out ──────────────────────────────────────────────────
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = { user, session, loading, signUp, signIn, signOut }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
