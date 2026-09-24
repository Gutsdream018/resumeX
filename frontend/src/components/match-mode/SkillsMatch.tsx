import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from 'lucide-react';
import { SkillMatchItem } from './types';

interface SkillsMatchProps {
  skills: SkillMatchItem[];
}

export const SkillsMatch: React.FC<SkillsMatchProps> = ({ skills }) => {
  const [filter, setFilter] = useState<'all' | 'matched' | 'partial' | 'missing'>('all');

  const matchedSkills = skills.filter((s) => s.status === 'matched');
  const partialSkills = skills.filter((s) => s.status === 'partial');
  const missingSkills = skills.filter((s) => s.status === 'missing');

  const filteredSkills = skills.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Skill Match & Semantic Analysis
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Evaluates exact matches, adjacent technologies (semantic parity), and missing job prerequisites
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141414] border border-white/5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            All ({skills.length})
          </button>
          <button
            onClick={() => setFilter('matched')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              filter === 'matched'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-[#888888] hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Matched ({matchedSkills.length})
          </button>
          <button
            onClick={() => setFilter('partial')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              filter === 'partial'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-[#888888] hover:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Partial ({partialSkills.length})
          </button>
          <button
            onClick={() => setFilter('missing')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              filter === 'missing'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-[#888888] hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Missing ({missingSkills.length})
          </button>
        </div>
      </div>

      {/* Grid of Skills Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSkills.map((skill) => {
          let badgeStyles = '';
          let icon = null;
          let borderAccent = '';

          if (skill.status === 'matched') {
            badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
            borderAccent = 'hover:border-emerald-500/30';
          } else if (skill.status === 'partial') {
            badgeStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
            borderAccent = 'hover:border-amber-500/30';
          } else {
            badgeStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            icon = <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
            borderAccent = 'hover:border-rose-500/30';
          }

          return (
            <div
              key={skill.id}
              className={`p-3.5 bg-[#121212] border border-white/5 ${borderAccent} rounded-xl transition-all duration-200 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-semibold text-white">
                      {skill.name}
                    </span>
                  </div>
                  {skill.importance === 'high' && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/20 font-semibold">
                      Must Have
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#8E8E8E] leading-relaxed mb-2.5">
                  {skill.context}
                </p>
              </div>

              {/* Semantic note or evidence */}
              {skill.semanticNote ? (
                <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/5 px-2 py-1 rounded">
                  <Sparkles className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{skill.semanticNote}</span>
                </div>
              ) : skill.evidenceInResume ? (
                <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-[#777777]">
                  <Info className="w-3 h-3 flex-shrink-0 text-emerald-400/80" />
                  <span className="line-clamp-1 italic">"{skill.evidenceInResume}"</span>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/5 text-[11px] text-rose-400/80">
                  Not found in resume
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
