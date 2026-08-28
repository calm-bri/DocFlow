import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ShareModal } from '../components/ShareModal';
import { useUser } from '../context/UserContext';
import { DocumentService } from '../services/api';
import { DocumentItem } from '../types/index';
import {
  FileText,
  Clock,
  Share2,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get('view') === 'shared' ? 'shared' : 'my';
  const { currentUser } = useUser();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharingDoc, setSharingDoc] = useState<DocumentItem | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeView === 'shared') {
        const data = await DocumentService.getSharedDocuments();
        setDocuments(data);
      } else {
        const data = await DocumentService.getOwnedDocuments();
        setDocuments(data);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.response?.data?.error || 'Failed to load documents. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeView, currentUser?.id]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeView} />

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeView === 'my' ? 'My Documents' : 'Shared With Me'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeView === 'my'
                ? 'Documents created and owned by you'
                : 'Documents shared with you by team members'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={fetchDocuments}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition border border-slate-200"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchDocuments}
                className="text-xs font-semibold underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Loading workspace documents...</p>
            </div>
          ) : documents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-3xl shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeView === 'my' ? 'No owned documents yet' : 'No shared documents'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeView === 'my'
                    ? 'Get started by creating a new document or uploading a file.'
                    : 'Documents shared by Alice, Bob, or Carol will appear here.'}
                </p>
              </div>

              {activeView === 'my' && (
                <button
                  type="button"
                  onClick={async () => {
                    const doc = await DocumentService.createDocument();
                    navigate(`/documents/${doc.id}`);
                  }}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-2.5 px-5 rounded-xl shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Document</span>
                </button>
              )}
            </div>
          ) : (
            /* Document Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => {
                const isOwner = doc.ownerId === currentUser?.id;
                const ownerName = doc.owner?.name || 'Unknown Owner';

                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400/60 p-6 shadow-sm hover:shadow-xl transition duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                  >
                    {/* Top Info */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                          <FileText className="w-5 h-5" />
                        </div>

                        {/* Ownership / Shared Badge */}
                        {isOwner ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Owned by you
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Shared by {ownerName} {doc.myPermission ? `(${doc.myPermission})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Document Title */}
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition truncate">
                        {doc.title}
                      </h3>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Updated {formatDate(doc.updatedAt)}</span>
                      </div>

                      {/* Share Button (Only for Owners) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingDoc(doc);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition"
                          title="Share Document"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {sharingDoc && (
        <ShareModal
          document={sharingDoc}
          onClose={() => setSharingDoc(null)}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
};
