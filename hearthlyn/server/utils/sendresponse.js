/**
 * Standardized response format for API endpoints
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data (optional)
 * @param {any} meta - Additional metadata (optional)
 */
const sendResponse = (res, statusCode = 200, success = true, message = '', data = null, meta = null) => {
    const response = {
      success,
      message,
      ...(data !== null && { data }),
      ...(meta !== null && { meta })
    };
  
    // Add timestamp in development mode
    if (process.env.NODE_ENV === 'development') {
      response.timestamp = new Date().toISOString();
    }
  
    return res.status(statusCode).json(response);
  };
  
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {string} message -