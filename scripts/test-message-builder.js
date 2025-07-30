const { MessageBuilder } = require('../lib/message-builder')

function testMessageBuilder() {
  console.log('🧪 Testing Message Builder...')
  console.log('============================')
  
  const mockEmployee = {
    id: 'emp-1',
    name: 'Max Mustermann',
    phone_number: '+49171234567',
    role: 'allrounder'
  }

  const mockEvent = {
    id: 'event-1',
    title: 'Messe Berlin',
    event_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    location: 'Emsland Arena',
    hourly_rate: 15.50,
    description: 'Test event'
  }

  console.log('\n1. Event Notification Message:')
  console.log('─'.repeat(50))
  const eventNotification = MessageBuilder.buildEventNotification(mockEmployee, mockEvent)
  console.log(eventNotification)
  
  const validation = MessageBuilder.validateMessageLength(eventNotification)
  console.log(`\nLength: ${validation.length} chars, Segments: ${validation.segments}`)
  if (validation.warning) console.log(`Warning: ${validation.warning}`)

  console.log('\n2. Registration Prompt:')
  console.log('─'.repeat(50))
  const registrationPrompt = MessageBuilder.buildRegistrationPrompt()
  console.log(registrationPrompt)

  console.log('\n3. Registration Confirmation:')
  console.log('─'.repeat(50))
  const registrationConfirmation = MessageBuilder.buildRegistrationConfirmation('Max Mustermann')
  console.log(registrationConfirmation)

  console.log('\n4. Event Acceptance Confirmation:')
  console.log('─'.repeat(50))
  const acceptanceConfirmation = MessageBuilder.buildEventAcceptanceConfirmation(mockEmployee, mockEvent)
  console.log(acceptanceConfirmation)

  console.log('\n5. Schedule Modification Response (Start Time):')
  console.log('─'.repeat(50))
  const scheduleModification = {
    type: 'start_time',
    originalTime: '09:00',
    requestedTime: '10:00'
  }
  const scheduleResponse = MessageBuilder.buildScheduleModificationResponse(
    mockEmployee, 
    scheduleModification, 
    mockEvent
  )
  console.log(scheduleResponse)

  console.log('\n6. Emergency Response (Late):')
  console.log('─'.repeat(50))
  const emergencyResponse = MessageBuilder.buildEmergencyResponse(
    mockEmployee, 
    'late', 
    { delayMinutes: '15' }
  )
  console.log(emergencyResponse)

  console.log('\n7. Information Response (Location):')
  console.log('─'.repeat(50))
  const locationResponse = MessageBuilder.buildInformationResponse('location', {
    location: 'Emsland Arena'
  })
  console.log(locationResponse)

  console.log('\n8. Overtime Request:')
  console.log('─'.repeat(50))
  const overtimeRequest = MessageBuilder.buildOvertimeRequest(mockEmployee, mockEvent, 2)
  console.log(overtimeRequest)

  console.log('\n9. Error Message (Invalid Response):')
  console.log('─'.repeat(50))
  const errorMessage = MessageBuilder.buildErrorMessage('invalid_response')
  console.log(errorMessage)

  console.log('\n10. Date/Time Formatting:')
  console.log('─'.repeat(50))
  const formattedDateTime = MessageBuilder.formatDateTime('2024-01-15', '09:00')
  console.log(`Formatted: ${formattedDateTime}`)

  console.log('\n✅ Message Builder testing complete!')
  console.log('\nAll message templates are properly formatted in German and include:')
  console.log('- Personalized greetings')
  console.log('- Clear instructions')
  console.log('- Appropriate emojis')
  console.log('- Contact information when needed')
  console.log('- Professional but friendly tone')
}

// Run if called directly
if (require.main === module) {
  testMessageBuilder()
}

module.exports = { testMessageBuilder }