// Import using dynamic import for TypeScript modules
let smsService;

async function loadSMSService() {
  try {
    const module = await import('../lib/sms-service.js');
    smsService = module.smsService;
  } catch (error) {
    console.error('Failed to load SMS service:', error.message);
    console.log('Make sure to build the TypeScript files first with: npm run build');
    process.exit(1);
  }
}

async function testSMSService() {
  console.log('🧪 Testing SMS Service...')
  console.log('========================')
  
  // Load the SMS service first
  await loadSMSService();
  
  // Test configuration
  console.log('\n1. Testing Configuration:')
  const status = smsService.getStatus()
  console.log('Status:', status)
  console.log('Configured:', smsService.isConfigured())
  
  // Test basic SMS sending
  console.log('\n2. Testing Basic SMS Sending:')
  try {
    const result = await smsService.sendMessage({
      to: '+49171234567',
      body: 'Test SMS from service',
      messageType: 'test'
    })
    console.log('Send result:', result)
  } catch (error) {
    console.error('Send error:', error)
  }
  
  // Test registration prompt
  console.log('\n3. Testing Registration Prompt:')
  try {
    const result = await smsService.sendRegistrationPrompt('+49171234567')
    console.log('Registration prompt result:', result)
  } catch (error) {
    console.error('Registration prompt error:', error)
  }
  
  // Test confirmation message
  console.log('\n4. Testing Confirmation Message:')
  try {
    const result = await smsService.sendConfirmationMessage(
      '+49171234567',
      'Vielen Dank für deine Registrierung! Du bist jetzt Teil unseres Teams. 🎉',
      'registration_confirmation'
    )
    console.log('Confirmation result:', result)
  } catch (error) {
    console.error('Confirmation error:', error)
  }
  
  // Test incoming message processing
  console.log('\n5. Testing Incoming Message Processing:')
  try {
    const result = await smsService.processIncomingMessage({
      from: '+49171234567',
      body: 'Ja, ich kann arbeiten',
      messageSid: 'SM123456789'
    })
    console.log('Processing result:', result)
  } catch (error) {
    console.error('Processing error:', error)
  }
  
  console.log('\n✅ SMS Service testing complete!')
}

// Run if called directly
if (require.main === module) {
  testSMSService().catch(console.error)
}

module.exports = { testSMSService }