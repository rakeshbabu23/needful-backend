const { RESPONSE_STATUS } = require("../constants/responseStatus.constant");

class APIError extends Error {
  /**
   * Custom Error class for API errors
   * @param {string} message - Error message
   * @param {number} statusCode - Custom status code
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, statusCode, error) {
    super(message);
    this.statusCode = statusCode;
    this.statusName = Object.keys(RESPONSE_STATUS).find(
      (key) => RESPONSE_STATUS[key] === statusCode
    );
    this.error = error;
  }
}

class ValidationError extends APIError {
  /**
   * Custom Error class for validation errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 400, error);
  }
}

class BadRequestError extends APIError {
  /**
   * Custom Error class for validation errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 400, error);
  }
}

class UnauthorizedError extends APIError {
  /**
   * Custom Error class for 401 errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 401, error);
  }
}

class ForbiddenError extends APIError {
  /**
   * Custom Error class for 403 errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 403, error);
  }
}

class NotFoundError extends APIError {
  /**
   * Custom Error class for 404 errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 404, error);
  }
}

class ConflictError extends APIError {
  /**
   * Custom Error class for 409 errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(message, error) {
    super(message, 409, error);
  }
}

class InternalServerError extends APIError {
  /**
   * Custom Error class for 500 errors
   * @param {string} message - Error message
   * @param {object} error - Error object
   * @returns {object} - Error object
   */
  constructor(
    message = "Internal Server Error",
    error = { server: ["Internal Server Error"] }
  ) {
    super(message, 500, error);
  }
}

module.exports = {
  APIError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  BadRequestError,
};
