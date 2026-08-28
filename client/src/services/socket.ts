import { io, Socket } from 'socket.io-client';

export interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  permission: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

let socket: Socket | null = null;
const statusListeners = new Set<(status: ConnectionStatus) => void>();

export function getSocket(): Socket {
  if (!socket) {
    // In dev Vite mode, proxy points /api to localhost:4000; connect to origin or localhost:4000
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : window.location.origin);

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      notifyStatusListeners('connected');
    });

    socket.on('disconnect', () => {
      notifyStatusListeners('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      notifyStatusListeners('reconnecting');
    });

    socket.io.on('reconnect', () => {
      notifyStatusListeners('connected');
    });
  }

  return socket;
}

function notifyStatusListeners(status: ConnectionStatus) {
  statusListeners.forEach((listener) => listener(status));
}

export function subscribeConnectionStatus(
  callback: (status: ConnectionStatus) => void
) {
  statusListeners.add(callback);
  // Send current status immediately
  const activeSocket = getSocket();
  callback(activeSocket.connected ? 'connected' : 'disconnected');

  return () => {
    statusListeners.delete(callback);
  };
}

export const SocketService = {
  joinRoom: (documentId: string, userId: string) => {
    const s = getSocket();
    s.emit('document:join', { documentId, userId });
  },

  leaveRoom: (documentId: string) => {
    if (socket) {
      socket.emit('document:leave', { documentId });
    }
  },

  emitUpdate: (documentId: string, userId: string, payload: { content?: any; title?: string }) => {
    const s = getSocket();
    s.emit('document:update', { documentId, userId, ...payload });
  },

  onJoined: (
    callback: (data: { documentId: string; permission: string }) => void
  ) => {
    const s = getSocket();
    s.on('document:joined', callback);
    return () => {
      s.off('document:joined', callback);
    };
  },

  onUpdate: (
    callback: (data: { documentId: string; content?: any; title?: string; updatedBy: { id: string; name: string } }) => void
  ) => {
    const s = getSocket();
    s.on('document:update', callback);
    return () => {
      s.off('document:update', callback);
    };
  },

  onPresence: (
    callback: (data: { documentId: string; collaborators: CollaboratorUser[] }) => void
  ) => {
    const s = getSocket();
    s.on('document:presence', callback);
    return () => {
      s.off('document:presence', callback);
    };
  },

  onError: (callback: (data: { error: string }) => void) => {
    const s = getSocket();
    s.on('document:error', callback);
    return () => {
      s.off('document:error', callback);
    };
  },
};
