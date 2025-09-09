import dotenv from 'dotenv';
import { GitMCPServer } from './server.js';

dotenv.config();

async function testEnhancedAnalysis() {
  console.log('🚀 Testing Enhanced Git MCP Server Analysis Features...\n');
  
  const server = new GitMCPServer();
  
  try {
    // Auto-detect repository
    console.log('1️⃣ Auto-detecting repository...');
    const repoPath = await server.autoDetectRepository();
    if (!repoPath) {
      console.log('❌ No Git repository found. Please run checkout_repository first.');
      return;
    }
    console.log(`✅ Repository detected: ${repoPath}\n`);

    // Test 1: Developer Performance Analysis
    console.log('2️⃣ Testing Developer Performance Analysis...');
    try {
      const performanceResult = await server.analyzeDeveloperPerformance({
        timeRange: '3m',
        includeMetrics: true,
        minStories: 1
      });
      console.log('✅ Developer Performance Analysis:');
      console.log(performanceResult.content[0].text);
    } catch (error) {
      console.log(`❌ Developer Performance Analysis failed: ${error.message}\n`);
    }

    // Test 2: Story Complexity Statistics
    console.log('\n3️⃣ Testing Story Complexity Statistics...');
    try {
      // Get some recent commits to find story keys
      const log = await server.git.log({ '--max-count': 10 });
      const storyKeys = [];
      
      log.all.forEach(commit => {
        const matches = commit.message.match(/([A-Z]+-\d+)/g);
        if (matches) {
          storyKeys.push(...matches);
        }
      });
      
      if (storyKeys.length > 0) {
        const uniqueStoryKeys = [...new Set(storyKeys)].slice(0, 3);
        console.log(`Found story keys: ${uniqueStoryKeys.join(', ')}`);
        
        const complexityResult = await server.getStoryComplexityStats({
          storyKeys: uniqueStoryKeys,
          includeFileBreakdown: true,
          complexityThreshold: 5
        });
        console.log('✅ Story Complexity Statistics:');
        console.log(complexityResult.content[0].text);
      } else {
        console.log('⚠️ No story keys found in recent commits. Creating test data...');
        
        // Test with dummy story keys
        const complexityResult = await server.getStoryComplexityStats({
          storyKeys: ['TEST-123', 'TEST-456'],
          includeFileBreakdown: true,
          complexityThreshold: 5
        });
        console.log('✅ Story Complexity Statistics (with test data):');
        console.log(complexityResult.content[0].text);
      }
    } catch (error) {
      console.log(`❌ Story Complexity Statistics failed: ${error.message}\n`);
    }

    // Test 3: Developer Recommendations
    console.log('\n4️⃣ Testing Developer Recommendations...');
    try {
      const recommendationResult = await server.recommendDevelopersForStory({
        storyDescription: 'Implement user authentication system with OAuth2 integration',
        storyType: 'feature',
        requiredSkills: ['backend', 'security'],
        timeRange: '3m',
        maxRecommendations: 3
      });
      console.log('✅ Developer Recommendations:');
      console.log(recommendationResult.content[0].text);
    } catch (error) {
      console.log(`❌ Developer Recommendations failed: ${error.message}\n`);
    }

    // Test 4: Enhanced Code Complexity Analysis
    console.log('\n5️⃣ Testing Enhanced Code Complexity Analysis...');
    try {
      const log = await server.git.log({ '--max-count': 10 });
      const storyKeys = [];
      
      log.all.forEach(commit => {
        const matches = commit.message.match(/([A-Z]+-\d+)/g);
        if (matches) {
          storyKeys.push(...matches);
        }
      });
      
      if (storyKeys.length > 0) {
        const uniqueStoryKeys = [...new Set(storyKeys)].slice(0, 2);
        console.log(`Analyzing complexity for: ${uniqueStoryKeys.join(', ')}`);
        
        const complexityResult = await server.analyzeCodeComplexity({
          storyKeys: uniqueStoryKeys,
          includeMetrics: true,
          includeFileTypes: ['.js', '.ts', '.java', '.py']
        });
        console.log('✅ Enhanced Code Complexity Analysis:');
        console.log(complexityResult.content[0].text);
      } else {
        console.log('⚠️ No story keys found. Testing with dummy data...');
        
        const complexityResult = await server.analyzeCodeComplexity({
          storyKeys: ['TEST-123'],
          includeMetrics: true,
          includeFileTypes: ['.js', '.ts', '.java', '.py']
        });
        console.log('✅ Enhanced Code Complexity Analysis (with test data):');
        console.log(complexityResult.content[0].text);
      }
    } catch (error) {
      console.log(`❌ Enhanced Code Complexity Analysis failed: ${error.message}\n`);
    }

    console.log('\n🎉 Enhanced Analysis Testing Complete!');
    console.log('\n📋 Summary of New Features:');
    console.log('✅ Developer Performance Analysis - Analyzes commit patterns and story completion efficiency');
    console.log('✅ Story Complexity Statistics - Detailed metrics on code changes and file complexity');
    console.log('✅ Developer Recommendations - Suggests suitable developers based on performance and skills');
    console.log('✅ Enhanced Code Complexity - Advanced analysis with file type breakdowns');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedAnalysis();











