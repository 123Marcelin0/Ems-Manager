import { supabase, supabaseAdmin } from '@/lib/supabase'

// Data integrity types
interface IntegrityIssue {
  type: 'orphaned_record' | 'broken_relationship' | 'invalid_jsonb' | 'enum_violation' | 'constraint_violation'
  severity: 'critical' | 'high' | 'medium' | 'low'
  table: string
  column?: string
  record_id?: string
  description: string
  suggested_fix: string
  auto_fixable: boolean
}

interface IntegrityReport {
  overall_status: 'healthy' | 'issues_found' | 'critical_issues'
  total_issues: number
  critical_issues: number
  high_issues: number
  medium_issues: number
  low_issues: number
  issues: IntegrityIssue[]
  tables_checked: string[]
  check_timestamp: string
}

interface RepairResult {
  issue_id: string
  success: boolean
  action_taken: string
  error_message?: string
}

export class DataIntegrityChecker {
  private client = supabaseAdmin

  /**
   * Run comprehensive data integrity check
   */
  async checkDataIntegrity(): Promise<IntegrityReport> {
    console.log('🔍 Starting comprehensive data integrity check...')
    
    const issues: IntegrityIssue[] = []
    const tablesChecked: string[] = []

    // Check referential integrity
    console.log('📋 Checking referential integrity...')
    const referentialIssues = await this.checkReferentialIntegrity()
    issues.push(...referentialIssues)
    tablesChecked.push('referential_integrity')

    // Check JSONB data structure
    console.log('📋 Checking JSONB data structures...')
    const jsonbIssues = await this.checkJsonbIntegrity()
    issues.push(...jsonbIssues)
    tablesChecked.push('work_areas')

    // Check enum value consistency
    console.log('📋 Checking enum value consistency...')
    const enumIssues = await this.checkEnumConsistency()
    issues.push(...enumIssues)
    tablesChecked.push('enum_values')

    // Check business rule violations
    console.log('📋 Checking business rule violations...')
    const businessRuleIssues = await this.checkBusinessRules()
    issues.push(...businessRuleIssues)
    tablesChecked.push('business_rules')

    // Check data consistency across related tables
    console.log('📋 Checking cross-table data consistency...')
    const consistencyIssues = await this.checkCrossTableConsistency()
    issues.push(...consistencyIssues)
    tablesChecked.push('cross_table_consistency')

    // Categorize issues by severity
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const mediumIssues = issues.filter(i => i.severity === 'medium').length
    const lowIssues = issues.filter(i => i.severity === 'low').length

    const report: IntegrityReport = {
      overall_status: criticalIssues > 0 ? 'critical_issues' : (issues.length > 0 ? 'issues_found' : 'healthy'),
      total_issues: issues.length,
      critical_issues: criticalIssues,
      high_issues: highIssues,
      medium_issues: mediumIssues,
      low_issues: lowIssues,
      issues,
      tables_checked: tablesChecked,
      check_timestamp: new Date().toISOString()
    }

    console.log(`✅ Data integrity check complete. Found ${issues.length} issues.`)
    return report
  }

  /**
   * Check referential integrity across all tables
   */
  private async checkReferentialIntegrity(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      const { data: orphanedRecords, error } = await this.client.rpc('check_referential_integrity')
      
      if (error) {
        console.warn('Could not check referential integrity:', error)
        return issues
      }

      if (orphanedRecords && orphanedRecords.length > 0) {
        for (const record of orphanedRecords) {
          issues.push({
            type: 'orphaned_record',
            severity: 'high',
            table: record.table_name,
            column: record.column_name,
            description: `Found ${record.orphaned_count} orphaned records in ${record.table_name}.${record.column_name} referencing ${record.foreign_table}.${record.foreign_column}`,
            suggested_fix: `Delete orphaned records or restore missing parent records in ${record.foreign_table}`,
            auto_fixable: true
          })
        }
      }
    } catch (error) {
      console.error('Error checking referential integrity:', error)
    }

