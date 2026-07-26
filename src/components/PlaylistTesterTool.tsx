import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, AlertTriangle, RefreshCw, ListVideo, Key, Sparkles, Film, Clock, ExternalLink } from 'lucide-react';
import { extractYouTubePlaylistId, extractYouTubeVideoId, fetchPlaylistMetadata, testYouTubeApiKey, getStoredApiKey } from '../services/playlistFetcher';
import { YouTubePlaylistMetadata } from '../lib/youtube';

interface PlaylistTesterToolProps {
  onImportPlaylist?: (meta: YouTubePlaylistMetadata) => void;
}

export const PlaylistTesterTool: React.FC<PlaylistTesterToolProps> = ({ onImportPlaylist }) => {
  const DEFAULT_SAMPLE_URL = 'https://www.youtube.com/watch?v=dY-OpnLZRd0&list=PLbtI3_MArDOmSKABu09sEs0SxCibd1wgr&index=1&t=3s&pp=iAQB';
  const [testUrl, setTestUrl] = useState(DEFAULT_SAMPLE_URL);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    extractedPlId: string | null;
    extractedVidId: string | null;
    metadata: YouTubePlaylistMetadata | null;
    source?: string;
    durationMs?: number;
    error?: string;
  } | null>(null);

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    const plId = extractYouTubePlaylistId(testUrl);
    const vidId = extractYouTubeVideoId(testUrl);

    if (!plId) {
      setTestResult({
        extractedPlId: null,
        extractedVidId: vidId,
        metadata: null,
        error: 'No valid YouTube playlist ID found in the provided URL.',
        durationMs: Date.now() - startTime,
      });
      setIsTesting(false);
      return;
    }

    try {
      const meta = await fetchPlaylistMetadata(plId);
      const elapsed = Date.now() - startTime;
      
      setTestResult({
        extractedPlId: plId,
        extractedVidId: vidId,
        metadata: meta,
        durationMs: elapsed,
      });
    } catch (err: any) {
      setTestResult({
        extractedPlId: plId,
        extractedVidId: vidId,
        metadata: null,
        error: err?.message || 'Failed to fetch playlist metadata.',
        durationMs: Date.now() - startTime,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Playlist Fetch Diagnostic & Mini Checker Tool
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Test and verify YouTube playlist extraction, API connection, and video parsing in real-time.
          </p>
        </div>

        <button
          onClick={() => setTestUrl(DEFAULT_SAMPLE_URL)}
          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Load Sample URL</span>
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          YouTube Playlist or Video URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=...&list=PL..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
          <button
            onClick={handleRunDiagnostic}
            disabled={isTesting || !testUrl.trim()}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Run Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagnostic Results Card */}
      {testResult && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                {testResult.metadata ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Diagnostic Passed
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Fetch Failed
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono">({testResult.durationMs}ms)</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span>PL ID: <strong className="text-indigo-600 dark:text-indigo-400">{testResult.extractedPlId || 'None'}</strong></span>
                <span>•</span>
                <span>VID ID: <strong className="text-emerald-600 dark:text-emerald-400">{testResult.extractedVidId || 'None'}</strong></span>
              </div>
            </div>

            {testResult.error ? (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{testResult.error}</p>
            ) : testResult.metadata ? (
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <img
                    src={testResult.metadata.thumbnailUrl || `https://img.youtube.com/vi/${testResult.metadata.videos[0]?.youtubeId}/hqdefault.jpg`}
                    alt="Thumbnail"
                    className="w-28 aspect-video rounded-xl object-cover bg-gray-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {testResult.metadata.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Channel: <strong className="text-gray-700 dark:text-gray-300">{testResult.metadata.channelName}</strong>
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                        {testResult.metadata.videos.length} Videos Fetched
                      </span>
                      {getStoredApiKey() && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                          <Key className="w-3 h-3" /> API Key Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Videos Preview Scroll */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-indigo-500" /> Parsed Playlist Videos ({testResult.metadata.videos.length})
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                    {testResult.metadata.videos.map((vid, i) => (
                      <div
                        key={`${vid.youtubeId}-${i}`}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center font-bold text-gray-400 shrink-0">{i + 1}</span>
                          <img
                            src={vid.thumbnailUrl}
                            alt=""
                            className="w-12 aspect-video rounded-md object-cover bg-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{vid.title}</p>
                            <p className="text-[11px] text-gray-400 truncate">{vid.channelName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-gray-500 font-mono">
                          {vid.duration ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {Math.floor(vid.duration / 60)}m {vid.duration % 60}s
                            </span>
                          ) : (
                            <span className="text-gray-400">Duration auto</span>
                          )}
                          <a
                            href={`https://www.youtube.com/watch?v=${vid.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-gray-400 hover:text-indigo-600"
                            title="Open on YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {onImportPlaylist && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => testResult.metadata && onImportPlaylist(testResult.metadata)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ListVideo className="w-4 h-4" />
                      <span>Import This Playlist to Library</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
