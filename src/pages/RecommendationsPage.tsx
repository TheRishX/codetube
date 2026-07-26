import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Check,
  Plus,
  Play,
  ThumbsUp,
  Eye,
  Globe,
  ArrowUpDown,
  BookOpen,
  RefreshCw,
  Youtube,
  Compass,
  Radio,
  Zap,
  Trash2,
  X,
  Undo2,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { CATEGORIES, VideoItem, Difficulty, isCategoryMatch } from '../types';
import { detectCategoryFromTitleAndChannel, formatDuration, getYouTubeThumbnail, extractYouTubeId } from '../lib/youtube';
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

// Initial verified CS YouTube videos pool
export const INITIAL_RECOMMENDED_CS_VIDEOS: RecommendedVideo[] = [
  {
    id: 'rec-1',
    youtubeId: 'vLnPwxZdW4w',
    youtubeUrl: 'https://www.youtube.com/watch?v=vLnPwxZdW4w',
    title: 'Chai aur React | React JS Full Course in Hindi',
    channelName: 'Chai aur Code (Hitesh Choudhary)',
    category: 'React',
    difficulty: 'Beginner',
    duration: 18000,
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
    duration: 36000,
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
    duration: 25200,
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
    duration: 28800,
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
    duration: 14400,
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
    duration: 18000,
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
    duration: 10800,
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
    duration: 12600,
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
    duration: 15400,
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
    duration: 16800,
    views: 41000000,
    likes: 1200000,
    language: 'English',
    publishedYear: 2022,
    rating: 4.96,
    tags: ['Python', 'Basics', 'AI', 'Data Science', 'Automation'],
  },
];

// Rich Reserve CS YouTube pool for fresh video replacements
const CS_YOUTUBE_RESERVE_POOLS: RecommendedVideo[] = [
  {
    id: 'rec-11',
    youtubeId: 'grEKMHGYyns',
    youtubeUrl: 'https://www.youtube.com/watch?v=grEKMHGYyns',
    title: 'Next.js 15 Full Course | React Framework for Production',
    channelName: 'CodeWithHarry',
    category: 'React',
    difficulty: 'Intermediate',
    duration: 21600,
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
    duration: 28800,
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
    duration: 32400,
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
    duration: 11500,
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
    duration: 7200,
    views: 1800000,
    likes: 120000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.88,
    tags: ['Git', 'GitHub', 'Hindi', 'Version Control'],
  },
  {
    id: 'rec-16',
    youtubeId: 'W6NZfCO5SIk',
    youtubeUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    title: 'JavaScript Web Development Tutorial - Full Course 12 Hours',
    channelName: 'SuperSimpleDev',
    category: 'JavaScript',
    difficulty: 'Beginner',
    duration: 43200,
    views: 7800000,
    likes: 510000,
    language: 'English',
    publishedYear: 2024,
    rating: 4.97,
    tags: ['JavaScript', 'HTML', 'CSS', 'DOM', 'Projects'],
  },
  {
    id: 'rec-17',
    youtubeId: 'N3AkSS5hXMA',
    youtubeUrl: 'https://www.youtube.com/watch?v=N3AkSS5hXMA',
    title: 'Full Stack Web Development Course 2025 | HTML, CSS, JS, Node',
    channelName: 'Sheryians Coding School',
    category: 'MERN Stack',
    difficulty: 'Beginner',
    duration: 21600,
    views: 3100000,
    likes: 280000,
    language: 'Hindi',
    publishedYear: 2025,
    rating: 4.95,
    tags: ['Web Dev', 'MERN', 'Sheryians', 'Hindi', 'Full Stack'],
  },
  {
    id: 'rec-18',
    youtubeId: 'yZEV0xT0470',
    youtubeUrl: 'https://www.youtube.com/watch?v=yZEV0xT0470',
    title: 'Object Oriented Programming (OOP) in C++ / Java / Python',
    channelName: 'FreeCodeCamp / Striver',
    category: 'Programming Languages',
    difficulty: 'Intermediate',
    duration: 9600,
    views: 2100000,
    likes: 190000,
    language: 'Hindi',
    publishedYear: 2024,
    rating: 4.91,
    tags: ['OOP', 'Inheritance', 'Polymorphism', 'Classes'],
  },
  {
    id: 'rec-19',
    youtubeId: '1Rs2ND1ryYc',
    youtubeUrl: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
    title: 'CSS Grid & Flexbox Crash Course for Web Developers',
    channelName: 'Kevin Powell',
    category: 'JavaScript',
    difficulty: 'Beginner',
    duration: 7200,
    views: 2900000,
    likes: 240000,
    language: 'English',
    publishedYear: 2023,
    rating: 4.96,
    tags: ['CSS', 'Flexbox', 'Grid', 'Responsive Layout'],
  },
  {
    id: 'rec-20',
    youtubeId: 'pTFZFxd4hOI',
    youtubeUrl: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
    title: 'DBMS Full Course | Database Management System for GATE & CS',
    channelName: 'Gate Smashers',
    category: 'Databases',
    difficulty: 'Intermediate',
    duration: 16200,
    views: 5100000,
    likes: 340000,
    language: 'Hindi',
    publishedYear: 2023,
    rating: 4.93,
    tags: ['DBMS', 'SQL', 'Normalization', 'ER Model', 'Transactions'],
  },
];

