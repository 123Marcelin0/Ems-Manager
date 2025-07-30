import { supabase, supabaseAdmin } from '@/lib/supabase'

// Database schema validation types
interface TableSchema {
  table_name: string
  columns: ColumnInfo[]
  constraints: ConstraintInfo[]
  indexes: IndexInfo[]
  triggers: TriggerInfo[]
}

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
  character_maximum_length: number | null
  numeric_precision: number | null
  numeric_scale: number | null
}

interface ConstraintInfo {
  constraint_name: string
  constraint_type: string
  table_name: string
  column_name: string | null
  foreign_table_name: string | null
  foreign_column_name: string | null
  check_clause: string | null
}

interface IndexInfo {
  index_name: string
  table_name: string
  column_names: string[]
  is_unique: boolean
  index_type: string
}

interface TriggerInfo {
  trigger_name: string
  table_name: string
  event_manipulation: string
  action_timing: string
  action_statement: string
}

interface ValidationResult {
  table: string
  passed: boolean
  errors: string[]
  warnings: string[]
  performance_issues: string[]
}

interface SchemaValidationReport {
  overall_status: 'passed' | 'failed' | 'warnings'
  total_tables: number
  passed_tables: number
  failed_tables: number
  results: ValidationResult[]
  performance_summary: {
    slow_queries: string[]
    missing_indexes: string[]
    unused_indexes: string[]
  }
}

// Expected schema definitions
const EXPECTED_SCHEMAS = {
  employees: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'name', type: 'character varying', nullable: false },
      { name: 'user_id', type: 'character varying', nullable: false },
      { name: 'phone_number', type: 'character varying', nullable: false },
      { name: 'role', type: 'USER-DEFINED', nullable: false }, // employee_role enum
      { name: 'skills', type: 'ARRAY', nullable: true },
      { name: 'employment_type', type: 'USER-DEFINED', nullable: true }, // employment_type enum
      { name: 'is_always_needed', type: 'boolean', nullable: true },
      { name: 'last_worked_date', type: 'timestamp without time zone', nullable: true },
      { name: 'total_hours_worked', type: 'numeric', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'UNIQUE', columns: ['user_id'] }
    ],
    required_indexes: [
      { name: 'idx_employees_last_worked_date', columns: ['last_worked_date'] },
      { name: 'idx_employees_user_id', columns: ['user_id'] },
      { name: 'idx_employees_role', columns: ['role'] },
      { name: 'idx_employees_always_needed', columns: ['is_always_needed'] }
    ]
  },
  events: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'title', type: 'character varying', nullable: false },
      { name: 'location', type: 'character varying', nullable: false },
      { name: 'event_date', type: 'date', nullable: false },
      { name: 'start_time', type: 'time without time zone', nullable: false },
      { name: 'end_time', type: 'time without time zone', nullable: true },
      { name: 'description', type: 'text', nullable: true },
      { name: 'specialties', type: 'text', nullable: true },
      { name: 'hourly_rate', type: 'numeric', nullable: false },
      { name: 'employees_needed', type: 'integer', nullable: false },
      { name: 'employees_to_ask', type: 'integer', nullable: false },
      { name: 'status', type: 'USER-DEFINED', nullable: true }, // event_status enum
      { name: 'created_by', type: 'uuid', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'FOREIGN KEY', columns: ['created_by'], references: 'auth.users(id)' }
    ],
    required_indexes: [
      { name: 'idx_events_date', columns: ['event_date'] },
      { name: 'idx_events_status', columns: ['status'] },
      { name: 'idx_events_created_by', columns: ['created_by'] }
    ]
  },
  work_areas: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'event_id', type: 'uuid', nullable: true },
      { name: 'name', type: 'character varying', nullable: false },
      { name: 'location', type: 'character varying', nullable: false },
      { name: 'max_capacity', type: 'integer', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: true },
      { name: 'role_requirements', type: 'jsonb', nullable: false },
      { name: 'created_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'FOREIGN KEY', columns: ['event_id'], references: 'events(id)' }
    ],
    required_indexes: [
      { name: 'idx_work_areas_event', columns: ['event_id'] }
    ]
  },
  employee_event_status: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'employee_id', type: 'uuid', nullable: true },
      { name: 'event_id', type: 'uuid', nullable: true },
      { name: 'status', type: 'USER-DEFINED', nullable: false }, // employee_event_status_enum
      { name: 'asked_at', type: 'timestamp without time zone', nullable: true },
      { name: 'responded_at', type: 'timestamp without time zone', nullable: true },
      { name: 'response_method', type: 'character varying', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'FOREIGN KEY', columns: ['employee_id'], references: 'employees(id)' },
      { type: 'FOREIGN KEY', columns: ['event_id'], references: 'events(id)' },
      { type: 'UNIQUE', columns: ['employee_id', 'event_id'] }
    ],
    required_indexes: [
      { name: 'idx_employee_event_status_employee', columns: ['employee_id'] },
      { name: 'idx_employee_event_status_event', columns: ['event_id'] },
      { name: 'idx_employee_event_status_status', columns: ['status'] }
    ]
  },
  work_assignments: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'employee_id', type: 'uuid', nullable: true },
      { name: 'work_area_id', type: 'uuid', nullable: true },
      { name: 'event_id', type: 'uuid', nullable: true },
      { name: 'assigned_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'FOREIGN KEY', columns: ['employee_id'], references: 'employees(id)' },
      { type: 'FOREIGN KEY', columns: ['work_area_id'], references: 'work_areas(id)' },
      { type: 'FOREIGN KEY', columns: ['event_id'], references: 'events(id)' },
      { type: 'UNIQUE', columns: ['employee_id', 'event_id'] }
    ],
    required_indexes: [
      { name: 'idx_work_assignments_employee', columns: ['employee_id'] },
      { name: 'idx_work_assignments_event', columns: ['event_id'] }
    ]
  },
  time_records: {
    required_columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'employee_id', type: 'uuid', nullable: true },
      { name: 'event_id', type: 'uuid', nullable: true },
      { name: 'work_area_id', type: 'uuid', nullable: true },
      { name: 'sign_in_time', type: 'timestamp without time zone', nullable: false },
      { name: 'sign_out_time', type: 'timestamp without time zone', nullable: true },
      { name: 'total_hours', type: 'numeric', nullable: true },
      { name: 'hourly_rate', type: 'numeric', nullable: false },
      { name: 'total_payment', type: 'numeric', nullable: true },
      { name: 'status', type: 'USER-DEFINED', nullable: true }, // time_record_status enum
      { name: 'notes', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: true }
    ],
    required_constraints: [
      { type: 'PRIMARY KEY', columns: ['id'] },
      { type: 'FOREIGN KEY', columns: ['employee_id'], references: 'employees(id)' },
      { type: 'FOREIGN KEY', columns: ['event_id'], references: 'events(id)' },
      { type: 'FOREIGN KEY', columns: ['work_area_id'], references: 'work_areas(id)' }
    ],
    required_indexes: [
      { name: 'idx_time_records_employee', columns: ['employee_id'] },
      { name: 'idx_time_records_event', columns: ['event_id'] },
      { name: 'idx_time_records_status', columns: ['status'] }
    ]
  }
}

