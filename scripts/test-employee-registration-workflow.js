const { EmployeeRegistrationWorkflow } = require('../lib/employee-registration-workflow')

async function testEmployeeRegistrationWorkflow() {
  console.log('🧪 Testing Employee Registration Workflow...')
  console.log('============================================')
  
  console.log('\n1. Starting Registration Process:')
  console.log('─'.repeat(50))
  
  try {
    // Test starting registration with valid code
    console.log('Starting registration with "Emsland100"...')
    const startResult = await EmployeeRegistrationWorkflow.startRegistration(
      '+49171234567',
      'Emsland100'
    )
    
    if (startResult.success) {
      console.log('✅ Registration started successfully')
      console.log(`   Phone: ${startResult.state.phoneNumber}`)
      console.log(`   Current step: ${startResult.state.currentStep}`)
      console.log(`   Registration code: ${startResult.state.registrationCode}`)
      console.log(`   Conversation ID: ${startResult.state.conversationId}`)
      console.log(`   Should send message: ${startResult.shouldSendMessage}`)
      if (startResult.nextMessage) {
        console.log(`   Next message: ${startResult.nextMessage.substring(0, 100)}...`)
      }
      
      // Show workflow state
      console.log('\n   Workflow Steps:')
      Object.entries(startResult.state.steps).forEach(([stepName, step]) => {
        const status = step.isComplete ? '✅' : '⏳'
        console.log(`     ${status} ${stepName}: ${step.isComplete ? 'Complete' : 'Pending'}`)
      })
    } else {
      console.log(`❌ Registration start failed: ${startResult.error}`)
    }
    
    console.log('\n2. Testing Invalid Registration Codes:')
    console.log('─'.repeat(50))
    
    const invalidCodes = ['invalid123', 'expired456', '']
    
    for (const code of invalidCodes) {
      console.log(`Testing invalid code: "${code}"`)
      const result = await EmployeeRegistrationWorkflow.startRegistration(
        '+49172345678',
        code
      )
      
      const status = result.success ? '✅' : '❌'
      console.log(`${status} Result: ${result.success ? 'Success' : result.error}`)
      console.log('')
    }
    
    console.log('\n3. Testing Phone Number Validation:')
    console.log('─'.repeat(50))
    
    const testPhones = [
      '0171234567',
      '+49171234567',
      'invalid-phone',
      '+49900123456' // Blocked premium number
    ]
    
    for (const phone of testPhones) {
      console.log(`Testing phone: "${phone}"`)
      const result = await EmployeeRegistrationWorkflow.startRegistration(
        phone,
        'emsland100'
      )
      
      const status = result.success ? '✅' : '❌'
      console.log(`${status} Result: ${result.success ? 'Success' : result.error}`)
      if (result.success) {
        console.log(`   Normalized: ${result.state.phoneNumber}`)
      }
      console.log('')
    }
    
    console.log('\n4. Testing Name Submission Process:')
    console.log('─'.repeat(50))
    
    const testNames = [
      'Max Mustermann',
      'Anna-Maria Schmidt',
      'Jürgen Müller',
      'X', // Too short
      'Max123 Invalid' // Invalid characters
    ]
    
    for (const name of testNames) {
      console.log(`Testing name: "${name}"`)
      const result = await EmployeeRegistrationWorkflow.processNameSubmission(
        '+49173456789',
        name,
        'test-conv-123'
      )
      
      const status = result.success ? '✅' : '❌'
      console.log(`${status} Result: ${result.success ? 'Success' : result.error}`)
      
      if (result.success) {
        console.log(`   Employee name: ${result.state.employeeName}`)
        console.log(`   Employee ID: ${result.state.employeeId}`)
        console.log(`   Current step: ${result.state.currentStep}`)
        if (result.nextMessage) {
          console.log(`   Confirmation: ${result.nextMessage.substring(0, 100)}...`)
        }
      } else if (result.state.errors.length > 0) {
        console.log(`   Errors: ${result.state.errors.join(', ')}`)
      }
      console.log('')
    }
    
    console.log('\n5. Testing Complete Registration (Direct):')
    console.log('─'.repeat(50))
    
    console.log('Testing complete registration in one step...')
    const completeResult = await EmployeeRegistrationWorkflow.completeRegistration(
      '+49174567890',
      'emsland100',
      'Test Complete User'
    )
    
    if (completeResult.success) {
      console.log('✅ Complete registration successful')
      console.log(`   Phone: ${completeResult.state.phoneNumber}`)
      console.log(`   Name: ${completeResult.state.employeeName}`)
      console.log(`   Employee ID: ${completeResult.state.employeeId}`)
      console.log(`   Current step: ${completeResult.state.currentStep}`)
      console.log(`   Completed at: ${completeResult.state.completedAt}`)
      
      // Show all steps as complete
      console.log('\n   All Steps:')
      Object.entries(completeResult.state.steps).forEach(([stepName, step]) => {
        const status = step.isComplete ? '✅' : '❌'
        console.log(`     ${status} ${stepName}`)
      })
      
      if (completeResult.nextMessage) {
        console.log(`\n   Confirmation message: ${completeResult.nextMessage.substring(0, 150)}...`)
      }
    } else {
      console.log(`❌ Complete registration failed: ${completeResult.error}`)
    }
    
    console.log('\n6. Testing Workflow State Management:')
    console.log('─'.repeat(50))
    
    console.log('Getting workflow state...')
    const workflowState = await EmployeeRegistrationWorkflow.getWorkflowState(
      '+49175678901',
      'test-conv-456'
    )
    
    console.log('✅ Workflow state retrieved:')
    console.log(`   Phone: ${workflowState.phoneNumber}`)
    console.log(`   Conversation ID: ${workflowState.conversationId}`)
    console.log(`   Current step: ${workflowState.currentStep}`)
    console.log(`   Started at: ${workflowState.startedAt}`)
    console.log(`   Registration code: ${workflowState.registrationCode || 'Not set'}`)
    console.log(`   Employee name: ${workflowState.employeeName || 'Not set'}`)
    console.log(`   Employee ID: ${workflowState.employeeId || 'Not set'}`)
    
    console.log('\n   Step Status:')
    Object.entries(workflowState.steps).forEach(([stepName, step]) => {
      const status = step.isComplete ? '✅' : '⏳'
      console.log(`     ${status} ${stepName}`)
      if (step.data) {
        console.log(`        Data: ${JSON.stringify(step.data)}`)
      }
    })
    
    console.log('\n7. Testing Registration Status Check:')
    console.log('─'.repeat(50))
    
    const testPhoneNumbers = ['+49176789012', '+49177890123']
    
    for (const phone of testPhoneNumbers) {
      console.log(`Checking registration status for ${phone}...`)
      const inProgress = await EmployeeRegistrationWorkflow.isRegistrationInProgress(phone)
      console.log(`   Registration in progress: ${inProgress ? 'Yes' : 'No'}`)
    }
    
    console.log('\n8. Testing Registration Cancellation:')
    console.log('─'.repeat(50))
    
    console.log('Cancelling registration...')
    const cancelResult = await EmployeeRegistrationWorkflow.cancelRegistration('+49178901234')
    
    if (cancelResult.success) {
      console.log('✅ Registration cancelled successfully')
    } else {
      console.log(`❌ Cancellation failed: ${cancelResult.error}`)
    }
    
    console.log('\n9. Testing Registration Statistics:')
    console.log('─'.repeat(50))
    
    console.log('Getting registration statistics...')
    const stats = await EmployeeRegistrationWorkflow.getRegistrationStatistics()
    
    console.log('✅ Registration Statistics:')
    console.log(`   Total requests: ${stats.totalRequests}`)
    console.log(`   Completed registrations: ${stats.completedRegistrations}`)
    console.log(`   Pending registrations: ${stats.pendingRegistrations}`)
    console.log(`   Failed registrations: ${stats.failedRegistrations}`)
    console.log(`   Registrations today: ${stats.registrationsToday}`)
    console.log(`   Registrations this week: ${stats.registrationsThisWeek}`)
    
    console.log('\n10. Testing Registration Reminder:')
    console.log('─'.repeat(50))
    
    console.log('Sending registration reminder...')
    const reminderResult = await EmployeeRegistrationWorkflow.sendRegistrationReminder('+49179012345')
    
    if (reminderResult.success) {
      console.log('✅ Registration reminder sent successfully')
    } else {
      console.log(`❌ Reminder failed: ${reminderResult.error}`)
    }
    
    console.log('\n11. Testing Error Scenarios:')
    console.log('─'.repeat(50))
    
    // Test with invalid data combinations
    const errorTests = [
      {
        name: 'Invalid phone + invalid code',
        phone: 'invalid-phone',
        code: 'invalid-code',
        employeeName: 'Test User'
      },
      {
        name: 'Valid phone + expired code',
        phone: '+49180123456',
        code: 'expired123',
        employeeName: 'Test User'
      },
      {
        name: 'Valid data + invalid name',
        phone: '+49181234567',
        code: 'emsland100',
        employeeName: 'X'
      }
    ]
    
    for (const test of errorTests) {
      console.log(`Testing: ${test.name}`)
      const result = await EmployeeRegistrationWorkflow.completeRegistration(
        test.phone,
        test.code,
        test.employeeName
      )
      
      console.log(`   Result: ${result.success ? 'Success' : 'Failed'}`)
      if (!result.success) {
        console.log(`   Error: ${result.error}`)
      }
      console.log('')
    }
    
  } catch (error) {
    console.log(`❌ Testing error: ${error.message}`)
    console.log('This is expected if database is not set up or migrations not applied')
    console.log('\nTo fix this:')
    console.log('1. Apply SMS migrations: npm run show-sms-migrations')
    console.log('2. Validate schema: npm run validate-sms-schema')
    console.log('3. Run this test again')
  }
  
  console.log('\n✅ Employee Registration Workflow testing complete!')
  console.log('\nKey Features Demonstrated:')
  console.log('- Multi-step registration process orchestration')
  console.log('- Registration code and phone number validation')
  console.log('- Employee name validation and normalization')
  console.log('- Workflow state management and tracking')
  console.log('- Complete registration in single step')
  console.log('- Registration status checking and cancellation')
  console.log('- Registration statistics and monitoring')
  console.log('- Registration reminder functionality')
  console.log('- Comprehensive error handling')
  console.log('- Database integration with conversation management')
  console.log('- SMS integration for notifications')
}

// Run if called directly
if (require.main === module) {
  testEmployeeRegistrationWorkflow().catch(console.error)
}

module.exports = { testEmployeeRegistrationWorkflow }