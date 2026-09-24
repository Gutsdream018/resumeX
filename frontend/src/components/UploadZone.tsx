import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  FileText,
  X,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Upload,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { SampleResume } from '../types';
import { CardReveal } from './CardReveal';

interface UploadZoneProps {
  onAnalyzeFile: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  onSelectSample: (sampleId: string) => void;
  sampleResumes: SampleResume[];
  isLoading: boolean;
  errorMessage?: string | null;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyzeFile,
  onAnalyzeText,
  onSelectSample,
  sampleResumes,
  isLoading,
  errorMessage,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    setLocalError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setLocalError(`Unsupported file format (.${ext}). Supported formats are PDF, DOCX, and Images (PNG, JPG, WEBP).`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    const isImg = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
    if (isImg) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    // Smooth file verification progress, automatically advancing to ATS pipeline
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Automatically advance into the ATS analysis pipeline
          setTimeout(() => {
            onAnalyzeFile(file);
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 60);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setUploadProgress(0);
    setIsUploading(false);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeClick = () => {
    if (activeMode === 'upload' && selectedFile) {
      onAnalyzeFile(selectedFile);
    } else if (activeMode === 'paste' && pastedText.trim().length > 50) {
      onAnalyzeText(pastedText.trim());
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <section
      id="upload-section"
      style={{
        padding: 'clamp(96px, 12vh, 140px) 0 70px',
        scrollMarginTop: '20px',
      }}
    >
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Section Heading */}
        <div style={{ textAlign: 'center', marginBottom: '34px' }}>
          <h2
            style={{
              fontSize: 'clamp(1.9rem, 3.2vw, 2.5rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              marginBottom: '10px',
            }}
          >
            Let's review your resume.
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '1rem' }}>
            Upload your document for an objective breakdown of your ATS score, content quality, and keyword match.
          </p>
        </div>

        {/* Tab switch between file upload & paste */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => setActiveMode('upload')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: activeMode === 'upload' ? '#1c1c1c' : 'transparent',
              color: activeMode === 'upload' ? '#FFFFFF' : '#9A9A9A',
              border: `1px solid ${activeMode === 'upload' ? '#242424' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} color={activeMode === 'upload' ? '#E31B2B' : '#9A9A9A'} />
            <span>Document Upload (PDF / DOCX)</span>
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: activeMode === 'paste' ? '#1c1c1c' : 'transparent',
              color: activeMode === 'paste' ? '#FFFFFF' : '#9A9A9A',
              border: `1px solid ${activeMode === 'paste' ? '#242424' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Raw Text Input</span>
          </button>
        </div>

        {/* Upload Container Card */}
        <CardReveal index={0} borderRadius="14px">
          <div
            className="card-dark"
          style={{
            padding: '32px',
            border: isDragOver ? '2px dashed #E31B2B' : '1px solid #242424',
            boxShadow: isDragOver ? '0 0 35px rgba(227, 27, 43, 0.35)' : 'var(--shadow-card)',
            transition: 'all 0.25s ease',
            position: 'relative',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
          />

          {activeMode === 'upload' ? (
            <div>
              {!selectedFile ? (
                /* Drag & Drop Area */
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed #333333',
                    borderRadius: '12px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragOver ? 'rgba(227, 27, 43, 0.04)' : '#0D0D0D',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C1121F';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(227, 27, 43, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragOver) {
                      e.currentTarget.style.borderColor = '#333333';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: 'rgba(227, 27, 43, 0.1)',
                      border: '1px solid rgba(227, 27, 43, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Upload size={28} color="#E31B2B" />
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    📄 Upload your resume
                  </h3>
                  <p style={{ color: '#9A9A9A', fontSize: '0.94rem', marginBottom: '14px' }}>
                    Drag & drop your PDF or image (PNG, JPG, WEBP) here or <span style={{ color: '#E31B2B', textDecoration: 'underline' }}>browse files</span>
                  </p>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.78rem',
                      color: '#737373',
                      background: '#141414',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      border: '1px solid #242424',
                    }}
                  >
                    <span>Supported: <strong>PDF, DOCX, PNG, JPG</strong></span>
                    <span>•</span>
                    <span>Max: <strong>15MB</strong></span>
                    <span>•</span>
                    <span style={{ color: '#E31B2B', fontWeight: 600 }}>OCR Vision Powered</span>
                  </div>
                </div>
              ) : (
                /* Selected File State */
                <div
                  style={{
                    background: '#0D0D0D',
                    border: '1px solid #242424',
                    borderRadius: '12px',
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '10px',
                          background: imagePreview ? 'rgba(227, 27, 43, 0.18)' : 'rgba(227, 27, 43, 0.12)',
                          border: '1px solid rgba(227, 27, 43, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Uploaded resume thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FileText size={24} color="#E31B2B" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{selectedFile.name}</span>
                          {imagePreview && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(227, 27, 43, 0.18)',
                                color: '#E31B2B',
                                border: '1px solid rgba(227, 27, 43, 0.3)',
                                fontWeight: 700,
                              }}
                            >
                              IMAGE RESUME • OCR
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9A9A9A', display: 'flex', gap: '8px' }}>
                          <span>{selectedFile.name.split('.').pop()?.toUpperCase()}</span>
                          <span>•</span>
                          <span>{formatFileSize(selectedFile.size)}</span>
                          {uploadProgress === 100 && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle size={12} /> Ready
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRemoveFile}
                      style={{
                        background: '#181818',
                        border: '1px solid #2b2b2b',
                        borderRadius: '8px',
                        color: '#9A9A9A',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#E31B2B';
                        e.currentTarget.style.borderColor = '#E31B2B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9A9A9A';
                        e.currentTarget.style.borderColor = '#2b2b2b';
                      }}
                    >
                      <X size={14} />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Upload Progress Bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        color: '#9A9A9A',
                        marginBottom: '6px',
                      }}
                    >
                      <span>Upload & Verification</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill-red"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Analyze CTA */}
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading || uploadProgress < 100}
                    className="btn btn-red"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Review Resume</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Paste Text Mode */
            <div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the raw text of your resume here (experience bullets, summary, education, skills)..."
                rows={9}
                style={{
                  width: '100%',
                  background: '#0D0D0D',
                  border: '1px solid #242424',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#F5F5F5',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '16px',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#E31B2B')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#242424')}
              />
              <button
                onClick={handleAnalyzeClick}
                disabled={isLoading || pastedText.trim().length < 50}
                className="btn btn-red"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                <span>Review Pasted Resume</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Error Message if any */}
          {(localError || errorMessage) && (
            <div
              style={{
                marginTop: '16px',
                background: 'rgba(227, 27, 43, 0.1)',
                border: '1px solid rgba(227, 27, 43, 0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ff6b75',
                fontSize: '0.84rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{localError || errorMessage}</span>
            </div>
          )}
        </div>
        </CardReveal>

        {/* Quick Sample Resume Pickers for Frictionless Testing */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#737373', marginRight: '10px' }}>
            No resume file ready? Test with curated profiles:
          </span>
          <div
            style={{
              display: 'inline-flex',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '10px',
            }}
          >
            {sampleResumes.length > 0 ? (
              sampleResumes.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample.id)}
                  style={{
                    background: '#121212',
                    border: '1px solid #242424',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#F5F5F5',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#E31B2B';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#242424';
                    e.currentTarget.style.color = '#F5F5F5';
                  }}
                >
                  <Sparkles size={12} color="#E31B2B" />
                  <span>{sample.title} ({sample.role})</span>
                </button>
              ))
            ) : (
              <button
                onClick={() => onSelectSample('sample_mid_level')}
                style={{
                  background: '#121212',
                  border: '1px solid #242424',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#F5F5F5',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={12} color="#E31B2B" />
                <span>Sample: Senior Fullstack Engineer (Score ~78)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
