import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { LearningGoal, ActivityLog } from '../types';

interface GoalToastProps {
  goal: LearningGoal;
  activityLogs: ActivityLog[];
}

export const GoalToast: React.FC<GoalToastProps> = ({ goal, activityLogs }) => {
  const [showToast, setShowToast] = useState(false);
  const [todayMins, setTodayMins] = useState(0);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = activityLogs.filter((l) => l.date === todayStr);
    const totalSecsToday = todayLogs.reduce((acc, l) => acc + (l.secondsWatched || 0), 0);
    const mins = Math.floor(totalSecsToday / 60);
    setTodayMins(mins);

    const targetMins = goal.dailyTarget || 30;
    const toastKey = `goal_toast_shown_${todayStr}`;
    const alreadyDismissed = sessionStorage.getItem(toastKey);

    if (mins >= targetMins && !alreadyDismissed) {
      setShowToast(true);
    }
  }, [activityLogs, goal]);

  const handleDismiss = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    sessionStorage.setItem(`goal_toast_shown_${todayStr}`, 'true');
    setShowToast(false);
  };

  if (!showToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-5 shadow-2xl border border-indigo-500/40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30 shrink-0">
          <Trophy className="w-6 h-6 fill-current" />
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wider uppercase text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Goal Reached!
            </span>
          </div>
          <h4 className="font-extrabold text-white text-sm">
            Daily Learning Goal Achieved 🎉
          </h4>
          <p className="text-xs text-indigo-100/90 leading-snug">
            Awesome job! You've logged <strong className="text-amber-300">{todayMins} mins</strong> of study today, hitting your <strong className="text-amber-300">{goal.dailyTarget} min</strong> target.
          </p>

          <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Streak Maintained! Keep it up!</span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
