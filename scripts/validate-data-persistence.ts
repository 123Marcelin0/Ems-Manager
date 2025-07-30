#!/usr/bin/env tsx

/**
 * Comprehensive Data Persistence Validation Script
 * 
 * This script runs both database schema validation and data integrity checks
 * to ensure complete data persistence reliability.
 * 
 * Usage:
 *   npm run validate-data
 *   or
 *   npx tsx scripts/validate-data-persistence.ts
 */

// Load environment variables first
import './load-env'

import { validateDatabaseSchema } from '../lib/database-validator'
import { checkDataIntegrity } from '../lib/data-integrity-checker'
import fs from 'fs'
import path from 'path'

interface ValidationSummary {
  schema_validation: {
    status: string
    tables_passed: number
    tables_failed: number
    total_tables: number
  }
  integrity_check: {
    status: string
    total_issues: number
    critical_issues: number
    high_issues: number
    medium_issues: number
    low_issues: number
  }
  overall_status: 'passed' | 'warnings' | 'failed'
  recommendations: string[]
}

async function main() {
  const args = process.argv.slice(2)
  const outputDir = args.find(arg => arg.startsWith('--output-dir='))?.split('=')[1] || './validation-reports'
  const verbose = args.includes('--verbose')
  const skipSchema = args.includes('--skip-schema')
  const skipIntegrity = args.includes('--skip-integrity')
  const autoRepair = args.includes('--auto-repair')

  try {
    console.log('🚀 Starting comprehensive data persistence validation...\n')

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let schemaReport: any = null
    let integrityReport: any = null

    // Run schema validation
    if (!skipSchema) {
      console.log('📋 Running database schema validation...')
      schemaReport = await validateDatabaseSchema()
      
      // Save schema report
      const { DatabaseSchemaValidator } = await import('../lib/database-validator')
      const validator = new DatabaseSchemaValidator()
      const schemaReportText = validator.generateReport(schemaReport)
      fs.writeFileSync(
        path.join(outputDir, `schema-validation-${timestamp}.md`),
        schemaReportText
      )
      
      console.log(`✅ Schema validation complete. Status: ${schemaReport.overall_status}`)
    }

    // Run data integrity check
    if (!skipIntegrity) {
      console.log('\n📋 Running data integrity check...')
      integrityReport = await checkDataIntegrity()
      
      // Save integrity report
      const { DataIntegrityChecker } = await import('../lib/data-integrity-checker')
      const checker = new DataIntegrityChecker()
      const integrityReportText = checker.generateReport(integrityReport)
      fs.writeFileSync(
        path.join(outputDir, `integrity-check-${timestamp}.md`),
        integrityReportText
      )
      
      console.log(`✅ Integrity check complete. Status: ${integrityReport.overall_status}`)

      // Auto-repair if requested
      if (autoRepair && integrityReport.issues.length > 0) {
        console.log('\n🔧 Attempting automatic repairs...')
        const autoFixableIssues = integrityReport.issues.filter((issue: any) => issue.auto_fixable)
        
        if (autoFixableIssues.length > 0) {
          const repairResults = await checker.repairIssues(autoFixableIssues)
          const successfulRepairs = repairResults.filter(r => r.success).length
          
          console.log(`✅ Successfully repaired ${successfulRepairs}/${autoFixableIssues.length} auto-fixable issues`)
          
          // Save repair report
          const repairReportText = generateRepairReport(repairResults)
          fs.writeFileSync(
            path.join(outputDir, `repair-results-${timestamp}.md`),
            repairReportText
          )
        } else {
          console.log('ℹ️ No auto-fixable issues found')
        }
      }
    }

    // Generate summary
    const summary = generateSummary(schemaReport, integrityReport)
    const summaryText = generateSummaryReport(summary)
    
    // Save summary report
    fs.writeFileSync(
      path.join(outputDir, `validation-summary-${timestamp}.md`),
      summaryText
    )

    // Display summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 VALIDATION SUMMARY')
    console.log('='.repeat(60))
    
    if (schemaReport) {
      console.log(`Schema Validation: ${schemaReport.overall_status.toUpperCase()}`)
      console.log(`  Tables: ${schemaReport.passed_tables}/${schemaReport.total_tables} passed`)
    }
    
    if (integrityReport) {
      console.log(`Data Integrity: ${integrityReport.overall_status.toUpperCase()}`)
      console.log(`  Issues: ${integrityReport.total_issues} total (${integrityReport.critical_issues} critical)`)
    }
    
    console.log(`Overall Status: ${summary.overall_status.toUpperCase()}`)
    
    if (summary.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:')
      summary.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }
    
    console.log(`\n📄 Reports saved to: ${outputDir}`)

    // Exit with appropriate code
    if (summary.overall_status === 'failed') {
      console.log('\n❌ Data persistence validation FAILED!')
      process.exit(1)
    } else if (summary.overall_status === 'warnings') {
      console.log('\n⚠️ Data persistence validation completed with WARNINGS')
      process.exit(0)
    } else {
      console.log('\n✅ Data persistence validation PASSED!')
      process.exit(0)
    }

  } catch (error) {
    console.error('\n💥 Data persistence validation failed with error:')
    console.error(error)
    process.exit(1)
  }
}

