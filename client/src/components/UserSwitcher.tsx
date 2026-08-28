import React, { useState } from 'react';
import { useUser } from '../context/UserContext.js';
import { UserCheck, ChevronDown, Sparkles } from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const { currentUser, users, setCurrentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm border border-slate-800"
        title="Switch Demo User"
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left truncate">
            <div className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
              <span>{currentUser.name}</span>
            </div>
            <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-30 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden py-1">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Demo Persona</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            {users.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    setIsOpen(false);
                    // Refresh current route to trigger fetch with new user header
                    window.location.reload();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                    isSelected ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-sm text-slate-200">{user.name}</div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
