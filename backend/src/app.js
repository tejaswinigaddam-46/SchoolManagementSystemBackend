const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { rateLimiter } = require('./middleware/rateLimiter');
const { healthCheck } = require('./config/database'); // Import at startup

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

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

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',      // Standard React dev server
  'http://localhost:3001',      // Alternative React dev server
  'http://localhost:5173',      // Vite dev server default
  'http://localhost:4173',      // Vite preview server
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://*.localhost:3000',
  'http://*.localhost:3001',
  'http://*.localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check for exact matches first
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check for subdomain patterns in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      // Allow localhost with common ports
      if (origin.match(/^http:\/\/localhost:(3000|3001|5173|4173)$/)) {
        return callback(null, true);
      }
      
      // Allow 127.0.0.1 with common ports
      if (origin.match(/^http:\/\/127\.0\.0\.1:(3000|3001|5173|4173)$/)) {
        return callback(null, true);
      }
      
      // Allow *.localhost.com with common ports for subdomain routing
      if (origin.match(/^http:\/\/[a-z0-9-]+\.localhost\.com:(3000|3001|5173|4173)$/)) {
        return callback(null, true);
      }
    }
    
    // In production, allow subdomain patterns for your domain
    if (process.env.NODE_ENV === 'production') {
      if (origin.match(/^https:\/\/[a-z0-9-]+\.smartschool\.com$/)) {
        return callback(null, true);
      }
    }
    
    console.warn('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-School-ID', 'X-Tenant-Subdomain', 'X-Subdomain']
}));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(rateLimiter);

// Cookie parser middleware (for refresh tokens)
app.use(cookieParser());

// Body parsing middleware
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
