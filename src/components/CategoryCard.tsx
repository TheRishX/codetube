import React from 'react';
import * as Icons from 'lucide-react';
import { CategoryInfo } from '../types';

interface CategoryCardProps {
  category: CategoryInfo;
  videoCount: number;
  completedCount: number;
  totalSeconds: number;
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  videoCount,
  completedCount,
  totalSeconds,
  onSelectCategory,
}) => {
  // Dynamically get Lucide icon or fallback to Folder
  const IconComponent = (Icons as any)[category.iconName] || Icons.Folder;

  const hours = Math.round((totalSeconds / 3600) * 10) / 10;
  const progressPercent = videoCount > 0 ? Math.round((completedCount / videoCount) * 100) : 0;

  return (
    <div
      onClick={() => onSelectCategory(category.name)}
      className="group bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-r ${category.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
          </span>
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
          {category.name}
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
          {category.description}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span>{completedCount} Completed</span>
          <span>{hours > 0 ? `${hours} hrs content` : 'No videos yet'}</span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
