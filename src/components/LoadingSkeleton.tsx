import React from 'react';

export const VideoCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs animate-pulse">
    <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-12" />
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </div>
  </div>
);
