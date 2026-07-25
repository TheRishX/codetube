/**
 * LearnVerse Types and Data Interfaces
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type VideoStatus = 'not-started' | 'in-progress' | 'completed' | 'archived';

export interface VideoItem {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: number; // in seconds
  category: string;
  difficulty: Difficulty;
  tags: string[];
  status: VideoStatus;
  createdAt: number; // Epoch timestamp
  updatedAt: number; // Epoch timestamp
}

export interface VideoProgress {
  id: string;
  videoId: string;
  watchedSeconds: number;
  totalDuration: number;
  percentageCompleted: number;
  completionStatus: 'not-started' | 'in-progress' | 'completed';
  lastWatchedAt: number;
  completedAt: number | null;
  pausesCount?: number;
}

export interface VideoNote {
  id: string;
  videoId: string;
  content: string;
  timestamp: number; // in seconds
  createdAt: number;
  updatedAt: number;
}

export interface VideoBookmark {
  id: string;
  videoId: string;
  timestamp: number; // in seconds
  label: string;
  note: string;
  createdAt: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  dailyTarget: number; // in minutes
  weeklyTarget: number; // in minutes
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  videoId: string;
  secondsWatched: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  pausesCount?: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

export interface Playlist {
  id: string;
  playlistId: string; // YouTube list ID
  title: string;
  description?: string;
  thumbnail: string;
  channelName: string;
  category: string;
  difficulty: Difficulty;
  totalVideos: number;
  videos: VideoItem[];
  lastPlayedVideoId?: string;
  lastWatchedVideoId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CodeSnippet {
  id: string;
  videoId: string;
  title: string;
  code: string;
  language: string;
  timestamp: number;
  createdAt: number;
}

export type ViewMode = 'grid' | 'list';


export type SortOption = 'newest' | 'oldest' | 'title' | 'progress' | 'duration';

export interface FilterOptions {
  searchQuery: string;
  category: string;
  status: string;
  difficulty: string;
  sortBy: SortOption;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'mern-stack', name: 'MERN Stack', description: 'MongoDB, Express, React, and Node.js full-stack development', iconName: 'Layers', color: 'from-emerald-500 to-teal-600' },
  { id: 'javascript', name: 'JavaScript', description: 'Core JS, ES6+, async programming, and DOM manipulation', iconName: 'Code2', color: 'from-amber-500 to-yellow-600' },
  { id: 'react', name: 'React', description: 'React 19, hooks, state management, and modern patterns', iconName: 'Atom', color: 'from-sky-500 to-blue-600' },
  { id: 'backend', name: 'Backend', description: 'Server architectures, REST APIs, GraphQL, and microservices', iconName: 'Server', color: 'from-indigo-500 to-violet-600' },
  { id: 'databases', name: 'Databases', description: 'SQL, NoSQL, Firestore, PostgreSQL, and schema design', iconName: 'Database', color: 'from-purple-500 to-pink-600' },
  { id: 'devops', name: 'Deployment and DevOps', description: 'CI/CD, Cloud Run, Docker, Kubernetes, and hosting', iconName: 'Cloud', color: 'from-cyan-500 to-blue-500' },
  { id: 'networks', name: 'Computer Networks', description: 'HTTP/HTTPS, TCP/IP, DNS, WebSockets, and security', iconName: 'Network', color: 'from-rose-500 to-red-600' },
  { id: 'os', name: 'Operating Systems', description: 'Processes, threads, memory management, and Linux', iconName: 'Cpu', color: 'from-orange-500 to-amber-600' },
  { id: 'system-design', name: 'System Design', description: 'Scalability, load balancers, caching, and distributed systems', iconName: 'Workflow', color: 'from-blue-600 to-indigo-700' },
  { id: 'dsa', name: 'Data Structures and Algorithms', description: 'Arrays, trees, graphs, dynamic programming, and sorting', iconName: 'Binary', color: 'from-green-500 to-emerald-700' },
  { id: 'languages', name: 'Programming Languages', description: 'TypeScript, Python, Go, Rust, C++, and Java', iconName: 'FileCode', color: 'from-teal-500 to-cyan-600' },
  { id: 'cybersecurity', name: 'Cybersecurity', description: 'Web security, OWASP, cryptography, and auth concepts', iconName: 'ShieldCheck', color: 'from-red-500 to-rose-700' },
  { id: 'git', name: 'Git and GitHub', description: 'Version control, branching strategies, and open source', iconName: 'GitBranch', color: 'from-gray-700 to-gray-900' },
  { id: 'projects', name: 'Projects', description: 'Hands-on full-stack projects, portfolio builds, and tutorials', iconName: 'FolderGit2', color: 'from-violet-500 to-purple-700' },
  { id: 'careers', name: 'Career and Interviews', description: 'Coding interviews, system design prep, and career advice', iconName: 'Briefcase', color: 'from-amber-600 to-orange-600' },
];
