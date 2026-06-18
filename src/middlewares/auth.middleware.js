import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // here res is of not use so we can use _ to ignore it in production code
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    //   const refreshToken = req.cookies?.refreshToken || req.headers('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      throw new ApiError(401, 'Access token is missing');
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken.userId).select(
      '-password -refreshToken'
    );
    if (!user) {
      throw new ApiError(401, 'User not found');
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid access token');
  }
});
