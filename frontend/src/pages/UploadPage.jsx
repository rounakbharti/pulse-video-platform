import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useVideos } from '../store/VideoContext';
import { UploadCloud, FileVideo, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export const UploadPage = () => {
  const navigate = useNavigate();
  const { addVideo } = useVideos();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      return setError('Please select a valid video file (MP4, WebM, OGG, MOV, AVI, MKV).');
    }
    if (selectedFile.size > 500 * 1024 * 1024) {
      return setError('File exceeds maximum size of 500MB.');
    }
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file to upload.');

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title || file.name);
    if (tags) {
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
    }

    try {
      const res = await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      // Immediately add to VideoContext so Dashboard shows it live
      if (res.data.video) addVideo(res.data.video);

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="page-container animate-slide-up" style={{ maxWidth: '680px' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Upload Video</h1>
          <p className="page-subtitle">Upload a video for automated sensitivity analysis and secure storage.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success ? (
          <div className="upload-success">
            <div className="upload-success-icon">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h2 className="upload-success-title">Upload Complete!</h2>
            <p className="upload-success-text">Your video has been queued for sensitivity analysis.</p>
            <p className="upload-success-sub">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="upload-form">
            {/* Drop Zone */}
            {!file ? (
              <div
                className={clsx('dropzone', isDragging && 'dropzone-active')}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
                  onChange={(e) => handleFile(e.target.files[0])}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="dropzone-icon">
                  <UploadCloud size={36} />
                </div>
                <p className="dropzone-title">Drag & drop or click to browse</p>
                <p className="dropzone-sub">MP4, WebM, OGG, MOV, AVI, MKV · Max 500 MB</p>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-preview-icon">
                  <FileVideo size={28} />
                </div>
                <div className="file-preview-info">
                  <p className="file-preview-name">{file.name}</p>
                  <p className="file-preview-size">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="file-preview-remove"
                  onClick={() => { setFile(null); setUploadProgress(0); }}
                  disabled={isUploading}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Fields */}
            <div className="form-field">
              <label htmlFor="title">Video Title <span className="required">*</span></label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                disabled={isUploading}
              />
            </div>

            <div className="form-field">
              <label htmlFor="tags">Tags <span className="optional">(optional)</span></label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="marketing, Q3, internal (comma separated)"
                disabled={isUploading}
              />
            </div>

            {/* Upload progress bar */}
            {isUploading && (
              <div className="upload-progress-wrap">
                <div className="upload-progress-header">
                  <span>Uploading to server...</span>
                  <span className="upload-pct">{uploadProgress}%</span>
                </div>
                <div className="upload-progress-track">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="upload-progress-shimmer" />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="upload-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading {uploadProgress}%</>
                ) : (
                  <><UploadCloud size={16} /> Upload Video</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Info box */}
      <div className="info-box">
        <p className="info-box-item">📁 Files are stored securely in your tenant's isolated storage.</p>
        <p className="info-box-item">🔍 Sensitivity analysis runs automatically after upload.</p>
        <p className="info-box-item">⚡ Progress updates appear live on the dashboard via Socket.io.</p>
      </div>
    </div>
  );
};
