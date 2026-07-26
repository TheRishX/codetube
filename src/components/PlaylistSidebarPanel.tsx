import React, { useState } from 'react';
import { Play, Repeat, Shuffle, ChevronDown, ChevronUp, CheckCircle2, ListVideo, Clock, Layers } from 'lucide-react';
import { Playlist, VideoItem, VideoProgress } from '../types';
import { formatDuration } from '../lib/youtube';

interface PlaylistSidebarPanelProps {
  playlist: Playlist;
  currentVideo: VideoItem;
  progressMap?: Record<string, VideoProgress>;
  onSelectVideo: (video: VideoItem) => void;
}

export const PlaylistSidebarPanel: React.FC<PlaylistSidebarPanelProps> = ({
  playlist,
  currentVideo,
  progressMap = {},
  onSelectVideo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLooped, setIsLooped] = useState(false);

  const rawVideos = playlist.videos || [];
  
  // Find current index
  const currentIndex = rawVideos.findIndex(
    (v) => v.id === currentVideo.id || v.youtubeId === currentVideo.youtubeId
  );
  
  const displayVideos = rawVideos;

  return (
    <div className="bg-gray-900 dark:bg-gray-950 text-white rounded-3xl overflow-hidden border border-gray-800/80 shadow-2xl transition-all">
      {/* YouTube Style Header */}
      <div className="p-4 bg-gray-900/90 dark:bg-gray-900 border-b border-gray-800 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1">
            <ListVideo className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="uppercase tracking-wider text-[11px]">PLAYLIST</span>
            <span>•</span>
            <span className="text-gray-400 font-medium">
              {currentIndex !== -1 ? currentIndex + 1 : 1} / {rawVideos.length}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-white truncate leading-snug">
            {playlist.title}
          </h3>

          <p className="text-xs text-gray-400 truncate mt-0.5">
            {playlist.channelName || currentVideo.channelName}
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsShuffled(!isShuffled)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isShuffled
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLooped(!isLooped)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLooped
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={isLooped ? 'Loop On' : 'Loop Off'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Playlist' : 'Collapse Playlist'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Playlist Video Items List */}
      {!isCollapsed && (
        <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-gray-950/60">
          {displayVideos.map((v, idx) => {
            const isPlaying = v.id === currentVideo.id || v.youtubeId === currentVideo.youtubeId;
            const prog = progressMap[v.id];
            const isCompleted = prog?.completionStatus === 'completed' || v.status === 'completed' || (prog?.percentageCompleted || 0) >= 95;
            const percentage = prog?.percentageCompleted || 0;

            return (
              <div
                key={`${v.id}-${idx}`}
                onClick={() => onSelectVideo(v)}
                className={`group flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer border ${
                  isPlaying
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                    : 'bg-gray-900/40 hover:bg-gray-800/80 border-transparent text-gray-300 hover:text-white'
                }`}
              >
                {/* Playing Indicator or Index Number */}
                <div className="w-5 shrink-0 flex items-center justify-center">
                  {isPlaying ? (
                    <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400 animate-pulse" />
                  ) : (
                    <span className="text-xs font-mono font-bold text-gray-500 group-hover:text-gray-300">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Video Thumbnail */}
                <div className="relative w-20 sm:w-24 aspect-video rounded-xl overflow-hidden bg-gray-800 shrink-0 border border-gray-800">
                  <img
                    src={v.thumbnail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Duration Overlay */}
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                    {v.duration ? formatDuration(v.duration) : 'Auto'}
                  </div>

                  {/* Progress Line Bar */}
                  {percentage > 0 && !isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }} />
                    </div>
                  )}
                </div>

                {/* Video Title and Author */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h4
                    className={`text-xs font-bold leading-snug line-clamp-2 ${
                      isPlaying ? 'text-indigo-300 font-extrabold' : 'text-gray-200 group-hover:text-white'
                    }`}
                  >
                    {v.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 truncate">
                      {v.channelName || playlist.channelName}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
