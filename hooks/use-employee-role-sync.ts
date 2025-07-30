import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type EmployeeRole = 'manager' | 'allrounder' | 'versorger' | 'verkauf' | 'essen'

interface Employee {
  id: string
  name: string
  user_id: string
  phone_number: string
  role: EmployeeRole
  skills: string[]
  employment_type: 'part_time' | 'fixed'
  is_always_needed: boolean
  last_worked_date: string | null
  total_hours_worked: number
  created_at: string
  updated_at: string
}

interface RoleHierarchy {
  role: EmployeeRole
  label: string
  color: string
  description: string
  canPerform: EmployeeRole[]
}

// Define role hierarchy with permissions
const ROLE_HIERARCHY: RoleHierarchy[] = [
  {
    role: 'manager',
    label: 'Manager',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Kann alle Rollen ausführen',
    canPerform: ['manager', 'allrounder', 'versorger', 'verkauf', 'essen']
  },
  {
    role: 'allrounder',
    label: 'Allrounder',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Kann Versorger, Verkauf und Essen ausführen',
    canPerform: ['allrounder', 'versorger', 'verkauf', 'essen']
  },
  {
    role: 'versorger',
    label: 'Versorger',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Kann Verkauf und Essen ausführen',
    canPerform: ['versorger', 'verkauf', 'essen']
  },
  {
    role: 'verkauf',
    label: 'Verkauf',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: 'Kann Essen ausführen',
    canPerform: ['verkauf', 'essen']
  },
  {
    role: 'essen',
    label: 'Essen',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Basis-Rolle',
    canPerform: ['essen']
  }
]

