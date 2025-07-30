#!/usr/bin/env tsx

/**
 * Data Integrity Check Script
 * 
 * This script runs only the data integrity check to validate data consistency,
 * relationships, and business rules.
 * 
 * Usage:
 *   npm run check-integrity
 *   or
 *   npx tsx scripts/check-integrity.ts
 */

// Load environment variables first
import './load-env'

import { runIntegrityCheck } from '../lib/data-integrity-checker'

// Run the integrity check
runIntegrityCheck().catch(error => {
  console.error('Integrity check failed:', error)
  process.exit(1)
})