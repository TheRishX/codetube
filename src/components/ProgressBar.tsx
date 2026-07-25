import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  status?: 'not-started' | 'in-progress' | 'completed';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  size = 'md',
  status = 'in-progress',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorClasses = {
    'not-started': 'bg-gray-300 dark:bg-gray-600',
    'in-progress': 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500',
    'completed': 'bg-gradient-to-r from-emerald-500 to-teal-500',
  };

  const activeColor = clampedProgress === 100 ? colorClasses.completed : colorClasses[status];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          <span>{clampedProgress === 100 ? 'Completed' : `${clampedProgress}% complete`}</span>
          <span className="tabular-nums">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${activeColor}`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
