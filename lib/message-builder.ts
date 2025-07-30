// Message Builder for SMS Integration
// Creates German message templates for all SMS scenarios

export interface Employee {
  id: string
  name: string
  phone_number: string
  role: string
}

export interface Event {
  id: string
  title: string
  event_date: string
  start_time: string
  end_time?: string
  location: string
  hourly_rate: number
  description?: string
}

export interface ScheduleModificationRequest {
  type: 'start_time' | 'end_time' | 'duration' | 'general'
  originalTime?: string
  requestedTime?: string
  reason?: string
}

export type InformationRequestType = 'location' | 'equipment' | 'contact' | 'general' | 'unknown'
export type EmergencyType = 'late' | 'sick' | 'injury' | 'cancellation' | 'unknown'

export class MessageBuilder {
  // Event notification message
  static buildEventNotification(employee: Employee, event: Event): string {
    const eventDate = new Date(event.event_date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const endTimeText = event.end_time ? ` - ${event.end_time}` : ''
    
    return `Hallo ${employee.name}! 👋

🎯 Neue Arbeitsanfrage für dich:

📅 Event: ${event.title}
📍 Datum: ${eventDate}
⏰ Zeit: ${event.start_time}${endTimeText}
🏢 Ort: ${event.location}
💰 Stundenlohn: €${event.hourly_rate.toFixed(2)}

Kannst du arbeiten? Bitte antworte:
1️⃣ JA - Ich kann arbeiten
2️⃣ NEIN - Ich kann nicht
3️⃣ RÜCKFRAGE - Ich habe eine Frage

Vielen Dank! 🙏`
  }

  // Registration prompt message
  static buildRegistrationPrompt(): string {
    return `Hallo! 👋

Willkommen bei unserem Event-Team! 

Du hast den Code "Emsland100" gesendet. Um deine Registrierung abzuschließen, sende uns bitte deinen vollständigen Namen.

Beispiel: "Max Mustermann"

Vielen Dank! 🙏`
  }

  // Registration confirmation message
  static buildRegistrationConfirmation(employeeName: string): string {
    return `Hallo ${employeeName}! 🎉

Herzlich willkommen im Team! Deine Registrierung war erfolgreich.

Du erhältst ab sofort SMS-Benachrichtigungen über verfügbare Events. 

Bei Fragen wende dich an Herrn Schepergerdes.

Wir freuen uns auf die Zusammenarbeit! 👍`
  }

  // Event response confirmations
  static buildEventAcceptanceConfirmation(employee: Employee, event: Event): string {
    return `Super, ${employee.name}! ✅

Danke für deine Zusage für "${event.title}" am ${new Date(event.event_date).toLocaleDateString('de-DE')}.

Wir freuen uns auf dich! 

📍 Treffpunkt: ${event.location}
⏰ Zeit: ${event.start_time}

Bei Fragen melde dich bei Herrn Schepergerdes. 👍`
  }

  static buildEventDeclineConfirmation(employee: Employee, event: Event): string {
    return `Schade, ${employee.name}! ❌

Danke für deine Rückmeldung zu "${event.title}". 

Kein Problem - beim nächsten Mal klappt es bestimmt wieder! 

Vielen Dank für deine ehrliche Antwort. 🙏`
  }

  static buildEventTimeRequestResponse(employee: Employee, deadline: string): string {
    return `Kein Problem, ${employee.name}! ⏰

Gib uns bitte bis ${deadline} Bescheid, ob du Zeit hast.

Antworte dann einfach mit:
1️⃣ JA - Ich kann arbeiten
2️⃣ NEIN - Ich kann nicht

Vielen Dank! 🙏`
  }

  // Schedule modification responses
  static buildScheduleModificationResponse(
    employee: Employee, 
    modification: ScheduleModificationRequest,
    event: Event
  ): string {
    switch (modification.type) {
      case 'start_time':
        return `Alles klar, ${employee.name}! ⏰

Wir tragen deinen geänderten Arbeitsbeginn um ${modification.requestedTime} ein.

Event: ${event.title}
Datum: ${new Date(event.event_date).toLocaleDateString('de-DE')}
Neue Startzeit: ${modification.requestedTime}

Vielen Dank für die Info! 👍`

      case 'end_time':
        return `Verstanden, ${employee.name}! ⏰

Wir planen deinen früheren Feierabend um ${modification.requestedTime} mit ein.

⚠️ Wichtig: Melde dich bitte am ${new Date(event.event_date).toLocaleDateString('de-DE')} nochmal bei Herrn Schepergerdes um dich persönlich abzumelden.

Vielen Dank! 👍`

      case 'duration':
        return `Alles klar, ${employee.name}! ⏰

Wir haben deine geänderte Arbeitszeit notiert.

⚠️ Wichtig: Melde dich bitte am ${new Date(event.event_date).toLocaleDateString('de-DE')} bei Herrn Schepergerdes um die Details zu besprechen.

Vielen Dank für die Info! 👍`

      default:
        return `Danke für deine Nachricht, ${employee.name}! 📝

Wir haben deine Änderungswünsche notiert und werden sie berücksichtigen.

Bei weiteren Fragen wende dich an Herrn Schepergerdes.

Vielen Dank! 👍`
    }
  }

  // Emergency situation responses
  static buildEmergencyResponse(
    employee: Employee, 
    emergencyType: EmergencyType,
    context?: any
  ): string {
    switch (emergencyType) {
      case 'late':
        const delayMinutes = context?.delayMinutes || 'ca. 15'
        return `Danke für die Info, ${employee.name}! 🚗

Wir notieren deine Verspätung von ${delayMinutes} Minuten.

Komm einfach, sobald du da bist. Wir regeln das vor Ort.

Gute Fahrt! 👍`

      case 'sick':
        return `Gute Besserung, ${employee.name}! 🤒

Wir haben dich jetzt ausgetragen. Kümmere dich um deine Gesundheit.

Falls du ein Attest brauchst, sende es später an Herrn Schepergerdes.

Werde schnell wieder gesund! 🙏`

      case 'injury':
        return `Das tut mir leid, ${employee.name}! 🩹

Gute Besserung! Wir kümmern uns um Ersatz.

Falls nötig, wende dich wegen des Arbeitsunfalls an Herrn Schepergerdes.

Werde schnell wieder gesund! 🙏`

      case 'cancellation':
        return `Danke für deine Nachricht, ${employee.name}! 📝

Wir haben dich ausgetragen. Schade, dass es nicht geklappt hat.

Beim nächsten Event bist du hoffentlich wieder dabei!

Vielen Dank für die rechtzeitige Absage. 🙏`

      default:
        return `Danke für deine Nachricht, ${employee.name}! 📝

Wir haben deine Situation zur Kenntnis genommen und werden entsprechend reagieren.

Bei weiteren Fragen wende dich an Herrn Schepergerdes.

Alles Gute! 🙏`
    }
  }

  // Information request responses
  static buildInformationResponse(
    requestType: InformationRequestType,
    context?: any
  ): string {
    switch (requestType) {
      case 'location':
        const locations = [
          'die Emsland Arena',
          'die Emslandhallen', 
          'der äußere Bereich'
        ]
        const eventLocation = context?.location || locations[0]
        
        return `📍 Treffpunkt-Info:

Der Eventort ist "${eventLocation}".

Weitere Details zum genauen Treffpunkt erhältst du vor Ort oder von Herrn Schepergerdes.

Bei Fragen: Einfach nochmal schreiben! 👍`

      case 'equipment':
        return `🎒 Ausrüstungs-Info:

Für Fragen zur Ausrüstung wende dich bitte direkt an Herrn Schepergerdes.

Er kann dir genau sagen, was du mitbringen musst.

Kontakt: [Kontaktdaten von Herrn Schepergerdes]

Vielen Dank! 👍`

      case 'contact':
        return `👥 Ansprechpartner vor Ort:

Dein Ansprechpartner ist Frau Müller.

Sie wird dich vor Ort einweisen und bei Fragen helfen.

Falls du sie nicht findest, frag einfach andere Teammitglieder.

Viel Erfolg! 👍`

      case 'general':
        return `ℹ️ Allgemeine Info:

Für weitere Fragen und Details wende dich bitte an Herrn Schepergerdes.

Du kannst auch hier per SMS nachfragen - wir helfen gerne weiter!

Vielen Dank! 👍`

      default:
        return `❓ Deine Frage:

Entschuldigung, ich habe deine Frage nicht ganz verstanden.

Wende dich bitte direkt an Herrn Schepergerdes oder stelle deine Frage nochmal anders.

Wir helfen gerne weiter! 👍`
    }
  }

  // Overtime request messages
  static buildOvertimeRequest(employee: Employee, event: Event, additionalHours: number): string {
    return `Hallo ${employee.name}! ⏰

Könntest du heute bei "${event.title}" länger bleiben?

Zusätzliche Zeit: ca. ${additionalHours} Stunden
Stundenlohn: €${event.hourly_rate.toFixed(2)}

Bitte antworte mit:
1️⃣ JA - Ich kann Überstunden machen
2️⃣ NEIN - Heute nicht möglich

Vielen Dank! 🙏`
  }

  static buildOvertimeAcceptanceResponse(employee: Employee): string {
    return `Super, ${employee.name}! ⏰

Danke für dein Angebot! Wir halten dich auf dem Laufenden und melden uns, wenn wir dich brauchen.

Du hilfst uns sehr damit! 👍`
  }

  static buildOvertimeDeclineResponse(employee: Employee): string {
    return `Verstanden, ${employee.name}! ⏰

Danke für die Rückmeldung. Kein Problem - heute geht es nicht.

Beim nächsten Mal vielleicht wieder! 👍`
  }

  // Contact information update responses
  static buildContactUpdateConfirmation(employee: Employee, updateType: string): string {
    switch (updateType) {
      case 'phone_number':
        return `Danke, ${employee.name}! 📱

Deine neue Telefonnummer wurde aktualisiert.

Du erhältst weiterhin alle SMS-Benachrichtigungen auf dieser Nummer.

Vielen Dank für die Info! 👍`

      case 'availability':
        return `Danke, ${employee.name}! 📅

Deine neuen Verfügbarkeiten wurden gespeichert.

Wir berücksichtigen sie bei zukünftigen Event-Anfragen.

Vielen Dank! 👍`

      default:
        return `Danke, ${employee.name}! 📝

Deine Kontaktdaten wurden aktualisiert.

Bei weiteren Änderungen melde dich einfach wieder.

Vielen Dank! 👍`
    }
  }

  // Error and fallback messages
  static buildErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'invalid_response':
        return `❓ Entschuldigung!

Ich habe deine Antwort nicht verstanden.

Bitte antworte mit:
1️⃣ JA
2️⃣ NEIN
3️⃣ RÜCKFRAGE

Oder schreibe deine Frage ausführlicher. Vielen Dank! 🙏`

      case 'registration_failed':
        return `❌ Registrierung fehlgeschlagen!

Es gab ein Problem bei deiner Registrierung.

Bitte versuche es nochmal oder wende dich an Herrn Schepergerdes.

Entschuldigung für die Unannehmlichkeiten! 🙏`

      case 'system_error':
        return `⚠️ Technisches Problem!

Es gab einen temporären Fehler. Bitte versuche es in ein paar Minuten nochmal.

Bei anhaltenden Problemen wende dich an Herrn Schepergerdes.

Entschuldigung! 🙏`

      case 'invalid_code':
        return `❌ Ungültiger Code!

Der Code "Emsland100" ist erforderlich für die Registrierung.

Bitte sende: "Emsland100"

Vielen Dank! 🙏`

      default:
        return `❓ Unbekannter Fehler!

Es gab ein Problem. Bitte wende dich an Herrn Schepergerdes.

Entschuldigung für die Unannehmlichkeiten! 🙏`
    }
  }

  // Helper method to format date and time
  static formatDateTime(date: string, time?: string): string {
    const formattedDate = new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    return time ? `${formattedDate} um ${time}` : formattedDate
  }

  // Helper method to validate message length (SMS limit is 160 chars for single SMS)
  static validateMessageLength(message: string): { 
    isValid: boolean
    length: number
    segments: number
    warning?: string 
  } {
    const length = message.length
    const segments = Math.ceil(length / 160)
    
    return {
      isValid: length <= 1600, // Max 10 segments
      length,
      segments,
      warning: segments > 1 ? `Message will be sent as ${segments} SMS segments` : undefined
    }
  }

  // Helper method to truncate message if too long
  static truncateMessage(message: string, maxLength: number = 1600): string {
    if (message.length <= maxLength) {
      return message
    }
    
    return message.substring(0, maxLength - 3) + '...'
  }
}