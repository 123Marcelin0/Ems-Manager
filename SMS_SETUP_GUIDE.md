# SMS Integration Setup Guide

This guide will walk you through setting up the complete SMS integration system for employee registration and communication.

## 📋 Prerequisites

- Supabase project with existing database
- Twilio account (free trial works for testing)
- Node.js application with existing employee management system

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Apply SMS Integration Migrations

You need to run two SQL migration files in your Supabase SQL Editor:

#### Migration 1: Core SMS Schema
Copy and paste the contents of `supabase/migrations/008_sms_integration_schema.sql` into your Supabase SQL Editor and run it.

**What this creates:**
- `sms_messages` table - Stores all SMS communications
- `sms_conversations` table - Manages conversation state
- `employee_registration_requests` table - Tracks registration requests
- Database functions for SMS operations
- Indexes for performance

#### Migration 2: Security Policies
Copy and paste the contents of `supabase/migrations/009_sms_rls_policies.sql` into your Supabase SQL Editor and run it.

**What this creates:**
- Row Level Security policies for SMS tables
- Access controls for employees and managers
- Helper functions for security

### 1.2 Verify Database Setup

Run this command to check if everything was created correctly:
```bash
npm run validate-sms-schema
```

## 📱 Step 2: Twilio Setup

### 2.1 Create Twilio Account
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Verify your phone number

### 2.2 Get Twilio Credentials
1. Go to Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token**
3. Go to Phone Numbers → Manage → Buy a number
4. Buy a phone number (or use trial number for testing)

### 2.3 Configure Twilio for SMS
1. In Twilio Console, go to Phone Numbers → Manage → Active numbers
2. Click on your phone number
3. In the "Messaging" section, set the webhook URL to:
   ```
   https://your-domain.com/api/sms/webhook
   ```
   (Replace `your-domain.com` with your actual domain)
4. Set HTTP method to `POST`
5. Save the configuration

## 🔧 Step 3: Environment Variables

### 3.1 Update your `.env.local` file:
```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Add these Twilio variables
TWILIO_ACCOUNT_SID=your_account_sid_from_twilio
TWILIO_AUTH_TOKEN=your_auth_token_from_twilio
TWILIO_PHONE_NUMBER=your_twilio_phone_number_with_plus

# Example:
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token_here
# TWILIO_PHONE_NUMBER=+1234567890
```

### 3.2 Verify Environment Setup
```bash
npm run test-sms-service
```

## 🚀 Step 4: API Routes Setup

### 4.1 Create SMS API Route
Create `app/api/sms/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const { to, body, eventId, employeeId, messageType } = await request.json()
    
    const result = await smsService.sendMessage({
      to,
      body,
      eventId,
      employeeId,
      messageType
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

### 4.2 Create Webhook Handler
Create `app/api/sms/webhook/route.ts`:
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
    
    // Process incoming message
    const result = await smsService.processIncomingMessage({
      from,
      body,
      messageSid
    })
    
    if (result.success && result.conversationId) {
      // Get conversation and process message
      const conversation = await ConversationManager.getConversationById(result.conversationId)
      if (conversation) {
        const response = await ConversationManager.processMessage(conversation, body)
        
        if (response.success && response.shouldSendMessage && response.responseMessage) {
          // Send response SMS
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

## 🧪 Step 5: Testing the Setup

### 5.1 Test Database Functions
```bash
npm run validate-sms-schema
```

### 5.2 Test SMS Service
```bash
npm run test-sms-service
```

### 5.3 Test Message Builder
```bash
npm run test-message-builder
```

### 5.4 Test Response Parser
```bash
npm run test-response-parser
```

### 5.5 Test Registration System
```bash
npm run test-registration-validator
npm run test-employee-registration-workflow
```

## 📞 Step 6: Test the Complete Flow

### 6.1 Test Employee Registration
1. Send SMS to your Twilio number: `Emsland100`
2. You should receive: "Willkommen bei unserem Event-Team! Um dich zu registrieren, sende uns bitte deinen vollständigen Namen."
3. Reply with: `Max Mustermann`
4. You should receive: "Herzlich willkommen im Team! Deine Registrierung war erfolgreich."

### 6.2 Test Event Notifications
1. In your app, select employees with "ausgewählt" status
2. Click "Jetzt senden"
3. Selected employees should receive event details via SMS
4. They can reply with:
   - `1` or `Ja` for acceptance
   - `2` or `Nein` for decline
   - `3` or questions for more info

## 🔧 Step 7: Production Deployment

### 7.1 Update Webhook URL
1. Deploy your application to production
2. Update Twilio webhook URL to your production domain:
   ```
   https://your-production-domain.com/api/sms/webhook
   ```

### 7.2 Environment Variables in Production
Make sure all environment variables are set in your production environment:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "Database function not found"
- Make sure you ran both migration files in Supabase
- Check if functions were created in Supabase Dashboard → Database → Functions

#### 2. "Twilio credentials invalid"
- Verify Account SID and Auth Token in Twilio Console
- Make sure phone number includes country code (+49 for Germany)

#### 3. "Webhook not receiving messages"
- Check if webhook URL is correctly set in Twilio
- Verify your application is accessible from the internet
- Check Twilio webhook logs in Console → Monitor → Logs

#### 4. "SMS not sending"
- Check Twilio account balance
- Verify phone number is verified (for trial accounts)
- Check Twilio logs for delivery status

### Debug Commands:
```bash
# Check database schema
npm run validate-sms-schema

# Test SMS functionality
npm run test-sms-service

# Test complete registration flow
npm run test-employee-registration-workflow

# Check environment variables
npm run test:env
```

## 📊 Monitoring and Maintenance

### Regular Tasks:
1. **Clean up expired conversations:**
   ```sql
   SELECT cleanup_expired_conversations();
   ```

2. **Monitor registration statistics:**
   ```bash
   npm run test-registration-validator
   ```

3. **Check SMS delivery rates in Twilio Console**

4. **Review conversation logs in Supabase**

## 🎯 Next Steps

After setup is complete, you can:
1. Customize message templates in `lib/message-builder.ts`
2. Add new registration codes in `lib/registration-validator.ts`
3. Extend conversation flows in `lib/conversation-manager.ts`
4. Add monitoring and analytics
5. Implement additional SMS scenarios

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Twilio webhook logs
3. Check Supabase database logs
4. Test individual components with the provided test scripts

---

**Important Notes:**
- Test thoroughly with a small group before full deployment
- Monitor SMS costs and usage
- Keep registration codes secure
- Regularly backup your database
- Follow GDPR/privacy regulations for phone number storage