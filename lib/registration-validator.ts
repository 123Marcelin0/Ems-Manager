// Registration Code Validator for SMS Integration
// Handles validation of registration codes and phone numbers for employee self-registration

import { supabase } from './supabase'

export interface RegistrationCode {
  code: string
  isActive: boolean
  maxUses?: number
  currentUses: number
  expiresAt?: Date
  createdAt: Date
  description?: string
}

export interface ValidationResult {
  isValid: boolean
  code?: string
  error?: string
  errorType?: 'INVALID_CODE' | 'EXPIRED_CODE' | 'MAX_USES_EXCEEDED' | 'PHONE_EXISTS' | 'INVALID_PHONE' | 'SYSTEM_ERROR'
  remainingUses?: number
}

export interface PhoneValidationResult {
  isValid: boolean
  normalizedPhone?: string
  error?: string
  errorType?: 'INVALID_FORMAT' | 'ALREADY_EXISTS' | 'BLOCKED' | 'SYSTEM_ERROR'
}

export interface RegistrationRequest {
  phoneNumber: string
  registrationCode: string
  employeeName?: string
  timestamp: Date
}

export class RegistrationValidator {
  // Valid registration codes (in production, these would be in database)
  private static readonly VALID_CODES: Record<string, RegistrationCode> = {
    'emsland100': {
      code: 'emsland100',
      isActive: true,
      maxUses: undefined, // Unlimited
      currentUses: 0,
      createdAt: new Date('2024-01-01'),
      description: 'Main employee registration code'
    },
    'emsland2024': {
      code: 'emsland2024',
      isActive: true,
      maxUses: 50,
      currentUses: 0,
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      description: 'Limited time registration code for 2024'
    },
    'temp123': {
      code: 'temp123',
      isActive: true,
      maxUses: 10,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(),
      description: 'Temporary registration code'
    }
  }

  // Blocked phone number patterns (for security)
  private static readonly BLOCKED_PATTERNS = [
    /^\+49900/, // Premium rate numbers
    /^\+49137/, // Mass traffic numbers
    /^\+49180[1-9]/, // Service numbers
  ]

  // Validate registration code
  static validateRegistrationCode(code: string): ValidationResult {
    try {
      // Normalize code
      const normalizedCode = code.toLowerCase().trim()
      
      // Check if code exists
      const registrationCode = this.VALID_CODES[normalizedCode]
      if (!registrationCode) {
        return {
          isValid: false,
          error: 'Ungültiger Registrierungscode',
          errorType: 'INVALID_CODE'
        }
      }

      // Check if code is active
      if (!registrationCode.isActive) {
        return {
          isValid: false,
          error: 'Registrierungscode ist deaktiviert',
          errorType: 'INVALID_CODE'
        }
      }

      // Check expiration
      if (registrationCode.expiresAt && registrationCode.expiresAt < new Date()) {
        return {
          isValid: false,
          error: 'Registrierungscode ist abgelaufen',
          errorType: 'EXPIRED_CODE'
        }
      }

      // Check usage limits
      if (registrationCode.maxUses && registrationCode.currentUses >= registrationCode.maxUses) {
        return {
          isValid: false,
          error: 'Registrierungscode hat maximale Nutzung erreicht',
          errorType: 'MAX_USES_EXCEEDED'
        }
      }

      // Calculate remaining uses
      const remainingUses = registrationCode.maxUses 
        ? registrationCode.maxUses - registrationCode.currentUses
        : undefined

      return {
        isValid: true,
        code: normalizedCode,
        remainingUses
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Systemfehler bei der Code-Validierung',
        errorType: 'SYSTEM_ERROR'
      }
    }
  }

