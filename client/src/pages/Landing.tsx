import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Layers, ArrowRight, UserCheck } from 'lucide-react';

export const Landing: React.FC = () => {
  const { users, setCurrentUser } = useUser();
  const navigate = useNavigate();

  const handleSelectUser = (user: any) => {
    setCurrentUser(user);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl text-center space-y-8 z-10">
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-md mb-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-base text-white tracking-tight">DocFlow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            DocFlow
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto font-normal">
            A lightweight collaborative document workspace.
          </p>
        </div>

        {/* Demo User Persona Cards */}
        <div className="space-y-3 text-left max-w-md mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            Select a Demo User Persona
          </div>

          <div className="grid grid-cols-1 gap-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="group p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-2xl transition duration-150 shadow-md flex items-center justify-between text-left active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-base transition shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-100 text-base">{user.name}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-500 group-hover:text-blue-400 transition">
                  <span className="text-xs font-medium hidden sm:inline">Continue as {user.name.split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <div className="text-xs text-slate-500">
          Selected persona persists in <code className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">localStorage</code> and attaches <code className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">X-User-Id</code> to API requests.
        </div>
      </div>
    </div>
  );
};
