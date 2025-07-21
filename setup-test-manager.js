const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupTestManager() {
  console.log('🛠️  Setting up test manager for Work Areas API...\n');
  
  const testUserId = 'test-manager-12345';
  const testEmail = 'test-manager@example.com';
  
  try {
    // Check if test manager already exists
    console.log('🔍 Checking for existing test manager...');
    const { data: existingEmployee, error: selectError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (existingEmployee) {
      console.log('✅ Test manager already exists:', existingEmployee.name);
      console.log('📧 Email:', existingEmployee.user_id);
      console.log('🎭 Role:', existingEmployee.role);
      return existingEmployee;
    }
    
    // Create test manager employee record
    console.log('👤 Creating test manager employee record...');
    const { data: newEmployee, error: insertError } = await supabase
      .from('employees')
      .insert({
        name: 'Test Manager',
        user_id: testUserId,
        phone_number: '+1234567890',
        role: 'manager',
        employment_type: 'full_time',
        is_always_needed: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create test manager:', insertError);
      
      // Check if it's an RLS issue
      if (insertError.message.includes('row-level security policy')) {
        console.log('🔧 RLS policy blocking insert. You may need to temporarily disable RLS or use a service role key.');
        console.log('💡 Try running this in your Supabase SQL editor:');
        console.log(`INSERT INTO employees (name, user_id, phone_number, role, employment_type, is_always_needed) 
VALUES ('Test Manager', '${testUserId}', '+1234567890', 'manager', 'full_time', true);`);
      }
      
      return null;
    }
    
    console.log('✅ Test manager created successfully!');
    console.log('📋 Manager details:', {
      id: newEmployee.id,
      name: newEmployee.name,
      user_id: newEmployee.user_id,
      role: newEmployee.role
    });
    
    return newEmployee;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return null;
  }
}

// Test the manager setup
async function testManagerFunction() {
  console.log('\n🧪 Testing is_manager function...');
  
  const testUserId = 'test-manager-12345';
  
  try {
    // This won't work directly from client side, but we can test the employee query
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', testUserId)
      .eq('role', 'manager')
      .single();
    
    if (error) {
      console.log('❌ Manager check failed:', error.message);
    } else if (employee) {
      console.log('✅ Manager found:', employee.name);
    } else {
      console.log('❌ No manager found with test user ID');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function main() {
  const manager = await setupTestManager();
  if (manager) {
    await testManagerFunction();
    console.log('\n🎯 Setup complete! You can now test the Work Areas API with user_id: test-manager-12345');
    console.log('💡 Update your test to use this user ID for authentication.');
  }
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupTestManager }; 