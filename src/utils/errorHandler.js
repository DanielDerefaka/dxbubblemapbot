
const { logger } = require('./logger');


class ApiError extends Error {
  constructor(message, statusCode = 500, source = 'unknown') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.source = source;
  }
}

function handleApiError(error, context = '') {
 
  logger.error(`API Error in ${context}: ${error.message}`);
  
  if (error instanceof ApiError) {
   
    switch (error.statusCode) {
      case 404:
        return 'The requested data could not be found. Please check the contract address and try again.';
      case 429:
        return 'Rate limit exceeded. Please try again in a few minutes.';
      case 400:
        return `Bad request: ${error.message}`;
      case 401:
      case 403:
        return 'Authentication error. Please contact the bot administrator.';
      default:
        return `An error occurred while fetching data: ${error.message}`;
    }
  } else if (error.message.includes('timeout')) {
    
    return 'The request timed out. Please try again later.';
  } else if (error.message.includes('network')) {
   
    return 'A network error occurred. Please check your connection and try again.';
  } else {
    
    return 'An unexpected error occurred. Please try again later.';
  }
}

function formatErrorForLogging(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    source: error.source,
    timestamp: new Date().toISOString()
  };
}

async function safeExecute(fn, args = [], context = '', defaultValue = null) {
  try {
    return await fn(...args);
  } catch (error) {
    logger.error(`Error in ${context}: ${error.message}`);
    return defaultValue;
  }
}

module.exports = {
  ApiError,
  handleApiError,
  formatErrorForLogging,
  safeExecute
};
