import React, { useEffect, useState } from 'react';
import { useVideos } from '../store/VideoContext';
import { useSocket } from '../hooks/useSocket';
import { StatusBadge } from '../components/StatusBadge';
import { Loader2, Activity, Play, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const PIPELINE_STEPS = [
  { label: 'Uploaded', progress: 0, key: 'uploaded' },
  { label: 'Processing Started', progress: 25, key: 'processing started' },
  { label: 'Analyzing Frames', progress: 50, key: 'analyzing frames' },
  { label: 'Sensitivity Analysis', progress: 75, key: 'sensitivity analysis' },
  { label: 'Completed', progress: 100, key: 'completed' },
];

const ProcessingCard = ({ video }) => {
  const progress = video.processingProgress || 0;
  const message = video.statusMessage || 'uploaded';
  const isComplete = video.status === 'completed';
  const isFailed = video.status === 'failed';

  const stepIndex = PIPELINE_STEPS.findIndex(s => s.progress > progress) - 1;
  const currentStep = Math.max(0, stepIndex);

  return (
    <div className="processing-card">
      <div className="processing-card-header">
        <div className="processing-card-title-row">
          <div className="processing-card-icon">
            {isComplete ? (
              video.safetyStatus === 'flagged'
                ? <AlertTriangle size={20} className="text-warning" />
                : <CheckCircle2 size={20} className="text-success" />
            ) : isFailed ? (
              <AlertTriangle size={20} className="text-danger" />
            ) : (
              <Loader2 size={20} className="text-accent-primary animate-spin" />
            )}
          </div>
          <div className="processing-card-info">
            <h3 className="processing-card-name">{video.title || video.originalFileName || 'Untitled Video'}</h3>
            <div className="processing-badge-row">
              <StatusBadge status={video.status} />
              {isComplete && <StatusBadge status={video.safetyStatus} />}
            </div>
          </div>
          {isComplete && (
            <Link to={`/player/${video._id}`} className="processing-play-btn">
              <Play size={16} fill="currentColor" /> Watch
            </Link>
          )}
        </div>
      </div>

      {!isFailed && (
        <div className="processing-pipeline">
          {/* Progress bar */}
          <div className="pipeline-bar-track">
            <div
              className={`pipeline-bar-fill ${isComplete ? 'pipeline-bar-done' : ''}`}
              style={{ width: `${progress}%` }}
            >
              {!isComplete && <div className="pipeline-bar-shimmer" />}
            </div>
          </div>

          {/* Step indicators */}
          <div className="pipeline-steps">
            {PIPELINE_STEPS.map((step, i) => {
              const isDone = progress >= step.progress;
              const isCurrent = !isComplete && message === step.key;
              return (
                <div key={step.key} className="pipeline-step">
                  <div className={`pipeline-dot ${isDone ? 'pipeline-dot-done' : ''} ${isCurrent ? 'pipeline-dot-active' : ''}`}>
                    {isDone && !isCurrent && <CheckCircle2 size={10} />}
                    {isCurrent && <div className="pipeline-dot-pulse" />}
                  </div>
                  <span className={`pipeline-step-label ${isDone ? 'pipeline-label-done' : ''} ${isCurrent ? 'pipeline-label-active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live message */}
          <div className="pipeline-status-msg">
            <span className={`status-pill ${isComplete ? 'status-pill-done' : 'status-pill-live'}`}>
              {isComplete ? '● Complete' : '● Live'}
            </span>
            <span className="pipeline-msg-text">{message}</span>
            <span className="pipeline-pct">{progress}%</span>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="pipeline-error-msg">
          ⚠ Processing failed: {video.errorMessage || 'Unknown error'}
        </div>
      )}
    </div>
  );
};

export const DashboardPage = () => {
  useSocket();
  const navigate = useNavigate();
  const { isEditor } = useAuth();
  const { videos, isLoading, loadVideos } = useVideos();
  const [recentCompleted, setRecentCompleted] = useState([]);

  useEffect(() => {
    // Load both active and recently completed for the dashboard
    loadVideos({ limit: 20 });
  }, [loadVideos]);

  // Split into live (processing) and recently finished
  const activeJobs = videos.filter(v => ['queued', 'processing'].includes(v.status));
  const justCompleted = videos
    .filter(v => v.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 4);

  return (
    <div className="page-container animate-slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Processing Dashboard</h1>
          <p className="page-subtitle">Real-time FFmpeg pipeline monitoring via Socket.io</p>
        </div>
        {isEditor && (
          <Link to="/upload" className="btn btn-primary">
            <UploadCloud size={16} /> Upload Video
          </Link>
        )}
      </div>

      {/* Active Jobs */}
      <section className="dashboard-section">
        <div className="section-label">
          <Activity size={16} className="text-accent-primary" />
          <span>Active Processing Jobs</span>
          {activeJobs.length > 0 && (
            <span className="section-count">{activeJobs.length}</span>
          )}
        </div>

        {isLoading ? (
          <div className="center-loader"><Loader2 className="animate-spin text-accent-primary" size={32} /></div>
        ) : activeJobs.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} className="empty-icon" />
            <h3 className="empty-title">No Active Jobs</h3>
            <p className="empty-text">Upload a video to see the real-time processing pipeline in action.</p>
            {isEditor && (
              <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                <UploadCloud size={16} /> Upload Now
              </Link>
            )}
          </div>
        ) : (
          <div className="processing-list">
            {activeJobs.map(video => (
              <ProcessingCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Completed */}
      {justCompleted.length > 0 && (
        <section className="dashboard-section">
          <div className="section-label">
            <CheckCircle2 size={16} className="text-success" />
            <span>Recently Completed</span>
          </div>
          <div className="recent-grid">
            {justCompleted.map(video => (
              <div key={video._id} className="recent-card">
                <div className="recent-card-thumb">
                  {video.safetyStatus === 'flagged' ? (
                    <AlertTriangle size={24} className="text-warning opacity-60" />
                  ) : (
                    <button
                      onClick={() => navigate(`/player/${video._id}`)}
                      className="recent-play-btn"
                    >
                      <Play size={20} fill="white" />
                    </button>
                  )}
                </div>
                <div className="recent-card-info">
                  <p className="recent-card-title">{video.title || video.originalFileName}</p>
                  <div className="recent-badge-row">
                    <StatusBadge status={video.safetyStatus} />
                    {video.duration && (
                      <span className="recent-duration">
                        {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="view-all-row">
            <Link to="/library" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>View All in Library →</Link>
          </div>
        </section>
      )}
    </div>
  );
};
