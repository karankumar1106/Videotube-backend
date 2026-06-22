import mongoose from 'mongoose';

import { Video } from '../models/video.models.js';
import { Like } from '../models/like.models.js';
import { Subscription } from '../models/subscription.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getChannelStats = asyncHandler(async (req, res) => {
  // Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelId = req.user?._id;

  // total videos
  const totalVideos = await Video.countDocuments({
    owner: channelId,
  });

  // total video views
  const totalViewCount = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $group: {
        _id: null,
        totalViews: {
          $sum: '$views',
        },
      },
    },
  ]);

  const totalviews = totalViewCount[0]?.totalViews || 0;

  // total subscriber

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  // total video likes

  const totalLikesCount = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes',
      },
    },

    {
      $addFields: {
        likesCount: {
          $size: '$likes',
        },
      },
    },

    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: '$likesCount',
        },
      },
    },
  ]);

  const totalLikes = totalLikesCount[0]?.totalLikes || 0;
  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalviews,
      totalSubscribers,
      totalLikes,
    })
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },

    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes',
      },
    },

    {
      $addFields: {
        likesCount: {
          $size: '$likes',
        },
      },
    },

    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        isPublished: 1,
        likesCount: 1,
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos, 'Channel videos fetched successfully')
    );
});

export { getChannelStats, getChannelVideos };
