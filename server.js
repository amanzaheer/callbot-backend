/**
 * Universal AI Voice Call Bot Backend
 * Main server entry point
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const businessRoutes = require('./routes/business');
const callRoutes = require('./routes/calls');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const telnyxRoutes = require('./routes/telnyx.routes');

const app = express();
const server = http.createServer(app);

// Trust proxy headers (needed when running behind ngrok or other proxies)
// This also prevents express-rate-limit from throwing X-Forwarded-For warnings.
app.set('trust proxy', 1);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set('io', io);

// Middleware - Helmet relaxed so webhooks (Telnyx, etc.) from external origins are not blocked with 403
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Telnyx webhook routes (mounted at absolute path in router)
app.use(telnyxRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);

// Test Call Routes (for development/testing without real phone numbers)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_CALLS === 'true') {
  const testCallRoutes = require('./routes/testCalls');
  app.use('/api/test-calls', testCallRoutes);
}

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });

  // Join call room for real-time updates
  socket.on('join-call', (callSessionId) => {
    socket.join(`call-${callSessionId}`);
    logger.info(`Socket ${socket.id} joined call room: ${callSessionId}`);
  });

  socket.on('leave-call', (callSessionId) => {
    socket.leave(`call-${callSessionId}`);
    logger.info(`Socket ${socket.id} left call room: ${callSessionId}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB first, then start server
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    logger.info('✅ Connected to MongoDB');

    // Start server after MongoDB connection
    server.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot'}`);
    });
  })
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error.message);
    logger.error('Please check:');
    logger.error('1. Is MongoDB running? (mongod or MongoDB service)');
    logger.error('2. Is MONGODB_URI correct in .env file?');
    logger.error('3. For MongoDB Atlas: Check network access and credentials');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };

