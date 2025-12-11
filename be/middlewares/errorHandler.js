import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'PrismaClientKnownRequestError') {
    return errorResponse(res, 'Database error occurred', 400, err.meta);
  }

  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Validation failed', 422, err.errors);
  }

  return errorResponse(res, err.message || 'Internal Server Error', 500);
};
