import React from 'react';
import { Clock, CheckCircle2, Flame, Trophy, TrendingUp, BarChart2, Layers } from 'lucide-react';
import { VideoItem, VideoProgress, ActivityLog } from '../types';
import { CATEGORIES } from '../types';

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
  // Compute total watched seconds
  const totalWatchedSecs = (Object.values(progressMap) as VideoProgress[]).reduce(
    (acc, p) => acc + (p.watchedSeconds || 0),
    0
  );
  const totalHours = (totalWatchedSecs / 3600).toFixed(1);

  // Completed count
  const completedCount = videos.filter(
    (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
  ).length;

  const totalVideos = videos.length;
  const overallCompletionRate = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Category stats
  const categoryStats = CATEGORIES.map((cat) => {
    const catVideos = videos.filter((v) => v.category === cat.name);
    const catCompleted = catVideos.filter(
      (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
    ).length;
    const catTotalSecs = catVideos.reduce(
      (acc, v) => acc + (progressMap[v.id]?.watchedSeconds || 0),
      0
    );

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

    return {
      dayName,
      dateStr,
      mins,
    };
  });

  const maxMinsInWeek = Math.max(...last7Days.map((d) => d.mins), 30);

  return (
    <div className="space-y-6">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Learning</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{totalHours} Hours</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Completed Videos</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{completedCount} / {totalVideos}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Current Streak</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{streakCount} Days</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Completion Rate</p>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{overallCompletionRate}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Visualizer Chart */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Weekly Learning Activity
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Minutes watched over the last 7 days
            </p>
          </div>
        </div>

        <div className="pt-6 pb-2 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-gray-100 dark:border-gray-700/60">
          {last7Days.map((day) => {
            const heightPercent = Math.min(100, Math.max(8, Math.round((day.mins / maxMinsInWeek) * 100)));
            const isToday = day.dateStr === today.toISOString().split('T')[0];

            return (
              <div key={day.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-semibold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.mins}m
                </span>
                <div className="w-full max-w-[36px] bg-gray-100 dark:bg-gray-700/50 rounded-2xl h-full flex items-end p-1">
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
