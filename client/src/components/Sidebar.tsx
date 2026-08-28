import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, Folder, Users, Plus, Upload, Layers } from 'lucide-react';
import { DocumentService } from '../services/api.js';
import { UserSwitcher } from './UserSwitcher.js';
import { ImportModal } from './ImportModal.js';

interface SidebarProps {
  activeTab?: 'my' | 'shared';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab = 'my' }) => {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDocument = async () => {
    try {
      setIsCreating(true);
      const newDoc = await DocumentService.createDocument('Untitled Document');
      navigate(`/documents/${newDoc.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create new document. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between h-screen border-r border-slate-800 p-4 shrink-0 select-none">
      {/* Top Header & Actions */}
      <div className="space-y-6">
        {/* App Logo */}
        <NavLink to="/" title="Change Persona" className="flex items-center space-x-3 px-2 pt-2 hover:opacity-80 transition">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none">DocFlow</h1>
            <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Workspace</span>
          </div>
        </NavLink>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-md shadow-blue-600/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'New Document'}</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium py-2.5 px-4 rounded-xl border border-slate-800 transition active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1 pt-2">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace Views
          </div>

          <NavLink
            to="/dashboard?view=my"
            className={() =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'my'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            <Folder className="w-4 h-4 text-blue-400" />
            <span>My Documents</span>
          </NavLink>

          <NavLink
            to="/dashboard?view=shared"
            className={() =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'shared'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Shared With Me</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer Demo User Selector */}
      <div className="pt-4 border-t border-slate-800">
        <UserSwitcher />
      </div>

      {/* File Import Modal */}
      {isImportModalOpen && (
        <ImportModal onClose={() => setIsImportModalOpen(false)} />
      )}
    </aside>
  );
};
