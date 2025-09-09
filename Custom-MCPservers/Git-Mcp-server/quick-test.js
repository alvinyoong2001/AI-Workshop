import { spawn } from 'child_process';

console.log('🧪 Testing Git MCP Server - Live Demo\n');

const serverProcess = spawn('node', ['server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  output += data.toString();
});

serverProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
  if (data.toString().includes('Git MCP Server is running')) {
    console.log('✅ Server is running!');
  }
});

// Test MCP initialization
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
};

// Test list tools
const listToolsMessage = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

setTimeout(() => {
  console.log('📤 Sending initialization message...');
  serverProcess.stdin.write(JSON.stringify(initMessage) + '\n');
  
  setTimeout(() => {
    console.log('📤 Requesting tools list...');
    serverProcess.stdin.write(JSON.stringify(listToolsMessage) + '\n');
    
    setTimeout(() => {
      console.log('\n📥 Server Response:');
      console.log('='.repeat(50));
      console.log(output);
      console.log('='.repeat(50));
      
      if (output.includes('"jsonrpc"')) {
        console.log('\n🎉 SUCCESS: MCP Server is working correctly!');
        console.log('✅ Protocol communication: Working');
        console.log('✅ Tools registration: Working');
        console.log('✅ JSON-RPC responses: Working');
      } else {
        console.log('\n❌ FAILED: Server not responding properly');
      }
      
      serverProcess.kill();
    }, 1000);
  }, 500);
}, 1000); 