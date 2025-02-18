const { spawn } = require('child_process');
const path = require('path');

// Start Frontend (Vite)
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true
});

frontend.stdout.on('data', (data) => {
  console.log(`Frontend: ${data}`);
});

frontend.stderr.on('data', (data) => {
  console.error(`Frontend Error: ${data}`);
});

// Start Backend (Flask)
const backend = spawn('python', ['app.py'], {
  cwd: path.join(__dirname, 'api'),
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`Backend: ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`Backend Error: ${data}`);
}); 