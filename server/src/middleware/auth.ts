import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../db';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-Id'];

  if (!userIdHeader || typeof userIdHeader !== 'string') {
    return res.status(401).json({
      error: 'Unauthorized: Missing required X-User-Id header',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userIdHeader.trim() },
    });

    if (!user) {
      return res.status(401).json({
        error: `Unauthorized: Demo user with ID '${userIdHeader}' does not exist`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }
}
