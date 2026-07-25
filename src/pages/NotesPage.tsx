import React, { useState } from 'react';
import { Search, Clock, Download, ExternalLink, StickyNote, Bookmark, Trash2 } from 'lucide-react';
import { VideoNote, VideoBookmark, VideoItem } from '../types';
import { formatDuration } from '../lib/youtube';
import { deleteNoteFromFirestore, deleteBookmarkFromFirestore } from '../lib/firebase';
import { EmptyState } from '../components/EmptyState';

interface NotesPageProps {
  notes: VideoNote[];
  bookmarks: VideoBookmark[];
  videos: VideoItem[];
  onSelectVideoAtTime: (video: VideoItem, seconds: number) => void;
  onRefreshData: () => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({
  notes,
  bookmarks,
  videos,
  onSelectVideoAtTime,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'bookmarks'>('all');

  const videoMap = new Map<string, VideoItem>(videos.map((v) => [v.id, v]));

  // Delete note
  const handleDeleteNote = async (id: string) => {
    await deleteNoteFromFirestore(id);
    onRefreshData();
  };

  // Delete bookmark
  const handleDeleteBookmark = async (id: string) => {
    await deleteBookmarkFromFirestore(id);
    onRefreshData();
  };

  // Export Notes to Markdown file
  const handleExportMarkdown = () => {
    let mdContent = `# LearnVerse - My Public Learning Notes & Bookmarks\n\n`;
    mdContent += `Exported on: ${new Date().toLocaleDateString()}\n\n`;

    mdContent += `## Video Notes\n\n`;
    notes.forEach((n) => {
      const v = videoMap.get(n.videoId);
      const title = v ? v.title : 'Unknown Video';
      mdContent += `### [${formatDuration(n.timestamp)}] ${title}\n`;
      mdContent += `${n.content}\n\n`;
    });

    mdContent += `## Bookmarks\n\n`;
    bookmarks.forEach((b) => {
      const v = videoMap.get(b.videoId);
      const title = v ? v.title : 'Unknown Video';
      mdContent += `### [${formatDuration(b.timestamp)}] ${b.label} (${title})\n`;
      if (b.note) mdContent += `*${b.note}*\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LearnVerse_Notes_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
  };

  const filteredNotes = notes.filter((n) => {
    const video = videoMap.get(n.videoId);
    const text = (n.content + (video?.title || '')).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const filteredBookmarks = bookmarks.filter((b) => {
    const video = videoMap.get(b.videoId);
    const text = (b.label + b.note + (video?.title || '')).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Notes & Bookmarks
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            All your timestamped video notes and flagged moments
          </p>
        </div>

        <button
          onClick={handleExportMarkdown}
          disabled={notes.length === 0 && bookmarks.length === 0}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export to Markdown</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or bookmarks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900/50 text-xs text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : ''
            }`}
          >
            All ({notes.length + bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'notes' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : ''
            }`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'bookmarks' ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs' : ''
            }`}
          >
            Bookmarks ({bookmarks.length})
          </button>
        </div>
      </div>

      {/* Grid of Items */}
      {filteredNotes.length === 0 && filteredBookmarks.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No Notes or Bookmarks Found"
          description="You haven't added any timestamped notes or bookmarks yet. Open any video tutorial and click 'Add Note' or 'Add Bookmark'!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeTab === 'all' || activeTab === 'notes') &&
            filteredNotes.map((note) => {
              const video = videoMap.get(note.videoId);
              return (
                <div
                  key={note.id}
                  className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(note.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>

                  {video && (
                    <button
                      onClick={() => onSelectVideoAtTime(video, note.timestamp)}
                      className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <span className="truncate max-w-[220px]">📹 {video.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              );
            })}

          {(activeTab === 'all' || activeTab === 'bookmarks') &&
            filteredBookmarks.map((bm) => {
              const video = videoMap.get(bm.videoId);
              return (
                <div
                  key={bm.id}
                  className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-900/40 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold">
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                        {formatDuration(bm.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteBookmark(bm.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {bm.label}
                    </h4>
                    {bm.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {bm.note}
                      </p>
                    )}
                  </div>

                  {video && (
                    <button
                      onClick={() => onSelectVideoAtTime(video, bm.timestamp)}
                      className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline transition-colors"
                    >
                      <span className="truncate max-w-[220px]">📹 {video.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
