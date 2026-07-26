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
  Check,
  Layers,
  Sidebar as SidebarIcon,
  Clock,
  Flame,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { AppLayoutPreferences, DEFAULT_LAYOUT_PREFERENCES, CATEGORIES, CategoryInfo } from '../types';

interface CustomizeLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppLayoutPreferences;
  onSavePreferences: (prefs: AppLayoutPreferences) => void;
}

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home / Feed', icon: LayoutDashboard },
  { id: 'playlists', label: 'Playlists', icon: ListVideo },
  { id: 'recommendations', label: 'Recommendations', icon: Compass },
  { id: 'library', label: 'My Library', icon: Video },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'notes', label: 'Notes & Bookmarks', icon: BookmarkCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings & Docs', icon: Settings },
];

// Sortable Row Item Component for dnd-kit
function SortableCategoryRow({
  cat,
  idx,
  totalCount,
  isHidden,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
}: {
  key?: React.Key;
  cat: CategoryInfo;
  idx: number;
  totalCount: number;
  isHidden: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
        isDragging
          ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 shadow-xl opacity-90'
          : isHidden
          ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 opacity-50'
          : 'bg-white dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/80 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          title="Drag to reorder category"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{cat.name}</h4>
          <p className="text-[10px] text-gray-400 truncate">{cat.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={idx === 0}
          onClick={onMoveUp}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
          title="Move up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={idx === totalCount - 1}
          onClick={onMoveDown}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
          title="Move down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleVisibility}
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
}

// Sortable Navigation Item Component for dnd-kit
function SortableNavRow({
  item,
  idx,
  totalCount,
  isVisible,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}: {
  key?: React.Key;
  item: typeof ALL_NAV_ITEMS[0];
  idx: number;
  totalCount: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const Icon = item.icon;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
        isDragging
          ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 shadow-xl opacity-90'
          : isVisible
          ? 'bg-white dark:bg-gray-800/90 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 opacity-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          title="Drag to reorder navigation item"
        >
          <GripVertical className="w-4 h-4" />
        </button>
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

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={idx === 0}
          onClick={onMoveUp}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
          title="Move up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={idx === totalCount - 1}
          onClick={onMoveDown}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:opacity-30 transition-colors"
          title="Move down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`ml-1 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
            isVisible
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}
        >
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{isVisible ? 'Visible' : 'Hidden'}</span>
        </button>
      </div>
    </div>
  );
}

export const CustomizeLayoutModal: React.FC<CustomizeLayoutModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'components' | 'sidebar' | 'categories'>('components');
  const [localPrefs, setLocalPrefs] = useState<AppLayoutPreferences>(preferences);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const toggleBooleanPref = (key: keyof AppLayoutPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleNavItem = (id: string) => {
    setLocalPrefs((prev) => {
      const hidden = prev.hiddenNavItems || [];
      const isHidden = hidden.includes(id);
      const updatedHidden = isHidden ? hidden.filter((item) => item !== id) : [...hidden, id];
      return { ...prev, hiddenNavItems: updatedHidden };
    });
  };

  const toggleCategoryVisibility = (catId: string) => {
    setLocalPrefs((prev) => {
      const hidden = prev.hiddenCategories || [];
      const isHidden = hidden.includes(catId);
      const updatedHidden = isHidden ? hidden.filter((id) => id !== catId) : [...hidden, catId];
      return { ...prev, hiddenCategories: updatedHidden };
    });
  };

  const moveCategory = (catId: string, direction: 'up' | 'down') => {
    setLocalPrefs((prev) => {
      const order = [...(prev.categoryOrder && prev.categoryOrder.length > 0 ? prev.categoryOrder : CATEGORIES.map((c) => c.id))];
      const index = order.indexOf(catId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return prev;

      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;

      return { ...prev, categoryOrder: order };
    });
  };

  const moveNavItem = (navId: string, direction: 'up' | 'down') => {
    setLocalPrefs((prev) => {
      const currentOrder = prev.navOrder && prev.navOrder.length > 0 ? prev.navOrder : ALL_NAV_ITEMS.map((n) => n.id);
      const index = currentOrder.indexOf(navId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentOrder.length) return prev;

      const order = [...currentOrder];
      const temp = order[index];
      order[index] = order[targetIndex];
      order[targetIndex] = temp;

      return { ...prev, navOrder: order };
    });
  };

  // Handle Drag End for Categories
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalPrefs((prev) => {
        const currentOrder = prev.categoryOrder && prev.categoryOrder.length > 0 ? prev.categoryOrder : CATEGORIES.map((c) => c.id);
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          return { ...prev, categoryOrder: arrayMove(currentOrder, oldIndex, newIndex) };
        }
        return prev;
      });
    }
  };

  // Handle Drag End for Sidebar Navigation
  const handleNavDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalPrefs((prev) => {
        const currentOrder = prev.navOrder && prev.navOrder.length > 0 ? prev.navOrder : ALL_NAV_ITEMS.map((n) => n.id);
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          return { ...prev, navOrder: arrayMove(currentOrder, oldIndex, newIndex) };
        }
        return prev;
      });
    }
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_LAYOUT_PREFERENCES);
  };

  const handleSave = () => {
    onSavePreferences(localPrefs);
    onClose();
  };

  // Ordered Category Items
  const orderedCategories = (localPrefs.categoryOrder && localPrefs.categoryOrder.length > 0
    ? localPrefs.categoryOrder
    : CATEGORIES.map((c) => c.id)
  )
    .map((id) => CATEGORIES.find((c) => c.id === id || c.name === id))
    .filter((c): c is CategoryInfo => Boolean(c));

  // Ordered Nav Items
  const currentNavOrder = localPrefs.navOrder && localPrefs.navOrder.length > 0 ? localPrefs.navOrder : ALL_NAV_ITEMS.map((n) => n.id);
  const orderedNavItems = currentNavOrder
    .map((id) => ALL_NAV_ITEMS.find((n) => n.id === id))
    .filter((n): n is typeof ALL_NAV_ITEMS[0] => Boolean(n));

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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modular Layout & UI Customizer</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle major UI elements, reorder navigation menus, or drag-and-drop category filters
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
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 pt-2 bg-gray-50/30 dark:bg-gray-800/20 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-3 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'components'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>UI Component Toggles</span>
          </button>
          <button
            onClick={() => setActiveTab('sidebar')}
            className={`px-4 py-3 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sidebar'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <SidebarIcon className="w-4 h-4" />
            <span>Sidebar Navigation</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Category Bar Reordering</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: UI Component Toggles */}
          {activeTab === 'components' && (
            <div className="space-y-6">
              {/* Header Elements */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Header Top Bar Elements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Study Timer</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showHeaderTimer !== false}
                      onChange={() => toggleBooleanPref('showHeaderTimer')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Streak Counter</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showHeaderStreak !== false}
                      onChange={() => toggleBooleanPref('showHeaderStreak')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <PlusCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Paste Video Button</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showHeaderQuickAdd !== false}
                      onChange={() => toggleBooleanPref('showHeaderQuickAdd')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Sidebar Elements */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <SidebarIcon className="w-3.5 h-3.5" /> Sidebar Sections
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <SidebarIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Main Sidebar Panel</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showSidebar !== false}
                      onChange={() => toggleBooleanPref('showSidebar')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <BarChart2 className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Study Stats Widget</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showSidebarStats !== false}
                      onChange={() => toggleBooleanPref('showSidebarStats')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Dashboard Homepage Sections */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard & Homepage Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Grid className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Top Category Filter Bar</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showCategoryFilterBar !== false}
                      onChange={() => toggleBooleanPref('showCategoryFilterBar')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Last Played Section</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showLastPlayedOnDashboard !== false}
                      onChange={() => toggleBooleanPref('showLastPlayedOnDashboard')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <ListVideo className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Playlists & Courses Section</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showPlaylistsOnDashboard !== false}
                      onChange={() => toggleBooleanPref('showPlaylistsOnDashboard')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Library Video Grid</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showLibraryOnDashboard !== false}
                      onChange={() => toggleBooleanPref('showLibraryOnDashboard')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Search Bar</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showDashboardSearch !== false}
                      onChange={() => toggleBooleanPref('showDashboardSearch')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Filter className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Status Filter Dropdown</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showDashboardStatusFilter !== false}
                      onChange={() => toggleBooleanPref('showDashboardStatusFilter')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <ArrowUpDown className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Sort By Dropdown</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localPrefs.showDashboardSortBy !== false}
                      onChange={() => toggleBooleanPref('showDashboardSortBy')}
                      className="w-4 h-4 accent-indigo-600 rounded-md cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Sidebar Navigation Drag-and-Drop Reorder */}
          {activeTab === 'sidebar' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Drag using the handle <GripVertical className="w-3.5 h-3.5 inline text-gray-400" /> or use arrows to reorder navigation tabs and set visibility.
              </p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavDragEnd}>
                <SortableContext items={orderedNavItems.map((n) => n.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {orderedNavItems.map((item, idx) => {
                      const isVisible = !(localPrefs.hiddenNavItems || []).includes(item.id);

                      return (
                        <SortableNavRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          totalCount={orderedNavItems.length}
                          isVisible={isVisible}
                          onToggleVisibility={() => toggleNavItem(item.id)}
                          onMoveUp={() => moveNavItem(item.id, 'up')}
                          onMoveDown={() => moveNavItem(item.id, 'down')}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* TAB 3: Category Filter Bar Drag-and-Drop Reorder */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Drag using the handle <GripVertical className="w-3.5 h-3.5 inline text-gray-400" /> or use arrows to prioritize category chips on your homepage.
              </p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={orderedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {orderedCategories.map((cat, idx) => {
                      const isHidden = (localPrefs.hiddenCategories || []).includes(cat.id);

                      return (
                        <SortableCategoryRow
                          key={cat.id}
                          cat={cat}
                          idx={idx}
                          totalCount={orderedCategories.length}
                          isHidden={isHidden}
                          onMoveUp={() => moveCategory(cat.id, 'up')}
                          onMoveDown={() => moveCategory(cat.id, 'down')}
                          onToggleVisibility={() => toggleCategoryVisibility(cat.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
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
            <span>Reset Default</span>
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
