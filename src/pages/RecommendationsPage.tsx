import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Check,
  Plus,
  Play,
  ThumbsUp,
  Eye,
  Filter,
  ShieldCheck,
  Globe,
  Flame,
  Clock,
  Layers,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { CATEGORIES, VideoItem, Difficulty } from '../types';
import { detectCategoryFromTitleAndChannel, formatDuration, getYouTubeThumbnail } from '../lib/youtube';
import { saveVideoToFirestore } from '../lib/firebase';

export interface RecommendedVideo {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  channelName: string;
  category: string;
  difficulty: Difficulty;
  duration: number; // seconds
  views: number;
  likes: number;
  language: 'Hindi' | 'English';
  publishedYear: number;
  rating: number; // e.g. 4.9
  tags: string[];
}

// Curated high-quality, non-clickbait CS & IT YouTube video database
export const RECOMMENDED_CS_VIDEOS: RecommendedVideo[] = [
  {
    id: 'rec-1',
    youtubeId: 'vLnPwxZdW4w',
    youtubeUrl: 'https://www.youtube.com/watch?v=vLnPwxZdW4w',
    title: 'Chai aur React | React JS Full Course in Hindi',
    channelName: 'Chai aur Code (Hitesh Choudhary)',
    category: 'React',
    difficulty: 'Beginner',
    duration: 18000, // ~5h
    views: 2400000,
    likes: 180000,
    language: 'Hindi',
    publishedYear: 2024,
    rating: 4.95,
    tags: ['React', 'React 19', 'JSX', 'Hooks', 'Hindi'],
  },
  {
    id: 'rec-2',
    youtubeId: '7gX9s_iM0pE',
    youtubeUrl: 'https://www.youtube.com/watch?v=7gX9s_iM0pE',
    title: 'Complete Web Development Course | MERN Stack in Hindi',
    channelName: 'Apna College (Aradhya & Aman)',
    category: 'MERN Stack',
    difficulty: 'Intermediate',
    duration: 36000, // ~10h
    views: 4800000,
    likes: 320000,
    language: 'Hindi',
    publishedYear: 2024,
    rating: 4.9,
    tags: ['MERN', 'Full Stack', 'MongoDB', 'Express', 'React', 'Node'],
  },
  {
    id: 'rec-3',
    youtubeId: 'ER9S84537p0',
    youtubeUrl: 'https://www.youtube.com/watch?v=ER9S84537p0',
    title: 'Complete JavaScript Course in Hindi | Beginning to Advanced',
    channelName: 'CodeWithHarry',
    category: 'JavaScript',
    difficulty: 'Beginner',
    duration: 25200, // ~7h
    views: 6500000,
    likes: 450000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.88,
    tags: ['JavaScript', 'ES6', 'DOM', 'Hindi', 'Basics'],
  },
  {
    id: 'rec-4',
    youtubeId: '0sOvCwf96xM',
    youtubeUrl: 'https://www.youtube.com/watch?v=0sOvCwf96xM',
    title: 'Data Structures and Algorithms A-Z Course (Striver A2Z DSA)',
    channelName: 'take U forward (Striver)',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    duration: 28800, // ~8h
    views: 3100000,
    likes: 290000,
    language: 'Hindi',
    publishedYear: 2024,
    rating: 4.97,
    tags: ['DSA', 'LeetCode', 'Arrays', 'Trees', 'C++', 'Java'],
  },
  {
    id: 'rec-5',
    youtubeId: 'zQnBQ4tB3ZA',
    youtubeUrl: 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA',
    title: 'Computer Networks Full Course in 1 Video (Gate Smashers)',
    channelName: 'Gate Smashers (Varun Singla)',
    category: 'Computer Networks',
    difficulty: 'Beginner',
    duration: 14400, // ~4h
    views: 3900000,
    likes: 210000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.92,
    tags: ['Networks', 'OSI Model', 'TCP/IP', 'HTTP', 'DNS'],
  },
  {
    id: 'rec-6',
    youtubeId: 'bkSWJJZNgf8',
    youtubeUrl: 'https://www.youtube.com/watch?v=bkSWJJZNgf8',
    title: 'Operating System Full Course for CS/IT Exams and Interviews',
    channelName: 'Gate Smashers',
    category: 'Operating Systems',
    difficulty: 'Intermediate',
    duration: 18000, // ~5h
    views: 4200000,
    likes: 260000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.91,
    tags: ['OS', 'Processes', 'Paging', 'Deadlocks', 'Memory'],
  },
  {
    id: 'rec-7',
    youtubeId: 'bU1QPtOZQZU',
    youtubeUrl: 'https://www.youtube.com/watch?v=bU1QPtOZQZU',
    title: 'System Design Course for Beginners to Scalable Architecture',
    channelName: 'Gaurav Sen',
    category: 'System Design',
    difficulty: 'Advanced',
    duration: 10800, // ~3h
    views: 1800000,
    likes: 140000,
    language: 'English',
    publishedYear: 2023,
    rating: 4.89,
    tags: ['System Design', 'Caching', 'Load Balancers', 'Microservices'],
  },
  {
    id: 'rec-8',
    youtubeId: '3qBXWUpoPHo',
    youtubeUrl: 'https://www.youtube.com/watch?v=3qBXWUpoPHo',
    title: 'Docker & Kubernetes Full Course - DevOps for Beginners',
    channelName: 'TechWorld with Nana',
    category: 'Deployment and DevOps',
    difficulty: 'Intermediate',
    duration: 12600, // ~3.5h
    views: 2900000,
    likes: 200000,
    language: 'English',
    publishedYear: 2024,
    rating: 4.94,
    tags: ['Docker', 'Kubernetes', 'DevOps', 'Containers', 'CI/CD'],
  },
  {
    id: 'rec-9',
    youtubeId: 'f2EqECiTBL8',
    youtubeUrl: 'https://www.youtube.com/watch?v=f2EqECiTBL8',
    title: 'SQL & Database Design Course for Beginners',
    channelName: 'freeCodeCamp.org',
    category: 'Databases',
    difficulty: 'Beginner',
    duration: 15400, // ~4.2h
    views: 3400000,
    likes: 230000,
    language: 'English',
    publishedYear: 2023,
    rating: 4.87,
    tags: ['SQL', 'PostgreSQL', 'MySQL', 'Database Design', 'Joins'],
  },
  {
    id: 'rec-10',
    youtubeId: 'rfscVS0vtbw',
    youtubeUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    title: 'Learn Python - Full Course for Beginners [Tutorial]',
    channelName: 'freeCodeCamp.org',
    category: 'Programming Languages',
    difficulty: 'Beginner',
    duration: 16800, // ~4.6h
    views: 41000000,
    likes: 1200000,
    language: 'English',
    publishedYear: 2022,
    rating: 4.96,
    tags: ['Python', 'Basics', 'AI', 'Data Science', 'Automation'],
  },
  {
    id: 'rec-11',
    youtubeId: 'grEKMHGYyns',
    youtubeUrl: 'https://www.youtube.com/watch?v=grEKMHGYyns',
    title: 'Next.js 15 Full Course | React Framework for Production',
    channelName: 'CodeWithHarry',
    category: 'React',
    difficulty: 'Intermediate',
    duration: 21600, // ~6h
    views: 1900000,
    likes: 150000,
    language: 'Hindi',
    publishedYear: 2025,
    rating: 4.93,
    tags: ['Next.js', 'React 19', 'Server Components', 'App Router'],
  },
  {
    id: 'rec-12',
    youtubeId: '8jLOx1hD3_o',
    youtubeUrl: 'https://www.youtube.com/watch?v=8jLOx1hD3_o',
    title: 'C++ Full Course in Hindi | Placement Series for Beginners',
    channelName: 'Apna College',
    category: 'Programming Languages',
    difficulty: 'Beginner',
    duration: 28800, // ~8h
    views: 8900000,
    likes: 600000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.94,
    tags: ['C++', 'OOPs', 'Pointers', 'STL', 'Placement'],
  },
  {
    id: 'rec-13',
    youtubeId: 'A71822f6d0A',
    youtubeUrl: 'https://www.youtube.com/watch?v=A71822f6d0A',
    title: 'Java Full Course for Beginners | Core & Advanced Java',
    channelName: 'Kunal Kushwaha',
    category: 'Programming Languages',
    difficulty: 'Beginner',
    duration: 32400, // ~9h
    views: 5200000,
    likes: 380000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.96,
    tags: ['Java', 'OOPs', 'Collections', 'DSA', 'Kunal Kushwaha'],
  },
  {
    id: 'rec-14',
    youtubeId: '2ZLl8GAk1X4',
    youtubeUrl: 'https://www.youtube.com/watch?v=2ZLl8GAk1X4',
    title: 'Cybersecurity & Web Ethical Hacking Full Course',
    channelName: 'NetworkChuck',
    category: 'Cybersecurity',
    difficulty: 'Beginner',
    duration: 11500, // ~3.2h
    views: 2800000,
    likes: 210000,
    language: 'English',
    publishedYear: 2024,
    rating: 4.89,
    tags: ['Cybersecurity', 'Hacking', 'Linux', 'Security', 'Web'],
  },
  {
    id: 'rec-15',
    youtubeId: 'RGOj5yH7evk',
    youtubeUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    title: 'Git & GitHub Tutorial for Beginners in Hindi',
    channelName: 'Thapa Technical',
    category: 'Git and GitHub',
    difficulty: 'Beginner',
    duration: 7200, // ~2h
    views: 1800000,
    likes: 120000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.88,
    tags: ['Git', 'GitHub', 'Hindi', 'Version Control'],
  },
];

