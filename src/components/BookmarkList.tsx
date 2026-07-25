import React, { useState } from 'react';
import { Bookmark, Clock, Plus, Trash2, Tag, X } from 'lucide-react';
import { VideoBookmark } from '../types';
import { formatDuration } from '../lib/youtube';
import { saveBookmarkToFirestore, deleteBookmarkFromFirestore } from '../lib/firebase';

interface BookmarkListProps {
  videoId: string;
  bookmarks: VideoBookmark[];
  getCurrentTimeSeconds: () => number;
  onJumpToTimestamp: (seconds: number) => void;
  onBookmarksChanged: () => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  videoId,
  bookmarks,
  getCurrentTimeSeconds,
  onJumpToTimestamp,
  onBookmarksChanged,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsSaving(true);
    try {
      const time = Math.floor(getCurrentTimeSeconds() || 0);
      const bmId = `bm-${Date.now()}`;

      await saveBookmarkToFirestore({
        id: bmId,
        videoId,
        timestamp: time,
        label: label.trim(),
        note: note.trim(),
      });

      setLabel('');
      setNote('');
      setIsOpenModal(false);
      onBookmarksChanged();
    } catch (err) {
      console.error('Failed to save bookmark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteBookmarkFromFirestore(id);
      onBookmarksChanged();
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Bookmarks ({bookmarks.length})
          </h3>
        </div>

        <button
          onClick={() => setIsOpenModal(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bookmark</span>
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {bookmarks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 italic">
            No bookmarks saved yet. Click "Add Bookmark" to flag key moments!
          </p>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200/80 dark:border-gray-700/60 hover:border-amber-400/50 transition-all group"
            >
              <div
                onClick={() => onJumpToTimestamp(bm.timestamp)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDuration(bm.timestamp)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {bm.label}
                  </p>
                  {bm.note && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {bm.note}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteBookmark(bm.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-70 group-hover:opacity-100 transition-opacity"
                title="Delete bookmark"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Bookmark Modal Dialog */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                Add Bookmark at {formatDuration(Math.floor(getCurrentTimeSeconds()))}
              </h4>
              <button onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBookmark} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bookmark Title *
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. System Design Architecture Diagram"
                  className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Short Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Notice load balancer configuration"
                  className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !label.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
