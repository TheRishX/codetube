import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export const PublicDataWarningBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('learnverse-public-warning-dismissed') === 'true';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('learnverse-public-warning-dismissed', 'true');
  };

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="truncate">
            <span className="font-semibold">Public MVP Warning:</span> LearnVerse is open without login. All saved content is public in Cloud Firestore. Do not save private data.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors shrink-0"
          title="Dismiss warning"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
