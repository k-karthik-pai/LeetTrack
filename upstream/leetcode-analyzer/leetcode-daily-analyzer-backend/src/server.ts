import express from 'express';
import cors from 'cors';
import { config } from './config';

// Import Routes
import departmentsRouter from './routes/departments.routes';
import studentsRouter from './routes/students.routes';
import analysisRouter from './routes/analysis.routes';
import dashboardRouter from './routes/dashboard.routes';
import leaderboardRouter from './routes/leaderboard.routes';
import snapshotsRouter from './routes/snapshots.routes';
import exportRouter from './routes/export.routes';
import seedRouter from './routes/seed.routes';
import templateRouter from './routes/template.routes';

const app = express();

// CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'leetcode-daily-analyzer-backend',
    timestamp: new Date().toISOString(),
    timezone: config.timezone,
  });
});

// Mount Routes
app.use('/api/departments', departmentsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/analyze', analysisRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/snapshots', snapshotsRouter);
app.use('/api/export', exportRouter);
app.use('/api/seed-sample', seedRouter);
app.use('/api/template', templateRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`⚡ LeetCode Daily Analyzer Backend is running on http://localhost:${PORT}`);
  console.log(`📡 Accepting requests from frontend: ${config.frontendUrl}`);
});

export default app;
