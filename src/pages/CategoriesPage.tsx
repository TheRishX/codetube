import React from 'react';
import { CATEGORIES, VideoItem, VideoProgress } from '../types';
import { CategoryCard } from '../components/CategoryCard';

interface CategoriesPageProps {
  videos: VideoItem[];
  progressMap: Record<string, VideoProgress>;
  onSelectCategoryFilter: (categoryName: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  videos,
  progressMap,
  onSelectCategoryFilter,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Learning Categories
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Explore Computer Science and Software Engineering topics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => {
          const catVideos = videos.filter((v) => v.category === cat.name);
          const catCompleted = catVideos.filter(
            (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
          ).length;
          const catTotalSecs = catVideos.reduce((acc, v) => acc + (v.duration || 0), 0);

          return (
            <CategoryCard
              key={cat.id}
              category={cat}
              videoCount={catVideos.length}
              completedCount={catCompleted}
              totalSeconds={catTotalSecs}
              onSelectCategory={onSelectCategoryFilter}
            />
          );
        })}
      </div>
    </div>
  );
};
