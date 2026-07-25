import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Sparkles, X, CheckCircle2 } from 'lucide-react';

export function formatSessionTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export const StudySessionTimer: React.FC = () => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer ticker
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsRunning(false);
        const formatted = formatSessionTime(elapsedSeconds);
        setToastMessage(`Study session paused! Continuous learn time: ${formatted}`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, elapsedSeconds]);

  // Toast auto dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (elapsedSeconds > 5) {
        setToastMessage(`Study session paused! Total time recorded: ${formatSessionTime(elapsedSeconds)}`);
      }
    } else {
      setIsRunning(true);
      setToastMessage(null);
    }
  };

  const handleReset = () => {
    if (elapsedSeconds > 0) {
      setToastMessage(`Session reset. You completed ${formatSessionTime(elapsedSeconds)} of focused study!`);
    }
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-1.5">
          <Timer className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isRunning ? 'animate-spin' : ''}`} />
          <span className="font-mono text-xs font-bold min-w-[56px]">
            {formatSessionTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1 pl-1 border-l border-indigo-200 dark:border-indigo-800">
          <button
            onClick={handleToggleTimer}
            className={`p-1 rounded-lg transition-colors ${
              isRunning
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            }`}
            title={isRunning ? 'Pause Study Session' : 'Start Study Session'}
            aria-label={isRunning ? 'Pause Study Session' : 'Start Study Session'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {elapsedSeconds > 0 && (
            <button
              onClick={handleReset}
              className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors"
              title="Reset Session Timer"
              aria-label="Reset Session Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Summary Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-2xl bg-gray-900 text-white border border-indigo-500/30 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Study Session Summary
            </p>
            <p className="text-xs text-gray-200 mt-0.5 leading-relaxed font-medium">
              {toastMessage}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
