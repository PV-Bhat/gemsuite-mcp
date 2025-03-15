/**
 * Request building utilities for Gemini API
 */
import { preparePartsWithFiles } from './file-handler.js';
import { MODELS } from './model-selector.js';

/**
 * Build a Gemini API request
 * @param {Object} options - Request options
 * @param {string} options.modelId - Model ID
 * @param {string} [options.text] - Input text
 * @param {string|string[]} [options.filePath] - File path or array of file paths
 * @param {boolean} [options.enableSearch] - Whether to enable search
 * @param {boolean} [options.enableThinking] - Whether to enable thinking mode
 * @param {Object} [options.generationConfig] - Generation configuration
 * @returns {Promise<Object>} - Gemini API request body
 */
export async function buildRequest(options) {
  const { 
    modelId, 
    text = '', 
    filePath, 
    enableSearch = false,
    enableThinking = false,
    generationConfig = {}
  } = options;
  
  // Prepare parts (text and/or files)
  let parts;
  
  if (filePath) {
    parts = await preparePartsWithFiles(filePath, text);
  } else {
    parts = [{ text }];
  }
  
  // Create base request
  const request = {
    contents: [{
      role: 'user',
      parts
    }]
  };
  
  // Add search integration if enabled and supported
  if (enableSearch && modelId === MODELS.FLASH) {
    request.tools = [{
      google_search: {}
    }];
  }
  
  // Set generation configuration if provided
  if (Object.keys(generationConfig).length > 0) {
    request.generation_config = {
      ...generationConfig
    };
  }
  
  // Use step-by-step approach for thinking models
  if (enableThinking && modelId === MODELS.FLASH_THINKING) {
    // For FLASH_THINKING, we use generation config since thinking parameter isn't supported
    if (!request.generation_config) {
      request.generation_config = {};
    }
    
    // Set temperature lower for more precise reasoning
    request.generation_config.temperature = 0.2;
    request.generation_config.top_p = 0.95;
    request.generation_config.top_k = 40;
    
    // Enhance the prompt with specific instructions for step-by-step reasoning
    // This is a workaround since the thinking parameter isn't directly supported
    const enhancedText = `Please reason through this step-by-step with detailed explanations:\n\n${text}`;
    
    // Replace the text in the parts array
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].text) {
        parts[i].text = enhancedText;
        break;
      }
    }
    
    // If there was no text part, add one
    if (!parts.some(part => part.text)) {
      parts.push({ text: enhancedText });
    }
  }
  
  return request;
}

/**
 * Build a Gemini API request for searching
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {string} [options.modelId] - Model ID (defaults to Flash)
 * @param {string|string[]} [options.filePath] - File path or array of file paths
 * @param {boolean} [options.enableThinking] - Whether to enable thinking mode
 * @returns {Promise<Object>} - Gemini API request body
 */
export async function buildSearchRequest(options) {
  const {
    query,
    modelId = MODELS.FLASH,
    filePath,
    enableThinking = false
  } = options;
  
  return buildRequest({
    modelId,
    text: query,
    filePath,
    enableSearch: true,
    enableThinking,
    generationConfig: {
      temperature: 0.7,
      top_p: 0.8,
      top_k: 40
    }
  });
}

/**
 * Build a Gemini API request for reasoning
 * @param {Object} options - Reasoning options
 * @param {string} options.problem - Problem to solve
 * @param {string} [options.modelId] - Model ID (defaults to Flash Thinking)
 * @param {string|string[]} [options.filePath] - File path or array of file paths
 * @param {boolean} [options.showSteps] - Whether to show reasoning steps
 * @returns {Promise<Object>} - Gemini API request body
 */
export async function buildReasoningRequest(options) {
  const {
    problem,
    modelId = MODELS.FLASH_THINKING,
    filePath,
    showSteps = true
  } = options;
  
  return buildRequest({
    modelId,
    text: problem,
    filePath,
    enableSearch: false,
    enableThinking: showSteps,
    generationConfig: {
      temperature: 0.2,
      top_p: 0.95,
      top_k: 40,
      max_output_tokens: 8192
    }
  });
}

/**
 * Build a Gemini API request for processing
 * @param {Object} options - Processing options
 * @param {string} [options.content] - Content to process
 * @param {string|string[]} [options.filePath] - File path or array of file paths
 * @param {string} [options.operation] - Type of processing
 * @param {string} [options.modelId] - Model ID (defaults to Flash Lite)
 * @returns {Promise<Object>} - Gemini API request body
 */
export async function buildProcessingRequest(options) {
  const {
    content = '',
    filePath,
    operation = 'analyze',
    modelId = MODELS.FLASH_LITE
  } = options;
  
  // Build processing prompt based on operation
  let prompt = content;
  if (operation) {
    prompt = buildOperationPrompt(operation, content);
  }
  
  return buildRequest({
    modelId,
    text: prompt,
    filePath,
    enableSearch: false,
    enableThinking: false,
    generationConfig: {
      temperature: 0.3,
      top_p: 0.8,
      top_k: 40
    }
  });
}

/**
 * Build a Gemini API request for file analysis
 * @param {Object} options - Analysis options
 * @param {string|string[]} options.filePath - File path or array of file paths
 * @param {string} [options.instruction] - Specific instruction for analysis
 * @param {string} [options.modelId] - Model ID (automatically selected if not provided)
 * @returns {Promise<Object>} - Gemini API request body
 */
export async function buildAnalysisRequest(options) {
  const {
    filePath,
    instruction = 'Analyze this file and describe its contents.',
    modelId = MODELS.FLASH
  } = options;
  
  return buildRequest({
    modelId,
    text: instruction,
    filePath,
    enableSearch: false,
    enableThinking: false,
    generationConfig: {
      temperature: 0.4,
      top_p: 0.9,
      top_k: 40
    }
  });
}

/**
 * Build a processing prompt based on operation type
 * @param {string} operation - Type of processing
 * @param {string} content - Content to process
 * @returns {string} - Processing prompt
 */
function buildOperationPrompt(operation, content) {
  switch (operation.toLowerCase()) {
    case 'summarize':
      return `Summarize the following content concisely while preserving the key information and insights:\n\n${content}`;
    
    case 'extract':
      return `Extract the key information, facts, and insights from the following content:\n\n${content}`;
    
    case 'restructure':
      return `Restructure the following content into a well-organized format with clear headings and sections:\n\n${content}`;
    
    case 'simplify':
      return `Simplify the following content to make it more accessible and easier to understand:\n\n${content}`;
    
    case 'expand':
      return `Expand on the following content to provide more detail and context:\n\n${content}`;
    
    case 'critique':
      return `Provide a critical analysis of the following content, highlighting strengths and areas for improvement:\n\n${content}`;
    
    case 'feedback':
      return `Provide constructive feedback on the following content:\n\n${content}`;
    
    default:
      return `Analyze the following content:\n\n${content}`;
  }
}
