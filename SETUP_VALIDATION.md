# Setup Data Validation Tools

## Step 1: Apply Database Functions

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/vnxhfmrjzwxumaakgwmq/sql
2. Copy the entire content of `apply-validation-functions.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the SQL

This will create all the necessary database functions for validation.

## Step 2: Test the Validation Tools

Once the database functions are applied, run:

```bash
npm run test-validation
```

This will test that everything is working correctly.

## Step 3: Run Full Validation

```bash
# Run complete validation
npm run validate-data

# Run with auto-repair for safe fixes
npm run validate-data -- --auto-repair --verbose

# Run only schema validation
npm run validate-schema

# Run only data integrity check
npm run check-integrity
```

## Expected Output

After applying the database functions, you should see:

```
✅ Environment variables loaded successfully
🧪 Testing validation tools...

1️⃣ Testing database schema validation...
✅ Schema validation completed: passed (or warnings)

2️⃣ Testing data integrity check...  
✅ Integrity check completed: healthy

✅ All validation tools are working correctly!
```

## Troubleshooting

If you get errors about missing functions:
1. Make sure you applied the SQL from `apply-validation-functions.sql`
2. Check that all functions were created successfully in your Supabase dashboard
3. Verify your environment variables are correct in `.env` and `.env.local`

If you get permission errors:
1. Make sure you're using the correct `SUPABASE_SERVICE_ROLE_KEY`
2. Check that the GRANT statements were executed properly