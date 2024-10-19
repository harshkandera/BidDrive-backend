class ErrorHandler extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true; // Used to distinguish operational errors from programming errors
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = ErrorHandler;