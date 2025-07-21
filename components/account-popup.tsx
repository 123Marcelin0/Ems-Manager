"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Users, 
  Calendar, 
  Mail, 
  Phone, 
  Building, 
  Shield,
  Edit2,
  Save,
  X,
  CheckCircle
} from "lucide-react"
import { useEmployees } from "@/hooks/use-employees"
import { useEvents } from "@/hooks/use-events"

interface AccountPopupProps {
  onClose: () => void
}

export function AccountPopup({ onClose }: AccountPopupProps) {
  const { employees, loading: employeesLoading } = useEmployees()
  const { events, loading: eventsLoading } = useEvents()
  
  // Mock user data - replace with actual user context/auth
  const [userInfo, setUserInfo] = useState({
    name: "Max Mustermann",
    email: "max.mustermann@company.com",
    phone: "+49 123 456 7890",
    company: "Event Management GmbH",
    role: "Administrator"
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(userInfo)

  // Calculate statistics
  const totalEmployees = employees.length
  const activeEvents = events.filter(event => event.status !== 'completed' && event.status !== 'cancelled').length
  const completedEvents = events.filter(event => event.status === 'completed').length

  const handleSave = () => {
    setUserInfo(editForm)
    setIsEditing(false)
    // TODO: Save to backend
  }

  const handleCancel = () => {
    setEditForm(userInfo)
    setIsEditing(false)
  }

  if (employeesLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Übersicht</h2>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihr Profil und sehen Sie Ihre Statistiken</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Information */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Benutzerinformationen</h3>
                <p className="text-sm text-gray-600">Ihre persönlichen Daten</p>
              </div>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 h-9 px-4 rounded-full border-blue-200/60 hover:bg-blue-50/30 transition-all duration-200"
              >
                <Edit2 className="h-4 w-4 text-blue-600" />
                Bearbeiten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 h-9 px-4 rounded-full border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gap-2 h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefon</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">Unternehmen</Label>
                <Input
                  id="company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  className="h-10 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-500">Name</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userInfo.email}</p>
                  <p className="text-xs text-gray-500">E-Mail</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userInfo.phone}</p>
                  <p className="text-xs text-gray-500">Telefon</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Building className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userInfo.company}</p>
                  <p className="text-xs text-gray-500">Unternehmen</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Role Badge */}
          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-200/60">
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-lg font-medium">
                {userInfo.role}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Benutzerrolle</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiken</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50/30 rounded-xl border border-blue-200/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Mitarbeiter</p>
                  <p className="text-xs text-gray-500">Gesamt</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50/30 rounded-xl border border-green-200/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Aktive Events</p>
                  <p className="text-xs text-gray-500">Laufend</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeEvents}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50/30 rounded-xl border border-purple-200/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Abgeschlossen</p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{completedEvents}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 