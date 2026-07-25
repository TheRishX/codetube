import React from 'react';
import { Play, CheckCircle2, Archive, Trash2, Clock, Tag, ExternalLink, Edit3 } from 'lucide-react';
import { VideoItem, VideoProgress, ViewMode } from '../types';
import { formatDuration } from '../lib/youtube';
import { ProgressBar } from './ProgressBar';

interface VideoCardProps {
  video: VideoItem;
  progress?: VideoProgress;
  viewMode?: ViewMode;
  isInWatchLater?: boolean;
  onToggleWatchLater?: (video: VideoItem) => void;
  onSelect: (video: VideoItem) => void;
  onArchiveToggle: (video: VideoItem) => void;
  onDeleteRequest: (video: VideoItem) => void;
  onEditRequest?: (video: VideoItem) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  progress,
  viewMode = 'grid',
  isInWatchLater = false,
  onToggleWatchLater,
  onSelect,
  onArchiveToggle,
  onDeleteRequest,
  onEditRequest,
}) => {
  const isCompleted = video.status === 'completed' || (progress && progress.percentageCompleted === 100);
  const percent = progress?.percentageCompleted || (isCompleted ? 100 : 0);

  const difficultyColors = {
    Beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    Intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    Advanced: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  }[video.difficulty];

  if (viewMode === 'list') {
    return (
      <div className="group bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center min-w-0 flex-1">
          {/* Thumbnail */}
          <div
            onClick={() => onSelect(video)}
            className="relative w-36 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0 cursor-pointer group-hover:scale-102 transition-transform"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-2.5 rounded-full bg-indigo-600 text-white shadow-lg">
                <Play className="w-4 h-4 fill-white" />
              </div>
            </div>
            <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md">
              {formatDuration(video.duration)}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {video.category}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${difficultyColors}`}>
                {video.difficulty}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              )}
            </div>

            <h3
              onClick={() => onSelect(video)}
              className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {video.title}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {video.channelName}
            </p>

            <div className="w-full max-w-xs pt-1">
              <ProgressBar progress={percent} size="sm" showLabel={false} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => onSelect(video)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{percent > 0 && percent < 100 ? 'Resume' : 'Watch'}</span>
          </button>

          {onToggleWatchLater && (
            <button
              onClick={() => onToggleWatchLater(video)}
              className={`p-2 rounded-xl transition-colors ${
                isInWatchLater
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
              title={isInWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
              aria-label="Toggle Watch Later"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          {onEditRequest && (
            <button
              onClick={() => onEditRequest(video)}
              className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Edit video details"
              aria-label="Edit video details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onArchiveToggle(video)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={video.status === 'archived' ? 'Unarchive' : 'Archive'}
            aria-label="Toggle Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteRequest(video)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete video"
            aria-label="Delete video"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail Box */}
        <div
          onClick={() => onSelect(video)}
          className="relative w-full aspect-video bg-gray-900 overflow-hidden cursor-pointer"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Badges on Thumbnail */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white">
              {video.category}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${difficultyColors}`}>
              {video.difficulty}
            </span>
          </div>

          {/* Watch Later Quick Toggle Badge Top Right */}
          {onToggleWatchLater && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchLater(video);
              }}
              className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-all shadow-md ${
                isInWatchLater
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80'
              }`}
              title={isInWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duration & Completion Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {isCompleted ? (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            ) : (
              <span className="bg-black/80 text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-md">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          <h3
            onClick={() => onSelect(video)}
            className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-snug"
          >
            {video.title}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {video.channelName}
          </p>

          {/* Progress Bar */}
          <div className="pt-2">
            <ProgressBar progress={percent} size="sm" showLabel={true} status={video.status} />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <button
          onClick={() => onSelect(video)}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{percent > 0 && percent < 100 ? 'Resume Video' : 'Start Video'}</span>
        </button>

        <div className="flex items-center gap-1">
          {onEditRequest && (
            <button
              onClick={() => onEditRequest(video)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Edit video details"
              aria-label="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onArchiveToggle(video)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title={video.status === 'archived' ? 'Unarchive' : 'Archive'}
            aria-label="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteRequest(video)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
