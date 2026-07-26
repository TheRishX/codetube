import React, { useState, useEffect, useRef } from 'react';
import { Bell, Target, Sparkles, Clock, CheckCircle2, ShieldCheck, Play, Send, ChevronRight } from 'lucide-react';
import { LearningGoal, ActivityLog, VideoItem } from '../types';
import { sendBrowserPushNotification } from './DailyTargetReminderToast';

interface StudyNotificationBellProps {
  goal: LearningGoal;
  activityLogs: ActivityLog[];
  videos: VideoItem[];
  onNavigateToWatch: (videoId?: string) => void;
}

export const StudyNotificationBell: React.FC<StudyNotificationBellProps> = ({
  goal,
  activityLogs,
  videos,
  onNavigateToWatch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [todayMins, setTodayMins] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testSent, setTestSent] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate today's study minutes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = activityLogs.filter((l) => l.date === todayStr);
    const totalSecs = todayLogs.reduce((acc, l) => acc + (l.secondsWatched || 0), 0);
    setTodayMins(Math.floor(totalSecs / 60));
  }, [activityLogs]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const targetMins = goal.dailyTarget || 30;
  const isTargetAchieved = todayMins >= targetMins;
  const remainingMins = Math.max(0, targetMins - todayMins);
  const percentComplete = Math.min(100, Math.round((todayMins / targetMins) * 100));

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in your browser.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        sendBrowserPushNotification('🚀 Push Notifications Enabled!', {
          body: `You will get daily target reminders for your ${targetMins} minute CS goal.`,
        });
        setTestSent(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestPush = () => {
    if (Notification.permission !== 'granted') {
      handleEnablePush();
      return;
    }
    sendBrowserPushNotification('📚 Daily Study Target Notification', {
      body: `Today's Progress: ${todayMins} / ${targetMins} mins logged. ${remainingMins > 0 ? `${remainingMins} mins left to reach your goal!` : 'Target completed 🎉'}`,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 relative transition-colors cursor-pointer"
        title="Daily Study Reminders & Notifications"
        aria-label="Study Notifications"
      >
        <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />

        {/* Status Indicator Badge */}
        {!isTargetAchieved ? (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        ) : (
          <span className="absolute -top-1 -right-1 inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-gray-900"></span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  Daily Study Reminder
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Target: {targetMins} Minutes / Day
                </p>
              </div>
            </div>

            {isTargetAchieved ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Met
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                {remainingMins}m Left
              </span>
            )}
          </div>

          {/* Today's Target Card */}
          <div className="space-y-3 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 mb-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Today's Progress
              </span>
              <span className="text-gray-900 dark:text-white font-extrabold">
                {todayMins} / {targetMins} mins
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isTargetAchieved
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-amber-500'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              {isTargetAchieved
                ? "🎉 You've hit your daily target! Keep watching if you want to pull ahead."
                : `Log ${remainingMins} more mins of CS video learning to maintain your study streak!`}
            </p>
          </div>

          {/* Browser Push Notification Section */}
          <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-500" /> Push Notifications
              </span>

              {permission === 'granted' ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
              ) : (
                <button
                  onClick={handleEnablePush}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Enable Push
                </button>
              )}
            </div>

            {permission === 'granted' && (
              <button
                onClick={handleSendTestPush}
                className="w-full py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-500" />
                <span>{testSent ? 'Test Notification Dispatched!' : 'Send Test Push Notification'}</span>
              </button>
            )}
          </div>

          {/* Bottom Action */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
            <button
              onClick={() => {
                setIsOpen(false);
                const uncompleted = videos.find((v) => v.status === 'in-progress' || v.status === 'not-started');
                onNavigateToWatch(uncompleted?.id || videos[0]?.id);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continue CS Learning</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
