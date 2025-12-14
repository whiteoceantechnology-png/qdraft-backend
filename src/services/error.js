import httpStatus from 'http-status';

/**
 * @extends Error
 */
class ExtendableError extends Error {
  constructor(message, status, isPublic) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    this.isPublic = isPublic;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * Class representing an API error.
 *
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
  /**
   * Creates an API error.
   *
   * @param {String} message - Error message.
   * @param {Number} status - HTTP status code of error.
   * @param {Boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(
    message,
    status = httpStatus.INTERNAL_SERVER_ERROR,
    isPublic = false,
  ) {
    super(message, status, isPublic);
  }
}

/**
 * Class for required error
 *
 * @class RequiredError
 */
export class RequiredError {
  /**
   * Make error pretty
   *
   * @static
   * @param {Array} errors - Array of error Object
   * @returns {Object} - errors - Pretty Object transform
   */
  static makePretty(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
      return {};
    }

    return errors.reduce((obj, error) => {
      const nObj = obj;
      // Handle different error formats
      if (error.field) {
        // Format 1: error with messages array
        if (error.messages && Array.isArray(error.messages) && error.messages.length > 0) {
          nObj[error.field] = error.messages[0].replace(/"/g, '');
        }
        // Format 2: error with message string
        else if (error.message) {
          nObj[error.field] = error.message.replace(/"/g, '');
        }
        // Format 3: error with msg field
        else if (error.msg) {
          nObj[error.field] = error.msg.replace(/"/g, '');
        }
        // Default fallback
        else {
          nObj[error.field] = 'Unknown error';
        }
      }
      return nObj;
    }, {});
  }
}

export default APIError;
