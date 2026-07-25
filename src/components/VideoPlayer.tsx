import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, Focus } from 'lucide-react';
import { VideoItem, VideoProgress } from '../types';
import { updateVideoInFirestore } from '../lib/firebase';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Global script loader for YouTube Iframe API
let ytApiPromise: Promise<any> | null = null;
const loadYouTubeIframeApi = (): Promise<any> => {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      resolve(window.YT);
    };

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve(window.YT);
      }
    }, 100);
  });

  return ytApiPromise;
};

interface VideoPlayerProps {
  video: VideoItem;
  initialProgress?: VideoProgress;
  onProgressUpdate: (watchedSeconds: number, totalDuration: number, pauseCount?: number) => void;
  onMarkCompleted: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onGetCurrentTime?: (timeGetter: () => number) => void;
  onSeekToReady?: (seekFn: (seconds: number) => void) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  initialProgress,
  onProgressUpdate,
  onMarkCompleted,
  isFocusMode,
  onToggleFocusMode,
  onGetCurrentTime,
  onSeekToReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const startSeconds = initialProgress?.watchedSeconds || 0;

  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pauseCount, setPauseCount] = useState<number>(initialProgress?.pausesCount || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [realDuration, setRealDuration] = useState<number>(video.duration || 0);

  // Keep latest callbacks in refs to avoid stale closures inside YT event handlers
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;

  const onMarkCompletedRef = useRef(onMarkCompleted);
  onMarkCompletedRef.current = onMarkCompleted;

  const pauseCountRef = useRef(pauseCount);
  pauseCountRef.current = pauseCount;

  // Initialize YouTube YT.Player instance
  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    const elementId = `yt-player-${video.id}`;

    loadYouTubeIframeApi().then((YT) => {
      if (!isMounted || !containerRef.current) return;

      // Clean up container
      containerRef.current.innerHTML = `<div id="${elementId}" class="w-full h-full"></div>`;

      playerRef.current = new YT.Player(elementId, {
        height: '100%',
        width: '100%',
        videoId: video.youtubeId,
        playerVars: {
          autoplay: 1,
          start: Math.floor(startSeconds),
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            const player = event.target;

            // Fetch ground truth duration directly from YouTube Player
            const dur = player.getDuration();
            if (dur && dur > 0) {
              setRealDuration(dur);
              if (dur !== video.duration) {
                updateVideoInFirestore(video.id, { duration: Math.round(dur) }).catch(() => {});
              }
            }

            // Seek to exact last watched timestamp if present
            if (startSeconds > 0) {
              player.seekTo(startSeconds, true);
            }
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            const player = event.target;
            const state = event.data;

            // 1 = PLAYING
            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const cur = player.getCurrentTime() || 0;
              const dur = player.getDuration() || video.duration || 0;
              setCurrentTime(cur);
              if (dur > 0) setRealDuration(dur);
              onProgressUpdateRef.current(cur, dur > 0 ? dur : video.duration);
            }
            // 2 = PAUSED
            else if (state === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              const cur = player.getCurrentTime() || 0;
              const dur = player.getDuration() || video.duration || 0;
              setCurrentTime(cur);
              const nextPauseCount = pauseCountRef.current + 1;
              setPauseCount(nextPauseCount);
              onProgressUpdateRef.current(cur, dur > 0 ? dur : video.duration, nextPauseCount);
            }
            // 0 = ENDED
            else if (state === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              const dur = player.getDuration() || video.duration || 0;
              setCurrentTime(dur);
              onProgressUpdateRef.current(dur, dur);
              onMarkCompletedRef.current();
            }
          },
        },
      });

      // Polling loop to continuously get exact ground-truth time directly from YouTube player
      pollInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const state = playerRef.current.getPlayerState();
            const playing = state === 1; // YT.PlayerState.PLAYING
            setIsPlaying(playing);

            const cur = playerRef.current.getCurrentTime();
            const dur = playerRef.current.getDuration();

            if (typeof cur === 'number' && !isNaN(cur)) {
              setCurrentTime(cur);
            }
            if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
              setRealDuration(dur);
            }

            // Periodically auto-sync progress while video is actively playing
            if (playing && typeof cur === 'number' && !isNaN(cur)) {
              onProgressUpdateRef.current(cur, dur > 0 ? dur : video.duration);
            }
          } catch {
            // Player initializing or detached
          }
        }
      }, 500);
    });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);

      // On component unmount, capture final exact ground-truth timestamp from YouTube player
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === 'number' && cur >= 0) {
            onProgressUpdateRef.current(cur, dur > 0 ? dur : video.duration);
          }
          playerRef.current.destroy();
        } catch {
          // ignore destroy errors
        }
      }
    };
  }, [video.id, video.youtubeId]);

  const effectiveDuration = realDuration > 0 ? realDuration : (video.duration || 0);

  // Expose seek function to parent (Notes, Bookmarks, AI Chat)
  const handleSeek = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
      }
      onProgressUpdateRef.current(seconds, effectiveDuration);
    },
    [effectiveDuration]
  );

  useEffect(() => {
    if (onSeekToReady) {
      onSeekToReady(handleSeek);
    }
  }, [onSeekToReady, handleSeek]);

  // Expose currentTime getter to parent
  useEffect(() => {
    if (onGetCurrentTime) {
      onGetCurrentTime(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            return playerRef.current.getCurrentTime() || currentTime;
          } catch {
            return currentTime;
          }
        }
        return currentTime;
      });
    }
  }, [currentTime, onGetCurrentTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (!playerRef.current) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        try {
          const state = playerRef.current.getPlayerState();
          if (state === 1) {
            playerRef.current.pauseVideo();
          } else {
            playerRef.current.playVideo();
          }
        } catch {
          // ignore
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        try {
          const cur = playerRef.current.getCurrentTime() || currentTime;
          handleSeek(Math.max(0, cur - 5));
        } catch {
          // ignore
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        try {
          const cur = playerRef.current.getCurrentTime() || currentTime;
          handleSeek(Math.min(effectiveDuration, cur + 5));
        } catch {
          // ignore
        }
      } else if (e.key === 'f') {
        e.preventDefault();
        onToggleFocusMode();
      } else if (e.key === 'm') {
        e.preventDefault();
        try {
          if (playerRef.current.isMuted()) {
            playerRef.current.unMute();
          } else {
            playerRef.current.mute();
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, effectiveDuration, onToggleFocusMode, handleSeek]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(speed);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Container Target for YouTube YT.Player */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800"
      />

      {/* Control & Live YouTube Status Bar */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Real-time YouTube Player Status indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isPlaying
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 animate-pulse'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span>{isPlaying ? 'Video Playing (Timer Active)' : 'Video Paused'}</span>
          </div>

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
            <span className="font-bold text-gray-800 dark:text-gray-200">{pauseCount}</span>{' '}
            {pauseCount === 1 ? 'pause' : 'pauses'} logged
          </div>
        </div>

        {/* Speed, Focus & Mark Completed Controls */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300">
            {[1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={onToggleFocusMode}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isFocusMode
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Toggle Focus Mode (Press F)"
          >
            <Focus className="w-4 h-4" />
            <span className="hidden sm:inline">{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>

          {/* Mark as Completed */}
          <button
            onClick={onMarkCompleted}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Completed</span>
          </button>
        </div>
      </div>
    </div>
  );
};

