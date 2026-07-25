import React, { useState, useMemo } from 'react';
import {
  Play,
  Plus,
  Search,
  Filter,
  Youtube,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Edit3,
  Trash2,
  Archive,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ListVideo,
  Check,
  Compass
} from 'lucide-react';
import { VideoItem, VideoProgress, Playlist, CATEGORIES } from '../types';
import { VideoCard } from '../components/VideoCard';
import { useGlobalPaste } from '../context/GlobalPasteContext';
import { RECOMMENDED_CS_VIDEOS, RecommendedVideo } from './RecommendationsPage';
import { saveVideoToFirestore } from '../lib/firebase';
import { formatDuration, getYouTubeThumbnail } from '../lib/youtube';

interface DashboardPageProps {
  videos: VideoItem[];
  playlists?: Playlist[];
  progressMap: Record<string, VideoProgress>;
  watchLaterIds?: string[];
  onToggleWatchLater?: (video: VideoItem) => void;
  onPlayAllWatchLater?: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onNavigate: (tab: string) => void;
  onArchiveToggle: (video: VideoItem) => void;
  onDeleteRequest: (video: VideoItem) => void;
  onEditVideoRequest?: (video: VideoItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  videos,
  playlists = [],
  progressMap,
  watchLaterIds = [],
  onToggleWatchLater,
  onPlayAllWatchLater,
  onSelectVideo,
  onNavigate,
  onArchiveToggle,
  onDeleteRequest,
  onEditVideoRequest,
}) => {
  const { openAddVideoModal } = useGlobalPaste();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'progress' | 'duration'>('newest');

  // Watch Later Queue items
  const watchLaterVideos = useMemo(() => {
    return videos.filter((v) => watchLaterIds.includes(v.id));
  }, [videos, watchLaterIds]);

  // Active Playlist to resume
  const resumePlaylistInfo = useMemo(() => {
    if (!playlists || playlists.length === 0) return null;
    
    // Find playlist with lastPlayedVideoId or lastWatchedVideoId
    const pl = playlists.find((p) => p.lastPlayedVideoId || p.lastWatchedVideoId) || playlists[0];
    if (!pl || !pl.videos || pl.videos.length === 0) return null;

    const lastVidId = pl.lastPlayedVideoId || pl.lastWatchedVideoId;
    const activeVid = pl.videos.find((v) => v.id === lastVidId) || pl.videos[0];

    return {
      playlist: pl,
      video: activeVid,
    };
  }, [playlists]);

  // Suggested Videos from Recommendations, filtering out videos already in user's library
  const suggestedVideos = useMemo(() => {
    const userYoutubeIds = new Set(videos.map((v) => v.youtubeId));
    return RECOMMENDED_CS_VIDEOS.filter((rec) => !userYoutubeIds.has(rec.youtubeId)).slice(0, 4);
  }, [videos]);

  const handleQuickAddSuggested = async (rec: RecommendedVideo) => {
    const newVid: VideoItem = {
      id: `vid-rec-${Date.now()}`,
      youtubeId: rec.youtubeId,
      youtubeUrl: rec.youtubeUrl,
      title: rec.title,
      thumbnail: getYouTubeThumbnail(rec.youtubeId),
      channelName: rec.channelName,
      duration: rec.duration,
      category: rec.category,
      difficulty: rec.difficulty,
      tags: rec.tags,
      status: 'in-progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveVideoToFirestore(newVid);
      onSelectVideo(newVid);
    } catch (err) {
      console.error('Failed to add suggested video to library:', err);
    }
  };

  // Filter out archived videos for homepage feed by default unless selected
  const activeVideos = useMemo(() => {
    return videos.filter((v) => (statusFilter === 'archived' ? v.status === 'archived' : v.status !== 'archived'));
  }, [videos, statusFilter]);

  // Apply category, search, status, and sorting
  const filteredVideos = useMemo(() => {
    let result = [...activeVideos];

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((v) => v.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelName.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all' && statusFilter !== 'archived') {
      result = result.filter((v) => {
        const prog = progressMap[v.id]?.percentageCompleted || 0;
        if (statusFilter === 'completed') return v.status === 'completed' || prog === 100;
        if (statusFilter === 'in-progress') return prog > 0 && prog < 100;
        if (statusFilter === 'not-started') return prog === 0;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'progress') {
        const progA = progressMap[a.id]?.percentageCompleted || 0;
        const progB = progressMap[b.id]?.percentageCompleted || 0;
        return progB - progA;
      }
      return 0;
    });

    return result;
  }, [activeVideos, selectedCategory, searchQuery, statusFilter, sortBy, progressMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top YouTube-Style Category Filter Chips Scrollbar */}
      <div className="sticky top-16 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md pt-2 pb-3 border-b border-gray-200/80 dark:border-gray-800/80 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
              selectedCategory === 'All'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Videos ({activeVideos.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = activeVideos.filter((v) => v.category === cat.name).length;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-header Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pasted videos by title, channel or topic..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-hidden transition-all"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not-started">Not Started</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="progress">Highest Progress</option>
              <option value="title">Title (A-Z)</option>
              <option value="duration">Longest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Paste Video Shortcut Button */}
          <button
            onClick={() => openAddVideoModal()}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Paste Link (Cmd+V)</span>
          </button>
        </div>
      </div>

      {/* Resume Playlist Banner (if active playlist exists) */}
      {resumePlaylistInfo && (
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <img
              src={resumePlaylistInfo.playlist.thumbnail || getYouTubeThumbnail(resumePlaylistInfo.video.youtubeId)}
              alt={resumePlaylistInfo.playlist.title}
              className="w-20 aspect-video rounded-2xl object-cover border border-white/20 shadow-md shrink-0 hidden xs:block"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                  Resume Playlist
                </span>
                <span className="text-xs text-indigo-200/80 font-medium">
                  {resumePlaylistInfo.playlist.channelName}
                </span>
              </div>
              <h3 className="text-base font-extrabold line-clamp-1">
                {resumePlaylistInfo.playlist.title}
              </h3>
              <p className="text-xs text-indigo-100/90 line-clamp-1 font-medium">
                Next up: <span className="text-white font-semibold">{resumePlaylistInfo.video.title}</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 self-end sm:self-center shrink-0">
            <button
              onClick={() => onSelectVideo(resumePlaylistInfo.video)}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-indigo-900" />
              <span>Resume Course</span>
            </button>
            <button
              onClick={() => onNavigate('playlists')}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs transition-all"
            >
              All Playlists
            </button>
          </div>
        </div>
      )}

      {/* Watch Later Queue Hero Banner (if videos are in queue) */}
      {watchLaterVideos.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-600/15 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <ListVideo className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider">
                  Watch Later Queue
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {watchLaterVideos.length} {watchLaterVideos.length === 1 ? 'video' : 'videos'} queued
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                Up Next: <span className="text-amber-600 dark:text-amber-400">{watchLaterVideos[0].title}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => onPlayAllWatchLater ? onPlayAllWatchLater() : onSelectVideo(watchLaterVideos[0])}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play All ({watchLaterVideos.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Suggested for You Section (from Recommendations logic, filtering out library videos) */}
      {suggestedVideos.length > 0 && (
        <div className="space-y-3 bg-indigo-50/60 dark:bg-indigo-950/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                Suggested for You
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                Curated CS Courses
              </span>
            </div>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedVideos.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                    <img
                      src={getYouTubeThumbnail(rec.youtubeId)}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono">
                      {formatDuration(rec.duration)}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {rec.channelName}
                  </p>
                </div>

                <button
                  onClick={() => handleQuickAddSuggested(rec)}
                  className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add & Watch</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main YouTube Video Grid Feed */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={progressMap[video.id]}
              isInWatchLater={watchLaterIds.includes(video.id)}
              onToggleWatchLater={onToggleWatchLater}
              onSelect={onSelectVideo}
              onArchiveToggle={onArchiveToggle}
              onDeleteRequest={onDeleteRequest}
              onEditRequest={onEditVideoRequest}
            />
          ))}
        </div>
      ) : (
        /* Empty Feed YouTube State */
        <div className="text-center py-20 bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-8 space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <Youtube className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedCategory !== 'All'
                ? `No videos saved in ${selectedCategory} yet`
                : 'Your CodeTube Feed is empty'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
              Press <span className="font-bold text-red-600">Cmd + V</span> (Mac) or <span className="font-bold text-red-600">Ctrl + V</span> (Windows) anywhere to automatically paste any YouTube video link, or explore curated CS recommendations!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAddVideoModal()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Paste YouTube Link</span>
            </button>

            <button
              onClick={() => onNavigate('recommendations')}
              className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore CS Recommendations</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
