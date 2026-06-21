import mongoose, { isValidObjectId } from 'mongoose';
import { Comment } from '../models/comment.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Video } from '../models/video.models.js';

import { asyncHandler } from '../utils/asyncHandler.js';

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid videoid');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'video not found');
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
              userName: 1,
              fullName: 1,
              avatar: 1,
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
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const options = {
    page: Number(page),
    limit: Number(limit),
  };

  const comments = await Comment.aggregatePaginate(aggregate, options);
  return res
    .status(200)
    .json(new ApiResponse(200, comments, 'comments fetched successfully'));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid video id');
  }

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment content is required');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'video not found');
  }
  const comment = await Comment.create({
    content,
    video: video._id,
    owner: req.user?._id,
  });

  const createdComment = await Comment.aggregate([
    {
      $match: {
        _id: comment._id,
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
              fullName: 1,
              userName: 1,
              avatar: 1,
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
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdComment[0], 'Comment added successfully')
    );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'invalid comment id');
  }
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment is required');
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // ownership check
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorized request');
  }
  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      returnDocument: 'after',
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment id');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // ownership check
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorized request');
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Comment deleted successfully'));
});

export { getVideoComments, addComment, updateComment, deleteComment };
