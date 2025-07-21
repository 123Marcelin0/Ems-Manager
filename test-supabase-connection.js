const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    
    if (error) {
      console.log('Connection test result:', error.message);
      
      // Try a simple query that should work
      const { data: healthData, error: healthError } = await supabase.rpc('version');
      if (healthError) {
        console.log('Health check failed:', healthError.message);
      } else {
        console.log('Basic connection works, but migrations table not accessible');
      }
    } else {
      console.log('✅ Successfully connected to Supabase');
      console.log('Migrations data:', data);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testConnection();