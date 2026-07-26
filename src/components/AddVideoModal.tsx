import React, { useState, useEffect } from 'react';
import { Youtube, Check, AlertCircle, Loader2, Tag, Layers, BarChart, Sparkles, X, ListVideo, Video } from 'lucide-react';
import { useGlobalPaste } from '../context/GlobalPasteContext';
import { CATEGORIES, Difficulty, VideoItem, Playlist } from '../types';
import {
  fetchYouTubeMetadata,
  getYouTubeThumbnail,
  detectCategoryFromTitleAndChannel,
  generateAutoTags,
  YouTubePlaylistMetadata,
} from '../lib/youtube';
import {
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
  fetchPlaylistMetadata,
} from '../services/playlistFetcher';
import { saveVideoToFirestore, savePlaylistToFirestore } from '../lib/firebase';

interface AddVideoModalProps {
  existingVideos?: VideoItem[];
  onVideoAdded?: (video: VideoItem) => void;
  onSelectVideo?: (video: VideoItem) => void;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({ existingVideos = [], onVideoAdded, onSelectVideo }) => {
  const { isModalOpen, pastedUrl, closeAddVideoModal: closeModal } = useGlobalPaste();

  const [urlInput, setUrlInput] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [extractedPlaylistId, setExtractedPlaylistId] = useState<string | null>(null);
  const [playlistMeta, setPlaylistMeta] = useState<YouTubePlaylistMetadata | null>(null);

  // Import mode selector: 'playlist' | 'single'
  const [importMode, setImportMode] = useState<'playlist' | 'single'>('playlist');

  const [title, setTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // YouTube API Key Config
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('youtube_api_key') || '') : '');
  const [savedApiKey, setSavedApiKey] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('youtube_api_key') || '') : '');
  const [apiKeyMsg, setApiKeyMsg] = useState<string | null>(null);

  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateVideo, setDuplicateVideo] = useState<VideoItem | null>(null);
  const [successVideo, setSuccessVideo] = useState<VideoItem | null>(null);
  const [successPlaylist, setSuccessPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (pastedUrl) {
      setUrlInput(pastedUrl);
      handleProcessUrl(pastedUrl);
    }
  }, [pastedUrl]);

  const handleProcessUrl = async (url: string) => {
    setErrorMsg(null);
    setSuccessVideo(null);
    setSuccessPlaylist(null);
    setDuplicateVideo(null);
    setPlaylistMeta(null);

    const plId = extractYouTubePlaylistId(url);
    const vidId = extractYouTubeVideoId(url);

    setExtractedPlaylistId(plId);
    setExtractedId(vidId);

    if (plId) {
      // Default to playlist mode when playlist ID exists
      setImportMode('playlist');
      setIsFetchingMeta(true);
      try {
        const meta = await fetchPlaylistMetadata(plId);
        setPlaylistMeta(meta);
        setTitle(meta.title);
        setChannelName(meta.channelName);
        const autoCat = detectCategoryFromTitleAndChannel(meta.title, meta.channelName);
        setCategory(autoCat);
        const autoTags = generateAutoTags(meta.title, meta.channelName, autoCat);
        setTags(autoTags);
      } catch (err) {
        setTitle(`YouTube Playlist (${plId})`);
        setChannelName('YouTube Channel');
      } finally {
        setIsFetchingMeta(false);
      }
    } else if (vidId) {
      setImportMode('single');
      // Check for duplicate in existing library
      const existing = existingVideos.find((v) => v.youtubeId === vidId);
      if (existing) {
        setDuplicateVideo(existing);
      }

      setIsFetchingMeta(true);
      try {
        const meta = await fetchYouTubeMetadata(vidId);
        setTitle(meta.title);
        setChannelName(meta.authorName);
        const autoCat = detectCategoryFromTitleAndChannel(meta.title, meta.authorName);
        setCategory(autoCat);
        const autoTags = generateAutoTags(meta.title, meta.authorName, autoCat);
        setTags(autoTags);
      } catch (err) {
        setTitle(`YouTube Video (${vidId})`);
        setChannelName('Unknown Channel');
      } finally {
        setIsFetchingMeta(false);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    handleProcessUrl(val);
  };

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

    if (!extractedId && !extractedPlaylistId) {
      setErrorMsg('Please enter a valid YouTube Video or Playlist URL.');
      return;
    }

    if (importMode === 'single' && duplicateVideo) {
      setErrorMsg(`This video is already in your library as "${duplicateVideo.title}".`);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (importMode === 'playlist' && extractedPlaylistId && playlistMeta) {
        // Save Playlist with Auto-Generated Tags for each video and the playlist
        const plAutoTags = tags.length > 0
          ? tags
          : generateAutoTags(title.trim() || playlistMeta.title, channelName.trim() || playlistMeta.channelName, category);

        const playlistVideos: VideoItem[] = playlistMeta.videos.map((v, idx) => {
          const vAutoTags = generateAutoTags(v.title, v.channelName || channelName || playlistMeta.channelName, category);
          const combinedTags = Array.from(new Set([...plAutoTags, ...vAutoTags, category, 'Playlist']));

          return {
            id: `pvid-${extractedPlaylistId}-${idx}-${Date.now().toString().slice(-4)}`,
            youtubeId: v.youtubeId,
            youtubeUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
            title: v.title,
            thumbnail: v.thumbnailUrl,
            channelName: v.channelName || channelName || playlistMeta.channelName,
            duration: v.duration || 0,
            category,
            difficulty,
            tags: combinedTags,
            status: 'not-started',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        const newPlaylist: Playlist = {
          id: `pl-${extractedPlaylistId}-${Date.now().toString().slice(-4)}`,
          playlistId: extractedPlaylistId,
          title: title.trim() || playlistMeta.title,
          description: `Imported YouTube playlist with ${playlistVideos.length} videos.`,
          thumbnail: playlistMeta.thumbnailUrl,
          channelName: channelName.trim() || playlistMeta.channelName,
          category,
          difficulty,
          totalVideos: playlistVideos.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          videos: playlistVideos,
          tags: plAutoTags,
        } as Playlist;

        await savePlaylistToFirestore(newPlaylist);
        setSuccessPlaylist(newPlaylist);
      } else {
        // Save Single Video
        const targetVidId = extractedId || (playlistMeta?.videos?.[0]?.youtubeId) || 'PkZNo7MFNFg';
        const targetThumb = extractedId ? getYouTubeThumbnail(extractedId) : (playlistMeta?.videos?.[0]?.thumbnailUrl || getYouTubeThumbnail(targetVidId));
        const videoId = `vid-${targetVidId}-${Date.now().toString().slice(-4)}`;
        const finalTitle = title.trim() || `YouTube Video (${targetVidId})`;
        const finalChannel = channelName.trim() || 'Unknown Channel';

        const finalTags = tags.length > 0
          ? tags
          : generateAutoTags(finalTitle, finalChannel, category);

        const newVideo = await saveVideoToFirestore({
          id: videoId,
          youtubeId: targetVidId,
          youtubeUrl: `https://www.youtube.com/watch?v=${targetVidId}`,
          title: finalTitle,
          thumbnail: targetThumb,
          channelName: finalChannel,
          duration: playlistMeta?.videos?.[0]?.duration || 0,
          category,
          difficulty,
          tags: finalTags,
          status: 'not-started',
        });

        setSuccessVideo(newVideo);
        if (onVideoAdded) onVideoAdded(newVideo);
      }
    } catch (err: any) {
      console.error('Failed to save to Firestore:', err);
      setErrorMsg('Could not save to Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setUrlInput('');
    setExtractedId(null);
    setExtractedPlaylistId(null);
    setPlaylistMeta(null);
    setImportMode('playlist');
    setTitle('');
    setChannelName('');
    setCategory(CATEGORIES[0].name);
    setDifficulty('Beginner');
    setTags([]);
    setTagInput('');
    setErrorMsg(null);
    setDuplicateVideo(null);
    setSuccessVideo(null);
    setSuccessPlaylist(null);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 relative my-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              {extractedPlaylistId && importMode === 'playlist' ? <ListVideo className="w-6 h-6" /> : <Youtube className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {extractedPlaylistId && importMode === 'playlist' ? 'Import YouTube Playlist' : 'Save YouTube Content'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste any YouTube video or playlist link (Cmd + V anywhere)
              </p>
            </div>
          </div>
        </div>

        {successPlaylist ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Playlist Imported Successfully!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                "{successPlaylist.title}" with {successPlaylist.totalVideos} videos saved to your library.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Import Another
              </button>
              <a
                href="#playlists"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20"
              >
                View Playlists
              </a>
            </div>
          </div>
        ) : successVideo ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Video Saved to LearnVerse!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                "{successVideo.title}" has been saved in {successVideo.category}.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Add Another Video
              </button>
              <a
                href={`#watch-${successVideo.id}`}
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20"
              >
                Watch Now & Start Learning
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* YouTube Link Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                YouTube Video or Playlist Link *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=... or video link"
                  value={urlInput}
                  onChange={handleUrlChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition-all pr-10"
                  required
                />
                {isFetchingMeta && (
                  <div className="absolute right-3 top-3.5 text-indigo-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* 2 OPTIONS SELECTOR WHEN A PLAYLIST IS DETECTED */}
            {extractedPlaylistId && (
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Playlist Link Detected
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Choose Option:</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('playlist')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importMode === 'playlist'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <ListVideo className="w-5 h-5" />
                      {importMode === 'playlist' && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Option 1: Add Playlist</div>
                      <div className={`text-[10px] mt-0.5 ${importMode === 'playlist' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        Import full course ({playlistMeta?.videos?.length || 0} vids)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('single')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importMode === 'single'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Video className="w-5 h-5" />
                      {importMode === 'single' && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Option 2: Single Video</div>
                      <div className={`text-[10px] mt-0.5 ${importMode === 'single' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        Import only this specific video
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Playlist Preview */}
            {extractedPlaylistId && importMode === 'playlist' && (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex gap-4 items-center">
                <img
                  src={playlistMeta?.thumbnailUrl || 'https://img.youtube.com/vi/PkZNo7MFNFg/hqdefault.jpg'}
                  alt="Playlist Thumbnail"
                  className="w-28 aspect-video rounded-lg object-cover bg-gray-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                    <ListVideo className="w-3.5 h-3.5" />
                    YouTube Playlist ({playlistMeta?.videos?.length || 0} Videos)
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                    {title || 'Loading playlist title...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {channelName || 'Loading channel...'}
                  </p>
                </div>
              </div>
            )}

            {/* Single Video Preview */}
            {(importMode === 'single' || (!extractedPlaylistId && extractedId)) && (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex gap-4 items-center">
                <img
                  src={extractedId ? getYouTubeThumbnail(extractedId) : (playlistMeta?.thumbnailUrl || getYouTubeThumbnail('PkZNo7MFNFg'))}
                  alt="Thumbnail"
                  className="w-28 aspect-video rounded-lg object-cover bg-gray-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Single YouTube Video
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {title || 'Loading title...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {channelName || 'Loading channel...'}
                  </p>
                </div>
              </div>
            )}

            {/* Title & Channel Override */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {extractedPlaylistId && importMode === 'playlist' ? 'Playlist Title' : 'Video Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                  placeholder="Channel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Duplicate Video Banner */}
            {duplicateVideo && importMode === 'single' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Video Already Saved in Library!
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    "{duplicateVideo.title}"
                  </p>
                </div>
                {onSelectVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVideo(duplicateVideo);
                      handleClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors shadow-xs"
                  >
                    Open Video
                  </button>
                )}
              </div>
            )}

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category
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
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Add Tags
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

            {/* Tag List Badges */}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (!extractedId && !extractedPlaylistId)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : extractedPlaylistId && importMode === 'playlist' ? (
                  'Import Playlist'
                ) : (
                  'Save Video'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
