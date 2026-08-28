import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentService } from '../services/api.js';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

      if (ext !== '.txt' && ext !== '.md') {
        setError('Unsupported file format. Please upload a .txt or .md file.');
        setSelectedFile(null);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('File size exceeds maximum 2MB limit.');
        setSelectedFile(null);
        return;
      }

      setError(null);
      setSelectedFile(file);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      const importedDoc = await DocumentService.importDocument(selectedFile);
      onClose();
      navigate(`/documents/${importedDoc.id}`);
    } catch (err: any) {
      console.error('Import Error:', err);
      setError(err.response?.data?.error || 'Failed to import file. Please try again.');
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
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Import Document</h3>
              <p className="text-xs text-slate-500">Convert .txt or .md into rich editor format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleImport} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supported Format Badge */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center space-x-2 text-xs text-blue-800">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Supported file formats: <strong>.txt</strong> and <strong>.md</strong> (Max 2MB)</span>
          </div>

          {/* Upload Drop Zone */}
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl cursor-pointer transition">
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center space-x-2 text-emerald-600 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-700">Click to choose a file</p>
                <p className="text-xs text-slate-400">Plain text or Markdown document</p>
              </div>
            )}
          </label>

          {/* Action Buttons */}
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
              disabled={loading || !selectedFile}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import & Open'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
