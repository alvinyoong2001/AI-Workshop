import { GitMCPServer } from './server.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function testStoryAnalysis() {
  const server = new GitMCPServer();
  
  try {
    console.log('🔍 Testing Git MCP Server Story Analysis Features...\n');
    
    // Test 1: Auto-detect repository
    console.log('📁 Test 1: Auto-detect repository');
    const repoInfo = await server.autoDetectRepository();
    console.log(`Detected repository: ${repoInfo || 'None found'}\n`);
    
    // Test 2: Switch to the test repository if it exists
    console.log('📁 Test 2: Switch to test repository');
    const testRepoPath = path.join(process.cwd(), 'test-repo');
    try {
      await server.setWorkingDirectory({ directory: testRepoPath });
      console.log(`✅ Switched to test repository: ${testRepoPath}\n`);
    } catch (error) {
      console.log(`ℹ️  Test repository not found, will use current directory: ${error.message}\n`);
    }
    
    // Test 3: Get current repository info
    console.log('📋 Test 3: Get current repository info');
    const currentInfo = await server.getCurrentRepositoryInfo();
    console.log(currentInfo.content[0].text);
    
    // Test 4: Get story code changes
    console.log('\n🔍 Test 4: Get story code changes');
    const storyChangesResult = await server.getStoryCodeChanges({
      storyKeys: ['PR-1'], // Replace with actual story keys
      includeMergedPRs: true,
      includeCommits: true,
      maxResults: 10,
      timeRange: '30d'
    });
    console.log(storyChangesResult.content[0].text);
    
    // Test 5: Analyze merged PRs
    console.log('\n📊 Test 5: Analyze merged PRs');
    const prAnalysisResult = await server.analyzeMergedPRs({
      storyKey: 'PR-1', // Replace with actual story key
      includeFiles: true,
      includeStats: true,
      maxPRs: 5
    });
    console.log(prAnalysisResult.content[0].text);
    
    // Test 6: Get latest commits
    console.log('\n📝 Test 6: Get latest commits');
    const latestCommitsResult = await server.getLatestCommits({
      storyKey: 'PR-1', // Replace with actual story key
      branch: 'master', // Use the branch we know exists
      maxCommits: 5,
      includeFiles: true,
      timeRange: '7d'
    });
    console.log(latestCommitsResult.content[0].text);
    
    // Test 7: Analyze code complexity
    console.log('\n🧠 Test 7: Analyze code complexity');
    const complexityResult = await server.analyzeCodeComplexity({
      storyKeys: ['PR-1'], // Replace with actual story keys
      includeMetrics: true,
      includeFileTypes: ['.js', '.ts']
    });
    console.log(complexityResult.content[0].text);
    
    console.log('\n✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStoryAnalysis();
