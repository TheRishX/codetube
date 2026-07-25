import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Tag,
  BookOpen,
  Clock,
  Youtube,
  Sparkles,
  MessageSquare,
  Focus,
  Eye,
  EyeOff,
  SkipForward,
  Play,
  ListVideo,
  FileText
} from 'lucide-react';
import { VideoItem, VideoProgress, VideoNote, VideoBookmark } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import { NotesPanel } from '../components/NotesPanel';
import { BookmarkList } from '../components/BookmarkList';
import { FocusVideoChat } from '../components/FocusVideoChat';
import { VideoSummaryPanel } from '../components/VideoSummaryPanel';
import { VideoCard } from '../components/VideoCard';
import { saveProgressToFirestore, updateVideoInFirestore } from '../lib/firebase';

interface WatchVideoPageProps {
  video: VideoItem;
  progress?: VideoProgress;
  notes: VideoNote[];
  bookmarks: VideoBookmark[];
  allVideos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  watchLaterIds?: string[];
  onToggleWatchLater?: (videoId: string) => void;
  onBack: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onNotesChanged: () => void;
  onBookmarksChanged: () => void;
  onProgressChanged: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const WatchVideoPage: React.FC<WatchVideoPageProps> = ({
  video,
  progress,
  notes,
  bookmarks,
  allVideos,
  progressMap,
  watchLaterIds = [],
  onToggleWatchLater,
  onBack,
  onSelectVideo,
  onNotesChanged,
  onBookmarksChanged,
  onProgressChanged,
  isZenMode: externalZenMode,
  onToggleZenMode,
}) => {
  const [internalZenMode, setInternalZenMode] = useState(false);
  const isZenMode = externalZenMode !== undefined ? externalZenMode : internalZenMode;
  const toggleZenMode = onToggleZenMode || (() => setInternalZenMode((prev) => !prev));

  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  const [copiedShare, setCopiedShare] = useState(false);

  const getCurrentTimeRef = useRef<(() => number) | null>(null);
  const playerSeekRef = useRef<((seconds: number) => void) | null>(null);

  // Auto-save progress handler
  const handleProgressUpdate = async (
    watchedSeconds: number,
    totalDuration: number,
    pauseCount?: number,
    activeStudySecondsDelta: number = 0
  ) => {
    const duration = totalDuration || video.duration || 1800;
    const percentage = Math.min(100, Math.round((watchedSeconds / duration) * 100));
    const completionStatus = percentage >= 95 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started';

    const currentActual = progress?.actualStudySeconds || 0;
    const updatedActual = currentActual + activeStudySecondsDelta;

    const updatedProg: VideoProgress = {
      id: video.id,
      videoId: video.id,
      watchedSeconds,
      totalDuration: duration,
      percentageCompleted: percentage,
      completionStatus,
      lastWatchedAt: Date.now(),
      completedAt: percentage >= 95 ? Date.now() : progress?.completedAt || null,
      pausesCount: typeof pauseCount === 'number' ? pauseCount : progress?.pausesCount || 0,
      actualStudySeconds: Math.round(updatedActual),
    };

    try {
      await saveProgressToFirestore(updatedProg, activeStudySecondsDelta);
      if (percentage >= 95 && video.status !== 'completed') {
        await updateVideoInFirestore(video.id, { status: 'completed' });
      } else if (percentage > 0 && video.status === 'not-started') {
        await updateVideoInFirestore(video.id, { status: 'in-progress' });
      }
      onProgressChanged();
    } catch (err) {
      console.error('Failed to update progress in Firestore:', err);
    }
  };

  const handleMarkCompleted = async () => {
    const duration = video.duration || 1800;
    const updatedProg: VideoProgress = {
      id: video.id,
      videoId: video.id,
      watchedSeconds: duration,
      totalDuration: duration,
      percentageCompleted: 100,
      completionStatus: 'completed',
      lastWatchedAt: Date.now(),
      completedAt: Date.now(),
    };

    try {
      await saveProgressToFirestore(updatedProg);
      await updateVideoInFirestore(video.id, { status: 'completed' });
      onProgressChanged();
    } catch (err) {
      console.error('Failed to mark completed:', err);
    }
  };

  const handleJumpToTimestamp = (seconds: number) => {
    if (playerSeekRef.current) {
      playerSeekRef.current(seconds);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  // Find next video in Watch Later queue if available
  const currentQueueIndex = watchLaterIds.indexOf(video.id);
  const nextQueueVideoId = currentQueueIndex !== -1 && currentQueueIndex < watchLaterIds.length - 1
    ? watchLaterIds[currentQueueIndex + 1]
    : watchLaterIds.find((id) => id !== video.id);

  const nextQueueVideo = nextQueueVideoId ? allVideos.find((v) => v.id === nextQueueVideoId) : null;
  const isInWatchLater = watchLaterIds.includes(video.id);

  // Filter related videos in same category
  const relatedVideos = allVideos
    .filter((v) => v.id !== video.id && v.category === video.category)
    .slice(0, 3);

  const videoNotes = notes.filter((n) => n.videoId === video.id);
  const videoBookmarks = bookmarks.filter((b) => b.videoId === video.id);

  const [activeSidebarTab, setActiveSidebarTab] = useState<'summary' | 'notes' | 'bookmarks' | 'chat'>('summary');
  const [showZenControls, setShowZenControls] = useState(true);

  // ESC key listener to exit distraction free mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        toggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, toggleZenMode]);

  // Distraction-Free Theater Mode overlay
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center p-2 sm:p-6 overflow-hidden animate-in fade-in duration-300">
        {/* Floating Hover Controls Top Bar */}
        <div
          onMouseEnter={() => setShowZenControls(true)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-900/90 text-white backdrop-blur-md border border-gray-700/80 shadow-2xl transition-all duration-300 ${
            showZenControls ? 'opacity-100 translate-y-0' : 'opacity-20 hover:opacity-100 translate-y-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">Distraction-Free Mode</span>
          </div>

          <span className="text-gray-500 text-xs">|</span>

          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">Press ESC to exit</span>

          <button
            onClick={toggleZenMode}
            className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Exit Theater</span>
          </button>
        </div>

        {/* Video Player Canvas */}
        <div className="w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <VideoPlayer
            video={video}
            initialProgress={progress}
            onProgressUpdate={handleProgressUpdate}
            onMarkCompleted={handleMarkCompleted}
            isFocusMode={isZenMode}
            onToggleFocusMode={toggleZenMode}
            onGetCurrentTime={(getter) => {
              getCurrentTimeRef.current = getter;
            }}
            onSeekToReady={(seekFn) => {
              playerSeekRef.current = seekFn;
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Zen / Focus Mode Toggle */}
          <button
            onClick={toggleZenMode}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              isZenMode
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
            }`}
          >
            {isZenMode ? <EyeOff className="w-4 h-4" /> : <Focus className="w-4 h-4 text-indigo-500" />}
            <span>{isZenMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
          </button>

          {/* Watch Later Toggle */}
          {onToggleWatchLater && (
            <button
              onClick={() => onToggleWatchLater(video.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isInWatchLater
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{isInWatchLater ? 'In Queue' : 'Watch Later'}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Share video link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedShare ? 'Copied Link!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Watch Later Queue Banner if active */}
      {nextQueueVideo && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <ListVideo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Next in Watch Later Queue
                </span>
                <span className="text-xs text-gray-400">• ({watchLaterIds.length} videos total)</span>
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                {nextQueueVideo.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => onSelectVideo(nextQueueVideo)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 shrink-0 flex items-center gap-1.5 transition-all self-end sm:self-center"
          >
            <SkipForward className="w-4 h-4" />
            <span>Play Next</span>
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column: Player & Video Info */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <VideoPlayer
            video={video}
            initialProgress={progress}
            onProgressUpdate={handleProgressUpdate}
            onMarkCompleted={handleMarkCompleted}
            isFocusMode={isZenMode}
            onToggleFocusMode={toggleZenMode}
            onGetCurrentTime={(getter) => {
              getCurrentTimeRef.current = getter;
            }}
            onSeekToReady={(seekFn) => {
              playerSeekRef.current = seekFn;
            }}
          />

          {/* Video Metadata Box */}
          <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {video.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                    {video.difficulty}
                  </span>
                  {video.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-snug">
                  {video.title}
                </h1>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  Channel: {video.channelName}
                </p>
              </div>
            </div>

            {/* Tags list */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                More in {video.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedVideos.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectVideo(rel)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:border-indigo-500 transition-all"
                  >
                    <img
                      src={rel.thumbnail}
                      alt={rel.title}
                      className="w-full aspect-video rounded-xl object-cover mb-2"
                    />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Unified Interactive Sidebar (Summary, Chat, Notes, Bookmarks) */}
        <div className="lg:col-span-1 space-y-4 min-w-0 sticky top-4">
          {/* Sidebar Mode Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800/90 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveSidebarTab('summary')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSidebarTab === 'summary'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('chat')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSidebarTab === 'chat'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Tutor</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('notes')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSidebarTab === 'notes'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes ({videoNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab('bookmarks')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSidebarTab === 'bookmarks'
                  ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Bookmarks ({videoBookmarks.length})</span>
            </button>
          </div>

          {/* Active Sidebar Tab Content */}
          {activeSidebarTab === 'summary' ? (
            <VideoSummaryPanel
              video={video}
              notes={videoNotes}
              onNotesChanged={onNotesChanged}
            />
          ) : activeSidebarTab === 'chat' ? (
            <FocusVideoChat
              video={video}
              getCurrentTimeSeconds={() => (getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0)}
              onJumpToTimestamp={handleJumpToTimestamp}
              notes={videoNotes}
              onNotesChanged={onNotesChanged}
            />
          ) : activeSidebarTab === 'notes' ? (
            <NotesPanel
              videoId={video.id}
              notes={videoNotes}
              getCurrentTimeSeconds={() => (getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0)}
              onJumpToTimestamp={handleJumpToTimestamp}
              onNotesChanged={onNotesChanged}
            />
          ) : (
            <BookmarkList
              videoId={video.id}
              bookmarks={videoBookmarks}
              getCurrentTimeSeconds={() => (getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0)}
              onJumpToTimestamp={handleJumpToTimestamp}
              onBookmarksChanged={onBookmarksChanged}
            />
          )}
        </div>
      </div>
    </div>
  );
};
