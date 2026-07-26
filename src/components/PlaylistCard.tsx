import React from 'react';
import { ListVideo, Play, CheckCircle2, Clock, Sparkles, FolderPlus, Layers } from 'lucide-react';
import { Playlist, VideoProgress } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
  progressMap?: Record<string, VideoProgress>;
  onOpenPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist?: (playlistId: string, e: React.MouseEvent) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  progressMap = {},
  onOpenPlaylist,
  onDeletePlaylist,
}) => {
  const totalVids = playlist.videos?.length || playlist.totalVideos || 0;
  let completedCount = 0;

  if (playlist.videos) {
    playlist.videos.forEach((v) => {
      const prog = progressMap[v.id];
      if (prog?.completionStatus === 'completed' || v.status === 'completed' || (prog?.percentageCompleted || 0) >= 100) {
        completedCount++;
      }
    });
  }

  const percentComplete = totalVids > 0 ? Math.round((completedCount / totalVids) * 100) : 0;

  return (
    <div
      onClick={() => onOpenPlaylist(playlist)}
      className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all cursor-pointer group flex flex-col justify-between relative"
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <img
          src={playlist.thumbnail || (playlist.videos && playlist.videos[0]?.thumbnail) || 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg'}
          alt={playlist.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Playlist Stack Side Overlay */}
        <div className="absolute top-0 right-0 bottom-0 w-28 bg-gradient-to-l from-black/90 via-black/60 to-transparent flex flex-col items-end justify-center pr-3 text-white">
          <ListVideo className="w-6 h-6 mb-1 text-red-500 drop-shadow-md" />
          <span className="text-xs font-black tracking-tight">{totalVids}</span>
          <span className="text-[9px] uppercase font-bold tracking-wider text-gray-300">Videos</span>
        </div>

        {/* Top Tag - PLAYLIST Tag Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md shadow-red-600/30 ring-1 ring-white/20">
            <ListVideo className="w-3 h-3" /> PLAYLIST
          </span>
          <span className="px-2 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
            {playlist.category}
          </span>
        </div>

        {/* Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/60">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Meta Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-red-600 dark:text-red-400 font-semibold truncate max-w-[150px]">
              {playlist.channelName}
            </span>
            <span>{percentComplete}% done ({completedCount}/{totalVids})</span>
          </div>

          <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {playlist.title}
          </h3>
        </div>

        {/* Footer info & view action */}
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300">
            <Layers className="w-3 h-3 text-indigo-500" /> Full Course ({totalVids} vids)
          </span>
          <span className="font-extrabold text-red-600 dark:text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
            View Playlist →
          </span>
        </div>
      </div>
    </div>
  );
};
