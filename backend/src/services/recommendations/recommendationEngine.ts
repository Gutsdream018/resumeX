import { FinalAnalysisObject } from '../../models/resume.types.js';
import { runComprehensiveAtsPipeline, PipelineExecutionOptions } from '../../engine/pipeline.js';

export type PipelineOptions = PipelineExecutionOptions;

export async function processResumePipeline(
  rawText: string,
  options: PipelineOptions
): Promise<FinalAnalysisObject> {
  const result = await runComprehensiveAtsPipeline(rawText, options);
  return result as unknown as FinalAnalysisObject;
}
