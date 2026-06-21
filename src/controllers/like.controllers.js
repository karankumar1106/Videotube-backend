import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.models.js';
import { Comment } from '../models/comment.models.js';
import { Tweet } from '../models/tweet.models.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid videoId');
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'video not found');
  }

  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'video unliked successfully'));
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, 'video liked successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id');
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Comment unliked successfully'));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, 'Comment liked successfully'));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id');
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Tweet unliked successfully'));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, 'Tweet liked successfully'));
});

const getLikedVideos = async(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',

        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',

              pipeline: [
                {
                  $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'channel',
                    as: 'subscribers',
                  },
                },

                {
                  $addFields: {
                    subscriberCount: {
                      $size: '$subscribers',
                    },
                    isSubscribed: {
                      $cond: {
                        if: {
                          $in: [
                            new mongoose.Types.ObjectId(req.user?._id),
                            '$subscribers.subscriber',
                          ],
                        },
                        then: true,
                        else: false,
                      },
                    },
                  },
                },
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                    subscriberCount: 1,
                    isSubscribed: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },

    {
      $addFields: {
        video: {
          $first: '$video',
        },
      },
    },
  ]);
});
export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
