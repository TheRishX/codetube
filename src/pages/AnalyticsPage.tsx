import React from 'react';
import { VideoItem, VideoProgress, ActivityLog } from '../types';
import { AnalyticsCard } from '../components/AnalyticsCard';

interface AnalyticsPageProps {
  videos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  activityLogs: ActivityLog[];
  streakCount: number;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  videos,
  progressMap,
  activityLogs,
  streakCount,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Learning Analytics
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Track your learning velocity, streak constancy, and category mastery
        </p>
      </div>

      <AnalyticsCard
        videos={videos}
        progressMap={progressMap}
        activityLogs={activityLogs}
        streakCount={streakCount}
      />
    </div>
  );
};
