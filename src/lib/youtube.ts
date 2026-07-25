/**
 * YouTube Utility Functions
 * Validates YouTube URLs, extracts video IDs, formats timestamps,
 * and fetches public video metadata via YouTube oEmbed API.
 */

export interface YouTubeMetadata {
  title: string;
  authorName: string;
  thumbnailUrl: string;
  html?: string;
}

/**
 * Extracts a 11-character YouTube video ID from various URL formats or plain ID.
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If it's already an 11-character alphanumeric video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex for standard, short, embed, shorts, v URLs
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns standard high-res thumbnail URL for a YouTube video ID.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Validates whether a given string is a valid YouTube URL or Video ID.
 */
export function isValidYouTubeUrl(urlOrId: string): boolean {
  return extractYouTubeId(urlOrId) !== null;
}

/**
 * Fetches public YouTube video details via oEmbed endpoint without needing an API key.
 * Falls back gracefully if blocked or network error occurs.
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  const defaultMeta: YouTubeMetadata = {
    title: `YouTube Video (${videoId})`,
    authorName: 'Unknown Channel',
    thumbnailUrl: getYouTubeThumbnail(videoId),
  };

  try {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;

    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || defaultMeta.title,
        authorName: data.author_name || defaultMeta.authorName,
        thumbnailUrl: data.thumbnail_url || defaultMeta.thumbnailUrl,
        html: data.html,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch oEmbed metadata for YouTube video, using fallback:', err);
  }

  return defaultMeta;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses time string like "1h 30m" or "10:30" or seconds to seconds.
 */
export function parseDurationToSeconds(input: string | number): number {
  if (typeof input === 'number') return input;
  if (!input) return 0;

  const trimmed = input.trim().toLowerCase();

  // Check HH:MM:SS or MM:SS
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }

  // Check 1h 20m 30s
  let totalSeconds = 0;
  const hoursMatch = trimmed.match(/(\d+)\s*h/);
  const minsMatch = trimmed.match(/(\d+)\s*m/);
  const secsMatch = trimmed.match(/(\d+)\s*s/);

  if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  if (minsMatch) totalSeconds += parseInt(minsMatch[1], 10) * 60;
  if (secsMatch) totalSeconds += parseInt(secsMatch[1], 10);

  if (totalSeconds > 0) return totalSeconds;

  const parsedNumber = parseInt(trimmed, 10);
  return isNaN(parsedNumber) ? 0 : parsedNumber;
}

/**
 * Auto-detects CS/IT category based on video title and channel name.
 */
export function detectCategoryFromTitleAndChannel(title: string, channelName: string = ''): string {
  const text = `${title} ${channelName}`.toLowerCase();

  if (/mern|mongodb.*express|react.*node|node.*react/i.test(text)) return 'MERN Stack';
  if (/next\.?js|react/i.test(text)) return 'React';
  if (/javascript|js\b|es6|async|event loop/i.test(text)) return 'JavaScript';
  if (/backend|node\.?js|express|rest api|graphql|microservice|nest\.?js/i.test(text)) return 'Backend';
  if (/database|sql|postgres|mysql|redis|mongodb|firestore|prisma/i.test(text)) return 'Databases';
  if (/devops|docker|kubernetes|ci\/?cd|aws|cloud|terraform|deployment/i.test(text)) return 'Deployment and DevOps';
  if (/network|tcp|http|dns|websocket|socket/i.test(text)) return 'Computer Networks';
  if (/operating system|\bos\b|linux|kernel|process|thread/i.test(text)) return 'Operating Systems';
  if (/system design|scalability|load balancer|distributed/i.test(text)) return 'System Design';
  if (/dsa|data structure|algorithm|leetcode|binary tree|graph|dynamic programming|sorting|array/i.test(text)) return 'Data Structures and Algorithms';
  if (/cybersecurity|security|ethical hacking|owasp|cryptography|auth/i.test(text)) return 'Cybersecurity';
  if (/git\b|github|version control/i.test(text)) return 'Git and GitHub';
  if (/python|java\b|c\+\+|golang|rust|typescript/i.test(text)) return 'Programming Languages';
  if (/interview|career|resume|placement/i.test(text)) return 'Career and Interviews';
  if (/clone|build|project|full stack|app from scratch/i.test(text)) return 'Projects';

  return 'MERN Stack';
}

/**
 * Extracts a YouTube playlist ID from list parameter in URLs.
 */
export function extractYouTubePlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If it starts with PL or is alphanumeric list ID
  if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/[?&]list=([^"&?\/\s]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Checks if URL is a YouTube Playlist link.
 */
export function isYouTubePlaylistUrl(urlOrId: string): boolean {
  return extractYouTubePlaylistId(urlOrId) !== null;
}

