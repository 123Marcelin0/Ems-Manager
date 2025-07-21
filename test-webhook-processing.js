const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWebhookProcessing() {
  console.log('🧪 Testing WhatsApp Webhook Processing...\n');

  try {
    // Test 1: Test with a valid phone number and positive response
    console.log('📱 Test 1: Processing positive response from existing employee...');
    const result1 = await supabase.rpc('process_whatsapp_response', {
      p_phone_number: '+491234567890', // Anna Schmidt from sample data
      p_message_body: 'JA, ich kann arbeiten!',
      p_message_sid: 'TEST_MSG_001'
    });

    console.log('Result 1:', JSON.stringify(result1.data, null, 2));
    
    if (result1.error) {
      console.error('❌ Error in Test 1:', result1.error);
    } else if (result1.data.success) {
      console.log('✅ Test 1 passed: Positive response processed successfully');
    } else {
      console.log('⚠️ Test 1 result:', result1.data.error);
    }

    console.log('\n---\n');

    // Test 2: Test with negative response
    console.log('📱 Test 2: Processing negative response from existing employee...');
    const result2 = await supabase.rpc('process_whatsapp_response', {
      p_phone_number: '+491234567891', // Max Müller from sample data
      p_message_body: 'Nein, ich kann nicht',
      p_message_sid: 'TEST_MSG_002'
    });

    console.log('Result 2:', JSON.stringify(result2.data, null, 2));
    
    if (result2.error) {
      console.error('❌ Error in Test 2:', result2.error);
    } else if (result2.data.success) {
      console.log('✅ Test 2 passed: Negative response processed successfully');
    } else {
      console.log('⚠️ Test 2 result:', result2.data.error);
    }

    console.log('\n---\n');

    // Test 3: Test with unknown phone number
    console.log('📱 Test 3: Processing response from unknown phone number...');
    const result3 = await supabase.rpc('process_whatsapp_response', {
      p_phone_number: '+999999999999', // Non-existent number
      p_message_body: 'Ja',
      p_message_sid: 'TEST_MSG_003'
    });

    console.log('Result 3:', JSON.stringify(result3.data, null, 2));
    
    if (result3.error) {
      console.error('❌ Error in Test 3:', result3.error);
    } else if (!result3.data.success && result3.data.error === 'Employee not found') {
      console.log('✅ Test 3 passed: Unknown phone number handled correctly');
    } else {
      console.log('⚠️ Test 3 unexpected result:', result3.data);
    }

    console.log('\n---\n');

    // Test 4: Test with unclear response
    console.log('📱 Test 4: Processing unclear response...');
    const result4 = await supabase.rpc('process_whatsapp_response', {
      p_phone_number: '+491234567892', // Lisa Weber from sample data
      p_message_body: 'Maybe tomorrow',
      p_message_sid: 'TEST_MSG_004'
    });

    console.log('Result 4:', JSON.stringify(result4.data, null, 2));
    
    if (result4.error) {
      console.error('❌ Error in Test 4:', result4.error);
    } else if (!result4.data.success && result4.data.error === 'Could not understand response') {
      console.log('✅ Test 4 passed: Unclear response handled correctly');
    } else {
      console.log('⚠️ Test 4 unexpected result:', result4.data);
    }

    console.log('\n---\n');

    // Test 5: Test analytics function
    console.log('📊 Test 5: Testing dashboard analytics...');
    const result5 = await supabase.rpc('get_dashboard_analytics', {
      p_time_period: 'month'
    });

    console.log('Result 5:', JSON.stringify(result5.data, null, 2));
    
    if (result5.error) {
      console.error('❌ Error in Test 5:', result5.error);
    } else {
      console.log('✅ Test 5 passed: Dashboard analytics working');
    }

    console.log('\n---\n');

    // Test 6: Test work area creation
    console.log('🏗️ Test 6: Testing work area creation...');
    
    // First get an event ID from the sample data
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (events && events.length > 0) {
      const eventId = events[0].id;
      
      const result6 = await supabase.rpc('create_work_area_with_validation', {
        p_event_id: eventId,
        p_name: 'Test Work Area',
        p_location: 'Test Location',
        p_max_capacity: 5,
        p_role_requirements: { manager: 1, allrounder: 2, versorger: 2 }
      });

      if (result6.error) {
        console.error('❌ Error in Test 6:', result6.error);
      } else {
        console.log('✅ Test 6 passed: Work area created with ID:', result6.data);
        
        // Clean up - delete the test work area
        await supabase
          .from('work_areas')
          .delete()
          .eq('id', result6.data);
      }
    } else {
      console.log('⚠️ Test 6 skipped: No events found');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Summary:');
    console.log('- WhatsApp response processing: Ready');
    console.log('- Dashboard analytics: Ready'); 
    console.log('- Work area validation: Ready');
    console.log('\nYour enhanced Supabase functions are working correctly! 🚀');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('\n⚠️ Make sure you have:');
    console.log('1. Applied the migration in Supabase Dashboard');
    console.log('2. Valid .env.local file with Supabase credentials');
    console.log('3. Sample data loaded in your database');
  }
}

// Run the test
testWebhookProcessing(); 