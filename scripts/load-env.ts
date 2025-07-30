/**
 * Environment loader for scripts
 * 
 * This script loads environment variables from .env and .env.local files
 * before running validation scripts.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables in order of precedence
// .env.local takes precedence over .env
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local') })

// Verify required environment variables are loaded
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\nPlease check your .env and .env.local files.')
  process.exit(1)
}

console.log('✅ Environment variables loaded successfully')
console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`)
console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...`)
console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30)}...`)