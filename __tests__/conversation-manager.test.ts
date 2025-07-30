// Unit tests for Conversation Manager
import { ConversationManager, Conversation, ConversationState } from '../lib/conversation-manager'
import { supabase } from '../lib/supabase'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    gt: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }
}))

// Mock SMS Service
jest.mock('../lib/sms-service', () => ({
  smsService: {
    sendMessage: jest.fn().mockResolvedValue({ success: true, messageSid: 'SM123' })
  }
}))

describe('ConversationManager', () => {
  const mockConversation: Conversation = {
    id: 'conv-123',
    employeeId: 'emp-123',
    phoneNumber: '+49171234567',
    currentState: 'idle',
    contextData: {},
    eventId: 'event-123',
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateConversation', () => {
    test('should create new conversation successfully', async () => {
      const mockConversationData = {
        id: 'conv-123',
        employee_id: 'emp-123',
        phone_number: '+49171234567',
        current_state: 'idle',
        context_data: {},
        event_id: 'event-123',
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 'conv-123',
        error: null
      })

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: mockConversationData,
        error: null
      })

      const result = await ConversationManager.getOrCreateConversation('+49171234567', 'emp-123')

      expect(result.id).toBe('conv-123')
      expect(result.phoneNumber).toBe('+49171234567')
      expect(result.currentState).toBe('idle')
      expect(supabase.rpc).toHaveBeenCalledWith('get_or_create_sms_conversation', {
        p_phone_number: '+49171234567',
        p_employee_id: 'emp-123'
      })
    })

    test('should handle database errors', async () => {
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(
        ConversationManager.getOrCreateConversation('+49171234567')
      ).rejects.toThrow('Failed to get or create conversation')
    })
  })

  describe('updateConversationState', () => {
    test('should update conversation state successfully', async () => {
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      })

      await ConversationManager.updateConversationState(
        'conv-123',
        'awaiting_event_response',
        { eventId: 'event-123' }
      )

      expect(supabase.rpc).toHaveBeenCalledWith('update_conversation_state', {
        p_conversation_id: 'conv-123',
        p_new_state: 'awaiting_event_response',
        p_context_data: { eventId: 'event-123' },
        p_event_id: null
      })
    })

    test('should handle update errors', async () => {
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      })

      await expect(
        ConversationManager.updateConversationState('conv-123', 'completed')
      ).rejects.toThrow('Failed to update conversation state')
    })
  })

  describe('processMessage', () => {
    test('should handle registration code in idle state', async () => {
      const idleConversation = { ...mockConversation, currentState: 'idle' as ConversationState }
      
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await ConversationManager.processMessage(idleConversation, 'Emsland100')

      expect(result.success).toBe(true)
      expect(result.newState).toBe('registration_code_received')
      expect(result.shouldSendMessage).toBe(true)
      expect(result.responseMessage).toContain('Willkommen')
    })

    test('should handle invalid registration code', async () => {
      const idleConversation = { ...mockConversation, currentState: 'idle' as ConversationState }

      const result = await ConversationManager.processMessage(idleConversation, 'invalid123')

      expect(result.success).toBe(true)
      expect(result.shouldSendMessage).toBe(true)
      expect(result.responseMessage).toContain('Ungültiger Code')
    })

    test('should handle employee name in registration state', async () => {
      const registrationConversation = {
        ...mockConversation,
        currentState: 'registration_code_received' as ConversationState,
        contextData: { registrationCode: 'emsland100' }
      }

      ;(supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({ data: 'emp-new-123', error: null }) // create_employee_from_registration
        .mockResolvedValueOnce({ data: null, error: null }) // update_conversation_state

      const result = await ConversationManager.processMessage(registrationConversation, 'Max Mustermann')

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Max Mustermann')
      expect(result.responseMessage).toContain('Registrierung war erfolgreich')
    })

    test('should handle event acceptance', async () => {
      const eventConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      const mockEvent = {
        id: 'event-123',
        title: 'Test Event',
        event_date: '2024-01-15',
        start_time: '09:00',
        location: 'Test Location'
      }

      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: mockEmployee, error: null })
        .mockResolvedValueOnce({ data: mockEvent, error: null })

      ;(supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({ data: null, error: null }) // update_employee_event_status
        .mockResolvedValueOnce({ data: null, error: null }) // update_conversation_state

      const result = await ConversationManager.processMessage(eventConversation, 'Ja')

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Super, Max Mustermann')
    })

    test('should handle event decline', async () => {
      const eventConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      const mockEvent = {
        id: 'event-123',
        title: 'Test Event',
        event_date: '2024-01-15'
      }

      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: mockEmployee, error: null })
        .mockResolvedValueOnce({ data: mockEvent, error: null })

      ;(supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({ data: null, error: null }) // update_employee_event_status
        .mockResolvedValueOnce({ data: null, error: null }) // update_conversation_state

      const result = await ConversationManager.processMessage(eventConversation, 'Nein')

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Schade, Max Mustermann')
    })

    test('should handle time request', async () => {
      const eventConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      const mockEvent = {
        id: 'event-123',
        title: 'Test Event'
      }

      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: mockEmployee, error: null })
        .mockResolvedValueOnce({ data: mockEvent, error: null })

      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null })

      const result = await ConversationManager.processMessage(
        eventConversation,
        'Kann ich bis morgen Bescheid geben?'
      )

      expect(result.success).toBe(true)
      expect(result.responseMessage).toContain('Kein Problem, Max Mustermann')
      expect(result.responseMessage).toContain('18:00')
    })

    test('should handle schedule modification', async () => {
      const eventConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      const mockEvent = {
        id: 'event-123',
        title: 'Test Event',
        event_date: '2024-01-15'
      }

      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: mockEmployee, error: null })
        .mockResolvedValueOnce({ data: mockEvent, error: null })

      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null })

      const result = await ConversationManager.processMessage(
        eventConversation,
        'Kann ich erst um 10 Uhr anfangen?'
      )

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Alles klar, Max Mustermann')
      expect(result.responseMessage).toContain('10:00')
    })

    test('should handle emergency situations', async () => {
      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({ data: mockEmployee, error: null })
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null })

      const result = await ConversationManager.processMessage(
        mockConversation,
        'Bin krank, kann nicht kommen'
      )

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Gute Besserung, Max Mustermann')
    })

    test('should handle information requests', async () => {
      const eventConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      const mockEvent = {
        id: 'event-123',
        location: 'Emsland Arena'
      }

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({ data: mockEvent, error: null })
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null })

      const result = await ConversationManager.processMessage(
        eventConversation,
        'Wo ist der Treffpunkt?'
      )

      expect(result.success).toBe(true)
      expect(result.responseMessage).toContain('Treffpunkt-Info')
      expect(result.responseMessage).toContain('Emsland Arena')
    })

    test('should handle overtime responses', async () => {
      const overtimeConversation = {
        ...mockConversation,
        currentState: 'overtime_request_sent' as ConversationState
      }

      const mockEmployee = {
        id: 'emp-123',
        name: 'Max Mustermann',
        phone_number: '+49171234567'
      }

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({ data: mockEmployee, error: null })
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null })

      const result = await ConversationManager.processMessage(overtimeConversation, 'Ja')

      expect(result.success).toBe(true)
      expect(result.newState).toBe('completed')
      expect(result.responseMessage).toContain('Super, Max Mustermann')
    })

    test('should handle unknown states gracefully', async () => {
      const unknownStateConversation = {
        ...mockConversation,
        currentState: 'unknown_state' as ConversationState
      }

      const result = await ConversationManager.processMessage(unknownStateConversation, 'test')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown conversation state')
    })

    test('should handle processing errors', async () => {
      const errorConversation = {
        ...mockConversation,
        currentState: 'awaiting_event_response' as ConversationState,
        eventId: 'event-123'
      }

      ;(supabase.single as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

      const result = await ConversationManager.processMessage(errorConversation, 'Ja')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('cleanupExpiredConversations', () => {
    test('should cleanup expired conversations successfully', async () => {
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 5,
        error: null
      })

      const result = await ConversationManager.cleanupExpiredConversations()

      expect(result).toBe(5)
      expect(supabase.rpc).toHaveBeenCalledWith('cleanup_expired_conversations')
    })

    test('should handle cleanup errors', async () => {
      ;(supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Cleanup failed' }
      })

      await expect(ConversationManager.cleanupExpiredConversations()).rejects.toThrow(
        'Failed to cleanup expired conversations'
      )
    })
  })

  describe('getConversationById', () => {
    test('should get conversation by ID successfully', async () => {
      const mockConversationData = {
        id: 'conv-123',
        employee_id: 'emp-123',
        phone_number: '+49171234567',
        current_state: 'idle',
        context_data: {},
        event_id: 'event-123',
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: mockConversationData,
        error: null
      })

      const result = await ConversationManager.getConversationById('conv-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('conv-123')
      expect(result?.currentState).toBe('idle')
    })

    test('should return null for non-existent conversation', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      })

      const result = await ConversationManager.getConversationById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getActiveConversations', () => {
    test('should get active conversations successfully', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          employee_id: 'emp-1',
          phone_number: '+49171234567',
          current_state: 'awaiting_event_response',
          context_data: {},
          event_id: 'event-1',
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      ;(supabase.order as jest.Mock).mockResolvedValueOnce({
        data: mockConversations,
        error: null
      })

      const result = await ConversationManager.getActiveConversations()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('conv-1')
      expect(result[0].currentState).toBe('awaiting_event_response')
    })

    test('should handle errors when getting active conversations', async () => {
      ;(supabase.order as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Query failed' }
      })

      await expect(ConversationManager.getActiveConversations()).rejects.toThrow(
        'Failed to get active conversations'
      )
    })
  })
})