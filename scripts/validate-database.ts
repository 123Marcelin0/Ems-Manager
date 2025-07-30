#!/usr/bin/env tsx

/**
 * Database Schema Validation Script
 * 
 * This script validates the entire database schema to ensure data persistence reliability.
 * It checks table structures, constraints, indexes, triggers, and data integrity.
 * 
 * Usage:
 *   npm run validate-db
 *   or
 *   npx tsx scripts/validate-database.ts
 */

// Load environment variables first
import './load-env'

import { validateDatabaseSchema, runSchemaValidation } from '../lib/database-validator'
import fs from 'fs'
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1]
  const verbose = args.includes('--verbose')
  const jsonOutput = args.includes('--json')

  try {
    console.log('🚀 Starting comprehensive database schema validation...\n')

    // Run the validation
    const report = await validateDatabaseSchema()

    if (jsonOutput) {
      // Output JSON format
      const jsonReport = JSON.stringify(report, null, 2)
      
      if (outputFile) {
        fs.writeFileSync(outputFile, jsonReport)
        console.log(`📄 JSON report saved to: ${outputFile}`)
      } else {
        console.log(jsonReport)
      }
    } else {
      // Output human-readable format
      const { DatabaseSchemaValidator } = await import('../lib/database-validator')
      const validator = new DatabaseSchemaValidator()
      const readableReport = validator.generateReport(report)
      
      if (outputFile) {
        fs.writeFileSync(outputFile, readableReport)
        console.log(`📄 Report saved to: ${outputFile}`)
      } else {
        console.log(readableReport)
      }
    }

    // Print summary
    console.log('\n📊 VALIDATION SUMMARY')
    console.log('='.repeat(50))
    console.log(`Overall Status: ${report.overall_status.toUpperCase()}`)
    console.log(`Tables Validated: ${report.total_tables}`)
    console.log(`Passed: ${report.passed_tables}`)
    console.log(`Failed: ${report.failed_tables}`)
    
    if (verbose) {
      console.log('\n🔍 DETAILED RESULTS')
      console.log('='.repeat(50))
      
      for (const result of report.results) {
        console.log(`\n📋 ${result.table}`)
        console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`)
        
        if (result.errors.length > 0) {
          console.log('Errors:')
          result.errors.forEach(error => console.log(`  - ${error}`))
        }
        
        if (result.warnings.length > 0) {
          console.log('Warnings:')
          result.warnings.forEach(warning => console.log(`  - ${warning}`))
        }
        
        if (result.performance_issues.length > 0) {
          console.log('Performance Issues:')
          result.performance_issues.forEach(issue => console.log(`  - ${issue}`))
        }
      }
    }

    // Performance summary
    if (report.performance_summary.missing_indexes.length > 0 || 
        report.performance_summary.slow_queries.length > 0) {
      console.log('\n⚡ PERFORMANCE SUMMARY')
      console.log('='.repeat(50))
      
      if (report.performance_summary.missing_indexes.length > 0) {
        console.log('Missing Indexes:')
        report.performance_summary.missing_indexes.forEach(index => 
          console.log(`  - ${index}`)
        )
      }
      
      if (report.performance_summary.slow_queries.length > 0) {
        console.log('Slow Queries:')
        report.performance_summary.slow_queries.forEach(query => 
          console.log(`  - ${query}`)
        )
      }
    }

    // Exit with appropriate code
    if (report.overall_status === 'failed') {
      console.log('\n❌ Database schema validation FAILED!')
      process.exit(1)
    } else if (report.overall_status === 'warnings') {
      console.log('\n⚠️ Database schema validation completed with WARNINGS')
      process.exit(0)
    } else {
      console.log('\n✅ Database schema validation PASSED!')
      process.exit(0)
    }

  } catch (error) {
    console.error('\n💥 Database validation failed with error:')
    console.error(error)
    process.exit(1)
  }
}

// Show help
function showHelp() {
  console.log(`
Database Schema Validation Tool

Usage:
  npm run validate-db [options]
  npx tsx scripts/validate-database.ts [options]

Options:
  --output=<file>    Save report to file
  --json            Output in JSON format
  --verbose         Show detailed results
  --help            Show this help message

Examples:
  npm run validate-db
  npm run validate-db --verbose
  npm run validate-db --output=validation-report.md
  npm run validate-db --json --output=validation-report.json
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