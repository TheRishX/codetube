import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderKanban,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CategoryInfo, VideoItem, Playlist } from '../types';
import { CategoryCard } from './CategoryCard';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: CategoryInfo[];
  videos: VideoItem[];
  playlists: Playlist[];
  onClose: () => void;
  onCreateCategory: () => void;
  onEditCategory: (category: CategoryInfo) => void;
  onDeleteCategory: (category: CategoryInfo) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  videos,
  playlists,
  onClose,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Manage Learning Categories
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create, rename, update, or remove topic categories ({categories.length} total)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateCategory}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Category
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name or description..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing {filteredCategories.length} categories
          </span>
        </div>

        {/* Categories Table / Cards */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No categories found matching "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((cat) => {
                const catVideos = videos.filter((v) => v.category === cat.name);
                const catPlaylists = playlists.filter((p) => p.category === cat.name);

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/90 shadow-xs flex items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-sm shrink-0`}
                      >
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {cat.name}
                          </h3>
                          {cat.isCustom && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {cat.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-1">
                          <span>{catVideos.length} Videos</span>
                          <span>•</span>
                          <span>{catPlaylists.length} Playlists</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditCategory(cat)}
                        title="Edit / Rename Category"
                        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        title="Delete Category"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
