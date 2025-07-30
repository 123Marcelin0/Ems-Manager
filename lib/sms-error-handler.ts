// SMS Error Handling Utilities
export enum SMSErrorType {
  TWILIO_API_ERROR = 'TWILIO_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PHONE_NUMBER_ERROR = 'PHONE_NUMBER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SMSError {
  type: SMSErrorType
  message: string
  originalError?: any
  shouldRetry: boolean
  retryAfter?: number
  fallbackAction?: string
  userMessage?: string
  logLevel: 'info' | 'warn' | 'error' | 'critical'
}

export class SMSErrorHandler {
  static handleTwilioError(error: any): SMSError {
    const twilioError = error as any
    
    // Handle specific Twilio error codes
    switch (twilioError.code) {
      case 21211: // Invalid phone number
        return {
          type: SMSErrorType.PHONE_NUMBER_ERROR,
          message: 'Invalid phone number format',
          originalError: error,
          shouldRetry: false,
          userMessage: 'Die Telefonnummer ist ungültig. Bitte überprüfen Sie das Format.',
          logLevel: 'warn'
        }
      
      case 21614: // Phone number not mobile
        return {
          type: SMSErrorType.PHONE_NUMBER_ERROR,
          message: 'Phone number is not a mobile number',
          originalError: error,
          shouldRetry: false,
          userMessage: 'SMS können nur an Mobilfunknummern gesendet werden.',
          logLevel: 'warn'
        }
      
      case 20003: // Authentication error
        return {
          type: SMSErrorType.CONFIGURATION_ERROR,
          message: 'Twilio authentication failed',
          originalError: error,
          shouldRetry: false,
          fallbackAction: 'check_credentials',
          logLevel: 'critical'
        }
      
      case 20429: // Rate limit exceeded
        return {
          type: SMSErrorType.RATE_LIMIT_ERROR,
          message: 'Rate limit exceeded',
          originalError: error,
          shouldRetry: true,
          retryAfter: 60, // 1 minute
          logLevel: 'warn'
        }
      
      case 21610: // Message blocked
        return {
          type: SMSErrorType.TWILIO_API_ERROR,
          message: 'Message was blocked',
          originalError: error,
          shouldRetry: false,
          userMessage: 'Nachricht konnte nicht zugestellt werden.',
          logLevel: 'warn'
        }
      
      default:
        return {
          type: SMSErrorType.TWILIO_API_ERROR,
          message: twilioError.message || 'Twilio API error',
          originalError: error,
          shouldRetry: this.shouldRetryTwilioError(twilioError.code),
          retryAfter: this.getRetryDelay(twilioError.code),
          logLevel: 'error'
        }
    }
  }

  static handleDatabaseError(error: any): SMSError {
    const dbError = error as any
    
    // Handle Supabase/PostgreSQL errors
    if (dbError.code) {
      switch (dbError.code) {
        case '23505': // Unique constraint violation
          return {
            type: SMSErrorType.DATABASE_ERROR,
            message: 'Duplicate record',
            originalError: error,
            shouldRetry: false,
            logLevel: 'warn'
          }
        
        case '23503': // Foreign key constraint violation
          return {
            type: SMSErrorType.DATABASE_ERROR,
            message: 'Referenced record not found',
            originalError: error,
            shouldRetry: false,
            logLevel: 'error'
          }
        
        case '08006': // Connection failure
          return {
            type: SMSErrorType.DATABASE_ERROR,
            message: 'Database connection failed',
            originalError: error,
            shouldRetry: true,
            retryAfter: 5,
            logLevel: 'error'
          }
        
        default:
          return {
            type: SMSErrorType.DATABASE_ERROR,
            message: dbError.message || 'Database error',
            originalError: error,
            shouldRetry: false,
            logLevel: 'error'
          }
      }
    }
    
    return {
      type: SMSErrorType.DATABASE_ERROR,
      message: error.message || 'Unknown database error',
      originalError: error,
      shouldRetry: false,
      logLevel: 'error'
    }
  }

  static handleValidationError(message: string, field?: string): SMSError {
    return {
      type: SMSErrorType.VALIDATION_ERROR,
      message: `Validation error: ${message}`,
      shouldRetry: false,
      userMessage: field ? `Fehler bei ${field}: ${message}` : message,
      logLevel: 'warn'
    }
  }

  static handleConfigurationError(message: string): SMSError {
    return {
      type: SMSErrorType.CONFIGURATION_ERROR,
      message: `Configuration error: ${message}`,
      shouldRetry: false,
      fallbackAction: 'check_configuration',
      logLevel: 'critical'
    }
  }

  static handleUnknownError(error: any): SMSError {
    return {
      type: SMSErrorType.UNKNOWN_ERROR,
      message: error?.message || 'Unknown error occurred',
      originalError: error,
      shouldRetry: false,
      logLevel: 'error'
    }
  }

  static classifyError(error: any): SMSError {
    // Check if it's already an SMSError
    if (error.type && Object.values(SMSErrorType).includes(error.type)) {
      return error as SMSError
    }

    // Classify based on error properties
    if (error.code && typeof error.code === 'number') {
      // Likely a Twilio error
      return this.handleTwilioError(error)
    }

    if (error.code && typeof error.code === 'string') {
      // Likely a database error
      return this.handleDatabaseError(error)
    }

    if (error.message && error.message.includes('validation')) {
      return this.handleValidationError(error.message)
    }

    if (error.message && error.message.includes('configuration')) {
      return this.handleConfigurationError(error.message)
    }

    return this.handleUnknownError(error)
  }

  private static shouldRetryTwilioError(code: number): boolean {
    const retryableCodes = [
      20429, // Rate limit
      20500, // Internal server error
      20503, // Service unavailable
      21622, // Message delivery failed (temporary)
    ]
    return retryableCodes.includes(code)
  }

  private static getRetryDelay(code: number): number {
    switch (code) {
      case 20429: // Rate limit
        return 60 // 1 minute
      case 20500: // Internal server error
        return 30 // 30 seconds
      case 20503: // Service unavailable
        return 120 // 2 minutes
      default:
        return 10 // 10 seconds default
    }
  }
}

// Retry logic with exponential backoff
export class SMSRetryHandler {
  private static readonly MAX_RETRIES = 3
  private static readonly BASE_DELAY = 1000 // 1 second

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const smsError = SMSErrorHandler.classifyError(error)
        
        // Don't retry if error is not retryable
        if (!smsError.shouldRetry || attempt === maxRetries) {
          throw smsError
        }
        
        // Calculate delay with exponential backoff
        const delay = smsError.retryAfter 
          ? smsError.retryAfter * 1000 
          : this.BASE_DELAY * Math.pow(2, attempt)
        
        console.log(`⏳ Retrying SMS operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await this.sleep(delay)
      }
    }
    
    throw SMSErrorHandler.classifyError(lastError)
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Circuit breaker pattern for SMS service
export class SMSCircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 60000 // 1 minute
  private readonly successThreshold = 2

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
        console.log('🔄 SMS Circuit breaker moving to HALF_OPEN state')
      } else {
        throw SMSErrorHandler.handleConfigurationError('SMS service temporarily unavailable (circuit breaker open)')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      console.log('✅ SMS Circuit breaker closed - service recovered')
    }
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      console.log('🚨 SMS Circuit breaker opened - service degraded')
    }
  }

  getState(): string {
    return this.state
  }

  getFailureCount(): number {
    return this.failures
  }

  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
    console.log('🔄 SMS Circuit breaker reset')
  }
}

// Export singleton circuit breaker
export const smsCircuitBreaker = new SMSCircuitBreaker()