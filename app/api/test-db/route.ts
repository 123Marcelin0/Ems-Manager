import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/test-db - Test database connectivity
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if Supabase client exists
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not initialized',
          tests: ['client_init']
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tests = [];
    
    // Test 2: Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    tests.push({
      name: 'Environment Variables',
      passed: hasUrl && hasKey,
      details: {
        hasUrl,
        hasKey,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    });

    // Test 3: Simple query - check if we can connect to database
    let dbTest = null;
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('count')
        .limit(1);
      
      dbTest = {
        name: 'Database Connection',
        passed: !error,
        details: {
          error: error?.message || null,
          dataReceived: !!data
        }
      };
    } catch (err) {
      dbTest = {
        name: 'Database Connection',
        passed: false,
        details: {
          error: err instanceof Error ? err.message : String(err)
        }
      };
    }
    
    tests.push(dbTest);

    // Test 4: Check work_areas table specifically
    let workAreasTest = null;
    try {
      const { data, error } = await supabase
        .from('work_areas')
        .select('*')
        .limit(1);
      
      workAreasTest = {
        name: 'Work Areas Table',
        passed: !error,
        details: {
          error: error?.message || null,
          dataReceived: !!data,
          recordCount: data?.length || 0
        }
      };
    } catch (err) {
      workAreasTest = {
        name: 'Work Areas Table',
        passed: false,
        details: {
          error: err instanceof Error ? err.message : String(err)
        }
      };
    }
    
    tests.push(workAreasTest);

    // Test 5: Check events table
    let eventsTest = null;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(1);
      
      eventsTest = {
        name: 'Events Table',
        passed: !error,
        details: {
          error: error?.message || null,
          dataReceived: !!data,
          recordCount: data?.length || 0
        }
      };
    } catch (err) {
      eventsTest = {
        name: 'Events Table',
        passed: false,
        details: {
          error: err instanceof Error ? err.message : String(err)
        }
      };
    }
    
    tests.push(eventsTest);

    const allPassed = tests.every(test => test.passed);
    
    console.log('✅ Database connectivity test completed');
    console.log('Tests results:', tests);

    return NextResponse.json(
      { 
        success: allPassed,
        message: allPassed ? 'All tests passed' : 'Some tests failed',
        tests,
        timestamp: new Date().toISOString()
      },
      { status: allPassed ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database test failed',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 