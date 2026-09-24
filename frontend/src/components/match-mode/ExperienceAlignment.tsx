import React from 'react';
import { Briefcase, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';
import { ExperienceAlignmentItem } from './types';

interface ExperienceAlignmentProps {
  alignments: ExperienceAlignmentItem[];
}

export const ExperienceAlignment: React.FC<ExperienceAlignmentProps> = ({ alignments }) => {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-sky-400" />
          Experience & Responsibility Alignment
        </h3>
        <p className="text-xs text-[#8A8A8A] mt-0.5">
          Side-by-side audit of what the hiring manager demands vs. what your resume currently proves
        </p>
      </div>

      <div className="space-y-4">
        {alignments.map((item) => {
          let statusBadge = null;
          if (item.matchLevel === 'strong') {
            statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Strong Proof
              </span>
            );
          } else if (item.matchLevel === 'moderate') {
            statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Partial Proof
              </span>
            );
          } else {
            statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Gap Identified
              </span>
            );
          }

          return (
            <div
              key={item.id}
              className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all duration-200"
            >
              {/* Status Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#7E7E7E]">
                  Requirement Analysis
                </span>
                {statusBadge}
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Job Requirement */}
                <div className="p-3.5 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[11px] font-mono text-brand-crimson font-medium mb-1.5 uppercase tracking-wider">
                    Target Job Expectation
                  </div>
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {item.requirement}
                  </p>
                </div>

                {/* Resume Evidence */}
                <div className="p-3.5 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-[11px] font-mono text-sky-400 font-medium mb-1.5 uppercase tracking-wider">
                    Resume Evidence Found
                  </div>
                  <p className="text-sm text-[#CCCCCC] leading-relaxed italic">
                    "{item.resumeEvidence}"
                  </p>
                </div>
              </div>

              {/* Insight / Advice */}
              <div className="flex items-start gap-2 text-xs text-[#9E9E9E] bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-medium">Recruiter Tip: </strong>
                  {item.recruiterInsight}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
