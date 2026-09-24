import React from 'react';
import { Upload, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { CardReveal } from './CardReveal';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Upload your resume',
      desc: 'Drag and drop your PDF or DOCX file. Our engine validates layout parsing instantly.',
      icon: <Upload size={22} color="#E31B2B" />,
    },
    {
      num: '02',
      title: 'AI scans & audits',
      desc: 'Machine-learning parser evaluates ATS compliance, keyword gaps, and section structure.',
      icon: <Search size={22} color="#E31B2B" />,
    },
    {
      num: '03',
      title: 'Understand the flaws',
      desc: 'Review prioritized 🔴 Critical, 🟠 Improve, and 🟢 Strong diagnostic insights.',
      icon: <Sparkles size={22} color="#E31B2B" />,
    },
    {
      num: '04',
      title: 'Apply 1-click fixes',
      desc: 'Rewrite weak bullets with quantifiable metrics and match directly against job postings.',
      icon: <CheckCircle2 size={22} color="#E31B2B" />,
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: '60px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
          <span className="badge badge-red">STREAMLINED 4-STEP PIPELINE</span>
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '8px' }}>
          How it works
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.96rem', maxWidth: '540px', margin: '0 auto' }}>
          Upload → AI analyzes → Understand problems → Fix resume → Improve score.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {steps.map((s, idx) => (
          <CardReveal key={s.num} index={idx} borderRadius="14px">
            <div
              className="card-dark"
              style={{
                padding: '28px 22px',
                background: '#111111',
                border: '1px solid #242424',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                height: '100%',
              }}
            >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(227, 27, 43, 0.1)',
                  border: '1px solid rgba(227, 27, 43, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s.icon}
              </div>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#333333',
                  fontFamily: 'monospace',
                }}
              >
                {s.num}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                {s.title}
              </h3>
              <p style={{ color: '#9A9A9A', fontSize: '0.86rem', lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
            </div>
          </CardReveal>
        ))}
      </div>
    </section>
  );
};
