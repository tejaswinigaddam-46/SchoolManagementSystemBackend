/**
 * Custom request logger middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - Tenant: ${req.tenantId || 'N/A'}`);
  
  // Override res.end to log response details
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const contentLength = res.get('Content-Length') || (chunk ? chunk.length : 0);
    
    // Log response details
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${contentLength} bytes`);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Detailed API logger for debugging
 */
const apiLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API Request Details:', {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? 'Bearer [HIDDEN]' : 'None',
        'x-tenant-id': req.get('X-Tenant-ID')
      },
      query: req.query,
      params: req.params,
      body: req.method === 'GET' ? 'N/A' : sanitizeBody(req.body),
      ip: req.ip,
      tenantId: req.tenantId,
      userId: req.userId
    });
  }
  
  next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  console.error(`❌ Error in ${req.method} ${req.url}:`, {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    tenant: req.tenantId,
    user: req.userId,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...body };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[HIDDEN]';
    }
  });
  
  return sanitized;
};

module.exports = {
  requestLogger,
  apiLogger,
  errorLogger
};
