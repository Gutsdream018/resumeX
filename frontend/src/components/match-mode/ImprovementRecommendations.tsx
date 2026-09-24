import React from 'react';
import { ListOrdered, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';

interface Recommendation {
  id: string;
  step: number;
  title: string;
  description: string;
  impactScore: number;
  category: string;
}

interface ImprovementRecommendationsProps {
  recommendations: Recommendation[];
}

export const ImprovementRecommendations: React.FC<ImprovementRecommendationsProps> = ({
  recommendations
}) => {
  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-brand-crimson" />
            Actionable Next Steps
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Prioritized tactical steps to maximize your ATS match score and interview callback rate
          </p>
        </div>

        {/* Honest AI Guarantee badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Non-Hallucinatory</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 bg-[#121212] border border-white/5 hover:border-white/15 rounded-xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-brand-crimson/15 text-brand-crimson font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-crimson/20">
                {rec.step}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-[#888888]">
                    {rec.category}
                  </span>
                </div>
                <p className="text-xs text-[#A0A0A0] leading-relaxed max-w-2xl">
                  {rec.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex-shrink-0 self-end sm:self-auto">
              <TrendingUp className="w-3 h-3" />
              <span>+{rec.impactScore}% Match</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