    return issues
  }

  /**
   * Check JSONB data structure integrity
   */
  private async checkJsonbIntegrity(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      const { data: jsonbErrors, error } = await this.client.rpc('validate_work_areas_jsonb')
      
      if (error) {
        console.warn('Could not validate JSONB data:', error)
        return issues
      }

      if (jsonbErrors && jsonbErrors.length > 0) {
        for (const jsonbError of jsonbErrors) {
          issues.push({
            type: 'invalid_jsonb',
            severity: 'medium',
            table: 'work_areas',
            column: 'role_requirements',
            record_id: jsonbError.work_area_id,
            description: `Invalid JSONB structure in work_areas.role_requirements: ${jsonbError.validation_error}`,
            suggested_fix: 'Fix the JSONB structure to match expected role requirements format',
            auto_fixable: false
          })
        }
      }
    } catch (error) {
      console.error('Error checking JSONB integrity:', error)
    }

    return issues
  }

  /**
   * Check enum value consistency
   */
  private async checkEnumConsistency(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      const { data: enumErrors, error } = await this.client.rpc('check_enum_consistency')
      
      if (error) {
        console.warn('Could not check enum consistency:', error)
        return issues
      }

      if (enumErrors && enumErrors.length > 0) {
        for (const enumError of enumErrors) {
          issues.push({
            type: 'enum_violation',
            severity: 'high',
            table: enumError.table_name,
            column: enumError.column_name,
            description: `Found ${enumError.record_count} records with invalid enum values in ${enumError.table_name}.${enumError.column_name}`,
            suggested_fix: `Update invalid enum values to valid options or add new enum values if needed`,
            auto_fixable: false
          })
        }
      }
    } catch (error) {
      console.error('Error checking enum consistency:', error)
    }

    return issues
  }

  /**
   * Check business rule violations
   */
  private async checkBusinessRules(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check for events with invalid date/time combinations
      const { data: invalidEvents, error: eventsError } = await this.client
        .from('events')
        .select('id, title, event_date, start_time, end_time')
        .not('end_time', 'is', null)

      if (!eventsError && invalidEvents) {
        for (const event of invalidEvents) {
          const startDateTime = new Date(`${event.event_date}T${event.start_time}`)
          const endDateTime = new Date(`${event.event_date}T${event.end_time}`)
          
          if (endDateTime <= startDateTime) {
            issues.push({
              type: 'constraint_violation',
              severity: 'medium',
              table: 'events',
              record_id: event.id,
              description: `Event "${event.title}" has end time before or equal to start time`,
              suggested_fix: 'Update event times to ensure end time is after start time',
              auto_fixable: false
            })
          }
        }
      }

      // Check for work areas with capacity issues
      const { data: workAreasWithAssignments, error: workAreasError } = await this.client
        .from('work_areas')
        .select(`
          id, 
          name, 
          max_capacity,
          work_assignments(count)
        `)

      if (!workAreasError && workAreasWithAssignments) {
        for (const workArea of workAreasWithAssignments) {
          const assignmentCount = workArea.work_assignments?.[0]?.count || 0
          
          if (assignmentCount > workArea.max_capacity) {
            issues.push({
              type: 'constraint_violation',
              severity: 'high',
              table: 'work_areas',
              record_id: workArea.id,
              description: `Work area "${workArea.name}" has ${assignmentCount} assignments but max capacity is ${workArea.max_capacity}`,
              suggested_fix: 'Either increase max capacity or remove excess assignments',
              auto_fixable: false
            })
          }
        }
      }

      // Check for employees with invalid phone numbers
      const { data: employeesWithInvalidPhones, error: phoneError } = await this.client
        .from('employees')
        .select('id, name, phone_number')
        .not('phone_number', 'like', '+%')

      if (!phoneError && employeesWithInvalidPhones && employeesWithInvalidPhones.length > 0) {
        for (const employee of employeesWithInvalidPhones) {
          issues.push({
            type: 'constraint_violation',
            severity: 'low',
            table: 'employees',
            record_id: employee.id,
            description: `Employee "${employee.name}" has invalid phone number format: ${employee.phone_number}`,
            suggested_fix: 'Update phone number to international format starting with +',
            auto_fixable: false
          })
        }
      }

    } catch (error) {
      console.error('Error checking business rules:', error)
    }

    return issues
  }

  /**
   * Check cross-table data consistency
   */
  private async checkCrossTableConsistency(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = []

    try {
      // Check for employee event status without corresponding event
      const { data: statusWithoutEvent, error: statusError } = await this.client.rpc('find_orphaned_employee_event_status')

      if (!statusError && statusWithoutEvent && statusWithoutEvent.length > 0) {
        issues.push({
          type: 'broken_relationship',
          severity: 'high',
          table: 'employee_event_status',
          description: `Found ${statusWithoutEvent.length} employee event status records without corresponding events`,
          suggested_fix: 'Remove orphaned employee event status records',
          auto_fixable: true
        })
      }

      // Check for work assignments without corresponding work areas
      const { data: assignmentsWithoutWorkArea, error: assignmentError } = await this.client.rpc('find_orphaned_work_assignments')

      if (!assignmentError && assignmentsWithoutWorkArea && assignmentsWithoutWorkArea.length > 0) {
        issues.push({
          type: 'broken_relationship',
          severity: 'high',
          table: 'work_assignments',
          description: `Found ${assignmentsWithoutWorkArea.length} work assignments without corresponding work areas`,
          suggested_fix: 'Remove orphaned work assignment records',
          auto_fixable: true
        })
      }

      // Check for time records with inconsistent data
      const { data: inconsistentTimeRecords, error: timeError } = await this.client
        .from('time_records')
        .select('id, sign_in_time, sign_out_time, total_hours, hourly_rate, total_payment')
        .not('sign_out_time', 'is', null)
        .not('total_hours', 'is', null)

      if (!timeError && inconsistentTimeRecords) {
        for (const record of inconsistentTimeRecords) {
          const signInTime = new Date(record.sign_in_time)
          const signOutTime = new Date(record.sign_out_time)
          const actualHours = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60)
          const recordedHours = parseFloat(record.total_hours)
          const expectedPayment = actualHours * parseFloat(record.hourly_rate)
          const recordedPayment = parseFloat(record.total_payment)

          // Check if calculated hours match recorded hours (within 0.1 hour tolerance)
          if (Math.abs(actualHours - recordedHours) > 0.1) {
            issues.push({
              type: 'constraint_violation',
              severity: 'medium',
              table: 'time_records',
              record_id: record.id,
              description: `Time record has inconsistent hours: calculated ${actualHours.toFixed(2)}, recorded ${recordedHours}`,
              suggested_fix: 'Recalculate and update total hours based on sign-in/sign-out times',
              auto_fixable: true
            })
          }

          // Check if calculated payment matches recorded payment (within $0.01 tolerance)
          if (Math.abs(expectedPayment - recordedPayment) > 0.01) {
            issues.push({
              type: 'constraint_violation',
              severity: 'medium',
              table: 'time_records',
              record_id: record.id,
              description: `Time record has inconsistent payment: calculated $${expectedPayment.toFixed(2)}, recorded $${recordedPayment.toFixed(2)}`,
              suggested_fix: 'Recalculate and update total payment based on hours and hourly rate',
              auto_fixable: true
            })
          }
        }
      }

    } catch (error) {
      console.error('Error checking cross-table consistency:', error)
    }

    return issues
  }

  /**
   * Attempt to automatically repair issues
   */
  async repairIssues(issues: IntegrityIssue[]): Promise<RepairResult[]> {
    console.log(`🔧 Attempting to repair ${issues.length} issues...`)
    
    const results: RepairResult[] = []
    
    for (const issue of issues) {
      if (!issue.auto_fixable) {
        results.push({
          issue_id: `${issue.table}-${issue.type}`,
          success: false,
          action_taken: 'Skipped - not auto-fixable',
          error_message: 'This issue requires manual intervention'
        })
        continue
      }

      try {
        const result = await this.repairSingleIssue(issue)
        results.push(result)
      } catch (error) {
        results.push({
          issue_id: `${issue.table}-${issue.type}`,
          success: false,
          action_taken: 'Failed to repair',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Successfully repaired ${successCount}/${results.length} issues`)
    
    return results
  }

  /**
   * Repair a single issue
   */
  private async repairSingleIssue(issue: IntegrityIssue): Promise<RepairResult> {
    const issueId = `${issue.table}-${issue.type}-${issue.record_id || 'unknown'}`

    switch (issue.type) {
      case 'orphaned_record':
        return await this.repairOrphanedRecord(issue, issueId)
      
      case 'broken_relationship':
        return await this.repairBrokenRelationship(issue, issueId)
      
      case 'constraint_violation':
        return await this.repairConstraintViolation(issue, issueId)
      
      default:
        return {
          issue_id: issueId,
          success: false,
          action_taken: 'No repair strategy available',
          error_message: `Unknown issue type: ${issue.type}`
        }
    }
  }

  /**
   * Repair orphaned records
   */
  private async repairOrphanedRecord(issue: IntegrityIssue, issueId: string): Promise<RepairResult> {
    // For now, we'll just log what would be done
    // In a real implementation, you'd want to be very careful about deleting data
    
    return {
      issue_id: issueId,
      success: false,
      action_taken: 'Logged for manual review',
      error_message: 'Automatic deletion of orphaned records disabled for safety'
    }
  }

  /**
   * Repair broken relationships
   */
  private async repairBrokenRelationship(issue: IntegrityIssue, issueId: string): Promise<RepairResult> {
    // Similar to orphaned records, this would require careful handling
    
    return {
      issue_id: issueId,
      success: false,
      action_taken: 'Logged for manual review',
      error_message: 'Automatic repair of broken relationships disabled for safety'
    }
  }

  /**
   * Repair constraint violations
   */
  private async repairConstraintViolation(issue: IntegrityIssue, issueId: string): Promise<RepairResult> {
    if (issue.table === 'time_records' && issue.record_id) {
      // This is safe to auto-repair as it's just recalculating values
      try {
        const { error } = await this.client
          .rpc('recalculate_time_record', { p_record_id: issue.record_id })

        if (error) throw error

        return {
          issue_id: issueId,
          success: true,
          action_taken: 'Recalculated time record totals'
        }
      } catch (error) {
        return {
          issue_id: issueId,
          success: false,
          action_taken: 'Failed to recalculate time record',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return {
      issue_id: issueId,
      success: false,
      action_taken: 'Logged for manual review',
      error_message: 'Constraint violation requires manual intervention'
    }
  }

  /**
   * Generate a detailed integrity report
   */
  generateReport(report: IntegrityReport): string {
    let output = '# Data Integrity Report\n\n'
    
    output += `**Overall Status:** ${report.overall_status.toUpperCase()}\n`
    output += `**Check Timestamp:** ${report.check_timestamp}\n`
    output += `**Total Issues:** ${report.total_issues}\n`
    output += `**Critical Issues:** ${report.critical_issues}\n`
    output += `**High Priority Issues:** ${report.high_issues}\n`
    output += `**Medium Priority Issues:** ${report.medium_issues}\n`
    output += `**Low Priority Issues:** ${report.low_issues}\n`
    output += `**Tables Checked:** ${report.tables_checked.join(', ')}\n\n`

    if (report.issues.length === 0) {
      output += '✅ **No data integrity issues found!**\n\n'
      return output
    }

    // Group issues by severity
    const issuesBySeverity = {
      critical: report.issues.filter(i => i.severity === 'critical'),
      high: report.issues.filter(i => i.severity === 'high'),
      medium: report.issues.filter(i => i.severity === 'medium'),
      low: report.issues.filter(i => i.severity === 'low')
    }

    for (const [severity, issues] of Object.entries(issuesBySeverity)) {
      if (issues.length === 0) continue

      output += `## ${severity.toUpperCase()} Priority Issues\n\n`
      
      for (const issue of issues) {
        output += `### ${issue.table} - ${issue.type}\n`
        output += `**Description:** ${issue.description}\n`
        output += `**Suggested Fix:** ${issue.suggested_fix}\n`
        output += `**Auto-fixable:** ${issue.auto_fixable ? 'Yes' : 'No'}\n`
        if (issue.record_id) {
          output += `**Record ID:** ${issue.record_id}\n`
        }
        if (issue.column) {
          output += `**Column:** ${issue.column}\n`
        }
        output += '\n'
      }
    }

    return output
  }
}

// Utility functions
export async function checkDataIntegrity(): Promise<IntegrityReport> {
  const checker = new DataIntegrityChecker()
  return await checker.checkDataIntegrity()
}

export async function runIntegrityCheck(): Promise<void> {
  try {
    console.log('🚀 Starting data integrity check...')
    
    const checker = new DataIntegrityChecker()
    const report = await checker.checkDataIntegrity()
    
    console.log('\n' + checker.generateReport(report))
    
    if (report.overall_status === 'critical_issues') {
      console.error('❌ Critical data integrity issues found!')
      process.exit(1)
    } else if (report.overall_status === 'issues_found') {
      console.warn('⚠️ Data integrity issues found')
    } else {
      console.log('✅ Data integrity check passed!')
    }
    
  } catch (error) {
    console.error('💥 Data integrity check failed with error:', error)
    process.exit(1)
  }
}