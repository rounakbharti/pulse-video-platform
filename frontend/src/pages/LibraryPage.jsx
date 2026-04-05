import React, { useEffect, useState } from 'react';
import { useVideos } from '../store/VideoContext';
import { StatusBadge } from '../components/StatusBadge';
import { Loader2, Play, Trash2, ShieldAlert, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';

const FILTER_OPTIONS = [
  { value: '', label: 'All Videos' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'safe', label: '✓ Safe' },
  { value: 'flagged', label: '⚑ Flagged' },
];

export const LibraryPage = () => {
  const { isAdmin, isEditor } = useAuth();
  const { videos, isLoading, loadVideos } = useVideos();
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const params = { limit: 50 };
    if (['safe', 'flagged', 'pending'].includes(filter)) {
      params.safetyStatus = filter;
    } else if (filter) {
      params.status = filter;
    }
    
    if (dateFilter) params.dateFilter = dateFilter;
    if (sizeFilter) params.sizeFilter = sizeFilter;
    if (durationFilter) params.durationFilter = durationFilter;

    loadVideos(params);
  }, [filter, dateFilter, sizeFilter, durationFilter, loadVideos]);

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this video? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/videos/${id}`);
      loadVideos({ limit: 50 });
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const formatDuration = (s) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="page-container animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Library</h1>
          <p className="page-subtitle">Browse, filter, and manage your tenant's processed videos.</p>
        </div>

        <div className="library-filter-bar" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
            {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Any Date</option>
            <option value="24h">Past 24 Hours</option>
            <option value="7d">Past 7 Days</option>
            <option value="30d">Past 30 Days</option>
          </select>
          
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Any Size</option>
            <option value="small">Small (&lt; 10MB)</option>
            <option value="medium">Medium (10-50MB)</option>
            <option value="large">Large (&gt; 50MB)</option>
          </select>
          
          <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Any Duration</option>
            <option value="short">Short (&le; 30s)</option>
            <option value="medium">Medium (30s - 5m)</option>
            <option value="long">Long (&gt; 5m)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="center-loader">
          <Loader2 className="animate-spin text-accent-primary" size={32} />
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <Play size={48} className="empty-icon" />
          <h3 className="empty-title">No Videos Found</h3>
          <p className="empty-text">
            {filter ? 'No videos match this filter. Try a different one.' : 'Upload your first video to get started.'}
          </p>
          {isEditor && (
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Upload Video
            </Link>
          )}
        </div>
      ) : (
        <div className="library-grid">
          {videos.map(video => {
            const canPlay = video.status === 'completed';
            const isFlagged = video.safetyStatus === 'flagged';

            return (
              <div key={video._id} className="video-card">
                {/* Thumbnail area */}
                <div className="video-thumb">
                  {canPlay && !isFlagged ? (
                    <Link to={`/player/${video._id}`} className="video-thumb-overlay">
                      <div className="video-play-circle">
                        <Play size={20} fill="white" />
                      </div>
                    </Link>
                  ) : isFlagged ? (
                    <ShieldAlert size={40} style={{ color: 'var(--warning)', opacity: 0.5 }} />
                  ) : (
                    <Loader2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className={video.status === 'processing' ? 'animate-spin' : ''} />
                  )}

                  {/* Status badges */}
                  <div className="video-badge-row">
                    <StatusBadge status={video.status} />
                    {video.status === 'completed' && <StatusBadge status={video.safetyStatus} />}
                  </div>

                  {/* Duration */}
                  {video.duration && (
                    <span className="video-duration">{formatDuration(video.duration)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="video-card-body">
                  <h3 className="video-card-title" title={video.title || video.originalFileName}>
                    {video.title || video.originalFileName}
                  </h3>
                  <p className="video-card-meta">
                    By {video.uploadedBy?.name || 'Unknown'} · {new Date(video.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </p>
                  {video.resolution?.width && (
                    <p className="video-card-meta">{video.resolution.width}×{video.resolution.height} · {video.codec?.toUpperCase()}</p>
                  )}

                  {/* Flagged warning link */}
                  {isFlagged && canPlay && (
                    <Link to={`/player/${video._id}`} style={{ fontSize: '0.78rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldAlert size={13} /> View with restriction →
                    </Link>
                  )}

                  {/* Delete (editor+) */}
                  {(isAdmin || isEditor) && (
                    <div className="video-card-footer">
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(video._id)}
                        disabled={deleting === video._id}
                        title="Delete video"
                      >
                        {deleting === video._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