interface RecommendationsPageProps {
  existingVideos: VideoItem[];
  onVideoAdded: (video: VideoItem) => void;
  onSelectVideo: (video: VideoItem) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  existingVideos,
  onVideoAdded,
  onSelectVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Hindi' | 'English'>('Hindi'); // Default to Hindi first
  const [sortBy, setSortBy] = useState<'popular' | 'liked' | 'latest' | 'top-rated'>('popular');
  const [importingId, setImportingId] = useState<string | null>(null);

  // Map existing youtube IDs to quick lookup
  const existingYoutubeIds = useMemo(() => {
    return new Set(existingVideos.map((v) => v.youtubeId));
  }, [existingVideos]);

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let result = [...RECOMMENDED_CS_VIDEOS];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (rec) =>
          rec.title.toLowerCase().includes(q) ||
          rec.channelName.toLowerCase().includes(q) ||
          rec.category.toLowerCase().includes(q) ||
          rec.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Topic Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((rec) => rec.category === selectedCategory);
    }

    // Language Filter (Hindi First logic)
    if (languageFilter === 'Hindi') {
      // Put Hindi videos first or filter to Hindi if strict
      result.sort((a, b) => {
        if (a.language === 'Hindi' && b.language !== 'Hindi') return -1;
        if (a.language !== 'Hindi' && b.language === 'Hindi') return 1;
        return 0;
      });
    } else if (languageFilter === 'English') {
      result = result.filter((rec) => rec.language === 'English');
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'liked') return b.likes - a.likes;
      if (sortBy === 'latest') return b.publishedYear - a.publishedYear;
      if (sortBy === 'top-rated') return b.rating - a.rating;
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, languageFilter, sortBy]);

  const handleImportOneClick = async (rec: RecommendedVideo) => {
    setImportingId(rec.id);
    try {
      const newVidId = `vid-${rec.youtubeId}-${Date.now().toString().slice(-4)}`;
      const newVideo = await saveVideoToFirestore({
        id: newVidId,
        youtubeId: rec.youtubeId,
        youtubeUrl: rec.youtubeUrl,
        title: rec.title,
        thumbnail: getYouTubeThumbnail(rec.youtubeId),
        channelName: rec.channelName,
        duration: rec.duration,
        category: rec.category,
        difficulty: rec.difficulty,
        tags: [...rec.tags, rec.language],
        status: 'not-started',
      });

      onVideoAdded(newVideo);
    } catch (err) {
      console.error('Failed to import video:', err);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-red-100">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Pure CS & IT Tutorials Only
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Curated YouTube Recommendations for Developers
          </h1>
          <p className="text-sm text-red-100 leading-relaxed max-w-2xl">
            Zero news, zero layoff drama, zero clickbait. Only verified computer science, coding, and system design tutorials. Click <span className="font-bold underline">1-Click Add</span> to import any video straight to your CodeTube library!
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="space-y-4 bg-white dark:bg-gray-800/90 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials, topics (React, DSA, MERN, Java in Hindi)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-hidden transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language Filter */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <Globe className="w-3.5 h-3.5 ml-2 text-gray-500" />
              <button
                onClick={() => setLanguageFilter('Hindi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  languageFilter === 'Hindi'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                🇮🇳 Hindi First
              </button>
              <button
                onClick={() => setLanguageFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  languageFilter === 'All'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Languages
              </button>
              <button
                onClick={() => setLanguageFilter('English')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  languageFilter === 'English'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                🇺🇸 English
              </button>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-hidden"
              >
                <option value="popular">🔥 Most Popular (Views)</option>
                <option value="liked">👍 Most Liked</option>
                <option value="top-rated">⭐ Top Rated (4.9+)</option>
                <option value="latest">📅 Latest Tutorials</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'All'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All CS Topics
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat.name
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((rec) => {
          const isImported = existingYoutubeIds.has(rec.youtubeId);
          const isImporting = importingId === rec.id;
          const importedVid = existingVideos.find((v) => v.youtubeId === rec.youtubeId);

          return (
            <div
              key={rec.id}
              className="group bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-900 overflow-hidden">
                  <img
                    src={getYouTubeThumbnail(rec.youtubeId)}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Duration Tag */}
                  <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-md">
                    {formatDuration(rec.duration)}
                  </span>

                  {/* Language Badge */}
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {rec.language === 'Hindi' ? '🇮🇳 Hindi' : '🇺🇸 English'}
                  </span>

                  {/* Rating Tag */}
                  <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    ⭐ {rec.rating}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                      {rec.category}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {rec.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {rec.channelName}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      {(rec.views / 1000000).toFixed(1)}M views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                      {(rec.likes / 1000).toFixed(0)}K likes
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: 1-Click Import to CodeTube */}
              <div className="p-4 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/60">
                {isImported && importedVid ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Added to CodeTube
                    </span>
                    <button
                      onClick={() => onSelectVideo(importedVid)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Watch
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleImportOneClick(rec)}
                    disabled={isImporting}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Plus className="w-4 h-4 transition-transform group-hover:scale-125" />
                    <span>{isImporting ? 'Adding to CodeTube...' : '1-Click Add to CodeTube'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No matching CS tutorials found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            Try resetting your search query or selecting "All CS Topics" above.
          </p>
        </div>
      )}
    </div>
  );
};
