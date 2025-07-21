# Connection Setup and Testing Guide

This guide ensures all Supabase connections, routes, and internal synchronization are working properly.

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio Configuration (OPTIONAL - for WhatsApp integration)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key
4. Paste them in your `.env.local` file

## 🧪 Testing Connections

### Quick Environment Check

```bash
npm run test:env
```

This will verify all required environment variables are set.

### Comprehensive Connection Test

```bash
npm run test:connection
```

This will test:
- ✅ Basic Supabase connection
- ✅ Database functions (fair distribution, recruitment status)
- ✅ Real-time subscriptions
- ✅ All database tables access
- ✅ Webhook route configuration
- ✅ Event lifecycle manager
- ✅ Data synchronization
- ✅ Security policies

### Run All Tests

```bash
npm run test:all
```

## 🔄 Real-Time Synchronization

The app uses Supabase real-time subscriptions for live updates:

### Active Subscriptions

1. **Employee Changes** - Live updates when employees are added/updated
2. **Event Changes** - Real-time event status updates
3. **Employee Event Status** - Live recruitment status changes
4. **Time Records** - Real-time work session updates

### How It Works

```typescript
// Example subscription setup
const subscription = supabase
  .channel('employees-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'employees'
  }, (payload) => {
    // Handle real-time updates
    console.log('Employee change:', payload)
  })
  .subscribe()
```

## 🛠️ Database Functions

### Fair Distribution Algorithm

```sql
-- Function: select_employees_for_event
-- Purpose: Selects employees using fair distribution
-- Parameters: event_id, additional_count
-- Returns: Employees sorted by last_worked_date
```

### Recruitment Status Check

```sql
-- Function: check_recruitment_status
-- Purpose: Analyzes recruitment progress
-- Parameters: event_id
-- Returns: Recruitment statistics and recommendations
```

### Employee Status Update

```sql
-- Function: update_employee_event_status
-- Purpose: Updates employee status for specific event
-- Parameters: employee_id, event_id, new_status, response_method
-- Returns: Success/failure status
```

## 🌐 API Routes

### WhatsApp Webhook

**Route**: `/api/webhooks/twilio`

**Purpose**: Handles incoming WhatsApp responses from employees

**Method**: POST

**Features**:
- Processes "yes/no" responses
- Updates employee status automatically
- Triggers additional recruitment when needed
- Logs all message interactions

### Testing the Webhook

1. Set up Twilio webhook URL in your Twilio dashboard
2. Point it to: `https://your-domain.com/api/webhooks/twilio`
3. Send test WhatsApp messages to verify processing

## 🔒 Security and RLS

### Row Level Security Policies

The database includes RLS policies for:

- **Employees**: Users can only access their own data
- **Events**: Managers can access events they created
- **Time Records**: Employees can only see their own records
- **WhatsApp Messages**: Secure message logging

### Testing Security

```bash
# Test with different user contexts
npm run test:connection
```

## 📊 Data Flow

### Complete Synchronization Flow

1. **Event Creation** → Database → Real-time update → UI refresh
2. **Employee Selection** → Fair distribution algorithm → Status update → UI refresh
3. **WhatsApp Response** → Webhook → Status update → Real-time notification → UI refresh
4. **Event Start** → Lifecycle manager → Time records created → UI refresh
5. **Sign Out** → Time calculation → Payment computation → UI refresh

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables
   - Verify Supabase project is active
   - Check network connectivity

2. **Real-time Not Working**
   - Ensure Supabase real-time is enabled
   - Check subscription setup
   - Verify table permissions

3. **Webhook Not Receiving**
   - Check Twilio webhook URL configuration
   - Verify route is accessible
   - Check server logs for errors

4. **Database Functions Failing**
   - Run migrations to ensure functions exist
   - Check function permissions
   - Verify parameter types

### Debug Commands

```bash
# Check environment
npm run test:env

# Test database connection
npm run test:connection

# Check specific table
npx supabase db inspect --table employees

# View real-time logs
npx supabase logs --follow
```

## ✅ Verification Checklist

Before going live, ensure:

- [ ] Environment variables are set
- [ ] Supabase connection works
- [ ] All database functions are created
- [ ] Real-time subscriptions are working
- [ ] Webhook route is accessible
- [ ] RLS policies are configured
- [ ] Event lifecycle manager is running
- [ ] Data synchronization is working
- [ ] Security policies are enforced

## 🎉 Success Indicators

When everything is working correctly, you should see:

- ✅ All connection tests pass
- ✅ Real-time updates appear instantly
- ✅ WhatsApp responses are processed automatically
- ✅ Events transition through statuses automatically
- ✅ Time tracking works seamlessly
- ✅ Fair distribution algorithm selects employees correctly

The app is now fully synchronized and ready for production use! 