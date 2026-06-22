import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { json } from 'express';

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'tweet content is required');
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, 'failed to create tweet');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'tweet created successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',

        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFeilds: {
        owner: {
          $first: '$owner',
        },
      },
    },
  ]);

  return (
    res.status(200),
    json(new ApiResponse(200, tweets, 'Tweets fetched successfully'))
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id');
  }
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Tweet updation required content');
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, 'tweet not found');
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorised request');
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },

    {
      returnDocument: 'after',
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, 'Tweet updated successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'invalid tweet id');
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, 'tweet not found');
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorised request');
  }

  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Tweet deleted successfully'));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
