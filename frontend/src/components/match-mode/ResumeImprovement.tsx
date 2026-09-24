import React, { useState } from 'react';
import { Sparkles, Copy, Check, Edit3, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BulletImprovementItem } from './types';

interface ResumeImprovementProps {
  bullets: BulletImprovementItem[];
  onApplyBullet?: (bulletId: string, text: string) => void;
}

export const ResumeImprovement: React.FC<ResumeImprovementProps> = ({
  bullets,
  onApplyBullet
}) => {
  const [activeBullets, setActiveBullets] = useState<Record<string, {
    status: 'pending' | 'accepted' | 'rejected' | 'editing';
    customText?: string;
  }>>({});

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUseSuggestion = (item: BulletImprovementItem) => {
    setActiveBullets((prev) => ({
      ...prev,
      [item.id]: { status: 'accepted', customText: prev[item.id]?.customText || item.suggestedBullet }
    }));
    if (onApplyBullet) {
      onApplyBullet(item.id, activeBullets[item.id]?.customText || item.suggestedBullet);
    }
  };

  const handleKeepOriginal = (item: BulletImprovementItem) => {
    setActiveBullets((prev) => ({
      ...prev,
      [item.id]: { status: 'rejected' }
    }));
  };

  const handleToggleEdit = (item: BulletImprovementItem) => {
    const current = activeBullets[item.id];
    if (current?.status === 'editing') {
      setActiveBullets((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: 'pending' }
      }));
    } else {
      setActiveBullets((prev) => ({
        ...prev,
        [item.id]: {
          status: 'editing',
          customText: current?.customText || item.suggestedBullet
        }
      }));
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-crimson" />
            Targeted Bullet Rewrites (Before & After)
          </h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            AI-optimized impact statements tailored directly to this job's requirements and tech stack
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {bullets.map((item) => {
          const state = activeBullets[item.id] || { status: 'pending' };
          const displayText = state.customText || item.suggestedBullet;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition-all duration-200 ${
                state.status === 'accepted'
                  ? 'bg-emerald-500/[0.03] border-emerald-500/30'
                  : state.status === 'rejected'
                  ? 'bg-[#121212]/50 border-white/5 opacity-60'
                  : 'bg-[#121212] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Context Tag */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono text-[#888888] bg-white/5 px-2 py-0.5 rounded">
                  Target: {item.targetRoleOrSkill}
                </span>

                {state.status === 'accepted' && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accepted for Resume
                  </span>
                )}
                {state.status === 'rejected' && (
                  <span className="text-xs text-[#777777]">Keeping Original</span>
                )}
              </div>

              {/* Before */}
              <div className="p-3 bg-black/40 border border-white/5 rounded-lg mb-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#7E7E7E] mb-1">
                  Original Resume Bullet
                </div>
                <p className="text-xs text-[#A0A0A0] leading-relaxed line-through decoration-white/20">
                  {item.originalBullet}
                </p>
              </div>

              {/* After / Editor */}
              <div className="p-3.5 bg-brand-crimson/[0.04] border border-brand-crimson/20 rounded-lg mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand-crimson font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Job-Aligned Rewrite
                  </div>
                  <button
                    onClick={() => handleCopy(displayText, item.id)}
                    className="text-xs text-[#888888] hover:text-white flex items-center gap-1 transition-colors"
                    title="Copy bullet"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="text-[10px]">{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {state.status === 'editing' ? (
                  <textarea
                    rows={3}
                    value={displayText}
                    onChange={(e) =>
                      setActiveBullets((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], customText: e.target.value }
                      }))
                    }
                    className="w-full bg-[#161616] border border-white/20 rounded p-2 text-xs text-white focus:outline-none focus:border-brand-crimson"
                  />
                ) : (
                  <p className="text-xs font-medium text-white leading-relaxed">
                    {/* Highlight [placeholder] tokens if present */}
                    {displayText.split(/(\[.*?\])/g).map((part, i) =>
                      part.startsWith('[') && part.endsWith(']') ? (
                        <span
                          key={i}
                          className="bg-amber-500/15 text-amber-300 font-mono px-1 py-0.5 rounded border border-amber-500/30 inline-block my-0.5"
                          title="Replace with your authentic metric"
                        >
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>
                )}
              </div>

              {/* Rationale */}
              <p className="text-[11px] text-[#888888] italic mb-4">
                <strong>Why it works:</strong> {item.rationale}
              </p>

              {/* Interactive Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleUseSuggestion(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    state.status === 'accepted'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-brand-crimson hover:bg-red-700 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {state.status === 'accepted' ? 'Suggestion Applied' : 'Use Suggestion'}
                </button>

                <button
                  onClick={() => handleToggleEdit(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-[#D0D0D0] hover:text-white border border-white/5 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {state.status === 'editing' ? 'Save Edit' : 'Edit'}
                </button>

                <button
                  onClick={() => handleKeepOriginal(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#777777] hover:text-[#AAAAAA] flex items-center gap-1 transition-all ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  Keep Original
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
