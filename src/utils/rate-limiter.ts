/**
 * Type guard for Axios errors
 */
function isAxiosError(error: any): boolean {
  return error && error.isAxiosError === true;
}
import axios from 'axios';
import { MODELS } from '../config/models.js';
import { RATE_LIMITS, ERROR_MESSAGES, API } from '../config/constants.js';

/**
 * Manages rate limiting for Gemini API requests
 * Tracks request timestamps, implements exponential backoff,
 * and retries failed requests when appropriate
 */
export class RateLimitManager {
  /** Map to track request timestamps by model ID */
  private requestTimestamps: Map<string, number[]> = new Map();
  
  /** Whether the user is on paid tier */
  private isPaidTier: boolean;

  /**
   * Creates a new RateLimitManager
   * @param isPaidTier Whether the user is on paid tier
   */
  constructor(isPaidTier = false) {
    this.isPaidTier = isPaidTier;
  }

  /**
   * Checks if a request can be made for the specified model
   * @param modelId The model ID to check
   * @returns true if a request can be made, false otherwise
   */
  canMakeRequest(modelId: string): boolean {
    const model = MODELS[modelId];
    if (!model) {
      return false; // Unknown model, cannot make request
    }
    
    // Get the rate limit for this model
    const rpm = model.freeRpm; // For now, use free tier RPM
    
    // Initialize tracking for this model if it doesn't exist
    if (!this.requestTimestamps.has(modelId)) {
      this.requestTimestamps.set(modelId, []);
      return true;
    }
    
    // Get timestamps and filter to those in the last minute
    const timestamps = this.requestTimestamps.get(modelId)!;
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Keep only timestamps from the last minute
    const recentTimestamps = timestamps.filter(t => t >= oneMinuteAgo);
    this.requestTimestamps.set(modelId, recentTimestamps);
    
    // Check if we're under the rate limit
    return recentTimestamps.length < rpm;
  }

  /**
   * Records a request for the specified model
   * @param modelId The model ID to record a request for
   */
  recordRequest(modelId: string): void {
    if (!this.requestTimestamps.has(modelId)) {
      this.requestTimestamps.set(modelId, []);
    }
    
    const timestamps = this.requestTimestamps.get(modelId)!;
    timestamps.push(Date.now());
    this.requestTimestamps.set(modelId, timestamps);
  }

  /**
   * Calculates time until next request slot is available
   * @param modelId The model ID to check
   * @returns Time in milliseconds until next available request slot
   */
  getTimeUntilNextSlot(modelId: string): number {
    if (this.canMakeRequest(modelId)) {
      return 0; // Can make request now
    }
    
    const model = MODELS[modelId];
    if (!model) {
      return 60000; // Unknown model, wait a minute
    }
    
    const rpm = model.freeRpm;
    const timestamps = this.requestTimestamps.get(modelId)!;
    
    if (timestamps.length < rpm) {
      return 0; // Not at limit yet
    }
    
    // Sort timestamps to find the oldest one
    timestamps.sort((a, b) => a - b);
    
    // When will the oldest timestamp expire?
    const oldestTimestamp = timestamps[timestamps.length - rpm];
    const expiryTime = oldestTimestamp + 60000; // 1 minute after the request
    const now = Date.now();
    
    return Math.max(0, expiryTime - now);
  }

  /**
   * Executes an API call with automatic retry for rate limiting
   * @param modelId The model ID being used
   * @param apiCall Function that makes the API call
   * @returns Promise that resolves to the API response
   */
  async executeWithRetry<T>(modelId: string, apiCall: () => Promise<T>): Promise<T> {
    let retries = 0;
    
    while (retries <= RATE_LIMITS.MAX_RETRIES) {
      try {
        // Check if we can make a request
        if (!this.canMakeRequest(modelId) && retries === 0) {
          // If this is our first attempt and we're rate limited,
          // calculate wait time and throw error
          const waitTime = this.getTimeUntilNextSlot(modelId);
          const waitTimeSeconds = Math.ceil(waitTime / 1000);
          throw new Error(ERROR_MESSAGES.RATE_LIMIT(modelId, waitTimeSeconds));
        }
        
        // Make the API call
        const response = await apiCall();
        
        // Record the successful request
        this.recordRequest(modelId);
        
        return response;
      } catch (error) {
        // Check if it's a rate limit error from the API
        if (this.isRateLimitError(error) && retries < RATE_LIMITS.MAX_RETRIES) {
          // Calculate backoff time with exponential backoff + jitter
          const backoffTime = this.calculateBackoff(retries);
          
          // Log the rate limit issue
          console.error(`Rate limit hit for ${modelId}. Retrying in ${backoffTime}ms...`);
          
          // Wait for the backoff period
          await this.sleep(backoffTime);
          
          // Increment retry counter
          retries++;
        } else {
          // Not a rate limit error or we've reached max retries
          throw error;
        }
      }
    }
    
    // Should not reach here due to throw in the while loop,
    // but TypeScript requires a return statement
    throw new Error(`Maximum retries (${RATE_LIMITS.MAX_RETRIES}) reached for ${modelId}`);
  }

  /**
   * Checks if an error is a rate limit error
   * @param error The error to check
   * @returns true if it's a rate limit error, false otherwise
   */
  private isRateLimitError(error: any): boolean {
    return isAxiosError(error) && (error as any).response?.status === 429;
  }

  /**
   * Calculates backoff time with exponential backoff + jitter
   * @param retry Current retry count
   * @returns Backoff time in milliseconds
   */
  private calculateBackoff(retry: number): number {
    // Calculate exponential backoff
    const exponentialDelay = Math.min(
      RATE_LIMITS.MAX_DELAY_MS,
      RATE_LIMITS.BASE_DELAY_MS * Math.pow(2, retry)
    );
    
    // Add jitter
    const jitter = RATE_LIMITS.JITTER_FACTOR;
    const randomFactor = 1 - jitter + (Math.random() * jitter * 2);
    
    return Math.floor(exponentialDelay * randomFactor);
  }

  /**
   * Sleep for a specified duration
   * @param ms Time to sleep in milliseconds
   * @returns Promise that resolves after the sleep duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and export a singleton instance of the rate limit manager
 */
export const rateLimitManager = new RateLimitManager(API.IS_PAID_TIER);
