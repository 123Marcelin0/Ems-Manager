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
    <Card className="w-full max-w-md mx-auto backdrop-blur-sm bg-white/90 shadow-2xl border-0 rounded-3xl overflow-hidden">
      <CardHeader className="space-y-4 pb-8 pt-8 px-8">
        <CardTitle className="text-2xl font-bold text-center text-slate-800">
          {isSignUpMode ? 'Neues Konto erstellen' : 'Willkommen zurück'}
        </CardTitle>
        <CardDescription className="text-center text-slate-600 leading-relaxed">
          {isSignUpMode 
            ? 'Erstellen Sie Ihr Konto und beginnen Sie mit der professionellen Event-Verwaltung'
            : 'Melden Sie sich an, um auf Ihr Event Management System zuzugreifen'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{displayError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="ihre.email@unternehmen.de"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                disabled={loading}
                required
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Passwort
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUpMode ? 'Mindestens 6 Zeichen eingeben' : 'Ihr sicheres Passwort'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="pl-12 pr-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                disabled={loading}
                required
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isSignUpMode && (
            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Passwort zur Bestätigung wiederholen"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  disabled={loading}
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isSignUpMode ? 'Konto wird erstellt...' : 'Anmeldung läuft...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <LogIn className="h-5 w-5" />
                <span>{isSignUpMode ? 'Konto erstellen' : 'Jetzt anmelden'}</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">oder</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 block mx-auto"
            disabled={loading}
          >
            {isSignUpMode 
              ? '← Bereits ein Konto? Jetzt anmelden'
              : 'Noch kein Konto? → Jetzt registrieren'
            }
          </button>
          
          {!isSignUpMode && (
            <button
              type="button"
              onClick={() => {
                // This would open a password reset form
                // For now, just show an alert
                alert('Die Passwort-Reset-Funktion wird in Kürze verfügbar sein.')
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200 block mx-auto"
              disabled={loading}
            >
              Passwort vergessen? → Hier zurücksetzen
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}