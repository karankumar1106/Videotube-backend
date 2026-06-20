import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getAllVideos,
  publishAVideo,
  getvideoById,
  updateVideo,
} from '../controllers/video.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();
router.use(verifyJWT); // applied verifyJWT to all routes in this file

router.get('/', getAllVideos);
router.post(
  '/',
  upload.fields([
    {
      name: 'videoFile',
      maxCount: 1,
    },
    {
      name: 'thumbnail',
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.get('/:videoId', getvideoById);
router.patch('/:videoId', upload.single('thumbnail'), updateVideo);

export default router;
