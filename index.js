
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Price Checker Backend...');

// Change to backend directory and start the server
const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Backend server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Price Checker Backend...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Price Checker Backend...');
  serverProcess.kill('SIGTERM');
});
