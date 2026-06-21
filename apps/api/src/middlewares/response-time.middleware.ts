import { Request, Response, NextFunction } from "express";

export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Override res.json to inject x-response-time before sending
  const originalJson = res.json.bind(res);
  res.json = function (body?: unknown) {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader("x-response-time", `${duration}ms`);
    }
    return originalJson(body);
  };

  // Also handle non-json responses (e.g. res.send, res.end)
  const originalSend = res.send.bind(res);
  res.send = function (body?: unknown) {
    if (!res.headersSent) {
      const duration = Date.now() - start;
      res.setHeader("x-response-time", `${duration}ms`);
    }
    return originalSend(body);
  };

  next();
}
