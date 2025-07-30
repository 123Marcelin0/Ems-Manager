// Unit tests for Employee Registration Workflow
import { EmployeeRegistrationWorkflow } from '../lib/employee-registration-workflow'
import { RegistrationValidator } from '../lib/registration-validator'
import { ConversationManager } from '../lib/conversation-manager'
import { smsService } from '../lib/sms-service'
import { supabase } from '../lib/supabase'

// Mock dependencies
jest.mock('../lib/registration-validator')
jest.mock('../lib/conversation-manager')
jest.mock('../lib/sms-service')
jest.mock('../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis()
  }
}))

const mockRegistrationValidator = RegistrationValidator as jest.Mocked<typeof RegistrationValidator>
const mockConversationManager = ConversationManager as jest.Mocked<typeof ConversationManager>
const mockSmsService = smsService as jest.Mocked<typeof smsService>

describe('EmployeeRegistrationWorkflow', () => {
  const mockConversation = {
    id: 'conv-123',
    phoneNumber: '+49171234567',
    currentState: 'idle' as const,
    contextData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('startRegistration', () => {
    test('should start registration successfully', async () => {
      // Mock successful validations
      mockRegistrationValidator.validatePhoneNumber.mockReturnValue({
        isValid: true,
        normalizedPhone: '+49171234567'
      })

      mockRegistrationValidator.checkPhoneNumberExists.mockResolvedValue({
        isValid: true,
        normalizedPhone: '+49171234567'
      })

      mockRegistrationValidator.validateRegistrationCode.mockReturnValue({
        isValid: true,
        code: 'emsland100'
      })

      mockRegistrationValidator.createRegistrationRequest.mockResolvedValue({
        success: true,
        requestId: 'req-123'
      })

      mockConversationManager.getOrCreateConversation.mockResolvedValue(mockConversation)
      mockConversationManager.updateConversationState.mockResolvedValue()

      const result = await EmployeeRegistrationWorkflow.startRegistration(
        '+49171234567',
        'emsland100'
      )

      expect(result.success).toBe(true)
      expect(result.state.phoneNumber).toBe('+49171234567')
      expect(result.state.currentStep).toBe('name_collection')
      expect(result.state.registrationCode).toBe('emsland100')
      expect(result.shouldSendMessage).toBe(true)
      expect(result.nextMessage).toContain('Willkommen')
    })

    test('should handle invalid phone number', async () => {
      mockRegistrationValidator.validatePhoneNumber.mockReturnValue({
        isValid: false,
        error: 'Ungültige Telefonnummer',
        errorType: 'INVALID_FORMAT'
      })

      const result = await EmployeeRegistrationWorkflow.startRegistration(
        'invalid-phone',
        'emsland100'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ungültige Telefonnummer')
    })

    test('should handle existing phone number', async () => {
      mockRegistrationValidator.validatePhoneNumber.mockReturnValue({
        isValid: true,
        normalizedPhone: '+49171234567'
      })

      mockRegistrationValidator.checkPhoneNumberExists.mockResolvedValue({
        isValid: false,
        error: 'Telefonnummer bereits registriert',
        errorType: 'ALREADY_EXISTS'
      })

      const result = await EmployeeRegistrationWorkflow.startRegistration(
        '+49171234567',
        'emsland100'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Telefonnummer bereits registriert')
    })

    test('should handle invalid registration code', async () => {
      mockRegistrationValidator.validatePhoneNumber.mockReturnValue({
        isValid: true,
        normalizedPhone: '+49171234567'
      })

      mockRegistrationValidator.checkPhoneNumberExists.mockResolvedValue({
        isValid: true,
        normalizedPhone: '+49171234567'
      })

      mockRegistrationValidator.validateRegistrationCode.mockReturnValue({
        isValid: false,
        error: 'Ungültiger Registrierungscode',
        errorType: 'INVALID_CODE'
      })

      const result = await EmployeeRegistrationWorkflow.startRegistration(
        '+49171234567',
        'invalid-code'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ungültiger Registrierungscode')
    })
  })

  describe('processNameSubmission', () => {
    test('should process name submission successfully', async () => {
      const mockRegistrationRequest = {
        id: 'req-123',
        phone_number: '+49171234567',
        registration_code: 'emsland100',
        status: 'pending'
      }

      mockConversationManager.getConversationById.mockResolvedValue(mockConversation)
      mockRegistrationValidator.validateEmployeeName.mockReturnValue({
        isValid: true,
        normalizedName: 'Max Mustermann'
      })

      mockRegistrationValidator.getRegistrationRequest.mockResolvedValue({
        success: true,
        request: mockRegistrationRequest
      })

      mockRegistrationValidator.updateRegistrationRequest.mockResolvedValue({
        success: true
      })

      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'emp-123',
        error: null
      })

      mockConversationManager.updateConversationState.mockResolvedValue()

      const result = await EmployeeRegistrationWorkflow.processNameSubmission(
        '+49171234567',
        'Max Mustermann',
        'conv-123'
      )

      expect(result.success).toBe(true)
      expect(result.state.employeeName).toBe('Max Mustermann')
      expect(result.state.employeeId).toBe('emp-123')
      expect(result.state.currentStep).toBe('completion')
      expect(result.nextMessage).toContain('Max Mustermann')
      expect(result.nextMessage).toContain('erfolgreich')
    })

    test('should handle invalid employee name', async () => {
      mockConversationManager.getConversationById.mockResolvedValue(mockConversation)
      mockRegistrationValidator.validateEmployeeName.mockReturnValue({
        isValid: false,
        error: 'Name muss mindestens 2 Zeichen lang sein'
      })

      const result = await EmployeeRegistrationWorkflow.processNameSubmission(
        '+49171234567',
        'X',
        'conv-123'
      )

      expect(result.success).toBe(false)
      expect(result.state.errors).toContain('Name muss mindestens 2 Zeichen lang sein')
      expect(result.nextMessage).toContain('Name muss mindestens 2 Zeichen lang sein')
    })

    test('should handle missing registration request', async () => {
      mockConversationManager.getConversationById.mockResolvedValue(mockConversation)
      mockRegistrationValidator.validateEmployeeName.mockReturnValue({
        isValid: true,
        normalizedName: 'Max Mustermann'
      })

      mockRegistrationValidator.getRegistrationRequest.mockResolvedValue({
        success: true,
        request: null
      })

      const result = await EmployeeRegistrationWorkflow.processNameSubmission(
        '+49171234567',
        'Max Mustermann',
        'conv-123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Registration request not found')
    })

    test('should handle employee creation failure', async () => {
      const mockRegistrationRequest = {
        id: 'req-123',
        phone_number: '+49171234567',
        registration_code: 'emsland100',
        status: 'pending'
      }

      mockConversationManager.getConversationById.mockResolvedValue(mockConversation)
      mockRegistrationValidator.validateEmployeeName.mockReturnValue({
        isValid: true,
        normalizedName: 'Max Mustermann'
      })

      mockRegistrationValidator.getRegistrationRequest.mockResolvedValue({
        success: true,
        request: mockRegistrationRequest
      })

      mockRegistrationValidator.updateRegistrationRequest.mockResolvedValue({
        success: true
      })

      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await EmployeeRegistrationWorkflow.processNameSubmission(
        '+49171234567',
        'Max Mustermann',
        'conv-123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('completeRegistration', () => {
    test('should complete registration successfully', async () => {
      mockRegistrationValidator.validateCompleteRegistration.mockResolvedValue({
        isValid: true,
        errors: [],
        normalizedData: {
          phoneNumber: '+49171234567',
          registrationCode: 'emsland100',
          employeeName: 'Max Mustermann'
        }
      })

      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: 'emp-123',
        error: null
      })

      const result = await EmployeeRegistrationWorkflow.completeRegistration(
        '+49171234567',
        'emsland100',
        'Max Mustermann'
      )

      expect(result.success).toBe(true)
      expect(result.state.employeeName).toBe('Max Mustermann')
      expect(result.state.employeeId).toBe('emp-123')
      expect(result.state.currentStep).toBe('completion')
      expect(result.nextMessage).toContain('Max Mustermann')
    })

    test('should handle validation errors', async () => {
      mockRegistrationValidator.validateCompleteRegistration.mockResolvedValue({
        isValid: false,
        errors: ['Ungültige Telefonnummer', 'Ungültiger Code']
      })

      const result = await EmployeeRegistrationWorkflow.completeRegistration(
        'invalid-phone',
        'invalid-code',
        'Max Mustermann'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Ungültige Telefonnummer')
      expect(result.error).toContain('Ungültiger Code')
    })
  })

  describe('getWorkflowState', () => {
    test('should get workflow state from conversation', async () => {
      const conversationWithContext = {
        ...mockConversation,
        currentState: 'registration_code_received' as const,
        contextData: {
          registrationCode: 'emsland100',
          employeeName: 'Max Mustermann',
          employeeId: 'emp-123',
          registrationCompleted: true
        }
      }

      mockConversationManager.getConversationById.mockResolvedValue(conversationWithContext)

      const state = await EmployeeRegistrationWorkflow.getWorkflowState(
        '+49171234567',
        'conv-123'
      )

      expect(state.phoneNumber).toBe('+49171234567')
      expect(state.registrationCode).toBe('emsland100')
      expect(state.employeeName).toBe('Max Mustermann')
      expect(state.employeeId).toBe('emp-123')
      expect(state.steps.code_validation.isComplete).toBe(true)
      expect(state.steps.name_collection.isComplete).toBe(true)
      expect(state.steps.employee_creation.isComplete).toBe(true)
      expect(state.steps.completion.isComplete).toBe(true)
    })

    test('should return initial state for missing conversation', async () => {
      mockConversationManager.getConversationById.mockResolvedValue(null)

      const state = await EmployeeRegistrationWorkflow.getWorkflowState(
        '+49171234567',
        'conv-123'
      )

      expect(state.phoneNumber).toBe('+49171234567')
      expect(state.currentStep).toBe('code_validation')
      expect(state.steps.code_validation.isComplete).toBe(false)
    })
  })

  describe('isRegistrationInProgress', () => {
    test('should return true for registration in progress', async () => {
      const registrationConversation = {
        ...mockConversation,
        currentState: 'registration_code_received' as const
      }

      mockConversationManager.getOrCreateConversation.mockResolvedValue(registrationConversation)

      const result = await EmployeeRegistrationWorkflow.isRegistrationInProgress('+49171234567')

      expect(result).toBe(true)
    })

    test('should return false for completed registration', async () => {
      const completedConversation = {
        ...mockConversation,
        currentState: 'completed' as const
      }

      mockConversationManager.getOrCreateConversation.mockResolvedValue(completedConversation)

      const result = await EmployeeRegistrationWorkflow.isRegistrationInProgress('+49171234567')

      expect(result).toBe(false)
    })
  })

  describe('cancelRegistration', () => {
    test('should cancel registration successfully', async () => {
      mockConversationManager.getOrCreateConversation.mockResolvedValue(mockConversation)
      mockConversationManager.updateConversationState.mockResolvedValue()
      ;(supabase.update as jest.Mock).mockResolvedValue({ data: null, error: null })

      const result = await EmployeeRegistrationWorkflow.cancelRegistration('+49171234567')

      expect(result.success).toBe(true)
      expect(mockConversationManager.updateConversationState).toHaveBeenCalledWith(
        'conv-123',
        'idle',
        expect.any(Object)
      )
    })

    test('should handle cancellation errors', async () => {
      mockConversationManager.getOrCreateConversation.mockRejectedValue(
        new Error('Database error')
      )

      const result = await EmployeeRegistrationWorkflow.cancelRegistration('+49171234567')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('getRegistrationStatistics', () => {
    test('should return registration statistics', async () => {
      const mockRequests = [
        { status: 'completed', created_at: new Date().toISOString() },
        { status: 'pending', created_at: new Date().toISOString() },
        { status: 'failed', created_at: new Date().toISOString() }
      ]

      ;(supabase.select as jest.Mock)
        .mockResolvedValueOnce({ data: mockRequests }) // All requests
        .mockResolvedValueOnce({ data: [{ id: '1' }] }) // Today requests
        .mockResolvedValueOnce({ data: [{ id: '1' }, { id: '2' }] }) // Week requests

      const stats = await EmployeeRegistrationWorkflow.getRegistrationStatistics()

      expect(stats.totalRequests).toBe(3)
      expect(stats.completedRegistrations).toBe(1)
      expect(stats.pendingRegistrations).toBe(1)
      expect(stats.failedRegistrations).toBe(1)
      expect(stats.registrationsToday).toBe(1)
      expect(stats.registrationsThisWeek).toBe(2)
    })

    test('should handle statistics errors gracefully', async () => {
      ;(supabase.select as jest.Mock).mockRejectedValue(new Error('Database error'))

      const stats = await EmployeeRegistrationWorkflow.getRegistrationStatistics()

      expect(stats.totalRequests).toBe(0)
      expect(stats.completedRegistrations).toBe(0)
    })
  })

  describe('sendRegistrationReminder', () => {
    test('should send reminder successfully', async () => {
      const mockRegistrationRequest = {
        id: 'req-123',
        registration_code: 'emsland100'
      }

      mockConversationManager.getOrCreateConversation.mockResolvedValue({
        ...mockConversation,
        currentState: 'registration_code_received' as const
      })

      mockRegistrationValidator.getRegistrationRequest.mockResolvedValue({
        success: true,
        request: mockRegistrationRequest
      })

      mockSmsService.sendMessage.mockResolvedValue({
        success: true,
        messageSid: 'SM123'
      })

      const result = await EmployeeRegistrationWorkflow.sendRegistrationReminder('+49171234567')

      expect(result.success).toBe(true)
      expect(mockSmsService.sendMessage).toHaveBeenCalledWith({
        to: '+49171234567',
        body: expect.stringContaining('emsland100'),
        messageType: 'registration_reminder'
      })
    })

    test('should handle no active registration', async () => {
      mockConversationManager.getOrCreateConversation.mockResolvedValue({
        ...mockConversation,
        currentState: 'idle' as const
      })

      const result = await EmployeeRegistrationWorkflow.sendRegistrationReminder('+49171234567')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Keine aktive Registrierung gefunden')
    })

    test('should handle SMS sending failure', async () => {
      const mockRegistrationRequest = {
        id: 'req-123',
        registration_code: 'emsland100'
      }

      mockConversationManager.getOrCreateConversation.mockResolvedValue({
        ...mockConversation,
        currentState: 'registration_code_received' as const
      })

      mockRegistrationValidator.getRegistrationRequest.mockResolvedValue({
        success: true,
        request: mockRegistrationRequest
      })

      mockSmsService.sendMessage.mockResolvedValue({
        success: false,
        error: 'SMS sending failed'
      })

      const result = await EmployeeRegistrationWorkflow.sendRegistrationReminder('+49171234567')

      expect(result.success).toBe(false)
      expect(result.error).toBe('SMS sending failed')
    })
  })
})