import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/playlist.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Playlist name is required');
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  const createdPlaylist = await Playlist.findById(playlist._id);
  return res
    .status(200)
    .json(
      new ApiResponse(201, createPlaylist, 'Playlist created successfully')
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
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
        ],
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: '$videos',
        },
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
    .json(200, playlists, 'user playlist fetched sccessfully');
});

const getplaylistByid = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id');
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
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
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: '$owner',
        },
        totalVideos: {
          $size: '$videos',
        },
      },
    },
  ]);

  if (!playlist?.length) {
    throw new ApiError(404, 'Playlist are not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], 'Playlist fetched successfully'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id');
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'unauthorised request');
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, 'video already exist in playlist');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
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
        updatedPlaylist,
        'Video added to playlist successfully'
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'invalid plalistid');
  }
  if (!isValidObjectId(videoIdId)) {
    throw new ApiError(400, 'invalid videoid');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  // ownership check
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorized request');
  }
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, 'Video not found in playlist');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
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
        updatedPlaylist,
        'video removed from playlist successfully'
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invaid playlistid');
  }

  const playlist = await findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, 'playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorised request');
  }

  await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  // ownership check
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'Unauthorized request');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name || playlist.name,
        description: description || playlist.description,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, 'Playlist updated successfully')
    );
});
export {
  createPlaylist,
  getUserPlaylists,
  getplaylistByid,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};