function generateSummary(schemaReport: any, integrityReport: any): ValidationSummary {
  const summary: ValidationSummary = {
    schema_validation: {
      status: schemaReport?.overall_status || 'skipped',
      tables_passed: schemaReport?.passed_tables || 0,
      tables_failed: schemaReport?.failed_tables || 0,
      total_tables: schemaReport?.total_tables || 0
    },
    integrity_check: {
      status: integrityReport?.overall_status || 'skipped',
      total_issues: integrityReport?.total_issues || 0,
      critical_issues: integrityReport?.critical_issues || 0,
      high_issues: integrityReport?.high_issues || 0,
      medium_issues: integrityReport?.medium_issues || 0,
      low_issues: integrityReport?.low_issues || 0
    },
    overall_status: 'passed',
    recommendations: []
  }

  // Determine overall status
  if (schemaReport?.overall_status === 'failed' || integrityReport?.overall_status === 'critical_issues') {
    summary.overall_status = 'failed'
  } else if (schemaReport?.overall_status === 'warnings' || integrityReport?.overall_status === 'issues_found') {
    summary.overall_status = 'warnings'
  }

  // Generate recommendations
  if (schemaReport?.failed_tables > 0) {
    summary.recommendations.push('Fix database schema issues before proceeding with data operations')
  }
  
  if (integrityReport?.critical_issues > 0) {
    summary.recommendations.push('Address critical data integrity issues immediately')
  }
  
  if (integrityReport?.high_issues > 0) {
    summary.recommendations.push('Review and fix high-priority data integrity issues')
  }
  
  if (schemaReport?.performance_summary?.missing_indexes?.length > 0) {
    summary.recommendations.push('Add missing database indexes to improve performance')
  }
  
  if (integrityReport?.total_issues > 0) {
    const autoFixableCount = integrityReport.issues.filter((issue: any) => issue.auto_fixable).length
    if (autoFixableCount > 0) {
      summary.recommendations.push(`Consider running with --auto-repair to fix ${autoFixableCount} auto-fixable issues`)
    }
  }

  return summary
}

function generateSummaryReport(summary: ValidationSummary): string {
  let output = '# Data Persistence Validation Summary\n\n'
  
  output += `**Overall Status:** ${summary.overall_status.toUpperCase()}\n`
  output += `**Validation Date:** ${new Date().toISOString()}\n\n`

  // Schema validation summary
  output += '## Schema Validation\n\n'
  output += `**Status:** ${summary.schema_validation.status.toUpperCase()}\n`
  if (summary.schema_validation.total_tables > 0) {
    output += `**Tables Validated:** ${summary.schema_validation.total_tables}\n`
    output += `**Passed:** ${summary.schema_validation.tables_passed}\n`
    output += `**Failed:** ${summary.schema_validation.tables_failed}\n`
  }
  output += '\n'

  // Integrity check summary
  output += '## Data Integrity Check\n\n'
  output += `**Status:** ${summary.integrity_check.status.toUpperCase()}\n`
  output += `**Total Issues:** ${summary.integrity_check.total_issues}\n`
  output += `**Critical Issues:** ${summary.integrity_check.critical_issues}\n`
  output += `**High Priority Issues:** ${summary.integrity_check.high_issues}\n`
  output += `**Medium Priority Issues:** ${summary.integrity_check.medium_issues}\n`
  output += `**Low Priority Issues:** ${summary.integrity_check.low_issues}\n\n`

  // Recommendations
  if (summary.recommendations.length > 0) {
    output += '## Recommendations\n\n'
    summary.recommendations.forEach(rec => output += `- ${rec}\n`)
    output += '\n'
  }

  return output
}

function generateRepairReport(repairResults: any[]): string {
  let output = '# Automatic Repair Results\n\n'
  
  const successfulRepairs = repairResults.filter(r => r.success)
  const failedRepairs = repairResults.filter(r => !r.success)
  
  output += `**Total Repairs Attempted:** ${repairResults.length}\n`
  output += `**Successful:** ${successfulRepairs.length}\n`
  output += `**Failed:** ${failedRepairs.length}\n\n`

  if (successfulRepairs.length > 0) {
    output += '## Successful Repairs\n\n'
    successfulRepairs.forEach(repair => {
      output += `### ${repair.issue_id}\n`
      output += `**Action:** ${repair.action_taken}\n\n`
    })
  }

  if (failedRepairs.length > 0) {
    output += '## Failed Repairs\n\n'
    failedRepairs.forEach(repair => {
      output += `### ${repair.issue_id}\n`
      output += `**Action:** ${repair.action_taken}\n`
      output += `**Error:** ${repair.error_message}\n\n`
    })
  }

  return output
}

// Show help
function showHelp() {
  console.log(`
Comprehensive Data Persistence Validation Tool

Usage:
  npm run validate-data [options]
  npx tsx scripts/validate-data-persistence.ts [options]

Options:
  --output-dir=<dir>     Save reports to directory (default: ./validation-reports)
  --verbose              Show detailed results
  --skip-schema          Skip database schema validation
  --skip-integrity       Skip data integrity check
  --auto-repair          Attempt automatic repair of fixable issues
  --help                 Show this help message

Examples:
  npm run validate-data
  npm run validate-data --verbose --auto-repair
  npm run validate-data --output-dir=./reports --skip-schema
`)
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})