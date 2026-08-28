import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../db';
import {
  getDocumentAccess,
  canRead,
  canEdit,
  canRename,
  canShare,
} from '../services/accessControl';
import { convertTextToTipTapJson } from '../utils/textToTipTap';

const DEFAULT_DOC_CONTENT = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
  ],
});

export async function getOwnedDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const documents = await prisma.document.findMany({
      where: { ownerId: user.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(documents);
  } catch (error) {
    console.error('Error fetching owned documents:', error);
    return res.status(500).json({ error: 'Failed to fetch owned documents' });
  }
}

export async function getSharedDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const sharedAccesses = await prisma.documentAccess.findMany({
      where: { userId: user.id },
      include: {
        document: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            accesses: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const documents = sharedAccesses.map((access) => ({
      ...access.document,
      myPermission: access.permission,
    }));

    return res.json(documents);
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    return res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
}

export async function createDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { title, content } = req.body;

    const newDoc = await prisma.document.create({
      data: {
        title: typeof title === 'string' && title.trim() ? title.trim() : 'Untitled Document',
        content: content ? (typeof content === 'string' ? content : JSON.stringify(content)) : DEFAULT_DOC_CONTENT,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        accesses: true,
      },
    });

    return res.status(201).json(newDoc);
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { permission, document } = await getDocumentAccess(user.id, id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!canRead(permission)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this document' });
    }

    return res.json({
      ...document,
      userPermission: permission,
    });
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
}

export async function updateDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, content } = req.body;

    const { permission, document } = await getDocumentAccess(user.id, id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!canRead(permission)) {
      return res.status(403).json({ error: 'Access denied: You cannot view or edit this document' });
    }

    // Validation & Permission enforcement
    if (title !== undefined && title !== document.title) {
      if (!canRename(permission)) {
        return res.status(403).json({ error: 'Permission denied: Only the document owner can rename this document' });
      }
    }

    if (content !== undefined) {
      if (!canEdit(permission)) {
        return res.status(403).json({ error: 'Permission denied: Viewers cannot edit document content' });
      }
    }

    const updatedData: any = {};
    if (title !== undefined) updatedData.title = String(title).trim();
    if (content !== undefined) {
      updatedData.content = typeof content === 'string' ? content : JSON.stringify(content);
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updatedData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        accesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return res.json({
      ...updatedDocument,
      userPermission: permission,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
}

export async function shareDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const targetUserId = req.body.userId || req.body.targetUserId;
    const { permission } = req.body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Validation Error: userId is required' });
    }

    if (!permission || (permission !== 'VIEWER' && permission !== 'EDITOR')) {
      return res.status(400).json({ error: 'Validation Error: permission must be VIEWER or EDITOR' });
    }

    const { permission: userPermission, document } = await getDocumentAccess(user.id, id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!canShare(userPermission)) {
      return res.status(403).json({ error: 'Permission denied: Only the document owner can share this document' });
    }

    if (targetUserId === document.ownerId || targetUserId === user.id) {
      return res.status(400).json({ error: 'Validation Error: Cannot share document with yourself' });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user to share with does not exist' });
    }

    // Upsert access record to prevent duplicate entries
    const accessRecord = await prisma.documentAccess.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUserId,
        },
      },
      update: {
        permission,
      },
      create: {
        documentId: id,
        userId: targetUserId,
        permission,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json({
      message: `Document successfully shared with ${targetUser.name}`,
      access: accessRecord,
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    return res.status(500).json({ error: 'Failed to share document' });
  }
}

export async function importDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    let filename = '';
    let rawText = '';

    if (req.file) {
      filename = req.file.originalname;
      rawText = req.file.buffer.toString('utf-8');
    } else if (req.body.filename && req.body.contentText) {
      filename = req.body.filename;
      rawText = req.body.contentText;
    } else {
      return res.status(400).json({ error: 'Validation Error: No file or content text provided' });
    }

    // Validate extension
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      return res.status(400).json({ error: 'Validation Error: Only .txt and .md files are supported' });
    }

    // Validate file size (max 2MB)
    if (Buffer.byteLength(rawText, 'utf-8') > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Validation Error: File size exceeds maximum 2MB limit' });
    }

    // Title from filename (strip extension)
    const title = filename.substring(0, filename.lastIndexOf('.')) || 'Imported Document';
    const structuredContent = convertTextToTipTapJson(rawText, filename);

    const importedDoc = await prisma.document.create({
      data: {
        title,
        content: structuredContent,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        accesses: true,
      },
    });

    return res.status(201).json(importedDoc);
  } catch (error) {
    console.error('Error importing document:', error);
    return res.status(500).json({ error: 'Failed to import document' });
  }
}
