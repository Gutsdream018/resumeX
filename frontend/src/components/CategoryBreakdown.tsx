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
import { CategoryScores } from '../types';

interface CategoryBreakdownProps {
  scores: CategoryScores;
}

interface CategoryMeta {
  key: keyof CategoryScores;
  name: string;
  weight: string;
  icon: React.ReactNode;
  desc: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ scores }) => {
  const categories: CategoryMeta[] = [
    {
      key: 'ats',
      name: 'ATS Compatibility',
      weight: '20%',
      icon: <FileCheck2 size={18} color="#06b6d4" />,
      desc: 'Machine parseability, headers & formatting safety',
    },
    {
      key: 'content',
      name: 'Content Quality',
      weight: '15%',
      icon: <FileText size={18} color="#6366f1" />,
      desc: 'Clarity, conciseness & information hierarchy',
    },
    {
      key: 'skills',
      name: 'Skills Relevance',
      weight: '15%',
      icon: <Code2 size={18} color="#8b5cf6" />,
      desc: 'Technical tools, keywords & categorization',
    },
    {
      key: 'experience',
      name: 'Work Experience',
      weight: '15%',
      icon: <Briefcase size={18} color="#3b82f6" />,
      desc: 'Role trajectory, leadership scope & action verbs',
    },
    {
      key: 'impact',
      name: 'Measurable Impact',
      weight: '15%',
      icon: <TrendingUp size={18} color="#10b981" />,
      desc: 'Quantifiable results, metrics & business value',
    },
    {
      key: 'formatting',
      name: 'Formatting & Structure',
      weight: '10%',
      icon: <Layout size={18} color="#f59e0b" />,
      desc: 'Visual flow, section order & clean margins',
    },
    {
      key: 'grammar',
      name: 'Grammar & Language',
      weight: '5%',
      icon: <SpellCheck size={18} color="#ec4899" />,
      desc: 'Tense consistency, spelling & syntax cleanliness',
    },
    {
      key: 'professionalism',
      name: 'Professionalism',
      weight: '5%',
      icon: <Award size={18} color="#eab308" />,
      desc: 'Executive tone, formal style & contact clarity',
    },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return '#10b981';
    if (val >= 65) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem' }}>Category Score Breakdown</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Total score is calculated deterministically using the exact weighted sum (100%).
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {categories.map((cat) => {
          const scoreVal = scores[cat.key] ?? 0;
          const scoreColor = getScoreColor(scoreVal);

          return (
            <div
              key={cat.key}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        Weight: {cat.weight}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    fontFamily: 'Plus Jakarta Sans',
                    color: scoreColor,
                  }}>
                    {scoreVal}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      /100
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  margin: '8px 0 10px',
                }}>
                  <div style={{
                    width: `${scoreVal}%`,
                    height: '100%',
                    background: scoreColor,
                    borderRadius: '3px',
                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {cat.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
