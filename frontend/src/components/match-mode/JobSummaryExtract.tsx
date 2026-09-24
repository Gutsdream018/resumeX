import React from 'react';
import { FileText, Award, Calendar, CheckSquare, AlertTriangle, Building2 } from 'lucide-react';
import { JobSummaryInfo } from './types';

interface JobSummaryExtractProps {
  summary: JobSummaryInfo;
}

export const JobSummaryExtract: React.FC<JobSummaryExtractProps> = ({ summary }) => {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-sky-400" />
        <h3 className="text-lg font-bold text-white">
          What This Company is Really Looking For
        </h3>
      </div>
      <p className="text-xs text-[#8A8A8A] mb-6">
        AI extraction of core expectations, unstated priorities, and candidate profile filters
      </p>

      {/* Target Role & Seniority Banner */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#141414] border border-white/5 rounded-xl mb-6">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Building2 className="w-4 h-4 text-brand-crimson" />
          <span>{summary.targetRole}</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-1.5 text-xs text-[#B0B0B0]">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Experience: <strong className="text-white">{summary.experienceLevel}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core Must-Haves */}
        <div className="p-4 bg-[#121212] border border-white/5 rounded-xl">
          <div className="text-xs font-mono uppercase tracking-wider text-[#7E7E7E] font-semibold mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Core Skills Prioritized
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.coreSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-[#E0E0E0] border border-white/5"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Primary Responsibilities */}
        <div className="p-4 bg-[#121212] border border-white/5 rounded-xl">
          <div className="text-xs font-mono uppercase tracking-wider text-[#7E7E7E] font-semibold mb-3 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-brand-crimson" />
            Key Deliverables
          </div>
          <ul className="space-y-2">
            {summary.keyResponsibilities.map((resp, idx) => (
              <li key={idx} className="text-xs text-[#B0B0B0] flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-crimson mt-1.5 flex-shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dealbreakers / Potential friction */}
      {summary.dealbreakers && summary.dealbreakers.length > 0 && (
        <div className="mt-5 p-3.5 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-amber-300 block mb-1">
              Watch Out For:
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#C0C0C0]">
              {summary.dealbreakers.map((d, i) => (
                <span key={i}>• {d}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
