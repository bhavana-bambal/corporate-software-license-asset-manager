const app = require('./src/app');
const { seedDatabase } = require('./src/utils/seedData');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Ensure initial seed data is loaded on first run
    await seedDatabase(false);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`🚀 Corporate Software License & Asset Manager`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`📦 Mode: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🏢 Default Organization: BharatTech Solutions Ltd`);
      console.log(`💰 Currency: INR (₹)`);
      console.log('====================================================');
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
