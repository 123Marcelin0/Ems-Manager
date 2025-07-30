#!/usr/bin/env tsx

/**
 * Schema Validation Script
 * 
 * This script runs only the database schema validation to check table structures,
 * constraints, indexes, and triggers.
 * 
 * Usage:
 *   npm run validate-schema
 *   or
 *   npx tsx scripts/validate-schema.ts
 */

// Load environment variables first
import './load-env'

import { runSchemaValidation } from '../lib/database-validator'

// Run the schema validation
runSchemaValidation().catch(error => {
  console.error('Schema validation failed:', error)
  process.exit(1)
})