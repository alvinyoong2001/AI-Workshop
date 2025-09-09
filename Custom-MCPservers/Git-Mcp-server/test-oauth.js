#!/usr/bin/env node

import { BitbucketOAuthAuth } from './oauth-auth.js';
import { BitbucketAPI } from './bitbucket-api.js';

async function testOAuthFlow() {
  console.log('🧪 Testing Bitbucket OAuth Authentication Flow\n');

  // You need to provide your OAuth client ID here
  const CLIENT_ID = process.env.BITBUCKET_CLIENT_ID || 'your_client_id_here';
  const CLIENT_SECRET = process.env.BITBUCKET_CLIENT_SECRET; // Optional

  if (CLIENT_ID === 'your_client_id_here') {
    console.log('❌ Please set BITBUCKET_CLIENT_ID environment variable or update this script with your OAuth client ID');
    console.log('\nTo get OAuth credentials:');
    console.log('1. Go to https://bitbucket.org/account/settings/app-passwords/');
    console.log('2. Create new OAuth consumer');
    console.log('3. Set callback URL to: http://localhost:8080/callback');
    console.log('4. Copy the Client ID and run:');
    console.log('   export BITBUCKET_CLIENT_ID=your_client_id');
    process.exit(1);
  }

  try {
    // Initialize OAuth authentication
    console.log('1️⃣ Initializing OAuth authentication...');
    const auth = new BitbucketOAuthAuth();
    auth.initialize(CLIENT_ID, CLIENT_SECRET);

    // Initialize API client
    const api = new BitbucketAPI(auth);

    // Start authentication flow
    console.log('2️⃣ Starting OAuth flow (browser will open)...');
    const token = await auth.authenticate();
    console.log('✅ Authentication successful!');
    console.log(`   Token: ${token.substring(0, 10)}...`);

    // Test API access
    console.log('\n3️⃣ Testing API access...');
    const userInfo = await api.getCurrentUser();
    console.log('✅ User info retrieved:');
    console.log(`   Name: ${userInfo.display_name}`);
    console.log(`   Username: @${userInfo.username}`);
    console.log(`   Email: ${userInfo.email || 'Not provided'}`);

    // Test repository access
    console.log('\n4️⃣ Testing repository access...');
    try {
      const workspaces = await api.getWorkspaces();
      console.log('✅ Workspaces accessible:');
      workspaces.values.slice(0, 3).forEach(workspace => {
        console.log(`   - ${workspace.name} (${workspace.slug})`);
      });
    } catch (error) {
      console.log('⚠️  Could not fetch workspaces:', error.message);
    }

    // Test repository parsing
    console.log('\n5️⃣ Testing URL parsing...');
    const testUrls = [
      'https://bitbucket.org/ideagendevelopment/pleasereview-saas-backend.git',
      'https://bitbucket.org/workspace/repo-name',
      'https://bitbucket.org/mycompany/my-project.git'
    ];

    testUrls.forEach(url => {
      try {
        const parsed = BitbucketAPI.parseRepositoryUrl(url);
        console.log(`✅ ${url}`);
        console.log(`   → Workspace: ${parsed.workspace}, Repo: ${parsed.repoSlug}`);
      } catch (error) {
        console.log(`❌ ${url}: ${error.message}`);
      }
    });

    console.log('\n🎉 All tests passed! OAuth authentication is working correctly.');
    console.log('\nYou can now use the following tools:');
    console.log('- authenticate_bitbucket');
    console.log('- bitbucket_auth_status');
    console.log('- checkout_repository (API-based)');

    // Cleanup
    auth.logout();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nCommon issues:');
    console.error('1. Invalid OAuth client ID');
    console.error('2. Callback URL not set to http://localhost:8080/callback');
    console.error('3. Network connectivity issues');
    console.error('4. Port 8080 already in use');
    process.exit(1);
  }
}

// Run the test
testOAuthFlow().catch(console.error);
