/**
 * Firebase Firestore Service and Data Operations
 * Configured with public access rules for LearnVerse MVP.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  VideoItem,
  VideoProgress,
  VideoNote,
  VideoBookmark,
  LearningGoal,
  ActivityLog,
  Playlist,
} from '../types';


// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initial curated sample videos to seed empty database
export const INITIAL_SAMPLE_VIDEOS: Omit<VideoItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'vid-1',
    youtubeId: 'SqcY0GlETPk',
    youtubeUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    title: 'React Tutorial for Beginners',
    thumbnail: 'https://img.youtube.com/vi/SqcY0GlETPk/hqdefault.jpg',
    channelName: 'Programming with Mosh',
    duration: 5280, // ~1h 28m
    category: 'React',
    difficulty: 'Beginner',
    tags: ['React', 'JavaScript', 'Frontend', 'Hooks'],
    status: 'in-progress',
  },
  {
    id: 'vid-2',
    youtubeId: 'PkZNo7MFNFg',
    youtubeUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    title: 'Learn JavaScript - Full Course for Beginners',
    thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg',
    channelName: 'freeCodeCamp.org',
    duration: 11820, // ~3h 17m
    category: 'JavaScript',
    difficulty: 'Beginner',
    tags: ['JavaScript', 'Basics', 'ES6', 'DOM'],
    status: 'completed',
  },
  {
    id: 'vid-3',
    youtubeId: '7fjOw8ApZ1I',
    youtubeUrl: 'https://www.youtube.com/watch?v=7fjOw8ApZ1I',
    title: 'System Design Interview – Step By Step Guide',
    thumbnail: 'https://img.youtube.com/vi/7fjOw8ApZ1I/hqdefault.jpg',
    channelName: 'ByteByteGo',
    duration: 3600, // 1 hour
    category: 'System Design',
    difficulty: 'Advanced',
    tags: ['System Design', 'Architecture', 'Scalability', 'Interview'],
    status: 'not-started',
  },
  {
    id: 'vid-4',
    youtubeId: '8aGhZQkoFbQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
    title: 'Data Structures and Algorithms for Beginners',
    thumbnail: 'https://img.youtube.com/vi/8aGhZQkoFbQ/hqdefault.jpg',
    channelName: 'Fireship',
    duration: 1800, // 30m
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    tags: ['DSA', 'Algorithms', 'Big O', 'Computer Science'],
    status: 'in-progress',
  },
  {
    id: 'vid-5',
    youtubeId: '30LWjhZ8V50',
    youtubeUrl: 'https://www.youtube.com/watch?v=30LWjhZ8V50',
    title: 'Git and GitHub Tutorial for Beginners',
    thumbnail: 'https://img.youtube.com/vi/30LWjhZ8V50/hqdefault.jpg',
    channelName: 'Amigoscode',
    duration: 2400, // 40m
    category: 'Git and GitHub',
    difficulty: 'Beginner',
    tags: ['Git', 'GitHub', 'Version Control', 'DevOps'],
    status: 'completed',
  },
  {
    id: 'vid-6',
    youtubeId: 'qw--VYLpxG4',
    youtubeUrl: 'https://www.youtube.com/watch?v=qw--VYLpxG4',
    title: 'MERN Stack Course - MongoDB, Express, React, Node.js',
    thumbnail: 'https://img.youtube.com/vi/qw--VYLpxG4/hqdefault.jpg',
    channelName: 'freeCodeCamp.org',
    duration: 14400, // 4 hours
    category: 'MERN Stack',
    difficulty: 'Intermediate',
    tags: ['MERN', 'Full Stack', 'Node', 'Express', 'React', 'MongoDB'],
    status: 'not-started',
  },
];

export const INITIAL_SAMPLE_PROGRESS: Record<string, VideoProgress> = {
  'vid-1': {
    id: 'vid-1',
    videoId: 'vid-1',
    watchedSeconds: 2112, // 40%
    totalDuration: 5280,
    percentageCompleted: 40,
    completionStatus: 'in-progress',
    lastWatchedAt: Date.now() - 3600000 * 2, // 2 hours ago
    completedAt: null,
  },
  'vid-2': {
    id: 'vid-2',
    videoId: 'vid-2',
    watchedSeconds: 11820, // 100%
    totalDuration: 11820,
    percentageCompleted: 100,
    completionStatus: 'completed',
    lastWatchedAt: Date.now() - 86400000, // 1 day ago
    completedAt: Date.now() - 86400000,
  },
  'vid-4': {
    id: 'vid-4',
    videoId: 'vid-4',
    watchedSeconds: 1440, // 80%
    totalDuration: 1800,
    percentageCompleted: 80,
    completionStatus: 'in-progress',
    lastWatchedAt: Date.now() - 1800000, // 30 mins ago
    completedAt: null,
  },
  'vid-5': {
    id: 'vid-5',
    videoId: 'vid-5',
    watchedSeconds: 2400, // 100%
    totalDuration: 2400,
    percentageCompleted: 100,
    completionStatus: 'completed',
    lastWatchedAt: Date.now() - 172800000, // 2 days ago
    completedAt: Date.now() - 172800000,
  },
};

export const INITIAL_SAMPLE_NOTES: VideoNote[] = [
  {
    id: 'note-1',
    videoId: 'vid-1',
    content: 'JSX rules: Always wrap elements in a single parent fragment or div, and use className instead of class.',
    timestamp: 420,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'note-2',
    videoId: 'vid-1',
    content: 'useState hook allows stateful functional components. Remember that set state is asynchronous.',
    timestamp: 1250,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'note-3',
    videoId: 'vid-4',
    content: 'Binary Search runs in O(log n) time complexity because the search space halves on every step.',
    timestamp: 900,
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];

export const INITIAL_SAMPLE_BOOKMARKS: VideoBookmark[] = [
  {
    id: 'bm-1',
    videoId: 'vid-1',
    timestamp: 600,
    label: 'Component Props Explanation',
    note: 'Great explanation of passing props and destructuring',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'bm-2',
    videoId: 'vid-4',
    timestamp: 1200,
    label: 'Big O Time Complexity Chart',
    note: 'Visual comparison of O(1), O(log n), O(n), O(n^2)',
    createdAt: Date.now() - 1800000,
  },
];

export const INITIAL_LEARNING_GOAL: LearningGoal = {
  id: 'default-goal',
  title: 'Daily Frontend & CS Mastery',
  dailyTarget: 30, // 30 minutes daily
  weeklyTarget: 210, // 3.5 hours weekly
  createdAt: Date.now(),
};

/**
 * Seed initial sample content into Firestore if database is empty
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const videosSnap = await getDocs(collection(db, 'videos'));
    if (videosSnap.empty) {
      console.log('Seeding initial LearnVerse videos to Cloud Firestore...');
      const now = Date.now();

      // Seed videos
      for (const vid of INITIAL_SAMPLE_VIDEOS) {
        await setDoc(doc(db, 'videos', vid.id), {
          ...vid,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Seed progress
      for (const [vidId, prog] of Object.entries(INITIAL_SAMPLE_PROGRESS)) {
        await setDoc(doc(db, 'progress', vidId), prog);
      }

      // Seed notes
      for (const note of INITIAL_SAMPLE_NOTES) {
        await setDoc(doc(db, 'notes', note.id), note);
      }

      // Seed bookmarks
      for (const bm of INITIAL_SAMPLE_BOOKMARKS) {
        await setDoc(doc(db, 'bookmarks', bm.id), bm);
      }

      // Seed goal
      await setDoc(doc(db, 'learningGoals', INITIAL_LEARNING_GOAL.id), INITIAL_LEARNING_GOAL);

      // Seed playlists
      for (const pl of INITIAL_SAMPLE_PLAYLISTS) {
        await setDoc(doc(db, 'playlists', pl.id), pl);
        // Also ensure playlist videos are in videos collection so they are watchable anywhere!
        for (const pVid of pl.videos) {
          await setDoc(doc(db, 'videos', pVid.id), pVid);
        }
      }

      // Seed activity logs for streak testing

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      await setDoc(doc(db, 'activityLogs', `log-${today}`), {
        id: `log-${today}`,
        videoId: 'vid-4',
        secondsWatched: 1200,
        date: today,
        timestamp: Date.now(),
      });
      await setDoc(doc(db, 'activityLogs', `log-${yesterday}`), {
        id: `log-${yesterday}`,
        videoId: 'vid-2',
        secondsWatched: 2400,
        date: yesterday,
        timestamp: Date.now() - 86400000,
      });

      console.log('Successfully seeded LearnVerse database!');
    }
  } catch (err) {
    console.error('Error seeding Cloud Firestore:', err);
  }
}

// ----------------------------------------------------------------------
// Firestore API Wrappers (Realtime & Async)
// ----------------------------------------------------------------------

// Videos
export async function saveVideoToFirestore(video: Omit<VideoItem, 'createdAt' | 'updatedAt'>): Promise<VideoItem> {
  const now = Date.now();
  const videoItem: VideoItem = {
    ...video,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'videos', video.id), videoItem);
  return videoItem;
}

export async function updateVideoInFirestore(id: string, updates: Partial<VideoItem>): Promise<void> {
  const videoRef = doc(db, 'videos', id);
  await updateDoc(videoRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteVideoFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'videos', id));
  await deleteDoc(doc(db, 'progress', id));
  // Note: Associated notes & bookmarks can also be cleaned up or left for history
}

// Progress
export async function saveProgressToFirestore(
  progress: VideoProgress,
  activeStudyDeltaSeconds: number = 0
): Promise<void> {
  await setDoc(doc(db, 'progress', progress.videoId), progress, { merge: true });

  // Record daily activity log for analytics & streak
  const dateStr = new Date().toISOString().split('T')[0];
  const logId = `log-${dateStr}-${progress.videoId}`;
  const logRef = doc(db, 'activityLogs', logId);

  try {
    const logSnap = await getDoc(logRef);
    const existingSecs = logSnap.exists() ? (logSnap.data().secondsWatched || 0) : 0;
    
    // Add only actual active study time delta (seconds of real playing time)
    const newStudySecs = existingSecs + activeStudyDeltaSeconds;

    await setDoc(logRef, {
      id: logId,
      videoId: progress.videoId,
      secondsWatched: Math.round(newStudySecs),
      pausesCount: progress.pausesCount || 0,
      date: dateStr,
      timestamp: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save activity log:', err);
  }
}

// Notes
export async function saveNoteToFirestore(note: Omit<VideoNote, 'createdAt' | 'updatedAt'>): Promise<VideoNote> {
  const now = Date.now();
  const fullNote: VideoNote = {
    ...note,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'notes', fullNote.id), fullNote);
  return fullNote;
}

export async function deleteNoteFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', id));
}

// Bookmarks
export async function saveBookmarkToFirestore(bookmark: Omit<VideoBookmark, 'createdAt'>): Promise<VideoBookmark> {
  const now = Date.now();
  const fullBm: VideoBookmark = {
    ...bookmark,
    createdAt: now,
  };
  await setDoc(doc(db, 'bookmarks', fullBm.id), fullBm);
  return fullBm;
}

export async function deleteBookmarkFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'bookmarks', id));
}

export const INITIAL_SAMPLE_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-js-mastery',
    playlistId: 'PL4cUxeGkcC9gksOXbA4dpFicMeP8ZO100',
    title: 'JavaScript Mastery & ES6+ Full Course',
    description: 'Complete Modern JavaScript playlist from fundamentals to advanced closures, async await, and DOM concepts.',
    thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg',
    channelName: 'JavaScript Mastery',
    category: 'JavaScript',
    difficulty: 'Intermediate',
    totalVideos: 4,
    lastWatchedVideoId: 'vid-js-1',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    videos: [
      {
        id: 'vid-js-1',
        youtubeId: 'PkZNo7MFNFg',
        youtubeUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        title: '1. JS Fundamentals & Variables',
        thumbnail: 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg',
        channelName: 'JavaScript Mastery',
        duration: 3600,
        category: 'JavaScript',
        difficulty: 'Beginner',
        tags: ['JavaScript', 'Variables', 'Basics'],
        status: 'completed',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 4,
      },
      {
        id: 'vid-js-2',
        youtubeId: 'hdI2bqOjy3c',
        youtubeUrl: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
        title: '2. Async JavaScript, Promises & Fetch API',
        thumbnail: 'https://img.youtube.com/vi/hdI2bqOjy3c/hqdefault.jpg',
        channelName: 'JavaScript Mastery',
        duration: 2700,
        category: 'JavaScript',
        difficulty: 'Intermediate',
        tags: ['Async', 'Promises', 'Fetch'],
        status: 'in-progress',
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000 * 1,
      },
      {
        id: 'vid-js-3',
        youtubeId: '30LWjhZ8V50',
        youtubeUrl: 'https://www.youtube.com/watch?v=30LWjhZ8V50',
        title: '3. DOM Manipulation & Event Handling',
        thumbnail: 'https://img.youtube.com/vi/30LWjhZ8V50/hqdefault.jpg',
        channelName: 'JavaScript Mastery',
        duration: 2400,
        category: 'JavaScript',
        difficulty: 'Beginner',
        tags: ['DOM', 'Events'],
        status: 'not-started',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'vid-js-4',
        youtubeId: 'qw--VYLpxG4',
        youtubeUrl: 'https://www.youtube.com/watch?v=qw--VYLpxG4',
        title: '4. Closures, Scope & Prototypes in Depth',
        thumbnail: 'https://img.youtube.com/vi/qw--VYLpxG4/hqdefault.jpg',
        channelName: 'JavaScript Mastery',
        duration: 3200,
        category: 'JavaScript',
        difficulty: 'Advanced',
        tags: ['Closures', 'Prototypes', 'OOP'],
        status: 'not-started',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
      },
    ],
  },
  {
    id: 'pl-dsa-bootcamp',
    playlistId: 'PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P',
    title: 'Data Structures & Algorithms for CS Students',
    description: 'Master Big O, Arrays, Trees, Graphs, and Dynamic Programming for technical interview preparation.',
    thumbnail: 'https://img.youtube.com/vi/8aGhZQkoFbQ/hqdefault.jpg',
    channelName: 'CS Classroom',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    totalVideos: 3,
    lastWatchedVideoId: 'vid-dsa-1',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
    videos: [
      {
        id: 'vid-dsa-1',
        youtubeId: '8aGhZQkoFbQ',
        youtubeUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
        title: '1. Big O Notation & Time Complexity',
        thumbnail: 'https://img.youtube.com/vi/8aGhZQkoFbQ/hqdefault.jpg',
        channelName: 'CS Classroom',
        duration: 1800,
        category: 'Data Structures and Algorithms',
        difficulty: 'Beginner',
        tags: ['Big O', 'DSA', 'Algorithms'],
        status: 'completed',
        createdAt: Date.now() - 86400000 * 10,
        updatedAt: Date.now() - 86400000 * 8,
      },
      {
        id: 'vid-dsa-2',
        youtubeId: '7fjOw8ApZ1I',
        youtubeUrl: 'https://www.youtube.com/watch?v=7fjOw8ApZ1I',
        title: '2. Trees, Binary Search & Graph Algorithms',
        thumbnail: 'https://img.youtube.com/vi/7fjOw8ApZ1I/hqdefault.jpg',
        channelName: 'CS Classroom',
        duration: 3600,
        category: 'Data Structures and Algorithms',
        difficulty: 'Intermediate',
        tags: ['Trees', 'Graphs', 'BFS', 'DFS'],
        status: 'in-progress',
        createdAt: Date.now() - 86400000 * 8,
        updatedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'vid-dsa-3',
        youtubeId: 'SqcY0GlETPk',
        youtubeUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        title: '3. Dynamic Programming & Memoization',
        thumbnail: 'https://img.youtube.com/vi/SqcY0GlETPk/hqdefault.jpg',
        channelName: 'CS Classroom',
        duration: 4200,
        category: 'Data Structures and Algorithms',
        difficulty: 'Advanced',
        tags: ['DP', 'Recursion', 'Optimization'],
        status: 'not-started',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 5,
      },
    ],
  },
];

// Playlists Firestore API
export async function savePlaylistToFirestore(playlist: Playlist): Promise<Playlist> {
  await setDoc(doc(db, 'playlists', playlist.id), playlist);
  return playlist;
}

export async function updatePlaylistInFirestore(id: string, updates: Partial<Playlist>): Promise<void> {
  const playlistRef = doc(db, 'playlists', id);
  await updateDoc(playlistRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deletePlaylistFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'playlists', id));
}

// Learning Goals

export async function saveGoalToFirestore(goal: LearningGoal): Promise<void> {
  await setDoc(doc(db, 'learningGoals', goal.id), goal);
}
