const { Pool } = require('pg');
const config = require('./index');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.username,
  password: config.database.password,
  ssl: config.database.ssl,
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idle,
});

// Database connection test function
const testDatabaseConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    
    // Test with a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('✅ Database connection successful!');
    
    // Test table existence (optional - you can add your main tables here)
    try {
      await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      console.log('✅ Database schema accessible');
    } catch (schemaError) {
      console.warn('⚠️  Schema check failed (this might be normal for new databases):', schemaError.message);
    }
    
    client.release();
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'Unknown'}`);
    
    // Provide helpful error messages based on error codes
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('💡 Suggestion: Make sure PostgreSQL is running and accepting connections');
        break;
      case 'ENOTFOUND':
        console.error('💡 Suggestion: Check if the database host is correct');
        break;
      case '28P01':
        console.error('💡 Suggestion: Check username and password');
        break;
      case '3D000':
        console.error('💡 Suggestion: Check if the database exists');
        break;
      default:
        console.error('💡 Suggestion: Check your database configuration and network connectivity');
    }
    
    return false;
  }
};

// Initialize database connection with retry logic
const initializeDatabase = async (retries = 3, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`\n🔄 Database connection attempt ${attempt}/${retries}`);
    
    const success = await testDatabaseConnection();
    
    if (success) {
      console.log('🎉 Database initialization completed successfully!\n');
      return true;
    }
    
    if (attempt < retries) {
      console.log(`⏳ Retrying in ${delay/1000} seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('💥 Failed to connect to database after all retry attempts');
  console.error('🛑 Server startup aborted due to database connection failure\n');
  return false;
};

// Pool event handlers
pool.on('connect', (client) => {
  console.log(`🔗 New client ${client.processID} connected to database pool`);
});

pool.on('acquire', (client) => {
  console.log('📤 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('📥 Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  console.error('🔄 Attempting to recover database connection...');
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down database connections...');
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Health check function for monitoring
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

module.exports = {
  pool,
  testDatabaseConnection,
  initializeDatabase,
  healthCheck,
  gracefulShutdown
};