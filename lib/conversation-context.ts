// Conversation Context Handler for SMS Integration
// Manages context data storage, retrieval, and validation for SMS conversations

export interface ConversationContext {
  // Registration context
  registrationCode?: string
  registrationStep?: 'code_received' | 'awaiting_name' | 'completed'
  employeeName?: string
  employeeId?: string
  registrationCompleted?: boolean
  
  // Event context
  eventId?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  notificationSent?: boolean
  eventResponse?: 'accept' | 'decline' | 'request_time' | 'question'
  responseProcessed?: boolean
  timeRequestDeadline?: string
  
  // Schedule modification context
  scheduleModification?: {
    type: 'start_time' | 'end_time' | 'duration' | 'general'
    originalTime?: string
    requestedTime?: string
    reason?: string
    processed?: boolean
  }
  
  // Information request context
  informationRequests?: Array<{
    type: 'location' | 'equipment' | 'contact' | 'general'
    question: string
    answered: boolean
    timestamp: string
  }>
  lastInfoRequest?: string
  informationProvided?: boolean
  
  // Emergency context
  emergencyType?: 'late' | 'sick' | 'injury' | 'cancellation'
  emergencyDetails?: {
    delayMinutes?: string
    reason?: string
    severity?: 'low' | 'medium' | 'high'
    requiresFollowup?: boolean
  }
  emergencyHandled?: boolean
  
  // Overtime context
  overtimeRequest?: {
    additionalHours: number
    hourlyRate: number
    requestSent: boolean
    response?: 'accept' | 'decline'
    processed?: boolean
  }
  overtimeProcessed?: boolean
  
  // Contact update context
  contactUpdates?: Array<{
    type: 'phone_number' | 'availability' | 'preferences'
    oldValue?: string
    newValue?: string
    timestamp: string
    processed: boolean
  }>
  
  // Conversation metadata
  conversationStarted?: string
  lastActivity?: string
  messageCount?: number
  errorCount?: number
  retryCount?: number
  
  // Temporary data (cleared after use)
  tempData?: Record<string, any>
  
  // Custom data for extensions
  customData?: Record<string, any>
}

export interface ContextValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedContext?: ConversationContext
}

export interface ContextQuery {
  key: string
  defaultValue?: any
  required?: boolean
}

export class ConversationContextHandler {
  // Create new context
  static createContext(initialData?: Partial<ConversationContext>): ConversationContext {
    const now = new Date().toISOString()
    
    return {
      conversationStarted: now,
      lastActivity: now,
      messageCount: 0,
      errorCount: 0,
      retryCount: 0,
      informationRequests: [],
      contactUpdates: [],
      ...initialData
    }
  }

  // Update context with new data
  static updateContext(
    currentContext: ConversationContext,
    updates: Partial<ConversationContext>
  ): ConversationContext {
    const updatedContext = {
      ...currentContext,
      ...updates,
      lastActivity: new Date().toISOString()
    }

    // Increment message count if not explicitly set
    if (!updates.hasOwnProperty('messageCount')) {
      updatedContext.messageCount = (currentContext.messageCount || 0) + 1
    }

    return updatedContext
  }

  // Get context value with default
  static getContextValue<T>(
    context: ConversationContext,
    key: keyof ConversationContext,
    defaultValue?: T
  ): T {
    const value = context[key] as T
    return value !== undefined ? value : (defaultValue as T)
  }

  // Set context value
  static setContextValue(
    context: ConversationContext,
    key: keyof ConversationContext,
    value: any
  ): ConversationContext {
    return this.updateContext(context, { [key]: value })
  }

  // Add information request to context
  static addInformationRequest(
    context: ConversationContext,
    type: 'location' | 'equipment' | 'contact' | 'general',
    question: string
  ): ConversationContext {
    const requests = context.informationRequests || []
    const newRequest = {
      type,
      question,
      answered: false,
      timestamp: new Date().toISOString()
    }

    return this.updateContext(context, {
      informationRequests: [...requests, newRequest],
      lastInfoRequest: type
    })
  }

  // Mark information request as answered
  static markInformationRequestAnswered(
    context: ConversationContext,
    type: string
  ): ConversationContext {
    const requests = context.informationRequests || []
    const updatedRequests = requests.map(req =>
      req.type === type && !req.answered
        ? { ...req, answered: true }
        : req
    )

    return this.updateContext(context, {
      informationRequests: updatedRequests,
      informationProvided: true
    })
  }

  // Add contact update to context
  static addContactUpdate(
    context: ConversationContext,
    type: 'phone_number' | 'availability' | 'preferences',
    oldValue: string,
    newValue: string
  ): ConversationContext {
    const updates = context.contactUpdates || []
    const newUpdate = {
      type,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      processed: false
    }

    return this.updateContext(context, {
      contactUpdates: [...updates, newUpdate]
    })
  }

