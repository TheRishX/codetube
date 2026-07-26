import React, { useState } from 'react';
import {
  X,
  Code2,
  Atom,
  Server,
  Database,
  Layers,
  Cloud,
  Network,
  Cpu,
  Workflow,
  Binary,
  FileCode,
  ShieldCheck,
  GitBranch,
  FolderGit2,
  Briefcase,
  Sparkles,
  BookOpen,
  Terminal,
  Globe,
  Music,
  Palette,
  Video,
  Zap,
  Check,
} from 'lucide-react';
import { CategoryInfo } from '../types';

const AVAILABLE_ICONS = [
  { name: 'Code2', icon: Code2 },
  { name: 'Atom', icon: Atom },
  { name: 'Server', icon: Server },
  { name: 'Database', icon: Database },
  { name: 'Layers', icon: Layers },
  { name: 'Cloud', icon: Cloud },
  { name: 'Network', icon: Network },
  { name: 'Cpu', icon: Cpu },
  { name: 'Workflow', icon: Workflow },
  { name: 'Binary', icon: Binary },
  { name: 'FileCode', icon: FileCode },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'GitBranch', icon: GitBranch },
  { name: 'FolderGit2', icon: FolderGit2 },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Terminal', icon: Terminal },
  { name: 'Globe', icon: Globe },
  { name: 'Music', icon: Music },
  { name: 'Palette', icon: Palette },
  { name: 'Video', icon: Video },
  { name: 'Zap', icon: Zap },
];

const GRADIENT_PRESETS = [
  { label: 'Emerald Teal', value: 'from-emerald-500 to-teal-600' },
  { label: 'Amber Yellow', value: 'from-amber-500 to-yellow-600' },
  { label: 'Sky Blue', value: 'from-sky-500 to-blue-600' },
  { label: 'Indigo Violet', value: 'from-indigo-500 to-violet-600' },
  { label: 'Purple Pink', value: 'from-purple-500 to-pink-600' },
  { label: 'Cyan Blue', value: 'from-cyan-500 to-blue-500' },
  { label: 'Rose Red', value: 'from-rose-500 to-red-600' },
  { label: 'Orange Amber', value: 'from-orange-500 to-amber-600' },
  { label: 'Blue Indigo', value: 'from-blue-600 to-indigo-700' },
  { label: 'Green Emerald', value: 'from-green-500 to-emerald-700' },
  { label: 'Teal Cyan', value: 'from-teal-500 to-cyan-600' },
  { label: 'Red Rose', value: 'from-red-500 to-rose-700' },
  { label: 'Violet Purple', value: 'from-violet-500 to-purple-700' },
];

interface CategoryFormModalProps {
  isOpen: boolean;
  initialCategory?: CategoryInfo | null;
  onClose: () => void;
  onSave: (category: CategoryInfo, oldName?: string) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  initialCategory,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState(initialCategory?.name || '');
  const [description, setDescription] = useState(initialCategory?.description || '');
  const [iconName, setIconName] = useState(initialCategory?.iconName || 'Code2');
  const [color, setColor] = useState(initialCategory?.color || 'from-indigo-500 to-purple-600');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const catToSave: CategoryInfo = {
        id: initialCategory?.id || slug,
        name: name.trim(),
        description: description.trim() || 'Custom video category',
        iconName,
        color,
        isCustom: true,
      };

      await onSave(catToSave, initialCategory?.name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.name === iconName)?.icon || Code2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit / Rename Category' : 'Create New Category'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isEditing
                ? 'Update title, description, icon or gradient style.'
                : 'Add a new topic category to organize your learning videos.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Category Preview Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Live Card Preview</label>
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md shrink-0`}
              >
                <SelectedIconComp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {name || 'Category Name'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {description || 'Category description will appear here...'}
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Next.js, Machine Learning, Mobile Dev"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short topic description for this learning category..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category Icon</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              {AVAILABLE_ICONS.map(({ name: itemIconName, icon: IconComp }) => {
                const isSelected = iconName === itemIconName;
                return (
                  <button
                    key={itemIconName}
                    type="button"
                    onClick={() => setIconName(itemIconName)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gradient Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Badge & Header Color</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => {
                const isSelected = color === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className={`p-2.5 rounded-xl flex items-center justify-between border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${preset.value}`} />
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
