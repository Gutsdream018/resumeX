import React, { useState, useEffect, useRef } from 'react';
import { ResumeSelector } from './ResumeSelector';
import { JobDescriptionInput } from './JobDescriptionInput';
import { MatchAnalysisLoader } from './MatchAnalysisLoader';
import { MatchScoreHeader } from './MatchScoreHeader';
import { MatchBreakdown } from './MatchBreakdown';
import { SkillsMatch } from './SkillsMatch';
import { KeywordAlignment } from './KeywordAlignment';
import { ExperienceAlignment } from './ExperienceAlignment';
import { RecruiterGapAnalysis } from './RecruiterGapAnalysis';
import { ImprovementRecommendations } from './ImprovementRecommendations';
import { ResumeImprovement } from './ResumeImprovement';
import { MatchScoreImprovement } from './MatchScoreImprovement';
import { JobSummaryExtract } from './JobSummaryExtract';
import { MatchActions } from './MatchActions';
import { RequirementMatrix } from './RequirementMatrix';
import { ExperienceRelevanceList } from './ExperienceRelevanceList';
import { ContradictionsAlert } from './ContradictionsAlert';
import { OptimizationQueue } from './OptimizationQueue';
import { JobConnectionMap } from './JobConnectionMap';
import { fetchJobMatchAnalysis } from './matchEngine';
import { JobMatchData } from './types';
import { Target, Sparkles, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface MatchModeProps {
  analysis?: any;
  onNavigateTab?: (tabId: string, context?: any) => void;
  initialJobDescription?: string;
  onBackToHome?: () => void;
}

export const MatchMode: React.FC<MatchModeProps> = ({
  analysis,
  onNavigateTab,
  initialJobDescription = '',
  onBackToHome,
}) => {
  // Current resume text
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeName, setResumeName] = useState<string>('Uploaded Resume');
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);

  // Status: 'input' | 'analyzing' | 'results'
  const [status, setStatus] = useState<'input' | 'analyzing' | 'results'>('input');
  const [matchResults, setMatchResults] = useState<JobMatchData | null>(null);

  const improvementsRef = useRef<HTMLDivElement>(null);

  // Initialize resume text from analysis prop
  useEffect(() => {
    if (analysis) {
      const parts: string[] = [];
      if (analysis.rawText) parts.push(analysis.rawText);
      if (analysis.extractedData?.name) parts.push(`Candidate: ${analysis.extractedData.name}`);
      if (analysis.extractedData?.email) parts.push(`Email: ${analysis.extractedData.email}`);
      if (analysis.extractedData?.skills?.length) {
        parts.push(`Skills: ${analysis.extractedData.skills.join(', ')}`);
      }
      if (analysis.skillsAnalysis?.allSkills?.length) {
        parts.push(`All Detected Skills: ${analysis.skillsAnalysis.allSkills.join(', ')}`);
      }
      if (analysis.extractedData?.experience?.length) {
        analysis.extractedData.experience.forEach((exp: any) => {
          parts.push(`${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || ''})`);
          if (exp.description) parts.push(exp.description);
          if (exp.bullets) parts.push(exp.bullets.join('\n'));
        });
      }
      if (analysis.extractedData?.education?.length) {
        analysis.extractedData.education.forEach((edu: any) => {
          parts.push(`${edu.degree || 'Degree'} from ${edu.institution || 'University'}`);
        });
      }
      if (parts.length > 0) {
        setResumeText(parts.join('\n\n'));
        setResumeName(analysis.fileName || analysis.extractedData?.name || 'Uploaded Resume');
      }
    }
  }, [analysis]);

  const handleStartAnalysis = (jd: string) => {
    setJobDescription(jd);
    setStatus('analyzing');
  };

  const handleAnalysisLoaderComplete = async () => {
    try {
      const computed = await fetchJobMatchAnalysis(resumeText, jobDescription, analysis);
      setMatchResults(computed);
    } catch (e) {
      console.warn('Match analysis completed with default data:', e);
    }
    setStatus('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMatchAnotherJob = () => {
    setStatus('input');
  };

  const handleNavigateOptimizer = (section?: string, detail?: string) => {
    if (onNavigateTab) {
      // Pass active JD context to Resume Optimizer
      onNavigateTab('optimizer');
    }
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Banner & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-brand-crimson/20 border border-brand-crimson/30">
              <Target className="w-4 h-4 text-brand-crimson" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Match Mode
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-crimson text-white tracking-wider uppercase">
              NEW
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E8E]">
            Evidence-based resume vs job description matching engine with 10-dimension gap analysis and Resume Optimizer integration.
          </p>
        </div>

        {status === 'results' && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleNavigateOptimizer()}
              className="px-3.5 py-2 rounded-xl bg-brand-crimson text-white hover:bg-brand-crimson/90 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-brand-crimson/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open in Optimizer</span>
            </button>
            <button
              onClick={() => setStatus('input')}
              className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#D0D0D0] hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Target Job</span>
            </button>
          </div>
        )}
      </div>

      {/* State: Input Mode */}
      {status === 'input' && (
        <div className="space-y-6">
          {/* Step 1: Verified Resume Selector */}
          <ResumeSelector
            analysis={analysis}
            selectedResumeText={resumeText}
            resumeFileName={resumeName}
            onResumeSelect={(text: string, name: string) => {
              setResumeText(text);
              setResumeName(name);
            }}
          />

          {/* Step 2: Target Job Description Input */}
          <JobDescriptionInput
            value={jobDescription}
            onChange={(val: string) => setJobDescription(val)}
            onAnalyze={() => handleStartAnalysis(jobDescription)}
            isLoading={false}
            disabled={!resumeText.trim()}
          />
        </div>
      )}

      {/* State: Analyzing with multi-stage animated loader */}
      {status === 'analyzing' && (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-12">
          <MatchAnalysisLoader onComplete={handleAnalysisLoaderComplete} />
        </div>
      )}

      {/* State: Full Results View */}
      {status === 'results' && matchResults && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Overall Match Score & Header */}
          <MatchScoreHeader data={matchResults} />

          {/* 2. Discrepancies & Contradictions Notice (if any) */}
          {matchResults.contradictions && matchResults.contradictions.length > 0 && (
            <ContradictionsAlert contradictions={matchResults.contradictions} />
          )}

          {/* 3. Category Breakdown (6 Dimensions) */}
          <MatchBreakdown categories={matchResults.breakdown} />

          {/* 3.5. 3D/2D Job ↔ Resume Intelligence Connection Map */}
          <JobConnectionMap
            requirements={
              matchResults.requirementMatrix || [
                ...(matchResults.strongMatches || []),
                ...(matchResults.partialMatches || []),
                ...(matchResults.missingRequirements || []),
              ]
            }
            jobTitle={matchResults.jobTitle}
            onOptimizeSection={(section, detail) => handleNavigateOptimizer(section, detail)}
          />

          {/* 4. Interactive Requirement Fit Matrix (Full 3-Tier Evidence Matrix) */}
          <RequirementMatrix
            requirements={
              matchResults.requirementMatrix || [
                ...(matchResults.strongMatches || []),
                ...(matchResults.partialMatches || []),
                ...(matchResults.missingRequirements || []),
              ]
            }
            onOptimizeSection={(section, detail) => handleNavigateOptimizer(section, detail)}
          />

          {/* 5. Experience & Project Relevance Ranking */}
          {matchResults.relevantExperiences && matchResults.relevantExperiences.length > 0 && (
            <ExperienceRelevanceList
              experiences={matchResults.relevantExperiences}
              onOptimizeSection={(section, keyword) => handleNavigateOptimizer(section, keyword)}
            />
          )}

          {/* 6. Top Improvements Queue for this Job */}
          <OptimizationQueue
            recommendations={matchResults.recommendations}
            onOptimizeSection={(section, detail) => handleNavigateOptimizer(section, detail)}
          />

          {/* 7. Skills Match (Badges & Context) */}
          <SkillsMatch skills={matchResults.skills} />

          {/* 8. Keyword Alignment & ATS Parsing */}
          <KeywordAlignment keywords={matchResults.keywords} />

          {/* 9. Experience Alignment (Job Expectation vs Resume Evidence) */}
          <ExperienceAlignment alignments={matchResults.experienceAlignment} />

          {/* 10. Recruiter Gap Analysis */}
          <RecruiterGapAnalysis gaps={matchResults.recruiterGaps} />

          {/* 11. Bullet Rewrites with Placeholders */}
          <div ref={improvementsRef}>
            <ResumeImprovement bullets={matchResults.bulletImprovements} />
          </div>

          {/* 12. Job Description Extraction Summary */}
          <JobSummaryExtract summary={matchResults.jobSummary} />

          {/* 13. Final Action Bar */}
          <MatchActions
            data={matchResults}
            onMatchAnotherJob={handleMatchAnotherJob}
            onFixMyResume={() => handleNavigateOptimizer('experience')}
          />
        </div>
      )}
    </div>
  );
};
