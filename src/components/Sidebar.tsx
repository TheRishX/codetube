import React from 'react';
import {
  LayoutDashboard,
  Video,
  Grid,
  BookmarkCheck,
  BarChart2,
  Settings,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Compass,
  ListVideo,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  videoCount: number;
  completedCount: number;
  playlistCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  videoCount,
  completedCount,
  playlistCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home / Feed', icon: LayoutDashboard },
    { id: 'playlists', label: 'Playlists', icon: ListVideo, badge: playlistCount > 0 ? `${playlistCount}` : undefined, isHot: true },
    { id: 'recommendations', label: 'Recommendations', icon: Compass },
    { id: 'library', label: 'My Library', icon: Video, badge: videoCount > 0 ? `${videoCount}` : undefined },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'notes', label: 'Notes & Bookmarks', icon: BookmarkCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings & Docs', icon: Settings },
  ];


  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-gray-200/80 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 min-h-[calc(100vh-4rem)] p-4 sticky top-16 self-start">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'library' && currentTab.startsWith('watch-'));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.isHot && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                  CS
                </span>
              )}
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Widget Card in Sidebar */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Learning Progress</span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {completedCount} of {videoCount} videos completed
        </p>
        <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
            style={{
              width: `${videoCount > 0 ? Math.round((completedCount / videoCount) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Public MVP Badge */}
      <div className="mt-6 p-3 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Public MVP Mode (No Login Required)</span>
      </div>
    </aside>
  );
};
