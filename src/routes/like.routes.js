import { Router } from 'express';
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
} from '../controllers/like.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT)

router.post("/toggle/v/:videoId",toggleVideoLike)
router.post("/toggle/c/:commentId",toggleVideoLike)
router.post("/toggle/t/:tweetId",toggleVideoLike)

router.get("/videos",getLikedVideos)

export default router