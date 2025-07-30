"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, ChevronDown, ChevronUp, User, Check, X, Info, Search, RefreshCw, AlertCircle } from "lucide-react"
import { useEmployeeRoleSync } from "@/hooks/use-employee-role-sync"
import { useEmployees } from "@/hooks/use-employees"
import { useToast } from "@/hooks/use-toast"

// Define the role hierarchy (from highest to lowest)
const roleHierarchy = [
  "manager",
  "allrounder", 
  "versorger",
  "verkauf",
  "essen"
] as const;

type Role = typeof roleHierarchy[number];

interface UserRole {
  id: string
  name: string
  phone: string
  mainRole: Role
  activeRoles: Role[]
  lastUpdated: string
}

const roleConfig = {
  manager: { 
    label: "Manager", 
    color: "bg-red-100 text-red-700 border-red-200",
    description: "Kann alle Rollen ausführen"
  },
  allrounder: { 
    label: "Allrounder", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Kann Versorger, Verkauf und Essen ausführen"
  },
  versorger: { 
    label: "Versorger", 
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Kann Verkauf und Essen ausführen"
  },
  verkauf: { 
    label: "Verkauf", 
    color: "bg-amber-100 text-amber-700 border-amber-200",
    description: "Kann Essen ausführen"
  },
  essen: { 
    label: "Essen", 
    color: "bg-gray-100 text-gray-700 border-gray-200",
    description: "Basis-Rolle"
  },
}

// Transform database employee to UserRole format
const transformEmployeeToUserRole = (employee: any): UserRole => {
  return {
    id: employee.id,
    name: employee.name,
    phone: employee.phone_number,
    mainRole: employee.role,
    activeRoles: employee.performableRoles || [employee.role],
    lastUpdated: new Date(employee.updated_at).toLocaleDateString('de-DE')
  }
}

interface RoleManagementProps {
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  onNavigateToEmployeeOverview?: (employeeId: string) => void
}

