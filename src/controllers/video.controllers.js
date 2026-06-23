import { Video } from '../models/video.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose, { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {User} from "../models/user.models.js"

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
      $match: filter,
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
      $skip: (Number(page) - 1) * Number(limit),
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
        totalPage: Math.ceil(totalVideos / Number(limit)),
      },
      'Videos fetched successfully'
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() === '')) {
    throw new ApiError(400, 'Titles and descriptions are required');
  }

  const videoFileLocalPath = req.files?.videoFile?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, 'Video file is required');
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail is required');
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, 'Error while uploading video');
  }

  if (!thumbnail) {
    throw new ApiError(500, 'Error while uploading thumbnail');
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.secure_url,
    thumbnail: thumbnail.secure_url,
    duration: videoFile.duration || 0,
    owner: req.user?._id,
    isPublished: true,
  });

  const uploadedVideo = await Video.findById(video._id);
  if (!uploadedVideo) {
    throw new ApiError(500, 'Something went wrong while uploading a video');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, uploadedVideo, 'Video uploaded successfully'));
});

const getvideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invali video id');
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  if (!video?.length) {
    throw new ApiError(404, 'Video not found');
  }

  // increment views
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], 'Video fetched successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid videoId');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, 'Unauthorised request');
  }

  let thumbnailUrl = video.thumbnail;

  if (req.file?.path) {
    const thumbnail = await uploadOnCloudinary(req.file.path);
    if (!thumbnail.url) {
      throw new ApiError(500, 'Error while uploading thumbnail');
    }
    thumbnailUrl = thumbnail.secure_url;
  }

  const updatedVideo = await findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
        thumbnail: thumbnailUrl,
      },
    },
    {
      returnDocument: 'after',
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, 'Video updated successfully'));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video Id');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorised request');
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorised request');
  }

  const updatedVideo = await findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      returnDocument: 'after',
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateVideo,
        `Video ${updateVideo.isPublished ? 'published' : 'unpublished'} succesfully`
      )
    );
});
export { getAllVideos, publishAVideo, getvideoById, updateVideo, deleteVideo,togglePublishStatus };
