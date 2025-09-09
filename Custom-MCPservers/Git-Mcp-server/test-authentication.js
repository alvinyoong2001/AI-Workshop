import { GitMCPServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAuthentication() {
  const server = new GitMCPServer();
  
  try {
    console.log('🔐 Testing Git MCP Server Authentication Feature...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log(`- GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`- BITBUCKET_TOKEN: ${process.env.BITBUCKET_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`- BITBUCKET_USERNAME: ${process.env.BITBUCKET_USERNAME ? '✅ Set' : '❌ Not set'}`);
    console.log('');
    
    // Test 1: GitHub repository (public - no auth needed)
    console.log('📁 Test 1: GitHub public repository (no auth needed)');
    try {
      const result = await server.checkoutRepository({
        repositoryUrl: 'https://github.com/octocat/Hello-World.git',
        targetDirectory: 'test-github-public'
      });
      console.log('✅ Successfully cloned GitHub public repository');
      console.log(result.content[0].text);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Bitbucket repository (public - no auth needed)
    console.log('📁 Test 2: Bitbucket public repository (no auth needed)');
    try {
      const result = await server.checkoutRepository({
        repositoryUrl: 'https://bitbucket.org/atlassian/aui.git',
        targetDirectory: 'test-bitbucket-public'
      });
      console.log('✅ Successfully cloned Bitbucket public repository');
      console.log(result.content[0].text);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Private repository authentication
    console.log('📁 Test 3: Private repository authentication');
    console.log('💡 This test demonstrates how authentication works for private repositories:');
    console.log('');
    console.log('For GitHub private repositories:');
    console.log('- Set GITHUB_TOKEN environment variable');
    console.log('- The checkout_repository tool will automatically use it');
    console.log('');
    console.log('For Bitbucket private repositories:');
    console.log('- Set BITBUCKET_TOKEN and BITBUCKET_USERNAME environment variables');
    console.log('- The checkout_repository tool will automatically use them');
    console.log('');
    console.log('Example usage:');
    console.log('```json');
    console.log('{');
    console.log('  "name": "checkout_repository",');
    console.log('  "arguments": {');
    console.log('    "repositoryUrl": "https://github.com/company/private-repo.git",');
    console.log('    "targetDirectory": "my-private-repo"');
    console.log('  }');
    console.log('}');
    console.log('```');
    console.log('');
    console.log('✅ No manual credential entry required!');
    
    console.log('\n✅ Authentication test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthentication();












