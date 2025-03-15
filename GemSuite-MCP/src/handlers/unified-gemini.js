/**
 * Unified handler for all Gemini API operations
 */
import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { selectModel, MODELS, TASKS } from '../utils/model-selector.js';
import { 
  buildSearchRequest, 
  buildReasoningRequest, 
  buildProcessingRequest, 
  buildAnalysisRequest 
} from '../utils/request-builder.js';
import { getFileTypeCategory } from '../utils/file-handler.js';

// API configuration
const API_KEY = process.env.GEMINI_API_KEY;
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1alpha/models';

// Tool names
export const TOOL_NAMES = {
  GEM_SEARCH: 'gem_search',
  GEM_REASON: 'gem_reason',
  GEM_PROCESS: 'gem_process',
  GEM_ANALYZE: 'gem_analyze',
  // Keep old properties for backward compatibility
  SEARCH: 'gem_search',
  REASON: 'gem_reason',
  PROCESS: 'gem_process',
  ANALYZE: 'gem_analyze'
};

/**
 * Execute a Gemini API request
 * @param {string} modelId - Model ID
 * @param {Object} requestBody - Request body
 * @returns {Promise<Object>} - API response
 */
async function executeRequest(modelId, requestBody) {
  try {
    const endpoint = `${API_ENDPOINT}/${modelId}:generateContent?key=${API_KEY}`;
    
    const response = await axios.post(endpoint, requestBody);
    return response.data;
  } catch (error) {
    console.error(`API call failed for model ${modelId}:`, error);
    
    // Handle API errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 429) {
        throw new McpError(
          ErrorCode.InternalError,
          `Rate limit exceeded for ${modelId}. Please try again later.`
        );
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `API error: ${data?.error?.message || 'Unknown error'}`
      );
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error: ${error.message}`
    );
  }
}

/**
 * Format Gemini API response
 * @param {Object} responseData - API response data
 * @param {string} modelId - Model ID used
 * @param {Object} options - Formatting options
 * @returns {Object} - Formatted response
 */
function formatResponse(responseData, modelId, options = {}) {
  try {
    // Extract text from response
    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      return {
        content: [
          {
            type: 'text',
            text: 'No response generated.'
          }
        ],
        isError: true
      };
    }
    
    const parts = candidate.content?.parts || [];
    let text = parts.filter(part => part.text).map(part => part.text).join('\n');
    
    // Extract search results if available
    let searchResults = '';
    if (candidate.grounding_metadata?.search_entry_point?.rendered_content) {
      searchResults = candidate.grounding_metadata.search_entry_point.rendered_content;
    }
    
    // Combine text and search results
    if (searchResults) {
      text += '\n\n### Search Results:\n' + searchResults;
    }
    
    return {
      content: [
        {
          type: 'text',
          text
        }
      ],
      metadata: {
        modelUsed: modelId,
        ...options
      }
    };
  } catch (error) {
    console.error('Error formatting response:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error formatting response: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle Gemini search request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleSearch(request) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query parameter is required and must be a string'
      );
    }
    
    // Extract parameters
    const {
      query,
      file_path,
      model_id,
      enable_thinking
    } = request.params.arguments;
    
    // Select appropriate model
    const modelId = selectModel({
      modelId: model_id,
      taskType: TASKS.SEARCH,
      filePath: file_path,
      thinking: enable_thinking,
      searchRequired: true
    });
    
    // Build request
    const requestBody = await buildSearchRequest({
      query,
      modelId,
      filePath: file_path,
      enableThinking: enable_thinking
    });
    
    // Execute request
    const response = await executeRequest(modelId, requestBody);
    
    // Format response
    return formatResponse(response, modelId, {
      operation: TOOL_NAMES.GEM_SEARCH,
      withFile: !!file_path,
      thinking: enable_thinking
    });
  } catch (error) {
    console.error('Error in search handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle Gemini reasoning request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleReason(request) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.problem !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Problem parameter is required and must be a string'
      );
    }
    
    // Extract parameters
    const {
      problem,
      file_path,
      model_id,
      show_steps = true
    } = request.params.arguments;
    
    // Select appropriate model (prefer Flash Thinking)
    const modelId = model_id || MODELS.FLASH_THINKING;
    
    // Build request
    const requestBody = await buildReasoningRequest({
      problem,
      modelId,
      filePath: file_path,
      showSteps: show_steps
    });
    
    // Execute request
    const response = await executeRequest(modelId, requestBody);
    
    // Format response
    return formatResponse(response, modelId, {
      operation: TOOL_NAMES.GEM_REASON,
      withFile: !!file_path,
      showSteps: show_steps
    });
  } catch (error) {
    console.error('Error in reasoning handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle Gemini processing request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleProcess(request) {
  try {
    // Validate required parameters
    if (!request.params.arguments || 
        (typeof request.params.arguments.content !== 'string' && !request.params.arguments.file_path)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Either content or file_path parameter is required'
      );
    }
    
    // Extract parameters
    const {
      content = '',
      file_path,
      operation = 'analyze',
      model_id
    } = request.params.arguments;
    
    // Select appropriate model (prefer Flash-Lite for efficiency)
    const modelId = model_id || MODELS.FLASH_LITE;
    
    // Build request
    const requestBody = await buildProcessingRequest({
      content,
      filePath: file_path,
      operation,
      modelId
    });
    
    // Execute request
    const response = await executeRequest(modelId, requestBody);
    
    // Format response
    return formatResponse(response, modelId, {
      operation: TOOL_NAMES.GEM_PROCESS,
      processingType: operation,
      withFile: !!file_path
    });
  } catch (error) {
    console.error('Error in processing handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle Gemini file analysis request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export async function handleAnalyze(request) {
  try {
    // Validate required parameters
    if (!request.params.arguments || !request.params.arguments.file_path) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'file_path parameter is required'
      );
    }
    
    // Extract parameters
    const {
      file_path,
      instruction,
      model_id
    } = request.params.arguments;
    
    // Select appropriate model based on file type
    const selectedModelId = model_id || selectModel({
      filePath: file_path,
      taskType: TASKS.ANALYZE
    });
    
    // Build request
    const requestBody = await buildAnalysisRequest({
      filePath: file_path,
      instruction,
      modelId: selectedModelId
    });
    
    // Execute request
    const response = await executeRequest(selectedModelId, requestBody);
    
    // Format response
    return formatResponse(response, selectedModelId, {
      operation: TOOL_NAMES.GEM_ANALYZE,
      fileType: Array.isArray(file_path) 
        ? 'multiple files' 
        : getFileTypeCategory(file_path)
    });
  } catch (error) {
    console.error('Error in analysis handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
