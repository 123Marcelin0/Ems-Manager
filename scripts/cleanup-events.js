#!/usr/bin/env node

/**
 * Cleanup Events Script
 * 
 * This script deletes all event-related data while keeping employees as examples.
 * Perfect for resetting the app to a clean state for testing new events.
 * 
 * Usage: node scripts/cleanup-events.js
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

async function cleanupEvents() {
  console.log('🧹 Starting event cleanup (keeping employees as examples)...\n');
  
  try {
    // Delete in correct order to avoid foreign key constraint errors
    const cleanupSteps = [
      { table: 'employee_event_status', description: 'Employee-Event relationships' },
      { table: 'work_assignments', description: 'Work assignments' }, // Fixed table name
      { table: 'work_areas', description: 'Work areas' },
      { table: 'templates', description: 'Templates' }, // Fixed table name
      { table: 'time_records', description: 'Time records' },
      { table: 'whatsapp_messages', description: 'WhatsApp messages' },
      { table: 'events', description: 'Events' }
    ];

    let deletedCounts = {};
    
    for (const step of cleanupSteps) {
      console.log(`🗑️ Cleaning ${step.description}...`);
      
      const { count, error } = await supabase
        .from(step.table)
        .delete()
        .neq('id', 'impossible-id'); // This deletes all records
        
      if (error) {
        console.error(`❌ Error cleaning ${step.table}:`, error.message);
        // Continue with other tables even if one fails
        deletedCounts[step.table] = 'Error';
      } else {
        deletedCounts[step.table] = count || 0;
        console.log(`✅ Deleted ${count || 0} records from ${step.table}`);
      }
    }
    
    // Special cleanup for audit logs (only event-related entries)
    console.log('🗑️ Cleaning Event-related audit logs...');
    try {
      const { count: auditCount, error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .in('table_name', ['events', 'work_areas', 'work_assignments', 'employee_event_status']);
        
      if (auditError) {
        console.error('❌ Error cleaning audit logs:', auditError.message);
        deletedCounts['audit_logs'] = 'Error';
      } else {
        deletedCounts['audit_logs'] = auditCount || 0;
        console.log(`✅ Deleted ${auditCount || 0} event-related audit log records`);
      }
    } catch (auditError) {
      console.log('ℹ️ Audit logs table not found or no access - skipping');
      deletedCounts['audit_logs'] = 'Skipped';
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log('==================');
    Object.entries(deletedCounts).forEach(([table, count]) => {
      console.log(`${table}: ${count} deleted`);
    });
    
    // Verify employees are still there
    const { count: employeeCount, error: employeeError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });
      
    if (employeeError) {
      console.error('❌ Error checking employees:', employeeError.message);
    } else {
      console.log(`\n✅ Employees preserved: ${employeeCount} records kept as examples`);
    }
    
    console.log('\n🎉 Event cleanup completed successfully!');
    console.log('📝 What happened:');
    console.log('   ✅ All events and their configurations deleted');
    console.log('   ✅ All work areas and assignments removed');
    console.log('   ✅ All event-employee relationships cleared');
    console.log('   ✅ Employees kept as examples for Mitteilungen & Rollen pages');
    console.log('\n💡 You can now create new events with a clean slate!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Add confirmation prompt
function askForConfirmation() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('⚠️  This will delete ALL events and their configurations!');
    console.log('✅ Employees will be preserved as examples.');
    console.log('');
    
    rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Main execution
async function main() {
  const confirmed = await askForConfirmation();
  
  if (!confirmed) {
    console.log('❌ Cleanup cancelled by user.');
    process.exit(0);
  }
  
  await cleanupEvents();
}

main().catch(console.error); 