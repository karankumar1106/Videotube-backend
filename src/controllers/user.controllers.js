import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { Subscription } from '../models/subscription.models.js';
import { Video } from '../models/video.models.js';
import {
  uploadOnCloudinary,
  destroyOnCloudinary,
} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req, res) => {
  // Registration logic will go here
  // get user data from req.body
  // validate user data
  // check if user already exists
  // create new user
  // remove password ,refreshToken from user object before sending response
  // check user created successfully or not
  // return success response

  // for testing req.body
  // console.log('Request body: ', req.body);

  const { userName, email, fullName, password } = req.body;
  console.log('email: ', email);
  console.log('password: ', password);

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const ExistingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (ExistingUser) {
    throw new ApiError(409, 'User already exists');
  }

  // for testing req.files
  // console.log("req.files: ", req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
  if (!avatar) {
    throw new ApiError(500, 'Failed to upload avatar');
  }

  const user = await User.create({
    userName: userName,
    email,
    fullName,
    avatar: avatar.secure_url,
    avatarPublicId: avatar.public_id,
    coverImage: coverImage ? coverImage.secure_url : '',
    coverImagePublicId: coverImage ? coverImage.public_id : '',
    password,
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new ApiError(500, 'Failed to create user');
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
  // Login logic will go here
  // get user data from req.body
  // validate user data
  // check if user exists
  // check if password is correct
  // generate access token and refresh token
  // send cookies
  // return success response with tokens

  const { email, password, userName } = req.body;
  if (!email && !userName) {
    throw new ApiError(400, 'Email or username is required');
  }
  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{refreshToken:1}
    },
    { new: true, validateBeforeSave: false }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers('Authorization')?.replace('Bearer ', '');

  if (!incomingRefreshToken) {
    throw new ApiError(400, 'Refresh token is missing');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?.userId);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token does not match');
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirm password do not match');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'User is not authenticated');
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, req.user, 'Current user retrieved successfully')
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, 'Username is required');
  }

  const channel=await User.aggregate([
    {
      $match:{
        userName:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelSubscribedTo:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        userName:1,
        subscribersCount:1,
        channelSubscribedTo:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        createdAt:1
      }
    }
  ])

  //FOR TESTING
  console.log(channel)

  if(!channel?.length){
    throw new ApiError(404,"Channel doesnot exists")
  }

  return res
  .status(200).json(
    new ApiResponse(200, channel[0], 'Channel profile fetched')
  );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const userToUpdate = await User.findById(req.user._id);
  if (!userToUpdate) {
    throw new ApiError(404, 'User not found');
  }

  if (userToUpdate.avatarPublicId) {
    await destroyOnCloudinary(userToUpdate.avatarPublicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.secure_url,
        avatarPublicId: avatar.public_id,
      },
    },
    { returnDocument:'after' }
  ).select('-password -refreshToken');

  res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar updated successfully'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, 'Cover image file is required');
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath);

  const userToUpdate = await User.findById(req.user._id);
  if (!userToUpdate) {
    throw new ApiError(404, 'User not found');
  }

  if (userToUpdate.coverImagePublicId) {
    await destroyOnCloudinary(userToUpdate.coverImagePublicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
        coverImagePublicId: coverImage.public_id,
      },
    },
    { returnDocument:'after' }
  ).select('-password -refreshToken');

  res.status(200).json(new ApiResponse(200, updatedUser, 'Cover image updated successfully'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;

  if (!email || !fullName) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { returnDocument:'after' }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully'));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user?._id,
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
            },
          },
          {
            $unwind: '$owner',
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
              owner: {
                _id: 1,
                userName: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user || !user.length) {
    throw new ApiError(404, 'User not found');
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        'Watch history fetched successfully'
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserWatchHistory,
};
