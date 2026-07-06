import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

// Force Node.js to UTC — all new Date() / date math uses UTC
process.env.TZ = 'UTC';

import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 API Server running on port ${PORT}`);
  const brevoKey = process.env.BREVO_API_KEY;
  console.log(`📧 Email service: ${brevoKey ? 'configured' : 'MISSING API KEY'}`);
  console.log(`=================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
export default server;
