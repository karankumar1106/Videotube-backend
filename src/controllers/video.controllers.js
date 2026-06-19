import { Video } from '../models/video.models';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose, { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { uploadOnCloudinary } from '../utils/cloudinary';

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = 'createdAt',
    sortType = 'desc',
    userId,
  } = req.query;

  const filter = {
    isPublished: true,
  };

  if (query) {
    filter.title = {
      $regex: query,
      $options: 'i',
    };
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, 'Invalid userId');
    }
    filter.owner = new mongoose.Types.ObjectId(userId); // as userId from query is string
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortType == 'desc' ? -1 : 1;

  const videos = await Video.aggregate([
    {
      $match: {
        filter,
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
    {
      $sort: sortOptions,
    },
    {
      $skip: Number(page) - 1 * Number(limit),
    },
    {
      $limit: Number(limit),
    },
  ]);

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        currentPage: Number(page),
        totalPage: Math.ceil(totalVideos / limit),
      },
      'Vidoes fetched successfully'
    )
  );
});

export { getAllVideos };
