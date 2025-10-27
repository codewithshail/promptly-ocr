/**
 * Utility functions for handling errors gracefully across the application
 */

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Parse error from various sources into a user-friendly message
 */
export function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "An unexpected error occurred";
}

/**
 * Handle network errors with appropriate user messages
 */
export function handleNetworkError(error: unknown): ErrorResponse {
  const message = parseError(error);

  // Check for specific network errors
  if (message.includes("fetch") || message.includes("network")) {
    return {
      message: "Network error. Please check your internet connection and try again.",
      code: "NETWORK_ERROR",
    };
  }

  if (message.includes("timeout")) {
    return {
      message: "Request timed out. Please try again.",
      code: "TIMEOUT_ERROR",
    };
  }

  if (message.includes("401") || message.includes("unauthorized")) {
    return {
      message: "You are not authorized. Please sign in again.",
      code: "AUTH_ERROR",
    };
  }

  if (message.includes("403") || message.includes("forbidden")) {
    return {
      message: "You don't have permission to perform this action.",
      code: "PERMISSION_ERROR",
    };
  }

  if (message.includes("404") || message.includes("not found")) {
    return {
      message: "The requested resource was not found.",
      code: "NOT_FOUND_ERROR",
    };
  }

  if (message.includes("500") || message.includes("server error")) {
    return {
      message: "Server error. Please try again later.",
      code: "SERVER_ERROR",
    };
  }

  if (message.includes("429") || message.includes("rate limit")) {
    return {
      message: "Too many requests. Please wait a moment and try again.",
      code: "RATE_LIMIT_ERROR",
    };
  }

  return {
    message: message || "An error occurred. Please try again.",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      const errorMessage = parseError(error);
      if (
        errorMessage.includes("400") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("404")
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = parseError(error);
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  );
}

/**
 * Check if the error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  const message = parseError(error);
  return message.includes("timeout") || message.includes("timed out");
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): {
  message: string;
  stack?: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp,
    };
  }

  return {
    message: parseError(error),
    timestamp,
  };
}
