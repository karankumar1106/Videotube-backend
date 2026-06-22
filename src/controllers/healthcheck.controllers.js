import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const healthcheck = asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  if (!isDbConnected) {
    throw new ApiError(503, 'Database is not connected');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: 'OK',
        database: {
          connected: true,
          state: dbState,
        },
      },
      'Server is running successfully'
    )
  );
});

export { healthcheck };
