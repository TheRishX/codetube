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
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ListVideo,
  Check,
  Compass,
  Sliders,
  ArrowLeft,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { VideoItem, VideoProgress, Playlist, CATEGORIES, AppLayoutPreferences, CategoryInfo, isCategoryMatch } from '../types';
import { VideoCard } from '../components/VideoCard';
import { PlaylistCard } from '../components/PlaylistCard';
import { PlaylistDetailModal } from '../components/PlaylistDetailModal';
import { useGlobalPaste } from '../context/GlobalPasteContext';
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
  layoutPreferences?: AppLayoutPreferences;
  onOpenCustomizer?: () => void;
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
  layoutPreferences,
  onOpenCustomizer,
}) => {
  const { openAddVideoModal } = useGlobalPaste();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'oldest' | 'title' | 'progress' | 'duration'>('recent');

  // Ordered and visible categories based on layout preferences
  const activeCategories = useMemo(() => {
    const hiddenSet = new Set(layoutPreferences?.hiddenCategories || []);
    const orderList = layoutPreferences?.categoryOrder || CATEGORIES.map((c) => c.id);

    // Map ordered IDs to CategoryInfo
    const result: CategoryInfo[] = [];
    orderList.forEach((id) => {
      const cat = CATEGORIES.find((c) => c.id === id || c.name === id);
      if (cat && !hiddenSet.has(cat.id)) {
        result.push(cat);
      }
    });

    // Append any unlisted categories that aren't hidden
    CATEGORIES.forEach((cat) => {
      if (!result.some((r) => r.id === cat.id) && !hiddenSet.has(cat.id)) {
        result.push(cat);
      }
    });

    return result;
  }, [layoutPreferences]);

  // 'Last Played' videos: videos with active progress, sorted by lastWatchedAt descending
  const lastPlayedVideos = useMemo(() => {
    return videos
      .filter((v) => {
        const prog = progressMap[v.id];
        return prog && (prog.watchedSeconds > 0 || prog.lastWatchedAt > 0);
      })
      .sort((a, b) => {
        const timeA = progressMap[a.id]?.lastWatchedAt || 0;
        const timeB = progressMap[b.id]?.lastWatchedAt || 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [videos, progressMap]);

  // Absolute last watched video ID
  const lastWatchedVideoId = lastPlayedVideos.length > 0 ? lastPlayedVideos[0].id : undefined;

  const [openedPlaylist, setOpenedPlaylist] = useState<Playlist | null>(null);

  const filteredPlaylists = useMemo(() => {
    let result = [...playlists];

    if (selectedCategory !== 'All') {
      result = result.filter((pl) => isCategoryMatch(pl.category, selectedCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (pl) =>
          pl.title.toLowerCase().includes(q) ||
          pl.channelName.toLowerCase().includes(q) ||
          pl.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [playlists, selectedCategory, searchQuery]);

  // Active Videos (excluding archived by default)
  const activeVideos = useMemo(() => {
    return videos.filter((v) => (statusFilter === 'archived' ? v.status === 'archived' : v.status !== 'archived'));
  }, [videos, statusFilter]);

  // Filtered library videos using isCategoryMatch
  const filteredVideos = useMemo(() => {
    let result = [...activeVideos];

    if (selectedCategory !== 'All') {
      result = result.filter((v) => isCategoryMatch(v.category, selectedCategory, v.tags));
    }

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

    if (statusFilter !== 'all' && statusFilter !== 'archived') {
      result = result.filter((v) => {
        const prog = progressMap[v.id]?.percentageCompleted || 0;
        if (statusFilter === 'completed') return v.status === 'completed' || prog === 100;
        if (statusFilter === 'in-progress') return prog > 0 && prog < 100;
        if (statusFilter === 'not-started') return prog === 0;
        return true;
      });
    }

    result.sort((a, b) => {
      const lastA = progressMap[a.id]?.lastWatchedAt || 0;
      const lastB = progressMap[b.id]?.lastWatchedAt || 0;

      if (sortBy === 'recent') {
        if (lastA > 0 || lastB > 0) {
          if (lastA !== lastB) return lastB - lastA;
        }
        return b.createdAt - a.createdAt;
      }
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

  const showCategoryBar = layoutPreferences?.showCategoryFilterBar !== false;
  const showLastPlayed = layoutPreferences?.showLastPlayedOnDashboard !== false;
  const showLibrary = layoutPreferences?.showLibraryOnDashboard !== false;
  const showSearch = layoutPreferences?.showDashboardSearch !== false;
  const showStatusFilter = layoutPreferences?.showDashboardStatusFilter !== false;
  const showSortBy = layoutPreferences?.showDashboardSortBy !== false;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Category Bar with Reordering Support */}
      {showCategoryBar && (
        <div className="sticky top-16 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md pt-2 pb-3 border-b border-gray-200/80 dark:border-gray-800/80 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Videos ({activeVideos.length})
              </button>

              {activeCategories.map((cat) => {
                const count = activeVideos.filter(
                  (v) => isCategoryMatch(v.category, cat.id, v.tags) || isCategoryMatch(v.category, cat.name, v.tags)
                ).length;
                const isSelected = isCategoryMatch(selectedCategory, cat.id) || isCategoryMatch(selectedCategory, cat.name);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
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

            {onOpenCustomizer && (
              <button
                onClick={onOpenCustomizer}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer"
                title="Reorder & edit category positions"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Edit Categories</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: LAST PLAYED VIDEOS GRID */}
      {showLastPlayed && lastPlayedVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-full bg-red-600" />
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                Last Played
              </h2>
              <span className="text-xs text-gray-500 font-semibold">
                ({lastPlayedVideos.length} in progress)
              </span>
            </div>

            {lastPlayedVideos.length > 1 && (
              <button
                onClick={() => onSelectVideo(lastPlayedVideos[0])}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Resume Latest</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lastPlayedVideos.map((video) => {
              const prog = progressMap[video.id];
              const percent = prog?.percentageCompleted || 0;

              return (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-red-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img
                      src={video.thumbnail || getYouTubeThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
                      {formatDuration(video.duration)}
                    </span>

                    {/* Progress bar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/60">
                      <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                        <span className="text-red-600 dark:text-red-400 font-semibold">{video.category}</span>
                        <span>{percent}% completed</span>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                        {video.title}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="truncate">{video.channelName}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Resume →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* PLAYLISTS SECTION ON HOMEPAGE */}
      {filteredPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-6 rounded-full bg-red-600" />
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-red-600" /> Playlists & Full Courses
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredPlaylists.length} {filteredPlaylists.length === 1 ? 'playlist' : 'playlists'} available
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('playlists')}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Playlists →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlaylists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                progressMap={progressMap}
                onOpenPlaylist={(playlist) => setOpenedPlaylist(playlist)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: MY LIBRARY GRID */}
      {showLibrary && (
        <section className="space-y-5">
          {/* Section Header & Search/Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-gray-800/80 p-4 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-6 rounded-full bg-indigo-600" />
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                  My Library
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} available
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Search input */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter library..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not-started">Not Started</option>
                <option value="archived">Archived</option>
              </select>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="recent">Recent First</option>
                <option value="newest">Newest Added</option>
                <option value="progress">Highest Progress</option>
                <option value="title">Title (A-Z)</option>
                <option value="duration">Longest First</option>
              </select>

              {/* Add Video Button */}
              <button
                onClick={() => openAddVideoModal()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 shrink-0 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Video</span>
              </button>
            </div>
          </div>

          {/* Video Grid */}
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  progress={progressMap[video.id]}
                  isInWatchLater={watchLaterIds.includes(video.id)}
                  isLastWatched={video.id === lastWatchedVideoId}
                  onToggleWatchLater={onToggleWatchLater}
                  onSelect={onSelectVideo}
                  onArchiveToggle={onArchiveToggle}
                  onDeleteRequest={onDeleteRequest}
                  onEditRequest={onEditVideoRequest}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800/80 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-8 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {selectedCategory !== 'All' ? `No videos in ${selectedCategory}` : 'No videos found'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                  Add a YouTube video to build your CS & IT learning library.
                </p>
              </div>

              <button
                onClick={() => openAddVideoModal()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 inline-flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Video</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        playlist={openedPlaylist}
        progressMap={progressMap}
        onClose={() => setOpenedPlaylist(null)}
        onSelectVideo={async (video) => {
          try {
            await saveVideoToFirestore(video);
          } catch (e) {
            console.warn('Failed to ensure video in Firestore:', e);
          }
          onSelectVideo(video);
        }}
      />
    </div>
  );
};
