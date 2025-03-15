import { BaseArgs, FileInput, GenerationConfig } from './common.js';

/**
 * Arguments for gemini_search tool
 */
export interface SearchArgs extends BaseArgs, FileInput {
  /** The search query */
  query: string;
  
  /** Whether to enable thinking mode */
  enable_thinking?: boolean;
}

/**
 * Arguments for gemini_reason tool
 */
export interface ReasonArgs extends BaseArgs, FileInput {
  /** The problem to solve */
  problem: string;
  
  /** Whether to show reasoning steps */
  show_steps?: boolean;
}

/**
 * Arguments for gemini_process tool
 */
export interface ProcessArgs extends BaseArgs, FileInput {
  /** Content to process */
  content?: string;
  
  /** Operation to perform */
  operation?: 'summarize' | 'extract' | 'restructure' | 'simplify' | 'expand' | 'critique' | 'feedback' | 'analyze';
}

/**
 * Arguments for gemini_analyze tool
 */
export interface AnalyzeArgs extends BaseArgs, FileInput {
  /** Instruction for analysis */
  instruction?: string;
}
