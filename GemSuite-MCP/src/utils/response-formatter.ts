import { MODELS } from '../config/models.js';
import { RESPONSE_FORMAT } from '../config/constants.js';

/**
 * Response options for formatting
 */
export interface ResponseOptions {
  /** Whether to include thinking mode output */
  includeThinking?: boolean;
  
  /** Whether to format search results */
  includeSearch?: boolean;
  
  /** Custom formatting options */
  customFormat?: Record<string, any>;
}

/**
 * Formats responses from the Gemini API in a consistent way
 * @param response The API response data
 * @param modelId The model ID that was used
 * @param options Formatting options
 * @returns Formatted response for MCP
 */
export function formatResponse(response: any, modelId: string, options: ResponseOptions = {}): any {
  // Get model information
  const model = MODELS[modelId] || { displayName: 'Gemini API', id: modelId };
  
  // Extract main content
  let mainText = extractMainContent(response);
  
  // Extract thinking content if requested and available
  let thinkingText = '';
  
  // Extract search results if available
  let searchResults = '';
  if (options.includeSearch) {
    searchResults = extractSearchResults(response);
  }
  
  // Build the final response text
  let finalText = mainText;
  
  if (thinkingText) {
    finalText = `${RESPONSE_FORMAT.SECTIONS.THINKING}\n${thinkingText}\n\n${RESPONSE_FORMAT.SECTIONS.RESPONSE}\n${mainText}`;
  }
  
  if (searchResults) {
    finalText += `\n\n${RESPONSE_FORMAT.SECTIONS.SEARCH}\n${searchResults}`;
  }
  
  // Build the MCP response
  return {
    content: [
      {
        type: 'text',
        text: finalText,
      },
    ],
    metadata: {
      modelUsed: model.displayName,
      modelId: model.id,
      thinkingIncluded: !!thinkingText,
      searchIncluded: !!searchResults,
      ...options.customFormat
    }
  };
}

/**
 * Extracts main content from the API response
 * @param response The API response data
 * @returns Extracted main content
 */
function extractMainContent(response: any): string {
  try {
    // Check if we have a valid response structure
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];
      
      // Extract content from parts
      if (candidate.content?.parts) {
        return candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('\n');
      }
      
      // Fallback for other formats
      if (candidate.content?.text) {
        return candidate.content.text;
      }
    }
    
    // If we can't extract content in expected format, return stringified JSON
    return 'No content found in response';
  } catch (error) {
    console.error('Error extracting main content:', error);
    return 'Error extracting content from response';
  }
}

/**
 * Extracts thinking content from the API response
 * @param response The API response data
 * @returns Extracted thinking content
 */
function extractThinkingContent(response: any): string {
  try {
    // Check if we have a valid candidate with thinking
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];
      
      // Extract thinking directly
      if (candidate.thinking) {
        return candidate.thinking;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting thinking content:', error);
    return '';
  }
}

/**
 * Extracts search results from the API response
 * @param response The API response data
 * @returns Extracted search results
 */
function extractSearchResults(response: any): string {
  try {
    // Check if we have a valid candidate with search results
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];
      
      // Extract search results from grounding metadata
      if (candidate.grounding_metadata?.search_entry_point?.rendered_content) {
        return candidate.grounding_metadata.search_entry_point.rendered_content;
      }
      
      // Alternative format for search results
      if (candidate.grounding_metadata?.search_results) {
        return formatSearchResultsSummary(candidate.grounding_metadata.search_results);
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting search results:', error);
    return '';
  }
}

/**
 * Formats search results into a readable summary
 * @param searchResults Raw search results
 * @returns Formatted search results summary
 */
function formatSearchResultsSummary(searchResults: any[]): string {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return '';
  }
  
  return searchResults.map((result, index) => {
    const title = result.title || 'Untitled';
    const url = result.url || '';
    const snippet = result.snippet || '';
    
    return `${index + 1}. **${title}**\n   ${url}\n   ${snippet}\n`;
  }).join('\n');
}
