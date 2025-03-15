/**
 * Constants used throughout the application
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * API configuration
 */
export const API = {
  /** Gemini API base endpoint */
  ENDPOINT: 'https://generativelanguage.googleapis.com/v1alpha/models',
  
  /** Gemini API key from environment variables */
  API_KEY: process.env.GEMINI_API_KEY || '',
  
  /** Whether using paid tier (for rate limits) */
  IS_PAID_TIER: process.env.GEMINI_PAID_TIER === 'true',
  
  /** Default model ID from environment or fallback */
  DEFAULT_MODEL_ID: process.env.DEFAULT_MODEL_ID || 'gemini-2.0-flash-001',
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  /** Maximum number of retries for rate limited requests */
  MAX_RETRIES: 5,
  
  /** Base delay for exponential backoff (milliseconds) */
  BASE_DELAY_MS: 1000,
  
  /** Maximum delay for exponential backoff (milliseconds) */
  MAX_DELAY_MS: 60000,
  
  /** Jitter factor for randomizing backoff delays (0-1) */
  JITTER_FACTOR: 0.2
};

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  /** API key missing error */
  API_KEY_MISSING: 'GEMINI_API_KEY environment variable is required',
  
  /** Rate limit error template */
  RATE_LIMIT: (modelId: string, timeInSeconds: number) => 
    `Rate limit reached for ${modelId}. Try again in ${timeInSeconds} seconds.`,
  
  /** Thinking capability error */
  THINKING_NOT_SUPPORTED: (modelDisplayName: string) => 
    `Thinking mode is not supported by ${modelDisplayName}. Please use Gemini 2.0 Flash Thinking Experimental.`,
  
  /** Search capability error */
  SEARCH_NOT_SUPPORTED: (modelDisplayName: string) => 
    `Search integration is not supported by ${modelDisplayName}. Please use Gemini 2.0 Flash or Flash-Lite.`,
};

/**
 * Response formatting
 */
export const RESPONSE_FORMAT = {
  /** Section headings for different response components */
  SECTIONS: {
    THINKING: '### Thinking Process:',
    RESPONSE: '### Final Response:',
    SEARCH: '### Search Results:'
  }
};

/**
 * Function names for tool handlers
 */
export const TOOL_NAMES = {
  SEARCH: 'gemini_search',
  RAPID_SEARCH: 'gemini_rapid_search',
  REASON: 'gemini_reason',
  ANALYZE_FILE: 'gemini_analyze_file',
};
