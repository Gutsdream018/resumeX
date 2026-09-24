import React from 'react';
import { Briefcase, GraduationCap, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface SectionDeepDiveProps {
  type: 'experience' | 'education' | 'skills';
  analysis: ResumeAnalysisResult;
  onNavigateSuggestions: () => void;
}

export const SectionDeepDive: React.FC<SectionDeepDiveProps> = ({
  type,
  analysis,
  onNavigateSuggestions,
}) => {
  if (type === 'experience') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Work Experience Deep Dive
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.88rem' }}>
            Auditing action verbs, measurable business metrics, and leadership indicators.
          </p>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card-dark" style={{ padding: '18px', background: '#111111', border: '1px solid #242424' }}>
            <span style={{ fontSize: '0.74rem', color: '#9A9A9A', display: 'block', marginBottom: '4px' }}>Impact Score</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#E31B2B' }}>68%</div>
            <span style={{ fontSize: '0.74rem', color: '#E31B2B' }}>Action verbs need quantification</span>
          </div>

          <div className="card-dark" style={{ padding: '18px', background: '#111111', border: '1px solid #242424' }}>
            <span style={{ fontSize: '0.74rem', color: '#9A9A9A', display: 'block', marginBottom: '4px' }}>Bullet Points Evaluated</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>8</div>
            <span style={{ fontSize: '0.74rem', color: '#34d399' }}>5 Strong • 3 Flawed</span>
          </div>

          <div className="card-dark" style={{ padding: '18px', background: '#111111', border: '1px solid #242424' }}>
            <span style={{ fontSize: '0.74rem', color: '#9A9A9A', display: 'block', marginBottom: '4px' }}>Years of Experience</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>5+ Years</div>
            <span style={{ fontSize: '0.74rem', color: '#9A9A9A' }}>Calibrated to Mid-Senior level</span>
          </div>
        </div>

        {/* Detailed Role Breakdown */}
        <div className="card-dark" style={{ padding: '24px', background: '#111111', border: '1px solid #242424' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
            Role 1: Senior Software Engineer • TechFlow Systems (2022 - Present)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#0D0D0D', padding: '12px 14px', borderRadius: '8px', border: '1px solid #222222' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-red">Needs Rewrite</span>
                <span style={{ fontSize: '0.84rem', color: '#FF99A1' }}>"Worked on a web application."</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9A9A9A' }}>
                Fix: Add metric (e.g. reduced latency by 30%, served 45k users).
              </p>
            </div>

            <div style={{ background: '#0D0D0D', padding: '12px 14px', borderRadius: '8px', border: '1px solid #222222' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-green">Strong Impact</span>
                <span style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>"Architected event-driven microservices processing 12,000 requests/sec with 99.98% uptime."</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9A9A9A' }}>
                Includes specific volume numbers, architecture type, and reliability metric.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={onNavigateSuggestions} className="btn btn-red" style={{ fontSize: '0.84rem' }}>
              <span>Open AI Suggestions</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'education') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Education & Academic Credentials
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.88rem' }}>
            Evaluation of degree titles, accredited institution formatting, and graduation timeline.
          </p>
        </div>

        <div className="card-dark" style={{ padding: '28px', background: '#111111', border: '1px solid #242424' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={22} color="#10B981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Bachelor of Science in Computer Science
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#9A9A9A' }}>
                  University of California • Graduated 2019
                </span>
              </div>
            </div>
            <span className="badge badge-green">100% Parsed</span>
          </div>

          <p style={{ fontSize: '0.86rem', color: '#B3B3B3', lineHeight: 1.5, marginBottom: '18px' }}>
            Your education entry is positioned correctly after work experience (standard for candidates with 2+ years of industry experience) and passes all major ATS parser validations.
          </p>

          <div style={{ background: '#0D0D0D', padding: '14px 18px', borderRadius: '8px', border: '1px solid #222222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
              <CheckCircle2 size={16} />
              <span>Formatting Compliance</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9A9A9A' }}>
              Degree naming convention matches standard Bureau of Labor Statistics and Workday taxonomy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Skills
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Skills Matrix & Relevance
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.88rem' }}>
          Taxonomy breakdown and recruiter scan effectiveness.
        </p>
      </div>

      <div className="card-dark" style={{ padding: '24px', background: '#111111', border: '1px solid #242424' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>
          Categorized Skill Distribution
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#0D0D0D', padding: '16px', borderRadius: '8px', border: '1px solid #222222' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Languages
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span className="badge badge-neutral">TypeScript</span>
              <span className="badge badge-neutral">JavaScript</span>
              <span className="badge badge-neutral">Python</span>
              <span className="badge badge-neutral">Go</span>
            </div>
          </div>

          <div style={{ background: '#0D0D0D', padding: '16px', borderRadius: '8px', border: '1px solid #222222' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Frameworks & Libraries
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span className="badge badge-neutral">React</span>
              <span className="badge badge-neutral">Node.js</span>
              <span className="badge badge-neutral">Express</span>
              <span className="badge badge-neutral">Next.js</span>
            </div>
          </div>

          <div style={{ background: '#0D0D0D', padding: '16px', borderRadius: '8px', border: '1px solid #222222' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Databases & Cloud
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span className="badge badge-neutral">PostgreSQL</span>
              <span className="badge badge-neutral">Redis</span>
              <span className="badge badge-red">+ Add AWS</span>
              <span className="badge badge-red">+ Add Docker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
