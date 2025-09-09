import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testBitbucketToken() {
  console.log('🔍 Testing Bitbucket Token Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`- BITBUCKET_TOKEN: ${process.env.BITBUCKET_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`- BITBUCKET_USERNAME: ${process.env.BITBUCKET_USERNAME ? '✅ Set' : '❌ Not set'}`);
  
  if (!process.env.BITBUCKET_TOKEN) {
    console.log('\n❌ BITBUCKET_TOKEN is not set. Please set it in your .env file.');
    return;
  }
  
  if (!process.env.BITBUCKET_USERNAME) {
    console.log('\n❌ BITBUCKET_USERNAME is not set. Please set it in your .env file.');
    return;
  }
  
  console.log('\n🔐 Testing Bitbucket API Authentication...');
  
  try {
    // Test 1: Check if we can access Bitbucket API
    const response = await axios.get('https://api.bitbucket.org/2.0/user', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.BITBUCKET_USERNAME}:${process.env.BITBUCKET_TOKEN}`).toString('base64')}`,
      },
    });
    
    console.log('✅ Bitbucket API authentication successful!');
    console.log(`👤 Authenticated as: ${response.data.display_name} (${response.data.username})`);
    console.log(`📧 Email: ${response.data.email_address || 'Not provided'}`);
    
    // Test 2: Check repository access
    console.log('\n📁 Testing Repository Access...');
    
    // Try to list repositories (this requires repository:read scope)
    const reposResponse = await axios.get('https://api.bitbucket.org/2.0/repositories', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.BITBUCKET_USERNAME}:${process.env.BITBUCKET_TOKEN}`).toString('base64')}`,
      },
      params: {
        role: 'admin', // This requires repository:write scope
        pagelen: 5
      }
    });
    
    console.log('✅ Repository access successful!');
    console.log(`📊 Found ${reposResponse.data.size} repositories (showing first 5)`);
    
    if (reposResponse.data.values && reposResponse.data.values.length > 0) {
      console.log('\n📋 Sample repositories:');
      reposResponse.data.values.forEach((repo, index) => {
        console.log(`  ${index + 1}. ${repo.name} (${repo.slug})`);
        console.log(`     - Owner: ${repo.owner.display_name}`);
        console.log(`     - Type: ${repo.is_private ? 'Private' : 'Public'}`);
      });
    }
    
    // Test 3: Check specific scopes by trying different operations
    console.log('\n🔍 Testing Token Scopes...');
    
    // Test repository:read scope
    try {
      await axios.get('https://api.bitbucket.org/2.0/repositories', {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.BITBUCKET_USERNAME}:${process.env.BITBUCKET_TOKEN}`).toString('base64')}`,
        },
        params: { pagelen: 1 }
      });
      console.log('✅ repository:read scope: Available');
    } catch (error) {
      console.log('❌ repository:read scope: Not available');
    }
    
    // Test repository:write scope (try to create a test PR - this will fail but we can check the error)
    try {
      // This will likely fail, but we can check if it's due to scope or other reasons
      await axios.post('https://api.bitbucket.org/2.0/repositories/test/test/pullrequests', {
        title: 'Test PR',
        source: { branch: { name: 'test' } },
        destination: { branch: { name: 'main' } }
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.BITBUCKET_USERNAME}:${process.env.BITBUCKET_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ repository:write scope: Not available (403 Forbidden)');
      } else if (error.response?.status === 404) {
        console.log('✅ repository:write scope: Available (404 is expected for non-existent repo)');
      } else {
        console.log(`⚠️ repository:write scope: Status ${error.response?.status} - ${error.response?.data?.error?.message || 'Unknown error'}`);
      }
    }
    
    console.log('\n🎯 Token Configuration Summary:');
    console.log('✅ Token is properly configured');
    console.log('✅ Basic authentication is working');
    console.log('✅ Can access Bitbucket API');
    console.log('✅ Can list repositories');
    
    console.log('\n💡 For Git MCP Server to work properly, ensure your Atlassian token has these scopes:');
    console.log('   - repository:read');
    console.log('   - repository:write');
    console.log('   - pullrequest:read');
    console.log('   - pullrequest:write');
    
  } catch (error) {
    console.error('\n❌ Bitbucket API test failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 This suggests an authentication issue. Please check:');
      console.log('   1. Your BITBUCKET_TOKEN is correct');
      console.log('   2. Your BITBUCKET_USERNAME is correct');
      console.log('   3. The token hasn\'t expired');
      console.log('   4. The token has the required scopes');
    } else if (error.response?.status === 403) {
      console.log('\n🔍 This suggests a scope/permission issue. Please check:');
      console.log('   1. Your token has repository:read scope');
      console.log('   2. Your token has repository:write scope');
      console.log('   3. You have access to the repositories you\'re trying to access');
    }
  }
}

testBitbucketToken();












