import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '16kb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '16kb',
  })
);
app.use(cookieParser());
app.use(express.static('public')); // Serve static files from the "public" directory to use for profile pictures and other assets

import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js';
import playlistRoutes from './routes/playlist.routes.js';
import likeRoutes from './routes/like.routes.js';

// routes declaration
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/playlist', playlistRoutes);
app.use('/api/v1/likes', likeRoutes);

export { app };
