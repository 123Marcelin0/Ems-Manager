// Response Parser for SMS Integration
// Parses incoming German SMS messages and classifies responses

export type EventResponseType = 'accept' | 'decline' | 'request_time' | 'question' | 'unknown'
export type EmergencyType = 'late' | 'sick' | 'injury' | 'cancellation' | 'unknown'
export type InformationRequestType = 'location' | 'equipment' | 'contact' | 'general' | 'unknown'
export type RegistrationResponseType = 'code' | 'name' | 'invalid'

export interface ScheduleModificationRequest {
  type: 'start_time' | 'end_time' | 'duration' | 'general'
  originalTime?: string
  requestedTime?: string
  reason?: string
  confidence: number
}

export interface ParsedResponse {
  type: string
  confidence: number
  data?: any
  originalMessage: string
}

export interface EmergencyInfo {
  type: EmergencyType
  delayMinutes?: string
  reason?: string
  confidence: number
}

export class ResponseParser {
  // Parse event-related responses (Ja/Nein/Rückfrage)
  static parseEventResponse(message: string): { type: EventResponseType; confidence: number } {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Remove common punctuation and normalize
    const cleanMessage = normalizedMessage.replace(/[.,!?;:]/g, '').trim()
    
    // High confidence patterns for acceptance
    const acceptancePatterns = [
      /^(ja|yes|j)$/,
      /^1$/,
      /^1️⃣$/,
      /ich kann arbeiten/,
      /kann arbeiten/,
      /bin dabei/,
      /mache ich/,
      /zusage/,
      /nehme an/,
      /ok/,
      /okay/,
      /in ordnung/,
      /passt/,
      /geht klar/
    ]
    
    // High confidence patterns for decline
    const declinePatterns = [
      /^(nein|no|n)$/,
      /^2$/,
      /^2️⃣$/,
      /kann nicht arbeiten/,
      /kann nicht/,
      /geht nicht/,
      /passt nicht/,
      /absage/,
      /leider nicht/,
      /schaffe nicht/,
      /keine zeit/,
      /verhindert/
    ]
    
    // Patterns for time requests
    const timeRequestPatterns = [
      /bis (morgen|übermorgen|\d+\.\d+)/,
      /bescheid geben/,
      /später antworten/,
      /noch überlegen/,
      /zeit zum überlegen/,
      /melde mich/,
      /sage später bescheid/
    ]
    
    // Patterns for questions/clarifications
    const questionPatterns = [
      /^3$/,
      /^3️⃣$/,
      /rückfrage/,
      /frage/,
      /wo/,
      /wann/,
      /wie/,
      /was/,
      /wer/,
      /warum/,
      /\?/,
      /mehr info/,
      /details/,
      /genauer/,
      /erklärung/
    ]
    
    // Check patterns with confidence scoring
    for (const pattern of acceptancePatterns) {
      if (pattern.test(cleanMessage)) {
        return { type: 'accept', confidence: 0.9 }
      }
    }
    
    for (const pattern of declinePatterns) {
      if (pattern.test(cleanMessage)) {
        return { type: 'decline', confidence: 0.9 }
      }
    }
    
    for (const pattern of timeRequestPatterns) {
      if (pattern.test(cleanMessage)) {
        return { type: 'request_time', confidence: 0.8 }
      }
    }
    
    for (const pattern of questionPatterns) {
      if (pattern.test(cleanMessage)) {
        return { type: 'question', confidence: 0.8 }
      }
    }
    
    // Lower confidence pattern matching
    if (cleanMessage.includes('ja') || cleanMessage.includes('yes')) {
      return { type: 'accept', confidence: 0.6 }
    }
    
    if (cleanMessage.includes('nein') || cleanMessage.includes('no')) {
      return { type: 'decline', confidence: 0.6 }
    }
    
    return { type: 'unknown', confidence: 0.0 }
  }

