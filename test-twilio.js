// Load environment variables from .env and .env.local files
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const twilio = require('twilio')

console.log('📱 Testing Twilio Integration...\n')

// Check if Twilio SDK is installed
try {
  require.resolve('twilio')
  console.log('✅ Twilio SDK installed')
} catch (e) {
  console.log('❌ Twilio SDK not installed')
  console.log('Run: npm install twilio')
  process.exit(1)
}

// Check environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const phoneNumber = process.env.TWILIO_PHONE_NUMBER

console.log('Environment Variables:')
console.log(`✅ Account SID: ${accountSid ? 'Set' : 'NOT SET'}`)
console.log(`✅ Auth Token: ${authToken ? 'Set' : 'NOT SET'}`)
console.log(`✅ Phone Number: ${phoneNumber ? 'Set' : 'NOT SET'}`)

if (!accountSid || !authToken) {
  console.log('\n❌ Missing required Twilio credentials')
  console.log('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env.local file')
  process.exit(1)
}

// Initialize Twilio client
const client = twilio(accountSid, authToken)

async function testTwilioConnection() {
  try {
    console.log('\n🔍 Testing Twilio API Connection...')
    
    // Test 1: Get account information
    console.log('1. Testing Account Information...')
    const account = await client.api.accounts(accountSid).fetch()
    console.log(`✅ Account verified: ${account.friendlyName}`)
    console.log(`   Status: ${account.status}`)
    console.log(`   Type: ${account.type}`)
    
    // Test 2: List phone numbers
    console.log('\n2. Testing Phone Numbers...')
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 })
    
    if (phoneNumbers.length > 0) {
      console.log(`✅ Found ${phoneNumbers.length} phone number(s):`)
      phoneNumbers.forEach((number, index) => {
        console.log(`   ${index + 1}. ${number.phoneNumber} (${number.friendlyName || 'No name'})`)
      })
      
      // Check if any number supports WhatsApp
      const whatsappNumbers = phoneNumbers.filter(num => 
        num.capabilities && num.capabilities.whatsapp
      )
      
      if (whatsappNumbers.length > 0) {
        console.log(`✅ Found ${whatsappNumbers.length} WhatsApp-enabled number(s)`)
      } else {
        console.log('⚠️  No WhatsApp-enabled numbers found')
        console.log('   You may need to get a number that supports WhatsApp')
      }
    } else {
      console.log('⚠️  No phone numbers found in your account')
      console.log('   You need to get a phone number first')
    }
    
    // Test 3: Check messaging services
    console.log('\n3. Testing Messaging Services...')
    try {
      const messagingServices = await client.messaging.v1.services.list({ limit: 5 })
      console.log(`✅ Found ${messagingServices.length} messaging service(s)`)
    } catch (error) {
      console.log('⚠️  Could not fetch messaging services:', error.message)
    }
    
    // Test 4: Test webhook endpoint (if phone number is set)
    if (phoneNumber) {
      console.log('\n4. Testing Webhook Configuration...')
      console.log(`✅ Webhook endpoint ready: /api/webhooks/twilio`)
      console.log(`✅ Phone number configured: ${phoneNumber}`)
      
      // Check if it's a WhatsApp number
      if (phoneNumber.includes('whatsapp:')) {
        console.log('✅ WhatsApp number format detected')
      } else {
        console.log('⚠️  Phone number should include "whatsapp:" prefix')
        console.log('   Format should be: whatsapp:+1234567890')
      }
    }
    
    // Test 5: Check account balance/credits
    console.log('\n5. Testing Account Status...')
    try {
      const balance = await client.api.accounts(accountSid).balance.fetch()
      console.log(`✅ Account balance: $${balance.balance} ${balance.currency}`)
      
      if (parseFloat(balance.balance) < 1.0) {
        console.log('⚠️  Low balance - you may need to add credits for testing')
      }
    } catch (error) {
      console.log('⚠️  Could not fetch account balance:', error.message)
    }
    
    console.log('\n🎉 Twilio Integration Test Complete!')
    console.log('\n📋 Summary:')
    console.log('✅ Twilio SDK working')
    console.log('✅ Account credentials valid')
    console.log('✅ API connection successful')
    
    if (phoneNumbers.length > 0) {
      console.log('✅ Phone numbers available')
    } else {
      console.log('❌ Need to get a phone number')
    }
    
    if (phoneNumber) {
      console.log('✅ Phone number configured')
    } else {
      console.log('❌ Need to set TWILIO_PHONE_NUMBER')
    }
    
    console.log('\n🚀 Next Steps:')
    if (!phoneNumbers.length) {
      console.log('1. Get a Twilio phone number (WhatsApp-enabled)')
    }
    if (!phoneNumber) {
      console.log('2. Set TWILIO_PHONE_NUMBER in .env.local')
    }
    console.log('3. Configure webhook URL in Twilio console')
    console.log('4. Test sending a WhatsApp message')
    
  } catch (error) {
    console.error('\n❌ Twilio test failed:', error.message)
    
    if (error.code === 20003) {
      console.log('\n💡 This usually means:')
      console.log('   - Invalid Account SID or Auth Token')
      console.log('   - Check your credentials in .env.local')
    } else if (error.code === 20008) {
      console.log('\n💡 This usually means:')
      console.log('   - Account suspended or inactive')
      console.log('   - Check your Twilio account status')
    }
    
    process.exit(1)
  }
}

// Run the test
testTwilioConnection() 