  // Set schedule modification context
  static setScheduleModification(
    context: ConversationContext,
    modification: {
      type: 'start_time' | 'end_time' | 'duration' | 'general'
      originalTime?: string
      requestedTime?: string
      reason?: string
    }
  ): ConversationContext {
    return this.updateContext(context, {
      scheduleModification: {
        ...modification,
        processed: false
      }
    })
  }

  // Set emergency context
  static setEmergencyContext(
    context: ConversationContext,
    emergencyType: 'late' | 'sick' | 'injury' | 'cancellation',
    details: {
      delayMinutes?: string
      reason?: string
      severity?: 'low' | 'medium' | 'high'
      requiresFollowup?: boolean
    }
  ): ConversationContext {
    return this.updateContext(context, {
      emergencyType,
      emergencyDetails: details,
      emergencyHandled: false
    })
  }

  // Set overtime context
  static setOvertimeContext(
    context: ConversationContext,
    additionalHours: number,
    hourlyRate: number
  ): ConversationContext {
    return this.updateContext(context, {
      overtimeRequest: {
        additionalHours,
        hourlyRate,
        requestSent: true,
        processed: false
      }
    })
  }

  // Set event context
  static setEventContext(
    context: ConversationContext,
    eventId: string,
    eventDetails?: {
      title?: string
      date?: string
      location?: string
    }
  ): ConversationContext {
    return this.updateContext(context, {
      eventId,
      eventTitle: eventDetails?.title,
      eventDate: eventDetails?.date,
      eventLocation: eventDetails?.location,
      notificationSent: false,
      responseProcessed: false
    })
  }

  // Increment error count
  static incrementErrorCount(context: ConversationContext): ConversationContext {
    return this.updateContext(context, {
      errorCount: (context.errorCount || 0) + 1
    })
  }

  // Increment retry count
  static incrementRetryCount(context: ConversationContext): ConversationContext {
    return this.updateContext(context, {
      retryCount: (context.retryCount || 0) + 1
    })
  }

  // Clear temporary data
  static clearTempData(context: ConversationContext): ConversationContext {
    return this.updateContext(context, {
      tempData: {}
    })
  }

  // Set temporary data
  static setTempData(
    context: ConversationContext,
    key: string,
    value: any
  ): ConversationContext {
    const tempData = context.tempData || {}
    return this.updateContext(context, {
      tempData: { ...tempData, [key]: value }
    })
  }

  // Get temporary data
  static getTempData<T>(
    context: ConversationContext,
    key: string,
    defaultValue?: T
  ): T {
    const tempData = context.tempData || {}
    return tempData[key] !== undefined ? tempData[key] : (defaultValue as T)
  }

  // Validate context data
  static validateContext(context: ConversationContext): ContextValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedContext = { ...context }

    // Validate required fields based on context state
    if (context.registrationCode && !context.employeeName) {
      if (context.registrationStep !== 'awaiting_name') {
        warnings.push('Registration code present but no employee name')
      }
    }

    if (context.eventId && !context.eventTitle) {
      warnings.push('Event ID present but no event title')
    }

