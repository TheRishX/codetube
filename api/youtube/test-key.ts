export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { apiKey, playlistId } = body;

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
      return res.status(200).json({
        valid: true,
        message: 'YouTube Data API Key is valid and active!',
        playlistTitle: item.snippet?.title || 'Untitled Playlist',
        channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
        itemCount: item.contentDetails?.itemCount || 0,
      });
    } else {
      return res.status(200).json({
        valid: true,
        message: 'Key is valid, but the requested test playlist ID was not found.',
      });
    }
  } catch (error: any) {
    return res.status(500).json({ valid: false, message: error?.message || 'Server error testing key' });
  }
}
