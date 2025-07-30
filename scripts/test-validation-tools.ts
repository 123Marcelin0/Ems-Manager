#!/usr/bin/env tsx

/**
 * Test script for validation tools
 * 
 * This script tests the database validation and integrity checking tools
 * to ensure they work correctly before running them on production data.
 */

// Load environment variables first
import './load-env'

import { validateDatabaseSchema } from '../lib/database-validator'
import { checkDataIntegrity } from '../lib/data-integrity-checker'

async function testValidationTools() {
  console.log('🧪 Testing validation tools...\n')

  try {
    // Test schema validation
    console.log('1️⃣ Testing database schema validation...')
    const schemaReport = await validateDatabaseSchema()
    console.log(`   ✅ Schema validation completed: ${schemaReport.overall_status}`)
    console.log(`   📊 Tables checked: ${schemaReport.total_tables}`)
    console.log(`   ✅ Passed: ${schemaReport.passed_tables}`)
    console.log(`   ❌ Failed: ${schemaReport.failed_tables}`)

    // Test data integrity check
    console.log('\n2️⃣ Testing data integrity check...')
    const integrityReport = await checkDataIntegrity()
    console.log(`   ✅ Integrity check completed: ${integrityReport.overall_status}`)
    console.log(`   📊 Total issues: ${integrityReport.total_issues}`)
    console.log(`   🔴 Critical: ${integrityReport.critical_issues}`)
    console.log(`   🟡 High: ${integrityReport.high_issues}`)
    console.log(`   🟠 Medium: ${integrityReport.medium_issues}`)
    console.log(`   🟢 Low: ${integrityReport.low_issues}`)

    // Test report generation
    console.log('\n3️⃣ Testing report generation...')
    const { DatabaseSchemaValidator } = await import('../lib/database-validator')
    const { DataIntegrityChecker } = await import('../lib/data-integrity-checker')
    
    const schemaValidator = new DatabaseSchemaValidator()
    const integrityChecker = new DataIntegrityChecker()
    
    const schemaReportText = schemaValidator.generateReport(schemaReport)
    const integrityReportText = integrityChecker.generateReport(integrityReport)
    
    console.log(`   ✅ Schema report generated: ${schemaReportText.length} characters`)
    console.log(`   ✅ Integrity report generated: ${integrityReportText.length} characters`)

    console.log('\n✅ All validation tools are working correctly!')
    
    // Summary
    console.log('\n📋 SUMMARY:')
    console.log(`   Database Schema: ${schemaReport.overall_status}`)
    console.log(`   Data Integrity: ${integrityReport.overall_status}`)
    
    if (schemaReport.overall_status === 'failed' || integrityReport.overall_status === 'critical_issues') {
      console.log('\n⚠️ Issues found - run full validation for details')
      return false
    } else {
      console.log('\n🎉 Your database looks healthy!')
      return true
    }

  } catch (error) {
    console.error('\n❌ Validation tools test failed:')
    console.error(error)
    return false
  }
}

// Run the test
testValidationTools().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Test failed with error:', error)
  process.exit(1)
})