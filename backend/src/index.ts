import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import submissionsRoutes from './routes/submissions.routes';

const app = express();

// Middleware
app.use(
  cors({
    origin: config.frontend.url,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/files', filesRoutes);
app.use('/submissions', submissionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   AIxiliary Server Running            ║
  ╚═══════════════════════════════════════╝

  🚀 Server: http://localhost:${config.port}
  🌍 Environment: ${config.nodeEnv}
  📁 Frontend: ${config.frontend.url}

  API Endpoints:
  - GET  /health
  - GET  /auth/login
  - GET  /auth/callback
  - GET  /auth/user
  - POST /auth/logout
  - GET  /files
  - POST /submissions
  - GET  /submissions/:id

  `);
});

export default app;
