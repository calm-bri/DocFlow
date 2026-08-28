import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { UserService } from '../services/api.js';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('docflow_active_user', JSON.stringify(user));
  };

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await UserService.getUsers();
        setUsers(fetchedUsers);

        // Check stored user
        const storedUserJson = localStorage.getItem('docflow_active_user');
        if (storedUserJson) {
          try {
            const parsed = JSON.parse(storedUserJson);
            const exists = fetchedUsers.find((u) => u.id === parsed.id);
            if (exists) {
              setCurrentUserState(exists);
            } else if (fetchedUsers.length > 0) {
              setCurrentUser(fetchedUsers[0]);
            }
          } catch {
            if (fetchedUsers.length > 0) setCurrentUser(fetchedUsers[0]);
          }
        } else if (fetchedUsers.length > 0) {
          // Default to Alice Johnson
          setCurrentUser(fetchedUsers[0]);
        }
      } catch (err) {
        console.error('Failed to load demo users:', err);
        setError('Failed to fetch demo users. Make sure server is running.');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, users, setCurrentUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
