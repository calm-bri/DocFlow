import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getDocumentAccess, canRead, canEdit } from './services/accessControl';
import { prisma } from './db';

export interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
}

interface SocketSessionData {
  userId: string;
  documentId: string;
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// In-memory room presence tracking (roomId -> Map<socketId, SocketSessionData>)
const roomPresenceMap = new Map<string, Map<string, SocketSessionData>>();

function getRoomName(documentId: string): string {
  return `document:${documentId}`;
}

function getActiveCollaborators(documentId: string): CollaboratorUser[] {
  const roomName = getRoomName(documentId);
  const socketsMap = roomPresenceMap.get(roomName);
  if (!socketsMap) return [];

  const uniqueUsers = new Map<string, CollaboratorUser>();
  for (const session of socketsMap.values()) {
    if (!uniqueUsers.has(session.userId)) {
      uniqueUsers.set(session.userId, {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        permission: session.permission,
      });
    }
  }
  return Array.from(uniqueUsers.values());
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const clientUrl = process.env.CLIENT_URL || '*';
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST', 'PUT'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;

    // Client requests to join a document room
    socket.on(
      'document:join',
      async (payload: { documentId: string; userId: string }) => {
        const { documentId, userId } = payload || {};

        if (!documentId || !userId) {
          socket.emit('document:error', {
            error: 'Missing documentId or userId in join payload',
          });
          return;
        }

        try {
          // Perform server-side authorization check
          const { permission, document } = await getDocumentAccess(
            userId,
            documentId
          );

          if (!document || !permission || !canRead(permission)) {
            socket.emit('document:error', {
              error:
                'Access denied: You do not have permission to join this document session',
            });
            return;
          }

          // Leave any existing room
          if (currentRoom) {
            socket.leave(currentRoom);
            const prevMap = roomPresenceMap.get(currentRoom);
            if (prevMap) {
              prevMap.delete(socket.id);
              if (prevMap.size === 0) roomPresenceMap.delete(currentRoom);
            }
          }

          // Fetch user details for presence avatar
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
          });

          if (!user) {
            socket.emit('document:error', { error: 'User not found' });
            return;
          }

          const roomName = getRoomName(documentId);
          currentRoom = roomName;
          socket.join(roomName);

          // Store presence data
          if (!roomPresenceMap.has(roomName)) {
            roomPresenceMap.set(roomName, new Map());
          }
          roomPresenceMap.get(roomName)!.set(socket.id, {
            userId,
            documentId,
            permission,
            user,
          });

          // Confirm join to client
          socket.emit('document:joined', {
            documentId,
            permission,
          });

          // Broadcast updated presence to all clients in room
          const collaborators = getActiveCollaborators(documentId);
          io.to(roomName).emit('document:presence', {
            documentId,
            collaborators,
          });
        } catch (error) {
          console.error('Error joining socket room:', error);
          socket.emit('document:error', {
            error: 'Server error during room authorization',
          });
        }
      }
    );

    // Live document update broadcast
    socket.on(
      'document:update',
      async (payload: { documentId: string; userId: string; content?: any; title?: string }) => {
        const { documentId, userId, content, title } = payload || {};
        if (!documentId || !userId || (!content && title === undefined)) return;

        const roomName = getRoomName(documentId);
        const sessionMap = roomPresenceMap.get(roomName);
        const session = sessionMap?.get(socket.id);

        if (!session) {
          socket.emit('document:error', {
            error: 'Unauthorized: You are not in this document room',
          });
          return;
        }

        // Backend permission enforcement: VIEWER cannot broadcast updates
        if (!canEdit(session.permission)) {
          socket.emit('document:error', {
            error: 'Permission denied: Viewers cannot broadcast document changes',
          });
          return;
        }

        // If title is being updated, only OWNER can broadcast title updates
        if (title !== undefined && session.permission !== 'OWNER') {
          socket.emit('document:error', {
            error: 'Permission denied: Only the document owner can rename this document',
          });
          return;
        }

        // Broadcast to all other sockets in room EXCEPT sender
        socket.to(roomName).emit('document:update', {
          documentId,
          content,
          title,
          updatedBy: {
            id: session.user.id,
            name: session.user.name,
          },
        });
      }
    );

    // Client explicitly leaves document room
    socket.on('document:leave', (payload: { documentId: string }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        const sessionMap = roomPresenceMap.get(currentRoom);
        if (sessionMap) {
          sessionMap.delete(socket.id);
          if (sessionMap.size === 0) roomPresenceMap.delete(currentRoom);
        }
        if (payload?.documentId) {
          const collaborators = getActiveCollaborators(payload.documentId);
          io.to(currentRoom).emit('document:presence', {
            documentId: payload.documentId,
            collaborators,
          });
        }
        currentRoom = null;
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      if (currentRoom) {
        const sessionMap = roomPresenceMap.get(currentRoom);
        let docId = '';
        if (sessionMap) {
          const session = sessionMap.get(socket.id);
          if (session) docId = session.documentId;
          sessionMap.delete(socket.id);
          if (sessionMap.size === 0) roomPresenceMap.delete(currentRoom);
        }
        if (docId) {
          const collaborators = getActiveCollaborators(docId);
          io.to(currentRoom).emit('document:presence', {
            documentId: docId,
            collaborators,
          });
        }
      }
    });
  });

  return io;
}
