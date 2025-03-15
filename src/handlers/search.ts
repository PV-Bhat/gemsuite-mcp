import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MODELS, DEFAULT_MODEL_ID, TaskType, getModelForTask } from '../config/models.js';
import { API, ERROR_MESSAGES, TOOL_NAMES } from '../config/constants.js';
import { rateLimitManager } from '../utils/rate-limiter.js';
import { formatErrorResponse, toMcpError } from '../utils/error-handler.js';
import { formatResponse, ResponseOptions } from '../utils/response-formatter.js';

/**
 * Interface for search arguments
 */
export interface SearchArgs {
  /** The search query */
  query: string;
  
  /** Optional model ID override */
  modelId?: string;
  
  /** Whether to enable thinking mode */
  enableThinking?: boolean;
  
  /** Whether this is a high-volume search operation */
  highVolume?: boolean;
}

/**
 * Handles the standard search operation
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleSearch(request: any) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query parameter is required and must be a string'
      );
    }

    // Extract and parse arguments
    const args: SearchArgs = {
      query: request.params.arguments.query,
      modelId: request.params.arguments.modelId,
      enableThinking: !!request.params.arguments.enableThinking,
      highVolume: !!request.params.arguments.highVolume
    };

    // Select appropriate model based on task requirements
    const modelId = selectModelForSearch(args);
    
    // Get model configuration
    const model = MODELS[modelId];
    if (!model) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown model: ${modelId}`
      );
    }

    // Validate model capabilities
    validateModelCapabilities(model, args);

    // Prepare the request body
    const requestBody = prepareRequestBody(args, model);

    // Execute the API call with retry logic
    const response = await executeApiCall(modelId, requestBody);

    // Format the response
    const responseOptions: ResponseOptions = {
      includeThinking: args.enableThinking,
      includeSearch: true,
      customFormat: {
        operation: TOOL_NAMES.SEARCH,
        highVolume: args.highVolume
      }
    };

    return formatResponse(response, modelId, responseOptions);
  } catch (error) {
    console.error('Error in search handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return formatErrorResponse(error);
  }
}

/**
 * Handles the rapid search operation (optimized for high volume)
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleRapidSearch(request: any) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query parameter is required and must be a string'
      );
    }

    // Extract and parse arguments with high volume flag always true
    const args: SearchArgs = {
      query: request.params.arguments.query,
      modelId: request.params.arguments.modelId,
      enableThinking: false, // Never use thinking for rapid search
      highVolume: true // Always high volume for rapid search
    };

    // Use Flash-Lite model for rapid search
    const modelId = args.modelId || getModelForTask(TaskType.GENERAL_SEARCH);
    
    // Get model configuration
    const model = MODELS[modelId];
    if (!model) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown model: ${modelId}`
      );
    }

    // Prepare the request body - No search tools for rapid search
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{
          text: args.query
        }]
      }],
      generation_config: {
        temperature: 0.2,
        max_output_tokens: model.maxOutputTokens
      }
    };

    // Execute the API call with retry logic
    const response = await executeApiCall(modelId, requestBody);

    // Format the response
    const responseOptions: ResponseOptions = {
      includeThinking: false,
      includeSearch: false,  // Don't try to include search results for Flash-Lite
      customFormat: {
        operation: TOOL_NAMES.RAPID_SEARCH,
        highVolume: true
      }
    };

    return formatResponse(response, modelId, responseOptions);
  } catch (error) {
    console.error('Error in rapid search handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return formatErrorResponse(error);
  }
}

/**
 * Selects the appropriate model for search based on args
 * @param {SearchArgs} args - Search arguments
 * @returns {string} - Selected model ID
 */
function selectModelForSearch(args: SearchArgs): string {
  // If model ID is explicitly provided, use it
  if (args.modelId) {
    return args.modelId;
  }
  
  // Select based on operation type
  if (args.enableThinking) {
    return getModelForTask(TaskType.COMPLEX_REASONING);
  } else if (args.highVolume) {
    return getModelForTask(TaskType.GENERAL_SEARCH);
  } else {
    return getModelForTask(TaskType.GENERAL_SEARCH);
  }
}

/**
 * Validates model capabilities against requested features
 * @param {any} model - Model configuration
 * @param {SearchArgs} args - Search arguments
 * @throws {McpError} if incompatible
 */
function validateModelCapabilities(model: any, args: SearchArgs): void {
  // Check thinking capability
  if (args.enableThinking && !model.capabilities.thinking) {
    throw new McpError(
      ErrorCode.InvalidParams,
      ERROR_MESSAGES.THINKING_NOT_SUPPORTED(model.displayName)
    );
  }
  
  // Check search capability if not high volume
  if (!args.highVolume && !model.capabilities.search) {
    throw new McpError(
      ErrorCode.InvalidParams,
      ERROR_MESSAGES.SEARCH_NOT_SUPPORTED(model.displayName)
    );
  }
}

/**
 * Prepares the request body for the Gemini API
 * @param {SearchArgs} args - Search arguments
 * @param {any} model - Model configuration
 * @returns {any} - Prepared request body
 */
function prepareRequestBody(args: SearchArgs, model: any): any {
  // Base request structure
  const requestBody: any = {
    contents: [{
      role: 'user',
      parts: [{
        text: args.query
      }]
    }]
  };

  // Add search integration modification for Flash-Lite model
  const isFlashLite = model.id.includes('flash-lite');
  if (!isFlashLite && model.capabilities.search) {
    requestBody.tools = [{
      google_search: {}
    }];
  }

  // Add thinking configuration if requested and supported
  if (args.enableThinking && model.capabilities.thinking) {
    requestBody.generation_config = {
      temperature: 0.2,  // Lower temperature for more focused reasoning
      top_k: 40,
      top_p: 0.95,
      max_output_tokens: 8192
    };
  }

  return requestBody;
}

/**
 * Executes the API call with retry logic
 * @param {string} modelId - Model ID
 * @param {any} requestBody - Request body
 * @returns {Promise<any>} - API response
 */
async function executeApiCall(modelId: string, requestBody: any): Promise<any> {
  try {
    // Construct API endpoint
    const endpoint = `${API.ENDPOINT}/${modelId}:generateContent?key=${API.API_KEY}`;
    
    // Use rate limit manager to handle the request
    return await rateLimitManager.executeWithRetry(modelId, async () => {
      const response = await axios.post(endpoint, requestBody);
      return response.data;
    });
  } catch (error) {
    console.error(`API call failed for model ${modelId}:`, error);
    throw error;
  }
}
