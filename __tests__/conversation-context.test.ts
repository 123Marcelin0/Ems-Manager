// Unit tests for Conversation Context Handler
import { ConversationContextHandler, ConversationContext } from '../lib/conversation-context'

describe('ConversationContextHandler', () => {
  describe('createContext', () => {
    test('should create context with default values', () => {
      const context = ConversationContextHandler.createContext()
      
      expect(context.conversationStarted).toBeDefined()
      expect(context.lastActivity).toBeDefined()
      expect(context.messageCount).toBe(0)
      expect(context.errorCount).toBe(0)
      expect(context.retryCount).toBe(0)
      expect(context.informationRequests).toEqual([])
      expect(context.contactUpdates).toEqual([])
    })

    test('should create context with initial data', () => {
      const initialData = {
        eventId: 'event-123',
        employeeName: 'Max Mustermann'
      }
      
      const context = ConversationContextHandler.createContext(initialData)
      
      expect(context.eventId).toBe('event-123')
      expect(context.employeeName).toBe('Max Mustermann')
      expect(context.messageCount).toBe(0)
    })
  })

  describe('updateContext', () => {
    test('should update context with new data', () => {
      const currentContext = ConversationContextHandler.createContext()
      const updates = { eventId: 'event-456', messageCount: 5 }
      
      const updatedContext = ConversationContextHandler.updateContext(currentContext, updates)
      
      expect(updatedContext.eventId).toBe('event-456')
      expect(updatedContext.messageCount).toBe(5)
      expect(updatedContext.lastActivity).not.toBe(currentContext.lastActivity)
    })

    test('should increment message count automatically', () => {
      const currentContext = ConversationContextHandler.createContext()
      currentContext.messageCount = 3
      
      const updatedContext = ConversationContextHandler.updateContext(currentContext, { eventId: 'test' })
      
      expect(updatedContext.messageCount).toBe(4)
    })

    test('should not increment message count when explicitly set', () => {
      const currentContext = ConversationContextHandler.createContext()
      currentContext.messageCount = 3
      
      const updatedContext = ConversationContextHandler.updateContext(currentContext, { messageCount: 10 })
      
      expect(updatedContext.messageCount).toBe(10)
    })
  })

  describe('getContextValue', () => {
    test('should get existing context value', () => {
      const context = ConversationContextHandler.createContext({ eventId: 'event-123' })
      
      const value = ConversationContextHandler.getContextValue(context, 'eventId')
      
      expect(value).toBe('event-123')
    })

    test('should return default value for missing key', () => {
      const context = ConversationContextHandler.createContext()
      
      const value = ConversationContextHandler.getContextValue(context, 'eventId', 'default-event')
      
      expect(value).toBe('default-event')
    })
  })

  describe('setContextValue', () => {
    test('should set context value', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.setContextValue(context, 'eventId', 'new-event')
      
      expect(updatedContext.eventId).toBe('new-event')
    })
  })

  describe('addInformationRequest', () => {
    test('should add information request to context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.addInformationRequest(
        context,
        'location',
        'Wo ist der Treffpunkt?'
      )
      
      expect(updatedContext.informationRequests).toHaveLength(1)
      expect(updatedContext.informationRequests![0].type).toBe('location')
      expect(updatedContext.informationRequests![0].question).toBe('Wo ist der Treffpunkt?')
      expect(updatedContext.informationRequests![0].answered).toBe(false)
      expect(updatedContext.lastInfoRequest).toBe('location')
    })

    test('should add multiple information requests', () => {
      let context = ConversationContextHandler.createContext()
      
      context = ConversationContextHandler.addInformationRequest(context, 'location', 'Wo?')
      context = ConversationContextHandler.addInformationRequest(context, 'equipment', 'Was mitbringen?')
      
      expect(context.informationRequests).toHaveLength(2)
      expect(context.lastInfoRequest).toBe('equipment')
    })
  })

  describe('markInformationRequestAnswered', () => {
    test('should mark information request as answered', () => {
      let context = ConversationContextHandler.createContext()
      context = ConversationContextHandler.addInformationRequest(context, 'location', 'Wo?')
      
      const updatedContext = ConversationContextHandler.markInformationRequestAnswered(context, 'location')
      
      expect(updatedContext.informationRequests![0].answered).toBe(true)
      expect(updatedContext.informationProvided).toBe(true)
    })

    test('should only mark first unanswered request of type', () => {
      let context = ConversationContextHandler.createContext()
      context = ConversationContextHandler.addInformationRequest(context, 'location', 'Wo 1?')
      context = ConversationContextHandler.addInformationRequest(context, 'location', 'Wo 2?')
      
      const updatedContext = ConversationContextHandler.markInformationRequestAnswered(context, 'location')
      
      expect(updatedContext.informationRequests![0].answered).toBe(true)
      expect(updatedContext.informationRequests![1].answered).toBe(false)
    })
  })

  describe('addContactUpdate', () => {
    test('should add contact update to context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.addContactUpdate(
        context,
        'phone_number',
        '+49171234567',
        '+49172345678'
      )
      
      expect(updatedContext.contactUpdates).toHaveLength(1)
      expect(updatedContext.contactUpdates![0].type).toBe('phone_number')
      expect(updatedContext.contactUpdates![0].oldValue).toBe('+49171234567')
      expect(updatedContext.contactUpdates![0].newValue).toBe('+49172345678')
      expect(updatedContext.contactUpdates![0].processed).toBe(false)
    })
  })

  describe('setScheduleModification', () => {
    test('should set schedule modification context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.setScheduleModification(context, {
        type: 'start_time',
        originalTime: '09:00',
        requestedTime: '10:00',
        reason: 'Traffic delay'
      })
      
      expect(updatedContext.scheduleModification?.type).toBe('start_time')
      expect(updatedContext.scheduleModification?.originalTime).toBe('09:00')
      expect(updatedContext.scheduleModification?.requestedTime).toBe('10:00')
      expect(updatedContext.scheduleModification?.reason).toBe('Traffic delay')
      expect(updatedContext.scheduleModification?.processed).toBe(false)
    })
  })

  describe('setEmergencyContext', () => {
    test('should set emergency context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.setEmergencyContext(
        context,
        'late',
        {
          delayMinutes: '15',
          reason: 'Traffic jam',
          severity: 'low',
          requiresFollowup: false
        }
      )
      
      expect(updatedContext.emergencyType).toBe('late')
      expect(updatedContext.emergencyDetails?.delayMinutes).toBe('15')
      expect(updatedContext.emergencyDetails?.reason).toBe('Traffic jam')
      expect(updatedContext.emergencyDetails?.severity).toBe('low')
      expect(updatedContext.emergencyHandled).toBe(false)
    })
  })

  describe('setOvertimeContext', () => {
    test('should set overtime context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.setOvertimeContext(context, 2, 15.50)
      
      expect(updatedContext.overtimeRequest?.additionalHours).toBe(2)
      expect(updatedContext.overtimeRequest?.hourlyRate).toBe(15.50)
      expect(updatedContext.overtimeRequest?.requestSent).toBe(true)
      expect(updatedContext.overtimeRequest?.processed).toBe(false)
    })
  })

  describe('setEventContext', () => {
    test('should set event context', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.setEventContext(
        context,
        'event-123',
        {
          title: 'Test Event',
          date: '2024-01-15',
          location: 'Test Location'
        }
      )
      
      expect(updatedContext.eventId).toBe('event-123')
      expect(updatedContext.eventTitle).toBe('Test Event')
      expect(updatedContext.eventDate).toBe('2024-01-15')
      expect(updatedContext.eventLocation).toBe('Test Location')
      expect(updatedContext.notificationSent).toBe(false)
      expect(updatedContext.responseProcessed).toBe(false)
    })
  })

  describe('incrementErrorCount', () => {
    test('should increment error count', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.incrementErrorCount(context)
      
      expect(updatedContext.errorCount).toBe(1)
    })

    test('should increment from existing count', () => {
      const context = ConversationContextHandler.createContext({ errorCount: 3 })
      
      const updatedContext = ConversationContextHandler.incrementErrorCount(context)
      
      expect(updatedContext.errorCount).toBe(4)
    })
  })

  describe('incrementRetryCount', () => {
    test('should increment retry count', () => {
      const context = ConversationContextHandler.createContext()
      
      const updatedContext = ConversationContextHandler.incrementRetryCount(context)
      
      expect(updatedContext.retryCount).toBe(1)
    })
  })

  describe('Temporary Data Management', () => {
    test('should set and get temporary data', () => {
      let context = ConversationContextHandler.createContext()
      
      context = ConversationContextHandler.setTempData(context, 'testKey', 'testValue')
      const value = ConversationContextHandler.getTempData(context, 'testKey')
      
      expect(value).toBe('testValue')
    })

    test('should return default value for missing temp data', () => {
      const context = ConversationContextHandler.createContext()
      
      const value = ConversationContextHandler.getTempData(context, 'missing', 'default')
      
      expect(value).toBe('default')
    })

    test('should clear temporary data', () => {
      let context = ConversationContextHandler.createContext()
      context = ConversationContextHandler.setTempData(context, 'testKey', 'testValue')
      
      const clearedContext = ConversationContextHandler.clearTempData(context)
      
      expect(clearedContext.tempData).toEqual({})
    })
  })

  describe('validateContext', () => {
    test('should validate valid context', () => {
      const context = ConversationContextHandler.createContext({
        eventDate: '2024-01-15',
        emergencyDetails: { delayMinutes: '15', severity: 'low' },
        overtimeRequest: { additionalHours: 2, hourlyRate: 15.50, requestSent: true }
      })
      
      const result = ConversationContextHandler.validateContext(context)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect invalid event date format', () => {
      const context = ConversationContextHandler.createContext({
        eventDate: 'invalid-date'
      })
      
      const result = ConversationContextHandler.validateContext(context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid event date format (expected YYYY-MM-DD)')
    })

    test('should detect invalid emergency severity', () => {
      const context = ConversationContextHandler.createContext({
        emergencyType: 'late',
        emergencyDetails: { severity: 'invalid' as any }
      })
      
      const result = ConversationContextHandler.validateContext(context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid emergency severity level')
    })

    test('should detect invalid overtime values', () => {
      const context = ConversationContextHandler.createContext({
        overtimeRequest: { additionalHours: -1, hourlyRate: 0, requestSent: true }
      })
      
      const result = ConversationContextHandler.validateContext(context)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Additional hours must be positive')
      expect(result.errors).toContain('Hourly rate must be positive')
    })

    test('should sanitize negative counts', () => {
      const context = ConversationContextHandler.createContext({
        messageCount: -5,
        errorCount: -2
      })
      
      const result = ConversationContextHandler.validateContext(context)
      
      expect(result.sanitizedContext?.messageCount).toBe(0)
      expect(result.sanitizedContext?.errorCount).toBe(0)
      expect(result.warnings).toContain('Message count was negative, reset to 0')
      expect(result.warnings).toContain('Error count was negative, reset to 0')
    })
  })

  describe('Context Checking Methods', () => {
    test('should detect event context', () => {
      const context = ConversationContextHandler.createContext({
        eventId: 'event-123',
        eventTitle: 'Test Event'
      })
      
      expect(ConversationContextHandler.hasEventContext(context)).toBe(true)
    })

    test('should detect registration context', () => {
      const context = ConversationContextHandler.createContext({
        registrationCode: 'emsland100'
      })
      
      expect(ConversationContextHandler.hasRegistrationContext(context)).toBe(true)
    })

    test('should detect emergency context', () => {
      const context = ConversationContextHandler.createContext({
        emergencyType: 'late',
        emergencyDetails: { delayMinutes: '15' }
      })
      
      expect(ConversationContextHandler.hasEmergencyContext(context)).toBe(true)
    })

    test('should detect schedule modification context', () => {
      const context = ConversationContextHandler.createContext({
        scheduleModification: { type: 'start_time', processed: false }
      })
      
      expect(ConversationContextHandler.hasScheduleModificationContext(context)).toBe(true)
    })

    test('should not detect processed schedule modification', () => {
      const context = ConversationContextHandler.createContext({
        scheduleModification: { type: 'start_time', processed: true }
      })
      
      expect(ConversationContextHandler.hasScheduleModificationContext(context)).toBe(false)
    })
  })

  describe('getContextSummary', () => {
    test('should generate context summary', () => {
      const context = ConversationContextHandler.createContext({
        registrationStep: 'completed',
        eventTitle: 'Test Event',
        eventResponse: 'accept',
        messageCount: 5,
        errorCount: 1
      })
      
      const summary = ConversationContextHandler.getContextSummary(context)
      
      expect(summary).toContain('Registration: completed')
      expect(summary).toContain('Event: Test Event (accept)')
      expect(summary).toContain('Messages: 5')
      expect(summary).toContain('Errors: 1')
    })
  })

  describe('mergeContexts', () => {
    test('should merge contexts correctly', () => {
      const baseContext = ConversationContextHandler.createContext({
        eventId: 'event-123',
        messageCount: 3,
        informationRequests: [{ type: 'location', question: 'Where?', answered: false, timestamp: '2024-01-01' }]
      })
      
      const newContext = {
        employeeName: 'Max Mustermann',
        messageCount: 5,
        informationRequests: [{ type: 'equipment', question: 'What?', answered: false, timestamp: '2024-01-02' }]
      }
      
      const merged = ConversationContextHandler.mergeContexts(baseContext, newContext)
      
      expect(merged.eventId).toBe('event-123')
      expect(merged.employeeName).toBe('Max Mustermann')
      expect(merged.messageCount).toBe(5)
      expect(merged.informationRequests).toHaveLength(2)
    })
  })

  describe('Export/Import Context', () => {
    test('should export and import context', () => {
      const originalContext = ConversationContextHandler.createContext({
        eventId: 'event-123',
        employeeName: 'Max Mustermann'
      })
      
      const exported = ConversationContextHandler.exportContext(originalContext)
      const imported = ConversationContextHandler.importContext(exported)
      
      expect(imported.eventId).toBe(originalContext.eventId)
      expect(imported.employeeName).toBe(originalContext.employeeName)
    })

    test('should handle invalid import data', () => {
      expect(() => {
        ConversationContextHandler.importContext('invalid json')
      }).toThrow('Failed to import context')
    })
  })

  describe('resetContext', () => {
    test('should reset context with metadata preserved', () => {
      const context = ConversationContextHandler.createContext({
        eventId: 'event-123',
        employeeName: 'Max Mustermann',
        messageCount: 10
      })
      
      const reset = ConversationContextHandler.resetContext(true)
      
      expect(reset.eventId).toBeUndefined()
      expect(reset.employeeName).toBeUndefined()
      expect(reset.messageCount).toBe(0)
      expect(reset.conversationStarted).toBeDefined()
    })

    test('should reset context completely', () => {
      const context = ConversationContextHandler.createContext({
        eventId: 'event-123',
        messageCount: 10
      })
      
      const reset = ConversationContextHandler.resetContext(false)
      
      expect(reset.eventId).toBeUndefined()
      expect(reset.messageCount).toBe(0)
      expect(reset.conversationStarted).toBeDefined()
    })
  })
})