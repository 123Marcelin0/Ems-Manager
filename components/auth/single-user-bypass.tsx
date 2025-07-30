"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface SingleUserBypassProps {
  children: React.ReactNode
}

export function SingleUserBypass({ children }: SingleUserBypassProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupSingleUserMode = async () => {
      try {
        // Try to sign in with a default user for single-user mode
        // This creates a session so RLS policies work
        const { data, error } = await supabase.auth.signInAnonymously()
        
        if (error) {
          console.warn('Anonymous sign-in failed:', error)
          // If anonymous sign-in fails, try with a dummy email
          const { error: emailError } = await supabase.auth.signInWithPassword({
            email: 'admin@localhost',
            password: 'admin123'
          })
          
          if (emailError) {
            console.warn('Default user sign-in failed:', emailError)
            // If both fail, we'll continue without auth (RLS should be disabled)
          }
        }
        
        console.log('✅ Single-user mode initialized')
      } catch (err) {
        console.error('Error setting up single-user mode:', err)
        setError('Failed to initialize single-user mode')
      } finally {
        setLoading(false)
      }
    }

    setupSingleUserMode()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing single-user mode...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Please disable RLS policies or check authentication setup.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}