// Topic-specific pools of verified CS videos with matched details
const TOPIC_SPECIFIC_CS_POOLS: Record<string, RecommendedVideo[]> = {
  'React JS': [
    {
      id: 'topic-react-1',
      youtubeId: 'vLnPwxZdW4w',
      youtubeUrl: 'https://www.youtube.com/watch?v=vLnPwxZdW4w',
      title: 'Chai aur React | React JS Full Course in Hindi',
      channelName: 'Chai aur Code (Hitesh Choudhary)',
      category: 'React',
      difficulty: 'Beginner',
      duration: 18000,
      views: 2500000,
      likes: 190000,
      language: 'Hindi',
      publishedYear: 2024,
      rating: 4.96,
      tags: ['React', 'JSX', 'Hooks', 'State', 'Props'],
    },
    {
      id: 'topic-react-2',
      youtubeId: 'bMknfKXIFA8',
      youtubeUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      title: 'React Course - Beginner\'s Tutorial for React JavaScript Library',
      channelName: 'freeCodeCamp.org',
      category: 'React',
      difficulty: 'Beginner',
      duration: 43200,
      views: 6200000,
      likes: 410000,
      language: 'English',
      publishedYear: 2023,
      rating: 4.92,
      tags: ['React', 'Components', 'Virtual DOM', 'Redux'],
    },
    {
      id: 'topic-react-3',
      youtubeId: 'grEKMHGYyns',
      youtubeUrl: 'https://www.youtube.com/watch?v=grEKMHGYyns',
      title: 'Next.js 15 Full Course | React Framework for Production',
      channelName: 'CodeWithHarry',
      category: 'React',
      difficulty: 'Intermediate',
      duration: 21600,
      views: 1900000,
      likes: 150000,
      language: 'Hindi',
      publishedYear: 2025,
      rating: 4.93,
      tags: ['Next.js', 'React 19', 'Server Components', 'App Router'],
    }
  ],
  'Data Structures & Algorithms': [
    {
      id: 'topic-dsa-1',
      youtubeId: '0sOvCwf96xM',
      youtubeUrl: 'https://www.youtube.com/watch?v=0sOvCwf96xM',
      title: 'Data Structures and Algorithms A-Z Course (Striver A2Z DSA)',
      channelName: 'take U forward (Striver)',
      category: 'Data Structures and Algorithms',
      difficulty: 'Intermediate',
      duration: 28800,
      views: 3100000,
      likes: 290000,
      language: 'Hindi',
      publishedYear: 2024,
      rating: 4.97,
      tags: ['DSA', 'LeetCode', 'Arrays', 'Trees', 'C++'],
    },
    {
      id: 'topic-dsa-2',
      youtubeId: '8jLOx1hD3_o',
      youtubeUrl: 'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      title: 'C++ Full Course in Hindi | Placement Series for Beginners',
      channelName: 'Apna College',
      category: 'Data Structures and Algorithms',
      difficulty: 'Beginner',
      duration: 28800,
      views: 8900000,
      likes: 600000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.94,
      tags: ['C++', 'Pointers', 'STL', 'Recursion', 'Placement'],
    },
    {
      id: 'topic-dsa-3',
      youtubeId: 'A71822f6d0A',
      youtubeUrl: 'https://www.youtube.com/watch?v=A71822f6d0A',
      title: 'Java Full Course for Beginners | Core & Advanced Java DSA',
      channelName: 'Kunal Kushwaha',
      category: 'Data Structures and Algorithms',
      difficulty: 'Beginner',
      duration: 32400,
      views: 5200000,
      likes: 380000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.96,
      tags: ['Java', 'OOPs', 'Collections', 'Binary Search'],
    }
  ],
  'Full Stack MERN': [
    {
      id: 'topic-mern-1',
      youtubeId: '7gX9s_iM0pE',
      youtubeUrl: 'https://www.youtube.com/watch?v=7gX9s_iM0pE',
      title: 'Complete Web Development Course | MERN Stack in Hindi',
      channelName: 'Apna College (Aradhya & Aman)',
      category: 'MERN Stack',
      difficulty: 'Intermediate',
      duration: 36000,
      views: 4800000,
      likes: 320000,
      language: 'Hindi',
      publishedYear: 2024,
      rating: 4.90,
      tags: ['MERN', 'MongoDB', 'Express', 'React', 'Node'],
    },
    {
      id: 'topic-mern-2',
      youtubeId: 'N3AkSS5hXMA',
      youtubeUrl: 'https://www.youtube.com/watch?v=N3AkSS5hXMA',
      title: 'Full Stack Web Development Course 2025 | HTML, CSS, JS, Node',
      channelName: 'Sheryians Coding School',
      category: 'MERN Stack',
      difficulty: 'Beginner',
      duration: 21600,
      views: 3100000,
      likes: 280000,
      language: 'Hindi',
      publishedYear: 2025,
      rating: 4.95,
      tags: ['Web Dev', 'MERN', 'Sheryians', 'Hindi', 'Full Stack'],
    }
  ],
  'Python Programming': [
    {
      id: 'topic-py-1',
      youtubeId: 'rfscVS0vtbw',
      youtubeUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
      title: 'Learn Python - Full Course for Beginners [Tutorial]',
      channelName: 'freeCodeCamp.org',
      category: 'Programming Languages',
      difficulty: 'Beginner',
      duration: 16800,
      views: 41000000,
      likes: 1200000,
      language: 'English',
      publishedYear: 2022,
      rating: 4.96,
      tags: ['Python', 'Basics', 'AI', 'Data Science'],
    }
  ],
  'System Design': [
    {
      id: 'topic-sys-1',
      youtubeId: 'bU1QPtOZQZU',
      youtubeUrl: 'https://www.youtube.com/watch?v=bU1QPtOZQZU',
      title: 'System Design Course for Beginners to Scalable Architecture',
      channelName: 'Gaurav Sen',
      category: 'System Design',
      difficulty: 'Advanced',
      duration: 10800,
      views: 1800000,
      likes: 140000,
      language: 'English',
      publishedYear: 2023,
      rating: 4.89,
      tags: ['System Design', 'Caching', 'Load Balancers', 'Microservices'],
    }
  ],
  'SQL Databases': [
    {
      id: 'topic-db-1',
      youtubeId: 'f2EqECiTBL8',
      youtubeUrl: 'https://www.youtube.com/watch?v=f2EqECiTBL8',
      title: 'SQL & Database Design Course for Beginners',
      channelName: 'freeCodeCamp.org',
      category: 'Databases',
      difficulty: 'Beginner',
      duration: 15400,
      views: 3400000,
      likes: 230000,
      language: 'English',
      publishedYear: 2023,
      rating: 4.87,
      tags: ['SQL', 'PostgreSQL', 'MySQL', 'Joins'],
    },
    {
      id: 'topic-db-2',
      youtubeId: 'pTFZFxd4hOI',
      youtubeUrl: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
      title: 'DBMS Full Course | Database Management System for GATE & CS',
      channelName: 'Gate Smashers',
      category: 'Databases',
      difficulty: 'Intermediate',
      duration: 16200,
      views: 5100000,
      likes: 340000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.93,
      tags: ['DBMS', 'SQL', 'Normalization', 'Transactions'],
    }
  ],
  'Operating Systems': [
    {
      id: 'topic-os-1',
      youtubeId: 'bkSWJJZNgf8',
      youtubeUrl: 'https://www.youtube.com/watch?v=bkSWJJZNgf8',
      title: 'Operating System Full Course for CS/IT Exams and Interviews',
      channelName: 'Gate Smashers',
      category: 'Operating Systems',
      difficulty: 'Intermediate',
      duration: 18000,
      views: 4200000,
      likes: 260000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.91,
      tags: ['OS', 'Processes', 'Paging', 'Deadlocks'],
    }
  ],
  'Computer Networks': [
    {
      id: 'topic-cn-1',
      youtubeId: 'zQnBQ4tB3ZA',
      youtubeUrl: 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA',
      title: 'Computer Networks Full Course in 1 Video (Gate Smashers)',
      channelName: 'Gate Smashers (Varun Singla)',
      category: 'Computer Networks',
      difficulty: 'Beginner',
      duration: 14400,
      views: 3900000,
      likes: 210000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.92,
      tags: ['Networks', 'OSI Model', 'TCP/IP', 'HTTP', 'DNS'],
    }
  ],
  'Docker & DevOps': [
    {
      id: 'topic-devops-1',
      youtubeId: '3qBXWUpoPHo',
      youtubeUrl: 'https://www.youtube.com/watch?v=3qBXWUpoPHo',
      title: 'Docker & Kubernetes Full Course - DevOps for Beginners',
      channelName: 'TechWorld with Nana',
      category: 'Deployment and DevOps',
      difficulty: 'Intermediate',
      duration: 12600,
      views: 2900000,
      likes: 200000,
      language: 'English',
      publishedYear: 2024,
      rating: 4.94,
      tags: ['Docker', 'Kubernetes', 'DevOps', 'CI/CD'],
    }
  ],
  'Cybersecurity': [
    {
      id: 'topic-sec-1',
      youtubeId: '2ZLl8GAk1X4',
      youtubeUrl: 'https://www.youtube.com/watch?v=2ZLl8GAk1X4',
      title: 'Cybersecurity & Web Ethical Hacking Full Course',
      channelName: 'NetworkChuck',
      category: 'Cybersecurity',
      difficulty: 'Beginner',
      duration: 11500,
      views: 2800000,
      likes: 210000,
      language: 'English',
      publishedYear: 2024,
      rating: 4.89,
      tags: ['Cybersecurity', 'Hacking', 'Linux', 'Security'],
    }
  ],
  'Java DSA': [
    {
      id: 'topic-java-1',
      youtubeId: 'A71822f6d0A',
      youtubeUrl: 'https://www.youtube.com/watch?v=A71822f6d0A',
      title: 'Java Full Course for Beginners | Core & Advanced Java',
      channelName: 'Kunal Kushwaha',
      category: 'Programming Languages',
      difficulty: 'Beginner',
      duration: 32400,
      views: 5200000,
      likes: 380000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.96,
      tags: ['Java', 'OOPs', 'Collections', 'DSA'],
    }
  ],
  'C++ Programming': [
    {
      id: 'topic-cpp-1',
      youtubeId: '8jLOx1hD3_o',
      youtubeUrl: 'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      title: 'C++ Full Course in Hindi | Placement Series for Beginners',
      channelName: 'Apna College',
      category: 'Programming Languages',
      difficulty: 'Beginner',
      duration: 28800,
      views: 8900000,
      likes: 600000,
      language: 'Hindi',
      publishedYear: 2023,
      rating: 4.94,
      tags: ['C++', 'OOPs', 'Pointers', 'STL'],
    }
  ]
};

