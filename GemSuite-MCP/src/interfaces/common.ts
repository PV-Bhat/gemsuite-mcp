/**
 * Common interfaces and types for Gemini MCP
 */

/**
 * Mapping of task types to recommended models
 */
export enum TaskType {
  GENERAL_SEARCH = 'general_search',
  RAPID_SEARCH = 'rapid_search',
  RAPID_PROCESSING = 'rapid_processing',
  COMPLEX_REASONING = 'complex_reasoning',
  FILE_ANALYSIS = 'file_analysis'
}

/**
 * Gemini model configuration interface
 */
export interface GeminiModel {
  /** Model ID used in API requests */
  id: string;
  
  /** Human-readable model name */
  displayName: string;
  
  /** Maximum context window size in tokens */
  contextWindow: number;
  
  /** Maximum output tokens */
  maxOutputTokens: number;
  
  /** Maximum requests per minute (free tier) */
  freeRpm: number;
  
  /** Model capabilities */
  capabilities: {
    /** Whether the model supports Google Search integration */
    search: boolean;
    
    /** Whether the model supports thinking mode */
    thinking: boolean;
    
    /** Whether the model supports multimodal inputs */
    multimodal: boolean;
    
    /** Whether the model is optimized for fast responses */
    fastResponse: boolean;
  };
  
  /** Primary use cases for this model */
  useCases: string[];
}

/**
 * API response interface
 */
export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    grounding_metadata?: {
      search_entry_point?: {
        rendered_content?: string;
      };
    };
  }>;
}

/**
 * Base arguments for tool requests
 */
export interface BaseArgs {
  /** Optional model ID override */
  model_id?: string;
}

/**
 * File input options
 */
export interface FileInput {
  /** Path to a file */
  file_path?: string | string[];
}

/**
 * Generation configuration
 */
export interface GenerationConfig {
  /** Temperature for generation */
  temperature?: number;
  
  /** Top-p sampling */
  top_p?: number;
  
  /** Top-k sampling */
  top_k?: number;
  
  /** Maximum output tokens */
  max_output_tokens?: number;
}
