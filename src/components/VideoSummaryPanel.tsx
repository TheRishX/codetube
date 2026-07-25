import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Plus, FileText } from 'lucide-react';
import { VideoItem, VideoNote } from '../types';
import { generateVideoSummary } from '../lib/gemini';
import { saveNoteToFirestore } from '../lib/firebase';

interface VideoSummaryPanelProps {
  video: VideoItem;
  notes: VideoNote[];
  onNotesChanged?: () => void;
}

export const VideoSummaryPanel: React.FC<VideoSummaryPanelProps> = ({
  video,
  notes,
  onNotesChanged,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedToNotes, setIsSavedToNotes] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setIsCopied(false);
    setIsSavedToNotes(false);
    try {
      const res = await generateVideoSummary(video, notes);
      setSummary(res);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset summary when video changes, do NOT auto-call Gemini API
  useEffect(() => {
    setSummary(null);
  }, [video.id]);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToNotes = async () => {
    if (!summary) return;
    try {
      await saveNoteToFirestore({
        id: `note-summary-${Date.now()}`,
        videoId: video.id,
        content: `[AI Summary]\n${summary.replace(/[#*]/g, '')}`,
        timestamp: 0,
      });
      setIsSavedToNotes(true);
      if (onNotesChanged) onNotesChanged();
      setTimeout(() => setIsSavedToNotes(false), 2500);
    } catch (err) {
      console.error('Failed to save summary to notes:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
              AI Video Summary
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Concise study insights & key takeaways
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Regenerate summary"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Summary Content */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
          <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Generating AI summary for "{video.title}"...
          </p>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 text-xs leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line max-h-80 overflow-y-auto">
            {summary}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleSaveToNotes}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isSavedToNotes ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isSavedToNotes ? 'Saved to Notes!' : 'Save to Notes'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <button
            onClick={handleGenerateSummary}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Video Summary</span>
          </button>
        </div>
      )}
    </div>
  );
};