export function useEmployeeRoleSync() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get role hierarchy information
  const getRoleHierarchy = useCallback(() => {
    return ROLE_HIERARCHY
  }, [])

  // Get roles that an employee can perform based on their main role
  const getPerformableRoles = useCallback((mainRole: EmployeeRole): EmployeeRole[] => {
    const roleInfo = ROLE_HIERARCHY.find(r => r.role === mainRole)
    return roleInfo?.canPerform || [mainRole]
  }, [])

  // Get role configuration
  const getRoleConfig = useCallback((role: EmployeeRole) => {
    return ROLE_HIERARCHY.find(r => r.role === role) || ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]
  }, [])

  // Sync all employees to ensure role consistency
  const syncAllEmployeeRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Starting employee role synchronization...')
      
      // Fetch all employees
      const { data: employees, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (fetchError) {
        throw new Error(`Failed to fetch employees: ${fetchError.message}`)
      }

      if (!employees || employees.length === 0) {
        console.log('✅ No employees found to sync')
        return { synced: 0, errors: [] }
      }

      console.log(`📋 Found ${employees.length} employees to sync`)

      const syncResults = {
        synced: 0,
        errors: [] as string[]
      }

      // Process each employee
      for (const employee of employees) {
        try {
          // Validate role
          const validRoles: EmployeeRole[] = ['manager', 'allrounder', 'versorger', 'verkauf', 'essen']
          if (!validRoles.includes(employee.role)) {
            console.warn(`⚠️ Invalid role '${employee.role}' for employee ${employee.name}, setting to 'essen'`)
            
            // Update employee with valid role
            const { error: updateError } = await supabase
              .from('employees')
              .update({ role: 'essen' })
              .eq('id', employee.id)

            if (updateError) {
              throw new Error(`Failed to update role for ${employee.name}: ${updateError.message}`)
            }
          }

          // Ensure skills array is properly formatted
          const skills = Array.isArray(employee.skills) ? employee.skills : []
          const performableRoles = getPerformableRoles(employee.role)
          
          // Update skills to match role capabilities
          const updatedSkills = [...new Set([...skills, ...performableRoles])]
          
          if (JSON.stringify(skills) !== JSON.stringify(updatedSkills)) {
            const { error: skillsUpdateError } = await supabase
              .from('employees')
              .update({ skills: updatedSkills })
              .eq('id', employee.id)

            if (skillsUpdateError) {
              throw new Error(`Failed to update skills for ${employee.name}: ${skillsUpdateError.message}`)
            }
          }

          syncResults.synced++
          console.log(`✅ Synced employee: ${employee.name} (${employee.role})`)
          
        } catch (employeeError) {
          const errorMsg = `Failed to sync ${employee.name}: ${employeeError instanceof Error ? employeeError.message : 'Unknown error'}`
          console.error(errorMsg)
          syncResults.errors.push(errorMsg)
        }
      }

      console.log(`🎉 Employee role sync completed: ${syncResults.synced} synced, ${syncResults.errors.length} errors`)
      return syncResults
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync employee roles'
      console.error('❌ Employee role sync failed:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getPerformableRoles])

  // Update employee role
  const updateEmployeeRole = useCallback(async (employeeId: string, newRole: EmployeeRole) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Updating employee ${employeeId} role to ${newRole}`)
      
      // Get current employee data
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch employee: ${fetchError.message}`)
      }

      if (!employee) {
        throw new Error('Employee not found')
      }

      // Calculate new performable roles
      const performableRoles = getPerformableRoles(newRole)
      const currentSkills = Array.isArray(employee.skills) ? employee.skills : []
      
      // Update skills to include all performable roles
      const updatedSkills = [...new Set([...currentSkills.filter(skill => !ROLE_HIERARCHY.some(r => r.role === skill)), ...performableRoles])]

      // Update employee in database
      const { data: updatedEmployee, error: updateError } = await supabase
        .from('employees')
        .update({
          role: newRole,
          skills: updatedSkills,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update employee role: ${updateError.message}`)
      }

      console.log(`✅ Successfully updated ${employee.name} role to ${newRole}`)
      return updatedEmployee
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee role'
      console.error('❌ Role update failed:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getPerformableRoles])

  // Bulk update multiple employee roles
  const bulkUpdateEmployeeRoles = useCallback(async (updates: Array<{ employeeId: string; newRole: EmployeeRole }>) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Bulk updating ${updates.length} employee roles`)
      
      const results = {
        updated: 0,
        errors: [] as string[]
      }

      for (const update of updates) {
        try {
          await updateEmployeeRole(update.employeeId, update.newRole)
          results.updated++
        } catch (err) {
          const errorMsg = `Failed to update employee ${update.employeeId}: ${err instanceof Error ? err.message : 'Unknown error'}`
          results.errors.push(errorMsg)
        }
      }

      console.log(`🎉 Bulk update completed: ${results.updated} updated, ${results.errors.length} errors`)
      return results
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update employee roles'
      console.error('❌ Bulk update failed:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [updateEmployeeRole])

  // Get employees with their role capabilities
  const getEmployeesWithCapabilities = useCallback(async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch employees: ${error.message}`)
      }

      return (employees || []).map(employee => ({
        ...employee,
        roleConfig: getRoleConfig(employee.role),
        performableRoles: getPerformableRoles(employee.role)
      }))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees with capabilities'
      setError(errorMessage)
      throw err
    }
  }, [getRoleConfig, getPerformableRoles])

  // Validate role assignment for work areas
  const validateRoleAssignment = useCallback((employeeRole: EmployeeRole, requiredRole: EmployeeRole): boolean => {
    const performableRoles = getPerformableRoles(employeeRole)
    return performableRoles.includes(requiredRole)
  }, [getPerformableRoles])

  // Get role statistics
  const getRoleStatistics = useCallback(async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('role')

      if (error) {
        throw new Error(`Failed to fetch role statistics: ${error.message}`)
      }

      const stats = ROLE_HIERARCHY.reduce((acc, roleInfo) => {
        acc[roleInfo.role] = {
          ...roleInfo,
          count: (employees || []).filter(emp => emp.role === roleInfo.role).length
        }
        return acc
      }, {} as Record<EmployeeRole, RoleHierarchy & { count: number }>)

      return {
        total: employees?.length || 0,
        byRole: stats
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get role statistics'
      setError(errorMessage)
      throw err
    }
  }, [])

  return {
    loading,
    error,
    getRoleHierarchy,
    getPerformableRoles,
    getRoleConfig,
    syncAllEmployeeRoles,
    updateEmployeeRole,
    bulkUpdateEmployeeRoles,
    getEmployeesWithCapabilities,
    validateRoleAssignment,
    getRoleStatistics
  }
}