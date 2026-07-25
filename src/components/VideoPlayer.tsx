import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, RotateCcw, Maximize2, Volume2, VolumeX, FastForward, Focus } from 'lucide-react';
import { VideoItem, VideoProgress } from '../types';
import { formatDuration } from '../lib/youtube';
import { updateVideoInFirestore } from '../lib/firebase';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startSeconds = initialProgress?.watchedSeconds || 0;

  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pauseCount, setPauseCount] = useState<number>(initialProgress?.pausesCount || 0);
  const prevIsPlayingRef = useRef<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [realDuration, setRealDuration] = useState<number>(video.duration || 0);

  // Setup iframe embed URL with YouTube Parameters for JS API control
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?enablejsapi=1&start=${Math.floor(startSeconds)}&autoplay=0&rel=0&modestbranding=1`;

  // Track state transitions for pause detection
  const handleStateUpdate = useCallback((playing: boolean) => {
    if (prevIsPlayingRef.current && !playing) {
      // Transition from playing -> paused
      setPauseCount((prev) => {
        const next = prev + 1;
        onProgressUpdate(currentTime, realDuration || video.duration || 1800, next);
        return next;
      });
    }
    prevIsPlayingRef.current = playing;
    setIsPlaying(playing);
  }, [currentTime, realDuration, video.duration, onProgressUpdate]);

  // Function to send postMessage commands to YouTube iframe API
  const sendIframeCommand = useCallback((command: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: command,
          args: args,
        }),
        '*'
      );
    }
  }, []);

  // Listen to YouTube Iframe postMessage events to sync play/pause & real duration
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;

      // Handle YouTube state change events (1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING)
      if (data.event === 'onStateChange') {
        const state = data.info;
        if (state === 1) handleStateUpdate(true);
        else if (state === 2 || state === 0) handleStateUpdate(false);
      }

      // Handle infoDelivery from YouTube player
      if (data.event === 'infoDelivery' && data.info) {
        if (typeof data.info.playerState === 'number') {
          const state = data.info.playerState;
          if (state === 1) handleStateUpdate(true);
          else if (state === 2 || state === 0) handleStateUpdate(false);
        }
        if (typeof data.info.currentTime === 'number' && data.info.currentTime > 0) {
          setCurrentTime(data.info.currentTime);
        }
        if (typeof data.info.duration === 'number' && data.info.duration > 0) {
          const dur = Math.round(data.info.duration);
          setRealDuration(dur);
          if (dur > 0 && dur !== video.duration) {
            updateVideoInFirestore(video.id, { duration: dur }).catch((err) =>
              console.error('Failed to update duration in Firestore:', err)
            );
            onProgressUpdate(currentTime, dur);
          }
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [video.duration, currentTime, onProgressUpdate]);

  // Request player listening status periodically
  useEffect(() => {
    const timer = setInterval(() => {
      sendIframeCommand('listening');
      sendIframeCommand('getDuration');
      sendIframeCommand('getCurrentTime');
    }, 2000);
    return () => clearInterval(timer);
  }, [sendIframeCommand]);

  const effectiveDuration = realDuration > 0 ? realDuration : (video.duration || 0);

  const handleSeek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    sendIframeCommand('seekTo', [seconds, true]);
    onProgressUpdate(seconds, effectiveDuration);
  }, [sendIframeCommand, onProgressUpdate, effectiveDuration]);

  useEffect(() => {
    if (onSeekToReady) {
      onSeekToReady(handleSeek);
    }
  }, [onSeekToReady, handleSeek]);

  // Expose currentTime getter
  useEffect(() => {
    if (onGetCurrentTime) {
      onGetCurrentTime(() => currentTime);
    }
  }, [currentTime, onGetCurrentTime]);

  // Keyboard accessibility controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        if (isPlaying) {
          sendIframeCommand('pauseVideo');
          setIsPlaying(false);
        } else {
          sendIframeCommand('playVideo');
          setIsPlaying(true);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(effectiveDuration, currentTime + 5));
      } else if (e.key === 'f') {
        e.preventDefault();
        onToggleFocusMode();
      } else if (e.key === 'm') {
        e.preventDefault();
        if (isMuted) {
          sendIframeCommand('unMute');
          setIsMuted(false);
        } else {
          sendIframeCommand('mute');
          setIsMuted(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, effectiveDuration, sendIframeCommand, onToggleFocusMode, isMuted, handleSeek]);

  // Periodic progress tracker while playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = Math.min(effectiveDuration > 0 ? effectiveDuration : prev + 1, prev + 1);
          onProgressUpdate(next, effectiveDuration);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, effectiveDuration, onProgressUpdate]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    sendIframeCommand('setPlaybackRate', [speed]);
  };

  return (
    <div className="space-y-4">
      {/* Video Iframe Frame */}
      <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 group">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Active Timer Status & Pauses indicator */}
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
            <span>{isPlaying ? 'Watch Timer Active (Video Playing)' : 'Timer Paused (Video Stopped)'}</span>
          </div>

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
            <span className="font-bold text-gray-800 dark:text-gray-200">{pauseCount}</span> {pauseCount === 1 ? 'pause' : 'pauses'} logged
          </div>
        </div>

        {/* Speed & Focus & Mark Completed Controls */}
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
