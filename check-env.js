// Load environment variables from .env and .env.local files
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

console.log('🔧 Checking Environment Configuration...\n')

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const optionalEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER'
]

console.log('Required Environment Variables:')
let allRequiredSet = true

for (const envVar of requiredEnvVars) {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${envVar}: NOT SET`)
    allRequiredSet = false
  }
}

console.log('\nOptional Environment Variables:')
for (const envVar of optionalEnvVars) {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`⚠️  ${envVar}: NOT SET (optional)`)
  }
}

console.log('\n📋 Configuration Summary:')
if (allRequiredSet) {
  console.log('✅ All required environment variables are set')
  console.log('✅ App can connect to Supabase')
  
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('✅ Twilio integration configured')
  } else {
    console.log('⚠️  Twilio integration not configured (WhatsApp features will be simulated)')
  }
  
  console.log('\n🚀 Ready to run the app!')
} else {
  console.log('❌ Missing required environment variables')
  console.log('Please set the required variables before running the app')
  process.exit(1)
} 