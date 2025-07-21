const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`✅ Migration completed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${filePath}`, error.message);
  }
}

async function runAllMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found');
    return;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log('Starting database migrations...');
  
  for (const file of files) {
    await runMigration(path.join(migrationsDir, file));
  }
  
  console.log('All migrations completed!');
}

runAllMigrations().catch(console.error);