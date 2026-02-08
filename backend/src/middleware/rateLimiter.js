const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General rate limiter for all requests
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: config.rateLimit.message,
    type: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use combination of IP and tenant for rate limiting
    return `${req.ip}-${req.tenantId || 'no-tenant'}`;
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 150 * 60 * 1000, // 150 minutes
  max: 10, // limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    type: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    return `auth-${req.ip}-${req.tenantId || 'no-tenant'}`;
  }
});

/**
 * Lenient rate limiter for public endpoints
 */
const publicRateLimiter = rateLimit({
  windowMs: 150 * 60 * 1000, // 150 minutes
  max: 3000, // limit each IP to 300 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    type: 'PUBLIC_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for file upload endpoints
 */
const uploadRateLimiter = rateLimit({
  windowMs: 150 * 60 * 1000, // 150 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.',
    type: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `upload-${req.ip}-${req.userId || 'anonymous'}`;
  }
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  publicRateLimiter,
  uploadRateLimiter
};
