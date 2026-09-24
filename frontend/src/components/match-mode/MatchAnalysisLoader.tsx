import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Search, Cpu, BarChart3, Layers, FileCheck } from 'lucide-react';
import { MatchAnalysisStage } from './types';

interface MatchAnalysisLoaderProps {
  onComplete?: () => void;
  stages?: MatchAnalysisStage[];
}

const DEFAULT_STAGES: MatchAnalysisStage[] = [
  { id: '1', label: 'Reading job requirements...', icon: 'Search' },
  { id: '2', label: 'Extracting required skills & technologies...', icon: 'Cpu' },
  { id: '3', label: 'Comparing your experience with expectations...', icon: 'Layers' },
  { id: '4', label: 'Checking keyword alignment & density...', icon: 'BarChart3' },
  { id: '5', label: 'Identifying recruiter gaps & missing proof...', icon: 'FileCheck' },
  { id: '6', label: 'Calculating match score & improvement potential...', icon: 'Sparkles' }
];

export const MatchAnalysisLoader: React.FC<MatchAnalysisLoaderProps> = ({
  onComplete,
  stages = DEFAULT_STAGES
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  useEffect(() => {
    const stageDuration = 380; // Total ~2.3 seconds
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < stages.length - 1) {
          setCompletedStages((comp) => [...comp, prev]);
          return prev + 1;
        } else {
          setCompletedStages((comp) => [...comp, prev]);
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 400);
          }
          return prev;
        }
      });
    }, stageDuration);

    return () => clearInterval(interval);
  }, [stages.length, onComplete]);

  const progressPercent = Math.min(100, Math.round(((completedStages.length + 1) / stages.length) * 100));

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-6 flex flex-col items-center text-center">
      {/* Animated Glowing Ring */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-crimson/20 via-brand-crimson/5 to-transparent flex items-center justify-center border border-brand-crimson/40 animate-pulse">
          <Sparkles className="w-10 h-10 text-brand-crimson animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div className="absolute -inset-2 bg-brand-crimson/10 rounded-full blur-xl -z-10 animate-pulse" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Analyzing Job Alignment</h3>
      <p className="text-sm text-[#9A9A9A] mb-8 max-w-md">
        Comparing your resume syntax, experience scope, and skill profile against the job description...
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-[#1A1A1A] h-2 rounded-full mb-8 overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-brand-crimson via-red-500 to-amber-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step by Step Stage List */}
      <div className="w-full space-y-3 text-left">
        {stages.map((stage, idx) => {
          const isDone = completedStages.includes(idx);
          const isCurrent = currentStageIndex === idx && !isDone;
          const isPending = !isDone && !isCurrent;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                isCurrent
                  ? 'bg-brand-crimson/10 border-brand-crimson/30 text-white shadow-sm shadow-brand-crimson/10'
                  : isDone
                  ? 'bg-[#111111] border-emerald-500/20 text-emerald-400'
                  : 'bg-[#0D0D0D] border-white/5 text-[#555555]'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-brand-crimson border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/10" />
                )}
              </div>
              <span className={`text-xs sm:text-sm font-medium ${isCurrent ? 'text-white' : ''}`}>
                {stage.label}
              </span>
              {isDone && (
                <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-semibold">
                  Complete
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