    // Validate data types and formats
    if (context.eventDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(context.eventDate)) {
        errors.push('Invalid event date format (expected YYYY-MM-DD)')
      }
    }

    if (context.timeRequestDeadline) {
      try {
        new Date(context.timeRequestDeadline)
      } catch {
        errors.push('Invalid time request deadline format')
      }
    }

    // Validate emergency details
    if (context.emergencyType && context.emergencyDetails) {
      const { delayMinutes, severity } = context.emergencyDetails
      
      if (delayMinutes && !/^\d+$/.test(delayMinutes)) {
        errors.push('Invalid delay minutes format (expected number)')
      }
      
      if (severity && !['low', 'medium', 'high'].includes(severity)) {
        errors.push('Invalid emergency severity level')
      }
    }

    // Validate overtime context
    if (context.overtimeRequest) {
      const { additionalHours, hourlyRate } = context.overtimeRequest
      
      if (additionalHours <= 0) {
        errors.push('Additional hours must be positive')
      }
      
      if (hourlyRate <= 0) {
        errors.push('Hourly rate must be positive')
      }
    }

    // Validate information requests
    if (context.informationRequests) {
      context.informationRequests.forEach((request, index) => {
        if (!request.type || !request.question || !request.timestamp) {
          errors.push(`Information request ${index} is missing required fields`)
        }
        
        try {
          new Date(request.timestamp)
        } catch {
          errors.push(`Information request ${index} has invalid timestamp`)
        }
      })
    }

    // Validate contact updates
    if (context.contactUpdates) {
      context.contactUpdates.forEach((update, index) => {
        if (!update.type || !update.newValue || !update.timestamp) {
          errors.push(`Contact update ${index} is missing required fields`)
        }
        
        if (update.type === 'phone_number') {
          const phoneRegex = /^\+\d{10,15}$/
          if (!phoneRegex.test(update.newValue)) {
            errors.push(`Contact update ${index} has invalid phone number format`)
          }
        }
      })
    }

    // Sanitize data
    if (context.messageCount && context.messageCount < 0) {
      sanitizedContext.messageCount = 0
      warnings.push('Message count was negative, reset to 0')
    }

    if (context.errorCount && context.errorCount < 0) {
      sanitizedContext.errorCount = 0
      warnings.push('Error count was negative, reset to 0')
    }

    // Remove null or undefined values
    Object.keys(sanitizedContext).forEach(key => {
      if (sanitizedContext[key as keyof ConversationContext] === null || 
          sanitizedContext[key as keyof ConversationContext] === undefined) {
        delete sanitizedContext[key as keyof ConversationContext]
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedContext
    }
  }

  // Check if context has specific data
  static hasEventContext(context: ConversationContext): boolean {
    return !!(context.eventId && context.eventTitle)
  }

  static hasRegistrationContext(context: ConversationContext): boolean {
    return !!(context.registrationCode || context.employeeName)
  }

  static hasEmergencyContext(context: ConversationContext): boolean {
    return !!(context.emergencyType && context.emergencyDetails)
  }

  static hasScheduleModificationContext(context: ConversationContext): boolean {
    return !!(context.scheduleModification && !context.scheduleModification.processed)
  }

  static hasOvertimeContext(context: ConversationContext): boolean {
    return !!(context.overtimeRequest && !context.overtimeRequest.processed)
  }

  // Get context summary for debugging
  static getContextSummary(context: ConversationContext): string {
    const summary: string[] = []
    
    if (this.hasRegistrationContext(context)) {
      summary.push(`Registration: ${context.registrationStep || 'in progress'}`)
    }
    
    if (this.hasEventContext(context)) {
      summary.push(`Event: ${context.eventTitle} (${context.eventResponse || 'pending'})`)
    }
    
    if (this.hasEmergencyContext(context)) {
      summary.push(`Emergency: ${context.emergencyType}`)
    }
    
    if (this.hasScheduleModificationContext(context)) {
      summary.push(`Schedule: ${context.scheduleModification?.type}`)
    }
    
    if (this.hasOvertimeContext(context)) {
      summary.push(`Overtime: ${context.overtimeRequest?.additionalHours}h`)
    }
    
    summary.push(`Messages: ${context.messageCount || 0}`)
    summary.push(`Errors: ${context.errorCount || 0}`)
    
    return summary.join(', ')
  }

  // Merge contexts (useful for conversation continuation)
  static mergeContexts(
    baseContext: ConversationContext,
    newContext: Partial<ConversationContext>
  ): ConversationContext {
    // Special handling for arrays
    const mergedInformationRequests = [
      ...(baseContext.informationRequests || []),
      ...(newContext.informationRequests || [])
    ]
    
    const mergedContactUpdates = [
      ...(baseContext.contactUpdates || []),
      ...(newContext.contactUpdates || [])
    ]
    
    return {
      ...baseContext,
      ...newContext,
      informationRequests: mergedInformationRequests,
      contactUpdates: mergedContactUpdates,
      lastActivity: new Date().toISOString(),
      messageCount: Math.max(baseContext.messageCount || 0, newContext.messageCount || 0)
    }
  }

  // Export context for external storage
  static exportContext(context: ConversationContext): string {
    try {
      return JSON.stringify(context, null, 2)
    } catch (error) {
      throw new Error(`Failed to export context: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Import context from external storage
  static importContext(contextString: string): ConversationContext {
    try {
      const context = JSON.parse(contextString) as ConversationContext
      const validation = this.validateContext(context)
      
      if (!validation.isValid) {
        throw new Error(`Invalid context data: ${validation.errors.join(', ')}`)
      }
      
      return validation.sanitizedContext || context
    } catch (error) {
      throw new Error(`Failed to import context: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Reset context to initial state
  static resetContext(preserveMetadata: boolean = true): ConversationContext {
    const baseContext = this.createContext()
    
    if (!preserveMetadata) {
      return baseContext
    }
    
    // Preserve only metadata
    return {
      conversationStarted: baseContext.conversationStarted,
      lastActivity: baseContext.lastActivity,
      messageCount: 0,
      errorCount: 0,
      retryCount: 0,
      informationRequests: [],
      contactUpdates: []
    }
  }
}