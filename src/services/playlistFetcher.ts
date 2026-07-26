import { YouTubePlaylistMetadata } from '../lib/youtube';

/**
 * Cleanly extracts YouTube Playlist ID from any URL or string.
 */
export function extractYouTubePlaylistId(urlOrId: any): string | null {
  if (urlOrId === null || urlOrId === undefined) return null;
  const str = typeof urlOrId === 'string' ? urlOrId : String(urlOrId);
  const trimmed = str.trim();

  // Pure playlist ID starting with PL or alphanumeric ID
  if (/^PL[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  // URL matching list parameter (e.g. ?list=PL... or &list=PL...)
  const match = trimmed.match(/[?&]list=([^"&?\/\s]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Cleanly extracts YouTube Video ID (11 chars) from any URL or string.
 */
export function extractYouTubeVideoId(urlOrId: any): string | null {
  if (urlOrId === null || urlOrId === undefined) return null;
  const str = typeof urlOrId === 'string' ? urlOrId : String(urlOrId);
  const trimmed = str.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  return null;
}

/**
 * Gets the stored YouTube API key from LocalStorage or Vite Environment
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  const localKey = localStorage.getItem('youtube_api_key') || '';
  const envKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY || (process.env as any)?.VITE_YOUTUBE_API_KEY || '';
  return (localKey || envKey).trim();
}

/**
 * Sets or removes the YouTube API key in LocalStorage
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('youtube_api_key', trimmed);
  } else {
    localStorage.removeItem('youtube_api_key');
  }
}

export interface ApiKeyTestResult {
  valid: boolean;
  message: string;
  playlistTitle?: string;
  channelTitle?: string;
  itemCount?: number;
}

/**
 * Tests YouTube Data API v3 key validity using backend endpoint or direct fetch
 */
export async function testYouTubeApiKey(apiKey: string, testPlaylistId?: string): Promise<ApiKeyTestResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { valid: false, message: 'Please enter an API key.' };
  }

  const plId = (testPlaylistId || 'PLbtI3_MArDOmSKABu09sEs0SxCibd1wgr').trim();

  // Try backend route first
  try {
    const res = await fetch('/api/youtube/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: cleanKey, playlistId: plId }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Fallback to direct client call if backend route is unavailable
  }

  // Client-side direct YouTube API fallback test
  try {
    const testUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${plId}&key=${cleanKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
      const errReason = data?.error?.errors?.[0]?.reason || data?.error?.message || 'Invalid API key or quota exceeded';
      return { valid: false, message: `YouTube API Error: ${errReason}` };
    }

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        valid: true,
        message: 'YouTube Data API key is valid and working!',
        playlistTitle: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        itemCount: item.contentDetails?.itemCount,
      };
    } else {
      return { valid: true, message: 'Key is valid, but requested test playlist was not found.' };
    }
  } catch (err: any) {
    return { valid: false, message: err?.message || 'Network error testing API key.' };
  }
}

/**
 * Primary Playlist Fetcher: Queries backend `/api/youtube/playlist` first, then client proxies.
 */
export async function fetchPlaylistMetadata(
  playlistId: string,
  apiKeyOverride?: string
): Promise<YouTubePlaylistMetadata> {
  const cleanPlId = playlistId.replace(/^[?&]list=/, '').trim();
  const apiKey = apiKeyOverride || getStoredApiKey();

  // 1. Try Express / Vercel Serverless Endpoint First
  try {
    const res = await fetch('/api/youtube/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistId: cleanPlId, apiKey }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success && data.videos && data.videos.length > 0) {
        return {
          playlistId: cleanPlId,
          title: data.title || `YouTube Playlist (${cleanPlId})`,
          channelName: data.channelName || 'YouTube Learning',
          thumbnailUrl: data.thumbnailUrl || data.videos[0]?.thumbnailUrl || `https://img.youtube.com/vi/${data.videos[0]?.youtubeId}/hqdefault.jpg`,
          videos: data.videos,
        };
      }
    }
  } catch (err) {
    console.warn('Backend/Vercel API endpoint not reachable, falling back to client proxy engine:', err);
  }

  // 2. Client-side Fallback (Imports existing logic in YouTube lib)
  const { fetchYouTubePlaylistMetadata } = await import('../lib/youtube');
  return fetchYouTubePlaylistMetadata(cleanPlId);
}
