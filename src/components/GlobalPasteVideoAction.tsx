import React from 'react';
import { Plus, Link, Youtube, Check, X } from 'lucide-react';
import { useGlobalPaste } from '../context/GlobalPasteContext';

export const GlobalPasteVideoAction: React.FC<{ variant?: 'button' | 'banner' | 'compact' }> = ({
  variant = 'button',
}) => {
  const { openAddVideoModal, lastPastedNotification, clearNotification } = useGlobalPaste();

  if (variant === 'banner' && lastPastedNotification) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Youtube className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{lastPastedNotification}</span>
        </div>
        <button
          onClick={clearNotification}
          className="p-1 hover:bg-emerald-700 rounded-md transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => openAddVideoModal()}
        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-500/20 active:scale-95"
        title="Paste YouTube Link (Ctrl+V / Cmd+V anywhere)"
        aria-label="Paste YouTube Link"
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => openAddVideoModal()}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg active:scale-95 group shrink-0"
    >
      <Youtube className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
      <span>Paste YouTube Link</span>
      <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono text-white/90">
        Ctrl+V
      </span>
    </button>
  );
};
