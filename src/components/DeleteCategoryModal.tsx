import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { CategoryInfo, VideoItem, Playlist } from '../types';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  categories: CategoryInfo[];
  videos: VideoItem[];
  playlists: Playlist[];
  onClose: () => void;
  onConfirmDelete: (categoryId: string, reassignCategoryName?: string) => Promise<void>;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  category,
  categories,
  videos,
  playlists,
  onClose,
  onConfirmDelete,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [reassignCategory, setReassignCategory] = useState('JavaScript');

  if (!isOpen || !category) return null;

  const affectedVideos = videos.filter((v) => v.category === category.name);
  const affectedPlaylists = playlists.filter((p) => p.category === category.name);
  const otherCategories = categories.filter((c) => c.name !== category.name);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirmDelete(category.id, affectedVideos.length > 0 ? reassignCategory : undefined);
      onClose();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Delete Category "{category.name}"?
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Are you sure you want to delete this category? This action cannot be undone.
          </p>
        </div>

        {(affectedVideos.length > 0 || affectedPlaylists.length > 0) && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              This category currently contains {affectedVideos.length} video(s) and {affectedPlaylists.length} playlist(s).
            </p>

            {otherCategories.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                  Move items to category:
                </label>
                <select
                  value={reassignCategory}
                  onChange={(e) => setReassignCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 text-xs font-medium text-gray-900 dark:text-white outline-hidden"
                >
                  {otherCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting...' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  );
};
