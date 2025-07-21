const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testWorkAreasAPI() {
  console.log('🧪 Testing Work Areas API...\n');
  
  const baseUrl = 'http://localhost:3003';
  const eventId = '223f4fac-1656-4246-96e2-0875056c6a7f'; // From your logs
  
  // Test 1: GET all work areas
  console.log('📋 Test 1: GET all work areas');
  try {
    const response = await fetch(`${baseUrl}/api/work-areas`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token', // Mock token for testing
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('✅ GET all work areas:', response.status, result.success ? 'Success' : 'Failed');
    console.log('📊 Data length:', result.data?.length || 0);
  } catch (error) {
    console.log('❌ GET all work areas failed:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: GET work areas by event ID  
  console.log('📋 Test 2: GET work areas by event ID');
  try {
    const response = await fetch(`${baseUrl}/api/work-areas?eventId=${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('✅ GET by event ID:', response.status, result.success ? 'Success' : 'Failed');
    console.log('📊 Data length:', result.data?.length || 0);
  } catch (error) {
    console.log('❌ GET by event ID failed:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: POST create new work area
  console.log('📋 Test 3: POST create new work area');
  const testWorkArea = {
    name: 'Test Kitchen Area',
    location: 'emslandarena',
    max_capacity: 5,
    role_requirements: {
      manager: 0,
      allrounder: 1,
      versorger: 1,
      verkauf: 0,
      essen: 2
    },
    is_active: true,
    event_id: eventId
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/work-areas`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWorkArea)
    });
    
    const result = await response.json();
    console.log('✅ POST create work area:', response.status);
    
    if (response.status === 201) {
      console.log('🎉 Work area created successfully!');
      console.log('📋 Created work area:', result.data?.name);
    } else if (response.status === 401) {
      console.log('🔧 Authentication issue detected - this is expected in development');
      console.log('💡 The development bypass should handle this');
    } else {
      console.log('📄 Response:', result);
    }
    
  } catch (error) {
    console.log('❌ POST create work area failed:', error.message);
  }
  
  console.log('\n🏁 Work Areas API test completed!');
}

// Run the test
if (require.main === module) {
  testWorkAreasAPI().catch(console.error);
}

module.exports = { testWorkAreasAPI }; 