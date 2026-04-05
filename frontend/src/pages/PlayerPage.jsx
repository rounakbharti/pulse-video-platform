import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../store/AuthContext';

export const PlayerPage = () => {
  const { isEditor } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get(`/videos/${id}`);
        setVideo(res.data.video);
        const token = localStorage.getItem('pulse_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        setStreamUrl(`${baseUrl}/videos/${id}/stream?token=${token}`);
      } catch (err) {
        setError('Video not found or you do not have permission to view it.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetadata();
  }, [id]);

  const formatDuration = (s) => {
    if (!s) return 'Unknown';
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}m ${sec}s`;
  };

  if (isLoading) {
    return (
      <div className="player-container">
        <div className="center-loader"><Loader2 className="animate-spin text-accent-primary" size={40} /></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="player-container">
        <div className="empty-state">
          <ShieldAlert size={40} className="text-danger empty-icon" />
          <h3 className="empty-title">Cannot Load Video</h3>
          <p className="empty-text">{error}</p>
          <button onClick={() => navigate('/library')} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  if (video.status !== 'completed') {
    return (
      <div className="player-container">
        <button className="player-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="empty-state">
          <Loader2 size={40} className="animate-spin text-accent-primary empty-icon" />
          <h3 className="empty-title">Video Not Ready</h3>
          <p className="empty-text">This video is currently being processed. Come back once it completes.</p>
          <StatusBadge status={video.status} />
        </div>
      </div>
    );
  }

  const isFlagged = video.safetyStatus === 'flagged';
  const showWarning = isFlagged && !warningAcknowledged;

  return (
    <div className="player-container animate-slide-up">
      <button className="player-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to Library
      </button>

      <div className="player-video-wrap">
        {showWarning ? (
          <div className="flagged-gate">
            <ShieldAlert size={52} style={{ color: 'var(--warning)' }} />
            <h2 className="flagged-gate-title">Sensitivity Warning</h2>
            <p className="flagged-gate-sub">
              This video was flagged by the automated sensitivity analysis pipeline.
              It may contain content that requires restricted access.
            </p>
            {isEditor ? (
              <button
                onClick={() => setWarningAcknowledged(true)}
                className="btn"
                style={{ background: 'var(--warning)', color: '#000', fontWeight: 700, marginTop: '0.5rem' }}
              >
                <CheckCircle2 size={16} /> Acknowledge & Stream
              </button>
            ) : (
              <p className="flagged-gate-block">
                Policy C: Your role (Viewer) does not have permission to stream flagged content.
                Contact your Admin to request access.
              </p>
            )}
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            controlsList="nodownload"
            src={streamUrl}
          >
            Your browser does not support HTML5 video.
          </video>
        )}
      </div>

      {/* Video metadata */}
      <div className="player-info">
        <h1 className="player-title">{video.title || video.originalFileName}</h1>
        <div className="player-meta">
          <StatusBadge status={video.status} />
          <StatusBadge status={video.safetyStatus} />
          {video.duration && <span>Duration: {formatDuration(video.duration)}</span>}
          {video.resolution?.width && <span>Resolution: {video.resolution.width}×{video.resolution.height}</span>}
          {video.codec && <span>Codec: {video.codec.toUpperCase()}</span>}
          <span>Uploaded: {new Date(video.createdAt).toLocaleString()}</span>
        </div>
        {video.tags?.length > 0 && (
          <div className="player-tags">
            {video.tags.map(t => <span key={t} className="player-tag">#{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
};
