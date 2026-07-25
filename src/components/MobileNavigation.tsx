import React from 'react';
import {
  LayoutDashboard,
  Video,
  Grid,
  BookmarkCheck,
  BarChart2,
  Settings,
  X,
  Youtube,
  Compass,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { GlobalPasteVideoAction } from './GlobalPasteVideoAction';

interface MobileNavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const bottomNavItems = [
    { id: 'dashboard', label: 'Feed', icon: LayoutDashboard },
    { id: 'recommendations', label: 'Recs', icon: Compass },
    { id: 'library', label: 'Library', icon: Video },
    { id: 'categories', label: 'Topics', icon: Grid },
    { id: 'notes', label: 'Notes', icon: BookmarkCheck },
  ];

  const fullNavItems = [
    ...bottomNavItems,
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings & Docs', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop & Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                    <Youtube className="w-4 h-4 fill-white" />
                  </div>
                  <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                    Code<span className="text-red-600">Tube</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {fullNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <GlobalPasteVideoAction variant="button" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">App Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 px-2 py-1.5 flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'library' && currentTab.startsWith('watch-'));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
