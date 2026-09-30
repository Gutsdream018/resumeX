import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Don't flood logs with periodic uptime health check pings
  if (req.path === '/api/health') {
    return next();
  }

  const start = Date.now();
  const method = req.method;
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const isError = status >= 400;

    const logLine = `[${new Date().toISOString()}] ${method} ${path} -> ${status} (${duration}ms)`;

    if (isError) {
      console.warn(`⚠️  ${logLine}`);
    } else if (process.env.NODE_ENV !== 'production' || duration > 500) {
      console.log(`ℹ️  ${logLine}`);
    }
  });

  next();
}
