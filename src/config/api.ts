// src/config/api.ts
// Configuration for API endpoints

/**
 * Determine the API base URL based on the environment
 * @returns {string} The base URL for API requests
 */
const getApiBaseUrl = (): string => {
  // In production, use the deployed backend URL from environment variables
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://api.studyspace.com';
  }
  
  // In development, use localhost with the configured port
  // Default to 3003 if VITE_API_URL is not set
  return import.meta.env.VITE_API_URL || 'http://localhost:3003';
};

/**
 * The base URL for all API requests
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * WebSocket URL for real-time communication
 */
export const WEBSOCKET_URL = API_BASE_URL.replace('http', 'ws');