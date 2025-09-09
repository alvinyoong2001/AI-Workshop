import { GitMCPServer } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAuthDebug() {
  const server = new GitMCPServer();
  
  try {
    console.log('🔍 Debug Authentication URL Formatting...\n');
    
    // Test URLs
    const testUrls = [
      'https://github.com/octocat/Hello-World.git',
      'https://bitbucket.org/atlassian/aui.git',
      'https://github.com/company/private-repo.git',
      'https://bitbucket.org/company/private-repo.git'
    ];
    
    console.log('📋 Environment Variables:');
    console.log(`- GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`- BITBUCKET_TOKEN: ${process.env.BITBUCKET_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`- BITBUCKET_USERNAME: ${process.env.BITBUCKET_USERNAME ? '✅ Set' : '❌ Not set'}`);
    console.log('');
    
    // Test URL transformation logic
    console.log('🔧 Testing URL Transformation Logic:');
    testUrls.forEach(url => {
      console.log(`\nOriginal URL: ${url}`);
      
      let authenticatedUrl = url;
      const isBitbucket = url.includes('bitbucket.org');
      const isGitHub = url.includes('github.com');
      
      if (isBitbucket) {
        const token = process.env.BITBUCKET_TOKEN;
        const username = process.env.BITBUCKET_USERNAME;
        if (token && username) {
          if (url.startsWith('https://')) {
            authenticatedUrl = url.replace('https://', `https://${username}:${token}@`);
            console.log(`✅ Bitbucket authenticated: ${authenticatedUrl.substring(0, 50)}...`);
          }
        } else {
          console.log(`❌ Missing Bitbucket credentials`);
        }
      } else if (isGitHub) {
        const token = process.env.GITHUB_TOKEN;
        if (token) {
          if (url.startsWith('https://')) {
            authenticatedUrl = url.replace('https://', `https://${token}@`);
            console.log(`✅ GitHub authenticated: ${authenticatedUrl.substring(0, 50)}...`);
          }
        } else {
          console.log(`❌ Missing GitHub token`);
        }
      }
      
      if (authenticatedUrl === url) {
        console.log(`ℹ️  No authentication applied (public repo or missing credentials)`);
      }
    });
    
    console.log('\n✅ Debug test completed');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

testAuthDebug();












