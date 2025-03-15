/**
 * Type guard for Axios errors
 */
function isAxiosError(error: any): boolean {
  return error && error.isAxiosError === true;
}
import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MODELS } from '../config/models.js';

/**
 * Custom error class for Gemini API errors
 */
export class GeminiError extends Error {
  /** HTTP status code (if applicable) */
  status?: number;
  
  /** Error code for categorization */
  code: string;
  
  /** Whether the error is a rate limit error */
  isRateLimit: boolean;
  
  /** Whether the error is retriable */
  isRetriable: boolean;
  
  /**
   * Creates a new GeminiError
   * @param message Error message
   * @param status HTTP status code (if applicable)
   * @param code Error code
   * @param isRateLimit Whether it's a rate limit error
   * @param isRetriable Whether the error is retriable
   */
  constructor(
    message: string, 
    status?: number, 
    code = 'UNKNOWN_ERROR',
    isRateLimit = false,
    isRetriable = false
  ) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.code = code;
    this.isRateLimit = isRateLimit;
    this.isRetriable = isRetriable;
  }
}

/**
 * Categorizes and handles API errors
 * @param error The error to handle
 * @param modelId The model ID that was being used
 * @returns A standardized GeminiError
 */
export function handleApiError(error: unknown, modelId?: string): GeminiError {
  // Get model display name if available
  let modelDisplay = 'Gemini API';
  if (modelId && MODELS[modelId]) {
    modelDisplay = MODELS[modelId].displayName;
  }

  // Handle Axios errors (API errors)
  if (isAxiosError(error) && (error as any).response) {
    const status = (error as any).response.status;
    const data = (error as any).response.data;
    
    switch (status) {
      case 400:
        return new GeminiError(
          `Invalid request to ${modelDisplay}: ${getErrorMessage(data)}`,
          status,
          'INVALID_REQUEST',
          false,
          false
        );
      
      case 401:
        return new GeminiError(
          `Unauthorized: Check your Gemini API key`,
          status,
          'UNAUTHORIZED',
          false,
          false
        );
      
      case 403:
        return new GeminiError(
          `Forbidden: You don't have access to ${modelDisplay}`,
          status,
          'FORBIDDEN',
          false,
          false
        );
      
      case 404:
        return new GeminiError(
          `Model not found: ${modelDisplay}`,
          status,
          'NOT_FOUND',
          false,
          false
        );
      
      case 429:
        return new GeminiError(
          `Rate limit exceeded for ${modelDisplay}. Please try again later.`,
          status,
          'RATE_LIMIT_EXCEEDED',
          true,
          true
        );
      
      case 500:
      case 501:
      case 502:
      case 503:
        return new GeminiError(
          `${modelDisplay} server error: ${getErrorMessage(data)}. Please try again later.`,
          status,
          'SERVER_ERROR',
          false,
          true
        );
      
      default:
        return new GeminiError(
          `${modelDisplay} API error: ${getErrorMessage(data)}`,
          status,
          'API_ERROR',
          false,
          status >= 500 // Server errors are retriable
        );
    }
  }
  
  // Handle GeminiError that might be passed through
  if (error instanceof GeminiError) {
    return error;
  }
  
  // Handle general Error objects
  if (error instanceof Error) {
    return new GeminiError(
      error.message,
      undefined,
      'UNKNOWN_ERROR',
      error.message.includes('rate limit'),
      error.message.includes('rate limit')
    );
  }
  
  // Handle completely unknown errors
  return new GeminiError(
    `Unknown error occurred with ${modelDisplay}`,
    undefined,
    'UNKNOWN_ERROR',
    false,
    false
  );
}

/**
 * Formats an error response for the MCP protocol
 * @param error The error to format
 * @returns Formatted error response for MCP
 */
export function formatErrorResponse(error: unknown): any {
  const geminiError = error instanceof GeminiError 
    ? error 
    : handleApiError(error);
  
  return {
    content: [
      {
        type: 'text',
        text: geminiError.message,
      },
    ],
    isError: true,
    metadata: {
      errorCode: geminiError.code,
      status: geminiError.status,
      isRetriable: geminiError.isRetriable
    }
  };
}

/**
 * Converts an API error to an MCP error
 * @param error The error to convert
 * @returns An MCP error
 */
export function toMcpError(error: unknown): McpError {
  const geminiError = error instanceof GeminiError 
    ? error 
    : handleApiError(error);
  
  // Map Gemini error codes to MCP error codes
  let mcpErrorCode: ErrorCode;
  switch (geminiError.code) {
    case 'INVALID_REQUEST':
      mcpErrorCode = ErrorCode.InvalidParams;
      break;
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      mcpErrorCode = ErrorCode.InvalidParams;
      break;
    case 'NOT_FOUND':
      mcpErrorCode = ErrorCode.MethodNotFound;
      break;
    case 'RATE_LIMIT_EXCEEDED':
      mcpErrorCode = ErrorCode.InternalError;
      break;
    case 'SERVER_ERROR':
      mcpErrorCode = ErrorCode.InternalError;
      break;
    default:
      mcpErrorCode = ErrorCode.InternalError;
  }
  
  return new McpError(mcpErrorCode, geminiError.message);
}

/**
 * Extracts error message from API response data
 * @param data API response data
 * @returns Extracted error message or default message
 */
function getErrorMessage(data: any): string {
  if (data?.error?.message) {
    return data.error.message;
  }
  
  if (data?.error) {
    return JSON.stringify(data.error);
  }
  
  return 'Unknown error';
}
