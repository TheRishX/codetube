import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  progressPercent?: number;
  badge?: string;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  progressPercent,
  badge,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-3 rounded-2xl ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {typeof progressPercent === 'number' && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
            <span>Daily Target</span>
            <span>{Math.min(100, Math.round(progressPercent))}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
