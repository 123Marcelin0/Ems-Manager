import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Starting employee role synchronization...')
    
    // Fetch all employees
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (fetchError) {
      console.error('❌ Failed to fetch employees:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch employees: ${fetchError.message}`
      }, { status: 500 })
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No employees found to sync',
        synced: 0,
        errors: []
      })
    }

    console.log(`📋 Found ${employees.length} employees to sync`)

    const syncResults = {
      synced: 0,
      errors: [] as string[]
    }

    // Define role hierarchy
    const roleHierarchy = {
      manager: ['manager', 'allrounder', 'versorger', 'verkauf', 'essen'],
      allrounder: ['allrounder', 'versorger', 'verkauf', 'essen'],
      versorger: ['versorger', 'verkauf', 'essen'],
      verkauf: ['verkauf', 'essen'],
      essen: ['essen']
    }

    // Process each employee
    for (const employee of employees) {
      try {
        // Validate role
        const validRoles = ['manager', 'allrounder', 'versorger', 'verkauf', 'essen']
        let updatedRole = employee.role
        
        if (!validRoles.includes(employee.role)) {
          console.warn(`⚠️ Invalid role '${employee.role}' for employee ${employee.name}, setting to 'essen'`)
          updatedRole = 'essen'
        }

        // Ensure skills array is properly formatted
        const skills = Array.isArray(employee.skills) ? employee.skills : []
        const performableRoles = roleHierarchy[updatedRole as keyof typeof roleHierarchy] || ['essen']
        
        // Update skills to match role capabilities
        const updatedSkills = [...new Set([...skills.filter(skill => !validRoles.includes(skill)), ...performableRoles])]
        
        // Update employee if needed
        const needsUpdate = updatedRole !== employee.role || JSON.stringify(skills) !== JSON.stringify(updatedSkills)
        
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('employees')
            .update({ 
              role: updatedRole,
              skills: updatedSkills,
              updated_at: new Date().toISOString()
            })
            .eq('id', employee.id)

          if (updateError) {
            throw new Error(`Failed to update ${employee.name}: ${updateError.message}`)
          }
        }

        syncResults.synced++
        console.log(`✅ Synced employee: ${employee.name} (${updatedRole})`)
        
      } catch (employeeError) {
        const errorMsg = `Failed to sync ${employee.name}: ${employeeError instanceof Error ? employeeError.message : 'Unknown error'}`
        console.error(errorMsg)
        syncResults.errors.push(errorMsg)
      }
    }

    console.log(`🎉 Employee role sync completed: ${syncResults.synced} synced, ${syncResults.errors.length} errors`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncResults.synced} employees`,
      synced: syncResults.synced,
      errors: syncResults.errors
    })
    
  } catch (error) {
    console.error('❌ Employee role sync failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync employee roles'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, newRole } = body

    if (!employeeId || !newRole) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID and new role are required'
      }, { status: 400 })
    }

    console.log(`🔄 API: Updating employee ${employeeId} role to ${newRole}`)
    
    // Validate role
    const validRoles = ['manager', 'allrounder', 'versorger', 'verkauf', 'essen']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({
        success: false,
        error: `Invalid role: ${newRole}`
      }, { status: 400 })
    }

    // Get current employee data
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch employee:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch employee: ${fetchError.message}`
      }, { status: 500 })
    }

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found'
      }, { status: 404 })
    }

    // Define role hierarchy
    const roleHierarchy = {
      manager: ['manager', 'allrounder', 'versorger', 'verkauf', 'essen'],
      allrounder: ['allrounder', 'versorger', 'verkauf', 'essen'],
      versorger: ['versorger', 'verkauf', 'essen'],
      verkauf: ['verkauf', 'essen'],
      essen: ['essen']
    }

    // Calculate new performable roles
    const performableRoles = roleHierarchy[newRole as keyof typeof roleHierarchy] || ['essen']
    const currentSkills = Array.isArray(employee.skills) ? employee.skills : []
    
    // Update skills to include all performable roles
    const updatedSkills = [...new Set([...currentSkills.filter(skill => !validRoles.includes(skill)), ...performableRoles])]

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
      console.error('❌ Failed to update employee role:', updateError)
      return NextResponse.json({
        success: false,
        error: `Failed to update employee role: ${updateError.message}`
      }, { status: 500 })
    }

    console.log(`✅ Successfully updated ${employee.name} role to ${newRole}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${employee.name} role to ${newRole}`,
      employee: updatedEmployee
    })
    
  } catch (error) {
    console.error('❌ Role update failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee role'
    }, { status: 500 })
  }
}