/**
 * LearnVerse - Public YouTube Learning Platform
 * Apache-2.0 License
 */

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { db, seedInitialDataIfEmpty, deleteVideoFromFirestore, updateVideoInFirestore, savePlaylistToFirestore } from './lib/firebase';
import { VideoItem, VideoProgress, VideoNote, VideoBookmark, LearningGoal, ActivityLog, Playlist, AppLayoutPreferences, DEFAULT_LAYOUT_PREFERENCES } from './types';

import { ThemeProvider } from './context/ThemeContext';
import { GlobalPasteProvider, useGlobalPaste } from './context/GlobalPasteContext';

import { Header } from './components/Header';

import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { AddVideoModal } from './components/AddVideoModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { GlobalPasteVideoAction } from './components/GlobalPasteVideoAction';
import { GoalToast } from './components/GoalToast';
import { CustomizeLayoutModal } from './components/CustomizeLayoutModal';

import { DashboardPage } from './pages/DashboardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { VideoLibraryPage } from './pages/VideoLibraryPage';
import { WatchVideoPage } from './pages/WatchVideoPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { NotesPage } from './pages/NotesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { EditVideoModal } from './components/EditVideoModal';

export function LearnVerseApp() {
  const { openAddVideoModal } = useGlobalPaste();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedVideoSeekTime, setSelectedVideoSeekTime] = useState<number | undefined>(undefined);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress>>({});

  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [goal, setGoal] = useState<LearningGoal>({
    id: 'default-goal',
    title: 'Daily Frontend & CS Mastery',
    dailyTarget: 30,
    weeklyTarget: 210,
    createdAt: Date.now(),
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  // Layout Customization & Sidebar collapse state
  const [layoutPreferences, setLayoutPreferences] = useState<AppLayoutPreferences>(() => {
    try {
      const saved = localStorage.getItem('codetube_layout_prefs');
      return saved ? { ...DEFAULT_LAYOUT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_LAYOUT_PREFERENCES;
    } catch {
      return DEFAULT_LAYOUT_PREFERENCES;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => layoutPreferences.sidebarCollapsed || false
  );
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleSavePreferences = useCallback((newPrefs: AppLayoutPreferences) => {
    setLayoutPreferences(newPrefs);
    try {
      localStorage.setItem('codetube_layout_prefs', JSON.stringify(newPrefs));
    } catch (e) {
      console.error('Failed to save layout preferences', e);
    }
  }, []);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      handleSavePreferences({ ...layoutPreferences, sidebarCollapsed: next });
      return next;
    });
  }, [layoutPreferences, handleSavePreferences]);

  // Zen Mode state
  const [isZenMode, setIsZenMode] = useState(false);

  // Watch Later Queue state with localStorage fallback
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('codetube_watch_later') || '[]');
    } catch {
      return [];
    }
  });

  const handleToggleWatchLater = useCallback((video: VideoItem) => {
    setWatchLaterIds((prev) => {
      const exists = prev.includes(video.id);
      const updated = exists ? prev.filter((id) => id !== video.id) : [...prev, video.id];
      try {
        localStorage.setItem('codetube_watch_later', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save watch later', e);
      }
      return updated;
    });
  }, []);

  const handlePlayAllWatchLater = useCallback(() => {
    const firstQueued = videos.find((v) => watchLaterIds.includes(v.id));
    if (firstQueued) {
      setSelectedVideo(firstQueued);
      setCurrentTab(`watch-${firstQueued.id}`);
    }
  }, [videos, watchLaterIds]);

  // Initialize and listen to Firestore Collections
  useEffect(() => {
    // Seed database if empty
    seedInitialDataIfEmpty();

    const handleSnapshotError = (err: any) => {
      console.warn('Firestore real-time connection notice (operating in offline/cached mode):', err?.message || err);
    };

    // 1. Realtime listener for Videos
    const unsubVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      const vList: VideoItem[] = [];
      snapshot.forEach((docSnap) => {
        vList.push(docSnap.data() as VideoItem);
      });
      setVideos(vList);
    }, handleSnapshotError);

    // 2. Realtime listener for Playlists
    const unsubPlaylists = onSnapshot(collection(db, 'playlists'), (snapshot) => {
      const plList: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        plList.push(docSnap.data() as Playlist);
      });
      setPlaylists(plList);
    }, handleSnapshotError);

    // 3. Realtime listener for Progress
    const unsubProgress = onSnapshot(collection(db, 'progress'), (snapshot) => {
      const pMap: Record<string, VideoProgress> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as VideoProgress;
        pMap[data.videoId] = data;
      });
      setProgressMap(pMap);
    }, handleSnapshotError);

    // 4. Realtime listener for Notes
    const unsubNotes = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const nList: VideoNote[] = [];
      snapshot.forEach((docSnap) => {
        nList.push(docSnap.data() as VideoNote);
      });
      setNotes(nList);
    }, handleSnapshotError);

    // 5. Realtime listener for Bookmarks
    const unsubBookmarks = onSnapshot(collection(db, 'bookmarks'), (snapshot) => {
      const bList: VideoBookmark[] = [];
      snapshot.forEach((docSnap) => {
        bList.push(docSnap.data() as VideoBookmark);
      });
      setBookmarks(bList);
    }, handleSnapshotError);

    // 6. Listener for Learning Goals
    const unsubGoal = onSnapshot(doc(db, 'learningGoals', 'default-goal'), (docSnap) => {
      if (docSnap.exists()) {
        setGoal(docSnap.data() as LearningGoal);
      }
    }, handleSnapshotError);

    // 7. Listener for Activity Logs
    const unsubLogs = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
      const lList: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        lList.push(docSnap.data() as ActivityLog);
      });
      setActivityLogs(lList);
    }, handleSnapshotError);

    return () => {
      unsubVideos();
      unsubPlaylists();
      unsubProgress();
      unsubNotes();
      unsubBookmarks();
      unsubGoal();
      unsubLogs();
    };
  }, []);


  // Compute Streak Count from Activity Logs
  const calculateStreak = useCallback(() => {
    if (activityLogs.length === 0) return 1;

    const dates = Array.from(new Set(activityLogs.map((l) => l.date))).sort().reverse();
    if (dates.length === 0) return 1;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
      return 1; // Minimum baseline streak
    }

    let streak = 0;
    let curr = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = curr.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        if (i === 0) {
          // If today hasn't been logged yet, check if yesterday was logged
          curr.setDate(curr.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return Math.max(1, streak);
  }, [activityLogs]);

  const streakCount = calculateStreak();

  // Navigation Helper
  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    if (tab !== 'watch' && !tab.startsWith('watch-')) {
      setSelectedVideo(null);
    }
  };

  const handleSelectVideo = (video: VideoItem, seekTime?: number) => {
    setSelectedVideo(video);
    if (typeof seekTime === 'number') {
      setSelectedVideoSeekTime(seekTime);
    }
    setCurrentTab(`watch-${video.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFilter = (catName: string) => {
    setSelectedCategoryFilter(catName);
    setCurrentTab('library');
  };

  const handleArchiveToggle = async (video: VideoItem) => {
    const newStatus = video.status === 'archived' ? 'not-started' : 'archived';
    await updateVideoInFirestore(video.id, { status: newStatus });
  };

  const handleDeleteConfirm = async () => {
    if (deletingVideo) {
      await deleteVideoFromFirestore(deletingVideo.id);
      if (selectedVideo?.id === deletingVideo.id) {
        setCurrentTab('library');
        setSelectedVideo(null);
      }
      setDeletingVideo(null);
    }
  };

  const completedCount = videos.filter(
    (v) => v.status === 'completed' || progressMap[v.id]?.percentageCompleted === 100
  ).length;

  const isWatchingAndZen = currentTab.startsWith('watch-') && isZenMode;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Banner for Global Paste Detection Notifications */}
      {!isWatchingAndZen && <GlobalPasteVideoAction variant="banner" />}

      {/* Header Bar */}
      {!isWatchingAndZen && (
        <Header
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          streakCount={streakCount}
          preferences={layoutPreferences}
          goal={goal}
          activityLogs={activityLogs}
          videos={videos}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Left Desktop Sidebar */}
        {!isWatchingAndZen && (
          <Sidebar
            currentTab={currentTab}
            onNavigate={handleNavigate}
            videoCount={videos.length}
            completedCount={completedCount}
            playlistCount={playlists.length}
            preferences={layoutPreferences}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />
        )}

        {/* Mobile Nav Drawer */}
        {!isWatchingAndZen && (
          <MobileNavigation
            currentTab={currentTab}
            onNavigate={handleNavigate}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            preferences={layoutPreferences}
          />
        )}

        {/* Main View Container */}
        <main className={`flex-1 ${isWatchingAndZen ? 'p-2 sm:p-4' : 'p-4 sm:p-6 lg:p-8'} min-w-0 pb-24 lg:pb-8`}>
          {currentTab === 'dashboard' && (
            <DashboardPage
              videos={videos}
              playlists={playlists}
              progressMap={progressMap}
              watchLaterIds={watchLaterIds}
              onToggleWatchLater={handleToggleWatchLater}
              onPlayAllWatchLater={handlePlayAllWatchLater}
              onSelectVideo={handleSelectVideo}
              onNavigate={handleNavigate}
              onArchiveToggle={handleArchiveToggle}
              onDeleteRequest={(v) => setDeletingVideo(v)}
              onEditVideoRequest={(v) => setEditingVideo(v)}
              layoutPreferences={layoutPreferences}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
            />
          )}

          {currentTab === 'recommendations' && (
            <RecommendationsPage
              existingVideos={videos}
              onVideoAdded={(v) => handleSelectVideo(v)}
              onSelectVideo={handleSelectVideo}
            />
          )}

          {currentTab === 'library' && (
            <VideoLibraryPage
              videos={videos}
              playlists={playlists}
              progressMap={progressMap}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategoryFilter={selectedCategoryFilter}
              watchLaterIds={watchLaterIds}
              onToggleWatchLater={handleToggleWatchLater}
              onSelectVideo={handleSelectVideo}
              onArchiveToggle={handleArchiveToggle}
              onDeleteRequest={(v) => setDeletingVideo(v)}
              onEditVideoRequest={(v) => setEditingVideo(v)}
            />
          )}

          {currentTab.startsWith('watch-') && selectedVideo && (
            <WatchVideoPage
              video={selectedVideo}
              progress={progressMap[selectedVideo.id]}
              notes={notes}
              bookmarks={bookmarks}
              allVideos={videos}
              progressMap={progressMap}
              playlists={playlists}
              watchLaterIds={watchLaterIds}
              onToggleWatchLater={handleToggleWatchLater}
              onBack={() => handleNavigate('library')}
              onSelectVideo={handleSelectVideo}
              onNotesChanged={() => {}}
              onBookmarksChanged={() => {}}
              onProgressChanged={() => {}}
              isZenMode={isZenMode}
              onToggleZenMode={() => setIsZenMode((prev) => !prev)}
            />
          )}

          {currentTab === 'playlists' && (
            <PlaylistsPage
              playlists={playlists}
              videos={videos}
              progressMap={progressMap}
              onSelectVideo={handleSelectVideo}
              onOpenAddModal={openAddVideoModal}
            />
          )}

          {currentTab === 'categories' && (

            <CategoriesPage
              videos={videos}
              progressMap={progressMap}
              onSelectCategoryFilter={handleSelectCategoryFilter}
            />
          )}

          {currentTab === 'notes' && (
            <NotesPage
              notes={notes}
              bookmarks={bookmarks}
              videos={videos}
              onSelectVideoAtTime={handleSelectVideo}
              onRefreshAllData={() => {}}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage
              videos={videos}
              progressMap={progressMap}
              activityLogs={activityLogs}
              streakCount={streakCount}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              goal={goal}
              onGoalUpdated={(newG) => setGoal(newG)}
              onRefreshAllData={() => {}}
              onImportPlaylistFromTester={async (meta: any) => {
                try {
                  const plObj: Playlist = {
                    id: `pl-${Date.now()}`,
                    playlistId: meta.playlistId,
                    title: meta.title,
                    channelName: meta.channelName,
                    thumbnail: meta.thumbnailUrl,
                    category: 'MERN Stack',
                    difficulty: 'Beginner',
                    totalVideos: meta.videos.length,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    videos: meta.videos.map((v: any, index: number) => ({
                      id: `vid-${Date.now()}-${index}`,
                      youtubeId: v.youtubeId,
                      title: v.title,
                      channelName: v.channelName || meta.channelName,
                      thumbnailUrl: v.thumbnailUrl,
                      duration: v.duration || 0,
                      category: 'MERN Stack',
                      difficulty: 'Beginner',
                      tags: ['PlaylistImport'],
                      status: 'not-started',
                      playlistId: meta.playlistId,
                    })),
                  };
                  await savePlaylistToFirestore(plObj);
                  setCurrentTab('playlists');
                } catch (e) {
                  console.error('Failed to import playlist:', e);
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Global Add/Paste Video Modal */}
      <AddVideoModal
        existingVideos={videos}
        onVideoAdded={(v) => handleSelectVideo(v)}
        onSelectVideo={(v) => handleSelectVideo(v)}
      />

      {/* Edit Video Modal */}
      <EditVideoModal
        video={editingVideo}
        isOpen={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
        onVideoUpdated={(updatedVid) => {
          setVideos((prev) => prev.map((v) => (v.id === updatedVid.id ? updatedVid : v)));
        }}
        onVideoDeleted={(vId) => {
          setVideos((prev) => prev.filter((v) => v.id !== vId));
        }}
      />

      {/* Delete Video Confirmation Modal */}
      <ConfirmDialog
        isOpen={deletingVideo !== null}
        title="Delete Video?"
        message={`Are you sure you want to delete "${deletingVideo?.title}" from CodeTube? This will also remove its associated progress.`}
        confirmText="Delete Video"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingVideo(null)}
      />

      {/* Modular Layout & Customizer Modal */}
      <CustomizeLayoutModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        preferences={layoutPreferences}
        onSavePreferences={handleSavePreferences}
      />

      {/* Daily Learning Goal Celebration Toast */}
      <GoalToast goal={goal} activityLogs={activityLogs} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GlobalPasteProvider>
        <LearnVerseApp />
      </GlobalPasteProvider>
    </ThemeProvider>
  );
}
