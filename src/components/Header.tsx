import React from 'react';
import { PlayCircle, Search, Menu, Flame, Sparkles, Youtube, Sliders } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { GlobalPasteVideoAction } from './GlobalPasteVideoAction';
import { StudySessionTimer } from './StudySessionTimer';
import { StudyNotificationBell } from './StudyNotificationBell';
import { AppLayoutPreferences, LearningGoal, ActivityLog, VideoItem } from '../types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onToggleMobileMenu: () => void;
  onToggleSidebarCollapse?: () => void;
  onOpenCustomizer?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  streakCount: number;
  preferences?: AppLayoutPreferences;
  goal?: LearningGoal;
  activityLogs?: ActivityLog[];
  videos?: VideoItem[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onToggleMobileMenu,
  onToggleSidebarCollapse,
  onOpenCustomizer,
  searchQuery,
  onSearchChange,
  streakCount,
  preferences,
  goal,
  activityLogs,
  videos,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left Logo & Hamburger Toggles */}
          <div className="flex items-center gap-2">
            {/* Desktop Hamburger Toggle */}
            {onToggleSidebarCollapse && preferences?.showSidebar !== false && (
              <button
                onClick={onToggleSidebarCollapse}
                className="hidden lg:flex p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Toggle sidebar expansion"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 group text-left ml-1 cursor-pointer"
            >
              <div className="w-10 h-7 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Youtube className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                  Code<span className="text-red-600">Tube</span>
                </span>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block -mt-1">
                  CS & IT Learning
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar in Header */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentTab !== 'library') onNavigate('library');
                }}
                placeholder="Search videos, channels, or tags..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-transparent dark:border-gray-700/60 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Study Session Timer */}
            {preferences?.showHeaderTimer !== false && <StudySessionTimer />}

            {/* Daily Study Notification Bell */}
            {goal && activityLogs && (
              <StudyNotificationBell
                goal={goal}
                activityLogs={activityLogs}
                videos={videos || []}
                onNavigateToWatch={(vId) => {
                  if (vId) onNavigate(`watch-${vId}`);
                  else onNavigate('watch');
                }}
              />
            )}

            {/* Streak Counter Badge */}
            {preferences?.showHeaderStreak !== false && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0 hidden sm:flex"
                title={`${streakCount} day learning streak!`}
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
              </div>
            )}

            {/* Customize Layout button */}
            {onOpenCustomizer && preferences?.showHeaderCustomizerButton !== false && (
              <button
                onClick={onOpenCustomizer}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Customize UI Layout"
              >
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span className="hidden xl:inline">Customize</span>
              </button>
            )}

            {/* Global Paste YouTube Button */}
            {preferences?.showHeaderQuickAdd !== false && <GlobalPasteVideoAction variant="button" />}

            {/* Theme Switcher */}
            <ThemeToggle className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>
    </header>
  );
};

