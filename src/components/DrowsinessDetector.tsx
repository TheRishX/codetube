import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, EyeOff, AlertTriangle, Bell, Volume2, ShieldCheck, Camera, Power, RefreshCw, X, Play } from 'lucide-react';

interface DrowsinessDetectorProps {
  onAlertTriggered?: () => void;
  isCompact?: boolean;
}

export const DrowsinessDetector: React.FC<DrowsinessDetectorProps> = ({ onAlertTriggered, isCompact = false }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [alertThresholdSec, setAlertThresholdSec] = useState<number>(60); // Default 60 seconds (1 minute)
  const [closedSecCounter, setClosedSecCounter] = useState<number>(0);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const [totalAlertsCount, setTotalAlertsCount] = useState<number>(0);
  const [eyeState, setEyeState] = useState<'open' | 'closed' | 'no-face'>('open');
  const [eyeOpenPercentage, setEyeOpenPercentage] = useState<number>(95);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOsc1Ref = useRef<OscillatorNode | null>(null);
  const sirenOsc2Ref = useRef<OscillatorNode | null>(null);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLuminanceRef = useRef<number[]>([]);

  // Web Audio Siren Generator for Maximum Volume Alarm
  const startLoudAlarmSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop previous oscillators if any
      if (sirenOsc1Ref.current) {
        try { sirenOsc1Ref.current.stop(); } catch {}
      }
      if (sirenOsc2Ref.current) {
        try { sirenOsc2Ref.current.stop(); } catch {}
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0; // Maximum volume
      gainNode.connect(ctx.destination);

      // Create dual modulating siren oscillators
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Alternating Siren Pitch (880Hz <-> 1760Hz)
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1320, now);

      for (let i = 0; i < 60; i += 0.3) {
        osc1.frequency.setValueAtTime(1760, now + i);
        osc1.frequency.setValueAtTime(880, now + i + 0.15);
        osc2.frequency.setValueAtTime(1320, now + i);
        osc2.frequency.setValueAtTime(2200, now + i + 0.15);
      }

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start();
      osc2.start();

      sirenOsc1Ref.current = osc1;
      sirenOsc2Ref.current = osc2;
    } catch (e) {
      console.error('Failed to trigger audio alarm:', e);
    }
  }, []);

  const stopAlarmSound = useCallback(() => {
    if (sirenOsc1Ref.current) {
      try { sirenOsc1Ref.current.stop(); } catch {}
      sirenOsc1Ref.current = null;
    }
    if (sirenOsc2Ref.current) {
      try { sirenOsc2Ref.current.stop(); } catch {}
      sirenOsc2Ref.current = null;
    }
    setIsAlerting(false);
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    setIsActive(false);
    setClosedSecCounter(0);
    setEyeState('open');
  }, []);

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
      setIsActive(true);
    } catch (err) {
      console.error('Camera access denied or unequipped:', err);
      setHasCameraPermission(false);
    }
  };

  // Frame processing loop to detect eye closure / drowsiness
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== 4) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, 160, 120);

      // Analyze upper face / eye region luminosity & variance
      const frameData = ctx.getImageData(30, 25, 100, 45); // Approximate eye/upper face region
      const pixels = frameData.data;

      let totalBrightness = 0;
      let totalVariance = 0;
      const count = pixels.length / 4;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const avg = (r + g + b) / 3;
        totalBrightness += avg;
      }

      const meanBrightness = totalBrightness / count;

      for (let i = 0; i < pixels.length; i += 4) {
        const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        totalVariance += Math.pow(avg - meanBrightness, 2);
      }

      const stdDev = Math.sqrt(totalVariance / count);

      // Keep recent luminance history
      lastLuminanceRef.current.push(stdDev);
      if (lastLuminanceRef.current.length > 10) {
        lastLuminanceRef.current.shift();
      }

      // Determine eye state based on contrast/stdDev variation (closed eyes drop high-frequency edge contrast in eye area)
      const avgRecentDev = lastLuminanceRef.current.reduce((a, b) => a + b, 0) / (lastLuminanceRef.current.length || 1);

      // If contrast is very low or dark or static, eyes are estimated to be closed / head down
      const isClosed = stdDev < 14 || meanBrightness < 20;

      if (isClosed) {
        setEyeState('closed');
        setEyeOpenPercentage((prev) => Math.max(10, prev - 15));
        setClosedSecCounter((prev) => {
          const next = prev + 1;
          if (next >= alertThresholdSec && !isAlerting) {
            setIsAlerting(true);
            setTotalAlertsCount((c) => c + 1);
            startLoudAlarmSound();
            if (onAlertTriggered) onAlertTriggered();
          }
          return next;
        });
      } else {
        setEyeState('open');
        setEyeOpenPercentage((prev) => Math.min(100, prev + 20));
        setClosedSecCounter((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, alertThresholdSec, isAlerting, startLoudAlarmSound, onAlertTriggered]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAlarmSound();
    };
  }, [stopCamera, stopAlarmSound]);

  const handleManualTestAlert = () => {
    setIsAlerting(true);
    setTotalAlertsCount((c) => c + 1);
    startLoudAlarmSound();
    if (onAlertTriggered) onAlertTriggered();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-md transition-all">
      {/* Hidden processing video & canvas */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-2xl ${isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              Sleep & Drowsiness AI Guard
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Webcam monitors closed eyes & plays loud alarm if sleeping
            </p>
          </div>
        </div>

        <button
          onClick={isActive ? stopCamera : startCamera}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
            isActive
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isActive ? 'Turn Off Guard' : 'Enable AI Camera'}</span>
        </button>
      </div>

      {hasCameraPermission === false && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Camera permission is required for webcam drowsiness monitoring. Please grant camera access in browser settings.</span>
        </div>
      )}

      {/* Main Monitoring Panel */}
      {isActive ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Live Camera View Feed */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
              <video
                ref={(el) => {
                  if (el && streamRef.current) el.srcObject = streamRef.current;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                <Camera className="w-3 h-3 text-emerald-400" /> Live AI Vision
              </div>
            </div>

            {/* Live Status Indicators */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Eye State Monitor
                </span>
                <div className="flex items-center gap-2">
                  {eyeState === 'closed' ? (
                    <EyeOff className="w-5 h-5 text-rose-500 animate-pulse" />
                  ) : (
                    <Eye className="w-5 h-5 text-emerald-500" />
                  )}
                  <span className={`text-sm font-black ${eyeState === 'closed' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {eyeState === 'closed' ? 'Eyes Closed / Resting' : 'Eyes Open & Focused'}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  <span>Focus Level</span>
                  <span>{eyeOpenPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      eyeOpenPercentage < 40 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${eyeOpenPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sleep Timer Counter */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Sleep Duration Trigger
                </span>
                <div className="text-xl font-extrabold text-gray-900 dark:text-white flex items-baseline gap-1">
                  <span>{closedSecCounter}s</span>
                  <span className="text-xs font-normal text-gray-400">/ {alertThresholdSec}s limit</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Drowsiness Alerts Today:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{totalAlertsCount}</span>
              </div>
            </div>
          </div>

          {/* Settings & Testing Controls */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold">Alarm Threshold:</span>
              <select
                value={alertThresholdSec}
                onChange={(e) => setAlertThresholdSec(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-900 dark:text-white outline-hidden"
              >
                <option value={5}>5 seconds (Quick Live Test)</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds (1 Minute)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualTestAlert}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Alarm Sound</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Stay Awake & Alert During Long Video Lectures
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Turn on the camera guard to automatically trigger a loud audio siren if your eyes remain closed for over 1 minute.
              </p>
            </div>
          </div>

          <button
            onClick={startCamera}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 shrink-0 transition-all"
          >
            Enable Camera Guard
          </button>
        </div>
      )}

      {/* Full Screen Alarm Overlay when triggered */}
      {isAlerting && (
        <div className="fixed inset-0 z-50 bg-red-600/90 backdrop-blur-md flex items-center justify-center p-6 animate-pulse">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-yellow-400 animate-bounce space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/30">
              <Bell className="w-10 h-10 animate-spin" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
                WAKE UP! SLEEP DETECTED!
              </h2>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
                Your eyes were detected closed for over {alertThresholdSec} seconds!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Loud alarm playing at full volume to wake you up for your study session.
              </p>
            </div>

            <button
              onClick={stopAlarmSound}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base shadow-xl shadow-red-600/40 uppercase tracking-wider transition-all transform hover:scale-105"
            >
              STOP ALARM - I AM AWAKE & STUDYING
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
