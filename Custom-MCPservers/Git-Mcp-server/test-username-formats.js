import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testUsernameFormats() {
  console.log('🔍 Testing Different Bitbucket Username Formats...\n');
  
  const token = process.env.BITBUCKET_TOKEN;
  if (!token) {
    console.log('❌ BITBUCKET_TOKEN not set');
    return;
  }
  
  // Common username formats to try
  const usernameFormats = [
    'ideagenplc.com',  // Current (email format)
    'alvin.chong',     // Email prefix with dot
    'alvinchong',      // Email prefix without dot
    'alvin_chong',     // Email prefix with underscore
    'alvin',           // Just first name
    'chong',           // Just last name
    'ideagenplc',      // Domain without .com
    'ideagen'          // Domain prefix
  ];
  
  for (const username of usernameFormats) {
    console.log(`🔐 Testing username: "${username}"`);
    
    try {
      const response = await axios.get('https://api.bitbucket.org/2.0/user', {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
        },
        timeout: 5000
      });
      
      console.log(`✅ SUCCESS! Username "${username}" works!`);
      console.log(`👤 Authenticated as: ${response.data.display_name} (${response.data.username})`);
      console.log(`📧 Email: ${response.data.email_address || 'Not provided'}`);
      console.log(`🎯 Use this username: ${username}\n`);
      return username;
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`❌ 401 Unauthorized - "${username}" is incorrect`);
      } else if (error.response?.status === 403) {
        console.log(`❌ 403 Forbidden - "${username}" might be correct but lacks permissions`);
      } else {
        console.log(`❌ Error ${error.response?.status || 'timeout'} - "${username}"`);
      }
    }
  }
  
  console.log('\n❌ None of the tested username formats worked.');
  console.log('\n💡 Please check your Bitbucket username:');
  console.log('   1. Go to https://bitbucket.org/account/settings/');
  console.log('   2. Look for your username in the profile section');
  console.log('   3. It\'s usually different from your email address');
}

testUsernameFormats();












