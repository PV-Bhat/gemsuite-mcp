/**
 * Model selection utilities for Gemini API
 */
import { getFileTypeCategory } from './file-handler.js';
import { TaskType } from '../interfaces/common.js';
import path from 'path';

// Model IDs
export const MODELS = {
  FLASH: 'gemini-2.0-flash-001',
  FLASH_LITE: 'gemini-2.0-flash-lite-001',
  FLASH_THINKING: 'gemini-2.0-flash-thinking-exp-01-21'
};

// Re-export TaskType for convenience
export { TaskType };

/**
 * Get the recommended model ID based on file type
 * @param {string} filePath - Path to the file
 * @returns {string} - Recommended model ID
 */
export function getModelForFile(filePath: string): string {
  if (!filePath) return MODELS.FLASH;
  
  const category = getFileTypeCategory(filePath);
  const extension = path.extname(filePath).toLowerCase();
  
  switch (category) {
    case 'image':
      return MODELS.FLASH; // Images require Flash for proper multimodal capabilities
    
    case 'document':
      return MODELS.FLASH; // Documents work best with Flash
    
    case 'code':
      return MODELS.FLASH_THINKING; // Code analysis benefits from thinking capabilities
    
    case 'text':
      // For most text files, Flash-Lite is efficient
      // But for structured data, use standard Flash
      if (['.csv', '.json', '.xml'].includes(extension)) {
        return MODELS.FLASH;
      }
      return MODELS.FLASH_LITE;
    
    default:
      return MODELS.FLASH;
  }
}

/**
 * Get the recommended model ID based on task type
 * @param {TaskType} taskType - Type of task
 * @returns {string} - Recommended model ID
 */
export function getModelForTask(taskType: TaskType): string {
  switch (taskType) {
    case TaskType.GENERAL_SEARCH:
      return MODELS.FLASH; // Search requires Flash
    
    case TaskType.COMPLEX_REASONING:
      return MODELS.FLASH_THINKING; // Reasoning benefits from thinking capabilities
    
    case TaskType.RAPID_PROCESSING:
      return MODELS.FLASH_LITE; // Processing is efficient with Flash-Lite
    
    case TaskType.FILE_ANALYSIS:
      return MODELS.FLASH; // Analysis often needs Flash capabilities
    
    default:
      return MODELS.FLASH;
  }
}

/**
 * Interface for model selection options
 */
interface ModelSelectionOptions {
  /** User-specified model ID */
  modelId?: string;
  /** Type of task */
  taskType?: TaskType;
  /** File path or array of file paths */
  filePath?: string | string[];
  /** Whether thinking mode is required */
  thinking?: boolean;
  /** Whether search integration is required */
  searchRequired?: boolean;
  /** Whether cost efficiency is a priority */
  costEfficient?: boolean;
}

/**
 * Select the most appropriate model based on task, file, and user preference
 * @param {ModelSelectionOptions} options - Selection options
 * @returns {string} - Selected model ID
 */
export function selectModel(options: ModelSelectionOptions): string {
  // User-specified model has highest priority
  if (options.modelId) return options.modelId;
  
  // If thinking is required, use Flash Thinking
  if (options.thinking) return MODELS.FLASH_THINKING;
  
  // If search is required, use Flash
  if (options.searchRequired) return MODELS.FLASH;
  
  // If cost efficiency is a priority, use Flash-Lite
  if (options.costEfficient) return MODELS.FLASH_LITE;
  
  // If files are provided, select based on file type
  if (options.filePath) {
    // For multiple files, use the most capable model required by any file
    if (Array.isArray(options.filePath)) {
      let needsFlash = false;
      let needsThinking = false;
      
      for (const file of options.filePath) {
        const category = getFileTypeCategory(file);
        if (category === 'image' || category === 'document') needsFlash = true;
        if (category === 'code') needsThinking = true;
      }
      
      if (needsThinking) return MODELS.FLASH_THINKING;
      if (needsFlash) return MODELS.FLASH;
      return MODELS.FLASH_LITE;
    } else {
      return getModelForFile(options.filePath);
    }
  }
  
  // If task type is provided, select based on task
  if (options.taskType) {
    return getModelForTask(options.taskType);
  }
  
  // Default to Flash
  return MODELS.FLASH;
}