export class DatabaseSchemaValidator {
  private client = supabaseAdmin

  /**
   * Validate the entire database schema
   */
  async validateSchema(): Promise<SchemaValidationReport> {
    console.log('🔍 Starting comprehensive database schema validation...')
    
    const results: ValidationResult[] = []
    let passedTables = 0
    let failedTables = 0

    // Validate each expected table
    for (const [tableName, expectedSchema] of Object.entries(EXPECTED_SCHEMAS)) {
      console.log(`📋 Validating table: ${tableName}`)
      
      const result = await this.validateTable(tableName, expectedSchema)
      results.push(result)
      
      if (result.passed) {
        passedTables++
      } else {
        failedTables++
      }
    }

    // Get performance summary
    const performanceSummary = await this.analyzePerformance()

    const report: SchemaValidationReport = {
      overall_status: failedTables > 0 ? 'failed' : (results.some(r => r.warnings.length > 0) ? 'warnings' : 'passed'),
      total_tables: results.length,
      passed_tables: passedTables,
      failed_tables: failedTables,
      results,
      performance_summary: performanceSummary
    }

    console.log(`✅ Schema validation complete. Status: ${report.overall_status}`)
    console.log(`📊 Tables: ${passedTables}/${results.length} passed`)
    
    return report
  }

  /**
   * Validate a specific table schema
   */
  private async validateTable(tableName: string, expectedSchema: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      table: tableName,
      passed: true,
      errors: [],
      warnings: [],
      performance_issues: []
    }

