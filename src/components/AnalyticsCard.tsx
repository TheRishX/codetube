import React from 'react';
import { Clock, CheckCircle2, Flame, Trophy, TrendingUp, BarChart2, Layers, PauseCircle, Activity, Sparkles } from 'lucide-react';
import { VideoItem, VideoProgress, ActivityLog } from '../types';
import { CATEGORIES } from '../types';
import { DrowsinessDetector } from './DrowsinessDetector';

interface AnalyticsCardProps {
  videos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  activityLogs: ActivityLog[];
  streakCount: number;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  videos,
  progressMap,
  activityLogs,
  streakCount,
}) => {
  // Compute total actual active study seconds from daily activity logs or actualStudySeconds
  const totalWatchedSecs = activityLogs.length > 0
    ? activityLogs.reduce((acc, l) => acc + (l.secondsWatched || 0), 0)
    : (Object.values(progressMap) as VideoProgress[]).reduce(
        (acc, p) => acc + (p.actualStudySeconds || p.watchedSeconds || 0),
        0
      );

  const hours = Math.floor(totalWatchedSecs / 3600);
  const minutes = Math.floor((totalWatchedSecs % 3600) / 60);
  const seconds = Math.floor(totalWatchedSecs % 60);
  const formattedWatchTime = `${hours}h ${minutes}m ${seconds}s`;

  // Total Pauses
  const totalPauses = (Object.values(progressMap) as VideoProgress[]).reduce(
    (acc, p) => acc + (p.pausesCount || 0),
    0
  ) + activityLogs.reduce((acc, l) => acc + (l.pausesCount || 0), 0);

  // Completed count
  const completedCount = videos.filter(
    (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
  ).length;

  const totalVideos = videos.length;
  const overallCompletionRate = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Average pauses per video
  const avgPausesPerVideo = totalVideos > 0 ? (totalPauses / totalVideos).toFixed(1) : '0.0';

  // Category stats
  const categoryStats = CATEGORIES.map((cat) => {
    const catVideos = videos.filter((v) => v.category === cat.name);
    const catCompleted = catVideos.filter(
      (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
    ).length;
    const catTotalSecs = catVideos.reduce((acc, v) => {
      const p = progressMap[v.id];
      return acc + (p?.actualStudySeconds || 0);
    }, 0);

    return {
      categoryName: cat.name,
      totalCount: catVideos.length,
      completedCount: catCompleted,
      totalHours: (catTotalSecs / 3600).toFixed(1),
      percent: catVideos.length > 0 ? Math.round((catCompleted / catVideos.length) * 100) : 0,
    };
  }).filter((c) => c.totalCount > 0);

  // Weekly Activity Days (Last 7 days Mon-Sun)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];

    const log = activityLogs.find((l) => l.date === dateStr);
    const secs = log ? log.secondsWatched : 0;
    const mins = Math.round(secs / 60);
    const pauses = log?.pausesCount || 0;

    return {
      dayName,
      dateStr,
      mins,
      pauses,
    };
  });

  const maxMinsInWeek = Math.max(...last7Days.map((d) => d.mins), 30);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Watch Time */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Active Watch Time</p>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{formattedWatchTime}</h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● Counts only when playing</span>
            </div>
          </div>
        </div>

        {/* Total Pauses */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Video Pauses Recorded</p>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{totalPauses} Pauses</h3>
              <span className="text-[10px] text-gray-400">Avg {avgPausesPerVideo} per video</span>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Study Streak</p>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{streakCount} Days Active</h3>
              <span className="text-[10px] text-gray-400">Daily learning goal active</span>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Completion Rate</p>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{overallCompletionRate}%</h3>
              <span className="text-[10px] text-gray-400">{completedCount} of {totalVideos} completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep & Drowsiness AI Guard Widget */}
      <DrowsinessDetector />

      {/* Weekly Activity & Pause Patterns Chart */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Weekly Watch Time & Pause Patterns
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Active minutes watched and pauses logged over the last 7 days
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-600" />
              <span className="text-gray-600 dark:text-gray-300">Active Watch Time (mins)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-gray-600 dark:text-gray-300">Video Pauses</span>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-2 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-gray-100 dark:border-gray-700/60">
          {last7Days.map((day) => {
            const heightPercent = Math.min(100, Math.max(8, Math.round((day.mins / maxMinsInWeek) * 100)));
            const isToday = day.dateStr === today.toISOString().split('T')[0];

            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                <div className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-black/80 text-white px-2 py-0.5 rounded-md whitespace-nowrap z-10">
                  {day.mins} mins • {day.pauses} pauses
                </div>
                <div className="w-full max-w-[36px] bg-gray-100 dark:bg-gray-700/50 rounded-2xl h-full flex items-end p-1 relative">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-purple-600'
                        : 'bg-indigo-500/80 hover:bg-indigo-600'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress by Category Breakdown */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Progress by Category
        </h3>

        <div className="space-y-4">
          {categoryStats.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 italic">
              No category data yet. Save videos to track category breakdown!
            </p>
          ) : (
            categoryStats.map((cat) => (
              <div key={cat.categoryName} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-gray-200">
                  <span>{cat.categoryName} ({cat.completedCount}/{cat.totalCount} completed)</span>
                  <span>{cat.percent}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
