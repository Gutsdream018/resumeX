import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CardReveal } from './CardReveal';

export const BeforeAfterSection: React.FC = () => {
  const examples = [
    {
      before: 'Worked on a web application.',
      after: 'Developed a full-stack web application with React & Node.js, reducing processing time by 30% for 45,000 monthly active users.',
      tags: ['Measurable outcome', 'Defines technical stack', 'Quantifies user scale'],
    },
    {
      before: 'Responsible for database queries and bug fixes.',
      after: 'Optimized indexed PostgreSQL queries and Redis caching layer, cutting p99 API response latency from 650ms to 85ms.',
      tags: ['Technical depth', 'Performance benchmark', 'Eliminates passive phrasing'],
    },
    {
      before: 'Collaborated with team to ship new features.',
      after: 'Spearheaded agile 2-week sprint cycles across 8 engineers and UX designers, delivering 4 core MVP milestones ahead of deadline.',
      tags: ['Demonstrates leadership', 'Sprint velocity', 'Cross-functional ownership'],
    },
  ];

  return (
    <section id="before-after" style={{ padding: '50px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
          <span className="badge badge-red">REAL-WORLD REWRITE SAMPLES</span>
        </div>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '8px' }}>
          One bullet. Before and after.
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.96rem', maxWidth: '540px', margin: '0 auto' }}>
          See how passive duty statements are transformed into high-impact accomplishments that recruiters notice.
        </p>
      </div>

      <CardReveal index={0} borderRadius="14px">
        <div
          className="card-dark"
          style={{
            padding: '32px',
            background: '#111111',
            border: '1px solid #242424',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
        {examples.map((item, idx) => (
          <div key={idx} style={{ borderBottom: idx < examples.length - 1 ? '1px solid #1E1E1E' : 'none', paddingBottom: idx < examples.length - 1 ? '24px' : '0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1.25fr)',
                gap: '16px',
                alignItems: 'center',
              }}
              className="before-after-grid"
            >
              {/* Before Card */}
              <div
                style={{
                  background: 'rgba(227, 27, 43, 0.06)',
                  border: '1px solid rgba(227, 27, 43, 0.3)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🔴 Weak (Passive)
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#FF99A1', lineHeight: 1.5, fontFamily: 'monospace' }}>
                  "{item.before}"
                </p>
              </div>

              {/* Arrow Divider */}
              <div style={{ display: 'flex', justifyContent: 'center', color: '#E31B2B' }} className="before-after-arrow">
                <ArrowRight size={20} />
              </div>

              {/* After Card */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🟢 Recruiter Approved (High Impact)
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#FFFFFF', lineHeight: 1.5, fontWeight: 500 }}>
                  "{item.after}"
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#161616',
                        color: '#9A9A9A',
                        border: '1px solid #282828',
                      }}
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </CardReveal>

      <style>{`
        @media (max-width: 820px) {
          .before-after-grid {
            grid-template-columns: 1fr !important;
          }
          .before-after-arrow {
            transform: rotate(90deg);
            margin: 4px 0;
          }
        }
      `}</style>
    </section>
  );
};
