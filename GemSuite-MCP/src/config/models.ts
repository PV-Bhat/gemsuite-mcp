/**
 * Configuration for supported Gemini models
 */
import { GeminiModel, TaskType } from '../interfaces/common.js';

/**
 * Available Gemini models with their capabilities
 */
export const MODELS: Record<string, GeminiModel> = {
  'gemini-2.0-flash-001': {
    id: 'gemini-2.0-flash-001',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: true,
      thinking: false,
      multimodal: true,
      fastResponse: false
    },
    useCases: [
      'General knowledge questions',
      'Information retrieval with search',
      'Processing multimodal inputs',
      'Balanced performance and speed'
    ]
  },
  'gemini-2.0-flash-lite-001': {
    id: 'gemini-2.0-flash-lite-001',
    displayName: 'Gemini 2.0 Flash-Lite',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: false,
      thinking: false,
      multimodal: true,
      fastResponse: true
    },
    useCases: [
      'High-volume text processing',
      'Rapid file analysis',
      'Cost-efficient processing',
      'Speed-critical applications'
    ]
  },
  'gemini-2.0-flash-thinking-exp-01-21': {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    displayName: 'Gemini 2.0 Flash Thinking Experimental',
    contextWindow: 128000,
    maxOutputTokens: 64000,
    freeRpm: 10,
    capabilities: {
      search: false,
      thinking: true,
      multimodal: true,
      fastResponse: false
    },
    useCases: [
      'Complex reasoning tasks',
      'Math and science problems',
      'Coding challenges',
      'Step-by-step problem solving'
    ]
  }
};

/**
 * Get the recommended model ID for a specific task type
 */
export function getModelForTask(taskType: TaskType): string {
  switch (taskType) {
    case TaskType.GENERAL_SEARCH:
      return 'gemini-2.0-flash-001';
    case TaskType.RAPID_PROCESSING:
      return 'gemini-2.0-flash-lite-001';
    case TaskType.COMPLEX_REASONING:
      return 'gemini-2.0-flash-thinking-exp-01-21';
    case TaskType.FILE_ANALYSIS:
      return 'gemini-2.0-flash-001';
    default:
      return 'gemini-2.0-flash-001';
  }
}

/**
 * Get the recommended model ID based on file type
 */
export function getModelForFileType(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'gemini-2.0-flash-001'; // Flash for image analysis
    
    case 'pdf':
    case 'doc':
    case 'docx':
      return 'gemini-2.0-flash-001'; // Flash for document analysis
    
    case 'txt':
    case 'md':
    case 'csv':
    case 'json':
      return 'gemini-2.0-flash-lite-001'; // Flash-Lite for text files
    
    case 'code':
    case 'js':
    case 'ts':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'cs':
      return 'gemini-2.0-flash-thinking-exp-01-21'; // Flash Thinking for code
    
    default:
      return 'gemini-2.0-flash-001'; // Default to Flash
  }
}

/**
 * Default model to use when no specific model is specified
 */
export const DEFAULT_MODEL_ID = 'gemini-2.0-flash-001';

// Re-export TaskType for convenience
export { TaskType };