  // Parse schedule modification requests
  static parseScheduleModification(message: string): ScheduleModificationRequest {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Patterns for start time changes
    const startTimePatterns = [
      /kann ich erst um (\d{1,2}):?(\d{2})? (uhr )?anfangen/,
      /anfangen um (\d{1,2}):?(\d{2})?/,
      /start um (\d{1,2}):?(\d{2})?/,
      /beginnen um (\d{1,2}):?(\d{2})?/,
      /später anfangen/,
      /später kommen/,
      /verspätung/
    ]
    
    // Patterns for end time changes
    const endTimePatterns = [
      /muss um (\d{1,2}):?(\d{2})? (uhr )?weg/,
      /kann nur bis (\d{1,2}):?(\d{2})?/,
      /schluss um (\d{1,2}):?(\d{2})?/,
      /früher gehen/,
      /früher schluss/,
      /eher weg/
    ]
    
    // Patterns for duration changes
    const durationPatterns = [
      /kann nur (\d+) stunden?/,
      /nur (\d+)h/,
      /weniger stunden/,
      /kürzere zeit/,
      /nicht so lange/
    ]
    
    // Check start time patterns
    for (const pattern of startTimePatterns) {
      const match = normalizedMessage.match(pattern)
      if (match) {
        const hour = match[1]
        const minute = match[2] || '00'
        return {
          type: 'start_time',
          requestedTime: `${hour}:${minute}`,
          reason: message,
          confidence: 0.8
        }
      }
    }
    
    // Check end time patterns
    for (const pattern of endTimePatterns) {
      const match = normalizedMessage.match(pattern)
      if (match) {
        const hour = match[1]
        const minute = match[2] || '00'
        return {
          type: 'end_time',
          requestedTime: `${hour}:${minute}`,
          reason: message,
          confidence: 0.8
        }
      }
    }
    
    // Check duration patterns
    for (const pattern of durationPatterns) {
      const match = normalizedMessage.match(pattern)
      if (match) {
        return {
          type: 'duration',
          reason: message,
          confidence: 0.7
        }
      }
    }
    
    // General schedule change indicators
    const generalPatterns = [
      /zeit ändern/,
      /andere zeit/,
      /zeitproblem/,
      /terminproblem/,
      /geht zeitlich nicht/
    ]
    
    for (const pattern of generalPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          type: 'general',
          reason: message,
          confidence: 0.6
        }
      }
    }
    
    return {
      type: 'general',
      reason: message,
      confidence: 0.3
    }
  }

  // Parse registration code or name
  static parseRegistrationResponse(message: string): { 
    type: RegistrationResponseType; 
    data?: string; 
    confidence: number 
  } {
    const trimmedMessage = message.trim()
    
    // Check for registration code
    if (trimmedMessage.toLowerCase() === 'emsland100') {
      return {
        type: 'code',
        data: 'emsland100',
        confidence: 1.0
      }
    }
    
    // Check if it looks like a name (2+ words, letters only, proper capitalization)
    const namePattern = /^[A-ZÄÖÜ][a-zäöüß]+(\s+[A-ZÄÖÜ][a-zäöüß]+)+$/
    if (namePattern.test(trimmedMessage)) {
      return {
        type: 'name',
        data: trimmedMessage,
        confidence: 0.9
      }
    }
    
    // Check if it looks like a name (less strict)
    const relaxedNamePattern = /^[a-zA-ZäöüÄÖÜß\s]{2,50}$/
    if (relaxedNamePattern.test(trimmedMessage) && trimmedMessage.includes(' ')) {
      return {
        type: 'name',
        data: trimmedMessage,
        confidence: 0.7
      }
    }
    
    return {
      type: 'invalid',
      confidence: 0.0
    }
  }

  // Parse emergency messages
  static parseEmergencyMessage(message: string): EmergencyInfo {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Patterns for being late
    const latePatterns = [
      /bin im stau/,
      /verspätung/,
      /komme (\d+) minuten? später/,
      /komme ca\.? (\d+) min später/,
      /(\d+) min verspätung/,
      /später da/,
      /schaffe es nicht pünktlich/,
      /komme zu spät/
    ]
    
    // Patterns for sickness
    const sickPatterns = [
      /bin krank/,
      /krank geworden/,
      /erkältet/,
      /fieber/,
      /grippe/,
      /magen.?darm/,
      /übelkeit/,
      /attest/,
      /arzt/,
      /krankschreibung/
    ]
    
    // Patterns for injury
    const injuryPatterns = [
      /verletzt/,
      /unfall/,
      /sturz/,
      /schmerzen/,
      /kann nicht laufen/,
      /fuß/,
      /bein/,
      /arm/,
      /rücken/,
      /arbeitsunfall/
    ]
    
    // Patterns for cancellation
    const cancellationPatterns = [
      /muss absagen/,
      /kann nicht kommen/,
      /schaffe es nicht/,
      /kurzfristig absagen/,
      /abmelden/,
      /stornieren/,
      /nicht möglich/
    ]
    
    // Check for delay with time extraction
    for (const pattern of latePatterns) {
      const match = normalizedMessage.match(pattern)
      if (match) {
        const delayMinutes = match[1] || 'ca. 15'
        return {
          type: 'late',
          delayMinutes,
          reason: message,
          confidence: 0.9
        }
      }
    }
    
    // Check other emergency types
    for (const pattern of sickPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          type: 'sick',
          reason: message,
          confidence: 0.9
        }
      }
    }
    
    for (const pattern of injuryPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          type: 'injury',
          reason: message,
          confidence: 0.8
        }
      }
    }
    
    for (const pattern of cancellationPatterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          type: 'cancellation',
          reason: message,
          confidence: 0.8
        }
      }
    }
    
    return {
      type: 'unknown',
      reason: message,
      confidence: 0.0
    }
  }

  // Parse information requests
  static parseInformationRequest(message: string): { 
    type: InformationRequestType; 
    confidence: number 
  } {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Location-related patterns
    const locationPatterns = [
      /wo/,
      /treffpunkt/,
      /adresse/,
      /ort/,
      /location/,
      /standort/,
      /wie komme ich/,
      /wegbeschreibung/,
      /anfahrt/
    ]
    
    // Equipment-related patterns
    const equipmentPatterns = [
      /was.*mitbringen/,
      /ausrüstung/,
      /equipment/,
      /kleidung/,
      /anziehen/,
      /brauche ich/,
      /material/,
      /werkzeug/
    ]
    
    // Contact-related patterns
    const contactPatterns = [
      /ansprechpartner/,
      /wer.*vor ort/,
      /chef/,
      /leitung/,
      /kontakt/,
      /telefon/,
      /nummer/,
      /erreichen/
    ]
    
    // Check patterns
    for (const pattern of locationPatterns) {
      if (pattern.test(normalizedMessage)) {
        return { type: 'location', confidence: 0.8 }
      }
    }
    
    for (const pattern of equipmentPatterns) {
      if (pattern.test(normalizedMessage)) {
        return { type: 'equipment', confidence: 0.8 }
      }
    }
    
    for (const pattern of contactPatterns) {
      if (pattern.test(normalizedMessage)) {
        return { type: 'contact', confidence: 0.8 }
      }
    }
    
    // General question indicators
    if (normalizedMessage.includes('?') || 
        normalizedMessage.includes('frage') ||
        normalizedMessage.includes('info') ||
        normalizedMessage.includes('wissen')) {
      return { type: 'general', confidence: 0.6 }
    }
    
    return { type: 'unknown', confidence: 0.0 }
  }

  // Parse overtime responses
  static parseOvertimeResponse(message: string): { 
    type: 'accept' | 'decline' | 'unknown'; 
    confidence: number 
  } {
    // Reuse event response parsing for overtime
    const eventResponse = this.parseEventResponse(message)
    
    // Map event response types to overtime response types
    switch (eventResponse.type) {
      case 'accept':
        return { type: 'accept', confidence: eventResponse.confidence }
      case 'decline':
        return { type: 'decline', confidence: eventResponse.confidence }
      default:
        return { type: 'unknown', confidence: 0.0 }
    }
  }

  // Comprehensive message classification
  static classifyMessage(message: string, context?: any): ParsedResponse {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Check for registration code first
    const registrationResponse = this.parseRegistrationResponse(message)
    if (registrationResponse.confidence > 0.5) {
      return {
        type: 'registration',
        confidence: registrationResponse.confidence,
        data: registrationResponse,
        originalMessage: message
      }
    }
    
    // Check for emergency situations
    const emergencyInfo = this.parseEmergencyMessage(message)
    if (emergencyInfo.confidence > 0.7) {
      return {
        type: 'emergency',
        confidence: emergencyInfo.confidence,
        data: emergencyInfo,
        originalMessage: message
      }
    }
    
    // Check for schedule modifications
    const scheduleModification = this.parseScheduleModification(message)
    if (scheduleModification.confidence > 0.6) {
      return {
        type: 'schedule_modification',
        confidence: scheduleModification.confidence,
        data: scheduleModification,
        originalMessage: message
      }
    }
    
    // Check for information requests
    const informationRequest = this.parseInformationRequest(message)
    if (informationRequest.confidence > 0.6) {
      return {
        type: 'information_request',
        confidence: informationRequest.confidence,
        data: informationRequest,
        originalMessage: message
      }
    }
    
    // Check for event responses
    const eventResponse = this.parseEventResponse(message)
    if (eventResponse.confidence > 0.5) {
      return {
        type: 'event_response',
        confidence: eventResponse.confidence,
        data: eventResponse,
        originalMessage: message
      }
    }
    
    // Default to unknown
    return {
      type: 'unknown',
      confidence: 0.0,
      originalMessage: message
    }
  }

  // Get confidence threshold for different message types
  static getConfidenceThreshold(messageType: string): number {
    const thresholds = {
      'registration': 0.7,
      'event_response': 0.6,
      'emergency': 0.7,
      'schedule_modification': 0.6,
      'information_request': 0.6,
      'overtime_response': 0.6
    }
    
    return thresholds[messageType] || 0.5
  }

  // Check if response is confident enough to act upon
  static isConfidentResponse(parsedResponse: ParsedResponse): boolean {
    const threshold = this.getConfidenceThreshold(parsedResponse.type)
    return parsedResponse.confidence >= threshold
  }
}