    try {
      // Get actual table schema
      const actualSchema = await this.getTableSchema(tableName)
      
      if (!actualSchema) {
        result.passed = false
        result.errors.push(`Table '${tableName}' does not exist`)
        return result
      }

      // Validate columns
      await this.validateColumns(tableName, expectedSchema.required_columns, actualSchema.columns, result)
      
      // Validate constraints
      await this.validateConstraints(tableName, expectedSchema.required_constraints, actualSchema.constraints, result)
      
      // Validate indexes
      await this.validateIndexes(tableName, expectedSchema.required_indexes, actualSchema.indexes, result)
      
      // Validate triggers (if any)
      await this.validateTriggers(tableName, actualSchema.triggers, result)

    } catch (error) {
      result.passed = false
      result.errors.push(`Failed to validate table '${tableName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Get actual table schema from database
   */
  private async getTableSchema(tableName: string): Promise<TableSchema | null> {
    try {
      // Get columns using raw SQL query since information_schema is not accessible via Supabase client
      const { data: columns, error: columnsError } = await this.client.rpc('get_table_columns', {
        p_table_name: tableName
      })

      if (columnsError) throw columnsError
      if (!columns || columns.length === 0) return null

      // Get constraints
      const { data: constraints, error: constraintsError } = await this.client.rpc('get_table_constraints', {
        p_table_name: tableName
      })

      if (constraintsError) {
        console.warn(`Could not fetch constraints for ${tableName}:`, constraintsError)
      }

      // Get indexes
      const { data: indexes, error: indexesError } = await this.client.rpc('get_table_indexes', {
        p_table_name: tableName
      })

      if (indexesError) {
        console.warn(`Could not fetch indexes for ${tableName}:`, indexesError)
      }

      // Get triggers
      const { data: triggers, error: triggersError } = await this.client.rpc('get_table_triggers', {
        p_table_name: tableName
      })

      if (triggersError) {
        console.warn(`Could not fetch triggers for ${tableName}:`, triggersError)
      }

      return {
        table_name: tableName,
        columns: columns || [],
        constraints: constraints || [],
        indexes: indexes || [],
        triggers: triggers || []
      }
    } catch (error) {
      console.error(`Error getting schema for table ${tableName}:`, error)
      return null
    }
  }

  /**
   * Validate table columns
   */
  private async validateColumns(
    tableName: string,
    expectedColumns: any[],
    actualColumns: ColumnInfo[],
    result: ValidationResult
  ) {
    const actualColumnMap = new Map(actualColumns.map(col => [col.column_name, col]))

    for (const expectedCol of expectedColumns) {
      const actualCol = actualColumnMap.get(expectedCol.name)
      
      if (!actualCol) {
        result.passed = false
        result.errors.push(`Missing column '${expectedCol.name}' in table '${tableName}'`)
        continue
      }

      // Check data type
      if (expectedCol.type !== 'USER-DEFINED' && expectedCol.type !== 'ARRAY' && 
          !actualCol.data_type.includes(expectedCol.type)) {
        result.warnings.push(`Column '${expectedCol.name}' in table '${tableName}' has type '${actualCol.data_type}', expected '${expectedCol.type}'`)
      }

      // Check nullable
      const isNullable = actualCol.is_nullable === 'YES'
      if (isNullable !== expectedCol.nullable) {
        result.warnings.push(`Column '${expectedCol.name}' in table '${tableName}' nullable mismatch: actual=${isNullable}, expected=${expectedCol.nullable}`)
      }
    }

    // Check for unexpected columns
    for (const actualCol of actualColumns) {
      const isExpected = expectedColumns.some(exp => exp.name === actualCol.column_name)
      if (!isExpected) {
        result.warnings.push(`Unexpected column '${actualCol.column_name}' in table '${tableName}'`)
      }
    }
  }

  /**
   * Validate table constraints
   */
  private async validateConstraints(
    tableName: string,
    expectedConstraints: any[],
    actualConstraints: ConstraintInfo[],
    result: ValidationResult
  ) {
    for (const expectedConstraint of expectedConstraints) {
      const matchingConstraints = actualConstraints.filter(constraint => 
        constraint.constraint_type === expectedConstraint.type
      )

      if (matchingConstraints.length === 0) {
        result.passed = false
        result.errors.push(`Missing ${expectedConstraint.type} constraint in table '${tableName}'`)
      }
    }
  }

  /**
   * Validate table indexes
   */
  private async validateIndexes(
    tableName: string,
    expectedIndexes: any[],
    actualIndexes: IndexInfo[],
    result: ValidationResult
  ) {
    const actualIndexMap = new Map(actualIndexes.map(idx => [idx.index_name, idx]))

    for (const expectedIndex of expectedIndexes) {
      const actualIndex = actualIndexMap.get(expectedIndex.name)
      
      if (!actualIndex) {
        result.performance_issues.push(`Missing index '${expectedIndex.name}' in table '${tableName}'`)
        continue
      }

      // Check if index covers expected columns
      const expectedCols = expectedIndex.columns.sort()
      const actualCols = actualIndex.column_names.sort()
      
      if (JSON.stringify(expectedCols) !== JSON.stringify(actualCols)) {
        result.warnings.push(`Index '${expectedIndex.name}' in table '${tableName}' covers different columns than expected`)
      }
    }
  }

  /**
   * Validate table triggers
   */
  private async validateTriggers(
    tableName: string,
    actualTriggers: TriggerInfo[],
    result: ValidationResult
  ) {
    // Check for expected triggers based on table
    const expectedTriggers = this.getExpectedTriggers(tableName)
    
    for (const expectedTrigger of expectedTriggers) {
      const actualTrigger = actualTriggers.find(trigger => 
        trigger.trigger_name === expectedTrigger.name
      )
      
      if (!actualTrigger) {
        result.errors.push(`Missing trigger '${expectedTrigger.name}' in table '${tableName}'`)
        result.passed = false
      }
    }
  }

  /**
   * Get expected triggers for a table
   */
  private getExpectedTriggers(tableName: string): { name: string, description: string }[] {
    const triggers = []
    
    // Tables that should have updated_at triggers
    if (['employees', 'events', 'employee_event_status', 'time_records'].includes(tableName)) {
      triggers.push({
        name: `update_${tableName}_updated_at`,
        description: 'Automatically update updated_at timestamp'
      })
    }
    
    // Special triggers
    if (tableName === 'time_records') {
      triggers.push({
        name: 'calculate_time_totals',
        description: 'Calculate total hours and payment'
      })
      triggers.push({
        name: 'update_work_history',
        description: 'Update employee work history'
      })
    }
    
    return triggers
  }

  /**
   * Analyze database performance
   */
  private async analyzePerformance(): Promise<{
    slow_queries: string[]
    missing_indexes: string[]
    unused_indexes: string[]
  }> {
    const performanceSummary = {
      slow_queries: [],
      missing_indexes: [],
      unused_indexes: []
    }

    try {
      // This would require pg_stat_statements extension and other performance monitoring
      // For now, we'll do basic checks
      
      // Check for tables without primary keys
      const { data: tablesWithoutPK } = await this.client.rpc('find_tables_without_primary_key')
      if (tablesWithoutPK) {
        performanceSummary.missing_indexes.push(...tablesWithoutPK.map((table: any) => 
          `Table '${table.table_name}' missing primary key`
        ))
      }

    } catch (error) {
      console.warn('Could not analyze performance:', error)
    }

    return performanceSummary
  }

  /**
   * Generate a detailed report
   */
  generateReport(report: SchemaValidationReport): string {
    let output = '# Database Schema Validation Report\n\n'
    
    output += `**Overall Status:** ${report.overall_status.toUpperCase()}\n`
    output += `**Tables Validated:** ${report.total_tables}\n`
    output += `**Passed:** ${report.passed_tables}\n`
    output += `**Failed:** ${report.failed_tables}\n\n`

    // Table results
    output += '## Table Validation Results\n\n'
    for (const result of report.results) {
      output += `### ${result.table}\n`
      output += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`
      
      if (result.errors.length > 0) {
        output += '**Errors:**\n'
        result.errors.forEach(error => output += `- ${error}\n`)
        output += '\n'
      }
      
      if (result.warnings.length > 0) {
        output += '**Warnings:**\n'
        result.warnings.forEach(warning => output += `- ${warning}\n`)
        output += '\n'
      }
      
      if (result.performance_issues.length > 0) {
        output += '**Performance Issues:**\n'
        result.performance_issues.forEach(issue => output += `- ${issue}\n`)
        output += '\n'
      }
    }

    // Performance summary
    if (report.performance_summary.missing_indexes.length > 0 || 
        report.performance_summary.slow_queries.length > 0) {
      output += '## Performance Summary\n\n'
      
      if (report.performance_summary.missing_indexes.length > 0) {
        output += '**Missing Indexes:**\n'
        report.performance_summary.missing_indexes.forEach(index => output += `- ${index}\n`)
        output += '\n'
      }
      
      if (report.performance_summary.slow_queries.length > 0) {
        output += '**Slow Queries:**\n'
        report.performance_summary.slow_queries.forEach(query => output += `- ${query}\n`)
        output += '\n'
      }
    }

    return output
  }
}

// Utility function to run validation
export async function validateDatabaseSchema(): Promise<SchemaValidationReport> {
  const validator = new DatabaseSchemaValidator()
  return await validator.validateSchema()
}

// Utility function to run validation and log results
export async function runSchemaValidation(): Promise<void> {
  try {
    console.log('🚀 Starting database schema validation...')
    
    const validator = new DatabaseSchemaValidator()
    const report = await validator.validateSchema()
    
    console.log('\n' + validator.generateReport(report))
    
    if (report.overall_status === 'failed') {
      console.error('❌ Database schema validation failed!')
      process.exit(1)
    } else if (report.overall_status === 'warnings') {
      console.warn('⚠️ Database schema validation completed with warnings')
    } else {
      console.log('✅ Database schema validation passed!')
    }
    
  } catch (error) {
    console.error('💥 Schema validation failed with error:', error)
    process.exit(1)
  }
}