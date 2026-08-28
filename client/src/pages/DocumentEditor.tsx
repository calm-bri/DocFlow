import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Editor, SaveStatus } from '../components/Editor';
import { ShareModal } from '../components/ShareModal';
import { Collaborators } from '../components/Collaborators';
import { useUser } from '../context/UserContext';
import { DocumentService } from '../services/api';
import { SocketService, CollaboratorUser } from '../services/socket';
import { DocumentItem } from '../types/index';
import {
  ArrowLeft,
  Share2,
  Edit2,
  Check,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DocumentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Collaborators Presence State
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([]);

  // Title Editing & Autosave State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [headerSaveStatus, setHeaderSaveStatus] = useState<SaveStatus>('saved');

  const titleDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await DocumentService.getDocumentById(id);
      setDocument(data);
      setTitleInput(data.title);
    } catch (err: any) {
      console.error('Failed to fetch document:', err);
      if (err.response?.status === 403) {
        setError('Unauthorized Access: You do not have permission to view or edit this document.');
      } else if (err.response?.status === 404) {
        setError('Document Not Found: The document you are looking for does not exist.');
      } else {
        setError('Failed to load document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id, currentUser?.id]);

  // Socket.IO Document Room & Presence Handler
  useEffect(() => {
    if (!id || !currentUser?.id || error) return;

    // Request backend authorization to join document room
    SocketService.joinRoom(id, currentUser.id);

    // Listen for room presence updates
    const unsubPresence = SocketService.onPresence((data) => {
      if (data.documentId === id) {
        setCollaborators(data.collaborators || []);
      }
    });

    // Listen for remote title updates
    const unsubUpdate = SocketService.onUpdate((data) => {
      if (data.documentId === id && data.title !== undefined) {
        setTitleInput(data.title);
        setDocument((prev) => (prev ? { ...prev, title: data.title as string } : null));
      }
    });

    // Listen for socket errors (e.g. unauthorized room join)
    const unsubError = SocketService.onError((data) => {
      console.warn('Socket error:', data.error);
    });

    return () => {
      unsubPresence();
      unsubUpdate();
      unsubError();
      SocketService.leaveRoom(id);
    };
  }, [id, currentUser?.id, error]);

  const executeTitleSave = useCallback(
    async (newTitle: string) => {
      if (!id || !document) return;
      setHeaderSaveStatus('saving');
      try {
        const updated = await DocumentService.updateDocument(id, {
          title: newTitle.trim(),
        });
        setDocument(updated);
        setHeaderSaveStatus('saved');
      } catch (err) {
        console.error('Failed to autosave title:', err);
        setHeaderSaveStatus('error');
      }
    },
    [id, document]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    setHeaderSaveStatus('dirty');

    // Broadcast title change to collaborators
    if (id && currentUser?.id) {
      SocketService.emitUpdate(id, currentUser.id, { title: val });
    }

    if (titleDebounceTimerRef.current) {
      clearTimeout(titleDebounceTimerRef.current);
    }

    titleDebounceTimerRef.current = setTimeout(() => {
      if (val.trim()) {
        executeTitleSave(val.trim());
      }
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (titleDebounceTimerRef.current) {
        clearTimeout(titleDebounceTimerRef.current);
      }
    };
  }, []);

  const isOwner = document?.ownerId === currentUser?.id;
  const isReadOnly = document?.userPermission === 'VIEWER';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {document && !loading && (
              <div className="min-w-0 flex items-center space-x-3">
                {/* Title Display or Inline Renaming */}
                {isEditingTitle && isOwner ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={handleTitleChange}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      autoFocus
                      className="text-lg font-bold text-slate-900 bg-slate-50 px-3 py-1 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 truncate">
                    <h2
                      onClick={() => isOwner && setIsEditingTitle(true)}
                      className={`text-lg font-bold text-slate-900 truncate ${
                        isOwner ? 'cursor-pointer hover:text-blue-600 transition' : ''
                      }`}
                      title={isOwner ? 'Click to rename document' : document.title}
                    >
                      {document.title}
                    </h2>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                        title="Rename Document"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Role / Permission Badge */}
                <div className="shrink-0">
                  {isOwner ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Owner
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      document.userPermission === 'EDITOR'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {document.userPermission} Access
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Header Right Actions & Collaboration Presence */}
          {document && !loading && (
            <div className="flex items-center space-x-4">
              {/* Real-time Connection Badge & Collaborators Avatars */}
              <Collaborators collaborators={collaborators} />

              {/* Share Button (Only visible to Document Owner) */}
              {isOwner && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl shadow-sm text-sm transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-5xl w-full mx-auto flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Loading document content...</p>
            </div>
          ) : error ? (
            /* Permission / Error Banner */
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{error}</p>
              </div>

              <div className="pt-2 flex flex-col w-full space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : document ? (
            <Editor
              documentId={document.id}
              initialContent={document.content}
              isReadOnly={isReadOnly}
              onSaveStatusChange={(status) => setHeaderSaveStatus(status)}
              onPermissionError={fetchDocument}
            />
          ) : null}
        </div>
      </main>

      {/* Share Modal */}
      {isShareModalOpen && document && (
        <ShareModal
          document={document}
          onClose={() => setIsShareModalOpen(false)}
          onSuccess={fetchDocument}
        />
      )}
    </div>
  );
};
