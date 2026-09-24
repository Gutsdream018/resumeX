import React from 'react';
import { Target, CheckCircle, AlertTriangle, XCircle, ArrowUpRight, Info, ShieldCheck, Gauge } from 'lucide-react';
import { JobMatchData } from './types';

interface MatchScoreHeaderProps {
  data: JobMatchData;
}

export const MatchScoreHeader: React.FC<MatchScoreHeaderProps> = ({ data }) => {
  const { overallScore, alignmentLevel, alignmentSummary, keyStats, jobTitle, companyName, signals } = data;

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#22C55E';
    if (score >= 55) return '#EAB308';
    return '#EF4444';
  };

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'Strong Alignment':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Moderate Alignment':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const scoreColor = getScoreColor(overallScore);
  const strokeDashoffset = 440 - (440 * overallScore) / 100;
  const atsScore = signals?.atsScoreComparison?.atsScore || 75;

  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
      {/* Background Accent Glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 -mr-20 -mt-20"
        style={{ backgroundColor: scoreColor }}
      />

      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
        {/* Radial Circular Gauge */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#1A1A1A"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {overallScore}%
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#9A9A9A] uppercase mt-0.5">
              JOB MATCH
            </span>
          </div>
        </div>

        {/* Core Info & Summary */}
        <div className="flex-1 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle(alignmentLevel)} flex items-center gap-1.5`}>
              <Target className="w-3.5 h-3.5" />
              {alignmentLevel}
            </span>
            {companyName && (
              <span className="px-2.5 py-0.5 text-xs text-[#9A9A9A] bg-[#141414] border border-white/5 rounded-md">
                {companyName}
              </span>
            )}
            <div className="flex items-center gap-2 px-2.5 py-0.5 text-xs text-[#C4C4C4] bg-[#161616] border border-white/10 rounded-md">
              <Gauge className="w-3 h-3 text-[#FF4D5E]" />
              <span>ATS Score: <strong className="text-white">{atsScore}</strong> / 100</span>
              <span className="text-[#666]">|</span>
              <span>Match: <strong className="text-emerald-400">{overallScore}</strong> / 100</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {jobTitle || 'Target Job Alignment'}
          </h2>

          <p className="text-sm text-[#B0B0B0] leading-relaxed max-w-2xl">
            {alignmentSummary}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#7A7A7A] mt-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Match score reflects resume-to-job alignment, not hiring probability.</span>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 bg-[#141414] border border-white/5 rounded-xl text-center lg:text-left">
              <div className="text-[11px] text-[#7E7E7E] uppercase font-mono mb-1 flex items-center justify-center lg:justify-start gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Matched Skills
              </div>
              <div className="text-lg font-bold text-white">
                {keyStats.matchedSkillsCount}
                <span className="text-xs text-[#666666] font-normal"> / {keyStats.totalSkillsRequired}</span>
              </div>
            </div>

            <div className="p-3 bg-[#141414] border border-white/5 rounded-xl text-center lg:text-left">
              <div className="text-[11px] text-[#7E7E7E] uppercase font-mono mb-1 flex items-center justify-center lg:justify-start gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Keywords
              </div>
              <div className="text-lg font-bold text-white">
                {keyStats.keywordCoveragePercent}%
              </div>
            </div>

            <div className="p-3 bg-[#141414] border border-white/5 rounded-xl text-center lg:text-left">
              <div className="text-[11px] text-[#7E7E7E] uppercase font-mono mb-1 flex items-center justify-center lg:justify-start gap-1">
                <XCircle className="w-3 h-3 text-rose-400" />
                Missing Items
              </div>
              <div className="text-lg font-bold text-white">
                {keyStats.missingMustHavesCount}
              </div>
            </div>

            <div className="p-3 bg-[#141414] border border-white/5 rounded-xl text-center lg:text-left">
              <div className="text-[11px] text-[#7E7E7E] uppercase font-mono mb-1 flex items-center justify-center lg:justify-start gap-1">
                <ArrowUpRight className="w-3 h-3 text-brand-crimson" />
                Potential Match
              </div>
              <div className="text-lg font-bold text-brand-crimson">
                {data.potentialScore}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