export function RoleManagement({ searchQuery = "", setSearchQuery, onNavigateToEmployeeOverview }: RoleManagementProps) {
  const [users, setUsers] = useState<UserRole[]>([])
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [isHierarchyExpanded, setIsHierarchyExpanded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees()
  const { 
    loading: roleLoading, 
    error: roleError,
    updateEmployeeRole,
    syncAllEmployeeRoles,
    getEmployeesWithCapabilities,
    getRoleHierarchy
  } = useEmployeeRoleSync()
  const { toast } = useToast()

  // Load employees with capabilities on mount
  useEffect(() => {
    loadEmployeesWithCapabilities()
  }, [])

  const loadEmployeesWithCapabilities = async () => {
    try {
      const employeesWithCapabilities = await getEmployeesWithCapabilities()
      const transformedUsers = employeesWithCapabilities.map(transformEmployeeToUserRole)
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Failed to load employees with capabilities:', error)
      toast({
        title: "Fehler beim Laden",
        description: "Mitarbeiterdaten konnten nicht geladen werden.",
        variant: "destructive"
      })
    }
  }

  // Sync all employee roles
  const handleSyncAllRoles = async () => {
    setIsSyncing(true)
    try {
      const result = await syncAllEmployeeRoles()
      
      toast({
        title: "Rollen synchronisiert!",
        description: `${result.synced} Mitarbeiter erfolgreich synchronisiert.`,
      })
      
      if (result.errors.length > 0) {
        console.warn('Sync errors:', result.errors)
        toast({
          title: "Teilweise Fehler",
          description: `${result.errors.length} Fehler bei der Synchronisation.`,
          variant: "destructive"
        })
      }
      
      // Reload data
      await loadEmployeesWithCapabilities()
      
    } catch (error) {
      console.error('Failed to sync roles:', error)
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: "Rollen konnten nicht synchronisiert werden.",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleEmployeeClick = (employeeId: string) => {
    // Navigate to employee overview page with the selected employee
    onNavigateToEmployeeOverview?.(employeeId)
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.toLowerCase().includes(searchQuery.toLowerCase())
    // Only show users whose main role matches the filter (not active roles)
    const matchesRole = roleFilter === "all" || user.mainRole === roleFilter
    
    return matchesSearch && matchesRole
  })

  // Get roles that should be active based on the main role
  const getActiveRolesFromMainRole = (mainRole: Role): Role[] => {
    const mainRoleIndex = roleHierarchy.indexOf(mainRole);
    return roleHierarchy.filter((_, index) => index >= mainRoleIndex);
  }

  // Handle main role change
  const handleMainRoleChange = async (userId: string, newMainRole: Role) => {
    try {
      // Update in database
      await updateEmployeeRole(userId, newMainRole)
      
      // Update local state
      setUsers(prev => 
        prev.map(user => {
          if (user.id === userId) {
            const newActiveRoles = getActiveRolesFromMainRole(newMainRole);
            return { 
              ...user, 
              mainRole: newMainRole, 
              activeRoles: newActiveRoles,
              lastUpdated: new Date().toLocaleDateString('de-DE')
            };
          }
          return user;
        })
      )
      
      toast({
        title: "Rolle aktualisiert!",
        description: `Rolle erfolgreich auf ${roleConfig[newMainRole].label} geändert.`,
      })
      
    } catch (error) {
      console.error('Failed to update role:', error)
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Rolle konnte nicht geändert werden.",
        variant: "destructive"
      })
    }
  }

  // Stats for header
  const stats = {
    total: users.length,
    manager: users.filter(u => u.mainRole === "manager").length,
    allrounder: users.filter(u => u.mainRole === "allrounder").length,
    versorger: users.filter(u => u.mainRole === "versorger").length,
    verkauf: users.filter(u => u.mainRole === "verkauf").length,
    essen: users.filter(u => u.mainRole === "essen").length,
  }

  return (
    <div className="space-y-6">
      {/* Role Hierarchy Explanation */}
      <div className="bg-blue-50/50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Rollenhierarchie</h3>
            <Info className="h-4 w-4 text-gray-500" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHierarchyExpanded(!isHierarchyExpanded)}
              className="p-1 h-auto hover:bg-gray-200/50"
            >
              {isHierarchyExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sync Button */}
            <Button
              onClick={handleSyncAllRoles}
              disabled={isSyncing || roleLoading}
              variant="outline"
              className="gap-2 rounded-xl border-gray-200"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisiere...' : 'Rollen synchronisieren'}
            </Button>
            
            {/* Role Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl border-gray-200">
                  <Filter className="h-4 w-4" />
                  Rolle: {roleFilter === "all" ? "Alle" : roleConfig[roleFilter as Role]?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRoleFilter("all")}>
                  Alle Rollen
                </DropdownMenuItem>
                {roleHierarchy.map((role) => (
                  <DropdownMenuItem key={role} onClick={() => setRoleFilter(role)}>
                    {roleConfig[role].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Error Display */}
        {roleError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{roleError}</span>
          </div>
        )}
        
        {isHierarchyExpanded && (
          <div className="space-y-3 mt-4">
            {roleHierarchy.map((role) => (
              <div key={role} className="flex items-center gap-3">
                <Badge className={`${roleConfig[role].color}`}>
                  {roleConfig[role].label}
                </Badge>
                <span className="text-sm text-gray-700">{roleConfig[role].description}</span>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Loading State */}
      {(employeesLoading || roleLoading) && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Lade Mitarbeiterdaten...</p>
        </div>
      )}

      {/* Users List */}
      {!employeesLoading && !roleLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-lg transition-all duration-200"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <button
                  onClick={() => handleEmployeeClick(user.id)}
                  className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 hover:underline transition-all duration-200 cursor-pointer text-left"
                >
                  {user.name}
                </button>
                <p className="text-sm text-gray-600">{user.phone}</p>
              </div>
              <Badge className={`${roleConfig[user.mainRole].color}`}>
                {roleConfig[user.mainRole].label}
              </Badge>
            </div>

            {/* Active Roles */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Rollen</h4>
              <div className="grid grid-cols-5 gap-2">
                {roleHierarchy.map((role) => {
                  const isActive = user.activeRoles.includes(role);
                  return (
                    <button 
                      key={role}
                      onClick={() => handleMainRoleChange(user.id, role)}
                      className={`flex flex-col items-center p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${isActive ? roleConfig[role].color : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <div className="text-xs font-medium mb-1">{roleConfig[role].label}</div>
                      <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
                        {isActive ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Zuletzt aktualisiert: {user.lastUpdated}
              </p>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!employeesLoading && !roleLoading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Keine Benutzer gefunden</h3>
          <p className="text-gray-600">Versuchen Sie, Ihre Suchkriterien zu ändern</p>
        </div>
      )}
    </div>
  )
}