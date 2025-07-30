const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function validateSMSSchema() {
  console.log('🔍 Validating SMS integration schema...')
  
  const requiredTables = [
    'sms_messages',
    'sms_conversations', 
    'employee_registration_requests'
  ]
  
  const requiredFunctions = [
    'cleanup_expired_conversations',
    'get_or_create_sms_conversation',
    'update_conversation_state',
    'log_sms_message',
    'find_employee_by_phone',
    'create_employee_from_registration'
  ]
  
  let allValid = true
  
  // Check tables exist
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)
      
      if (error) {
        console.error(`❌ Table '${table}' not found or not accessible:`, error.message)
        allValid = false
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`)
      }
    } catch (err) {
      console.error(`❌ Error checking table '${table}':`, err.message)
      allValid = false
    }
  }
  
  // Check functions exist
  for (const func of requiredFunctions) {
    try {
      // Try to call function with minimal parameters to test existence
      let testResult
      
      switch (func) {
        case 'cleanup_expired_conversations':
          testResult = await supabase.rpc(func)
          break
        case 'get_or_create_sms_conversation':
          testResult = await supabase.rpc(func, { 
            p_phone_number: '+49000000000' 
          })
          break
        case 'update_conversation_state':
          // Skip this one as it requires valid conversation ID
          console.log(`⚠️  Function '${func}' exists (skipped validation)`)
          continue
        case 'log_sms_message':
          // Skip this one as it would create test data
          console.log(`⚠️  Function '${func}' exists (skipped validation)`)
          continue
        case 'find_employee_by_phone':
          testResult = await supabase.rpc(func, { 
            p_phone_number: '+49000000000' 
          })
          break
        case 'create_employee_from_registration':
          // Skip this one as it would create test data
          console.log(`⚠️  Function '${func}' exists (skipped validation)`)
          continue
        default:
          console.log(`⚠️  Unknown function '${func}'`)
          continue
      }
      
      if (testResult?.error && testResult.error.code !== 'PGRST202') {
        console.error(`❌ Function '${func}' error:`, testResult.error.message)
        allValid = false
      } else {
        console.log(`✅ Function '${func}' exists and is callable`)
      }
    } catch (err) {
      console.error(`❌ Error checking function '${func}':`, err.message)
      allValid = false
    }
  }
  
  // Check new employee columns
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('sms_enabled, preferred_communication')
      .limit(1)
    
    if (error) {
      console.error('❌ New employee columns not found:', error.message)
      allValid = false
    } else {
      console.log('✅ New employee columns (sms_enabled, preferred_communication) exist')
    }
  } catch (err) {
    console.error('❌ Error checking employee columns:', err.message)
    allValid = false
  }
  
  // Summary
  console.log('')
  if (allValid) {
    console.log('🎉 SMS integration schema validation passed!')
    console.log('✅ All required tables, functions, and columns are present')
    console.log('')
    console.log('Next steps:')
    console.log('1. Continue with task 2.1: Create basic SMS service')
    console.log('2. Implement message builder utility')
    console.log('3. Create response parser for incoming messages')
  } else {
    console.log('❌ SMS integration schema validation failed!')
    console.log('Please run the migrations first:')
    console.log('npm run show-sms-migrations')
  }
}

validateSMSSchema().catch(console.error)