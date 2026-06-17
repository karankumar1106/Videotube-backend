import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
const router = Router();
// router.route("/register").post(registerUser);
router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);

router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.post('/change-password', verifyJWT, changeCurrentPassword);
router.get('/current', verifyJWT, getCurrentUser);
router.get('/channel/:username', getUserChannelProfile);
router.patch('/avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.patch('/coverImage', verifyJWT, upload.single('coverImage'), updateUserCoverImage);
router.patch('/update-account', verifyJWT, updateAccountDetails);

router.post('/refresh-token', refreshAccessToken);

export default router;
