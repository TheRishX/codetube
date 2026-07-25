import React, { useState } from 'react';
import {
  X,
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  LayoutDashboard,
  Video,
  Grid,
  BookmarkCheck,
  BarChart2,
  Settings,
  Compass,
  ListVideo,
  GripVertical,
  Check,
  Layers,
} from 'lucide-react';
import { AppLayoutPreferences, DEFAULT_LAYOUT_PREFERENCES, CATEGORIES, CategoryInfo } from '../types';

interface CustomizeLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppLayoutPreferences;
  onSavePreferences: (prefs: AppLayoutPreferences) => void;
}

const NAV_ITEM_CONFIG = [
  { id: 'dashboard', label: 'Home / Feed', icon: LayoutDashboard },
  { id: 'playlists', label: 'Playlists', icon: ListVideo },
  { id: 'recommendations', label: 'Recommendations', icon: Compass },
  { id: 'library', label: 'My Library', icon: Video },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'notes', label: 'Notes & Bookmarks', icon: BookmarkCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings & Docs', icon: Settings },
];

export const CustomizeLayoutModal: React.FC<CustomizeLayoutModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'sidebar' | 'categories' | 'homepage'>('sidebar');
  const [localPrefs, setLocalPrefs] = useState<AppLayoutPreferences>(preferences);

  if (!isOpen) return null;

  // Toggle nav item visibility
  const toggleNavItem = (id: string) => {
    setLocalPrefs((prev) => {
      const isHidden = prev.hiddenNavItems.includes(id);
      const updatedHidden = isHidden
        ? prev.hiddenNavItems.filter((item) => item !== id)
        : [...prev.hiddenNavItems, id];
      return { ...prev, hiddenNavItems: updatedHidden };
    });
  };

  // Move category up or down in categoryOrder
  const moveCategory = (catId: string, direction: 'up' | 'down') => {
    setLocalPrefs((prev) => {
      const order = [...(prev.categoryOrder.length > 0 ? prev.categoryOrder : CATEGORIES.map((c) => c.id))];
      const index = order.indexOf(catId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;

      // Swap
      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;

      return { ...prev, categoryOrder: order };
    });
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (catId: string) => {
    setLocalPrefs((prev) => {
      const isHidden = prev.hiddenCategories.includes(catId);
      const updatedHidden = isHidden
        ? prev.hiddenCategories.filter((id) => id !== catId)
        : [...prev.hiddenCategories, catId];
      return { ...prev, hiddenCategories: updatedHidden };
    });
  };

  // Reset to default
  const handleReset = () => {
    setLocalPrefs(DEFAULT_LAYOUT_PREFERENCES);
  };

  const handleSave = () => {
    onSavePreferences(localPrefs);
    onClose();
  };

  // Order categories according to categoryOrder
  const orderedCategories = (localPrefs.categoryOrder.length > 0
    ? localPrefs.categoryOrder
    : CATEGORIES.map((c) => c.id)
  )
    .map((id) => CATEGORIES.find((c) => c.id === id || c.name === id))
    .filter((c): c is CategoryInfo => Boolean(c));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customize CodeTube Layout</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hide unused menus, reorder categories, or simplify your homepage view
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 pt-2 bg-gray-50/30 dark:bg-gray-800/20 gap-2">
          <button
            onClick={() => setActiveTab('sidebar')}
            className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sidebar'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Sidebar Navigation</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Categories & Order</span>
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'homepage'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Homepage Widgets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Sidebar Navigation Items */}
          {activeTab === 'sidebar' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Toggle items on/off to declutter your sidebar. Hidden pages remain available via direct navigation or settings.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NAV_ITEM_CONFIG.map((item) => {
                  const Icon = item.icon;
                  const isVisible = !localPrefs.hiddenNavItems.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleNavItem(item.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isVisible
                          ? 'bg-white dark:bg-gray-800/90 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isVisible
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            isVisible ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                          isVisible
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Category Reordering and Toggles */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Move categories up/down to set their display priority on the homepage category bar, or hide unwanted topics.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {orderedCategories.map((cat, idx) => {
                  const isHidden = localPrefs.hiddenCategories.includes(cat.id);

                  return (
                    <div
                      key={cat.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isHidden
                          ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 opacity-50'
                          : 'bg-white dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{cat.name}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{cat.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat.id, 'up')}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          disabled={idx === orderedCategories.length - 1}
                          onClick={() => moveCategory(cat.id, 'down')}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle visibility */}
                        <button
                          onClick={() => toggleCategoryVisibility(cat.id)}
                          className={`ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                            !isHidden
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                        >
                          {!isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{!isHidden ? 'Shown' : 'Hidden'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Homepage Widgets */}
          {activeTab === 'homepage' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Choose which sections appear on your CodeTube main feed.
              </p>

              {/* Last Played Section Toggle */}
              <div
                onClick={() =>
                  setLocalPrefs((prev) => ({
                    ...prev,
                    showLastPlayedOnDashboard: !prev.showLastPlayedOnDashboard,
                  }))
                }
                className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Last Played Videos Section</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Displays your recently watched videos at the top of the homepage for instant resumption.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.showLastPlayedOnDashboard}
                  onChange={() => {}}
                  className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer"
                />
              </div>

              {/* My Library Section Toggle */}
              <div
                onClick={() =>
                  setLocalPrefs((prev) => ({
                    ...prev,
                    showLibraryOnDashboard: !prev.showLibraryOnDashboard,
                  }))
                }
                className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">My Library Grid Section</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Displays your full video library grid on the homepage.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.showLibraryOnDashboard}
                  onChange={() => {}}
                  className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Custom Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
