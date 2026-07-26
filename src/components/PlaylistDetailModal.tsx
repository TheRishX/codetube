import React from 'react';
import { X, Play, ListVideo, CheckCircle2, Clock, Sparkles, ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { Playlist, VideoItem, VideoProgress } from '../types';
import { formatDuration, getYouTubeThumbnail } from '../lib/youtube';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  progressMap?: Record<string, VideoProgress>;
  onClose: () => void;
  onSelectVideo: (video: VideoItem, playlistId?: string) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  progressMap = {},
  onClose,
  onSelectVideo,
}) => {
  if (!playlist) return null;

  const videos = playlist.videos || [];
  const totalVids = videos.length;

  let completedCount = 0;
  videos.forEach((v) => {
    const prog = progressMap[v.id];
    if (prog?.completionStatus === 'completed' || v.status === 'completed' || (prog?.percentageCompleted || 0) >= 100) {
      completedCount++;
    }
  });

  const percentComplete = totalVids > 0 ? Math.round((completedCount / totalVids) * 100) : 0;

  // Find next uncompleted video or first video
  const firstUncompleted = videos.find((v) => {
    const prog = progressMap[v.id];
    return !(prog?.completionStatus === 'completed' || v.status === 'completed' || (prog?.percentageCompleted || 0) >= 100);
  });
  const startVideo = firstUncompleted || videos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 relative my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Banner */}
        <div className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative aspect-video w-full sm:w-56 bg-gray-900 rounded-2xl overflow-hidden shrink-0 shadow-md">
            <img
              src={playlist.thumbnail || (videos[0]?.thumbnail) || getYouTubeThumbnail('PkZNo7MFNFg')}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-md">
                <ListVideo className="w-3.5 h-3.5" /> PLAYLIST
              </span>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
              {totalVids} {totalVids === 1 ? 'Video' : 'Videos'}
            </div>
          </div>

          <div className="flex-1 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
                <span>{playlist.category}</span>
                <span>•</span>
                <span className="text-gray-500 dark:text-gray-400">{playlist.channelName}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug mt-1">
                {playlist.title}
              </h2>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Playlist Completion
                </span>
                <span className="text-gray-900 dark:text-white">
                  {completedCount} / {totalVids} completed ({percentComplete}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            {/* Start / Resume Button */}
            {startVideo && (
              <button
                onClick={() => {
                  onClose();
                  onSelectVideo(startVideo, playlist.id);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{completedCount > 0 ? 'Resume Playlist' : 'Start Learning Playlist'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Videos List Section */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-700 dark:text-gray-300 pb-1">
            <span>Playlist Contents ({totalVids} Videos)</span>
            <span className="text-gray-400 text-[11px] font-normal">Select a video to play</span>
          </div>

          <div className="space-y-2">
            {videos.map((video, idx) => {
              const prog = progressMap[video.id];
              const isCompleted = prog?.completionStatus === 'completed' || video.status === 'completed' || (prog?.percentageCompleted || 0) >= 100;
              const percent = prog?.percentageCompleted || 0;

              return (
                <div
                  key={video.id || `pvid-${idx}`}
                  onClick={() => {
                    onClose();
                    onSelectVideo(video, playlist.id);
                  }}
                  className={`group p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-500'
                      : percent > 0
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-500'
                      : 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-800 hover:border-red-500/60'
                  }`}
                >
                  {/* Video Index Number */}
                  <div className="w-7 h-7 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold text-xs flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>

                  {/* Video Thumbnail */}
                  <div className="relative aspect-video w-24 bg-gray-900 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={video.thumbnail || getYouTubeThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {video.channelName || playlist.channelName}
                    </p>

                    {/* Progress indicator */}
                    {percent > 0 && !isCompleted && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{percent}% watched</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {video.duration > 0 && (
                      <span className="text-[10px] font-semibold text-gray-400 hidden sm:inline">
                        {formatDuration(video.duration)}
                      </span>
                    )}

                    {isCompleted ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <button className="p-1.5 rounded-xl bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
