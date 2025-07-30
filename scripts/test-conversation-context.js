const { ConversationContextHandler } = require('../lib/conversation-context')

function testConversationContext() {
  console.log('🧪 Testing Conversation Context Handler...')
  console.log('==========================================')
  
  console.log('\n1. Creating and Updating Context:')
  console.log('─'.repeat(50))
  
  // Create initial context
  let context = ConversationContextHandler.createContext({
    eventId: 'event-123',
    employeeName: 'Max Mustermann'
  })
  
  console.log('✅ Initial context created:')
  console.log(`   Event ID: ${context.eventId}`)
  console.log(`   Employee: ${context.employeeName}`)
  console.log(`   Message count: ${context.messageCount}`)
  console.log(`   Started: ${context.conversationStarted}`)
  
  // Update context
  context = ConversationContextHandler.updateContext(context, {
    registrationCode: 'emsland100',
    registrationStep: 'completed'
  })
  
  console.log('\n✅ Context updated:')
  console.log(`   Registration code: ${context.registrationCode}`)
  console.log(`   Registration step: ${context.registrationStep}`)
  console.log(`   Message count: ${context.messageCount}`) // Should be incremented
  
  console.log('\n2. Event Context Management:')
  console.log('─'.repeat(50))
  
  // Set event context
  context = ConversationContextHandler.setEventContext(
    context,
    'event-456',
    {
      title: 'Messe Berlin',
      date: '2024-01-15',
      location: 'Emsland Arena'
    }
  )
  
  console.log('✅ Event context set:')
  console.log(`   Event ID: ${context.eventId}`)
  console.log(`   Title: ${context.eventTitle}`)
  console.log(`   Date: ${context.eventDate}`)
  console.log(`   Location: ${context.eventLocation}`)
  console.log(`   Has event context: ${ConversationContextHandler.hasEventContext(context)}`)
  
  console.log('\n3. Information Request Management:')
  console.log('─'.repeat(50))
  
  // Add information requests
  context = ConversationContextHandler.addInformationRequest(
    context,
    'location',
    'Wo ist der Treffpunkt?'
  )
  
  context = ConversationContextHandler.addInformationRequest(
    context,
    'equipment',
    'Was muss ich mitbringen?'
  )
  
  console.log('✅ Information requests added:')
  console.log(`   Total requests: ${context.informationRequests?.length}`)
  console.log(`   Last request type: ${context.lastInfoRequest}`)
  
  context.informationRequests?.forEach((req, index) => {
    console.log(`   ${index + 1}. ${req.type}: "${req.question}" (answered: ${req.answered})`)
  })
  
  // Mark one as answered
  context = ConversationContextHandler.markInformationRequestAnswered(context, 'location')
  
  console.log('\n✅ Location request marked as answered:')
  console.log(`   Information provided: ${context.informationProvided}`)
  context.informationRequests?.forEach((req, index) => {
    console.log(`   ${index + 1}. ${req.type}: answered = ${req.answered}`)
  })
  
  console.log('\n4. Schedule Modification Context:')
  console.log('─'.repeat(50))
  
  // Set schedule modification
  context = ConversationContextHandler.setScheduleModification(context, {
    type: 'start_time',
    originalTime: '09:00',
    requestedTime: '10:00',
    reason: 'Traffic delay expected'
  })
  
  console.log('✅ Schedule modification set:')
  console.log(`   Type: ${context.scheduleModification?.type}`)
  console.log(`   Original time: ${context.scheduleModification?.originalTime}`)
  console.log(`   Requested time: ${context.scheduleModification?.requestedTime}`)
  console.log(`   Reason: ${context.scheduleModification?.reason}`)
  console.log(`   Processed: ${context.scheduleModification?.processed}`)
  console.log(`   Has schedule modification: ${ConversationContextHandler.hasScheduleModificationContext(context)}`)
  
  console.log('\n5. Emergency Context:')
  console.log('─'.repeat(50))
  
  // Set emergency context
  context = ConversationContextHandler.setEmergencyContext(
    context,
    'late',
    {
      delayMinutes: '20',
      reason: 'Traffic jam on A1',
      severity: 'low',
      requiresFollowup: false
    }
  )
  
  console.log('✅ Emergency context set:')
  console.log(`   Type: ${context.emergencyType}`)
  console.log(`   Delay: ${context.emergencyDetails?.delayMinutes} minutes`)
  console.log(`   Reason: ${context.emergencyDetails?.reason}`)
  console.log(`   Severity: ${context.emergencyDetails?.severity}`)
  console.log(`   Handled: ${context.emergencyHandled}`)
  console.log(`   Has emergency context: ${ConversationContextHandler.hasEmergencyContext(context)}`)
  
  console.log('\n6. Overtime Context:')
  console.log('─'.repeat(50))
  
  // Set overtime context
  context = ConversationContextHandler.setOvertimeContext(context, 2, 15.50)
  
  console.log('✅ Overtime context set:')
  console.log(`   Additional hours: ${context.overtimeRequest?.additionalHours}`)
  console.log(`   Hourly rate: €${context.overtimeRequest?.hourlyRate}`)
  console.log(`   Request sent: ${context.overtimeRequest?.requestSent}`)
  console.log(`   Processed: ${context.overtimeRequest?.processed}`)
  console.log(`   Has overtime context: ${ConversationContextHandler.hasOvertimeContext(context)}`)
  
  console.log('\n7. Contact Updates:')
  console.log('─'.repeat(50))
  
  // Add contact update
  context = ConversationContextHandler.addContactUpdate(
    context,
    'phone_number',
    '+49171234567',
    '+49172345678'
  )
  
  console.log('✅ Contact update added:')
  console.log(`   Total updates: ${context.contactUpdates?.length}`)
  context.contactUpdates?.forEach((update, index) => {
    console.log(`   ${index + 1}. ${update.type}: ${update.oldValue} → ${update.newValue}`)
    console.log(`      Processed: ${update.processed}, Time: ${update.timestamp}`)
  })
  
  console.log('\n8. Error and Retry Tracking:')
  console.log('─'.repeat(50))
  
  // Increment counters
  context = ConversationContextHandler.incrementErrorCount(context)
  context = ConversationContextHandler.incrementErrorCount(context)
  context = ConversationContextHandler.incrementRetryCount(context)
  
  console.log('✅ Counters updated:')
  console.log(`   Message count: ${context.messageCount}`)
  console.log(`   Error count: ${context.errorCount}`)
  console.log(`   Retry count: ${context.retryCount}`)
  
  console.log('\n9. Temporary Data Management:')
  console.log('─'.repeat(50))
  
  // Set temporary data
  context = ConversationContextHandler.setTempData(context, 'processingStep', 'validation')
  context = ConversationContextHandler.setTempData(context, 'tempValue', 42)
  
  console.log('✅ Temporary data set:')
  console.log(`   Processing step: ${ConversationContextHandler.getTempData(context, 'processingStep')}`)
  console.log(`   Temp value: ${ConversationContextHandler.getTempData(context, 'tempValue')}`)
  console.log(`   Missing value: ${ConversationContextHandler.getTempData(context, 'missing', 'default')}`)
  
  // Clear temporary data
  context = ConversationContextHandler.clearTempData(context)
  console.log(`   After clearing: ${JSON.stringify(context.tempData)}`)
  
  console.log('\n10. Context Validation:')
  console.log('─'.repeat(50))
  
  // Validate current context
  const validation = ConversationContextHandler.validateContext(context)
  
  console.log('✅ Context validation:')
  console.log(`   Is valid: ${validation.isValid}`)
  console.log(`   Errors: ${validation.errors.length}`)
  console.log(`   Warnings: ${validation.warnings.length}`)
  
  if (validation.errors.length > 0) {
    console.log('   Errors:')
    validation.errors.forEach(error => console.log(`     - ${error}`))
  }
  
  if (validation.warnings.length > 0) {
    console.log('   Warnings:')
    validation.warnings.forEach(warning => console.log(`     - ${warning}`))
  }
  
  console.log('\n11. Context Summary:')
  console.log('─'.repeat(50))
  
  const summary = ConversationContextHandler.getContextSummary(context)
  console.log(`✅ Context summary: ${summary}`)
  
  console.log('\n12. Context Export/Import:')
  console.log('─'.repeat(50))
  
  // Export context
  const exported = ConversationContextHandler.exportContext(context)
  console.log('✅ Context exported (first 200 chars):')
  console.log(`   ${exported.substring(0, 200)}...`)
  
  // Import context
  const imported = ConversationContextHandler.importContext(exported)
  console.log('✅ Context imported:')
  console.log(`   Event ID: ${imported.eventId}`)
  console.log(`   Employee: ${imported.employeeName}`)
  console.log(`   Message count: ${imported.messageCount}`)
  
  console.log('\n13. Context Merging:')
  console.log('─'.repeat(50))
  
  const baseContext = ConversationContextHandler.createContext({
    eventId: 'base-event',
    messageCount: 5
  })
  
  const newContext = {
    employeeName: 'Anna Schmidt',
    messageCount: 8,
    eventResponse: 'accept'
  }
  
  const merged = ConversationContextHandler.mergeContexts(baseContext, newContext)
  
  console.log('✅ Contexts merged:')
  console.log(`   Event ID: ${merged.eventId}`)
  console.log(`   Employee: ${merged.employeeName}`)
  console.log(`   Message count: ${merged.messageCount}`)
  console.log(`   Event response: ${merged.eventResponse}`)
  
  console.log('\n14. Context Reset:')
  console.log('─'.repeat(50))
  
  // Reset with metadata preserved
  const resetWithMetadata = ConversationContextHandler.resetContext(true)
  console.log('✅ Reset with metadata preserved:')
  console.log(`   Has conversation started: ${!!resetWithMetadata.conversationStarted}`)
  console.log(`   Message count: ${resetWithMetadata.messageCount}`)
  console.log(`   Event ID: ${resetWithMetadata.eventId || 'undefined'}`)
  
  // Complete reset
  const completeReset = ConversationContextHandler.resetContext(false)
  console.log('✅ Complete reset:')
  console.log(`   Has conversation started: ${!!completeReset.conversationStarted}`)
  console.log(`   Message count: ${completeReset.messageCount}`)
  
  console.log('\n✅ Conversation Context Handler testing complete!')
  console.log('\nKey Features Demonstrated:')
  console.log('- Context creation and updates')
  console.log('- Event, registration, and emergency context management')
  console.log('- Information request tracking')
  console.log('- Schedule modification handling')
  console.log('- Contact update management')
  console.log('- Error and retry counting')
  console.log('- Temporary data storage')
  console.log('- Context validation and sanitization')
  console.log('- Context export/import functionality')
  console.log('- Context merging and reset capabilities')
  console.log('- Comprehensive context summary generation')
}

// Run if called directly
if (require.main === module) {
  testConversationContext()
}

module.exports = { testConversationContext }