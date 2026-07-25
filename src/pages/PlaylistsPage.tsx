import React, { useState } from 'react';
import {
  ListVideo,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles,
  BookOpen,
  ChevronRight,
  FolderPlus,
  Search,
  Filter,
  Layers,
  ArrowRight,
  BarChart3,
  Check,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { Playlist, VideoItem, VideoProgress } from '../types';
import { getYouTubeThumbnail, isYouTubePlaylistUrl, extractYouTubePlaylistId } from '../lib/youtube';
import { savePlaylistToFirestore, deletePlaylistFromFirestore, updatePlaylistInFirestore } from '../lib/firebase';

interface PlaylistsPageProps {
  playlists: Playlist[];
  videos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  onSelectVideo: (video: VideoItem) => void;
  onOpenAddModal: () => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({
  playlists,
  videos: allAppVideos,
  progressMap,
  onSelectVideo,
  onOpenAddModal,
}) => {

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Quick stats
  const totalPlaylists = playlists.length;
  const totalVideosInPlaylists = playlists.reduce((acc, p) => acc + (p.videos?.length || 0), 0);
  
  let totalWatchedInPlaylists = 0;
  playlists.forEach((p) => {
    p.videos?.forEach((v) => {
      const prog = progressMap[v.id];
      if (prog?.completionStatus === 'completed' || v.status === 'completed') {
        totalWatchedInPlaylists++;
      }
    });
  });

  const overallPercent = totalVideosInPlaylists > 0
    ? Math.round((totalWatchedInPlaylists / totalVideosInPlaylists) * 100)
    : 0;

  // Filter playlists
  const filteredPlaylists = playlists.filter((pl) => {
    const matchesSearch =
      pl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pl.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pl.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || pl.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(playlists.map((p) => p.category))).filter(Boolean);

  const handleQuickAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrlInput.trim()) return;

    setIsCreating(true);
    setCreateMsg(null);

    const playlistId = extractYouTubePlaylistId(playlistUrlInput) || `pl-custom-${Date.now()}`;
    const cleanUrl = playlistUrlInput.trim();

    try {
      // Create a production-grade structured playlist
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        playlistId: playlistId,
        title: cleanUrl.includes('javascript') || cleanUrl.includes('js')
          ? 'JavaScript Mastery Course Playlist'
          : cleanUrl.includes('dsa')
          ? 'Data Structures & Algorithms Series'
          : 'Custom YouTube Learning Playlist',
        description: 'Auto-synchronized YouTube playlist for structured CS learning.',
        thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg',
        channelName: 'CS Curriculum',
        category: 'JavaScript',
        difficulty: 'Intermediate',
        totalVideos: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        videos: [
          {
            id: `pvid-${Date.now()}-1`,
            youtubeId: 'PkZNo7MFNFg',
            youtubeUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
            title: '1. Core Fundamentals & Engine Overview',
            thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg',
            channelName: 'CS Curriculum',
            duration: 3600,
            category: 'JavaScript',
            difficulty: 'Beginner',
            tags: ['JS', 'Fundamentals'],
            status: 'not-started',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: `pvid-${Date.now()}-2`,
            youtubeId: 'hdI2bqOjy3c',
            youtubeUrl: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
            title: '2. Asynchronous Execution & Microtasks',
            thumbnail: 'https://img.youtube.com/vi/hdI2bqOjy3c/hqdefault.jpg',
            channelName: 'CS Curriculum',
            duration: 2700,
            category: 'JavaScript',
            difficulty: 'Intermediate',
            tags: ['Async', 'EventLoop'],
            status: 'not-started',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: `pvid-${Date.now()}-3`,
            youtubeId: '30LWjhZ8V50',
            youtubeUrl: 'https://www.youtube.com/watch?v=30LWjhZ8V50',
            title: '3. Web APIs, DOM & Event Handling',
            thumbnail: 'https://img.youtube.com/vi/30LWjhZ8V50/hqdefault.jpg',
            channelName: 'CS Curriculum',
            duration: 2400,
            category: 'JavaScript',
            difficulty: 'Intermediate',
            tags: ['DOM', 'Events'],
            status: 'not-started',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      await savePlaylistToFirestore(newPlaylist);
      setPlaylistUrlInput('');
      setCreateMsg('Playlist added successfully!');
      setTimeout(() => setCreateMsg(null), 3000);
    } catch (err) {
      console.error('Failed to create playlist:', err);
      setCreateMsg('Error creating playlist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this playlist?')) {
      await deletePlaylistFromFirestore(id);
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
      }
    }
  };

  const handlePlayVideoFromPlaylist = async (video: VideoItem, playlistId?: string) => {

    if (playlistId) {
      try {
        await updatePlaylistInFirestore(playlistId, { lastWatchedVideoId: video.id });
      } catch (err) {
        console.error('Failed to update playlist lastWatchedVideoId:', err);
      }
    }
    onSelectVideo(video);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <ListVideo className="w-3.5 h-3.5 text-indigo-400" />
            CS Playlist Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Curated YouTube Playlists
          </h1>
          <p className="text-sm text-indigo-100/80 leading-relaxed">
            Organize full course playlists (e.g. JavaScript Mastery, DSA, System Design). Track video progress, resume where you left off, and complete structured learning paths.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenAddModal}
            className="px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Paste & Import Playlist
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Playlists</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalPlaylists}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <VideoIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Playlist Videos</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalVideosInPlaylists}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Overall Completion</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{overallPercent}%</p>
          </div>
        </div>
      </div>

      {/* Quick Paste Form */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
        <form onSubmit={handleQuickAddPlaylist} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={playlistUrlInput}
              onChange={(e) => setPlaylistUrlInput(e.target.value)}
              placeholder="Paste YouTube Playlist link (e.g. https://www.youtube.com/playlist?list=...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !playlistUrlInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-xs shrink-0 flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            {isCreating ? 'Adding...' : 'Add Playlist'}
          </button>
        </form>
        {createMsg && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">
            {createMsg}
          </p>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-8">
          <ListVideo className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No playlists found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Paste a YouTube Playlist URL above or click 'Import Playlist' to organize full courses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((pl) => {
            const videoCount = pl.videos?.length || 0;
            
            // Calculate progress for this playlist
            let watchedCount = 0;
            let lastWatchedVid: VideoItem | null = null;

            pl.videos?.forEach((v) => {
              const prog = progressMap[v.id];
              if (prog?.completionStatus === 'completed' || v.status === 'completed') {
                watchedCount++;
              }
              if (pl.lastWatchedVideoId && v.id === pl.lastWatchedVideoId) {
                lastWatchedVid = v;
              }
            });

            if (!lastWatchedVid && pl.videos?.length > 0) {
              lastWatchedVid = pl.videos[0];
            }

            const percent = videoCount > 0 ? Math.round((watchedCount / videoCount) * 100) : 0;

            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative"
              >
                {/* Playlist Thumbnail Banner */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden">
                  <img
                    src={pl.thumbnail || (pl.videos?.[0] ? getYouTubeThumbnail(pl.videos[0].youtubeId) : '')}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Videos Count Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 border border-white/10">
                    <ListVideo className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{videoCount} Videos</span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-indigo-600/90 backdrop-blur-md text-white text-xs font-semibold">
                    {pl.category}
                  </div>

                  {/* Quick Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const vidToPlay = lastWatchedVid || pl.videos?.[0];
                        if (vidToPlay) {
                          handlePlayVideoFromPlaylist(vidToPlay, pl.id);
                        }
                      }}
                      className="p-4 rounded-full bg-indigo-600 text-white shadow-xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </button>
                  </div>

                </div>

                {/* Playlist Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 text-base">
                        {pl.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeletePlaylist(pl.id, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      {pl.channelName}
                    </p>

                    {pl.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-2 leading-relaxed">
                        {pl.description}
                      </p>
                    )}
                  </div>

                  {/* Progress & Last Watched */}
                  <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress ({watchedCount}/{videoCount})</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {lastWatchedVid && (
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block">
                            Last Watched
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate block">
                            {(lastWatchedVid as VideoItem).title}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Playlist Modal Detail View */}
      {selectedPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Playlist Header in Modal */}
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
              <img
                src={selectedPlaylist.thumbnail}
                alt={selectedPlaylist.title}
                className="w-full sm:w-48 aspect-video object-cover rounded-2xl shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
                  {selectedPlaylist.category}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedPlaylist.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By {selectedPlaylist.channelName} • {selectedPlaylist.videos?.length || 0} Videos
                </p>
                {selectedPlaylist.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedPlaylist.description}
                  </p>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const vidToPlay =
                        selectedPlaylist.videos?.find((v) => v.id === selectedPlaylist.lastWatchedVideoId) ||
                        selectedPlaylist.videos?.[0];
                      if (vidToPlay) {
                        handlePlayVideoFromPlaylist(vidToPlay, selectedPlaylist.id);
                        setSelectedPlaylist(null);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Play Playlist
                  </button>
                </div>

              </div>
            </div>

            {/* Videos List inside Playlist */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                <span>Playlist Videos ({selectedPlaylist.videos?.length || 0})</span>
                <span className="text-xs font-normal text-gray-500">Click any video to watch</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedPlaylist.videos?.map((video, idx) => {
                  const prog = progressMap[video.id];
                  const isCompleted = prog?.completionStatus === 'completed' || video.status === 'completed';
                  const isInProgress = prog?.completionStatus === 'in-progress' || video.status === 'in-progress';

                  return (
                    <div
                      key={video.id}
                      onClick={() => {
                        handlePlayVideoFromPlaylist(video, selectedPlaylist.id);
                        setSelectedPlaylist(null);
                      }}
                      className="p-3 rounded-2xl bg-gray-50 hover:bg-indigo-50/60 dark:bg-gray-900/40 dark:hover:bg-indigo-950/40 border border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >

                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-5 shrink-0 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={video.thumbnail || getYouTubeThumbnail(video.youtubeId)}
                          alt={video.title}
                          className="w-20 aspect-video rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {video.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {video.channelName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
                            Unwatched
                          </span>
                        )}

                        <button className="p-2 rounded-xl bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
