require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const https = require('https');
const http = require('http');

async function testWebhook() {
  console.log('🧪 Testing webhook endpoint...\n');
  
  // Check if app is running
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/twilio`;
  
  console.log('📍 Webhook URL:', webhookUrl);
  
  // Test data that simulates a Twilio webhook
  const testData = new URLSearchParams({
    From: '+1234567890',
    Body: 'Yes, I can work!',
    MessageSid: 'test_message_123',
    To: '+14788878594'
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = (webhookUrl.startsWith('https') ? https : http).request(webhookUrl, options, (res) => {
      console.log('📡 Response Status:', res.statusCode);
      console.log('📡 Response Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Response Body:');
        console.log(data);
        console.log('\n✅ Webhook test completed!');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error testing webhook:', error.message);
      console.log('\n💡 Make sure your app is running with: npm run dev');
      reject(error);
    });
    
    req.write(testData.toString());
    req.end();
  });
}

// Also test GET endpoint
async function testWebhookGet() {
  console.log('\n🧪 Testing GET endpoint...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/twilio`;
  
  return new Promise((resolve, reject) => {
    const req = (webhookUrl.startsWith('https') ? https : http).get(webhookUrl, (res) => {
      console.log('📡 GET Response Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 GET Response Body:', data);
        console.log('\n✅ GET test completed!');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error testing GET:', error.message);
      reject(error);
    });
  });
}

async function runTests() {
  try {
    await testWebhookGet();
    await testWebhook();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests(); 