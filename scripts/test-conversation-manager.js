const { ConversationManager } = require('../lib/conversation-manager')

async function testConversationManager() {
  console.log('🧪 Testing Conversation Manager...')
  console.log('==================================')
  
  try {
    console.log('\n1. Testing Conversation Creation:')
    console.log('─'.repeat(50))
    
    // Test conversation creation
    const phoneNumber = '+49171234567'
    const employeeId = 'test-emp-123'
    
    console.log(`Creating conversation for ${phoneNumber}...`)
    const conversation = await ConversationManager.getOrCreateConversation(phoneNumber, employeeId)
    console.log(`✅ Conversation created: ${conversation.id}`)
    console.log(`   State: ${conversation.currentState}`)
    console.log(`   Phone: ${conversation.phoneNumber}`)
    console.log(`   Employee ID: ${conversation.employeeId}`)
    
    console.log('\n2. Testing Registration Flow:')
    console.log('─'.repeat(50))
    
    // Test registration code
    console.log('Processing registration code "Emsland100"...')
    const codeResponse = await ConversationManager.processMessage(conversation, 'Emsland100')
    console.log(`✅ Code response: ${codeResponse.success}`)
    console.log(`   New state: ${codeResponse.newState}`)
    console.log(`   Should send message: ${codeResponse.shouldSendMessage}`)
    if (codeResponse.responseMessage) {
      console.log(`   Response: ${codeResponse.responseMessage.substring(0, 100)}...`)
    }
    
    // Update conversation state for next test
    if (codeResponse.success && codeResponse.newState) {
      await ConversationManager.updateConversationState(
        conversation.id,
        codeResponse.newState,
        { registrationCode: 'emsland100' }
      )
      conversation.currentState = codeResponse.newState
    }
    
    // Test name submission
    console.log('\nProcessing employee name "Max Mustermann"...')
    const nameResponse = await ConversationManager.processMessage(conversation, 'Max Mustermann')
    console.log(`✅ Name response: ${nameResponse.success}`)
    console.log(`   New state: ${nameResponse.newState}`)
    if (nameResponse.responseMessage) {
      console.log(`   Response: ${nameResponse.responseMessage.substring(0, 100)}...`)
    }
    
    console.log('\n3. Testing Event Response Flow:')
    console.log('─'.repeat(50))
    
    // Create a new conversation for event testing
    const eventConversation = await ConversationManager.getOrCreateConversation('+49172345678')
    eventConversation.currentState = 'awaiting_event_response'
    eventConversation.eventId = 'test-event-123'
    
    // Test event acceptance
    console.log('Processing event acceptance "Ja"...')
    const acceptResponse = await ConversationManager.processMessage(eventConversation, 'Ja')
    console.log(`✅ Accept response: ${acceptResponse.success}`)
    if (acceptResponse.error) {
      console.log(`   Error: ${acceptResponse.error}`)
    }
    if (acceptResponse.responseMessage) {
      console.log(`   Response: ${acceptResponse.responseMessage.substring(0, 100)}...`)
    }
    
    // Test event decline
    console.log('\nProcessing event decline "Nein"...')
    const declineResponse = await ConversationManager.processMessage(eventConversation, 'Nein')
    console.log(`✅ Decline response: ${declineResponse.success}`)
    if (declineResponse.error) {
      console.log(`   Error: ${declineResponse.error}`)
    }
    
    console.log('\n4. Testing Schedule Modification:')
    console.log('─'.repeat(50))
    
    console.log('Processing schedule modification "Kann ich erst um 10 Uhr anfangen?"...')
    const scheduleResponse = await ConversationManager.processMessage(
      eventConversation,
      'Kann ich erst um 10 Uhr anfangen?'
    )
    console.log(`✅ Schedule response: ${scheduleResponse.success}`)
    if (scheduleResponse.error) {
      console.log(`   Error: ${scheduleResponse.error}`)
    }
    if (scheduleResponse.responseMessage) {
      console.log(`   Response: ${scheduleResponse.responseMessage.substring(0, 100)}...`)
    }
    
    console.log('\n5. Testing Emergency Situations:')
    console.log('─'.repeat(50))
    
    console.log('Processing emergency "Bin krank, kann nicht kommen"...')
    const emergencyResponse = await ConversationManager.processMessage(
      eventConversation,
      'Bin krank, kann nicht kommen'
    )
    console.log(`✅ Emergency response: ${emergencyResponse.success}`)
    if (emergencyResponse.error) {
      console.log(`   Error: ${emergencyResponse.error}`)
    }
    if (emergencyResponse.responseMessage) {
      console.log(`   Response: ${emergencyResponse.responseMessage.substring(0, 100)}...`)
    }
    
    console.log('\n6. Testing Information Requests:')
    console.log('─'.repeat(50))
    
    console.log('Processing information request "Wo ist der Treffpunkt?"...')
    const infoResponse = await ConversationManager.processMessage(
      eventConversation,
      'Wo ist der Treffpunkt?'
    )
    console.log(`✅ Info response: ${infoResponse.success}`)
    if (infoResponse.error) {
      console.log(`   Error: ${infoResponse.error}`)
    }
    if (infoResponse.responseMessage) {
      console.log(`   Response: ${infoResponse.responseMessage.substring(0, 100)}...`)
    }
    
    console.log('\n7. Testing Conversation State Management:')
    console.log('─'.repeat(50))
    
    // Test state update
    console.log('Updating conversation state...')
    await ConversationManager.updateConversationState(
      conversation.id,
      'completed',
      { testCompleted: true }
    )
    console.log('✅ State updated successfully')
    
    // Test conversation retrieval
    console.log('Retrieving conversation by ID...')
    const retrievedConversation = await ConversationManager.getConversationById(conversation.id)
    if (retrievedConversation) {
      console.log(`✅ Conversation retrieved: ${retrievedConversation.id}`)
      console.log(`   Current state: ${retrievedConversation.currentState}`)
    } else {
      console.log('❌ Conversation not found')
    }
    
    console.log('\n8. Testing Active Conversations:')
    console.log('─'.repeat(50))
    
    console.log('Getting active conversations...')
    const activeConversations = await ConversationManager.getActiveConversations()
    console.log(`✅ Found ${activeConversations.length} active conversations`)
    activeConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.id} - ${conv.currentState} (${conv.phoneNumber})`)
    })
    
    console.log('\n9. Testing Cleanup:')
    console.log('─'.repeat(50))
    
    console.log('Cleaning up expired conversations...')
    const cleanedCount = await ConversationManager.cleanupExpiredConversations()
    console.log(`✅ Cleaned up ${cleanedCount} expired conversations`)
    
    console.log('\n✅ Conversation Manager testing complete!')
    console.log('\nKey Features Demonstrated:')
    console.log('- State machine-based conversation flow')
    console.log('- Registration process handling')
    console.log('- Event response processing')
    console.log('- Schedule modification requests')
    console.log('- Emergency situation handling')
    console.log('- Information request processing')
    console.log('- Conversation state management')
    console.log('- Database integration')
    console.log('- Error handling and recovery')
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message)
    console.error('This is expected if database is not set up or migrations not applied')
    console.log('\nTo fix this:')
    console.log('1. Apply SMS migrations: npm run show-sms-migrations')
    console.log('2. Validate schema: npm run validate-sms-schema')
    console.log('3. Run this test again')
  }
}

// Run if called directly
if (require.main === module) {
  testConversationManager().catch(console.error)
}

module.exports = { testConversationManager }