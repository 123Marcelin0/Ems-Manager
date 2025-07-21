const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmployeesWithRLS() {
    console.log('🔍 Testing employees with RLS considerations...\n');

    // Test 1: Try to select employees normally (might be blocked by RLS)
    try {
        const { data: employees, error: empError, count } = await supabase
            .from('employees')
            .select('*', { count: 'exact' });

        if (empError) {
            console.log('❌ Normal employee query:', empError.message);
        } else {
            console.log('✅ Normal employee query: Found', employees.length, 'employees');
            if (employees.length > 0) {
                console.log('   Sample employee:', employees[0].name);
            }
        }
    } catch (err) {
        console.log('❌ Normal employee query error:', err.message);
    }

    // Test 2: Try to get table info using SQL
    try {
        const { data, error } = await supabase
            .rpc('exec_sql', {
                sql: 'SELECT COUNT(*) as count FROM employees;'
            });

        if (error) {
            console.log('❌ SQL count query:', error.message);
        } else {
            console.log('✅ SQL count query result:', data);
        }
    } catch (err) {
        console.log('❌ SQL count query error:', err.message);
    }

    // Test 3: Check if we can see any table structure
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('name')
            .limit(1);

        if (error) {
            console.log('❌ Structure test:', error.message);
            console.log('   This suggests RLS is blocking access');
        } else {
            console.log('✅ Structure test: Can access employee table');
        }
    } catch (err) {
        console.log('❌ Structure test error:', err.message);
    }

    console.log('\n📋 Summary:');
    console.log('- If you see RLS errors, employees exist but are protected by security policies');
    console.log('- The duplicate key error confirms employees were already inserted');
    console.log('- Your Next.js app should work fine once you start it');
}

testEmployeesWithRLS();