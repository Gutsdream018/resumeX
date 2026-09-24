import React, { useRef } from 'react';
import { ArrowRight, Sparkles, Upload, FileUp, Building2, Terminal } from 'lucide-react';

interface JobDescriptionInputProps {
  value: string;
  onChange: (val: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const PRESET_JOBS = [
  {
    label: 'Mechanical Design Engineer',
    company: 'Tata Advanced Systems • CAD/Tooling',
    jd: `Job Title: Mechanical Design Engineer (CAD & Manufacturing)
We are seeking an ambitious Mechanical Design Engineer to model precision parts and support tooling operations.
Requirements:
- B.Tech in Mechanical Engineering or relevant technical discipline
- Hands-on proficiency in AutoCAD 2D drafting and CATIA 3D parametric part modeling
- Understanding of manufacturing processes, injection molding, and machining fundamentals
- Ability to prepare standard engineering drawings and technical documentation
- Strong team collaboration and communication skills.`,
  },
  {
    label: 'Senior Full-Stack (React/Node/AWS)',
    company: 'Stripe • Platform',
    jd: `Senior Full-Stack Software Engineer (Infrastructure & Core Experience)
We are seeking an experienced Full-Stack Software Engineer to build scalable microservices and high-throughput customer dashboards.
Requirements:
- 4+ years of professional engineering experience with React, TypeScript, and Node.js
- Strong background architecting resilient REST APIs and microservice communication
- Production experience deploying containerized services with Docker on AWS (ECS, S3, RDS, Lambda)
- Proven experience with relational database design and performance tuning on PostgreSQL
- Understanding of CI/CD automation, automated testing (Jest/Cypress), and monitoring (Datadog/Prometheus)
- Experience driving technical ownership across multi-disciplinary teams in an agile environment.`,
  },
  {
    label: 'DevOps & Cloud Infrastructure',
    company: 'Datadog • Cloud Ops',
    jd: `Senior Cloud & DevOps Infrastructure Engineer
Join our platform infrastructure team scaling distributed systems and cloud infrastructure across global regions.
Requirements:
- 3+ years experience managing cloud infrastructure on AWS or GCP using Terraform IaC
- Deep hands-on proficiency with Docker containerization and Kubernetes cluster orchestration
- Experience architecting automated CI/CD deployment pipelines using GitHub Actions or GitLab
- Fluency in Python, Go, or Bash for infrastructure automation and systems scripting
- Strong grasp of Linux systems internals, network security, and observability (Prometheus/Grafana)
- Demonstrated ability to troubleshoot high-concurrency production outages and reduce mean time to resolution.`,
  },
  {
    label: 'Product-Focused Frontend Engineer',
    company: 'Linear • Product Engineering',
    jd: `Frontend Software Engineer (High-Performance Web Applications)
We are looking for a craft-focused Frontend Engineer who obsesses over sub-50ms UI latency, micro-animations, and fluid user experiences.
Requirements:
- 3+ years building complex web client applications with React, Next.js, and TypeScript
- Mastery of modern CSS architectures, TailwindCSS, responsive layouts, and accessibility (WCAG)
- Deep understanding of state management, client caching, and client-side performance profiling
- Experience integrating REST and GraphQL endpoints with robust optimistic UI updates
- Strong collaboration with product design teams, translating Figma systems into reusable UI components.`,
  },
];

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  onAnalyze,
  isLoading,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read text file directly if text, or fallback name
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.trim().length > 20) {
        onChange(content);
      }
    };
    reader.readAsText(file);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isReady = value.trim().length >= 30;

  return (
    <div
      className="card-dark"
      style={{
        padding: '24px',
        background: '#111111',
        border: '1px solid #262626',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header & Preset Pickers */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Target Job Description</span>
            <span style={{ fontSize: '0.7rem', color: '#737373', fontWeight: 400 }}>({wordCount} words)</span>
          </label>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: '#737373' }}>Presets:</span>
          {PRESET_JOBS.map((job, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(job.jd)}
              style={{
                background: '#181818',
                border: '1px solid #2A2A2A',
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                color: '#D4D4D4',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#E31B2B';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2A2A2A';
                e.currentTarget.style.color = '#D4D4D4';
              }}
            >
              {job.label.split(' ')[0]} {job.label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Large Comfortable Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={9}
          placeholder="Paste the complete target job description here (responsibilities, required qualifications, tech stack, desired years of experience)..."
          disabled={disabled || isLoading}
          style={{
            width: '100%',
            background: '#0D0D0D',
            border: '1px solid #282828',
            borderRadius: '12px',
            padding: '16px',
            color: '#F5F5F5',
            fontSize: '0.86rem',
            lineHeight: 1.55,
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#E31B2B')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#282828')}
        />
      </div>

      {/* Helper text & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', margin: 0 }}>
            <strong style={{ color: '#C4C4C4' }}>Tip: </strong>
            Paste the complete job description for a more accurate match.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.doc,.docx,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent',
              border: '1px solid #2E2E2E',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.72rem',
              color: '#A1A1AA',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#FFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2E2E2E';
              e.currentTarget.style.color = '#A1A1AA';
            }}
          >
            <FileUp size={12} />
            <span>Upload JD</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!isReady || isLoading || disabled}
          className="btn btn-red"
          style={{
            padding: '10px 24px',
            fontSize: '0.92rem',
            fontWeight: 700,
            opacity: !isReady || isLoading ? 0.5 : 1,
            cursor: !isReady || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={16} />
          <span>{isLoading ? 'Analyzing Match...' : 'Analyze Job Match →'}</span>
        </button>
      </div>
    </div>
  );
};
