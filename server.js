require('dotenv').config();
const express = require("express");
const cors = require('cors');
const helmet = require('helmet');
const { swaggerUi, specs } = require('./config/swagger');
const { createRateLimiter } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const feeRoutes = require("./routes/feeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const feeAssignmentRoutes = require("./routes/feeAssignmentRoutes");
const adminDepartmentRoutes = require("./routes/adminDepartmentRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.RATE_LIMIT_MAX_REQUESTS || 100
);
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', feeAssignmentRoutes);
app.use('/api/v1/admin', adminDepartmentRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/faculties', facultyRoutes);

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
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server has started, listening on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
