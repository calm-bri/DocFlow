import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { DocumentService } from '../services/api';
import { Permission, DocumentItem } from '../types/index';
import { X, UserPlus, Check, Shield } from 'lucide-react';

interface ShareModalProps {
  document: DocumentItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ document, onClose, onSuccess }) => {
  const { currentUser, users } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permission, setPermission] = useState<Permission>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Available users (exclude document owner)
  const availableUsers = users.filter((u) => u.id !== document.ownerId);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a person to share with');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await DocumentService.shareDocument(document.id, selectedUserId, permission);
      setSuccessMsg('Document successfully shared!');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Share Error:', err);
      setError(err.response?.data?.error || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Share document</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{document.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleShare} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select person
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Choose person --</option>
              {availableUsers.map((u) => {
                const existingAccess = document.accesses?.find((a) => a.userId === u.id);
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) {existingAccess ? `[Current: ${existingAccess.permission}]` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Permission
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPermission('VIEWER')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition ${
                  permission === 'VIEWER'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">Viewer</span>
                <span className="text-[11px] text-slate-500 font-normal mt-0.5">Read-only access</span>
              </button>

              <button
                type="button"
                onClick={() => setPermission('EDITOR')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition ${
                  permission === 'EDITOR'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">Editor</span>
                <span className="text-[11px] text-slate-500 font-normal mt-0.5">Can read & edit</span>
              </button>
            </div>
          </div>

          {/* Currently Shared List */}
          {document.accesses && document.accesses.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Currently Shared With
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {document.accesses.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{acc.user?.name || acc.userId}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                      {acc.permission}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons: Cancel / Share */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
