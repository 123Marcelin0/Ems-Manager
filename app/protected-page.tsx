"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useState } from "react"

interface ProtectedPageProps {
  children: React.ReactNode
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loading, signOut } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginForm 
        onLoginSuccess={() => {
          setShowLogin(false)
          window.location.reload()
        }} 
      />
    )
  }

  return (
    <div className="relative">
      {children}
    </div>
  )
} 