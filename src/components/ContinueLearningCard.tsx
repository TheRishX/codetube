import React from 'react';
import { Play, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { VideoItem, VideoProgress } from '../types';
import { formatDuration } from '../lib/youtube';
import { ProgressBar } from './ProgressBar';

interface ContinueLearningCardProps {
  video: VideoItem;
  progress?: VideoProgress;
  onSelect: (video: VideoItem) => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  video,
  progress,
  onSelect,
}) => {
  const percent = progress?.percentageCompleted || 0;
  const watchedSecs = progress?.watchedSeconds || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
      {/* Decorative Background Accents */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>CONTINUE LEARNING</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold line-clamp-2 leading-tight">
            {video.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-indigo-100 flex-wrap">
            <span className="font-semibold px-2.5 py-0.5 rounded-md bg-white/15">
              {video.category}
            </span>
            <span>•</span>
            <span>{video.channelName}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(watchedSecs)} / {formatDuration(video.duration)}
            </span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center text-xs font-semibold mb-1 text-indigo-200">
              <span>Your Progress</span>
              <span>{percent}% Completed</span>
            </div>
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thumbnail and Resume Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
          <div
            onClick={() => onSelect(video)}
            className="relative w-full sm:w-48 aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/20 shadow-2xl cursor-pointer group"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white text-indigo-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelect(video)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
