import { GitMCPServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCheckoutRepository() {
  const server = new GitMCPServer();
  
  try {
    console.log('🔍 Testing Git MCP Server Checkout Repository Feature...\n');
    
    // Test 1: Checkout a public repository (without specifying branch first)
    console.log('📁 Test 1: Checkout repository without specifying branch');
    const checkoutResult = await server.checkoutRepository({
      repositoryUrl: 'https://github.com/octocat/Hello-World.git',
      targetDirectory: 'test-repo'
    });
    console.log(checkoutResult.content[0].text);
    
    // Test 2: Get repository info after checkout
    console.log('\n📋 Test 2: Get repository info after checkout');
    const repoInfo = await server.getCurrentRepositoryInfo();
    console.log(repoInfo.content[0].text);
    
    // Test 3: List all branches
    console.log('\n🌿 Test 3: List all branches');
    try {
      const branches = await server.git.branch();
      console.log('Available branches:');
      branches.all.forEach(branch => {
        const isCurrent = branch === branches.current ? ' (current)' : '';
        console.log(`  - ${branch}${isCurrent}`);
      });
    } catch (error) {
      console.log('Could not list branches:', error.message);
    }
    
    // Test 4: Try to switch to a different branch
    console.log('\n🔄 Test 4: Try to switch to a different branch');
    try {
      const branches = await server.git.branch();
      const availableBranches = branches.all.filter(b => b !== branches.current);
      
      if (availableBranches.length > 0) {
        const targetBranch = availableBranches[0];
        await server.git.checkout(targetBranch);
        console.log(`✅ Successfully switched to ${targetBranch} branch`);
        
        // Get updated repo info
        const updatedRepoInfo = await server.getCurrentRepositoryInfo();
        console.log('Updated repository info:');
        console.log(updatedRepoInfo.content[0].text);
      } else {
        console.log('ℹ️  No other branches available to switch to');
      }
    } catch (error) {
      console.log('ℹ️  Could not switch branch:', error.message);
    }
    
    console.log('\n✅ Checkout repository test completed successfully');
    console.log('\n💡 Note: The test repository has been cloned to ./test-repo');
    console.log('   You can now test other Git MCP features with this repository');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCheckoutRepository();
