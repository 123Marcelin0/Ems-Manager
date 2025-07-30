// Employee Registration Workflow for SMS Integration
// Orchestrates the multi-step registration conversation flow

import { supabase } from './supabase'
import { RegistrationValidator } from './registration-validator'
import { ConversationManager, Conversation } from './conversation-manager'
import { ConversationContextHandler } from './conversation-context'
import { MessageBuilder } from './message-builder'
import { smsService } from './sms-service'

export interface RegistrationStep {
  step: 'code_validation' | 'name_collection' | 'employee_creation' | 'completion'
  isComplete: boolean
  data?: any
  error?: string
}

export interface RegistrationWorkflowState {
  phoneNumber: string
  conversationId: string
  currentStep: RegistrationStep['step']
  steps: Record<string, RegistrationStep>
  registrationCode?: string
  employeeName?: string
  employeeId?: string
  startedAt: Date
  completedAt?: Date
  errors: string[]
}

export interface WorkflowResult {
  success: boolean
  state: RegistrationWorkflowState
  nextMessage?: string
  shouldSendMessage?: boolean
  error?: string
}

export class EmployeeRegistrationWorkflow {
  // Start registration workflow
  static async startRegistration(
    phoneNumber: string,
    registrationCode: string
  ): Promise<WorkflowResult> {
    try {
      // Validate phone number format
      const phoneValidation = RegistrationValidator.validatePhoneNumber(phoneNumber)
      if (!phoneValidation.isValid) {
        return {
          success: false,
          state: this.createInitialState(phoneNumber),
          error: phoneValidation.error
        }
      }

      const normalizedPhone = phoneValidation.normalizedPhone!

      // Check if phone number already exists
      const existsCheck = await RegistrationValidator.checkPhoneNumberExists(normalizedPhone)
      if (!existsCheck.isValid) {
        return {
          success: false,
          state: this.createInitialState(normalizedPhone),
          error: existsCheck.error
        }
      }

      // Validate registration code
      const codeValidation = RegistrationValidator.validateRegistrationCode(registrationCode)
      if (!codeValidation.isValid) {
        return {
          success: false,
          state: this.createInitialState(normalizedPhone),
          error: codeValidation.error
        }
      }

      // Get or create conversation
      const conversation = await ConversationManager.getOrCreateConversation(normalizedPhone)

      // Create registration request in database
      const requestResult = await RegistrationValidator.createRegistrationRequest(
        normalizedPhone,
        codeValidation.code!
      )

      if (!requestResult.success) {
        return {
          success: false,
          state: this.createInitialState(normalizedPhone),
          error: requestResult.error
        }
      }

      // Update conversation state and context
      let context = ConversationContextHandler.createContext({
        registrationCode: codeValidation.code,
        registrationStep: 'code_received'
      })

      await ConversationManager.updateConversationState(
        conversation.id,
        'registration_code_received',
        context
      )

      // Create workflow state
      const workflowState = this.createWorkflowState(
        normalizedPhone,
        conversation.id,
        codeValidation.code!
      )

      // Mark code validation step as complete
      workflowState.steps.code_validation = {
        step: 'code_validation',
        isComplete: true,
        data: { code: codeValidation.code, remainingUses: codeValidation.remainingUses }
      }

      // Generate response message
      const responseMessage = MessageBuilder.buildRegistrationPrompt()

      return {
        success: true,
        state: workflowState,
        nextMessage: responseMessage,
        shouldSendMessage: true
      }
    } catch (error) {
      return {
        success: false,
        state: this.createInitialState(phoneNumber),
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Process name submission
  static async processNameSubmission(
    phoneNumber: string,
    employeeName: string,
    conversationId?: string
  ): Promise<WorkflowResult> {
    try {
      // Get conversation if not provided
      let conversation: Conversation
      if (conversationId) {
        const conv = await ConversationManager.getConversationById(conversationId)
        if (!conv) {
          throw new Error('Conversation not found')
        }
        conversation = conv
      } else {
        conversation = await ConversationManager.getOrCreateConversation(phoneNumber)
      }

      // Validate employee name
      const nameValidation = RegistrationValidator.validateEmployeeName(employeeName)
      if (!nameValidation.isValid) {
        const workflowState = await this.getWorkflowState(phoneNumber, conversation.id)
        workflowState.errors.push(nameValidation.error!)
        
        return {
          success: false,
          state: workflowState,
          nextMessage: `${nameValidation.error}\n\n${MessageBuilder.buildRegistrationPrompt()}`,
          shouldSendMessage: true
        }
      }

      // Get registration request
      const requestResult = await RegistrationValidator.getRegistrationRequest(phoneNumber)
      if (!requestResult.success || !requestResult.request) {
        throw new Error('Registration request not found')
      }

      // Update registration request with name
      const updateResult = await RegistrationValidator.updateRegistrationRequest(
        phoneNumber,
        nameValidation.normalizedName!
      )

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update registration request')
      }

      // Create employee record
      const employeeResult = await this.createEmployeeRecord(
        phoneNumber,
        nameValidation.normalizedName!,
        requestResult.request.registration_code
      )

      if (!employeeResult.success) {
        throw new Error(employeeResult.error || 'Failed to create employee record')
      }

      // Update conversation context
      let context = ConversationContextHandler.updateContext(
        conversation.contextData || {},
        {
          registrationStep: 'completed',
          employeeName: nameValidation.normalizedName,
          employeeId: employeeResult.employeeId,
          registrationCompleted: true
        }
      )

      await ConversationManager.updateConversationState(
        conversation.id,
        'completed',
        context
      )

      // Create workflow state
      const workflowState = await this.getWorkflowState(phoneNumber, conversation.id)
      workflowState.currentStep = 'completion'
      workflowState.employeeName = nameValidation.normalizedName
      workflowState.employeeId = employeeResult.employeeId
      workflowState.completedAt = new Date()

      // Mark all steps as complete
      workflowState.steps.name_collection = {
        step: 'name_collection',
        isComplete: true,
        data: { name: nameValidation.normalizedName }
      }

      workflowState.steps.employee_creation = {
        step: 'employee_creation',
        isComplete: true,
        data: { employeeId: employeeResult.employeeId }
      }

      workflowState.steps.completion = {
        step: 'completion',
        isComplete: true,
        data: { completedAt: new Date() }
      }

      // Generate confirmation message
      const confirmationMessage = MessageBuilder.buildRegistrationConfirmation(
        nameValidation.normalizedName!
      )

      return {
        success: true,
        state: workflowState,
        nextMessage: confirmationMessage,
        shouldSendMessage: true
      }
    } catch (error) {
      const workflowState = this.createInitialState(phoneNumber)
      workflowState.errors.push(error instanceof Error ? error.message : 'Unbekannter Fehler')
      
      return {
        success: false,
        state: workflowState,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Complete registration workflow
  static async completeRegistration(
    phoneNumber: string,
    registrationCode: string,
    employeeName: string
  ): Promise<WorkflowResult> {
    try {
      // Validate complete registration data
      const validation = await RegistrationValidator.validateCompleteRegistration(
        phoneNumber,
        registrationCode,
        employeeName
      )

      if (!validation.isValid) {
        return {
          success: false,
          state: this.createInitialState(phoneNumber),
          error: validation.errors.join(', ')
        }
      }

      const normalizedData = validation.normalizedData!

      // Create employee record directly
      const employeeResult = await this.createEmployeeRecord(
        normalizedData.phoneNumber,
        normalizedData.employeeName!,
        normalizedData.registrationCode
      )

      if (!employeeResult.success) {
        return {
          success: false,
          state: this.createInitialState(phoneNumber),
          error: employeeResult.error
        }
      }

      // Create workflow state
      const workflowState = this.createWorkflowState(
        normalizedData.phoneNumber,
        'direct-registration',
        normalizedData.registrationCode
      )

      workflowState.currentStep = 'completion'
      workflowState.employeeName = normalizedData.employeeName
      workflowState.employeeId = employeeResult.employeeId
      workflowState.completedAt = new Date()

      // Mark all steps as complete
      Object.keys(workflowState.steps).forEach(stepKey => {
        workflowState.steps[stepKey].isComplete = true
      })

      // Generate confirmation message
      const confirmationMessage = MessageBuilder.buildRegistrationConfirmation(
        normalizedData.employeeName!
      )

      return {
        success: true,
        state: workflowState,
        nextMessage: confirmationMessage,
        shouldSendMessage: true
      }
    } catch (error) {
      return {
        success: false,
        state: this.createInitialState(phoneNumber),
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Get current workflow state
  static async getWorkflowState(
    phoneNumber: string,
    conversationId: string
  ): Promise<RegistrationWorkflowState> {
    try {
      // Get conversation
      const conversation = await ConversationManager.getConversationById(conversationId)
      if (!conversation) {
        return this.createInitialState(phoneNumber)
      }

      // Extract workflow data from context
      const context = conversation.contextData || {}
      
      const workflowState: RegistrationWorkflowState = {
        phoneNumber,
        conversationId,
        currentStep: this.mapConversationStateToWorkflowStep(conversation.currentState),
        steps: {
          code_validation: {
            step: 'code_validation',
            isComplete: !!context.registrationCode,
            data: context.registrationCode ? { code: context.registrationCode } : undefined
          },
          name_collection: {
            step: 'name_collection',
            isComplete: !!context.employeeName,
            data: context.employeeName ? { name: context.employeeName } : undefined
          },
          employee_creation: {
            step: 'employee_creation',
            isComplete: !!context.employeeId,
            data: context.employeeId ? { employeeId: context.employeeId } : undefined
          },
          completion: {
            step: 'completion',
            isComplete: context.registrationCompleted || false,
            data: context.registrationCompleted ? { completedAt: new Date() } : undefined
          }
        },
        registrationCode: context.registrationCode,
        employeeName: context.employeeName,
        employeeId: context.employeeId,
        startedAt: conversation.createdAt,
        completedAt: context.registrationCompleted ? new Date() : undefined,
        errors: []
      }

      return workflowState
    } catch (error) {
      return this.createInitialState(phoneNumber)
    }
  }

  // Check if registration is in progress
  static async isRegistrationInProgress(phoneNumber: string): Promise<boolean> {
    try {
      const conversation = await ConversationManager.getOrCreateConversation(phoneNumber)
      return conversation.currentState === 'registration_code_received' || 
             conversation.currentState === 'awaiting_name'
    } catch (error) {
      return false
    }
  }

  // Cancel registration workflow
  static async cancelRegistration(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get conversation
      const conversation = await ConversationManager.getOrCreateConversation(phoneNumber)
      
      // Update conversation to idle state
      await ConversationManager.updateConversationState(
        conversation.id,
        'idle',
        ConversationContextHandler.resetContext()
      )

      // Clean up registration request
      await supabase
        .from('employee_registration_requests')
        .update({ status: 'cancelled' })
        .eq('phone_number', phoneNumber)
        .eq('status', 'pending')

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Get registration statistics
  static async getRegistrationStatistics(): Promise<{
    totalRequests: number
    completedRegistrations: number
    pendingRegistrations: number
    failedRegistrations: number
    registrationsToday: number
    registrationsThisWeek: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      // Get registration request statistics
      const { data: allRequests } = await supabase
        .from('employee_registration_requests')
        .select('status, created_at')

      const { data: todayRequests } = await supabase
        .from('employee_registration_requests')
        .select('id')
        .gte('created_at', today.toISOString())

      const { data: weekRequests } = await supabase
        .from('employee_registration_requests')
        .select('id')
        .gte('created_at', weekAgo.toISOString())

      const stats = {
        totalRequests: allRequests?.length || 0,
        completedRegistrations: allRequests?.filter(r => r.status === 'completed').length || 0,
        pendingRegistrations: allRequests?.filter(r => r.status === 'pending').length || 0,
        failedRegistrations: allRequests?.filter(r => r.status === 'failed').length || 0,
        registrationsToday: todayRequests?.length || 0,
        registrationsThisWeek: weekRequests?.length || 0
      }

      return stats
    } catch (error) {
      return {
        totalRequests: 0,
        completedRegistrations: 0,
        pendingRegistrations: 0,
        failedRegistrations: 0,
        registrationsToday: 0,
        registrationsThisWeek: 0
      }
    }
  }

  // Send registration reminder
  static async sendRegistrationReminder(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if registration is in progress
      const inProgress = await this.isRegistrationInProgress(phoneNumber)
      if (!inProgress) {
        return {
          success: false,
          error: 'Keine aktive Registrierung gefunden'
        }
      }

      // Get registration request
      const requestResult = await RegistrationValidator.getRegistrationRequest(phoneNumber)
      if (!requestResult.success || !requestResult.request) {
        return {
          success: false,
          error: 'Registrierungsanfrage nicht gefunden'
        }
      }

      // Send reminder message
      const reminderMessage = `Hallo! 👋

Du hast eine Registrierung mit dem Code "${requestResult.request.registration_code}" begonnen.

Um die Registrierung abzuschließen, sende uns bitte deinen vollständigen Namen.

Beispiel: "Max Mustermann"

Falls du Hilfe brauchst, wende dich an Herrn Schepergerdes.

Vielen Dank! 🙏`

      const smsResult = await smsService.sendMessage({
        to: phoneNumber,
        body: reminderMessage,
        messageType: 'registration_reminder'
      })

      return {
        success: smsResult.success,
        error: smsResult.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }

  // Private helper methods
  private static createInitialState(phoneNumber: string): RegistrationWorkflowState {
    return {
      phoneNumber,
      conversationId: '',
      currentStep: 'code_validation',
      steps: {
        code_validation: { step: 'code_validation', isComplete: false },
        name_collection: { step: 'name_collection', isComplete: false },
        employee_creation: { step: 'employee_creation', isComplete: false },
        completion: { step: 'completion', isComplete: false }
      },
      startedAt: new Date(),
      errors: []
    }
  }

  private static createWorkflowState(
    phoneNumber: string,
    conversationId: string,
    registrationCode: string
  ): RegistrationWorkflowState {
    return {
      phoneNumber,
      conversationId,
      currentStep: 'name_collection',
      steps: {
        code_validation: { step: 'code_validation', isComplete: false },
        name_collection: { step: 'name_collection', isComplete: false },
        employee_creation: { step: 'employee_creation', isComplete: false },
        completion: { step: 'completion', isComplete: false }
      },
      registrationCode,
      startedAt: new Date(),
      errors: []
    }
  }

  private static mapConversationStateToWorkflowStep(
    conversationState: string
  ): RegistrationStep['step'] {
    switch (conversationState) {
      case 'registration_code_received':
      case 'awaiting_name':
        return 'name_collection'
      case 'completed':
        return 'completion'
      default:
        return 'code_validation'
    }
  }

  private static async createEmployeeRecord(
    phoneNumber: string,
    employeeName: string,
    registrationCode: string
  ): Promise<{ success: boolean; employeeId?: string; error?: string }> {
    try {
      // Use the database function to create employee
      const { data: employeeId, error } = await supabase
        .rpc('create_employee_from_registration', {
          p_phone_number: phoneNumber,
          p_name: employeeName,
          p_registration_code: registrationCode
        })

      if (error) throw error

      return {
        success: true,
        employeeId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen des Mitarbeiter-Datensatzes'
      }
    }
  }
}