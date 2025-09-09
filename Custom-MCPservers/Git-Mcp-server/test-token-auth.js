#!/usr/bin/env node

// Test script for token-based authentication
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testBitbucketAuth() {
  const token = process.env.BITBUCKET_TOKEN;
  const username = process.env.BITBUCKET_USERNAME;

  console.log('🔐 Testing Bitbucket Token Authentication...\n');

  if (!token || !username) {
    console.error('❌ Missing credentials:');
    if (!token) console.error('  - BITBUCKET_TOKEN environment variable not set');
    if (!username) console.error('  - BITBUCKET_USERNAME environment variable not set');
    console.log('\n💡 Please set these in your .env file or environment variables');
    process.exit(1);
  }

  console.log(`👤 Username: ${username}`);
  console.log(`🔑 Token: ${token ? '*'.repeat(token.length) : 'NOT SET'}\n`);

  try {
    // Test authentication with Bitbucket API
    const response = await axios.get(
      'https://api.bitbucket.org/2.0/user',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
        },
      }
    );

    const userInfo = response.data;
    console.log('✅ Authentication successful!');
    console.log(`📋 User Details:`);
    console.log(`   - Display Name: ${userInfo.display_name}`);
    console.log(`   - Username: ${userInfo.username}`);
    console.log(`   - Email: ${userInfo.email || 'Not provided'}`);
    console.log(`   - Account Type: ${userInfo.account_status}`);
    console.log(`   - UUID: ${userInfo.uuid}`);

    console.log('\n🎉 Token authentication is working correctly!');
    console.log('✨ You can now use the git-mcp-server with Bitbucket operations.');

  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.error?.message || error.message}`);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check your BITBUCKET_USERNAME is correct');
      console.log('   2. Check your BITBUCKET_TOKEN is valid');
      console.log('   3. Create a new app password at: https://bitbucket.org/account/settings/app-passwords/');
      console.log('   4. Ensure the app password has repository read access');
    }
  }
}

// Run the test
testBitbucketAuth().catch(console.error);
