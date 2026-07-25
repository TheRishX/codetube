import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { extractYouTubeId } from '../lib/youtube';

interface GlobalPasteContextType {
  isModalOpen: boolean;
  pastedUrl: string;
  openAddVideoModal: (url?: string) => void;
  closeAddVideoModal: () => void;
  lastPastedNotification: string | null;
  clearNotification: () => void;
}

const GlobalPasteContext = createContext<GlobalPasteContextType | undefined>(undefined);

export const GlobalPasteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [lastPastedNotification, setLastPastedNotification] = useState<string | null>(null);

  const openAddVideoModal = useCallback((url: string = '') => {
    setPastedUrl(url);
    setIsModalOpen(true);
  }, []);

  const closeAddVideoModal = useCallback(() => {
    setIsModalOpen(false);
    setPastedUrl('');
  }, []);

  const clearNotification = useCallback(() => {
    setLastPastedNotification(null);
  }, []);

  useEffect(() => {
    // Global Paste Event Listener
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an active text input or textarea, UNLESS it's explicitly a YouTube URL paste
      const activeElement = document.activeElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable);

      const clipboardText = e.clipboardData?.getData('text/plain') || '';
      const youtubeId = extractYouTubeId(clipboardText);

      if (youtubeId) {
        // If it's a YouTube URL, detect it globally!
        if (!isInput || (activeElement && (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes('youtube'))) {
          e.preventDefault();
        }

        setPastedUrl(clipboardText.trim());
        setIsModalOpen(true);
        setLastPastedNotification(`Pasted YouTube Video detected! (${youtubeId})`);

        // Auto hide notification after 5 seconds
        setTimeout(() => {
          setLastPastedNotification(null);
        }, 5000);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  return (
    <GlobalPasteContext.Provider
      value={{
        isModalOpen,
        pastedUrl,
        openAddVideoModal,
        closeAddVideoModal,
        lastPastedNotification,
        clearNotification,
      }}
    >
      {children}
    </GlobalPasteContext.Provider>
  );
};

export const useGlobalPaste = () => {
  const context = useContext(GlobalPasteContext);
  if (!context) {
    throw new Error('useGlobalPaste must be used within a GlobalPasteProvider');
  }
  return context;
};
