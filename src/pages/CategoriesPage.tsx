import React from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { CategoryInfo, VideoItem, VideoProgress, Playlist } from '../types';
import { CategoryCard } from '../components/CategoryCard';

interface CategoriesPageProps {
  categories: CategoryInfo[];
  videos: VideoItem[];
  playlists: Playlist[];
  progressMap: Record<string, VideoProgress>;
  onSelectCategoryFilter: (categoryName: string) => void;
  onCreateCategory: () => void;
  onEditCategory: (category: CategoryInfo) => void;
  onDeleteCategory: (category: CategoryInfo) => void;
  onOpenCategoryManager: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  videos,
  playlists,
  progressMap,
  onSelectCategoryFilter,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenCategoryManager,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Learning Categories
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Organize and explore Computer Science & Software Engineering topics ({categories.length} categories)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCategoryManager}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FolderKanban className="w-4 h-4 text-indigo-500" />
            Manage Categories
          </button>
          <button
            onClick={onCreateCategory}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
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
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          );
        })}
      </div>
    </div>
  );
};
