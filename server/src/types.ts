import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export type EffectivePermission = 'OWNER' | 'EDITOR' | 'VIEWER' | null;
