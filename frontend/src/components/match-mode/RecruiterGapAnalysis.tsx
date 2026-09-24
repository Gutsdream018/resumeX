import React from 'react';
import { Eye, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { RecruiterGapItem } from './types';

interface RecruiterGapAnalysisProps {
  gaps: RecruiterGapItem[];
}

export const RecruiterGapAnalysis: React.FC<RecruiterGapAnalysisProps> = ({ gaps }) => {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-brand-crimson" />
            <h3 className="text-lg font-bold text-white">
              Recruiter Gap Analysis
            </h3>
          </div>
          <p className="text-xs text-[#8A8A8A]">
            The top concerns a recruiter or screener would raise within the first 6 seconds of reviewing your resume
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gaps.map((gap, index) => {
          const numberLabel = `0${index + 1}`;
          return (
            <div
              key={gap.id}
              className="bg-[#121212] border border-white/5 hover:border-white/15 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Number & Severity */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black font-mono text-brand-crimson/80">
                    {numberLabel}
                  </span>
                  {gap.severity === 'critical' ? (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20 font-semibold">
                      High Priority
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">
                      Opportunity
                    </span>
                  )}
                </div>

                {/* Gap Title */}
                <h4 className="text-base font-bold text-white mb-2 leading-snug">
                  {gap.title}
                </h4>

                {/* Recruiter Reaction / Why it matters */}
                <p className="text-xs text-[#A0A0A0] leading-relaxed mb-4">
                  {gap.whyItMatters}
                </p>
              </div>

              {/* Actionable Advice: Improve by adding */}
              <div className="pt-3 border-t border-white/5">
                <div className="text-[11px] font-mono text-[#7E7E7E] uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-brand-crimson" />
                  Improve by adding:
                </div>
                <ul className="space-y-1.5">
                  {gap.suggestedAdditions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#CCCCCC]">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
