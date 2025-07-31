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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg flex items-center justify-center">
              <img 
                src="/ems-icon.png" 
                alt="EMS Logo" 
                width={32} 
                height={32} 
                className="object-contain filter brightness-0 invert"
              />
            </div>
          </div>
          
          {/* Loading Animation */}
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          
          <div className="space-y-2">
            <p className="text-slate-700 font-medium">Anmeldung wird überprüft...</p>
            <p className="text-slate-500 text-sm">Einen Moment bitte</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          {/* Logo and Company Branding */}
          <div className="text-center mb-12">
            {/* Logo Container */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* EMS Logo */}
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
                  <img 
                    src="/ems-icon.png" 
                    alt="EMS Logo" 
                    width={48} 
                    height={48} 
                    className="object-contain filter brightness-0 invert"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-md"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full shadow-md"></div>
              </div>
            </div>
            
            {/* Company Name and Branding */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
                <span className="text-4xl font-bold tracking-tight" style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  EMS
                </span>
                <span className="text-2xl font-semibold tracking-wide text-slate-700" style={{
                  background: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Manager
                </span>
              </div>
              
              <h1 className="text-xl font-medium text-slate-800 mb-2">
                Event Management System
              </h1>
              
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                Professionelle Verwaltung von Events und Mitarbeitern – 
                <br />
                <span className="font-medium text-blue-600">Effizient. Zuverlässig. Einfach.</span>
              </p>
            </div>
          </div>
          
          <LoginForm />
          
          {/* Footer */}
          <div className="text-center mt-8 text-xs text-slate-500">
            <p>© 2025 EMS Manager. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </div>
    )
  }

  // Show the main application if authenticated
  return <>{children}</>
}