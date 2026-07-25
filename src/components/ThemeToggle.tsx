import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
          theme === 'light'
            ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-xs'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Light Mode"
        aria-label="Light mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="Dark Mode"
        aria-label="Dark mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        title="System Preference"
        aria-label="System preference"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
