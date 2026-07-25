import React, { useState, useEffect } from 'react';
import { Edit3, Check, AlertCircle, Loader2, Tag, Layers, X, Trash2 } from 'lucide-react';
import { CATEGORIES, Difficulty, VideoItem, VideoStatus } from '../types';
import { parseDurationToSeconds, formatDuration } from '../lib/youtube';
import { updateVideoInFirestore, deleteVideoFromFirestore } from '../lib/firebase';

interface EditVideoModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoUpdated: (updatedVideo: VideoItem) => void;
  onVideoDeleted: (videoId: string) => void;
}

export const EditVideoModal: React.FC<EditVideoModalProps> = ({
  video,
  isOpen,
  onClose,
  onVideoUpdated,
  onVideoDeleted,
}) => {
  const [title, setTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [status, setStatus] = useState<VideoStatus>('not-started');
  const [durationInput, setDurationInput] = useState('30m');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setChannelName(video.channelName);
      setCategory(video.category);
      setDifficulty(video.difficulty);
      setStatus(video.status);
      setDurationInput(formatDuration(video.duration));
      setTags(video.tags || []);
      setErrorMsg(null);
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const parsedDuration = parseDurationToSeconds(durationInput) || video.duration;
      const updates: Partial<VideoItem> = {
        title: title.trim(),
        channelName: channelName.trim() || 'Unknown Channel',
        category,
        difficulty,
        status,
        duration: parsedDuration,
        tags,
      };

      await updateVideoInFirestore(video.id, updates);
      onVideoUpdated({
        ...video,
        ...updates,
        updatedAt: Date.now(),
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to update video in Firestore:', err);
      setErrorMsg('Could not update video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${video.title}" from CodeTube?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteVideoFromFirestore(video.id);
      onVideoDeleted(video.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete video:', err);
      setErrorMsg('Could not delete video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative my-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Video Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update title, topic category, difficulty level, or tags
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Thumbnail preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex gap-4 items-center">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-28 aspect-video rounded-lg object-cover bg-gray-900 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                YouTube ID: {video.youtubeId}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {video.youtubeUrl}
              </p>
            </div>
          </div>

          {/* Title & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Video Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Topic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VideoStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Duration & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Duration (e.g. 45m or 1h 30m)
              </label>
              <input
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Add Tag
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. Hooks, Async"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tag Badges */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Video'}</span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
