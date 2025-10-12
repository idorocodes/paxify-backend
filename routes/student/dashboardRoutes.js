const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { getDashboardStats } = require('../../controllers/student/dashboardController');

/**
 * @swagger
 * /api/v1/student/dashboard:
 *   get:
 *     summary: Get student dashboard statistics
 *     description: Retrieve statistics and recent transactions for student dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_payments:
 *                       type: integer
 *                       description: Total number of payments made
 *                       example: 8
 *                     upcoming_payments:
 *                       type: integer
 *                       description: Number of upcoming payments
 *                       example: 4
 *                     pending_payments:
 *                       type: integer
 *                       description: Number of pending payments
 *                       example: 3
 *                     recent_transactions:
 *                       type: array
 *                       description: List of recent transactions
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           amount:
 *                             type: number
 *                             example: 5000
 *                           status:
 *                             type: string
 *                             enum: [pending, success, failed]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           fee_name:
 *                             type: string
 *                             example: Departmental Fee
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getDashboardStats);

module.exports = router;