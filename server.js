require('dotenv').config();
const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const { swaggerUi, specs } = require('./config/swagger');
const { createRateLimiter } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();


app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

// Import routes
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const userRoutes = require("./routes/userRoutes");
const feeRoutes = require("./routes/feeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const feeAssignmentRoutes = require("./routes/feeAssignmentRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const studentDashboardRoutes = require("./routes/student/dashboardRoutes");
const adminDepartmentRoutes = require("./routes/adminDepartmentRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
// Middleware
app.use(helmet()); // Security headers

// CORS configuration - Allow all origins
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // CORS preflight cache time in seconds (24 hours)
  optionsSuccessStatus: 204
}));

// Add CORS error handler
app.use((err, req, res, next) => {
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Origin not allowed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : undefined
    });
  }
  next(err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.RATE_LIMIT_MAX_REQUESTS || 100
);
app.use('/api/v1/', apiLimiter);

// Root route - redirect to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// API Routes
// Student routes - more specific routes first
app.use('/api/v1/student/dashboard', studentDashboardRoutes);
app.use('/api/v1/student/password', require('./routes/student/passwordRoutes'));
app.use('/api/v1/student', studentAuthRoutes);
// General routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1', facultyRoutes);

// Admin routes - grouped by area
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/departments', adminDepartmentRoutes);
app.use('/api/v1/admin/fees', feeAssignmentRoutes);
app.use('/api/v1/admin', adminRoutes);
// app.use('/api/v1/admin', facultyRoutes);

// Auth routes (password reset, verify code, reset password)
app.use('/api/v1/auth', require('./routes/auth/passwordReset'));


// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Paxify API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error details
  console.error('\n[ERROR] Request details:', {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });
  console.error('\n[ERROR] Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code
  });

  // Log to file system
  logger.error('API Error:', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  // Send response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    } : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n[UNCAUGHT EXCEPTION]', err);
  logger.error('Uncaught Exception:', { error: err, stack: err.stack });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[UNHANDLED REJECTION] At:', promise, '\nReason:', reason);
  logger.error('Unhandled Rejection:', { reason: reason, promise: promise });
});

app.listen(port, () => {
  console.log(`Server has started, listening on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});