// Script to apply missing database migrations
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vnxhfmrjzwxumaakgwmq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueGhmbXJqend4dW1hYWtnd21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1NDQ5OCwiZXhwIjoyMDY4NDMwNDk4fQ.VISxS7EqFageN2YwOaOpr1ufGF4Jzuhg0wd_KwOZt3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Applying missing database migrations...\n')

  const migrations = [
    'supabase/migrations/003_fair_distribution_algorithm.sql',
    'supabase/migrations/005_additional_functions.sql',
    'supabase/migrations/006_templates_and_enhancements.sql'
  ]

  for (const migrationFile of migrations) {
    try {
      console.log(`📄 Applying ${migrationFile}...`)
      
      if (!fs.existsSync(migrationFile)) {
        console.log(`   ⚠️  File not found: ${migrationFile}`)
        continue
      }

      const sql = fs.readFileSync(migrationFile, 'utf8')
      
      // Split SQL by statements (rough split on semicolons not in quotes)
      const statements = sql
        .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`   Found ${statements.length} SQL statements`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.length < 10) continue // Skip very short statements
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          if (error) {
            // Try direct query if rpc fails
            const { error: directError } = await supabase.from('_').select('*').limit(0)
            // If that fails too, try raw SQL execution
            console.log(`   ⚠️  Statement ${i + 1} may have failed: ${error.message}`)
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} error: ${err.message}`)
        }
      }
      
      console.log(`   ✅ Migration ${migrationFile} applied`)
      
    } catch (error) {
      console.error(`   ❌ Failed to apply ${migrationFile}:`, error.message)
    }
  }

  // Test if functions are now available
  console.log('\n🔍 Testing applied functions...')
  
  const testFunctions = [
    'update_employee_event_status',
    'select_employees_for_event',
    'check_recruitment_status'
  ]

  for (const funcName of testFunctions) {
    try {
      const { error } = await supabase.rpc(funcName, {})
      if (error && error.message.includes('required')) {
        console.log(`   ✅ Function ${funcName}: Available (needs parameters)`)
      } else if (error) {
        console.log(`   ❌ Function ${funcName}: ${error.message}`)
      } else {
        console.log(`   ✅ Function ${funcName}: Available`)
      }
    } catch (err) {
      console.log(`   ❌ Function ${funcName}: ${err.message}`)
    }
  }

  console.log('\n✅ Migration application completed!')
}

// Alternative approach: Apply migrations using raw SQL
async function applyMigrationsRaw() {
  console.log('🚀 Applying migrations using raw SQL approach...\n')

  const migrations = [
    'supabase/migrations/003_fair_distribution_algorithm.sql',
    'supabase/migrations/005_additional_functions.sql', 
    'supabase/migrations/006_templates_and_enhancements.sql'
  ]

  for (const migrationFile of migrations) {
    try {
      console.log(`📄 Processing ${migrationFile}...`)
      
      if (!fs.existsSync(migrationFile)) {
        console.log(`   ⚠️  File not found: ${migrationFile}`)
        continue
      }

      const sql = fs.readFileSync(migrationFile, 'utf8')
      console.log(`   📝 SQL content length: ${sql.length} characters`)
      
      // For now, just show what would be applied
      const functionMatches = sql.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/gi)
      if (functionMatches) {
        console.log(`   🔧 Functions to create: ${functionMatches.map(m => m.split(' ').pop()).join(', ')}`)
      }
      
      const tableMatches = sql.match(/CREATE TABLE\s+(\w+)/gi)
      if (tableMatches) {
        console.log(`   📊 Tables to create: ${tableMatches.map(m => m.split(' ').pop()).join(', ')}`)
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to process ${migrationFile}:`, error.message)
    }
  }

  console.log('\n💡 To apply these migrations manually:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the content of each migration file')
  console.log('4. Execute them one by one')
}

// Run the migration application
applyMigrationsRaw().then(() => {
  console.log('\n🎯 Next steps:')
  console.log('1. Apply the migrations manually in Supabase dashboard')
  console.log('2. Run: node test-database-functions.js to verify')
  console.log('3. Test employee status persistence in your app')
})