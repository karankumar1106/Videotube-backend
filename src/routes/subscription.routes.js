import { Router } from 'express';
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from '../controllers/subscription.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.post('/c/:channelId', toggleSubscription);
router.get('/u/:subscriberId', getUserChannelSubscribers);
router.get('/c/:channelId', getSubscribedChannels);

export default router;
