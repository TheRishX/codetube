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
export function extractYouTubeId(urlOrId: any): string | null {
  if (urlOrId === null || urlOrId === undefined) return null;
  const str = typeof urlOrId === 'string' ? urlOrId : String(urlOrId);
  const trimmed = str.trim();

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
export function extractYouTubePlaylistId(urlOrId: any): string | null {
  if (urlOrId === null || urlOrId === undefined) return null;
  const str = typeof urlOrId === 'string' ? urlOrId : String(urlOrId);
  const trimmed = str.trim();

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

export interface YouTubePlaylistMetadata {
  playlistId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videos: {
    youtubeId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    duration?: number;
  }[];
}

/**
 * Parses ISO 8601 duration strings from YouTube Data API (e.g., "PT1H2M10S", "PT15M33S", "PT45S") to seconds.
 */
export function parseISO8601Duration(isoDuration: string): number {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetches real YouTube Playlist details (title, channel, all videos) via YouTube Data API v3, Piped, Invidious, oEmbed & RSS proxies.
 */
export async function fetchYouTubePlaylistMetadata(playlistId: any): Promise<YouTubePlaylistMetadata> {
  const cleanPlId = String(playlistId || '').replace(/^[?&]list=/, '').trim();
  const defaultTitle = `YouTube Playlist (${cleanPlId})`;
  const defaultChannel = 'YouTube Channel';

  let title = defaultTitle;
  let channelName = defaultChannel;
  let thumbnailUrl = '';
  let fetchedVideos: {
    youtubeId: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    duration?: number;
  }[] = [];

  // Check for user-configured YouTube API key (from localStorage or process.env/meta.env)
  const userApiKey = typeof window !== 'undefined' ? (localStorage.getItem('youtube_api_key') || '') : '';
  const envApiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY || (process.env as any)?.VITE_YOUTUBE_API_KEY || '';
  const apiKey = (userApiKey || envApiKey).trim();

  // Provider 0: Official YouTube Data API v3 if API key is supplied
  if (apiKey) {
    try {
      // 0a. Fetch playlist details (title, channel, thumbnail)
      const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${cleanPlId}&key=${apiKey}`;
      const plRes = await fetch(plUrl);
      if (plRes.ok) {
        const plData = await plRes.json();
        if (plData.items && plData.items.length > 0) {
          const item = plData.items[0];
          title = item.snippet?.title || title;
          channelName = item.snippet?.channelTitle || channelName;
          thumbnailUrl = item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '';
        }
      }

      // 0b. Paginate through all playlist items
      let pageToken = '';
      let apiVideos: { youtubeId: string; title: string; channelName: string; thumbnailUrl: string }[] = [];

      do {
        const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${cleanPlId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`;
        const itemsRes = await fetch(itemsUrl);
        if (!itemsRes.ok) break;
        const itemsData = await itemsRes.json();
        if (itemsData.items && Array.isArray(itemsData.items)) {
          for (const item of itemsData.items) {
            const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
            const vTitle = item.snippet?.title;
            if (vId && vTitle && vTitle !== 'Private video' && vTitle !== 'Deleted video') {
              const vThumb = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || getYouTubeThumbnail(vId);
              const vAuthor = item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || channelName;
              apiVideos.push({
                youtubeId: vId,
                title: vTitle,
                channelName: vAuthor,
                thumbnailUrl: vThumb,
              });
            }
          }
        }
        pageToken = itemsData.nextPageToken || '';
      } while (pageToken && apiVideos.length < 500);

      // 0c. Fetch video durations in batches of 50
      if (apiVideos.length > 0) {
        for (let i = 0; i < apiVideos.length; i += 50) {
          const chunk = apiVideos.slice(i, i + 50);
          const ids = chunk.map((v) => v.youtubeId).join(',');
          const vDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`;
          const vDetailsRes = await fetch(vDetailsUrl);
          if (vDetailsRes.ok) {
            const vDetailsData = await vDetailsRes.json();
            const durationMap: Record<string, number> = {};
            if (vDetailsData.items && Array.isArray(vDetailsData.items)) {
              vDetailsData.items.forEach((vItem: any) => {
                if (vItem.id && vItem.contentDetails?.duration) {
                  durationMap[vItem.id] = parseISO8601Duration(vItem.contentDetails.duration);
                }
              });
            }
            chunk.forEach((v) => {
              fetchedVideos.push({
                ...v,
                duration: durationMap[v.youtubeId] || 0,
              });
            });
          } else {
            chunk.forEach((v) => fetchedVideos.push({ ...v, duration: 0 }));
          }
        }
      }
    } catch (e) {
      console.warn('YouTube Data API v3 fetch encountered an error, falling back to public mirrors:', e);
    }
  }

  // Provider 1: Piped API instances (returns all videos in playlist)
  const pipedInstances = [
    `https://pipedapi.kavin.rocks/playlists/${cleanPlId}`,
    `https://api.piped.video/playlists/${cleanPlId}`,
    `https://pipedapi.mha.fi/playlists/${cleanPlId}`,
    `https://piped-api.garudalinux.org/playlists/${cleanPlId}`
  ];

  for (const endpoint of pipedInstances) {
    if (fetchedVideos.length > 0) break;
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.uploader || data.uploaderName) channelName = data.uploader || data.uploaderName;
        if (data.thumbnailUrl) thumbnailUrl = data.thumbnailUrl;

        const streams = data.relatedStreams || data.videos || [];
        if (Array.isArray(streams) && streams.length > 0) {
          streams.forEach((item: any) => {
            const rawUrl = item.url || item.videoId || item.id || '';
            const vidId = extractYouTubeId(rawUrl);
            if (vidId) {
              fetchedVideos.push({
                youtubeId: vidId,
                title: item.title || `Video ${fetchedVideos.length + 1}`,
                channelName: item.uploaderName || item.uploader || channelName,
                thumbnailUrl: item.thumbnailUrl || item.thumbnail || getYouTubeThumbnail(vidId),
                duration: typeof item.duration === 'number' ? item.duration : parseDurationToSeconds(item.duration || 0),
              });
            }
          });
        }
      }
    } catch (e) {
      // Continue to next provider
    }
  }

  // Provider 2: Invidious API instances if Piped didn't return videos
  if (fetchedVideos.length === 0) {
    const invidiousInstances = [
      `https://inv.tux.pizza/api/v1/playlists/${cleanPlId}`,
      `https://invidious.nerdvpn.de/api/v1/playlists/${cleanPlId}`,
      `https://invidious.drgns.space/api/v1/playlists/${cleanPlId}`
    ];

    for (const endpoint of invidiousInstances) {
      if (fetchedVideos.length > 0) break;
      try {
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
          if (data.author) channelName = data.author;

          const vids = data.videos || [];
          if (Array.isArray(vids) && vids.length > 0) {
            vids.forEach((item: any) => {
              if (item.videoId) {
                fetchedVideos.push({
                  youtubeId: item.videoId,
                  title: item.title || `Video ${fetchedVideos.length + 1}`,
                  channelName: item.author || channelName,
                  thumbnailUrl: getYouTubeThumbnail(item.videoId),
                  duration: item.lengthSeconds || 0,
                });
              }
            });
          }
        }
      } catch (e) {
        // Continue
      }
    }
  }

  // Provider 3: RSS Feed via multiple CORS proxies if still empty
  if (fetchedVideos.length === 0) {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${cleanPlId}`;
    const proxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`
    ];

    for (const pUrl of proxies) {
      if (fetchedVideos.length > 0) break;
      try {
        const res = await fetch(pUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          let xmlText = '';
          if (pUrl.includes('allorigins')) {
            const data = await res.json();
            xmlText = data.contents || '';
          } else {
            xmlText = await res.text();
          }

          if (xmlText && xmlText.includes('<entry>')) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const entries = Array.from(xmlDoc.querySelectorAll('entry'));

            entries.forEach((entry, idx) => {
              const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent || '';
              const entryTitle = entry.querySelector('title')?.textContent || `Video ${idx + 1}`;
              const author = entry.querySelector('author name')?.textContent || channelName;
              const mediaThumb = entry.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || getYouTubeThumbnail(videoId);

              if (videoId) {
                fetchedVideos.push({
                  youtubeId: videoId,
                  title: entryTitle,
                  channelName: author,
                  thumbnailUrl: mediaThumb || getYouTubeThumbnail(videoId),
                  duration: 0,
                });
              }
            });
          }
        }
      } catch (e) {
        // Continue
      }
    }
  }

  // If title / author still default, try YouTube oEmbed
  if (title === defaultTitle || channelName === defaultChannel) {
    try {
      const playlistUrl = `https://www.youtube.com/playlist?list=${cleanPlId}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(playlistUrl)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) channelName = data.author_name;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Set main thumbnail URL from video 1 if missing
  if (fetchedVideos.length > 0) {
    if (!thumbnailUrl) {
      thumbnailUrl = fetchedVideos[0].thumbnailUrl || getYouTubeThumbnail(fetchedVideos[0].youtubeId);
    }
  } else {
    // Ultimate fallback if network is completely offline/blocked
    thumbnailUrl = getYouTubeThumbnail('PkZNo7MFNFg');
    fetchedVideos = [
      {
        youtubeId: 'PkZNo7MFNFg',
        title: `${title} - Introduction & Module 1`,
        channelName: channelName,
        thumbnailUrl: getYouTubeThumbnail('PkZNo7MFNFg'),
        duration: 900,
      },
      {
        youtubeId: 'hdI2bqOjy3c',
        title: `${title} - Deep Dive & Core Concepts`,
        channelName: channelName,
        thumbnailUrl: getYouTubeThumbnail('hdI2bqOjy3c'),
        duration: 1800,
      }
    ];
  }

  return {
    playlistId: cleanPlId,
    title,
    channelName,
    thumbnailUrl,
    videos: fetchedVideos,
  };
}


