import React from 'react';
import { TrendingUp, ArrowRight, Zap, Award } from 'lucide-react';

interface MatchScoreImprovementProps {
  currentScore: number;
  potentialScore: number;
  milestones?: { title: string; points: number }[];
}

export const MatchScoreImprovement: React.FC<MatchScoreImprovementProps> = ({
  currentScore,
  potentialScore,
  milestones = [
    { title: 'Incorporate missing must-have keywords in your Skills & Summary section', points: 7 },
    { title: 'Adopt the 3 AI-tailored bullet points with quantified outcomes', points: 6 },
    { title: 'Add explicit tenure and scale context for primary technologies', points: 4 }
  ]
}) => {
  const delta = Math.max(0, potentialScore - currentScore);

  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Match Score Projection
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Estimated score progression if you implement recommended keyword and bullet optimizations
          </p>
        </div>
      </div>

      {/* Comparison Display */}
      <div className="bg-[#121212] border border-white/5 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
          {/* Current */}
          <div>
            <span className="text-xs font-mono uppercase text-[#7E7E7E] block mb-1">
              Current Match
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">
              {currentScore}%
            </div>
            <span className="text-[11px] text-[#888888] mt-1 block">Baseline Assessment</span>
          </div>

          <div className="hidden sm:flex flex-col items-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>+{delta}% Gain</span>
            </div>
            <ArrowRight className="w-5 h-5 text-[#444444] mt-2" />
          </div>

          {/* Potential */}
          <div>
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold block mb-1">
              Target Potential
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              {potentialScore}%
            </div>
            <span className="text-[11px] text-emerald-500/80 mt-1 block">Top 5% Candidate Pool</span>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex justify-between text-[11px] font-mono text-[#7E7E7E] mb-1.5">
            <span>0%</span>
            <span>Current: {currentScore}%</span>
            <span className="text-emerald-400 font-semibold">Target: {potentialScore}%</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-[#1A1A1A] h-3 rounded-full overflow-hidden flex relative">
            <div
              className="bg-brand-crimson h-full rounded-l-full transition-all duration-700"
              style={{ width: `${currentScore}%` }}
            />
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full animate-pulse transition-all duration-700"
              style={{ width: `${delta}%` }}
            />
          </div>
        </div>
      </div>

      {/* How to get there */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-[#8A8A8A] font-semibold mb-3 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-brand-crimson" />
          How to unlock the extra +{delta}%:
        </h4>
        <div className="space-y-2">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-white/5 text-xs"
            >
              <span className="text-[#C0C0C0] font-medium">{m.title}</span>
              <span className="text-emerald-400 font-mono font-bold ml-3 flex-shrink-0">
                +{m.points}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
