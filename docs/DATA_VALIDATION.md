# Data Persistence Validation Tools

This document describes the comprehensive data validation tools created to ensure your Employee Management System has perfect data persistence and reliability.

## Overview

The validation system consists of two main components:

1. **Database Schema Validator** - Validates table structures, constraints, indexes, and triggers
2. **Data Integrity Checker** - Validates data consistency, relationships, and business rules

## Quick Start

### Test the Tools
```bash
# Test that validation tools are working
npx tsx scripts/test-validation-tools.ts
```

### Run Complete Validation
```bash
# Run both schema validation and integrity check
npm run validate-data

# Run with verbose output and auto-repair
npm run validate-data -- --verbose --auto-repair

# Save reports to custom directory
npm run validate-data -- --output-dir=./my-reports
```

### Run Individual Validations
```bash
# Only database schema validation
npm run validate-schema

# Only data integrity check
npm run check-integrity

# Only database schema with custom output
npm run validate-db -- --output=schema-report.md --verbose
```

## Database Schema Validation

### What It Checks

- **Table Structure**: Validates all tables exist with correct columns and data types
- **Constraints**: Verifies primary keys, foreign keys, unique constraints, and check constraints
- **Indexes**: Ensures all required indexes exist for optimal performance
- **Triggers**: Validates that all expected triggers are present and functioning
- **Performance**: Identifies missing indexes and potential performance issues

### Expected Schema

The validator checks against the expected schema for these tables:
- `employees` - Employee profiles and work history
- `events` - Event definitions and lifecycle
- `work_areas` - Work area configurations per event
- `employee_event_status` - Employee availability per event
- `work_assignments` - Employee assignments to work areas
- `time_records` - Work session tracking and payments
- `whatsapp_messages` - Message history and delivery tracking
- `audit_logs` - System activity audit trail

### Sample Output

```
# Database Schema Validation Report

**Overall Status:** PASSED
**Tables Validated:** 8
**Passed:** 8
**Failed:** 0

## Table Validation Results

### employees
**Status:** ✅ PASSED

### events
**Status:** ✅ PASSED

**Performance Issues:**
- Missing index 'idx_events_date' in table 'events'
```

## Data Integrity Validation

### What It Checks

- **Referential Integrity**: Finds orphaned records and broken relationships
- **JSONB Structure**: Validates work_areas.role_requirements format
- **Enum Consistency**: Ensures all enum values are valid
- **Business Rules**: Validates domain-specific constraints
- **Cross-Table Consistency**: Checks data consistency across related tables

### Issue Types and Severity

- **Critical**: Data corruption that could cause system failures
- **High**: Referential integrity violations and orphaned records
- **Medium**: Business rule violations and inconsistent calculations
- **Low**: Format issues and minor inconsistencies

### Auto-Repair Capabilities

Some issues can be automatically repaired:
- ✅ Time record calculation errors
- ✅ Orphaned audit log entries (with caution)
- ❌ Referential integrity violations (manual review required)
- ❌ Enum violations (manual correction required)

### Sample Output

```
# Data Integrity Report

**Overall Status:** ISSUES_FOUND
**Total Issues:** 3
**Critical Issues:** 0
**High Priority Issues:** 1
**Medium Priority Issues:** 2

## HIGH Priority Issues

### employee_event_status - orphaned_record
**Description:** Found 5 orphaned records in employee_event_status.event_id referencing events.id
**Suggested Fix:** Delete orphaned records or restore missing parent records in events
**Auto-fixable:** Yes
```

## Command Line Options

### validate-data-persistence.ts

```bash
Options:
  --output-dir=<dir>     Save reports to directory (default: ./validation-reports)
  --verbose              Show detailed results
  --skip-schema          Skip database schema validation
  --skip-integrity       Skip data integrity check
  --auto-repair          Attempt automatic repair of fixable issues
  --help                 Show help message
```

### validate-database.ts

```bash
Options:
  --output=<file>        Save report to file
  --json                Output in JSON format
  --verbose             Show detailed results
  --help                Show help message
```

## Integration with CI/CD

### Pre-deployment Validation

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Validate Database
  run: |
    npm run validate-data
    if [ $? -ne 0 ]; then
      echo "Database validation failed - deployment aborted"
      exit 1
    fi
```

### Scheduled Health Checks

Run periodic validation:

```bash
# Add to crontab for daily checks
0 2 * * * cd /path/to/app && npm run validate-data --auto-repair
```

## Troubleshooting

### Common Issues

1. **Missing Database Functions**
   ```bash
   # Apply the schema validation functions migration
   supabase db push
   ```

2. **Permission Errors**
   ```bash
   # Ensure your Supabase service role key is set
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Connection Timeouts**
   ```bash
   # Check your database connection
   npm run test:connection
   ```

### Environment Setup

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Extending the Validation

### Adding New Table Validation

1. Add table schema to `EXPECTED_SCHEMAS` in `lib/database-validator.ts`
2. Add integrity checks to `DataIntegrityChecker` methods
3. Update expected triggers in `getExpectedTriggers()`

### Adding Custom Business Rules

Add to `checkBusinessRules()` in `lib/data-integrity-checker.ts`:

```typescript
// Check custom business rule
const { data: violations } = await this.client
  .from('your_table')
  .select('*')
  .filter('your_condition')

if (violations && violations.length > 0) {
  issues.push({
    type: 'constraint_violation',
    severity: 'medium',
    table: 'your_table',
    description: 'Your custom rule violation',
    suggested_fix: 'How to fix it',
    auto_fixable: false
  })
}
```

## Best Practices

1. **Run Before Deployments**: Always validate before deploying changes
2. **Monitor Regularly**: Set up automated daily/weekly checks
3. **Review Reports**: Don't ignore warnings - they often indicate future problems
4. **Backup Before Repairs**: Always backup before running auto-repair
5. **Test Validation Tools**: Run test script after making changes

## Support

If you encounter issues with the validation tools:

1. Run the test script: `npx tsx scripts/test-validation-tools.ts`
2. Check the generated reports in `./validation-reports/`
3. Review the database migration: `supabase/migrations/005_schema_validation_functions.sql`
4. Verify environment variables are set correctly

The validation tools are designed to be comprehensive and safe - they will never modify your data without explicit permission (--auto-repair flag) and will always create detailed reports of what they find.