const { ResponseParser } = require('../lib/response-parser')

function testResponseParser() {
  console.log('🧪 Testing Response Parser...')
  console.log('=============================')
  
  // Test messages in German
  const testMessages = [
    // Event responses
    { message: 'Ja', expected: 'event_response' },
    { message: 'ja, ich kann arbeiten', expected: 'event_response' },
    { message: '1', expected: 'event_response' },
    { message: 'Nein', expected: 'event_response' },
    { message: 'kann nicht arbeiten', expected: 'event_response' },
    { message: '2', expected: 'event_response' },
    { message: 'Kann ich dir bis morgen Bescheid geben?', expected: 'event_response' },
    { message: '3', expected: 'event_response' },
    { message: 'Wo ist das?', expected: 'event_response' },
    
    // Registration
    { message: 'Emsland100', expected: 'registration' },
    { message: 'Max Mustermann', expected: 'registration' },
    { message: 'Anna Schmidt', expected: 'registration' },
    
    // Emergency situations
    { message: 'Bin im Stau, komme 15 Minuten später', expected: 'emergency' },
    { message: 'Bin krank', expected: 'emergency' },
    { message: 'Muss absagen', expected: 'emergency' },
    { message: 'Verletzt, kann nicht kommen', expected: 'emergency' },
    
    // Schedule modifications
    { message: 'Kann ich erst um 10 Uhr anfangen?', expected: 'schedule_modification' },
    { message: 'Muss um 17 Uhr weg', expected: 'schedule_modification' },
    { message: 'Kann nur 3 Stunden arbeiten', expected: 'schedule_modification' },
    
    // Information requests
    { message: 'Wo ist der Treffpunkt?', expected: 'information_request' },
    { message: 'Was muss ich mitbringen?', expected: 'information_request' },
    { message: 'Wer ist Ansprechpartner?', expected: 'information_request' },
    
    // Unknown/ambiguous
    { message: 'random text xyz', expected: 'unknown' },
    { message: 'maybe later', expected: 'unknown' }
  ]
  
  console.log('\n1. Message Classification Test:')
  console.log('─'.repeat(60))
  
  let correctClassifications = 0
  let totalTests = testMessages.length
  
  testMessages.forEach((test, index) => {
    const result = ResponseParser.classifyMessage(test.message)
    const isCorrect = result.type === test.expected
    const status = isCorrect ? '✅' : '❌'
    
    console.log(`${status} "${test.message}"`)
    console.log(`   → Classified as: ${result.type} (confidence: ${result.confidence.toFixed(2)})`)
    console.log(`   → Expected: ${test.expected}`)
    
    if (isCorrect) correctClassifications++
    console.log('')
  })
  
  console.log(`Classification Accuracy: ${correctClassifications}/${totalTests} (${(correctClassifications/totalTests*100).toFixed(1)}%)`)
  
  console.log('\n2. Detailed Event Response Parsing:')
  console.log('─'.repeat(60))
  
  const eventResponses = [
    'Ja',
    'ja, ich kann arbeiten',
    'Nein, leider nicht',
    'kann nicht',
    'Kann ich bis morgen überlegen?',
    'Wo ist das Event?',
    'random response'
  ]
  
  eventResponses.forEach(message => {
    const result = ResponseParser.parseEventResponse(message)
    console.log(`"${message}" → ${result.type} (${result.confidence.toFixed(2)})`)
  })
  
  console.log('\n3. Schedule Modification Parsing:')
  console.log('─'.repeat(60))
  
  const scheduleMessages = [
    'Kann ich erst um 10:30 anfangen?',
    'Muss um 17 Uhr weg',
    'Kann nur 3 Stunden arbeiten',
    'Später anfangen möglich?'
  ]
  
  scheduleMessages.forEach(message => {
    const result = ResponseParser.parseScheduleModification(message)
    console.log(`"${message}"`)
    console.log(`  → Type: ${result.type}`)
    console.log(`  → Requested Time: ${result.requestedTime || 'N/A'}`)
    console.log(`  → Confidence: ${result.confidence.toFixed(2)}`)
    console.log('')
  })
  
  console.log('\n4. Emergency Message Parsing:')
  console.log('─'.repeat(60))
  
  const emergencyMessages = [
    'Bin im Stau, komme 20 Minuten später',
    'Bin krank geworden',
    'Verletzt, kann nicht arbeiten',
    'Muss kurzfristig absagen'
  ]
  
  emergencyMessages.forEach(message => {
    const result = ResponseParser.parseEmergencyMessage(message)
    console.log(`"${message}"`)
    console.log(`  → Type: ${result.type}`)
    console.log(`  → Delay: ${result.delayMinutes || 'N/A'}`)
    console.log(`  → Confidence: ${result.confidence.toFixed(2)}`)
    console.log('')
  })
  
  console.log('\n5. Registration Response Parsing:')
  console.log('─'.repeat(60))
  
  const registrationMessages = [
    'Emsland100',
    'Max Mustermann',
    'Anna-Maria Schmidt',
    'invalid123',
    'test'
  ]
  
  registrationMessages.forEach(message => {
    const result = ResponseParser.parseRegistrationResponse(message)
    console.log(`"${message}" → ${result.type} (${result.confidence.toFixed(2)})`)
    if (result.data) console.log(`  Data: ${result.data}`)
  })
  
  console.log('\n6. Information Request Parsing:')
  console.log('─'.repeat(60))
  
  const infoMessages = [
    'Wo ist der Treffpunkt?',
    'Was muss ich mitbringen?',
    'Wer ist vor Ort?',
    'Allgemeine Frage?'
  ]
  
  infoMessages.forEach(message => {
    const result = ResponseParser.parseInformationRequest(message)
    console.log(`"${message}" → ${result.type} (${result.confidence.toFixed(2)})`)
  })
  
  console.log('\n7. Confidence Threshold Testing:')
  console.log('─'.repeat(60))
  
  const messageTypes = ['registration', 'event_response', 'emergency', 'schedule_modification', 'information_request']
  messageTypes.forEach(type => {
    const threshold = ResponseParser.getConfidenceThreshold(type)
    console.log(`${type}: ${threshold}`)
  })
  
  console.log('\n✅ Response Parser testing complete!')
  console.log('\nKey Features Demonstrated:')
  console.log('- German language pattern recognition')
  console.log('- Multiple response type classification')
  console.log('- Confidence scoring for reliability')
  console.log('- Robust handling of variations and edge cases')
  console.log('- Time and name extraction capabilities')
}

// Run if called directly
if (require.main === module) {
  testResponseParser()
}

module.exports = { testResponseParser }