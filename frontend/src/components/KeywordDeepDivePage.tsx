import React, { useState } from 'react';
import { Key, Sparkles, CheckCircle2, AlertCircle, Plus, Search } from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface KeywordDeepDivePageProps {
  analysis: ResumeAnalysisResult;
}

export const KeywordDeepDivePage: React.FC<KeywordDeepDivePageProps> = ({ analysis }) => {
  const [filterQuery, setFilterQuery] = useState('');

  const detectedKeywords = [
    { name: 'TypeScript', category: 'Language', frequency: 6, density: 'High', status: 'Matched' },
    { name: 'React', category: 'Frontend', frequency: 5, density: 'High', status: 'Matched' },
    { name: 'Node.js', category: 'Backend', frequency: 4, density: 'Medium', status: 'Matched' },
    { name: 'JavaScript', category: 'Language', frequency: 4, density: 'Medium', status: 'Matched' },
    { name: 'PostgreSQL', category: 'Database', frequency: 3, density: 'Medium', status: 'Matched' },
    { name: 'REST APIs', category: 'Architecture', frequency: 3, density: 'Medium', status: 'Matched' },
    { name: 'Microservices', category: 'Architecture', frequency: 2, density: 'Optimal', status: 'Matched' },
    { name: 'Git', category: 'Tooling', frequency: 2, density: 'Optimal', status: 'Matched' },
    { name: 'CI/CD', category: 'DevOps', frequency: 1, density: 'Low', status: 'Matched' },
  ];

  const missingKeywords = [
    { name: 'AWS', category: 'Cloud Infrastructure', weight: 'High Priority', reason: 'Common prerequisite for senior engineers' },
    { name: 'Docker', category: 'DevOps / Containers', weight: 'High Priority', reason: 'Expected standard in modern engineering pipelines' },
    { name: 'Python', category: 'Language', weight: 'Recommended', reason: 'Expands search reach for automation & data roles' },
    { name: 'GraphQL', category: 'Architecture', weight: 'Optional', reason: 'High-value modern API differentiator' },
    { name: 'Kubernetes', category: 'Cloud Infrastructure', weight: 'Optional', reason: 'Desired for distributed infrastructure roles' },
  ];

  const filteredDetected = detectedKeywords.filter(
    (k) =>
      k.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      k.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Keyword Detection & Semantic Density
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.88rem' }}>
            ATS search algorithms index your resume using boolean term frequency and industry synonym groups.
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#111111',
            border: '1px solid #242424',
            borderRadius: '8px',
            padding: '6px 12px',
          }}
        >
          <Search size={14} color="#737373" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search keywords..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '0.82rem',
            }}
          />
        </div>
      </div>

      {/* Grid: Detected Keywords Table & High-Impact Missing Keywords */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="keywords-split-grid">
        {/* Detected Keywords Card */}
        <div
          className="card-dark"
          style={{
            padding: '24px',
            background: '#111111',
            border: '1px solid #242424',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Detected Keywords ({filteredDetected.length})
            </h3>
            <span className="badge badge-green">Parsed Cleanly</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredDetected.map((kw) => (
              <div
                key={kw.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#0D0D0D',
                  border: '1px solid #1E1E1E',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <code style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700 }}>
                    {kw.name}
                  </code>
                  <span style={{ fontSize: '0.74rem', color: '#737373', marginLeft: '10px' }}>
                    {kw.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#9A9A9A' }}>
                    {kw.frequency} mentions
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    {kw.density}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing High-Impact Terms */}
        <div
          className="card-dark"
          style={{
            padding: '24px',
            background: '#111111',
            border: '1px solid #242424',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Missing High-Value Terms
            </h3>
            <span className="badge badge-red">Recruiter Gap</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {missingKeywords.map((item) => (
              <div
                key={item.name}
                style={{
                  background: '#0D0D0D',
                  border: '1px solid rgba(227, 27, 43, 0.25)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <code style={{ fontSize: '0.92rem', color: '#FF7882', fontWeight: 700 }}>
                    {item.name}
                  </code>
                  <span style={{ fontSize: '0.72rem', color: '#E31B2B', fontWeight: 600 }}>
                    {item.weight}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#9A9A9A', lineHeight: 1.4 }}>
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .keywords-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
