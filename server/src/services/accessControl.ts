import { prisma } from '../db';
import { EffectivePermission } from '../types';

export interface AccessCheckResult {
  permission: EffectivePermission;
  document: any | null;
}

/**
 * Calculates effective permission for a given user and document ID.
 * Returns:
 * - 'OWNER': If user is document owner.
 * - 'EDITOR': If shared with EDITOR access.
 * - 'VIEWER': If shared with VIEWER access.
 * - null: If document does not exist or user has no access.
 */
export async function getDocumentAccess(
  userId: string,
  documentId: string
): Promise<AccessCheckResult> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      accesses: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!document) {
    return { permission: null, document: null };
  }

  if (document.ownerId === userId) {
    return { permission: 'OWNER', document };
  }

  const sharedAccess = document.accesses.find((acc) => acc.userId === userId);
  if (sharedAccess) {
    return {
      permission: sharedAccess.permission as EffectivePermission,
      document,
    };
  }

  return { permission: null, document };
}

// Reusable Helper Functions
export function canRead(permission: EffectivePermission): boolean {
  return permission === 'OWNER' || permission === 'EDITOR' || permission === 'VIEWER';
}

export function canEdit(permission: EffectivePermission): boolean {
  return permission === 'OWNER' || permission === 'EDITOR';
}

export function canRename(permission: EffectivePermission): boolean {
  return permission === 'OWNER';
}

export function canShare(permission: EffectivePermission): boolean {
  return permission === 'OWNER';
}

export function canDelete(permission: EffectivePermission): boolean {
  return permission === 'OWNER';
}