  // Validate and normalize phone number
  static validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
    try {
      // Remove all non-digit characters except +
      let normalized = phoneNumber.replace(/[^\d+]/g, '')
      
      // Handle German phone number formats
      if (normalized.startsWith('0')) {
        // Convert German national format to international
        normalized = '+49' + normalized.substring(1)
      } else if (normalized.startsWith('49') && !normalized.startsWith('+')) {
        // Add + to international format without +
        normalized = '+' + normalized
      } else if (!normalized.startsWith('+')) {
        // Assume German number if no country code
        normalized = '+49' + normalized
      }

      // Validate format (German mobile numbers)
      const germanMobilePattern = /^\+49(15[0-9]|16[0-9]|17[0-9])\d{7,8}$/
      const germanLandlinePattern = /^\+49[2-9]\d{7,11}$/
      
      if (!germanMobilePattern.test(normalized) && !germanLandlinePattern.test(normalized)) {
        return {
          isValid: false,
          error: 'Ungültiges Telefonnummer-Format. Bitte deutsche Mobilfunknummer verwenden.',
          errorType: 'INVALID_FORMAT'
        }
      }

      // Check against blocked patterns
      for (const pattern of this.BLOCKED_PATTERNS) {
        if (pattern.test(normalized)) {
          return {
            isValid: false,
            error: 'Diese Telefonnummer kann nicht für die Registrierung verwendet werden.',
            errorType: 'BLOCKED'
          }
        }
      }

      return {
        isValid: true,
        normalizedPhone: normalized
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Systemfehler bei der Telefonnummer-Validierung',
        errorType: 'SYSTEM_ERROR'
      }
    }
  }

  // Check if phone number already exists
  static async checkPhoneNumberExists(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      const { data: existingEmployee, error } = await supabase
        .from('employees')
        .select('id, name, phone_number')
        .eq('phone_number', phoneNumber)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error
      }

      if (existingEmployee) {
        return {
          isValid: false,
          error: `Telefonnummer ist bereits registriert für ${existingEmployee.name}`,
          errorType: 'ALREADY_EXISTS'
        }
      }

      return {
        isValid: true,
        normalizedPhone: phoneNumber
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Systemfehler bei der Telefonnummer-Prüfung',
        errorType: 'SYSTEM_ERROR'
      }
    }
  }

  // Validate employee name
  static validateEmployeeName(name: string): { isValid: boolean; error?: string; normalizedName?: string } {
    try {
      const trimmedName = name.trim()
      
      // Check minimum length
      if (trimmedName.length < 2) {
        return {
          isValid: false,
          error: 'Name muss mindestens 2 Zeichen lang sein'
        }
      }

      // Check maximum length
      if (trimmedName.length > 100) {
        return {
          isValid: false,
          error: 'Name darf maximal 100 Zeichen lang sein'
        }
      }

      // Check for valid characters (letters, spaces, hyphens, apostrophes)
      const namePattern = /^[a-zA-ZäöüÄÖÜß\s\-'\.]+$/
      if (!namePattern.test(trimmedName)) {
        return {
          isValid: false,
          error: 'Name enthält ungültige Zeichen'
        }
      }

      // Check for at least first and last name
      const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0)
      if (nameParts.length < 2) {
        return {
          isValid: false,
          error: 'Bitte Vor- und Nachname eingeben'
        }
      }

      // Normalize name (proper case)
      const normalizedName = nameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')

      return {
        isValid: true,
        normalizedName
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Systemfehler bei der Namen-Validierung'
      }
    }
  }

  // Complete registration validation
  static async validateCompleteRegistration(
    phoneNumber: string,
    registrationCode: string,
    employeeName?: string
  ): Promise<{
    isValid: boolean
    errors: string[]
    normalizedData?: {
      phoneNumber: string
      registrationCode: string
      employeeName?: string
    }
  }> {
    const errors: string[] = []
    const normalizedData: any = {}

    try {
      // Validate registration code
      const codeValidation = this.validateRegistrationCode(registrationCode)
      if (!codeValidation.isValid) {
        errors.push(codeValidation.error || 'Ungültiger Registrierungscode')
      } else {
        normalizedData.registrationCode = codeValidation.code
      }

      // Validate phone number format
      const phoneValidation = this.validatePhoneNumber(phoneNumber)
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation.error || 'Ungültige Telefonnummer')
      } else {
        normalizedData.phoneNumber = phoneValidation.normalizedPhone

        // Check if phone number already exists
        const existsValidation = await this.checkPhoneNumberExists(phoneValidation.normalizedPhone!)
        if (!existsValidation.isValid) {
          errors.push(existsValidation.error || 'Telefonnummer bereits registriert')
        }
      }

      // Validate employee name if provided
      if (employeeName) {
        const nameValidation = this.validateEmployeeName(employeeName)
        if (!nameValidation.isValid) {
          errors.push(nameValidation.error || 'Ungültiger Name')
        } else {
          normalizedData.employeeName = nameValidation.normalizedName
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        normalizedData: errors.length === 0 ? normalizedData : undefined
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Systemfehler bei der Registrierungs-Validierung']
      }
    }
  }

  // Create registration request record
  static async createRegistrationRequest(
    phoneNumber: string,
    registrationCode: string,
    employeeName?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Validate the registration data first
      const validation = await this.validateCompleteRegistration(phoneNumber, registrationCode, employeeName)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      // Create registration request record
      const { data, error } = await supabase
        .from('employee_registration_requests')
        .insert({
          phone_number: validation.normalizedData!.phoneNumber,
          registration_code: validation.normalizedData!.registrationCode,
          employee_name: validation.normalizedData!.employeeName,
          status: employeeName ? 'completed' : 'pending'
        })
        .select('id')
        .single()

      if (error) throw error

      // Increment code usage count (in production, this would be in database)
      const codeData = this.VALID_CODES[validation.normalizedData!.registrationCode]
      if (codeData) {
        codeData.currentUses++
      }

      return {
        success: true,
        requestId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Get registration request by phone number
  static async getRegistrationRequest(phoneNumber: string): Promise<{
    success: boolean
    request?: any
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_registration_requests')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return {
        success: true,
        request: data || null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Update registration request with employee name
  static async updateRegistrationRequest(
    phoneNumber: string,
    employeeName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate employee name
      const nameValidation = this.validateEmployeeName(employeeName)
      if (!nameValidation.isValid) {
        return {
          success: false,
          error: nameValidation.error
        }
      }

      // Update the registration request
      const { error } = await supabase
        .from('employee_registration_requests')
        .update({
          employee_name: nameValidation.normalizedName,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('phone_number', phoneNumber)
        .eq('status', 'pending')

      if (error) throw error

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Get registration statistics
  static getRegistrationStats(): {
    totalCodes: number
    activeCodes: number
    expiredCodes: number
    totalUses: number
    codesNearLimit: Array<{ code: string; remainingUses: number }>
  } {
    const codes = Object.values(this.VALID_CODES)
    const now = new Date()
    
    const stats = {
      totalCodes: codes.length,
      activeCodes: codes.filter(c => c.isActive && (!c.expiresAt || c.expiresAt > now)).length,
      expiredCodes: codes.filter(c => c.expiresAt && c.expiresAt <= now).length,
      totalUses: codes.reduce((sum, c) => sum + c.currentUses, 0),
      codesNearLimit: codes
        .filter(c => c.maxUses && c.currentUses >= c.maxUses * 0.8)
        .map(c => ({
          code: c.code,
          remainingUses: c.maxUses! - c.currentUses
        }))
    }

    return stats
  }

  // Clean up expired registration requests
  static async cleanupExpiredRequests(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      // Delete requests older than 24 hours that are still pending
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('employee_registration_requests')
        .delete()
        .lt('created_at', cutoffTime)
        .eq('status', 'pending')
        .select('id')

      if (error) throw error

      return {
        success: true,
        deletedCount: data?.length || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Add new registration code (for admin use)
  static addRegistrationCode(
    code: string,
    options: {
      maxUses?: number
      expiresAt?: Date
      description?: string
    } = {}
  ): { success: boolean; error?: string } {
    try {
      const normalizedCode = code.toLowerCase().trim()
      
      // Check if code already exists
      if (this.VALID_CODES[normalizedCode]) {
        return {
          success: false,
          error: 'Registrierungscode existiert bereits'
        }
      }

      // Add new code
      this.VALID_CODES[normalizedCode] = {
        code: normalizedCode,
        isActive: true,
        maxUses: options.maxUses,
        currentUses: 0,
        expiresAt: options.expiresAt,
        createdAt: new Date(),
        description: options.description
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Fehler beim Hinzufügen des Codes'
      }
    }
  }

  // Deactivate registration code
  static deactivateRegistrationCode(code: string): { success: boolean; error?: string } {
    try {
      const normalizedCode = code.toLowerCase().trim()
      const registrationCode = this.VALID_CODES[normalizedCode]
      
      if (!registrationCode) {
        return {
          success: false,
          error: 'Registrierungscode nicht gefunden'
        }
      }

      registrationCode.isActive = false
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Fehler beim Deaktivieren des Codes'
      }
    }
  }
}