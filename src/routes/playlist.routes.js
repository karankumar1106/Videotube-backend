import { Router } from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getplaylistByid,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from '../controllers/playlist.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT);
router.post('/', createPlaylist);
router
  .route('/:playlistId')
  .get(getplaylistByid)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.patch('/add/:videoId/:playlistId', addVideoToPlaylist);
router.patch('/remove/:videoId/:playlistId', removeVideoFromPlaylist);
router.get('/user/:userId', getUserPlaylists);

export default router;
