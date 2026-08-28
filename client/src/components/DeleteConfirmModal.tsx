import React, { useState } from 'react';
import { DocumentService } from '../services/api';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  document: {
    id: string;
    title: string;
  };
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  document,
  onClose,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await DocumentService.deleteDocument(document.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      console.error('Delete document error:', err);
      setError(err.response?.data?.error || 'Failed to delete document. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Delete Document</h3>
              <p className="text-xs text-rose-600 font-medium">Permanent Action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-slate-700 leading-relaxed">
              Are you sure you want to delete <strong className="font-semibold text-slate-900">"{document.title}"</strong>?
            </p>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This will permanently delete this document and immediately revoke access for all collaborators. This action cannot be undone.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
