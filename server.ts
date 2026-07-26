import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to parse ISO 8601 duration (e.g. PT1H2M10S -> seconds)
function parseISO8601Duration(isoDuration: string): number {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// API Route: Test YouTube Data API Key
app.post('/api/youtube/test-key', async (req, res) => {
  try {
    const { apiKey, playlistId } = req.body || {};
    if (!apiKey) {
      return res.status(400).json({ valid: false, message: 'API key is required.' });
    }

    const testId = (playlistId || 'PLbtI3_MArDOmSKABu09sEs0SxCibd1wgr').trim();
    const testUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${testId}&key=${apiKey.trim()}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();

    if (!response.ok) {
      const errReason = data?.error?.errors?.[0]?.reason || data?.error?.message || 'Invalid API key or request failed';
      return res.status(400).json({ valid: false, message: `YouTube API Error: ${errReason}` });
    }

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return res.json({
        valid: true,
        message: 'YouTube Data API Key is valid and active!',
        playlistTitle: item.snippet?.title || 'Untitled Playlist',
        channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
        itemCount: item.contentDetails?.itemCount || 0,
      });
    } else {
      return res.json({
        valid: true,
        message: 'Key is valid, but the requested test playlist ID was not found.',
      });
    }
  } catch (error: any) {
    return res.status(500).json({ valid: false, message: error?.message || 'Server error testing key' });
  }
});

// API Route: Fetch Playlist Metadata (Server-side fetch avoids browser CORS)
app.post('/api/youtube/playlist', async (req, res) => {
  try {
    const { playlistId, apiKey: clientApiKey } = req.body || {};
    if (!playlistId) {
      return res.status(400).json({ error: 'playlistId parameter is required' });
    }

    const cleanPlId = String(playlistId).replace(/^[?&]list=/, '').trim();
    const apiKey = (clientApiKey || process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '').trim();

    let title = `YouTube Playlist (${cleanPlId})`;
    let channelName = 'YouTube Learning';
    let thumbnailUrl = `https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg`;
    let videos: { youtubeId: string; title: string; channelName: string; thumbnailUrl: string; duration: number }[] = [];
    let fetchSource = 'none';

    // Strategy 1: Official YouTube Data API v3 if API key is present
    if (apiKey) {
      try {
        const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${cleanPlId}&key=${apiKey}`;
        const plRes = await fetch(plUrl);
        if (plRes.ok) {
          const plData = await plRes.json();
          if (plData.items && plData.items.length > 0) {
            const item = plData.items[0];
            title = item.snippet?.title || title;
            channelName = item.snippet?.channelTitle || channelName;
            thumbnailUrl = item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || thumbnailUrl;
          }
        }

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
                const vThumb = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;
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

        if (apiVideos.length > 0) {
          fetchSource = 'youtube_data_api_v3';
          // Batch fetch durations
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
                videos.push({
                  ...v,
                  duration: durationMap[v.youtubeId] || 0,
                });
              });
            } else {
              chunk.forEach((v) => videos.push({ ...v, duration: 0 }));
            }
          }
        }
      } catch (err) {
        console.warn('API v3 fetch failed, falling back to server RSS feed:', err);
      }
    }

    // Strategy 2: Server-side YouTube RSS Feed XML parsing (NO CORS limitations in Node)
    if (videos.length === 0) {
      try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${cleanPlId}`;
        const rssRes = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (rssRes.ok) {
          const xmlText = await rssRes.text();
          // Extract playlist title
          const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(' - YouTube', '').trim();
          }
          const authorMatch = xmlText.match(/<author>\s*<name>([^<]+)<\/name>/);
          if (authorMatch && authorMatch[1]) {
            channelName = authorMatch[1].trim();
          }

          // Regex parse entry tags in RSS
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
          let entryMatch;
          while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
            const entryXml = entryMatch[1];
            const idMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
            const vTitleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
            const vAuthorMatch = entryXml.match(/<author>\s*<name>([^<]+)<\/name>/);

            if (idMatch && idMatch[1] && vTitleMatch && vTitleMatch[1]) {
              const vId = idMatch[1].trim();
              const vTitle = vTitleMatch[1].trim();
              const vAuthor = vAuthorMatch ? vAuthorMatch[1].trim() : channelName;
              videos.push({
                youtubeId: vId,
                title: vTitle,
                channelName: vAuthor,
                thumbnailUrl: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                duration: 0,
              });
            }
          }

          if (videos.length > 0) {
            fetchSource = 'youtube_rss_xml';
            thumbnailUrl = videos[0].thumbnailUrl;
          }
        }
      } catch (err) {
        console.warn('Server-side RSS fetch failed, checking secondary mirror:', err);
      }
    }

    // Strategy 3: Piped mirror fallback
    if (videos.length === 0) {
      const pipedInstances = [
        `https://pipedapi.kavin.rocks/playlists/${cleanPlId}`,
        `https://api.piped.video/playlists/${cleanPlId}`,
      ];

      for (const instanceUrl of pipedInstances) {
        try {
          const pRes = await fetch(instanceUrl);
          if (pRes.ok) {
            const pData = await pRes.json();
            title = pData.title || title;
            channelName = pData.uploader || channelName;
            if (pData.relatedStreams && Array.isArray(pData.relatedStreams)) {
              videos = pData.relatedStreams.map((v: any) => {
                const vidId = (v.url || '').replace('/watch?v=', '');
                return {
                  youtubeId: vidId,
                  title: v.title || 'Untitled Lesson',
                  channelName: v.uploaderName || channelName,
                  thumbnailUrl: v.thumbnail || `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
                  duration: v.duration || 0,
                };
              });
              fetchSource = 'piped_api';
              thumbnailUrl = videos[0]?.thumbnailUrl || thumbnailUrl;
              break;
            }
          }
        } catch (e) {
          // try next mirror
        }
      }
    }

    return res.json({
      success: true,
      source: fetchSource,
      playlistId: cleanPlId,
      title,
      channelName,
      thumbnailUrl,
      videoCount: videos.length,
      videos,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch playlist metadata',
    });
  }
});

// Start Express server and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LearnVerse Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
