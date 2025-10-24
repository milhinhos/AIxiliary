import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}
