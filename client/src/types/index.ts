export type Permission = 'VIEWER' | 'EDITOR';
export type EffectivePermission = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface DocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  permission: Permission;
  user: User;
  createdAt?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: User;
  accesses: DocumentAccess[];
  myPermission?: EffectivePermission;
  userPermission?: EffectivePermission;
  createdAt: string;
  updatedAt: string;
}
