// Conversation Manager for SMS Integration
// Manages conversation state machine and context for SMS interactions

import { supabase } from './supabase'
import { ResponseParser, ParsedResponse } from './response-parser'
import { MessageBuilder } from './message-builder'
import { smsService } from './sms-service'

export type ConversationState = 
  | 'idle'
  | 'registration_code_received'
  | 'awaiting_name'
  | 'event_notification_sent'
  | 'awaiting_event_response'
  | 'schedule_modification_request'
  | 'overtime_request_sent'
  | 'information_request'
  | 'emergency_situation'
  | 'completed'

export interface Conversation {
  id: string
  employeeId?: string
  phoneNumber: string
  currentState: ConversationState
  contextData: any
  eventId?: string
  lastActivityAt: Date
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ConversationResponse {
  success: boolean
  responseMessage?: string
  newState?: ConversationState
  shouldSendMessage?: boolean
  error?: string
  conversationId?: string
}

export interface StateTransition {
  fromState: ConversationState
  toState: ConversationState
  trigger: string
  condition?: (context: any, message: string) => boolean
}

export class ConversationManager {
  private static readonly DEFAULT_EXPIRY_HOURS = 24
  private static readonly REGISTRATION_EXPIRY_HOURS = 2

  // Define valid state transitions
  private static readonly STATE_TRANSITIONS: StateTransition[] = [
    // Registration flow
    { fromState: 'idle', toState: 'registration_code_received', trigger: 'registration_code' },
    { fromState: 'registration_code_received', toState: 'awaiting_name', trigger: 'valid_code' },
    { fromState: 'awaiting_name', toState: 'completed', trigger: 'valid_name' },
    
    // Event notification flow
    { fromState: 'idle', toState: 'event_notification_sent', trigger: 'event_notification' },
    { fromState: 'event_notification_sent', toState: 'awaiting_event_response', trigger: 'notification_sent' },
    { fromState: 'awaiting_event_response', toState: 'completed', trigger: 'event_response' },
    
    // Schedule modification flow
    { fromState: 'awaiting_event_response', toState: 'schedule_modification_request', trigger: 'schedule_request' },
    { fromState: 'schedule_modification_request', toState: 'completed', trigger: 'modification_processed' },
    
    // Information request flow
    { fromState: 'awaiting_event_response', toState: 'information_request', trigger: 'information_request' },
    { fromState: 'information_request', toState: 'awaiting_event_response', trigger: 'information_provided' },
    
    // Emergency flow
    { fromState: 'idle', toState: 'emergency_situation', trigger: 'emergency' },
    { fromState: 'awaiting_event_response', toState: 'emergency_situation', trigger: 'emergency' },
    { fromState: 'emergency_situation', toState: 'completed', trigger: 'emergency_handled' },
    
    // Overtime flow
    { fromState: 'idle', toState: 'overtime_request_sent', trigger: 'overtime_request' },
    { fromState: 'overtime_request_sent', toState: 'completed', trigger: 'overtime_response' },
    
    // Reset to idle
    { fromState: 'completed', toState: 'idle', trigger: 'reset' }
  ]

  // Get or create conversation
  static async getOrCreateConversation(phoneNumber: string, employeeId?: string): Promise<Conversation> {
    try {
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_sms_conversation', {
          p_phone_number: phoneNumber,
          p_employee_id: employeeId || null
        })

      if (error) throw error

      // Fetch the conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (fetchError) throw fetchError

