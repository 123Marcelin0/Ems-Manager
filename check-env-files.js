const fs = require('fs')
const path = require('path')

console.log('🔍 Checking Environment Files...\n')

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local')
const envPath = path.join(process.cwd(), '.env')

console.log('Environment Files:')

if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local exists')
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8')
  const lines = envLocalContent.split('\n').filter(line => line.trim())
  console.log(`   Contains ${lines.length} environment variables`)
  
  // Show which variables are set (without values)
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key] = line.split('=')
      console.log(`   - ${key}`)
    }
  })
} else {
  console.log('❌ .env.local does not exist')
}

if (fs.existsSync(envPath)) {
  console.log('✅ .env exists')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim())
  console.log(`   Contains ${lines.length} environment variables`)
  
  // Show which variables are set (without values)
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key] = line.split('=')
      console.log(`   - ${key}`)
    }
  })
} else {
  console.log('❌ .env does not exist')
}

console.log('\n📋 Required Variables:')
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

// Load environment variables
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set (${value.substring(0, 20)}...)`)
  } else {
    console.log(`❌ ${varName}: Not set`)
  }
})

console.log('\n💡 If variables are not being loaded:')
console.log('1. Make sure .env.local or .env file exists in the project root')
console.log('2. Check that the variable names are exactly correct')
console.log('3. Ensure there are no spaces around the = sign')
console.log('4. Try restarting your terminal/command prompt') 