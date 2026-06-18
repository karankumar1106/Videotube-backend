import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: 'Tweet',
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  likedBy:{
    type:Schema.Types.ObjectId,
    ref:"User"
  }
}, { timestamps: true });

// likeSchema.index({ user: 1, tweet: 1 }, { unique: true, sparse: true });
// likeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model('Like', likeSchema);
