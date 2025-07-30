"use client"

import { useAuth } from '@/hooks/use-auth'
import { LoginForm } from './login-form'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Event Management System
            </h1>
            <p className="text-gray-600">
              Verwalten Sie Events und Mitarbeiter effizient
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  // Show the main application if authenticated
  return <>{children}</>
}