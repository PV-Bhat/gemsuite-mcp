import axios from 'axios';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MODELS, TaskType, getModelForTask } from '../config/models.js';
import { API, ERROR_MESSAGES, TOOL_NAMES } from '../config/constants.js';
import { rateLimitManager } from '../utils/rate-limiter.js';
import { formatErrorResponse, toMcpError } from '../utils/error-handler.js';
import { formatResponse, ResponseOptions } from '../utils/response-formatter.js';

/**
 * Interface for reasoning arguments
 */
export interface ReasonArgs {
  /** The problem to reason about */
  problem: string;
  
  /** Whether to show reasoning steps */
  showSteps?: boolean;
  
  /** Optional model ID override */
  modelId?: string;
}

/**
 * Handles complex reasoning operations
 * @param request The MCP request
 * @returns The MCP response
 */
export async function handleReason(request: any) {
  try {
    // Validate required parameters
    if (!request.params.arguments || typeof request.params.arguments.problem !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Problem parameter is required and must be a string'
      );
    }

    // Extract and parse arguments
    const args: ReasonArgs = {
      problem: request.params.arguments.problem,
      showSteps: request.params.arguments.show_steps !== false, // Default to true
      modelId: request.params.arguments.modelId
    };

    // Select the Thinking model by default, or use provided model
    const modelId = args.modelId || getModelForTask(TaskType.COMPLEX_REASONING);
    
    // Get model configuration
    const model = MODELS[modelId];
    if (!model) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown model: ${modelId}`
      );
    }

    // Format the response with enhanced prompting for step-by-step reasoning
    let problemText = args.problem;
    if (args.showSteps) {
      problemText = `Please solve this step-by-step with detailed explanations:\n\n${args.problem}`;
    }

    // Prepare the request body to leverage reasoning capabilities
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{
          text: problemText
        }]
      }],
      generation_config: {
        temperature: 0.2,  // Lower temperature for more focused reasoning
        top_k: 40,
        top_p: 0.95,
        max_output_tokens: 8192
      }
    };

    // Execute the API call with retry logic
    const endpoint = `${API.ENDPOINT}/${modelId}:generateContent?key=${API.API_KEY}`;
    
    const response = await rateLimitManager.executeWithRetry(modelId, async () => {
      console.error('Request body for reason:', JSON.stringify(requestBody, null, 2));
      const response = await axios.post(endpoint, requestBody);
      return response.data;
    });

    // Format the response
    const responseOptions: ResponseOptions = {
      includeThinking: false,
      includeSearch: false,
      customFormat: {
        operation: TOOL_NAMES.REASON,
      }
    };

    return formatResponse(response, modelId, responseOptions);
  } catch (error) {
    console.error('Error in reason handler:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    return formatErrorResponse(error);
  }
}
