# 🚀 Quick Setup Checklist for SMS Integration

## ✅ Step-by-Step Setup

### 1. Database Setup (5 minutes)
- [ ] Go to your Supabase project → SQL Editor
- [ ] Copy and paste the SQL from the output above (both migrations)
- [ ] Run the SQL (click "Run" button)
- [ ] Verify tables were created: Check Database → Tables for `sms_messages`, `sms_conversations`, `employee_registration_requests`

### 2. Twilio Setup (10 minutes)
- [ ] Go to [twilio.com](https://www.twilio.com) and create account
- [ ] Get your **Account SID** and **Auth Token** from Console Dashboard
- [ ] Buy a phone number (or use trial number)
- [ ] Note down your phone number (with +country code)

### 3. Environment Variables (2 minutes)
Add these to your `.env.local` file:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here  
TWILIO_PHONE_NUMBER=+4915123456789
```

### 4. Test Basic Setup (2 minutes)
Run this command to verify everything works:
```bash
npm run test-sms-service
```

### 5. Create API Routes (5 minutes)
Create these two files:

**File: `app/api/sms/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const { to, body, eventId, employeeId, messageType } = await request.json()
    
    const result = await smsService.sendMessage({
      to, body, eventId, employeeId, messageType
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
```

**File: `app/api/sms/webhook/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/conversation-manager'
import { smsService } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string
    
    const result = await smsService.processIncomingMessage({
      from, body, messageSid
    })
    
    if (result.success && result.conversationId) {
      const conversation = await ConversationManager.getConversationById(result.conversationId)
      if (conversation) {
        const response = await ConversationManager.processMessage(conversation, body)
        
        if (response.success && response.shouldSendMessage && response.responseMessage) {
          await smsService.sendMessage({
            to: from,
            body: response.responseMessage,
            conversationId: result.conversationId
          })
        }
      }
    }
    
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
```

### 6. Test Registration Flow (3 minutes)
- [ ] Send SMS to your Twilio number: `Emsland100`
- [ ] Should receive welcome message asking for name
- [ ] Reply with: `Max Mustermann`  
- [ ] Should receive registration confirmation

### 7. Configure Twilio Webhook (2 minutes)
- [ ] In Twilio Console → Phone Numbers → Manage → Active numbers
- [ ] Click your phone number
- [ ] Set webhook URL to: `https://your-domain.com/api/sms/webhook`
- [ ] Set method to POST
- [ ] Save

## 🧪 Quick Tests

After setup, run these to verify everything works:

```bash
# Test database setup
npm run validate-sms-schema

# Test SMS functionality  
npm run test-sms-service

# Test message templates
npm run test-message-builder

# Test response parsing
npm run test-response-parser

# Test registration system
npm run test-registration-validator
```

## 📱 Test the Complete Flow

1. **Employee Registration:**
   - Send: `Emsland100` → Should get welcome message
   - Reply: `Max Mustermann` → Should get confirmation

2. **Event Notifications:**
   - In your app, select employees with "ausgewählt" status
   - Click "Jetzt senden" 
   - Employees should receive event details
   - They can reply: `1` (yes), `2` (no), `3` (question)

## 🚨 Common Issues

**"Database function not found"**
→ Make sure you ran both SQL migrations in Supabase

**"Twilio credentials invalid"**  
→ Double-check Account SID and Auth Token in `.env.local`

**"Webhook not working"**
→ Make sure webhook URL is set correctly in Twilio and your app is accessible

**"SMS not sending"**
→ Check Twilio account balance and phone number verification

## 🎯 You're Done!

Once all checkboxes are ✅, your SMS integration is ready!

Employees can now:
- Register by sending "Emsland100" 
- Receive event notifications
- Respond to work requests
- Handle schedule changes
- Report emergencies

All in German, exactly as specified! 🇩🇪