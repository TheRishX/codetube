import React, { useState, useEffect } from 'react';
import { Target, Bell, Sparkles, X, Play, Clock, CheckCircle2, ShieldCheck, BellOff, ArrowRight } from 'lucide-react';
import { LearningGoal, ActivityLog, VideoItem } from '../types';

interface DailyTargetReminderToastProps {
  goal: LearningGoal;
  activityLogs: ActivityLog[];
  videos: VideoItem[];
  onNavigateToWatch: (videoId?: string) => void;
}

export function sendBrowserPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('Browser notifications are not supported by this browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch (e) {
      console.error('Failed to trigger browser push notification:', e);
      return false;
    }
  }
  return false;
}

export const DailyTargetReminderToast: React.FC<DailyTargetReminderToastProps> = ({
  goal,
  activityLogs,
  videos,
  onNavigateToWatch,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [todayMins, setTodayMins] = useState(0);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [hasTestedPush, setHasTestedPush] = useState(false);

  // Calculate today's study minutes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = activityLogs.filter((l) => l.date === todayStr);
    const totalSecs = todayLogs.reduce((acc, l) => acc + (l.secondsWatched || 0), 0);
    const mins = Math.floor(totalSecs / 60);
    setTodayMins(mins);

    const targetMins = goal.dailyTarget || 30;

    // Check snooze/dismiss status in localStorage or sessionStorage
    const dismissedKey = `study_reminder_dismissed_${todayStr}`;
    const snoozedUntil = localStorage.getItem('study_reminder_snoozed_until');

    const isDismissedToday = sessionStorage.getItem(dismissedKey) === 'true';
    const isSnoozedNow = snoozedUntil ? Date.now() < parseInt(snoozedUntil, 10) : false;

    // Show reminder if user has not met their target yet today and hasn't dismissed/snoozed
    if (mins < targetMins && !isDismissedToday && !isSnoozedNow) {
      // Delay toast display by 2 seconds so it feels natural on page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [activityLogs, goal]);

  // Handle requesting browser push permission
  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === 'granted') {
        sendBrowserPushNotification('🚀 Study Reminders Activated!', {
          body: `You'll receive push notifications to keep you on track for your ${goal.dailyTarget || 30} min daily CS learning target.`,
        });
        setHasTestedPush(true);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const handleTestPushNotification = () => {
    if (Notification.permission !== 'granted') {
      handleEnablePush();
      return;
    }
    const remainingMins = Math.max(0, (goal.dailyTarget || 30) - todayMins);
    sendBrowserPushNotification('📚 Daily Study Target Reminder', {
      body: `You have studied ${todayMins} mins today! ${remainingMins > 0 ? `${remainingMins} mins left to hit your daily target!` : 'Target achieved! Great job!'}`,
    });
    setHasTestedPush(true);
  };

  const handleDismissToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    sessionStorage.setItem(`study_reminder_dismissed_${todayStr}`, 'true');
    setIsVisible(false);
  };

  const handleSnooze = (hours: number = 2) => {
    const snoozeTime = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem('study_reminder_snoozed_until', snoozeTime.toString());
    setIsVisible(false);
  };

  const handleStartStudying = () => {
    setIsVisible(false);
    const uncompleted = videos.find((v) => v.status === 'in-progress' || v.status === 'not-started');
    onNavigateToWatch(uncompleted?.id || videos[0]?.id);
  };

  if (!isVisible) return null;

  const targetMins = goal.dailyTarget || 30;
  const remainingMins = Math.max(0, targetMins - todayMins);
  const percentComplete = Math.min(100, Math.round((todayMins / targetMins) * 100));

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-indigo-500/30 dark:border-indigo-500/40 animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Daily Target Reminder
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {todayMins === 0 ? "Ready for Today's CS Study?" : `Keep the Momentum Going!`}
            </h4>
          </div>
        </div>

        <button
          onClick={handleDismissToday}
          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
          title="Dismiss for today"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content & Message */}
      <div className="mt-3 space-y-3">
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {todayMins === 0 ? (
            <>You haven't logged any study time today. Spend <strong>{targetMins} minutes</strong> mastering computer science to maintain your streak!</>
          ) : (
            <>You've completed <strong className="text-indigo-600 dark:text-indigo-400">{todayMins} mins</strong> today! Just <strong className="text-amber-500">{remainingMins} more minutes</strong> to hit your daily goal.</>
          )}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/60">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Progress
            </span>
            <span className="text-gray-900 dark:text-white font-bold">
              {todayMins} / {targetMins} mins ({percentComplete}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Browser Push Permission Banner if Default */}
        {permissionState === 'default' && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Get push alerts on desktop</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors shrink-0 cursor-pointer"
            >
              Enable
            </button>
          </div>
        )}

        {/* Push Active Badge */}
        {permissionState === 'granted' && (
          <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Desktop Push Notifications Active
            </span>
            <button
              onClick={handleTestPushNotification}
              className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 cursor-pointer"
            >
              {hasTestedPush ? 'Test Sent!' : 'Send Test Push'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleStartStudying}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Learning</span>
          </button>

          <button
            onClick={() => handleSnooze(2)}
            className="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
            title="Snooze reminder for 2 hours"
          >
            Snooze 2h
          </button>
        </div>
      </div>
    </div>
  );
};
