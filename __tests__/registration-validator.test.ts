// Unit tests for Registration Validator
import { RegistrationValidator } from '../lib/registration-validator'
import { supabase } from '../lib/supabase'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}))

describe('RegistrationValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateRegistrationCode', () => {
    test('should validate correct registration code', () => {
      const result = RegistrationValidator.validateRegistrationCode('Emsland100')
      
      expect(result.isValid).toBe(true)
      expect(result.code).toBe('emsland100')
      expect(result.error).toBeUndefined()
    })

    test('should handle case insensitive codes', () => {
      const result = RegistrationValidator.validateRegistrationCode('EMSLAND100')
      
      expect(result.isValid).toBe(true)
      expect(result.code).toBe('emsland100')
    })

    test('should trim whitespace from codes', () => {
      const result = RegistrationValidator.validateRegistrationCode('  emsland100  ')
      
      expect(result.isValid).toBe(true)
      expect(result.code).toBe('emsland100')
    })

    test('should reject invalid registration code', () => {
      const result = RegistrationValidator.validateRegistrationCode('invalid123')
      
      expect(result.isValid).toBe(false)
      expect(result.errorType).toBe('INVALID_CODE')
      expect(result.error).toContain('Ungültiger Registrierungscode')
    })

    test('should handle codes with usage limits', () => {
      const result = RegistrationValidator.validateRegistrationCode('emsland2024')
      
      expect(result.isValid).toBe(true)
      expect(result.remainingUses).toBe(50)
    })

    test('should handle unlimited usage codes', () => {
      const result = RegistrationValidator.validateRegistrationCode('emsland100')
      
      expect(result.isValid).toBe(true)
      expect(result.remainingUses).toBeUndefined()
    })
  })

  describe('validatePhoneNumber', () => {
    test('should validate German mobile number', () => {
      const result = RegistrationValidator.validatePhoneNumber('+49171234567')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+49171234567')
    })

    test('should convert German national format to international', () => {
      const result = RegistrationValidator.validatePhoneNumber('0171234567')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+49171234567')
    })

    test('should handle number without country code', () => {
      const result = RegistrationValidator.validatePhoneNumber('171234567')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+49171234567')
    })

    test('should handle formatted numbers', () => {
      const result = RegistrationValidator.validatePhoneNumber('0171 234 567')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+49171234567')
    })

    test('should reject invalid phone number format', () => {
      const result = RegistrationValidator.validatePhoneNumber('123456')
      
      expect(result.isValid).toBe(false)
      expect(result.errorType).toBe('INVALID_FORMAT')
    })

    test('should reject blocked premium numbers', () => {
      const result = RegistrationValidator.validatePhoneNumber('+49900123456')
      
      expect(result.isValid).toBe(false)
      expect(result.errorType).toBe('BLOCKED')
    })

    test('should validate German landline numbers', () => {
      const result = RegistrationValidator.validatePhoneNumber('+4930123456789')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+4930123456789')
    })
  })

  describe('checkPhoneNumberExists', () => {
    test('should return valid for non-existing phone number', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      })

      const result = await RegistrationValidator.checkPhoneNumberExists('+49171234567')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedPhone).toBe('+49171234567')
    })

    test('should return invalid for existing phone number', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'emp-123', name: 'Max Mustermann', phone_number: '+49171234567' },
        error: null
      })

      const result = await RegistrationValidator.checkPhoneNumberExists('+49171234567')
      
      expect(result.isValid).toBe(false)
      expect(result.errorType).toBe('ALREADY_EXISTS')
      expect(result.error).toContain('Max Mustermann')
    })

    test('should handle database errors', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', message: 'Database error' }
      })

      const result = await RegistrationValidator.checkPhoneNumberExists('+49171234567')
      
      expect(result.isValid).toBe(false)
      expect(result.errorType).toBe('SYSTEM_ERROR')
    })
  })

  describe('validateEmployeeName', () => {
    test('should validate correct employee name', () => {
      const result = RegistrationValidator.validateEmployeeName('Max Mustermann')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe('Max Mustermann')
    })

    test('should handle names with umlauts', () => {
      const result = RegistrationValidator.validateEmployeeName('Jürgen Müller')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe('Jürgen Müller')
    })

    test('should handle names with hyphens', () => {
      const result = RegistrationValidator.validateEmployeeName('Anna-Maria Schmidt')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe('Anna-Maria Schmidt')
    })

    test('should normalize case', () => {
      const result = RegistrationValidator.validateEmployeeName('max mustermann')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe('Max Mustermann')
    })

    test('should trim whitespace', () => {
      const result = RegistrationValidator.validateEmployeeName('  Max Mustermann  ')
      
      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe('Max Mustermann')
    })

    test('should reject single name', () => {
      const result = RegistrationValidator.validateEmployeeName('Max')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Vor- und Nachname')
    })

    test('should reject too short name', () => {
      const result = RegistrationValidator.validateEmployeeName('A')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('mindestens 2 Zeichen')
    })

    test('should reject too long name', () => {
      const longName = 'A'.repeat(101)
      const result = RegistrationValidator.validateEmployeeName(longName)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('maximal 100 Zeichen')
    })

    test('should reject names with invalid characters', () => {
      const result = RegistrationValidator.validateEmployeeName('Max123 Mustermann')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('ungültige Zeichen')
    })
  })

  describe('validateCompleteRegistration', () => {
    beforeEach(() => {
      // Mock phone number check to return valid (not exists)
      ;(supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })
    })

    test('should validate complete registration data', async () => {
      const result = await RegistrationValidator.validateCompleteRegistration(
        '+49171234567',
        'emsland100',
        'Max Mustermann'
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.normalizedData?.phoneNumber).toBe('+49171234567')
      expect(result.normalizedData?.registrationCode).toBe('emsland100')
      expect(result.normalizedData?.employeeName).toBe('Max Mustermann')
    })

    test('should validate registration without name', async () => {
      const result = await RegistrationValidator.validateCompleteRegistration(
        '+49171234567',
        'emsland100'
      )
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.normalizedData?.employeeName).toBeUndefined()
    })

    test('should collect multiple validation errors', async () => {
      const result = await RegistrationValidator.validateCompleteRegistration(
        'invalid-phone',
        'invalid-code',
        'X'
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.normalizedData).toBeUndefined()
    })

    test('should handle existing phone number', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'emp-123', name: 'Existing User' },
        error: null
      })

      const result = await RegistrationValidator.validateCompleteRegistration(
        '+49171234567',
        'emsland100',
        'Max Mustermann'
      )
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('bereits registriert'))).toBe(true)
    })
  })

  describe('createRegistrationRequest', () => {
    test('should create registration request successfully', async () => {
      // Mock validation to pass
      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Phone check
        .mockResolvedValueOnce({ data: { id: 'req-123' }, error: null }) // Insert

      const result = await RegistrationValidator.createRegistrationRequest(
        '+49171234567',
        'emsland100',
        'Max Mustermann'
      )
      
      expect(result.success).toBe(true)
      expect(result.requestId).toBe('req-123')
      expect(result.error).toBeUndefined()
    })

    test('should handle validation errors', async () => {
      const result = await RegistrationValidator.createRegistrationRequest(
        'invalid-phone',
        'invalid-code'
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.requestId).toBeUndefined()
    })

    test('should handle database errors', async () => {
      ;(supabase.single as jest.Mock)
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Phone check
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } }) // Insert

      const result = await RegistrationValidator.createRegistrationRequest(
        '+49171234567',
        'emsland100',
        'Max Mustermann'
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('getRegistrationRequest', () => {
    test('should get existing registration request', async () => {
      const mockRequest = {
        id: 'req-123',
        phone_number: '+49171234567',
        registration_code: 'emsland100',
        status: 'pending'
      }

      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: mockRequest,
        error: null
      })

      const result = await RegistrationValidator.getRegistrationRequest('+49171234567')
      
      expect(result.success).toBe(true)
      expect(result.request).toEqual(mockRequest)
    })

    test('should handle non-existing request', async () => {
      ;(supabase.single as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await RegistrationValidator.getRegistrationRequest('+49171234567')
      
      expect(result.success).toBe(true)
      expect(result.request).toBeNull()
    })
  })

  describe('updateRegistrationRequest', () => {
    test('should update registration request successfully', async () => {
      ;(supabase.update as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await RegistrationValidator.updateRegistrationRequest(
        '+49171234567',
        'Max Mustermann'
      )
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should validate name before updating', async () => {
      const result = await RegistrationValidator.updateRegistrationRequest(
        '+49171234567',
        'X' // Invalid name
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('mindestens 2 Zeichen')
    })
  })

  describe('getRegistrationStats', () => {
    test('should return registration statistics', () => {
      const stats = RegistrationValidator.getRegistrationStats()
      
      expect(stats.totalCodes).toBeGreaterThan(0)
      expect(stats.activeCodes).toBeGreaterThanOrEqual(0)
      expect(stats.expiredCodes).toBeGreaterThanOrEqual(0)
      expect(stats.totalUses).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(stats.codesNearLimit)).toBe(true)
    })
  })

  describe('cleanupExpiredRequests', () => {
    test('should cleanup expired requests successfully', async () => {
      ;(supabase.select as jest.Mock).mockResolvedValueOnce({
        data: [{ id: 'req-1' }, { id: 'req-2' }],
        error: null
      })

      const result = await RegistrationValidator.cleanupExpiredRequests()
      
      expect(result.success).toBe(true)
      expect(result.deletedCount).toBe(2)
    })

    test('should handle cleanup errors', async () => {
      ;(supabase.select as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Delete failed' }
      })

      const result = await RegistrationValidator.cleanupExpiredRequests()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Delete failed')
    })
  })

  describe('Code Management', () => {
    test('should add new registration code', () => {
      const result = RegistrationValidator.addRegistrationCode('newcode123', {
        maxUses: 100,
        description: 'Test code'
      })
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject duplicate code', () => {
      const result = RegistrationValidator.addRegistrationCode('emsland100')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('existiert bereits')
    })

    test('should deactivate registration code', () => {
      const result = RegistrationValidator.deactivateRegistrationCode('emsland100')
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should handle deactivating non-existent code', () => {
      const result = RegistrationValidator.deactivateRegistrationCode('nonexistent')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('nicht gefunden')
    })
  })
})