import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testBearerToken() {
  console.log('🔍 Testing Bearer Token Authentication...\n');
  
  const token = process.env.BITBUCKET_TOKEN;
  if (!token) {
    console.log('❌ BITBUCKET_TOKEN not set');
    return;
  }
  
  console.log('🔐 Testing Bearer Token with Bitbucket API...');
  
  try {
    const response = await axios.get('https://api.bitbucket.org/2.0/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeout: 5000
    });
    
    console.log('✅ SUCCESS! Bearer Token authentication works!');
    console.log(`👤 Authenticated as: ${response.data.display_name} (${response.data.username})`);
    console.log(`📧 Email: ${response.data.email_address || 'Not provided'}`);
    console.log('\n🎯 Your Git MCP server can use Bearer Token authentication!');
    
  } catch (error) {
    console.log('❌ Bearer Token authentication failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 This suggests the token might be:');
      console.log('   1. Incorrect or expired');
      console.log('   2. Not have the right scopes');
      console.log('   3. Not be an Atlassian API token');
      
      console.log('\n💡 Please check:');
      console.log('   1. Go to https://id.atlassian.com/manage-profile/security/api-tokens');
      console.log('   2. Verify your token is still valid');
      console.log('   3. Ensure it has repository:read and repository:write scopes');
    }
  }
}

testBearerToken();












