// Unit tests for SMS Service
import { SMSService, smsService } from '../lib/sms-service'
import { supabase } from '../lib/supabase'

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM123456789',
        status: 'sent'
      })
    }
  }))
})

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    rpc: jest.fn().mockResolvedValue({ data: 'test-id', error: null })
  }
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    TWILIO_ACCOUNT_SID: 'test-account-sid',
    TWILIO_AUTH_TOKEN: 'test-auth-token',
    TWILIO_PHONE_NUMBER: '+49123456789'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('SMSService', () => {
  describe('Configuration', () => {
    test('should be configured when all environment variables are present', () => {
      const service = new SMSService()
      expect(service.isConfigured()).toBe(true)
    })

    test('should not be configured when environment variables are missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID
      const service = new SMSService()
      expect(service.isConfigured()).toBe(false)
    })

    test('should return correct status', () => {
      const service = new SMSService()
      const status = service.getStatus()
      
      expect(status).toEqual({
        accountSid: true,
        authToken: true,
        phoneNumber: true,
        client: true,
        fullyConfigured: true
      })
    })
  })

  describe('sendMessage', () => {
    test('should send SMS message successfully', async () => {
      const service = new SMSService()
      const result = await service.sendMessage({
        to: '+49987654321',
        body: 'Test message',
        messageType: 'test'
      })

      expect(result.success).toBe(true)
      expect(result.messageSid).toBe('SM123456789')
      expect(result.deliveryStatus).toBe('sent')
    })

    test('should normalize phone numbers correctly', async () => {
      const service = new SMSService()
      
      // Test German mobile number starting with 0
      await service.sendMessage({
        to: '0171234567',
        body: 'Test message'
      })

      // Test number without country code
      await service.sendMessage({
        to: '171234567',
        body: 'Test message'
      })

      // Both should be normalized to +49 format
      expect(supabase.rpc).toHaveBeenCalledWith('log_sms_message', 
        expect.objectContaining({
          p_phone_number: '+49171234567'
        })
      )
    })

    test('should handle SMS sending errors', async () => {
      // Mock Twilio to throw error
      const mockTwilio = require('twilio')
      mockTwilio().messages.create.mockRejectedValueOnce(new Error('Twilio error'))

      const service = new SMSService()
      const result = await service.sendMessage({
        to: '+49987654321',
        body: 'Test message'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Twilio error')
      expect(result.deliveryStatus).toBe('failed')
    })

    test('should simulate SMS when Twilio is not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID
      const service = new SMSService()
      
      const result = await service.sendMessage({
        to: '+49987654321',
        body: 'Test message'
      })

      expect(result.success).toBe(true)
      expect(result.messageSid).toMatch(/^SM/)
      expect(result.deliveryStatus).toBe('sent')
    })
  })

  describe('sendEventNotifications', () => {
    beforeEach(() => {
      // Mock event data
      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'events') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                title: 'Test Event',
                event_date: '2024-01-15',
                start_time: '09:00',
                hourly_rate: 15.50,
                location: 'Test Location'
              },
              error: null
            })
          }
        } else if (table === 'employees') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'emp-1',
                  name: 'Max Mustermann',
                  phone_number: '+49171234567',
                  sms_enabled: true
                },
                {
                  id: 'emp-2',
                  name: 'Anna Schmidt',
                  phone_number: '+49172345678',
                  sms_enabled: true
                }
              ],
              error: null
            })
          }
        }
        return supabase.from(table)
      })
    })

    test('should send notifications to multiple employees', async () => {
      const service = new SMSService()
      const results = await service.sendEventNotifications('event-1', ['emp-1', 'emp-2'])

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[0].employeeName).toBe('Max Mustermann')
      expect(results[1].success).toBe(true)
      expect(results[1].employeeName).toBe('Anna Schmidt')
    })

    test('should handle individual employee notification failures', async () => {
      // Mock one SMS to fail
      const mockTwilio = require('twilio')
      mockTwilio().messages.create
        .mockResolvedValueOnce({ sid: 'SM123', status: 'sent' })
        .mockRejectedValueOnce(new Error('SMS failed'))

      const service = new SMSService()
      const results = await service.sendEventNotifications('event-1', ['emp-1', 'emp-2'])

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('SMS failed')
    })
  })

  describe('sendRegistrationPrompt', () => {
    test('should send registration prompt message', async () => {
      const service = new SMSService()
      const result = await service.sendRegistrationPrompt('+49171234567')

      expect(result.success).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('log_sms_message', 
        expect.objectContaining({
          p_message_type: 'registration_prompt'
        })
      )
    })
  })

  describe('processIncomingMessage', () => {
    test('should process incoming SMS message', async () => {
      const service = new SMSService()
      const result = await service.processIncomingMessage({
        from: '+49171234567',
        body: 'Ja, ich kann arbeiten',
        messageSid: 'SM987654321'
      })

      expect(result.success).toBe(true)
      expect(result.conversationId).toBeDefined()
      expect(supabase.rpc).toHaveBeenCalledWith('get_or_create_sms_conversation', {
        p_phone_number: '+49171234567'
      })
    })

    test('should handle processing errors', async () => {
      // Mock conversation creation to fail
      ;(supabase.rpc as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

      const service = new SMSService()
      const result = await service.processIncomingMessage({
        from: '+49171234567',
        body: 'Test message',
        messageSid: 'SM987654321'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('Message Creation', () => {
    test('should create properly formatted event notification message', async () => {
      const service = new SMSService()
      
      // Mock the private method by testing through sendEventNotifications
      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'events') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                title: 'Messe Berlin',
                event_date: '2024-01-15',
                start_time: '09:00',
                hourly_rate: 15.50,
                location: 'Messe Berlin'
              },
              error: null
            })
          }
        } else if (table === 'employees') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{
                id: 'emp-1',
                name: 'Max Mustermann',
                phone_number: '+49171234567',
                sms_enabled: true
              }],
              error: null
            })
          }
        }
        return supabase.from(table)
      })

      await service.sendEventNotifications('event-1', ['emp-1'])

      // Check that the message was logged with proper content
      expect(supabase.rpc).toHaveBeenCalledWith('log_sms_message', 
        expect.objectContaining({
          p_message_body: expect.stringContaining('Hallo Max Mustermann!'),
          p_message_body: expect.stringContaining('Messe Berlin'),
          p_message_body: expect.stringContaining('€15.50'),
          p_message_body: expect.stringContaining('1️⃣ JA'),
          p_message_body: expect.stringContaining('2️⃣ NEIN'),
          p_message_body: expect.stringContaining('3️⃣ RÜCKFRAGE')
        })
      )
    })
  })
})

describe('Singleton SMS Service', () => {
  test('should export singleton instance', () => {
    expect(smsService).toBeInstanceOf(SMSService)
  })

  test('should export helper functions', () => {
    const { isTwilioConfigured, getTwilioStatus } = require('../lib/sms-service')
    
    expect(typeof isTwilioConfigured).toBe('function')
    expect(typeof getTwilioStatus).toBe('function')
    expect(isTwilioConfigured()).toBe(true)
    expect(getTwilioStatus()).toEqual(expect.objectContaining({
      fullyConfigured: true
    }))
  })
})