import React from 'react';
import * as Icons from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { CategoryInfo } from '../types';

interface CategoryCardProps {
  category: CategoryInfo;
  videoCount: number;
  completedCount: number;
  totalSeconds: number;
  onSelectCategory: (categoryName: string) => void;
  onEditCategory?: (category: CategoryInfo) => void;
  onDeleteCategory?: (category: CategoryInfo) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  videoCount,
  completedCount,
  totalSeconds,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  // Dynamically get Lucide icon or fallback to Folder
  const IconComponent = (Icons as any)[category.iconName] || Icons.Folder;

  const hours = Math.round((totalSeconds / 3600) * 10) / 10;
  const progressPercent = videoCount > 0 ? Math.round((completedCount / videoCount) * 100) : 0;

  return (
    <div
      onClick={() => onSelectCategory(category.name)}
      className="group relative bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-r ${category.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
            </span>

            {(onEditCategory || onDeleteCategory) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEditCategory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCategory(category);
                    }}
                    title="Edit / Rename Category"
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteCategory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(category);
                    }}
                    title="Delete Category"
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1 flex items-center justify-between">
          <span>{category.name}</span>
          {category.isCustom && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Custom
            </span>
          )}
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
