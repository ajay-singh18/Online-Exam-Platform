require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validate');
const { configureCloudinary } = require('./utils/cloudinary');
const { startAutoSubmitCron } = require('./utils/cronJobs');

/* Route imports */
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const attemptRoutes = require('./routes/attempts');
const analyticsRoutes = require('./routes/analytics');
const instituteRoutes = require('./routes/institutes');
const paymentRoutes = require('./routes/payments');
const planRoutes = require('./routes/plans');
const documentRoutes = require('./routes/documents');
const batchRoutes = require('./routes/batches');
const notificationRoutes = require('./routes/notifications');

const app = express();

/* === Middleware Stack === */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  frameguard: false,
}));
/* Manual CORS — guaranteed to run before anything else */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeBody);

// Serve static files from the 'uploads' directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* === API Routes === */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/notifications', notificationRoutes);

/* Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* Centralized error handler (must be after routes) */
app.use(errorHandler);

/* === Start Server === */
const PORT = process.env.PORT || 5000;

const http = require('http');
const { initSocket } = require('./utils/socket');

const start = async () => {
  try {
    await connectDB();
    const { seedPlans } = require('./utils/seedPlans');
    await seedPlans();
    
    configureCloudinary();
    startAutoSubmitCron();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'production') {
  start();
} else {
  /* Vercel Serverless Execution */
  let dbReady = connectDB();
  configureCloudinary();

  // Ensure DB is connected before handling any request
  app.use(async (req, res, next) => {
    try {
      await dbReady;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Database connection failed' });
    }
  });
}

module.exports = app;
