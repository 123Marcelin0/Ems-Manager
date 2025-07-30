"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ResetPasswordFormProps {
  onBack?: () => void
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!email) {
      setMessage({ type: 'error', text: 'Bitte geben Sie Ihre E-Mail-Adresse ein' })
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword(email)
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet' 
        })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: result.error || 'Fehler beim Senden des Reset-Links' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ein unerwarteter Fehler ist aufgetreten' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Passwort zurücksetzen
        </CardTitle>
        <CardDescription className="text-center">
          Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link zu erhalten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sende Reset-Link...
              </div>
            ) : (
              'Reset-Link senden'
            )}
          </Button>
        </form>

        {onBack && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1 mx-auto"
              disabled={loading}
            >
              <ArrowLeft className="h-3 w-3" />
              Zurück zur Anmeldung
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}