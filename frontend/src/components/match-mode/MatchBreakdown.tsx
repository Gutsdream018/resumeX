import React from 'react';
import { MatchBreakdownCategory } from './types';
import { Award, Briefcase, Key, GraduationCap, CheckSquare2, ChevronRight } from 'lucide-react';

interface MatchBreakdownProps {
  categories: MatchBreakdownCategory[];
}

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'skills':
      return <Award className="w-4 h-4 text-emerald-400" />;
    case 'experience':
      return <Briefcase className="w-4 h-4 text-sky-400" />;
    case 'keywords':
      return <Key className="w-4 h-4 text-amber-400" />;
    case 'education':
      return <GraduationCap className="w-4 h-4 text-purple-400" />;
    case 'responsibilities':
      return <CheckSquare2 className="w-4 h-4 text-brand-crimson" />;
    default:
      return <ChevronRight className="w-4 h-4 text-white" />;
  }
};

const getBarColor = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const MatchBreakdown: React.FC<MatchBreakdownProps> = ({ categories }) => {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Match Category Breakdown
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Granular breakdown across 5 critical dimensions evaluated by hiring systems & recruiters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const barColor = getBarColor(cat.score);
          return (
            <div
              key={cat.id}
              className="bg-[#121212] border border-white/5 hover:border-white/15 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header with Title and Score */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-base font-bold font-mono text-white">
                    {cat.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#1F1F1F] h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>

                {/* Recruiter explanation */}
                <p className="text-xs text-[#A0A0A0] leading-relaxed mb-3">
                  {cat.explanation}
                </p>
              </div>

              {/* Evidence tag */}
              <div className="pt-2 border-t border-white/5 flex items-start gap-1.5 text-[11px] text-[#7A7A7A]">
                <span className="text-brand-crimson font-medium flex-shrink-0">Evidence:</span>
                <span className="line-clamp-2 italic">{cat.evidence}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
