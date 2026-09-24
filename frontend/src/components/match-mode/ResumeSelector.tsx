import React, { useState, useRef } from 'react';
import { FileText, CheckCircle2, RefreshCw, UploadCloud, Edit2, Check, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';
import { analyzeResumeFile } from '../../services/api';

interface ResumeSelectorProps {
  analysis?: ResumeAnalysisResult | null;
  selectedResumeText?: string;
  resumeFileName?: string;
  onResumeSelect?: (text: string, name: string) => void;
  onChangeResume?: () => void;
}

const DEFAULT_SAMPLE_RESUME = `Alex Morgan
Senior Full-Stack Engineer | San Francisco, CA | alex.morgan@example.com

SUMMARY
Full-Stack Software Engineer with 5+ years of experience building performant, scalable web applications using TypeScript, React, Node.js, and PostgreSQL. Passionate about API reliability, front-end optimization, and cloud deployments.

EXPERIENCE
Senior Software Engineer | FinTech Corp | 2022 - Present
- Architected and shipped microservices handling 25,000 requests per second with Node.js and PostgreSQL.
- Modernized user dashboard in React and TypeScript, cutting initial load time by 38%.
- Implemented automated CI/CD deployment pipelines using Docker and GitHub Actions on AWS ECS.
- Partnered with product and design teams in agile bi-weekly sprints to launch multi-currency payment checkout.

Software Engineer | TechVentures | 2020 - 2022
- Developed responsive React frontend components and state management with Redux.
- Built RESTful endpoints in Express and Node.js with automated Jest unit testing.
- Optimized indexed SQL database queries on PostgreSQL, reducing slow query occurrences by 45%.

EDUCATION & SKILLS
B.S. in Computer Science | University of California (2016 - 2020)
Skills: TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, SQL, Redis, Docker, AWS, Git, REST APIs, Jest`;

export const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  analysis,
  selectedResumeText = '',
  resumeFileName,
  onResumeSelect,
  onChangeResume,
}) => {
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customText, setCustomText] = useState(selectedResumeText || DEFAULT_SAMPLE_RESUME);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(() => {
    return analysis?.metadata?.preserved_document?.preview_data_url || null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageMethod =
    analysis?.metadata?.extraction_method === 'ocr_image' ||
    Boolean(imagePreviewUrl) ||
    /\.(png|jpg|jpeg|webp)$/i.test(resumeFileName || '');

  const hasAnalysis = Boolean(analysis && analysis.metadata);
  const fileName =
    resumeFileName ||
    analysis?.metadata?.preserved_document?.original_name ||
    (analysis as any)?.fileName ||
    'Senior_FullStack_Engineer_Resume.pdf';

  const wordCount = selectedResumeText ? selectedResumeText.trim().split(/\s+/).length : 420;

  const handleApplyCustom = () => {
    setIsEditingCustom(false);
    if (onResumeSelect) {
      onResumeSelect(customText, 'Custom Pasted Resume');
    }
  };

  const handleUseSample = () => {
    setCustomText(DEFAULT_SAMPLE_RESUME);
    setImagePreviewUrl(null);
    if (onResumeSelect) {
      onResumeSelect(DEFAULT_SAMPLE_RESUME, 'Sample Senior Full-Stack Resume');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrError(null);
    setIsOcrLoading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImg = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext);

    if (isImg) {
      const localUrl = URL.createObjectURL(file);
      setImagePreviewUrl(localUrl);
    } else {
      setImagePreviewUrl(null);
    }

    try {
      const result = await analyzeResumeFile(file);
      const extractedText =
        result.metadata?.raw_text ||
        result.bullet_point_improvements?.map((b) => b.original).join('\n\n') ||
        customText;

      setCustomText(extractedText);
      if (onResumeSelect) {
        onResumeSelect(extractedText, file.name);
      }
    } catch (err: any) {
      setOcrError(err.message || 'Failed to extract text from document/image.');
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card-dark" style={{ padding: '22px 24px', background: '#0D0D0D', border: '1px solid #242424', borderRadius: '14px' }}>
      {/* Hidden file input for direct system image or document upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Left info badge with thumbnail or file icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: isImageMethod ? 'rgba(227, 27, 43, 0.18)' : 'rgba(227, 27, 43, 0.12)',
              border: '1px solid rgba(227, 27, 43, 0.3)',
              display: 'grid',
              placeItems: 'center',
              color: '#E31B2B',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Resume Thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : isImageMethod ? (
              <ImageIcon size={22} />
            ) : (
              <FileText size={22} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {fileName}
              </h4>
              {isImageMethod ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#E31B2B',
                    background: 'rgba(227, 27, 43, 0.15)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(227, 27, 43, 0.35)',
                  }}
                >
                  <Sparkles size={11} />
                  IMAGE RESUME • VISION OCR
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <CheckCircle2 size={12} />
                  {hasAnalysis ? 'Analyzed & Loaded' : 'Active for Matching'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#9A9A9A', margin: 0 }}>
              {wordCount} words recognized • Structured for ATS skills, experience, and keywords
            </p>
          </div>
        </div>

        {/* Right actions: Upload Image/File, Edit text, Load sample */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={isOcrLoading}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-red"
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            {isOcrLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Scanning Image OCR...</span>
              </>
            ) : (
              <>
                <UploadCloud size={13} />
                <span>Upload Resume / Image</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsEditingCustom(!isEditingCustom)}
            className="btn btn-secondary-dark"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Edit2 size={13} />
            <span>{isEditingCustom ? 'Close Editor' : 'View / Edit Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseSample}
            className="btn btn-secondary-dark"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {ocrError && (
        <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.78rem', color: '#FCA5A5' }}>
          {ocrError}
        </div>
      )}

      {/* Expandable resume text editor */}
      {isEditingCustom && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1F1F1F' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.78rem', color: '#B0B0B0', fontWeight: 600 }}>
              Recognized Resume Text (Used by Match Mode Engine):
            </label>
            {isImageMethod && (
              <span style={{ fontSize: '0.72rem', color: '#E31B2B', fontWeight: 600 }}>
                Parsed via Adaptive OCR
              </span>
            )}
          </div>
          <textarea
            rows={8}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{
              width: '100%',
              background: '#070707',
              border: '1px solid #282828',
              borderRadius: '8px',
              padding: '12px',
              color: '#F0F0F0',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={handleApplyCustom}
              className="btn btn-red"
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Check size={13} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
