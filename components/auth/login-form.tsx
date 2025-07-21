"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

interface LoginFormProps {
  onLoginSuccess?: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      setMessage("Anmeldung erfolgreich!")
      
      // Check if user exists in employees table, if not create as manager
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (employeeError && employeeError.code === 'PGRST116') {
        // User doesn't exist in employees table, create as manager
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            name: data.user.email?.split('@')[0] || 'Manager User',
            user_id: data.user.id,
            phone_number: '+1234567890',
            role: 'manager',
            employment_type: 'part_time',
            is_always_needed: true
          })
        
        if (insertError) {
          console.error('Error creating employee record:', insertError)
        } else {
          setMessage("Anmeldung erfolgreich! Manager-Konto erstellt.")
        }
      }

      setTimeout(() => {
        onLoginSuccess?.()
      }, 1000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      if (data.user && !data.session) {
        setMessage("Überprüfen Sie Ihre E-Mails für den Bestätigungslink!")
      } else if (data.user) {
        // Create manager employee record
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            name: data.user.email?.split('@')[0] || 'Manager User',
            user_id: data.user.id,
            phone_number: '+1234567890',
            role: 'manager',
            employment_type: 'part_time',
            is_always_needed: true
          })
        
        if (insertError) {
          console.error('Error creating employee record:', insertError)
        }

        setMessage("Konto erfolgreich erstellt!")
        setTimeout(() => {
          onLoginSuccess?.()
        }, 1000)
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.1),transparent_70%)]"></div>
      
      {/* Floating elements for modern aesthetic */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0 rounded-3xl overflow-hidden">
          {/* Logo and Brand Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600"></div>
            <CardHeader className="relative text-center pt-12 pb-8 text-white">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                  <div className="relative bg-white rounded-2xl p-4 shadow-lg">
                    <Image
                      src="/ems-icon.png"
                      alt="EMS Logo"
                      width={64}
                      height={64}
                      className="mx-auto"
                      priority
                    />
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-3xl font-bold tracking-tight mb-2">
                EMS Manager
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg font-medium">
                Mitarbeiterverwaltungssystem
              </CardDescription>
              <p className="text-blue-200 text-sm mt-2 opacity-90">
                Optimieren Sie Ihre Personalvorgänge
              </p>
            </CardHeader>
          </div>

          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-2xl p-1 h-12">
                <TabsTrigger 
                  value="login" 
                  className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  Anmelden
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  Registrieren
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      E-Mail-Adresse
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Geben Sie Ihre E-Mail ein"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Passwort
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Geben Sie Ihr Passwort ein"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-12 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {!loading && <LogIn className="mr-2 h-5 w-5" />}
                    {loading ? "Anmelden..." : "Anmelden"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-semibold text-gray-700">
                      E-Mail-Adresse
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Geben Sie Ihre E-Mail ein"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-semibold text-gray-700">
                      Passwort
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Erstellen Sie ein sicheres Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 pr-12 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Muss mindestens 6 Zeichen lang sein
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {!loading && <UserPlus className="mr-2 h-5 w-5" />}
                    {loading ? "Konto wird erstellt..." : "Konto erstellen"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Alert Messages */}
            {error && (
              <Alert variant="destructive" className="mt-6 rounded-xl border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className="mt-6 rounded-xl border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 font-medium">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Footer Information */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Sichere Anmeldung</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Manager-Zugang</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Alle Konten werden zu Testzwecken mit Verwaltungsberechtigungen erstellt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Subtle footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 EMS Manager. Optimierung der Personalverwaltung.
          </p>
        </div>
      </div>
    </div>
  )
} 