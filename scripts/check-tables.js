#!/usr/bin/env node

/**
 * Check Database Tables Script
 * 
 * This script checks which tables exist in your database and shows record counts.
 * Useful for verifying table names before running cleanup.
 * 
 * Usage: node scripts/check-tables.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('📊 Checking database tables and record counts...\n');
  
  // Tables we expect to find
  const expectedTables = [
    'employees',
    'events', 
    'work_areas',
    'employee_event_status',
    'work_assignments',
    'templates',
    'time_records',
    'whatsapp_messages',
    'audit_logs'
  ];
  
  const results = [];
  
  for (const table of expectedTables) {
    try {
      console.log(`🔍 Checking ${table}...`);
      
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        if (error.code === '42P01') {
          results.push({ table, status: 'NOT EXISTS', count: 0, error: 'Table does not exist' });
          console.log(`   ❌ ${table}: Does not exist`);
        } else {
          results.push({ table, status: 'ERROR', count: 0, error: error.message });
          console.log(`   ❌ ${table}: Error - ${error.message}`);
        }
      } else {
        results.push({ table, status: 'EXISTS', count: count || 0, error: null });
        console.log(`   ✅ ${table}: ${count || 0} records`);
      }
    } catch (err) {
      results.push({ table, status: 'ERROR', count: 0, error: err.message });
      console.log(`   ❌ ${table}: Exception - ${err.message}`);
    }
  }
  
  console.log('\n📋 Summary Report:');
  console.log('==================');
  
  const existingTables = results.filter(r => r.status === 'EXISTS');
  const missingTables = results.filter(r => r.status === 'NOT EXISTS');
  const errorTables = results.filter(r => r.status === 'ERROR');
  
  if (existingTables.length > 0) {
    console.log('\n✅ Existing Tables:');
    existingTables.forEach(({ table, count }) => {
      console.log(`   ${table}: ${count} records`);
    });
  }
  
  if (missingTables.length > 0) {
    console.log('\n❌ Missing Tables:');
    missingTables.forEach(({ table }) => {
      console.log(`   ${table}`);
    });
  }
  
  if (errorTables.length > 0) {
    console.log('\n⚠️  Tables with Errors:');
    errorTables.forEach(({ table, error }) => {
      console.log(`   ${table}: ${error}`);
    });
  }
  
  console.log('\n💡 Recommendations:');
  if (missingTables.length > 0) {
    console.log('   - Some expected tables are missing. This might indicate:');
    console.log('     • Incomplete database migration');
    console.log('     • Different table names than expected');
    console.log('     • Permission issues');
  } else {
    console.log('   - All expected tables exist! ✅');
    console.log('   - You can safely run the cleanup script');
  }
  
  const totalRecords = existingTables.reduce((sum, t) => sum + t.count, 0);
  console.log(`\n📊 Total records across all tables: ${totalRecords}`);
}

// Main execution
async function main() {
  try {
    await checkTables();
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    process.exit(1);
  }
}

main().catch(console.error); 