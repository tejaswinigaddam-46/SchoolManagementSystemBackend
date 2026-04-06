const app = require('./src/app');
const config = require('./src/config');
const { initializeDatabase, gracefulShutdown } = require('./src/config/database');

const PORT = config.server.port;
// Start server with database connection testing
const startServer = async () => {
  try {
    console.log('🚀 Starting SMS Backend Server...');
    console.log(`📖 Environment: ${config.server.environment}`);
    
    // Test database connection before starting server
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      console.error('💥 Server startup failed due to database connection issues');
      process.exit(1);
    }
    
    // Start the server only if database connection is successful
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ SMS Backend Server started successfully!');
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log('🔥 Server is ready to accept requests!\n');
    });
    // TODO: add server health check
    // Enhanced graceful shutdown
    const shutdown = async (signal) =>{try {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      // Close HTTP server
      server.close(async () => {
        console.log('🛑 HTTP server closed');
        
        // Close database connections
        await gracefulShutdown();
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }};

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch((error) => {
  console.error('💥 Unexpected error during server startup:', error);
  process.exit(1);
});
