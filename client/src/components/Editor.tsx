import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Pilcrow,
  List,
  ListOrdered,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { DocumentService } from '../services/api';
import { SocketService } from '../services/socket';
import { useUser } from '../context/UserContext';

interface EditorProps {
  documentId: string;
  initialContent: string;
  isReadOnly: boolean;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onPermissionError?: () => void;
}

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

export const Editor: React.FC<EditorProps> = ({
  documentId,
  initialContent,
  isReadOnly,
  onSaveStatusChange,
  onPermissionError,
}) => {
  const { currentUser } = useUser();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Refs for tracking state without stale closures
  const latestContentRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Flag to prevent infinite broadcast loops on remote updates
  const isRemoteUpdateRef = useRef<boolean>(false);

  const updateStatus = useCallback(
    (status: SaveStatus) => {
      setSaveStatus(status);
      if (onSaveStatusChange) {
        onSaveStatusChange(status);
      }
    },
    [onSaveStatusChange]
  );

  const parseContent = (contentStr: string) => {
    try {
      if (!contentStr) return '';
      return JSON.parse(contentStr);
    } catch {
      return contentStr;
    }
  };

  // Perform database persistence network call
  const executeSave = useCallback(async () => {
    if (isReadOnly || !latestContentRef.current) return;
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    pendingSaveRef.current = false;
    updateStatus('saving');

    const contentToSave = latestContentRef.current;

    try {
      await DocumentService.updateDocument(documentId, {
        content: contentToSave,
      });

      isSavingRef.current = false;

      if (pendingSaveRef.current || latestContentRef.current !== contentToSave) {
        pendingSaveRef.current = false;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          executeSave();
        }, 800);
      } else {
        updateStatus('saved');
      }
    } catch (err: any) {
      console.error('Failed to autosave document:', err);
      isSavingRef.current = false;
      updateStatus('error');
      if (err.response?.status === 403 && onPermissionError) {
        onPermissionError();
      }
    }
  }, [documentId, isReadOnly, updateStatus, onPermissionError]);

  // Schedule debounced database autosave (800ms)
  const scheduleAutosave = useCallback(
    (jsonContent: any) => {
      latestContentRef.current = jsonContent;
      updateStatus('dirty');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        executeSave();
      }, 800);
    },
    [executeSave, updateStatus]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your document here...',
      }),
    ],
    content: parseContent(initialContent),
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;

      // CRITICAL LOOP PREVENTION: Ignore remote updates so we don't rebroadcast or duplicate save
      if (isRemoteUpdateRef.current) {
        return;
      }

      const jsonContent = editor.getJSON();

      // Broadcast live change to Socket.IO room collaborators
      if (currentUser?.id) {
        SocketService.emitUpdate(documentId, currentUser.id, { content: jsonContent });
      }

      // Schedule debounced database autosave
      scheduleAutosave(jsonContent);
    },
  });

  // Handle incoming remote updates from Socket.IO
  useEffect(() => {
    if (!editor) return;

    const unsubscribeRemote = SocketService.onUpdate((data) => {
      if (data.documentId === documentId && data.content) {
        isRemoteUpdateRef.current = true;
        try {
          editor.commands.setContent(data.content, false);
        } catch (e) {
          console.error('Error applying remote content update to TipTap:', e);
        } finally {
          // Reset flag after microtask to ensure loop prevention
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 100);
        }
      }
    });

    return () => {
      unsubscribeRemote();
    };
  }, [documentId, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Initializing TipTap editor...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] my-4">
      {/* Editor Toolbar & Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 select-none">
        {/* Formatting Toolbar */}
        {!isReadOnly ? (
          <div className="flex items-center space-x-1 flex-wrap gap-y-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('bold') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('italic') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('underline') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1.5" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('paragraph') && !editor.isActive('heading') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Normal Paragraph"
            >
              <Pilcrow className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1.5" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('bulletList') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-200 transition ${
                editor.isActive('orderedList') ? 'bg-slate-200 text-blue-600 font-bold' : ''
              }`}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>View Only Mode</span>
          </div>
        )}

        {/* Debounced Autosave Status Badge */}
        <div className="flex items-center space-x-2 text-xs font-medium">
          {saveStatus === 'dirty' && (
            <div className="flex items-center text-amber-600 space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved</span>
            </div>
          )}
          {saveStatus === 'saving' && (
            <div className="flex items-center text-blue-600 space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center text-emerald-600 space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-rose-600 space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Error saving</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-white cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
