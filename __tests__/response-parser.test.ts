// Unit tests for Response Parser
import { ResponseParser } from '../lib/response-parser'

describe('ResponseParser', () => {
  describe('parseEventResponse', () => {
    test('should parse acceptance responses with high confidence', () => {
      const acceptanceMessages = [
        'Ja',
        'ja',
        'JA',
        'Yes',
        'j',
        '1',
        '1️⃣',
        'Ich kann arbeiten',
        'kann arbeiten',
        'bin dabei',
        'mache ich',
        'zusage',
        'ok',
        'okay',
        'passt'
      ]

      acceptanceMessages.forEach(message => {
        const result = ResponseParser.parseEventResponse(message)
        expect(result.type).toBe('accept')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse decline responses with high confidence', () => {
      const declineMessages = [
        'Nein',
        'nein',
        'NEIN',
        'No',
        'n',
        '2',
        '2️⃣',
        'kann nicht arbeiten',
        'kann nicht',
        'geht nicht',
        'passt nicht',
        'absage',
        'leider nicht',
        'keine zeit'
      ]

      declineMessages.forEach(message => {
        const result = ResponseParser.parseEventResponse(message)
        expect(result.type).toBe('decline')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse time request responses', () => {
      const timeRequestMessages = [
        'Kann ich dir bis morgen Bescheid geben?',
        'bescheid geben bis übermorgen',
        'später antworten',
        'noch überlegen',
        'melde mich später',
        'sage später bescheid'
      ]

      timeRequestMessages.forEach(message => {
        const result = ResponseParser.parseEventResponse(message)
        expect(result.type).toBe('request_time')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse question responses', () => {
      const questionMessages = [
        '3',
        '3️⃣',
        'rückfrage',
        'Ich habe eine Frage',
        'Wo ist das?',
        'Wann genau?',
        'Was muss ich mitbringen?',
        'Mehr Details bitte?',
        'Wie komme ich dahin?'
      ]

      questionMessages.forEach(message => {
        const result = ResponseParser.parseEventResponse(message)
        expect(result.type).toBe('question')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should handle unknown responses', () => {
      const unknownMessages = [
        'xyz',
        'random text',
        '123abc',
        'maybe later',
        'ich weiß nicht'
      ]

      unknownMessages.forEach(message => {
        const result = ResponseParser.parseEventResponse(message)
        expect(result.type).toBe('unknown')
        expect(result.confidence).toBeLessThan(0.5)
      })
    })
  })

  describe('parseScheduleModification', () => {
    test('should parse start time modifications', () => {
      const startTimeMessages = [
        'Kann ich erst um 10 Uhr anfangen?',
        'kann ich erst um 10:30 anfangen',
        'anfangen um 11',
        'start um 9:30',
        'beginnen um 10:00',
        'später anfangen',
        'später kommen'
      ]

      startTimeMessages.forEach(message => {
        const result = ResponseParser.parseScheduleModification(message)
        expect(result.type).toBe('start_time')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse end time modifications', () => {
      const endTimeMessages = [
        'Muss um 18 Uhr weg',
        'kann nur bis 17:00',
        'schluss um 16 uhr',
        'früher gehen',
        'früher schluss',
        'eher weg'
      ]

      endTimeMessages.forEach(message => {
        const result = ResponseParser.parseScheduleModification(message)
        expect(result.type).toBe('end_time')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse duration modifications', () => {
      const durationMessages = [
        'Ich kann nur 3 Stunden',
        'kann nur 4 stunden arbeiten',
        'nur 2h',
        'weniger stunden',
        'kürzere zeit',
        'nicht so lange'
      ]

      durationMessages.forEach(message => {
        const result = ResponseParser.parseScheduleModification(message)
        expect(result.type).toBe('duration')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should extract time information correctly', () => {
      const result1 = ResponseParser.parseScheduleModification('Kann ich erst um 10:30 anfangen?')
      expect(result1.requestedTime).toBe('10:30')

      const result2 = ResponseParser.parseScheduleModification('Muss um 17 Uhr weg')
      expect(result2.requestedTime).toBe('17:00')
    })
  })

  describe('parseRegistrationResponse', () => {
    test('should recognize registration code', () => {
      const result = ResponseParser.parseRegistrationResponse('Emsland100')
      expect(result.type).toBe('code')
      expect(result.data).toBe('emsland100')
      expect(result.confidence).toBe(1.0)
    })

    test('should recognize valid names', () => {
      const validNames = [
        'Max Mustermann',
        'Anna Schmidt',
        'Hans-Peter Müller',
        'Maria Gonzalez Weber'
      ]

      validNames.forEach(name => {
        const result = ResponseParser.parseRegistrationResponse(name)
        expect(result.type).toBe('name')
        expect(result.data).toBe(name)
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should reject invalid registration responses', () => {
      const invalidResponses = [
        'Max',
        '123',
        'test@email.com',
        'random text without proper name format'
      ]

      invalidResponses.forEach(response => {
        const result = ResponseParser.parseRegistrationResponse(response)
        expect(result.type).toBe('invalid')
        expect(result.confidence).toBe(0.0)
      })
    })
  })

  describe('parseEmergencyMessage', () => {
    test('should parse late arrival messages', () => {
      const lateMessages = [
        'Bin im Stau, komme 15 Minuten später',
        'Verspätung von 20 min',
        'komme ca. 10 min später',
        'schaffe es nicht pünktlich',
        'komme zu spät'
      ]

      lateMessages.forEach(message => {
        const result = ResponseParser.parseEmergencyMessage(message)
        expect(result.type).toBe('late')
        expect(result.confidence).toBeGreaterThan(0.7)
      })
    })

    test('should parse sickness messages', () => {
      const sickMessages = [
        'Bin krank',
        'krank geworden',
        'erkältet',
        'habe Fieber',
        'Grippe',
        'Magen-Darm',
        'brauche Attest'
      ]

      sickMessages.forEach(message => {
        const result = ResponseParser.parseEmergencyMessage(message)
        expect(result.type).toBe('sick')
        expect(result.confidence).toBeGreaterThan(0.7)
      })
    })

    test('should parse injury messages', () => {
      const injuryMessages = [
        'Bin verletzt',
        'hatte einen Unfall',
        'Sturz gehabt',
        'Schmerzen im Rücken',
        'kann nicht laufen',
        'Arbeitsunfall'
      ]

      injuryMessages.forEach(message => {
        const result = ResponseParser.parseEmergencyMessage(message)
        expect(result.type).toBe('injury')
        expect(result.confidence).toBeGreaterThan(0.7)
      })
    })

    test('should parse cancellation messages', () => {
      const cancellationMessages = [
        'Muss absagen',
        'kann nicht kommen',
        'schaffe es nicht',
        'kurzfristig absagen',
        'muss mich abmelden'
      ]

      cancellationMessages.forEach(message => {
        const result = ResponseParser.parseEmergencyMessage(message)
        expect(result.type).toBe('cancellation')
        expect(result.confidence).toBeGreaterThan(0.7)
      })
    })

    test('should extract delay time from late messages', () => {
      const result = ResponseParser.parseEmergencyMessage('komme 25 Minuten später')
      expect(result.delayMinutes).toBe('25')
    })
  })

  describe('parseInformationRequest', () => {
    test('should parse location requests', () => {
      const locationMessages = [
        'Wo ist das?',
        'Treffpunkt?',
        'Adresse bitte',
        'Wie komme ich dahin?',
        'Wegbeschreibung'
      ]

      locationMessages.forEach(message => {
        const result = ResponseParser.parseInformationRequest(message)
        expect(result.type).toBe('location')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse equipment requests', () => {
      const equipmentMessages = [
        'Was muss ich mitbringen?',
        'Ausrüstung?',
        'Welche Kleidung?',
        'Was brauche ich?',
        'Equipment?'
      ]

      equipmentMessages.forEach(message => {
        const result = ResponseParser.parseInformationRequest(message)
        expect(result.type).toBe('equipment')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse contact requests', () => {
      const contactMessages = [
        'Wer ist Ansprechpartner?',
        'Wer ist vor Ort?',
        'Kontakt?',
        'Telefonnummer?',
        'Wie kann ich euch erreichen?'
      ]

      contactMessages.forEach(message => {
        const result = ResponseParser.parseInformationRequest(message)
        expect(result.type).toBe('contact')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse general questions', () => {
      const generalMessages = [
        'Ich habe eine Frage',
        'Mehr Infos bitte',
        'Was muss ich wissen?',
        'Details?'
      ]

      generalMessages.forEach(message => {
        const result = ResponseParser.parseInformationRequest(message)
        expect(result.type).toBe('general')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })
  })

  describe('parseOvertimeResponse', () => {
    test('should parse overtime acceptance', () => {
      const acceptMessages = [
        'Ja, ich kann Überstunden machen',
        '1',
        'ja',
        'kann länger bleiben'
      ]

      acceptMessages.forEach(message => {
        const result = ResponseParser.parseOvertimeResponse(message)
        expect(result.type).toBe('accept')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })

    test('should parse overtime decline', () => {
      const declineMessages = [
        'Nein, heute nicht möglich',
        '2',
        'nein',
        'kann nicht länger'
      ]

      declineMessages.forEach(message => {
        const result = ResponseParser.parseOvertimeResponse(message)
        expect(result.type).toBe('decline')
        expect(result.confidence).toBeGreaterThan(0.5)
      })
    })
  })

  describe('classifyMessage', () => {
    test('should classify registration messages', () => {
      const result1 = ResponseParser.classifyMessage('Emsland100')
      expect(result1.type).toBe('registration')
      expect(result1.confidence).toBeGreaterThan(0.5)

      const result2 = ResponseParser.classifyMessage('Max Mustermann')
      expect(result2.type).toBe('registration')
      expect(result2.confidence).toBeGreaterThan(0.5)
    })

    test('should classify emergency messages', () => {
      const result = ResponseParser.classifyMessage('Bin krank, kann nicht kommen')
      expect(result.type).toBe('emergency')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    test('should classify schedule modifications', () => {
      const result = ResponseParser.classifyMessage('Kann ich erst um 10 Uhr anfangen?')
      expect(result.type).toBe('schedule_modification')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    test('should classify information requests', () => {
      const result = ResponseParser.classifyMessage('Wo ist der Treffpunkt?')
      expect(result.type).toBe('information_request')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    test('should classify event responses', () => {
      const result = ResponseParser.classifyMessage('Ja, ich kann arbeiten')
      expect(result.type).toBe('event_response')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should handle unknown messages', () => {
      const result = ResponseParser.classifyMessage('random gibberish xyz 123')
      expect(result.type).toBe('unknown')
      expect(result.confidence).toBe(0.0)
    })

    test('should preserve original message', () => {
      const originalMessage = 'Ja, ich kann arbeiten'
      const result = ResponseParser.classifyMessage(originalMessage)
      expect(result.originalMessage).toBe(originalMessage)
    })
  })

  describe('Confidence and Thresholds', () => {
    test('should return appropriate confidence thresholds', () => {
      expect(ResponseParser.getConfidenceThreshold('registration')).toBe(0.7)
      expect(ResponseParser.getConfidenceThreshold('event_response')).toBe(0.6)
      expect(ResponseParser.getConfidenceThreshold('emergency')).toBe(0.7)
      expect(ResponseParser.getConfidenceThreshold('unknown_type')).toBe(0.5)
    })

    test('should correctly identify confident responses', () => {
      const confidentResponse = {
        type: 'event_response',
        confidence: 0.9,
        originalMessage: 'ja'
      }
      expect(ResponseParser.isConfidentResponse(confidentResponse)).toBe(true)

      const uncertainResponse = {
        type: 'event_response',
        confidence: 0.3,
        originalMessage: 'maybe'
      }
      expect(ResponseParser.isConfidentResponse(uncertainResponse)).toBe(false)
    })
  })

  describe('Edge Cases and Robustness', () => {
    test('should handle empty messages', () => {
      const result = ResponseParser.classifyMessage('')
      expect(result.type).toBe('unknown')
      expect(result.confidence).toBe(0.0)
    })

    test('should handle messages with punctuation', () => {
      const result = ResponseParser.parseEventResponse('Ja!!!')
      expect(result.type).toBe('accept')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should handle mixed case messages', () => {
      const result = ResponseParser.parseEventResponse('JA, ich KANN arbeiten!')
      expect(result.type).toBe('accept')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should handle messages with extra whitespace', () => {
      const result = ResponseParser.parseEventResponse('  ja  ')
      expect(result.type).toBe('accept')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should handle German umlauts correctly', () => {
      const result = ResponseParser.parseRegistrationResponse('Jürgen Müller')
      expect(result.type).toBe('name')
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })
})