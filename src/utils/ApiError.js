class ApiError extends Error {
  constructor(statusCode, message = 'Somethihng went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    // STACK TRACE FOR DEBUGGING PURPOSE
    // ONLY IN DEVELOPMENT ENVIRONMENT
    // STACK AND MESSAGE IS TAKE CARE BY DEFAULT IN ERROR OBJECT
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
