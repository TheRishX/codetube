import React, { useState } from 'react';
import {
  Settings,
  Target,
  Palette,
  Database,
  FileText,
  ShieldAlert,
  RotateCcw,
  Check,
  Flame,
  HelpCircle,
  Copy,
  Terminal,
  Bell,
  Send,
  ShieldCheck,
  CheckCircle2,
  Key,
  Youtube,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { LearningGoal } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { saveGoalToFirestore, seedInitialDataIfEmpty } from '../lib/firebase';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { sendBrowserPushNotification } from '../components/DailyTargetReminderToast';
import { getStoredApiKey, setStoredApiKey, testYouTubeApiKey, ApiKeyTestResult } from '../services/playlistFetcher';
import { PlaylistTesterTool } from '../components/PlaylistTesterTool';

interface SettingsPageProps {
  goal: LearningGoal;
  onGoalUpdated: (newGoal: LearningGoal) => void;
  onRefreshAllData: () => void;
  onImportPlaylistFromTester?: (meta: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  goal,
  onGoalUpdated,
  onRefreshAllData,
  onImportPlaylistFromTester,
}) => {
  const [dailyTargetInput, setDailyTargetInput] = useState(goal.dailyTarget.toString());
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(goal.weeklyTarget.toString());
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // YouTube API Key state
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [apiKeyTestResult, setApiKeyTestResult] = useState<ApiKeyTestResult | null>(null);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false);

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKeyInput);
    setApiKeySaveSuccess(true);
    setTimeout(() => setApiKeySaveSuccess(false), 3000);
  };

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true);
    setApiKeyTestResult(null);
    try {
      const res = await testYouTubeApiKey(apiKeyInput);
      setApiKeyTestResult(res);
      if (res.valid) {
        setStoredApiKey(apiKeyInput);
      }
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported by your current browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        sendBrowserPushNotification('🎯 Daily CS Study Reminders Enabled!', {
          body: `Target set to ${dailyTargetInput || 30} mins per day. Keep up the learning streak!`,
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestPushInSettings = () => {
    if (notificationPermission !== 'granted') {
      handleRequestPushPermission();
      return;
    }
    sendBrowserPushNotification('📚 LearnVerse Daily Goal Test', {
      body: `Your daily target is ${dailyTargetInput || 30} minutes. Don't forget to complete today's CS study session!`,
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoal(true);
    try {
      const updatedGoal: LearningGoal = {
        ...goal,
        dailyTarget: parseInt(dailyTargetInput, 10) || 30,
        weeklyTarget: parseInt(weeklyTargetInput, 10) || 210,
      };
      await saveGoalToFirestore(updatedGoal);
      onGoalUpdated(updatedGoal);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleSeedData = async () => {
    await seedInitialDataIfEmpty();
    onRefreshAllData();
    setIsResetConfirmOpen(false);
  };

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Settings & Documentation
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Customize your learning targets, appearance, and explore project documentation
        </p>
      </div>

      {/* YouTube API v3 Settings Card */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Key className="w-5 h-5 text-amber-500" />
            YouTube Data API v3 Configuration
          </div>

          {apiKeyInput ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> Custom Key Configured
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
              Multi-Mirror Proxy Active
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Configure an official Google Cloud YouTube Data API v3 key for direct, high-resolution playlist metadata fetching and video durations. If empty, CodeTube uses full-stack RSS XML server proxies automatically.
        </p>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Google Cloud YouTube API Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="px-4 py-2.5 rounded-2xl bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Save Key
            </button>
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={isTestingApiKey || !apiKeyInput.trim()}
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isTestingApiKey ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4" />
                  <span>Test Key</span>
                </>
              )}
            </button>
          </div>

          {apiKeySaveSuccess && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> API Key saved successfully!
            </p>
          )}

          {apiKeyTestResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 ${
                apiKeyTestResult.valid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {apiKeyTestResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                {apiKeyTestResult.message}
              </div>
              {apiKeyTestResult.playlistTitle && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Test Playlist Fetched: <strong>{apiKeyTestResult.playlistTitle}</strong> ({apiKeyTestResult.itemCount} items)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Playlist Checker & Tester Tool */}
      <PlaylistTesterTool onImportPlaylist={onImportPlaylistFromTester} />

      {/* Learning Goals Settings */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Learning Goals & Targets
        </div>

        <form onSubmit={handleSaveGoal} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Daily Target (Minutes)
            </label>
            <input
              type="number"
              value={dailyTargetInput}
              onChange={(e) => setDailyTargetInput(e.target.value)}
              min={5}
              max={600}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Weekly Target (Minutes)
            </label>
            <input
              type="number"
              value={weeklyTargetInput}
              onChange={(e) => setWeeklyTargetInput(e.target.value)}
              min={30}
              max={4200}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingGoal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Save Learning Targets
            </button>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Daily Target Push Notification & Toast Settings */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Daily Push Notifications & Reminders
          </div>

          {notificationPermission === 'granted' ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Browser Push Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
              Permission Required
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          CodeTube sends daily motivational toasts and optional desktop push notifications when you haven't completed your daily target ({dailyTargetInput || 30} mins/day).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {notificationPermission !== 'granted' ? (
            <button
              onClick={handleRequestPushPermission}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Desktop Push Notifications</span>
            </button>
          ) : (
            <button
              onClick={handleTestPushInSettings}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{testNotificationSent ? 'Test Notification Dispatched!' : 'Send Test Push Notification'}</span>
            </button>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pl-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>In-App Toast Reminders are automatically active on startup.</span>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Theme Preference
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Switch between Light, Dark, or System mode
            </p>
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Sample Data & Reset */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Data & Sample Tutorials
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          If your database is empty, click below to re-seed initial Computer Science and Software Engineering sample videos into Cloud Firestore.
        </p>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Seed Initial Sample Tutorials</span>
        </button>
      </div>

      {/* Complete Project Documentation Viewer */}
      <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Complete Setup & Developer Documentation
        </div>

        <div className="space-y-6 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              1. Project Setup & Architecture
            </h3>
            <p>
              LearnVerse is built using React 19, TypeScript, Tailwind CSS v4, and Google AI Studio's Cloud Firestore integration.
              All video metadata, user watch progress, timestamped notes, bookmarks, and daily streaks are stored directly in Cloud Firestore.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              2. Firestore Security Rules (Public MVP)
            </h3>
            <p>
              For this public no-login MVP, Firestore Security Rules are configured to allow public reads and writes across all collections:
            </p>
            <div className="relative bg-gray-900 text-gray-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
              <button
                onClick={() =>
                  copySnippet(
                    `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`,
                    'rules'
                  )
                }
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                {copiedCode === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              3. Automatic Global YouTube Link Detection
            </h3>
            <p>
              LearnVerse features a global paste listener (`GlobalPasteContext`). When you paste any YouTube link (`youtube.com/watch?v=...`, `youtu.be/...`, or `shorts`), the app automatically catches it from any page, extracts the video ID, fetches video details via YouTube oEmbed API, and opens the Save Modal pre-populated!
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              4. Local Development & Deployment
            </h3>
            <div className="relative bg-gray-900 text-gray-100 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
              <pre>{`npm run dev    # Launches Vite dev server on port 3000
npm run build  # Builds production bundle
npm run lint   # Runs TypeScript check`}</pre>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Seed Sample Tutorials?"
        message="This will seed initial Computer Science sample videos into your Cloud Firestore database."
        confirmText="Seed Tutorials"
        variant="info"
        onConfirm={handleSeedData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