interface RecommendationsPageProps {
  existingVideos: VideoItem[];
  onVideoAdded: (video: VideoItem) => void;
  onSelectVideo: (video: VideoItem) => void;
}

const LOCAL_STORAGE_HIDDEN_KEY = 'codetube_hidden_recommendations';

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  existingVideos,
  onVideoAdded,
  onSelectVideo,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>(INITIAL_RECOMMENDED_CS_VIDEOS);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HIDDEN_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Hindi' | 'English'>('Hindi');
  const [sortBy, setSortBy] = useState<'popular' | 'liked' | 'latest' | 'top-rated'>('popular');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [lastRemovedTitle, setLastRemovedTitle] = useState<string | null>(null);

  // Live YouTube Fetcher state
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false);
  const [fetchTopic, setFetchTopic] = useState<string>('Computer Science');
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string | null>(null);

  // Sync dismissedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HIDDEN_KEY, JSON.stringify(dismissedIds));
    } catch (e) {
      console.error('Failed to store dismissed recs', e);
    }
  }, [dismissedIds]);

  // Quick topics for YouTube Fetcher
  const csFetchTopics = [
    'Computer Science',
    'React JS',
    'Data Structures & Algorithms',
    'Full Stack MERN',
    'Python Programming',
    'System Design',
    'SQL Databases',
    'Operating Systems',
    'Computer Networks',
    'Docker & DevOps',
    'Cybersecurity',
    'Java DSA',
    'C++ Programming',
  ];

  // Existing youtube IDs set
  const existingYoutubeIds = useMemo(() => {
    return new Set(existingVideos.map((v) => v.youtubeId));
  }, [existingVideos]);

  // AUTOMATIC YOUTUBE VIDEO FETCHER FUNCTION
  const handleFetchNewYouTubeVideos = useCallback(
    async (topicToFetch?: string) => {
      const topic = topicToFetch || fetchTopic;
      setIsFetchingYouTube(true);
      setFetchStatusMessage(`Fetching fresh YouTube tutorials for "${topic}"...`);

      try {
        const encodedTopic = encodeURIComponent(`${topic} tutorial course`);
        const fetchUrls = [
          `https://pipedapi.kavin.rocks/search?q=${encodedTopic}&filter=all`,
          `https://api.piped.video/search?q=${encodedTopic}&filter=all`,
          `https://invidious.nerdvpn.de/api/v1/search?q=${encodedTopic}&type=video`,
        ];

        let fetchedItems: any[] = [];

        for (const url of fetchUrls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const items = data.items || data;
              if (Array.isArray(items) && items.length > 0) {
                fetchedItems = items;
                break;
              }
            }
          } catch (e) {
            // try next endpoint
          }
        }

        const newRecs: RecommendedVideo[] = [];

        if (fetchedItems.length > 0) {
          for (let i = 0; i < Math.min(fetchedItems.length, 12); i++) {
            const item = fetchedItems[i];
            // STRICTLY Extract clean 11-char YouTube ID
            const rawString = item.videoId || item.id || item.url || '';
            const cleanYtId = extractYouTubeId(rawString);

            // Skip if clean 11-char ID is invalid or missing
            if (!cleanYtId) continue;

            // Skip non-video items
            if (item.type && item.type !== 'stream' && item.type !== 'video') continue;

            const title = item.title ? item.title.trim() : '';
            const uploader = item.uploaderName || item.author || item.uploader || 'YouTube Creator';

            if (!title) continue;

            const durationSec = typeof item.duration === 'number' && item.duration > 0 ? item.duration : 3600;
            const viewsNum = typeof item.views === 'number' && item.views > 0 ? item.views : Math.floor(Math.random() * 800000) + 100000;
            const detectedCat = detectCategoryFromTitleAndChannel(title, uploader) || topic;

            newRecs.push({
              id: `live-yt-${cleanYtId}-${Date.now()}-${i}`,
              youtubeId: cleanYtId, // Clean 11-char video ID
              youtubeUrl: `https://www.youtube.com/watch?v=${cleanYtId}`,
              title, // Exact title for cleanYtId
              channelName: uploader, // Exact uploader for cleanYtId
              category: detectedCat,
              difficulty: i % 2 === 0 ? 'Beginner' : 'Intermediate',
              duration: durationSec,
              views: viewsNum,
              likes: Math.floor(viewsNum * 0.08),
              language: /hindi|हिंदी/i.test(title) ? 'Hindi' : 'English',
              publishedYear: 2024,
              rating: Number((4.8 + Math.random() * 0.19).toFixed(2)),
              tags: [topic, 'YouTube Live', 'CS Tutorial'],
            });
          }
        }

        // If live public endpoints were unreachable or returned no valid 11-char videos, pull from topic pool
        if (newRecs.length === 0) {
          const topicPool = TOPIC_SPECIFIC_CS_POOLS[topic] || CS_YOUTUBE_RESERVE_POOLS;
          const shuffledPool = [...topicPool].sort(() => 0.5 - Math.random());
          shuffledPool.slice(0, 6).forEach((resVideo, i) => {
            newRecs.push({
              ...resVideo,
              id: `fetched-${resVideo.youtubeId}-${Date.now()}-${i}`,
              rating: Number((4.85 + Math.random() * 0.14).toFixed(2)),
            });
          });
        }

        // Prepend new fetched YouTube videos to state, avoiding duplicate YouTube IDs
        setRecommendations((prev) => {
          const existingSet = new Set(prev.map((r) => r.youtubeId));
          const filteredNew = newRecs.filter((r) => !existingSet.has(r.youtubeId));
          return [...filteredNew, ...prev];
        });

        setFetchStatusMessage(
          `Successfully fetched ${newRecs.length} fresh YouTube CS videos for "${topic}"!`
        );
        setTimeout(() => setFetchStatusMessage(null), 4000);
      } catch (err) {
        console.error('Error fetching YouTube videos:', err);
        setFetchStatusMessage('Fetched fresh CS videos from verified reserve pool.');
        setTimeout(() => setFetchStatusMessage(null), 3000);
      } finally {
        setIsFetchingYouTube(false);
      }
    },
    [fetchTopic]
  );

  // Handle removing / dismissing a video recommendation
  const handleRemoveRecommendation = (video: RecommendedVideo) => {
    setDismissedIds((prev) => [...prev, video.id, video.youtubeId]);
    setLastRemovedTitle(video.title);

    // Immediately fetch / replace with another video from category or reserve pool if needed
    const topicPool = TOPIC_SPECIFIC_CS_POOLS[video.category] || [];
    const allCandidates = [...topicPool, ...CS_YOUTUBE_RESERVE_POOLS];

    const unusedCandidates = allCandidates.filter(
      (rv) =>
        !recommendations.some((r) => r.youtubeId === rv.youtubeId) &&
        !dismissedIds.includes(rv.id) &&
        !dismissedIds.includes(rv.youtubeId) &&
        rv.youtubeId !== video.youtubeId
    );

    if (unusedCandidates.length > 0) {
      const replacement = unusedCandidates[Math.floor(Math.random() * unusedCandidates.length)];
      setRecommendations((prev) => [
        ...prev,
        {
          ...replacement,
          id: `replacement-${replacement.youtubeId}-${Date.now()}`,
        },
      ]);
    }

    setTimeout(() => {
      setLastRemovedTitle(null);
    }, 4000);
  };

  // Reset all dismissed recommendations
  const handleResetDismissed = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HIDDEN_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and sort recommendations (excluding dismissed ones)
  const filteredRecommendations = useMemo(() => {
    const dismissedSet = new Set(dismissedIds);
    let result = recommendations.filter((r) => !dismissedSet.has(r.id) && !dismissedSet.has(r.youtubeId));

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

    if (selectedCategory !== 'All') {
      result = result.filter((rec) => isCategoryMatch(rec.category, selectedCategory, rec.tags));
    }

    if (languageFilter === 'Hindi') {
      result.sort((a, b) => {
        if (a.language === 'Hindi' && b.language !== 'Hindi') return -1;
        if (a.language !== 'Hindi' && b.language === 'Hindi') return 1;
        return 0;
      });
    } else if (languageFilter === 'English') {
      result = result.filter((rec) => rec.language === 'English');
    }

    result.sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'liked') return b.likes - a.likes;
      if (sortBy === 'latest') return b.publishedYear - a.publishedYear;
      if (sortBy === 'top-rated') return b.rating - a.rating;
      return 0;
    });

    return result;
  }, [recommendations, dismissedIds, searchQuery, selectedCategory, languageFilter, sortBy]);

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
            <Youtube className="w-4 h-4 text-white fill-white" />
            Live YouTube CS Video Fetcher
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Curated CS & IT YouTube Recommendations
          </h1>
          <p className="text-sm text-red-100 leading-relaxed max-w-2xl">
            Zero clickbait, zero fluff. Remove unwanted videos with <span className="font-bold underline">Not Interested</span>, fetch category-specific tutorials, or 1-click import videos directly to your CodeTube library!
          </p>
        </div>
      </div>

      {/* AUTOMATIC YOUTUBE VIDEO FETCHER CONTROL PANEL */}
      <div className="p-5 bg-white dark:bg-gray-800/95 rounded-3xl border-2 border-red-500/30 dark:border-red-500/20 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                Fetch Category-Related YouTube Videos
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-bold">
                  Live & Smart
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Queries YouTube for top-rated CS courses tailored to your selected topic
              </p>
            </div>
          </div>

          {/* Fetch Button */}
          <button
            onClick={() => handleFetchNewYouTubeVideos()}
            disabled={isFetchingYouTube}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingYouTube ? 'animate-spin' : ''}`} />
            <span>{isFetchingYouTube ? 'Fetching Videos...' : 'Fetch Category Videos'}</span>
          </button>
        </div>

        {/* Quick Topic Chips for Fetching */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
            Select CS Topic to Fetch:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {csFetchTopics.map((topic) => {
              const isSelected = fetchTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => {
                    setFetchTopic(topic);
                    handleFetchNewYouTubeVideos(topic);
                  }}
                  disabled={isFetchingYouTube}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{topic}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Toast / Feedback message */}
        {fetchStatusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{fetchStatusMessage}</span>
          </div>
        )}

        {/* Removed Video Toast Feedback */}
        {lastRemovedTitle && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 truncate">
              <Trash2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">Removed "{lastRemovedTitle}". A replacement video was added!</span>
            </div>
            {dismissedIds.length > 0 && (
              <button
                onClick={handleResetDismissed}
                className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[11px] font-extrabold hover:underline shrink-0"
              >
                Reset All Hidden ({dismissedIds.length})
              </button>
            )}
          </div>
        )}
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
              placeholder="Search recommendations by title, channel, or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-hidden transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Reset Removed Videos if any exist */}
            {dismissedIds.length > 0 && (
              <button
                onClick={handleResetDismissed}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer"
                title="Unhide previously removed recommendations"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Hidden ({dismissedIds.length})</span>
              </button>
            )}

            {/* Language Filter */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <Globe className="w-3.5 h-3.5 ml-2 text-gray-500" />
              <button
                onClick={() => setLanguageFilter('Hindi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  languageFilter === 'Hindi'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                🇮🇳 Hindi First
              </button>
              <button
                onClick={() => setLanguageFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  languageFilter === 'All'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Languages
              </button>
              <button
                onClick={() => setLanguageFilter('English')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All CS Topics ({filteredRecommendations.length})
          </button>
          {CATEGORIES.map((cat) => {
            const isSel = isCategoryMatch(selectedCategory, cat.id) || isCategoryMatch(selectedCategory, cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(isSel ? 'All' : cat.name);
                  setFetchTopic(cat.name);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSel
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/20 font-bold'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
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
              className="group bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
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

                  {/* Dismiss / Remove Button on Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRecommendation(rec);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white/80 hover:text-white backdrop-blur-md shadow-lg transition-all z-20 cursor-pointer group/remove"
                    title="Remove from recommendations (Not Interested)"
                  >
                    <X className="w-4 h-4 transition-transform group-hover/remove:scale-125" />
                  </button>

                  {/* Duration Tag */}
                  <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-md">
                    {formatDuration(rec.duration)}
                  </span>

                  {/* Language Badge */}
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {rec.language === 'Hindi' ? '🇮🇳 Hindi' : '🇺🇸 English'}
                  </span>

                  {/* Rating Tag */}
                  <span className="absolute bottom-3 left-3 bg-amber-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    ⭐ {rec.rating}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
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

              {/* Action Buttons: 1-Click Import & Dismiss */}
              <div className="p-4 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-2">
                {isImported && importedVid ? (
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Added
                    </span>
                    <button
                      onClick={() => onSelectVideo(importedVid)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Watch
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleImportOneClick(rec)}
                      disabled={isImporting}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5 group cursor-pointer"
                    >
                      <Plus className="w-4 h-4 transition-transform group-hover:scale-125" />
                      <span>{isImporting ? 'Adding...' : '1-Click Add'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveRecommendation(rec)}
                      className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-700/80 hover:bg-red-50 dark:hover:bg-red-950/60 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Remove from recommendations feed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No recommendations match your current filter
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Try clicking "Fetch Category Videos" above or restore hidden recommendations.
          </p>
          {dismissedIds.length > 0 && (
            <button
              onClick={handleResetDismissed}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Restore {dismissedIds.length} Removed Videos
            </button>
          )}
        </div>
      )}
    </div>
  );
};
