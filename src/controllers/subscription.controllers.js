import mongoose, { isValidObjectId } from 'mongoose';
import { User } from '../models/user.models.js';
import { Subscription } from '../models/subscription.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id');
  }

  if (channelId === req.User?._id.toString()) {
    throw new ApiError(400, 'You cannot subscribe to your own channel');
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, 'Channel not found');
  }

  const alreadySubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (alreadySubscribed) {
    await Subscription.findByIdAndDelete(alreadySubscribed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Channel unsubscribed successfully'));
  }
  const subscribed = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, subscribed, 'channel subscribed successfully'));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel id');
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: 'users',
        localfield: 'subscriber',
        foreignField: '_id',
        as: 'subscriber',

        pipeline: [
          {
            $lookup: {
              from: 'subscriptions',
              localfield: '_id',
              foreignField: 'channel',
              as: 'subscribers',
            },
          },

          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'subscriber',
              as: 'subscribedTo',
            },
          },

          {
            $addFields: {
              subscriberCount: {
                $size: '$subscribers',
              },

              channelSubscribedTo: {
                $size: '$subscribedTo',
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
              fullName: 1,
              userName: 1,
              avatar: 1,
              subscriberCount: 1,
              channelSubscribedTo: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        subscriber: {
          $first: '$subscriber',
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, 'Subscriber fetched successfully'));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, 'Invalid subscriber id');
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },

    {
      $lookup: {
        from: 'users',
        localfield: 'channel',
        foreignField: '_id',
        as: 'channel',

        pipeline: [
          {
            $lookup: {
              from: 'subscriptions',
              localfield: '_id',
              foreignField: 'channel',
              as: 'subscribers',
            },
          },

          {
            $lookup: {
              from: 'subscriptions',
              localfield: '_id',
              foreignField: 'subscriber',
              as: 'subscribedToChannels',
            },
          },

          {
            $addFields: {
              subscriberCount: {
                $size: '$subscribers',
              },

              subscribedToChannels: {
                $size: 'subscribedToChannels',
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
              coverImage: 1,
              subscriberCount: 1,
              subscribedToChannels: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        channel: {
          $first: '$channel',
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        'Subcribed channel fetched successfully'
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
