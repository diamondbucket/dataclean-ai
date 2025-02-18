const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

async function startNgrok() {
  try {
    // Connect to backend (Flask default port)
    const backendUrl = await ngrok.connect({
      addr: 5000,
      region: 'in',
    });

    // Connect to frontend (Vite default port)
    const frontendUrl = await ngrok.connect({
      addr: 5173,
      region: 'in',
    });

    console.log('\n=== NGROK URLS ===');
    console.log('Frontend:', frontendUrl);
    console.log('Backend:', backendUrl);

    // Update frontend environment variables
    const envContent = `VITE_API_URL="${backendUrl}"\n`;
    fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), envContent);

    console.log('\nEnvironment variables updated in frontend/.env');
    console.log('Please restart your frontend application to apply changes.\n');

  } catch (error) {
    console.error('Error starting ngrok:', error);
  }
}

startNgrok(); 