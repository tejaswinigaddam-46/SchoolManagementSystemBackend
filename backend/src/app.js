const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config');

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { rateLimiter } = require('./middleware/rateLimiter');
const { healthCheck } = require('./config/database'); // Import at startup

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS configuration with pre-flight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is explicitly allowed in config
    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow any subdomain of localhost.com on common frontend ports
    if (config.server.environment === 'development') {
      const url = new URL(origin);
      if (url.hostname.endsWith('.localhost.com') || url.hostname === 'localhost') {
        return callback(null, true);
      }
    }
    
    console.warn('CORS blocked origin:', origin);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Tenant-ID', 
    'X-School-ID', 
    'X-Tenant-Subdomain', 
    'X-Subdomain',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200 // Ensure 204/200 status for pre-flight requests
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(rateLimiter);

// Cookie parser middleware (for refresh tokens)
app.use(cookieParser());

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined'));
app.use(requestLogger);

// Note: Tenant resolution middleware is applied per-route basis, not globally
// This allows for more flexible tenant handling

// Optimized health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
      status: dbHealth.status === 'healthy' ? 'OK' : 'Service Unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: { status: 'unhealthy', error: error.message },
      version: '1.0.0'
    });
  }
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
