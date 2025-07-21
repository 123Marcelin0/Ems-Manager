# 🚨 Event Creation Troubleshooting Guide

## Issue: Events Not Saving to UI or Database

**Symptoms:**
- Events created through "Neue Veranstaltung" dialog don't appear in the UI
- Events don't appear in Supabase database tables
- No error messages or silent failures

## 🎯 **Step-by-Step Fix**

### Step 1: Apply Database Migration ⚡ **MOST IMPORTANT**

**The #1 reason events aren't saving is that the database migration hasn't been applied yet.**

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. **Navigate to SQL Editor** (left sidebar)
3. **Copy the entire contents** of `supabase/migrations/006_templates_and_enhancements.sql`
4. **Paste into SQL Editor and click "Run"**

**Expected Result:** You should see messages like:
```
CREATE TABLE
CREATE INDEX  
ALTER TABLE
CREATE FUNCTION
...
```

### Step 2: Verify Database Tables Exist

In Supabase Dashboard → **Database** → **Tables**, check that these tables exist:
- ✅ `events` (should have new columns: `is_template`, `template_id`)
- ✅ `templates` (new table)
- ✅ `work_areas` 
- ✅ `work_assignments`

### Step 3: Test Event Creation

#### Browser Developer Tools Test:
1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Create a new event** through the UI
4. **Look for errors** in console

**What to look for:**
- ✅ **Success**: `Event saved successfully: {event data}`
- ❌ **Error**: Any error messages about API calls or database

#### Direct API Test:
Test the API endpoint directly:

```bash
# Test event creation API
curl -X POST http://localhost:3000/api/events/create-with-work-areas \
  -H "Content-Type: application/json" \
  -d '{
    "event_data": {
      "title": "Test Event",
      "location": "Test Location",
      "event_date": "2025-12-01",
      "start_time": "10:00:00",
      "hourly_rate": 15.00,
      "employees_needed": 5,
      "employees_to_ask": 7
    }
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid-here",
    "event_data": {...},
    "work_areas": []
  }
}
```

### Step 4: Check Supabase Connection

Test your Supabase connection:

```bash
# In your project directory
node -e "
const { supabase } = require('./lib/supabase.ts');
supabase.from('events').select('count', { count: 'exact' }).then(
  result => console.log('✅ Supabase connected:', result),
  error => console.log('❌ Supabase error:', error)
);
"
```

### Step 5: Verify Environment Variables

Check that your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 **Common Issues & Solutions**

### Issue: "Function create_event_with_work_areas does not exist"
**Solution:** Database migration not applied. Go back to Step 1.

### Issue: "Permission denied for table events"
**Solution:** RLS (Row Level Security) issue. Check if you're logged in as a manager.

### Issue: "Cannot find module '@/hooks/use-events'"
**Solution:** Import path issue. Restart your dev server:
```bash
npm run dev
```

### Issue: Events appear in database but not in UI
**Solution:** Frontend state management issue. Check browser console for React errors.

## 🧪 **Testing Checklist**

After applying fixes, test these scenarios:

- [ ] **Basic Event Creation**: Create event with title, location, date
- [ ] **Event Appears in UI**: Check if event shows up in the events list
- [ ] **Database Persistence**: Verify event exists in Supabase `events` table
- [ ] **Template System**: Save event as template and load template
- [ ] **Work Areas**: Create event with work areas (if configured)

## 📞 **If Still Not Working**

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** in DevTools for failed API calls  
3. **Check Supabase Logs** in Dashboard → Logs
4. **Verify Database Migration** was applied successfully
5. **Test with minimal event data** (just title, location, date)

## 🎯 **Quick Fix Commands**

```bash
# Restart development server
npm run dev

# Test Supabase connection
npx supabase status

# Check if tables exist
npx supabase db dump --schema-only
```

**Most likely fix:** Apply the database migration in Step 1. This resolves 90% of event creation issues. 