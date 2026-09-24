import React, { useState } from 'react';
import { Plus, Minus, Check, ArrowRight } from 'lucide-react';
import { CardReveal } from './CardReveal';

interface FaqSectionProps {
  onAnalyzeClick?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onAnalyzeClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is included in the resume review?',
      a: 'A complete diagnostic audit: your overall ATS score out of 100, category breakdowns, critical flaws ranked by recruiter severity, ATS parseability check, missing high-frequency keywords, and actionable bullet point rewrites using the Google XYZ formula.',
    },
    {
      q: 'How does the ATS compatibility score work?',
      a: 'We test your resume against the parsing logic used by major enterprise Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo). We check text layer integrity, header standards, single-column alignment, and exact technical keyword matches.',
    },
    {
      q: 'Is my resume data stored or shared?',
      a: 'No. All documents are processed securely in-memory. We do not sell your personal resume information or train public models on your private data.',
    },
    {
      q: 'How does Job Description Matching work?',
      a: 'You can paste any live job description into the "Job Match" tool. The engine computes semantic overlap, extracts missing skills, and suggests exact bullet points to inject before you submit your application.',
    },
    {
      q: 'Can I test without uploading my personal resume?',
      a: 'Yes! Simply click "Try Sample Resume" at the upload section to run an instant full-featured demo on a pre-loaded senior engineer resume.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', padding: '40px 0 60px' }}>
      {/* Pricing Section (referenced by Navbar) */}
      <section id="pricing">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <span className="badge badge-red">SIMPLE, TRANSPARENT ACCESS</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Predictable Career Investment
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.96rem' }}>
            Free comprehensive diagnostic audit included for every candidate.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            maxWidth: '860px',
            margin: '0 auto',
          }}
        >
          {/* Free Tier */}
          <CardReveal index={0} borderRadius="14px">
            <div
              className="card-dark"
              style={{
                padding: '32px 28px',
                background: '#0D0D0D',
                border: '1px solid #242424',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: '12px' }}>FREE TIER</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Standard Audit
                </h3>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '16px' }}>
                  $0 <span style={{ fontSize: '0.86rem', color: '#737373', fontWeight: 500 }}>/ free forever</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', color: '#B3B3B3' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#E31B2B" /> Full 8-factor ATS score
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#E31B2B" /> 3 AI bullet point improvements
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#E31B2B" /> Critical flaw detection
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#E31B2B" /> Keyword gap identification
                  </li>
                </ul>
              </div>

              <button
                onClick={onAnalyzeClick}
                className="btn btn-secondary-dark"
                style={{ marginTop: '28px', width: '100%' }}
              >
                <span>Get Free Analysis</span>
              </button>
            </div>
          </CardReveal>

          {/* Pro Tier (Red Accent) */}
          <CardReveal index={1} borderRadius="14px">
            <div
              className="card-dark"
              style={{
                padding: '32px 28px',
                background: '#111111',
                border: '1px solid #E31B2B',
                boxShadow: '0 0 30px rgba(227, 27, 43, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: '#E31B2B',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}
              >
                RECOMMENDED
              </div>

              <div>
                <span className="badge badge-red" style={{ marginBottom: '12px' }}>RESUMEX</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Unlimited Pro
                </h3>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '16px' }}>
                  $19 <span style={{ fontSize: '0.86rem', color: '#737373', fontWeight: 500 }}>/ month</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', color: '#F5F5F5' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#34d399" /> Unlimited resume audits & PDF exports
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#34d399" /> Interactive Split-Screen 1-Click Rewriter
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#34d399" /> Unlimited Job Description Matching
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#34d399" /> Tailored Cover Letter Generator
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#34d399" /> Priority Recruiter Benchmark updates
                  </li>
                </ul>
              </div>

              <button
                onClick={onAnalyzeClick}
                className="btn btn-red"
                style={{ marginTop: '28px', width: '100%' }}
              >
                <span>Upgrade to Pro</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </CardReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <span className="badge badge-neutral">COMMON QUESTIONS</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.96rem' }}>
            Everything you need to know about the diagnostic audit.
          </p>
        </div>

        <CardReveal index={0} borderRadius="14px" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div
            className="card-dark"
            style={{
              padding: '12px 24px',
              background: '#111111',
              border: '1px solid #242424',
            }}
          >
            {faqs.map((f, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderBottom: idx < faqs.length - 1 ? '1px solid #1F1F1F' : 'none',
                    padding: '18px 0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '16px',
                    }}
                  >
                    <span>{f.q}</span>
                    <span style={{ color: '#E31B2B', flexShrink: 0 }}>
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#9A9A9A', lineHeight: 1.6 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardReveal>
      </section>
    </div>
  );
};
