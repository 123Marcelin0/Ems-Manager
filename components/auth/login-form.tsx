"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface LoginFormProps {
  onToggleMode?: () => void
  showSignUp?: boolean
}

export function LoginForm({ onToggleMode, showSignUp = false }: LoginFormProps) {
  const { signIn, signUp, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSignUpMode, setIsSignUpMode] = useState(showSignUp)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!formData.email || !formData.password) {
      setLocalError('Bitte füllen Sie alle Felder aus')
      return
    }

    if (isSignUpMode && formData.password !== formData.confirmPassword) {
      setLocalError('Passwörter stimmen nicht überein')
      return
    }

    if (isSignUpMode && formData.password.length < 6) {
      setLocalError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    try {
      if (isSignUpMode) {
        const result = await signUp(formData.email, formData.password)
        if (result.success) {
          setLocalError(null)
          // Show success message for sign up
          alert('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail für die Bestätigung.')
        } else {
          setLocalError(result.error || 'Registrierung fehlgeschlagen')
        }
      } else {
        const result = await signIn(formData.email, formData.password)
        if (!result.success) {
          setLocalError(result.error || 'Anmeldung fehlgeschlagen')
        }
      }
    } catch (err) {
      setLocalError('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode)
    setLocalError(null)
    setFormData({ email: '', password: '', confirmPassword: '' })
    if (onToggleMode) {
      onToggleMode()
    }
  }

  const displayError = localError || error

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isSignUpMode ? 'Registrieren' : 'Anmelden'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUpMode 
            ? 'Erstellen Sie ein neues Konto für das Event Management System'
            : 'Melden Sie sich bei Ihrem Event Management System an'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="ihre.email@beispiel.de"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                disabled={loading}
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Passwort
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUpMode ? 'Mindestens 6 Zeichen' : 'Ihr Passwort'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="pl-10 pr-10"
                disabled={loading}
                required
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUpMode && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Passwort wiederholen"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10"
                  disabled={loading}
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isSignUpMode ? 'Registriere...' : 'Melde an...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {isSignUpMode ? 'Registrieren' : 'Anmelden'}
              </div>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-800 underline block mx-auto"
            disabled={loading}
          >
            {isSignUpMode 
              ? 'Bereits ein Konto? Hier anmelden'
              : 'Noch kein Konto? Hier registrieren'
            }
          </button>
          
          {!isSignUpMode && (
            <button
              type="button"
              onClick={() => {
                // This would open a password reset form
                // For now, just show an alert
                alert('Passwort-Reset-Funktion wird implementiert')
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline block mx-auto"
              disabled={loading}
            >
              Passwort vergessen?
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}