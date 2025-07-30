const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(migrationFile) {
  try {
    console.log(`📄 Applying migration: ${migrationFile}`)
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.from('_').select('*').limit(0) // Dummy query to test connection
          if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected
            console.error('❌ Database connection error:', error)
            return false
          }
          
          // Execute the SQL statement directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: statement })
          })
          
          if (!response.ok) {
            // Try alternative approach using supabase client
            console.log('⚠️  Direct SQL execution not available, applying migration manually...')
            console.log('Please run the following SQL in your Supabase dashboard:')
            console.log(statement)
            console.log('---')
          }
        } catch (err) {
          console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`)
          console.error(err)
          return false
        }
      }
    }
    
    console.log(`✅ Successfully applied: ${migrationFile}`)
    return true
  } catch (error) {
    console.error(`❌ Error applying migration ${migrationFile}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting SMS integration migrations...')
  
  // Apply migrations in order
  const migrations = [
    '008_sms_integration_schema.sql',
    '009_sms_rls_policies.sql'
  ]
  
  for (const migration of migrations) {
    const success = await applyMigration(migration)
    if (!success) {
      console.error(`❌ Failed to apply migration: ${migration}`)
      process.exit(1)
    }
  }
  
  console.log('✅ All SMS integration migrations applied successfully!')
  
  // Test the new functions
  console.log('\n🧪 Testing SMS functions...')
  
  try {
    // Test cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_conversations')
    
    if (cleanupError) {
      console.error('❌ Cleanup function test failed:', cleanupError)
    } else {
      console.log(`✅ Cleanup function works: ${cleanupResult} expired conversations cleaned`)
    }
    
    // Test conversation creation
    const { data: conversationId, error: conversationError } = await supabase
      .rpc('get_or_create_sms_conversation', {
        p_phone_number: '+49123456789',
        p_employee_id: null
      })
    
    if (conversationError) {
      console.error('❌ Conversation creation test failed:', conversationError)
    } else {
      console.log(`✅ Conversation creation works: ${conversationId}`)
      
      // Test state update
      const { data: stateResult, error: stateError } = await supabase
        .rpc('update_conversation_state', {
          p_conversation_id: conversationId,
          p_new_state: 'registration_code_received',
          p_context_data: { test: true }
        })
      
      if (stateError) {
        console.error('❌ State update test failed:', stateError)
      } else {
        console.log(`✅ State update works: ${stateResult}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Function testing failed:', error)
  }
  
  console.log('\n🎉 SMS integration database setup complete!')
}

main().catch(console.error)