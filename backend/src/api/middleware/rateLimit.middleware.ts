import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.maxRequests || 45; // 45 requests per window
  const message = options.message || 'Too many requests from this IP. Please try again later.';

  const ipMap = new Map<string, RateLimitRecord>();

  // Cleanup stale records periodically
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (now > record.resetTime) {
        ipMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Exempt health checks and sample queries
    if (req.path === '/health' || req.path === '/api/health' || req.originalUrl?.includes('/health') || req.path.startsWith('/sample-resumes')) {
      return next();
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const record = ipMap.get(clientIp);

    if (!record || now > record.resetTime) {
      ipMap.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        success: false,
        status: 'rate_limited',
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
    return next();
  };
}
