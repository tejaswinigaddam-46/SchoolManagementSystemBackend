const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const Joi = require('joi');

// Load environment variables based on NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); 
}

// Environment Variables Schema
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5001),
  HOST: Joi.string().default('localhost'),
  FRONTEND_URL: Joi.string().required().description('Frontend application URL'),
  DB_HOST: Joi.string().required().description('Database host name'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required().description('Database name'),
  DB_USERNAME: Joi.string().required().description('Database username'),
  DB_PASSWORD: Joi.string().allow('').default('').description('Database password'),
  DB_SSL: Joi.boolean().default(false),
  JWT_SECRET: Joi.string().required().min(32).description('JWT secret key (min 32 chars)'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://10.0.2.2:3001'),
  UPLOAD_PATH: Joi.string().default('./uploads'),
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  server: {
    port: envVars.PORT,
    host: envVars.HOST,
    environment: envVars.NODE_ENV,
    frontendUrl: envVars.FRONTEND_URL
  },
  
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    database: envVars.DB_NAME,
    username: envVars.DB_USERNAME,
    password: envVars.DB_PASSWORD,
    ssl: envVars.DB_SSL === 'true' || envVars.DB_SSL === true ? {
      rejectUnauthorized: envVars.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    pool: {
      min: parseInt(envVars.DB_POOL_MIN) || 2,
      max: parseInt(envVars.DB_POOL_MAX) || 10,
      idle: parseInt(envVars.DB_POOL_IDLE) || 10000
    }
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET || envVars.JWT_SECRET,
    expiresIn: envVars.JWT_ACCESS_EXPIRY || '24h',
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRY || '7d',
    issuer: envVars.JWT_ISSUER || 'sms-backend',
    audience: envVars.JWT_AUDIENCE || 'sms-client'
  },

  cors: {
    origin: envVars.CORS_ORIGINS.split(','),
    credentials: true
  },

  rateLimit: {
    windowMs: parseInt(envVars.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(envVars.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests from this IP, please try again later.'
  },

  upload: {
    maxFileSize: parseInt(envVars.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadPath: envVars.UPLOAD_PATH
  },

  email: {
    host: envVars.EMAIL_HOST || 'localhost',
    port: parseInt(envVars.EMAIL_PORT) || 587,
    secure: envVars.EMAIL_SECURE === 'true',
    user: envVars.EMAIL_USER || '',
    password: envVars.EMAIL_PASSWORD || '',
    from: envVars.EMAIL_FROM || 'noreply@sms.com'
  },

  app: {
    name: 'School Management System',
    version: '1.0.0',
    description: 'Multi-tenant School Management System API'
  }
};

module.exports = config;
