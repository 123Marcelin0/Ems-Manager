// Unit tests for Message Builder
import { MessageBuilder, Employee, Event, ScheduleModificationRequest } from '../lib/message-builder'

describe('MessageBuilder', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    name: 'Max Mustermann',
    phone_number: '+49171234567',
    role: 'allrounder'
  }

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Messe Berlin',
    event_date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    location: 'Emsland Arena',
    hourly_rate: 15.50,
    description: 'Test event'
  }

  describe('buildEventNotification', () => {
    test('should create properly formatted event notification', () => {
      const message = MessageBuilder.buildEventNotification(mockEmployee, mockEvent)
      
      expect(message).toContain('Hallo Max Mustermann!')
      expect(message).toContain('Messe Berlin')
      expect(message).toContain('Emsland Arena')
      expect(message).toContain('€15.50')
      expect(message).toContain('1️⃣ JA')
      expect(message).toContain('2️⃣ NEIN')
      expect(message).toContain('3️⃣ RÜCKFRAGE')
    })

    test('should handle events without end time', () => {
      const eventWithoutEndTime = { ...mockEvent, end_time: undefined }
      const message = MessageBuilder.buildEventNotification(mockEmployee, eventWithoutEndTime)
      
      expect(message).toContain('09:00')
      expect(message).not.toContain(' - 17:00')
    })

    test('should format date in German locale', () => {
      const message = MessageBuilder.buildEventNotification(mockEmployee, mockEvent)
      
      // Should contain German date format
      expect(message).toMatch(/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/)
      expect(message).toMatch(/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/)
    })
  })

  describe('buildRegistrationPrompt', () => {
    test('should create registration prompt message', () => {
      const message = MessageBuilder.buildRegistrationPrompt()
      
      expect(message).toContain('Willkommen bei unserem Event-Team!')
      expect(message).toContain('Emsland100')
      expect(message).toContain('vollständigen Namen')
      expect(message).toContain('Max Mustermann')
    })
  })

  describe('buildRegistrationConfirmation', () => {
    test('should create personalized confirmation message', () => {
      const message = MessageBuilder.buildRegistrationConfirmation('Max Mustermann')
      
      expect(message).toContain('Hallo Max Mustermann!')
      expect(message).toContain('Registrierung war erfolgreich')
      expect(message).toContain('SMS-Benachrichtigungen')
      expect(message).toContain('Herrn Schepergerdes')
    })
  })

  describe('Event Response Confirmations', () => {
    test('should build acceptance confirmation', () => {
      const message = MessageBuilder.buildEventAcceptanceConfirmation(mockEmployee, mockEvent)
      
      expect(message).toContain('Super, Max Mustermann!')
      expect(message).toContain('Zusage')
      expect(message).toContain('Messe Berlin')
      expect(message).toContain('Emsland Arena')
      expect(message).toContain('09:00')
    })

    test('should build decline confirmation', () => {
      const message = MessageBuilder.buildEventDeclineConfirmation(mockEmployee, mockEvent)
      
      expect(message).toContain('Schade, Max Mustermann!')
      expect(message).toContain('Rückmeldung')
      expect(message).toContain('Messe Berlin')
      expect(message).toContain('nächsten Mal')
    })

    test('should build time request response', () => {
      const deadline = '17.02.2024 18:00'
      const message = MessageBuilder.buildEventTimeRequestResponse(mockEmployee, deadline)
      
      expect(message).toContain('Kein Problem, Max Mustermann!')
      expect(message).toContain(deadline)
      expect(message).toContain('1️⃣ JA')
      expect(message).toContain('2️⃣ NEIN')
    })
  })

  describe('Schedule Modification Responses', () => {
    test('should handle start time modification', () => {
      const modification: ScheduleModificationRequest = {
        type: 'start_time',
        originalTime: '09:00',
        requestedTime: '10:00'
      }
      
      const message = MessageBuilder.buildScheduleModificationResponse(
        mockEmployee, 
        modification, 
        mockEvent
      )
      
      expect(message).toContain('Alles klar, Max Mustermann!')
      expect(message).toContain('geänderten Arbeitsbeginn')
      expect(message).toContain('10:00')
      expect(message).toContain('Messe Berlin')
    })

    test('should handle end time modification', () => {
      const modification: ScheduleModificationRequest = {
        type: 'end_time',
        originalTime: '17:00',
        requestedTime: '16:00'
      }
      
      const message = MessageBuilder.buildScheduleModificationResponse(
        mockEmployee, 
        modification, 
        mockEvent
      )
      
      expect(message).toContain('Verstanden, Max Mustermann!')
      expect(message).toContain('früheren Feierabend')
      expect(message).toContain('16:00')
      expect(message).toContain('Herrn Schepergerdes')
      expect(message).toContain('persönlich abzumelden')
    })

    test('should handle duration modification', () => {
      const modification: ScheduleModificationRequest = {
        type: 'duration',
        reason: 'Nur 3 Stunden möglich'
      }
      
      const message = MessageBuilder.buildScheduleModificationResponse(
        mockEmployee, 
        modification, 
        mockEvent
      )
      
      expect(message).toContain('Alles klar, Max Mustermann!')
      expect(message).toContain('geänderte Arbeitszeit')
      expect(message).toContain('Herrn Schepergerdes')
    })
  })

  describe('Emergency Responses', () => {
    test('should handle late arrival', () => {
      const message = MessageBuilder.buildEmergencyResponse(
        mockEmployee, 
        'late', 
        { delayMinutes: '20' }
      )
      
      expect(message).toContain('Danke für die Info, Max Mustermann!')
      expect(message).toContain('Verspätung von 20 Minuten')
      expect(message).toContain('Gute Fahrt!')
    })

    test('should handle sickness', () => {
      const message = MessageBuilder.buildEmergencyResponse(mockEmployee, 'sick')
      
      expect(message).toContain('Gute Besserung, Max Mustermann!')
      expect(message).toContain('ausgetragen')
      expect(message).toContain('Attest')
      expect(message).toContain('Herrn Schepergerdes')
    })

    test('should handle injury', () => {
      const message = MessageBuilder.buildEmergencyResponse(mockEmployee, 'injury')
      
      expect(message).toContain('Das tut mir leid, Max Mustermann!')
      expect(message).toContain('Gute Besserung!')
      expect(message).toContain('Ersatz')
      expect(message).toContain('Arbeitsunfalls')
    })

    test('should handle cancellation', () => {
      const message = MessageBuilder.buildEmergencyResponse(mockEmployee, 'cancellation')
      
      expect(message).toContain('Danke für deine Nachricht, Max Mustermann!')
      expect(message).toContain('ausgetragen')
      expect(message).toContain('rechtzeitige Absage')
    })
  })

  describe('Information Responses', () => {
    test('should handle location requests', () => {
      const message = MessageBuilder.buildInformationResponse('location', { 
        location: 'Emsland Arena' 
      })
      
      expect(message).toContain('Treffpunkt-Info')
      expect(message).toContain('Emsland Arena')
      expect(message).toContain('Herrn Schepergerdes')
    })

    test('should handle equipment requests', () => {
      const message = MessageBuilder.buildInformationResponse('equipment')
      
      expect(message).toContain('Ausrüstungs-Info')
      expect(message).toContain('Herrn Schepergerdes')
      expect(message).toContain('mitbringen')
    })

    test('should handle contact requests', () => {
      const message = MessageBuilder.buildInformationResponse('contact')
      
      expect(message).toContain('Ansprechpartner vor Ort')
      expect(message).toContain('Frau Müller')
      expect(message).toContain('einweisen')
    })

    test('should handle unknown requests', () => {
      const message = MessageBuilder.buildInformationResponse('unknown')
      
      expect(message).toContain('nicht ganz verstanden')
      expect(message).toContain('Herrn Schepergerdes')
      expect(message).toContain('nochmal anders')
    })
  })

  describe('Overtime Messages', () => {
    test('should build overtime request', () => {
      const message = MessageBuilder.buildOvertimeRequest(mockEmployee, mockEvent, 2)
      
      expect(message).toContain('Hallo Max Mustermann!')
      expect(message).toContain('länger bleiben')
      expect(message).toContain('Messe Berlin')
      expect(message).toContain('ca. 2 Stunden')
      expect(message).toContain('€15.50')
      expect(message).toContain('1️⃣ JA')
      expect(message).toContain('2️⃣ NEIN')
    })

    test('should build overtime acceptance response', () => {
      const message = MessageBuilder.buildOvertimeAcceptanceResponse(mockEmployee)
      
      expect(message).toContain('Super, Max Mustermann!')
      expect(message).toContain('Angebot')
      expect(message).toContain('auf dem Laufenden')
    })

    test('should build overtime decline response', () => {
      const message = MessageBuilder.buildOvertimeDeclineResponse(mockEmployee)
      
      expect(message).toContain('Verstanden, Max Mustermann!')
      expect(message).toContain('Rückmeldung')
      expect(message).toContain('nächsten Mal')
    })
  })

  describe('Contact Update Messages', () => {
    test('should handle phone number update', () => {
      const message = MessageBuilder.buildContactUpdateConfirmation(mockEmployee, 'phone_number')
      
      expect(message).toContain('Danke, Max Mustermann!')
      expect(message).toContain('Telefonnummer wurde aktualisiert')
      expect(message).toContain('SMS-Benachrichtigungen')
    })

    test('should handle availability update', () => {
      const message = MessageBuilder.buildContactUpdateConfirmation(mockEmployee, 'availability')
      
      expect(message).toContain('Danke, Max Mustermann!')
      expect(message).toContain('Verfügbarkeiten wurden gespeichert')
      expect(message).toContain('Event-Anfragen')
    })
  })

  describe('Error Messages', () => {
    test('should build invalid response error', () => {
      const message = MessageBuilder.buildErrorMessage('invalid_response')
      
      expect(message).toContain('nicht verstanden')
      expect(message).toContain('1️⃣ JA')
      expect(message).toContain('2️⃣ NEIN')
      expect(message).toContain('3️⃣ RÜCKFRAGE')
    })

    test('should build registration failed error', () => {
      const message = MessageBuilder.buildErrorMessage('registration_failed')
      
      expect(message).toContain('Registrierung fehlgeschlagen')
      expect(message).toContain('nochmal')
      expect(message).toContain('Herrn Schepergerdes')
    })

    test('should build invalid code error', () => {
      const message = MessageBuilder.buildErrorMessage('invalid_code')
      
      expect(message).toContain('Ungültiger Code')
      expect(message).toContain('Emsland100')
      expect(message).toContain('erforderlich')
    })
  })

  describe('Helper Methods', () => {
    test('should format date and time correctly', () => {
      const formatted = MessageBuilder.formatDateTime('2024-01-15', '09:00')
      
      expect(formatted).toMatch(/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/)
      expect(formatted).toContain('um 09:00')
    })

    test('should format date without time', () => {
      const formatted = MessageBuilder.formatDateTime('2024-01-15')
      
      expect(formatted).toMatch(/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/)
      expect(formatted).not.toContain('um')
    })

    test('should validate message length', () => {
      const shortMessage = 'Short message'
      const longMessage = 'A'.repeat(200)
      const veryLongMessage = 'A'.repeat(1700)
      
      const shortResult = MessageBuilder.validateMessageLength(shortMessage)
      expect(shortResult.isValid).toBe(true)
      expect(shortResult.segments).toBe(1)
      
      const longResult = MessageBuilder.validateMessageLength(longMessage)
      expect(longResult.isValid).toBe(true)
      expect(longResult.segments).toBe(2)
      expect(longResult.warning).toContain('2 SMS segments')
      
      const veryLongResult = MessageBuilder.validateMessageLength(veryLongMessage)
      expect(veryLongResult.isValid).toBe(false)
      expect(veryLongResult.segments).toBeGreaterThan(10)
    })

    test('should truncate long messages', () => {
      const longMessage = 'A'.repeat(1700)
      const truncated = MessageBuilder.truncateMessage(longMessage, 100)
      
      expect(truncated.length).toBe(100)
      expect(truncated).toEndWith('...')
    })

    test('should not truncate short messages', () => {
      const shortMessage = 'Short message'
      const result = MessageBuilder.truncateMessage(shortMessage, 100)
      
      expect(result).toBe(shortMessage)
    })
  })
})