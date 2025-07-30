const { RegistrationValidator } = require('../lib/registration-validator')

async function testRegistrationValidator() {
  console.log('🧪 Testing Registration Validator...')
  console.log('===================================')
  
  console.log('\n1. Registration Code Validation:')
  console.log('─'.repeat(50))
  
  const testCodes = [
    'Emsland100',
    'EMSLAND100',
    '  emsland100  ',
    'emsland2024',
    'temp123',
    'invalid123',
    'expired456'
  ]
  
  testCodes.forEach(code => {
    const result = RegistrationValidator.validateRegistrationCode(code)
    const status = result.isValid ? '✅' : '❌'
    console.log(`${status} "${code}" → ${result.isValid ? 'Valid' : result.errorType}`)
    if (result.isValid) {
      console.log(`   Normalized: ${result.code}`)
      if (result.remainingUses !== undefined) {
        console.log(`   Remaining uses: ${result.remainingUses}`)
      } else {
        console.log(`   Remaining uses: Unlimited`)
      }
    } else {
      console.log(`   Error: ${result.error}`)
    }
    console.log('')
  })
  
  console.log('\n2. Phone Number Validation:')
  console.log('─'.repeat(50))
  
  const testPhones = [
    '+49171234567',
    '0171234567',
    '171234567',
    '0171 234 567',
    '+49 171 234 567',
    '+4930123456789', // Landline
    '+49900123456', // Premium (blocked)
    '123456', // Invalid
    '+1234567890', // Non-German
    '+49137123456' // Mass traffic (blocked)
  ]
  
  testPhones.forEach(phone => {
    const result = RegistrationValidator.validatePhoneNumber(phone)
    const status = result.isValid ? '✅' : '❌'
    console.log(`${status} "${phone}"`)
    if (result.isValid) {
      console.log(`   Normalized: ${result.normalizedPhone}`)
    } else {
      console.log(`   Error: ${result.error} (${result.errorType})`)
    }
    console.log('')
  })
  
  console.log('\n3. Employee Name Validation:')
  console.log('─'.repeat(50))
  
  const testNames = [
    'Max Mustermann',
    'Jürgen Müller',
    'Anna-Maria Schmidt',
    'max mustermann',
    '  Max Mustermann  ',
    'Max',
    'A',
    'A'.repeat(101),
    'Max123 Mustermann',
    'Jean-Pierre von der Heide'
  ]
  
  testNames.forEach(name => {
    const result = RegistrationValidator.validateEmployeeName(name)
    const status = result.isValid ? '✅' : '❌'
    console.log(`${status} "${name}"`)
    if (result.isValid) {
      console.log(`   Normalized: ${result.normalizedName}`)
    } else {
      console.log(`   Error: ${result.error}`)
    }
    console.log('')
  })
  
  console.log('\n4. Complete Registration Validation:')
  console.log('─'.repeat(50))
  
  const testRegistrations = [
    {
      phone: '+49171234567',
      code: 'emsland100',
      name: 'Max Mustermann'
    },
    {
      phone: '0172345678',
      code: 'emsland2024',
      name: 'Anna Schmidt'
    },
    {
      phone: 'invalid-phone',
      code: 'invalid-code',
      name: 'X'
    },
    {
      phone: '+49173456789',
      code: 'emsland100'
      // No name
    }
  ]
  
  for (const reg of testRegistrations) {
    console.log(`Testing: ${reg.phone}, ${reg.code}, ${reg.name || 'no name'}`)
    
    try {
      const result = await RegistrationValidator.validateCompleteRegistration(
        reg.phone,
        reg.code,
        reg.name
      )
      
      const status = result.isValid ? '✅' : '❌'
      console.log(`${status} Validation result: ${result.isValid ? 'Valid' : 'Invalid'}`)
      
      if (result.isValid && result.normalizedData) {
        console.log(`   Phone: ${result.normalizedData.phoneNumber}`)
        console.log(`   Code: ${result.normalizedData.registrationCode}`)
        if (result.normalizedData.employeeName) {
          console.log(`   Name: ${result.normalizedData.employeeName}`)
        }
      } else {
        console.log(`   Errors: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('')
  }
  
  console.log('\n5. Registration Request Management:')
  console.log('─'.repeat(50))
  
  try {
    // Test creating registration request
    console.log('Creating registration request...')
    const createResult = await RegistrationValidator.createRegistrationRequest(
      '+49174567890',
      'emsland100',
      'Test User'
    )
    
    if (createResult.success) {
      console.log(`✅ Registration request created: ${createResult.requestId}`)
    } else {
      console.log(`❌ Failed to create request: ${createResult.error}`)
    }
    
    // Test getting registration request
    console.log('\nGetting registration request...')
    const getResult = await RegistrationValidator.getRegistrationRequest('+49174567890')
    
    if (getResult.success) {
      if (getResult.request) {
        console.log(`✅ Found request: ${getResult.request.id}`)
        console.log(`   Status: ${getResult.request.status}`)
        console.log(`   Code: ${getResult.request.registration_code}`)
      } else {
        console.log('ℹ️  No pending request found')
      }
    } else {
      console.log(`❌ Error getting request: ${getResult.error}`)
    }
    
    // Test updating registration request
    console.log('\nUpdating registration request...')
    const updateResult = await RegistrationValidator.updateRegistrationRequest(
      '+49174567890',
      'Updated Test User'
    )
    
    if (updateResult.success) {
      console.log('✅ Registration request updated')
    } else {
      console.log(`❌ Failed to update request: ${updateResult.error}`)
    }
    
  } catch (error) {
    console.log(`❌ Database operations failed: ${error.message}`)
    console.log('This is expected if database is not set up or migrations not applied')
  }
  
  console.log('\n6. Registration Statistics:')
  console.log('─'.repeat(50))
  
  const stats = RegistrationValidator.getRegistrationStats()
  console.log(`✅ Registration Statistics:`)
  console.log(`   Total codes: ${stats.totalCodes}`)
  console.log(`   Active codes: ${stats.activeCodes}`)
  console.log(`   Expired codes: ${stats.expiredCodes}`)
  console.log(`   Total uses: ${stats.totalUses}`)
  console.log(`   Codes near limit: ${stats.codesNearLimit.length}`)
  
  if (stats.codesNearLimit.length > 0) {
    console.log('   Near limit details:')
    stats.codesNearLimit.forEach(code => {
      console.log(`     - ${code.code}: ${code.remainingUses} uses remaining`)
    })
  }
  
  console.log('\n7. Code Management:')
  console.log('─'.repeat(50))
  
  // Test adding new code
  console.log('Adding new registration code...')
  const addResult = RegistrationValidator.addRegistrationCode('testcode2024', {
    maxUses: 25,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    description: 'Test code for demonstration'
  })
  
  if (addResult.success) {
    console.log('✅ New code added successfully')
    
    // Test the new code
    const testResult = RegistrationValidator.validateRegistrationCode('testcode2024')
    console.log(`   Validation: ${testResult.isValid ? 'Valid' : 'Invalid'}`)
    if (testResult.isValid) {
      console.log(`   Remaining uses: ${testResult.remainingUses}`)
    }
  } else {
    console.log(`❌ Failed to add code: ${addResult.error}`)
  }
  
  // Test deactivating code
  console.log('\nDeactivating test code...')
  const deactivateResult = RegistrationValidator.deactivateRegistrationCode('testcode2024')
  
  if (deactivateResult.success) {
    console.log('✅ Code deactivated successfully')
    
    // Test deactivated code
    const testDeactivated = RegistrationValidator.validateRegistrationCode('testcode2024')
    console.log(`   Validation after deactivation: ${testDeactivated.isValid ? 'Valid' : 'Invalid'}`)
    if (!testDeactivated.isValid) {
      console.log(`   Error: ${testDeactivated.error}`)
    }
  } else {
    console.log(`❌ Failed to deactivate code: ${deactivateResult.error}`)
  }
  
  console.log('\n8. Cleanup Operations:')
  console.log('─'.repeat(50))
  
  try {
    console.log('Cleaning up expired registration requests...')
    const cleanupResult = await RegistrationValidator.cleanupExpiredRequests()
    
    if (cleanupResult.success) {
      console.log(`✅ Cleanup completed: ${cleanupResult.deletedCount} requests deleted`)
    } else {
      console.log(`❌ Cleanup failed: ${cleanupResult.error}`)
    }
  } catch (error) {
    console.log(`❌ Cleanup error: ${error.message}`)
  }
  
  console.log('\n✅ Registration Validator testing complete!')
  console.log('\nKey Features Demonstrated:')
  console.log('- Registration code validation with usage limits')
  console.log('- German phone number validation and normalization')
  console.log('- Employee name validation and formatting')
  console.log('- Complete registration validation workflow')
  console.log('- Registration request database management')
  console.log('- Registration statistics and monitoring')
  console.log('- Dynamic code management (add/deactivate)')
  console.log('- Cleanup operations for expired requests')
  console.log('- Comprehensive error handling and validation')
}

// Run if called directly
if (require.main === module) {
  testRegistrationValidator().catch(console.error)
}

module.exports = { testRegistrationValidator }