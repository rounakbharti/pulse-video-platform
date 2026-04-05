import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useVideos } from '../store/VideoContext';

/**
 * Custom hook to uniformly tie backend Socket.io processing events into the React lifecycle.
 * We listen for processing, complete, and fail events and push them transparently to the VideoContext.
 */
export const useSocket = () => {
  const { updateVideoState } = useVideos();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // The backend emits: emitToTenant(tenantId, 'processing:progress', { videoId, progress, status, message })
    const handleProgress = ({ videoId, progress, status, message }) => {
      updateVideoState(videoId, { processingProgress: progress, status, statusMessage: message });
    };

    const handleComplete = ({ videoId, safetyStatus, duration, status, progress, message }) => {
      updateVideoState(videoId, { safetyStatus, duration, status, processingProgress: progress, statusMessage: message });
    };

    const handleFailed = ({ videoId, error, status, message }) => {
      updateVideoState(videoId, { errorMessage: error, status, processingProgress: 0, statusMessage: message });
    };

    socket.on('processing:progress', handleProgress);
    socket.on('processing:complete', handleComplete);
    socket.on('processing:failed', handleFailed);

    return () => {
      socket.off('processing:progress', handleProgress);
      socket.off('processing:complete', handleComplete);
      socket.off('processing:failed', handleFailed);
    };
  }, [updateVideoState]);
};
