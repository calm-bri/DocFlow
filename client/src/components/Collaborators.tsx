import React, { useEffect, useState } from 'react';
import {
  CollaboratorUser,
  ConnectionStatus,
  subscribeConnectionStatus,
} from '../services/socket';
import { useUser } from '../context/UserContext';
import { Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface CollaboratorsProps {
  collaborators: CollaboratorUser[];
}

export const Collaborators: React.FC<CollaboratorsProps> = ({ collaborators }) => {
  const { currentUser } = useUser();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const unsubscribe = subscribeConnectionStatus((status) => {
      setConnStatus(status);
    });
    return unsubscribe;
  }, []);

  const getAvatarBg = (name: string) => {
    if (name.includes('Alice')) return 'bg-blue-600 text-white';
    if (name.includes('Bob')) return 'bg-indigo-600 text-white';
    if (name.includes('Carol')) return 'bg-purple-600 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Live Socket Connection Badge */}
      <div
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
          connStatus === 'connected'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : connStatus === 'reconnecting'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
        title={`Real-Time Socket Status: ${connStatus}`}
      >
        {connStatus === 'connected' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live</span>
          </>
        )}
        {connStatus === 'reconnecting' && (
          <>
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            <span>Reconnecting...</span>
          </>
        )}
        {connStatus === 'disconnected' && (
          <>
            <WifiOff className="w-3 h-3 text-slate-400" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Active Collaborator Avatar Initials */}
      {collaborators.length > 0 && (
        <div className="flex items-center -space-x-2 overflow-hidden">
          {collaborators.map((c) => {
            const isMe = c.id === currentUser?.id;
            return (
              <div
                key={c.id}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm transition hover:scale-110 cursor-pointer ${getAvatarBg(
                  c.name
                )}`}
                title={`${c.name} (${c.permission}) ${isMe ? '— You' : ''}`}
              >
                {c.name.charAt(0)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
