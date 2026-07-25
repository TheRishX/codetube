import React, { useState } from 'react';
import { Plus, Clock, Trash2, Edit2, Check, Search, StickyNote, Sparkles } from 'lucide-react';
import { VideoNote } from '../types';
import { formatDuration } from '../lib/youtube';
import { saveNoteToFirestore, deleteNoteFromFirestore } from '../lib/firebase';

interface NotesPanelProps {
  videoId: string;
  notes: VideoNote[];
  getCurrentTimeSeconds: () => number;
  onJumpToTimestamp: (seconds: number) => void;
  onNotesChanged: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  videoId,
  notes,
  getCurrentTimeSeconds,
  onJumpToTimestamp,
  onNotesChanged,
}) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setIsSaving(true);
    try {
      const currentTime = Math.floor(getCurrentTimeSeconds() || 0);
      const noteId = `note-${Date.now()}`;

      await saveNoteToFirestore({
        id: noteId,
        videoId,
        content: newNoteContent.trim(),
        timestamp: currentTime,
      });

      setNewNoteContent('');
      onNotesChanged();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNoteFromFirestore(id);
      onNotesChanged();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleStartEdit = (note: VideoNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (note: VideoNote) => {
    if (!editContent.trim()) return;
    try {
      await saveNoteToFirestore({
        ...note,
        content: editContent.trim(),
      });
      setEditingNoteId(null);
      onNotesChanged();
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Video Notes ({notes.length})
          </h3>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Personal Study Notes
        </span>
      </div>

      {/* Note Input Form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Take a note (e.g. key algorithm step, command, or formula)..."
          rows={3}
          className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all resize-none"
        />
        <div className="flex justify-end items-center">
          <button
            type="submit"
            disabled={!newNoteContent.trim() || isSaving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        </div>
      </form>

      {/* Notes Search Filter */}
      {notes.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 outline-hidden"
          />
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {filteredNotes.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 italic">
            No notes taken for this video yet. Add your first note above!
          </p>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-700/60 space-y-2 group transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <StickyNote className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Note</span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {editingNoteId === note.id ? (
                    <button
                      onClick={() => handleSaveEdit(note)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg"
                      title="Save note"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border dark:bg-gray-800 dark:text-white"
                  rows={2}
                />
              ) : (
                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
