import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const VideoContext = createContext(null);

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadVideos = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const res = await api.get('/videos', { params });
      setVideos(res.data.videos);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Called from useSocket when a processing:progress or processing:complete event fires.
   * Updates the matching video in-place in the state array — no page refresh needed.
   * If videoId doesn't exist in the current list (e.g. Dashboard just loaded),
   * we DON'T discard the event — we add a skeleton entry so the user sees it immediately.
   */
  const updateVideoState = useCallback((videoId, updates) => {
    setVideos((prev) => {
      const exists = prev.some((v) => v._id === videoId);
      if (exists) {
        return prev.map((vid) =>
          vid._id === videoId ? { ...vid, ...updates } : vid
        );
      }
      // Video not in current list — add a placeholder so it appears live
      return [{ _id: videoId, processingProgress: 0, status: 'processing', ...updates }, ...prev];
    });
  }, []);

  /**
   * Called immediately after a successful upload POST to inject the new video
   * into the state WITHOUT a reload, so it shows on Dashboard right away.
   */
  const addVideo = useCallback((video) => {
    setVideos((prev) => [video, ...prev]);
  }, []);

  const value = {
    videos,
    pagination,
    isLoading,
    loadVideos,
    updateVideoState,
    addVideo,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
};

export const useVideos = () => {
  const context = useContext(VideoContext);
  if (!context) throw new Error('useVideos must be used within a VideoProvider');
  return context;
};
