import React, { useState, useMemo } from 'react';
import {
  Search,
  Grid as GridIcon,
  List as ListIcon,
  Filter,
  ArrowUpDown,
  Plus,
  Video,
} from 'lucide-react';
import { VideoItem, VideoProgress, CATEGORIES, ViewMode, SortOption, Difficulty, VideoStatus } from '../types';
import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { useGlobalPaste } from '../context/GlobalPasteContext';

interface VideoLibraryPageProps {
  videos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategoryFilter?: string;
  watchLaterIds?: string[];
  onToggleWatchLater?: (video: VideoItem) => void;
  onSelectVideo: (video: VideoItem) => void;
  onArchiveToggle: (video: VideoItem) => void;
  onDeleteRequest: (video: VideoItem) => void;
  onEditVideoRequest?: (video: VideoItem) => void;
}

export const VideoLibraryPage: React.FC<VideoLibraryPageProps> = ({
  videos,
  progressMap,
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  watchLaterIds = [],
  onToggleWatchLater,
  onSelectVideo,
  onArchiveToggle,
  onDeleteRequest,
  onEditVideoRequest,
}) => {
  const { openAddVideoModal } = useGlobalPaste();

  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategoryFilter || 'All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Absolute last watched video ID
  const lastWatchedVideoId = useMemo(() => {
    let latestId: string | null = null;
    let maxTime = 0;
    for (const v of videos) {
      const t = progressMap[v.id]?.lastWatchedAt || 0;
      if (t > maxTime) {
        maxTime = t;
        latestId = v.id;
      }
    }
    return latestId;
  }, [videos, progressMap]);

  // Filter & Sort Logic
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = v.title.toLowerCase().includes(q);
          const matchChannel = v.channelName.toLowerCase().includes(q);
          const matchTags = v.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchChannel && !matchTags) return false;
        }

        // Category Filter
        if (categoryFilter !== 'All' && v.category !== categoryFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'archived') {
            if (v.status !== 'archived') return false;
          } else {
            if (v.status === 'archived') return false;
            const p = progressMap[v.id]?.percentageCompleted || 0;
            if (statusFilter === 'in-progress' && (p === 0 || p === 100)) return false;
            if (statusFilter === 'completed' && p < 100 && v.status !== 'completed') return false;
            if (statusFilter === 'not-started' && p > 0) return false;
          }
        } else {
          // By default, hide archived unless explicitly 'archived' filter is picked
          if (v.status === 'archived') return false;
        }

        // Difficulty Filter
        if (difficultyFilter !== 'All' && v.difficulty !== difficultyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
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
          const pA = progressMap[a.id]?.percentageCompleted || 0;
          const pB = progressMap[b.id]?.percentageCompleted || 0;
          return pB - pA;
        }
        return 0;
      });
  }, [videos, progressMap, searchQuery, categoryFilter, statusFilter, difficultyFilter, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Video Library
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Showing {filteredVideos.length} of {videos.length} videos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAddVideoModal()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
              title="Grid View"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-3">
        {/* Search input in toolbar for mobile */}
        <div className="relative md:hidden">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900/50 text-sm text-gray-900 dark:text-white border border-transparent focus:border-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/80 border border-transparent text-gray-900 dark:text-white font-medium focus:border-indigo-500 outline-hidden"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/80 border border-transparent text-gray-900 dark:text-white font-medium focus:border-indigo-500 outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/80 border border-transparent text-gray-900 dark:text-white font-medium focus:border-indigo-500 outline-hidden"
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/80 border border-transparent text-gray-900 dark:text-white font-medium focus:border-indigo-500 outline-hidden"
            >
              <option value="recent">Sort: Recently Played</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="progress">Sort: Highest Progress</option>
              <option value="duration">Sort: Longest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos List or Grid View */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No Videos Found"
          description={
            searchQuery || categoryFilter !== 'All' || statusFilter !== 'All'
              ? 'No videos match your active search or filter parameters. Try clearing your filters or paste a new video.'
              : 'Your video library is currently empty. Paste a YouTube URL from anywhere in the app to get started!'
          }
          actionText="Paste YouTube Video"
          onAction={() => openAddVideoModal()}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={progressMap[video.id]}
              viewMode="grid"
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
        <div className="space-y-3">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={progressMap[video.id]}
              viewMode="list"
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
      )}
    </div>
  );
};
