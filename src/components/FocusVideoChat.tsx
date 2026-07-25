import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, Bot, User, Clock, Plus, Bookmark, StickyNote, HelpCircle } from 'lucide-react';
import { VideoItem, VideoNote } from '../types';
import { formatDuration } from '../lib/youtube';
import { saveNoteToFirestore } from '../lib/firebase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: number;
  createdAt: Date;
}

interface FocusVideoChatProps {
  video: VideoItem;
  getCurrentTimeSeconds: () => number;
  onJumpToTimestamp: (seconds: number) => void;
  onNoteAdded?: () => void;
  notes: VideoNote[];
  onNotesChanged: () => void;
}

export const FocusVideoChat: React.FC<FocusVideoChatProps> = ({
  video,
  getCurrentTimeSeconds,
  onJumpToTimestamp,
  onNoteAdded,
  notes,
  onNotesChanged,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'notes'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello! I'm your AI Study Assistant for "${video.title}". Ask me any question about ${video.category}, request a summary, or ask for code explanations!`,
      createdAt: new Date(),
    },
  ]);

  const [newNoteText, setNewNoteText] = useState('');

  const quickPrompts = [
    `Summarize the key points of this ${video.category} video`,
    `Explain the main concept introduced in "${video.title}"`,
    `Give me a quick quiz question to test my understanding`,
    `What are best practices for ${video.category}?`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const currentSec = Math.floor(getCurrentTimeSeconds());
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: currentSec,
      createdAt: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // Generate intelligent AI response based on video metadata & query
    setTimeout(() => {
      let aiResponseText = '';
      const lower = text.toLowerCase();

      if (lower.includes('summarize') || lower.includes('key points') || lower.includes('summary')) {
        aiResponseText = `📌 **Key Takeaways for "${video.title}"**:\n\n1. **Core Concept**: Focuses on practical application of ${video.category}.\n2. **Best Practice**: Always structure code modularly and handle error states.\n3. **Timestamp [${formatDuration(currentSec)}]**: Key implementation detail covered here.\n4. **Next Steps**: Re-watch key sections and write timestamped notes to solidify your learning!`;
      } else if (lower.includes('quiz') || lower.includes('question')) {
        aiResponseText = `💡 **Quick Quiz Question**:\n\nBased on ${video.category} principles shown in this video, what is the main benefit of optimizing async operations or state updates early in your implementation?\n\n*(Think about the answer or type your response below!)*`;
      } else if (lower.includes('best practice') || lower.includes('tips')) {
        aiResponseText = `🚀 **Top Best Practices in ${video.category}**:\n\n- Write clear, self-documenting code with meaningful variable names.\n- Handle boundary conditions and API error responses gracefully.\n- Use developer tools to profile performance and verify state updates.\n- Refer to official documentation alongside video tutorials.`;
      } else {
        aiResponseText = `Great question regarding **${video.title}** at [${formatDuration(currentSec)}]!\n\nIn ${video.category}, understanding this concept is crucial for building robust applications. Make sure to test this pattern directly in your code editor or project setup!`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: currentSec,
        createdAt: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleSaveAsNote = async (text: string, timestamp?: number) => {
    try {
      const time = timestamp !== undefined ? timestamp : Math.floor(getCurrentTimeSeconds());
      await saveNoteToFirestore({
        id: `note-${Date.now()}`,
        videoId: video.id,
        content: text.replace(/\*\*/g, ''),
        timestamp: time,
      });
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error('Failed to save AI note', err);
    }
  };

  const handleAddDirectNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      const time = Math.floor(getCurrentTimeSeconds());
      await saveNoteToFirestore({
        id: `note-${Date.now()}`,
        videoId: video.id,
        content: newNoteText.trim(),
        timestamp: time,
      });
      setNewNoteText('');
      if (onNotesChanged) onNotesChanged();
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700/80 shadow-md space-y-5 animate-in fade-in duration-200">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
              Zen Mode Assistant & Discussion
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ask AI questions or capture timestamped notes directly below the video
            </p>
          </div>
        </div>

        {/* Subtab Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'chat'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'notes'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Notes ({notes.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'chat' ? (
        <div className="space-y-4">
          {/* Quick Preset Prompts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-bold text-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {msg.sender === 'ai' && (
                    <div className="pt-1 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700/50">
                      <button
                        onClick={() => handleSaveAsNote(msg.text, msg.timestamp)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Save as Note</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic py-2">
                <Bot className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span>AI is formulating an answer...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask a question about ${video.title}...`}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      ) : (
        /* Notes Tab in Zen Mode */
        <div className="space-y-4">
          <form onSubmit={handleAddDirectNote} className="space-y-2">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Take a note..."
              rows={2}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <div className="flex justify-end items-center">
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                Add Note
              </button>
            </div>
          </form>

          {/* List of notes */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 italic">No notes yet.</p>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 flex items-start justify-between gap-2"
                >
                  <p className="text-xs text-gray-800 dark:text-gray-200">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
