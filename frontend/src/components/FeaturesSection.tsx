import React from 'react';
import {
  FileCheck2,
  FileText,
  Code2,
  Briefcase,
  TrendingUp,
  Layout,
  SpellCheck,
  Award,
} from 'lucide-react';
import { CardReveal } from './CardReveal';

export const FeaturesSection: React.FC = () => {
  const categories = [
    {
      name: 'ATS Compatibility',
      weight: '20%',
      icon: <FileCheck2 size={20} color="#E31B2B" />,
      desc: 'Checks parseability, section headers, contact clarity, and verifies freedom from unreadable tables.',
    },
    {
      name: 'Content Quality',
      weight: '15%',
      icon: <FileText size={20} color="#E31B2B" />,
      desc: 'Evaluates concise communication, relevance, information hierarchy, and eliminates unnecessary filler.',
    },
    {
      name: 'Skills Relevance',
      weight: '15%',
      icon: <Code2 size={20} color="#E31B2B" />,
      desc: 'Analyzes technical hard skills, modern tool stack indexing, and alignment with industry benchmarks.',
    },
    {
      name: 'Work Experience',
      weight: '15%',
      icon: <Briefcase size={20} color="#E31B2B" />,
      desc: 'Validates action verbs, career trajectory, team scope, and clear demonstration of responsibilities.',
    },
    {
      name: 'Achievements & Impact',
      weight: '15%',
      icon: <TrendingUp size={20} color="#E31B2B" />,
      desc: 'Detects quantified outcomes (%, $, scale, users) and helps convert passive tasks into quantifiable results.',
    },
    {
      name: 'Formatting & Structure',
      weight: '10%',
      icon: <Layout size={20} color="#E31B2B" />,
      desc: 'Ensures logical chronological flow, standardized margins, bullet lengths, and clean visual rhythm.',
    },
    {
      name: 'Grammar & Language',
      weight: '5%',
      icon: <SpellCheck size={20} color="#E31B2B" />,
      desc: 'Audits tense consistency, spelling errors, active voice, and flags unprofessional colloquialisms.',
    },
    {
      name: 'Tone & Professionalism',
      weight: '5%',
      icon: <Award size={20} color="#E31B2B" />,
      desc: 'Ensures tone matches executive, mid-level, or senior technical expectations without corporate jargon.',
    },
  ];

  return (
    <section id="features" style={{ padding: '60px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
          <span className="badge badge-red">RECRUITER-CALIBRATED FRAMEWORK</span>
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '8px' }}>
          8-Factor Diagnostic Architecture
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.96rem', maxWidth: '600px', margin: '0 auto' }}>
          Our audit uses deterministic multi-factor scoring matching the exact weighting used by Fortune 500 talent systems.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {categories.map((cat, idx) => (
          <CardReveal key={idx} index={idx} borderRadius="14px">
            <div
              className="card-dark"
              style={{
                padding: '24px',
                background: '#111111',
                border: '1px solid #242424',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'rgba(227, 27, 43, 0.1)',
                    border: '1px solid rgba(227, 27, 43, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cat.icon}
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#9A9A9A',
                    background: '#181818',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #282828',
                  }}
                >
                  Weight: {cat.weight}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  {cat.name}
                </h3>
                <p style={{ color: '#9A9A9A', fontSize: '0.84rem', lineHeight: 1.5 }}>
                  {cat.desc}
                </p>
              </div>
            </div>
          </CardReveal>
        ))}
      </div>
    </section>
  );
};
