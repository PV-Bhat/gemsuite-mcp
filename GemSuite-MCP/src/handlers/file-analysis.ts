import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MODELS, TaskType, getModelForTask } from '../config/models.js';
import { API, TOOL_NAMES } from '../config/constants.js';
import { rateLimitManager } from '../utils/rate-limiter.js';
import { formatErrorResponse } from '../utils/error-handler.js';
import { formatResponse, ResponseOptions } from '../utils/response-formatter.js';

/**
 * Interface for file analysis arguments
 */
export interface AnalyzeFileArgs {
  /** Path to the file to analyze */
  file_path: string;
  
  /** Optional specific question about the file */
  query?: string;
  
  /** Optional model ID override */
  modelId?: string;
}

/**
 * Interface for multiple file analysis arguments
 */
export interface AnalyzeFilesArgs {
  /** Paths to the files to analyze */
  file_paths: string[];
  
  /** Optional specific question about the files */
  query?: string;
  
  /** Optional model ID override */
  modelId?: string;
}

/**
 * Handles file analysis requests
 * @param request The MCP request
 * @returns The MCP response
 */
export async function handleAnalyzeFile(request: any) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.file_path !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'File path parameter is required and must be a string'
      );
    }

    // Extract and parse arguments
    const args: AnalyzeFileArgs = {
      file_path: request.params.arguments.file_path,
      query: request.params.arguments.query || 'Analyze this file and describe its contents.',
      modelId: request.params.arguments.modelId
    };

    // Select appropriate model or use provided model
    const modelId = args.modelId || getModelForTask(TaskType.FILE_ANALYSIS);
    
    // Get model configuration
    const model = MODELS[modelId];
    if (!model) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown model: ${modelId}`
      );
    }

    // Check if model supports multimodal input
    if (!model.capabilities.multimodal) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `The model ${model.displayName} does not support multimodal inputs`
      );
    }

    // Read and process the file
    try {
      const fileData = await fs.readFile(args.file_path);
      const base64Data = fileData.toString('base64');
      const mimeType = getMimeType(args.file_path);

      // Prepare the request body
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            },
            {
              text: args.query
            }
          ]
        }]
      };

      // Execute the API call with retry logic
      const endpoint = `${API.ENDPOINT}/${modelId}:generateContent?key=${API.API_KEY}`;
      
      const response = await rateLimitManager.executeWithRetry(modelId, async () => {
        const response = await axios.post(endpoint, requestBody);
        return response.data;
      });

      // Format the response
      const responseOptions: ResponseOptions = {
        includeThinking: false,
        includeSearch: false,
        customFormat: {
          operation: TOOL_NAMES.ANALYZE_FILE,
          fileName: path.basename(args.file_path)
        }
      };

      return formatResponse(response, modelId, responseOptions);
    } catch (error) {
      if (error instanceof Error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error reading file: ${error.message}`
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in analyze file handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return formatErrorResponse(error);
  }
}

/**
 * Handles multiple file analysis requests
 * @param request The MCP request
 * @returns The MCP response
 */
export async function handleAnalyzeFiles(request: any) {
  try {
    // Validate required parameters
    if (!request.params.arguments || !Array.isArray(request.params.arguments.file_paths)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'file_paths parameter is required and must be an array of strings'
      );
    }

    // Extract and parse arguments
    const args: AnalyzeFilesArgs = {
      file_paths: request.params.arguments.file_paths,
      query: request.params.arguments.query || 'Analyze these files and describe their contents.',
      modelId: request.params.arguments.modelId
    };

    // Select appropriate model or use provided model
    const modelId = args.modelId || getModelForTask(TaskType.FILE_ANALYSIS);
    
    // Get model configuration
    const model = MODELS[modelId];
    if (!model) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown model: ${modelId}`
      );
    }

    // Check if model supports multimodal input
    if (!model.capabilities.multimodal) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `The model ${model.displayName} does not support multimodal inputs`
      );
    }

    try {
      // Process all files
      const fileParts = await Promise.all(
        args.file_paths.map(async (filePath) => {
          const fileData = await fs.readFile(filePath);
          const base64Data = fileData.toString('base64');
          const mimeType = getMimeType(filePath);
          
          return {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          };
        })
      );

      // Prepare the request body
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [
            ...fileParts,
            {
              text: args.query
            }
          ]
        }]
      };

      // Execute the API call with retry logic
      const endpoint = `${API.ENDPOINT}/${modelId}:generateContent?key=${API.API_KEY}`;
      
      const response = await rateLimitManager.executeWithRetry(modelId, async () => {
        const response = await axios.post(endpoint, requestBody);
        return response.data;
      });

      // Format the response
      const responseOptions: ResponseOptions = {
        includeThinking: false,
        includeSearch: false,
        customFormat: {
          operation: 'analyze_files',
          fileCount: args.file_paths.length,
          fileNames: args.file_paths.map(filePath => path.basename(filePath))
        }
      };

      return formatResponse(response, modelId, responseOptions);
    } catch (error) {
      if (error instanceof Error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error processing files: ${error.message}`
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in analyze files handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return formatErrorResponse(error);
  }
}

/**
 * Gets the MIME type for a file based on its extension
 * @param filePath Path to the file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    case '.md':
      return 'text/markdown';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Determines file type from file path
 * Used for model selection
 */
function getFileType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
    return 'image';
  } else if (extension === '.pdf') {
    return 'pdf';
  } else {
    return 'text';
  }
}

/**
 * Selects the appropriate model for file type
 */
function selectModelForFileType(fileType: string): string {
  // For now, we just use the general file analysis model
  return getModelForTask(TaskType.FILE_ANALYSIS);
}
