import axios from 'axios';
import { User, DocumentItem, Permission } from '../types/index';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach X-User-Id header from localStorage for all API calls
api.interceptors.request.use((config) => {
  const activeUserJson = localStorage.getItem('docflow_active_user');
  if (activeUserJson) {
    try {
      const activeUser: User = JSON.parse(activeUserJson);
      config.headers['X-User-Id'] = activeUser.id;
      config.headers['x-user-id'] = activeUser.id;
    } catch (e) {
      console.error('Failed to parse active user from localStorage', e);
    }
  }
  return config;
});

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
};

export const DocumentService = {
  getOwnedDocuments: async (): Promise<DocumentItem[]> => {
    const res = await api.get<DocumentItem[]>('/documents');
    return res.data;
  },

  getSharedDocuments: async (): Promise<DocumentItem[]> => {
    const res = await api.get<DocumentItem[]>('/documents/shared');
    return res.data;
  },

  createDocument: async (title?: string, content?: any): Promise<DocumentItem> => {
    const res = await api.post<DocumentItem>('/documents', { title, content });
    return res.data;
  },

  getDocumentById: async (id: string): Promise<DocumentItem> => {
    const res = await api.get<DocumentItem>(`/documents/${id}`);
    return res.data;
  },

  updateDocument: async (
    id: string,
    payload: { title?: string; content?: any }
  ): Promise<DocumentItem> => {
    const res = await api.put<DocumentItem>(`/documents/${id}`, payload);
    return res.data;
  },

  shareDocument: async (
    id: string,
    targetUserId: string,
    permission: Permission
  ): Promise<any> => {
    const res = await api.post(`/documents/${id}/share`, { targetUserId, permission });
    return res.data;
  },

  importDocument: async (file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<DocumentItem>('/documents/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export default api;
