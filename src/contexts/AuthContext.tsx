import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signInWithPasscode: (code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithPasscode = async (code: string) => {
    const accessCode = import.meta.env.VITE_ACCESS_CODE
    if (code !== accessCode) {
      return { error: 'Incorrect passcode.' }
    }

    // Passcode correct — sign in anonymously to get a Supabase session for RLS
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      return { error: error.message }
    }

    // Set session immediately so ProtectedRoute doesn't redirect
    if (data.session) {
      setSession(data.session)
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, signInWithPasscode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