      return {
        id: conversation.id,
        employeeId: conversation.employee_id,
        phoneNumber: conversation.phone_number,
        currentState: conversation.current_state as ConversationState,
        contextData: conversation.context_data || {},
        eventId: conversation.event_id,
        lastActivityAt: new Date(conversation.last_activity_at),
        expiresAt: new Date(conversation.expires_at),
        createdAt: new Date(conversation.created_at),
        updatedAt: new Date(conversation.updated_at)
      }
    } catch (error) {
      throw new Error(`Failed to get or create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update conversation state
  static async updateConversationState(
    conversationId: string,
    newState: ConversationState,
    contextData?: any,
    eventId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_conversation_state', {
          p_conversation_id: conversationId,
          p_new_state: newState,
          p_context_data: contextData || null,
          p_event_id: eventId || null
        })

      if (error) throw error
    } catch (error) {
      throw new Error(`Failed to update conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Process incoming message
  static async processMessage(
    conversation: Conversation,
    message: string
  ): Promise<ConversationResponse> {
    try {
      // Parse the incoming message
      const parsedResponse = ResponseParser.classifyMessage(message, conversation.contextData)
      
      // Process based on current conversation state
      switch (conversation.currentState) {
        case 'idle':
          return await this.handleIdleState(conversation, parsedResponse)
        
        case 'registration_code_received':
          return await this.handleRegistrationCodeReceived(conversation, parsedResponse)
        
        case 'awaiting_name':
          return await this.handleAwaitingName(conversation, parsedResponse)
        
        case 'awaiting_event_response':
          return await this.handleAwaitingEventResponse(conversation, parsedResponse)
        
        case 'schedule_modification_request':
          return await this.handleScheduleModificationRequest(conversation, parsedResponse)
        
        case 'information_request':
          return await this.handleInformationRequest(conversation, parsedResponse)
        
        case 'emergency_situation':
          return await this.handleEmergencySituation(conversation, parsedResponse)
        
        case 'overtime_request_sent':
          return await this.handleOvertimeRequestSent(conversation, parsedResponse)
        
        default:
          return {
            success: false,
            error: `Unknown conversation state: ${conversation.currentState}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing message'
      }
    }
  }

  // Handle idle state (new conversations)
  private static async handleIdleState(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    switch (parsedResponse.type) {
      case 'registration':
        if (parsedResponse.data?.type === 'code' && parsedResponse.data?.data === 'emsland100') {
          // Valid registration code received
          await this.updateConversationState(
            conversation.id,
            'registration_code_received',
            { registrationCode: 'emsland100' }
          )
          
          const responseMessage = MessageBuilder.buildRegistrationPrompt()
          return {
            success: true,
            responseMessage,
            newState: 'registration_code_received',
            shouldSendMessage: true,
            conversationId: conversation.id
          }
        } else {
          // Invalid registration code
          const responseMessage = MessageBuilder.buildErrorMessage('invalid_code')
          return {
            success: true,
            responseMessage,
            shouldSendMessage: true,
            conversationId: conversation.id
          }
        }
      
      case 'emergency':
        return await this.handleEmergencyMessage(conversation, parsedResponse)
      
      default:
        // Unknown message in idle state
        const responseMessage = MessageBuilder.buildErrorMessage('invalid_response')
        return {
          success: true,
          responseMessage,
          shouldSendMessage: true,
          conversationId: conversation.id
        }
    }
  }

  // Handle registration code received state
  private static async handleRegistrationCodeReceived(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    if (parsedResponse.type === 'registration' && parsedResponse.data?.type === 'name') {
      // Valid name received
      const employeeName = parsedResponse.data.data
      
      try {
        // Create employee from registration
        const { data: employeeId, error } = await supabase
          .rpc('create_employee_from_registration', {
            p_phone_number: conversation.phoneNumber,
            p_name: employeeName,
            p_registration_code: 'emsland100'
          })

        if (error) throw error

        // Update conversation with employee ID and complete registration
        await this.updateConversationState(
          conversation.id,
          'completed',
          { 
            registrationCompleted: true, 
            employeeName,
            employeeId 
          }
        )

        const responseMessage = MessageBuilder.buildRegistrationConfirmation(employeeName)
        return {
          success: true,
          responseMessage,
          newState: 'completed',
          shouldSendMessage: true,
          conversationId: conversation.id
        }
      } catch (error) {
        const responseMessage = MessageBuilder.buildErrorMessage('registration_failed')
        return {
          success: true,
          responseMessage,
          shouldSendMessage: true,
          conversationId: conversation.id
        }
      }
    } else {
      // Invalid name format
      const responseMessage = MessageBuilder.buildRegistrationPrompt()
      return {
        success: true,
        responseMessage,
        shouldSendMessage: true,
        conversationId: conversation.id
      }
    }
  }

  // Handle awaiting name state (redundant with above, but kept for clarity)
  private static async handleAwaitingName(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    return await this.handleRegistrationCodeReceived(conversation, parsedResponse)
  }

  // Handle awaiting event response state
  private static async handleAwaitingEventResponse(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    switch (parsedResponse.type) {
      case 'event_response':
        return await this.handleEventResponse(conversation, parsedResponse)
      
      case 'schedule_modification':
        return await this.handleScheduleModification(conversation, parsedResponse)
      
      case 'information_request':
        return await this.handleInformationRequestMessage(conversation, parsedResponse)
      
      case 'emergency':
        return await this.handleEmergencyMessage(conversation, parsedResponse)
      
      default:
        const responseMessage = MessageBuilder.buildErrorMessage('invalid_response')
        return {
          success: true,
          responseMessage,
          shouldSendMessage: true,
          conversationId: conversation.id
        }
    }
  }

  // Handle event response
  private static async handleEventResponse(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    const eventResponse = parsedResponse.data
    const eventId = conversation.eventId || conversation.contextData?.eventId

    if (!eventId) {
      return {
        success: false,
        error: 'No event ID found in conversation context'
      }
    }

    try {
      // Get employee and event details
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('phone_number', conversation.phoneNumber)
        .single()

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (!employee || !event) {
        throw new Error('Employee or event not found')
      }

      let responseMessage: string
      let newStatus: string

      switch (eventResponse.type) {
        case 'accept':
          newStatus = 'available'
          responseMessage = MessageBuilder.buildEventAcceptanceConfirmation(employee, event)
          break
        
        case 'decline':
          newStatus = 'unavailable'
          responseMessage = MessageBuilder.buildEventDeclineConfirmation(employee, event)
          break
        
        case 'request_time':
          // Give them until tomorrow 18:00
          const deadline = new Date()
          deadline.setDate(deadline.getDate() + 1)
          deadline.setHours(18, 0, 0, 0)
          
          responseMessage = MessageBuilder.buildEventTimeRequestResponse(
            employee,
            deadline.toLocaleDateString('de-DE') + ' 18:00'
          )
          
          // Don't update status yet, keep conversation open
          await this.updateConversationState(
            conversation.id,
            'awaiting_event_response',
            { 
              ...conversation.contextData,
              timeRequestDeadline: deadline.toISOString()
            }
          )
          
          return {
            success: true,
            responseMessage,
            shouldSendMessage: true,
            conversationId: conversation.id
          }
        
        case 'question':
          // Transition to information request state
          await this.updateConversationState(
            conversation.id,
            'information_request',
            conversation.contextData
          )
          
          return await this.handleInformationRequestMessage(conversation, parsedResponse)
        
        default:
          responseMessage = MessageBuilder.buildErrorMessage('invalid_response')
          newStatus = 'asked' // Keep current status
      }

      // Update employee event status
      if (newStatus !== 'asked') {
        await supabase.rpc('update_employee_event_status', {
          p_employee_id: employee.id,
          p_event_id: eventId,
          p_new_status: newStatus,
          p_response_method: 'sms'
        })
      }

      // Complete conversation
      await this.updateConversationState(
        conversation.id,
        'completed',
        { 
          ...conversation.contextData,
          eventResponse: eventResponse.type,
          responseProcessed: true
        }
      )

      return {
        success: true,
        responseMessage,
        newState: 'completed',
        shouldSendMessage: true,
        conversationId: conversation.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to process event response: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle schedule modification
  private static async handleScheduleModification(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    const modification = parsedResponse.data
    const eventId = conversation.eventId || conversation.contextData?.eventId

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('phone_number', conversation.phoneNumber)
        .single()

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (!employee || !event) {
        throw new Error('Employee or event not found')
      }

      const responseMessage = MessageBuilder.buildScheduleModificationResponse(
        employee,
        modification,
        event
      )

      // Update conversation state
      await this.updateConversationState(
        conversation.id,
        'completed',
        {
          ...conversation.contextData,
          scheduleModification: modification,
          modificationProcessed: true
        }
      )

      return {
        success: true,
        responseMessage,
        newState: 'completed',
        shouldSendMessage: true,
        conversationId: conversation.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to process schedule modification: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle information request
  private static async handleInformationRequestMessage(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    const infoRequest = parsedResponse.data
    const eventId = conversation.eventId || conversation.contextData?.eventId

    try {
      let context = {}
      if (eventId) {
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()
        
        if (event) {
          context = { location: event.location }
        }
      }

      const responseMessage = MessageBuilder.buildInformationResponse(
        infoRequest.type,
        context
      )

      // Return to awaiting event response if we were in that state
      const newState = conversation.currentState === 'awaiting_event_response' 
        ? 'awaiting_event_response' 
        : 'completed'

      await this.updateConversationState(
        conversation.id,
        newState,
        {
          ...conversation.contextData,
          informationProvided: true,
          lastInfoRequest: infoRequest.type
        }
      )

      return {
        success: true,
        responseMessage,
        newState,
        shouldSendMessage: true,
        conversationId: conversation.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to process information request: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle emergency message
  private static async handleEmergencyMessage(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    const emergencyInfo = parsedResponse.data

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('phone_number', conversation.phoneNumber)
        .single()

      if (!employee) {
        throw new Error('Employee not found')
      }

      const responseMessage = MessageBuilder.buildEmergencyResponse(
        employee,
        emergencyInfo.type,
        emergencyInfo
      )

      // Update conversation state
      await this.updateConversationState(
        conversation.id,
        'completed',
        {
          ...conversation.contextData,
          emergencyType: emergencyInfo.type,
          emergencyDetails: emergencyInfo,
          emergencyHandled: true
        }
      )

      return {
        success: true,
        responseMessage,
        newState: 'completed',
        shouldSendMessage: true,
        conversationId: conversation.id
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to process emergency message: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Handle other states (placeholder implementations)
  private static async handleScheduleModificationRequest(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    // This state is handled by the schedule modification logic above
    return await this.handleScheduleModification(conversation, parsedResponse)
  }

  private static async handleInformationRequest(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    // This state is handled by the information request logic above
    return await this.handleInformationRequestMessage(conversation, parsedResponse)
  }

  private static async handleEmergencySituation(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    // This state is handled by the emergency message logic above
    return await this.handleEmergencyMessage(conversation, parsedResponse)
  }

  private static async handleOvertimeRequestSent(
    conversation: Conversation,
    parsedResponse: ParsedResponse
  ): Promise<ConversationResponse> {
    if (parsedResponse.type === 'event_response') {
      const overtimeResponse = parsedResponse.data

      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('phone_number', conversation.phoneNumber)
          .single()

        if (!employee) {
          throw new Error('Employee not found')
        }

        let responseMessage: string

        switch (overtimeResponse.type) {
          case 'accept':
            responseMessage = MessageBuilder.buildOvertimeAcceptanceResponse(employee)
            break
          case 'decline':
            responseMessage = MessageBuilder.buildOvertimeDeclineResponse(employee)
            break
          default:
            responseMessage = MessageBuilder.buildErrorMessage('invalid_response')
        }

        await this.updateConversationState(
          conversation.id,
          'completed',
          {
            ...conversation.contextData,
            overtimeResponse: overtimeResponse.type,
            overtimeProcessed: true
          }
        )

        return {
          success: true,
          responseMessage,
          newState: 'completed',
          shouldSendMessage: true,
          conversationId: conversation.id
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to process overtime response: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }

    const responseMessage = MessageBuilder.buildErrorMessage('invalid_response')
    return {
      success: true,
      responseMessage,
      shouldSendMessage: true,
      conversationId: conversation.id
    }
  }

  // Clean up expired conversations
  static async cleanupExpiredConversations(): Promise<number> {
    try {
      const { data: deletedCount, error } = await supabase
        .rpc('cleanup_expired_conversations')

      if (error) throw error

      return deletedCount || 0
    } catch (error) {
      throw new Error(`Failed to cleanup expired conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate state transition
  private static isValidTransition(
    fromState: ConversationState,
    toState: ConversationState,
    trigger: string
  ): boolean {
    return this.STATE_TRANSITIONS.some(
      transition =>
        transition.fromState === fromState &&
        transition.toState === toState &&
        transition.trigger === trigger
    )
  }

  // Get conversation by ID
  static async getConversationById(conversationId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return {
        id: conversation.id,
        employeeId: conversation.employee_id,
        phoneNumber: conversation.phone_number,
        currentState: conversation.current_state as ConversationState,
        contextData: conversation.context_data || {},
        eventId: conversation.event_id,
        lastActivityAt: new Date(conversation.last_activity_at),
        expiresAt: new Date(conversation.expires_at),
        createdAt: new Date(conversation.created_at),
        updatedAt: new Date(conversation.updated_at)
      }
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get active conversations
  static async getActiveConversations(): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .neq('current_state', 'completed')
        .order('last_activity_at', { ascending: false })

      if (error) throw error

      return conversations.map(conv => ({
        id: conv.id,
        employeeId: conv.employee_id,
        phoneNumber: conv.phone_number,
        currentState: conv.current_state as ConversationState,
        contextData: conv.context_data || {},
        eventId: conv.event_id,
        lastActivityAt: new Date(conv.last_activity_at),
        expiresAt: new Date(conv.expires_at),
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at)
      }))
    } catch (error) {
      throw new Error(`Failed to get active conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const conversationManager = ConversationManager