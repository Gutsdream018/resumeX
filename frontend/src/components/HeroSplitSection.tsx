import React, { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Check,
  Zap,
  Clipboard,
  X,
  ShieldCheck,
} from 'lucide-react';
import { SampleResume } from '../types';
import { ScoreMeter } from './ScoreMeter';

interface HeroSplitSectionProps {
  onAnalyzeFile: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  onSelectSample: (sampleId: string) => void;
  sampleResumes: SampleResume[];
  isLoading: boolean;
  errorMessage?: string | null;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];

export const HeroSplitSection: React.FC<HeroSplitSectionProps> = ({
  onAnalyzeFile,
  onAnalyzeText,
  onSelectSample,
  sampleResumes,
  isLoading,
  errorMessage,
}) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < 10 ? prev + 1 : 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, currentSlide]);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setLocalError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setLocalError(`Unsupported file format (.${ext}). Please upload a PDF, DOCX, TXT, PNG, or JPG.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File exceeds 50MB size limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (activeTab === 'upload' && selectedFile) {
      onAnalyzeFile(selectedFile);
    } else if (activeTab === 'paste') {
      if (!pastedText.trim()) {
        setLocalError('Please paste resume text to review.');
        return;
      }
      onAnalyzeText(pastedText);
    }
  };

  const triggerUploadClick = () => {
    setCurrentSlide(1);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayedError = localError || errorMessage;

  return (
    <section style={{ padding: '36px 0 60px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Value Proposition & Action Buttons */}
        <div>
          {/* Eyebrow Pill */}
          <div style={{ display: 'inline-flex', marginBottom: '18px' }}>
            <span
              className="readout"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <Zap size={13} color="#818cf8" />
              Free profile analysis
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              marginBottom: '20px',
              color: '#ffffff',
            }}
          >
            Upload your resume.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
              }}
            >
              We'll tell you what's wrong with it.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--slate)',
              lineHeight: 1.6,
              maxWidth: '520px',
              marginBottom: '28px',
            }}
          >
            No pep talk. Your ATS score, every red flag ranked, and the exact fixes — the same six-second read a recruiter gives your resume, in writing.
          </p>

          {/* CTA Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              onClick={triggerUploadClick}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
              }}
            >
              <UploadCloud size={18} />
              <span>Upload your resume</span>
            </button>

            <button
              onClick={() => {
                setCurrentSlide(1);
                setActiveTab('samples');
              }}
              className="btn btn-secondary"
              style={{ padding: '14px 22px', fontSize: '0.96rem' }}
            >
              <span>Try Sample Resume</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 3 Feature Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--slate)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <FileText size={14} color="#818cf8" />
              PDF, DOCX or plain text
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--slate)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Lock size={14} color="#818cf8" />
              Private & secure (100% offline)
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--slate)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Sparkles size={14} color="#818cf8" />
              First analysis is free
            </span>
          </div>
        </div>

        {/* Right Column: Multi-Step Interactive Demo Carousel Card */}
        <div style={{ position: 'relative' }}>
          {/* Left Floating Side Navigator Bar */}
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev > 1 ? prev - 1 : 10))}
            title="Previous Step"
            style={{
              position: 'absolute',
              left: '-18px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '36px',
              height: '74px',
              borderRadius: '10px',
              background: '#161616',
              border: '1px solid #333333',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
              color: '#E5E5E5',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '2px',
            }}
          >
            <ChevronLeft size={16} />
            <span style={{ fontSize: '0.52rem', fontWeight: 700 }}>PREV</span>
          </button>

          {/* Right Floating Side Navigator Bar */}
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev < 10 ? prev + 1 : 1))}
            title="Next Step"
            style={{
              position: 'absolute',
              right: '-18px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '36px',
              height: '74px',
              borderRadius: '10px',
              background: '#161616',
              border: '1px solid #333333',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
              color: '#E5E5E5',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '2px',
            }}
          >
            <ChevronRight size={16} />
            <span style={{ fontSize: '0.52rem', fontWeight: 700 }}>NEXT</span>
          </button>

          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="panel"
            style={{
              padding: '28px',
              minHeight: '480px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Carousel Slide Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#6366f1',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    {currentSlide}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {currentSlide === 1 && 'Upload your resume'}
                    {currentSlide === 2 && 'Analysing your resume…'}
                    {currentSlide === 3 && 'Baseline resume score'}
                    {currentSlide === 4 && 'Issues costing you interviews'}
                    {currentSlide === 5 && 'Step 1: Quantify Impact (XYZ Formula)'}
                    {currentSlide === 6 && 'Step 2: Inject Core ATS Keywords'}
                    {currentSlide === 7 && 'Step 3: Fix Layout & Margin Traps'}
                    {currentSlide === 8 && 'Step 4: Executive Summary Hook'}
                    {currentSlide === 9 && 'Step 5: 6-Second Skimmability'}
                    {currentSlide === 10 && 'Cheers! Your stronger profile is ready'}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: currentSlide === 1 ? 'rgba(99, 102, 241, 0.12)' : currentSlide === 4 || currentSlide === 3 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: currentSlide === 1 ? '#818cf8' : currentSlide === 4 || currentSlide === 3 ? '#fb7185' : '#34d399',
                  }}
                >
                  {currentSlide === 1 && "It's free"}
                  {currentSlide === 2 && '~10s'}
                  {currentSlide === 3 && '58 / 100 Baseline'}
                  {currentSlide === 4 && 'High Priority'}
                  {currentSlide === 5 && '+10 Pts Lift'}
                  {currentSlide === 6 && '+10 Pts Keywords'}
                  {currentSlide === 7 && '+8 Pts Layout'}
                  {currentSlide === 8 && '+6 Pts Hook'}
                  {currentSlide === 9 && '+4 Pts Polish'}
                  {currentSlide === 10 && '+38 Total Lift'}
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--mist)', marginLeft: '36px', marginBottom: '16px' }}>
                {currentSlide === 1 && 'Get your free ATS and profile analysis locally in seconds.'}
                {currentSlide === 2 && 'Objective 8-factor evaluation running in-memory on your device.'}
                {currentSlide === 3 && 'Initial diagnostic reveals critical red flags holding back your score.'}
                {currentSlide === 4 && 'These are the top candidate mistakes causing silent rejections.'}
                {currentSlide === 5 && 'Transform passive duty bullets into Google XYZ impact statements.'}
                {currentSlide === 6 && 'Integrate missing high-frequency tech tokens (AWS, Docker, PostgreSQL).'}
                {currentSlide === 7 && 'Eliminate multi-column tables and text boxes that corrupt ATS parsers.'}
                {currentSlide === 8 && 'Anchor seniority and verified scale with a high-conviction profile hook.'}
                {currentSlide === 9 && 'Prune wordy filler and enforce authoritative active verbs under 2 lines.'}
                {currentSlide === 10 && 'Final score after step-by-step optimization: elite top 3% shortlist candidate.'}
              </p>
            </div>

            {/* Slide Body Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* SLIDE 1: Live Interactive Upload & Dropzone */}
              {currentSlide === 1 && (
                <div>
                  {/* Tab switch inside slide */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    <button
                      onClick={() => setActiveTab('upload')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'upload' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                        color: activeTab === 'upload' ? '#ffffff' : 'var(--slate)',
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => setActiveTab('paste')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'paste' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                        color: activeTab === 'paste' ? '#ffffff' : 'var(--slate)',
                      }}
                    >
                      Paste Text
                    </button>
                    <button
                      onClick={() => setActiveTab('samples')}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'samples' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                        color: activeTab === 'samples' ? '#ffffff' : 'var(--slate)',
                      }}
                    >
                      Sample Resumes
                    </button>
                  </div>

                  {/* Tab 1: File Dropzone */}
                  {activeTab === 'upload' && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files && e.target.files.length > 0) {
                            validateAndSetFile(e.target.files[0]);
                          }
                        }}
                      />

                      {!selectedFile ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: isDragOver ? '2px dashed #6366f1' : '1.5px dashed rgba(99, 102, 241, 0.4)',
                            borderRadius: 'var(--radius-md)',
                            background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            padding: '28px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: '#6366f1',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              margin: '0 auto 10px',
                            }}
                          >
                            <UploadCloud size={24} />
                          </div>
                          <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                            Drag & drop your resume here
                          </p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--mist)', marginBottom: '10px' }}>
                            or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>browse file from device</span>
                          </p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--mist)' }}>
                            PDF, DOCX, TXT, PNG, or JPG (max 50MB)
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(16, 185, 129, 0.06)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileCheck2 size={24} color="#10b981" />
                            <div>
                              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                                {selectedFile.name}
                              </p>
                              <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for review
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Paste Text */}
                  {activeTab === 'paste' && (
                    <div>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your raw resume text here (Summary, Experience, Skills, Education)..."
                        style={{
                          width: '100%',
                          height: '140px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-hairline)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          fontFamily: 'inherit',
                          resize: 'none',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {/* Tab 3: Sample Resumes */}
                  {activeTab === 'samples' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sampleResumes.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => onSelectSample(s.id)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-hairline)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-hairline)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>{s.title}</p>
                            <span style={{ fontSize: '0.74rem', color: 'var(--mist)' }}>{s.role} • Score ~{s.expected_score_range}</span>
                          </div>
                          <ArrowRight size={15} color="#818cf8" />
                        </div>
                      ))}
                    </div>
                  )}

                  {displayedError && (
                    <p style={{ fontSize: '0.78rem', color: '#fb7185', marginTop: '10px' }}>
                      {displayedError}
                    </p>
                  )}

                  {/* Primary Trigger Button */}
                  {activeTab !== 'samples' && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        marginTop: '14px',
                        padding: '11px',
                        fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      }}
                    >
                      {isLoading ? 'Analysing Resume…' : 'Start Instant Free Audit'}
                    </button>
                  )}
                </div>
              )}

              {/* SLIDE 2: In-Flight Analysis Simulation */}
              {currentSlide === 2 && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: '100px', height: '100px', margin: '0 auto 16px', position: 'relative' }}>
                    <svg viewBox="0 0 120 120" style={{ width: '100px', height: '100px' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#6366f1" strokeWidth="10" strokeDasharray="210 314" strokeLinecap="round" transform="rotate(-90 60 60)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7' }}>68%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxWidth: '340px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#10b981' }}>
                      <Check size={14} /> <span>Extracting text layers & parsing sections</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#6366f1' }}>
                      <Zap size={14} /> <span>Auditing 8 recruiter & ATS dimensions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--mist)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mist)' }} /> <span>Rewriting weak bullet points</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Baseline Score Gauge & Category Breakdown */}
              {currentSlide === 3 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <ScoreMeter
                      score={58}
                      size={96}
                      label="ATS Score"
                      statusText="CRITICAL FLAWS"
                      glow={true}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    {[
                      { name: 'ATS Compatibility', val: 62 },
                      { name: 'Content Quality', val: 54 },
                      { name: 'Skills Relevance', val: 46 },
                      { name: 'Work Experience', val: 58 },
                      { name: 'Measurable Impact', val: 38 },
                      { name: 'Structure & Margins', val: 62 },
                    ].map((c, i) => (
                      <div key={i} style={{ fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--slate)' }}>
                          <span>{c.name}</span>
                          <span style={{ fontWeight: 600, color: c.val >= 70 ? '#34d399' : '#fb7185' }}>{c.val}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${c.val}%`, height: '100%', background: c.val >= 70 ? '#10b981' : '#e31b2b' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLIDE 4: Issues Costing You Interviews */}
              {currentSlide === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase' }}>Critical: Weak Metrics</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '2px' }}>Role descriptions list routine tasks with zero measurable business impact (%, $, scale).</p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-soft)', border: '1px solid var(--warning-border)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>Warning: Passive Starters</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '2px' }}>Bullets start with "Responsible for" instead of decisive action verbs.</p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>Notice: Missing Profile Links</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '2px' }}>LinkedIn profile missing from header, lowering recruiter credential validation.</p>
                  </div>
                </div>
              )}

              {/* SLIDE 5: Step 1 — Quantify Impact (XYZ Formula) */}
              {currentSlide === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                    <ScoreMeter
                      score={68}
                      previousScore={58}
                      delta="+10"
                      size={92}
                      label="ATS Score"
                      statusText="IMPACT BOOST"
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <span className="readout" style={{ color: '#fb7185', fontSize: '0.7rem' }}>Before</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Responsible for managing customer support portal and fixing bugs."
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                    <span className="readout" style={{ color: '#34d399', fontSize: '0.7rem' }}>After (Google XYZ Formula)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Architected full-stack React/Node portal, reducing ticket latency by 34% across 18k monthly users."
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 6: Step 2 — Inject Core ATS Keywords */}
              {currentSlide === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                    <ScoreMeter
                      score={78}
                      previousScore={68}
                      delta="+10"
                      size={92}
                      label="ATS Score"
                      statusText="KEYWORD MATCH"
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <span className="readout" style={{ color: '#fb7185', fontSize: '0.7rem' }}>Before (Missing keywords)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Maintained backend databases and deployed web applications to cloud servers."
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                    <span className="readout" style={{ color: '#34d399', fontSize: '0.7rem' }}>After (Target Tokens Added)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Automated CI/CD pipelines via Docker & AWS ECS, optimizing PostgreSQL replicas to 4,200 req/sec."
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 7: Step 3 — Fix Layout & Margin Traps */}
              {currentSlide === 7 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                    <ScoreMeter
                      score={86}
                      previousScore={78}
                      delta="+8"
                      size={92}
                      label="ATS Score"
                      statusText="LAYOUT PASSED"
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <span className="readout" style={{ color: '#fb7185', fontSize: '0.7rem' }}>Before (Tables & Graphics)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      Two-column table, text-box headers, and skill bar graphics that fail Workday & Taleo parsers.
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                    <span className="readout" style={{ color: '#34d399', fontSize: '0.7rem' }}>After (Clean Hierarchy)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      Single-column semantic layout with 0.65" margins and standardized headers (100% parse rate).
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 8: Step 4 — Executive Summary Hook */}
              {currentSlide === 8 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                    <ScoreMeter
                      score={92}
                      previousScore={86}
                      delta="+6"
                      size={92}
                      label="ATS Score"
                      statusText="EXECUTIVE HOOK"
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <span className="readout" style={{ color: '#fb7185', fontSize: '0.7rem' }}>Before (Vague Objective)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Hardworking developer seeking a challenging role to utilize programming skills."
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                    <span className="readout" style={{ color: '#34d399', fontSize: '0.7rem' }}>After (Seniority & Scale)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Senior Full-Stack Engineer with 6+ years scaling distributed systems to 50M+ requests/day."
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 9: Step 5 — 6-Second Skimmability */}
              {currentSlide === 9 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
                    <ScoreMeter
                      score={96}
                      previousScore={92}
                      delta="+4"
                      size={92}
                      label="ATS Score"
                      statusText="6-SEC SKIM PASS"
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)' }}>
                    <span className="readout" style={{ color: '#fb7185', fontSize: '0.7rem' }}>Before (Wordy & Passive)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Assisted with team meetings and participated in code review processes whenever needed."
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                    <span className="readout" style={{ color: '#34d399', fontSize: '0.7rem' }}>After (Active Power Verbs)</span>
                    <p style={{ fontSize: '0.78rem', color: '#f8fafc', marginTop: '2px' }}>
                      "Spearheaded PR review standards across 10 engineers, reducing production defects by 41%."
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 10: Stronger Profile Ready */}
              {currentSlide === 10 && (
                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <ScoreMeter
                      score={96}
                      previousScore={58}
                      delta="+38 Total"
                      size={105}
                      label="ATS Score"
                      statusText="SHORTLIST READY"
                    />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--slate)', maxWidth: '320px', margin: '0 auto 14px' }}>
                    Top 3% profile: fully ATS compliant, quantified impact statements, and verified 6-second recruiter appeal.
                  </p>
                  <button
                    onClick={triggerUploadClick}
                    className="btn btn-primary"
                    style={{ padding: '9px 22px', fontSize: '0.86rem' }}
                  >
                    <span>Audit My Resume Now</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Pagination Bar: Prev, Dots, Next */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-hairline)',
              }}
            >
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev > 1 ? prev - 1 : 10))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-hairline)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--slate)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setCurrentSlide(step)}
                    style={{
                      height: '7px',
                      width: currentSlide === step ? '18px' : '6px',
                      borderRadius: 'var(--radius-full)',
                      background: currentSlide === step ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev < 10 ? prev + 1 : 1))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-hairline)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--slate)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
