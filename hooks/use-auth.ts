import { useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }, [])

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!authState.user
  }
}