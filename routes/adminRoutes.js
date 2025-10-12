const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve key metrics for admin dashboard
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     total_revenue:
 *                       type: number
 *                     monthly_revenue:
 *                       type: number
 *                     active_users:
 *                       type: integer
 *                     recent_payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized - Not an admin
 *       500:
 *         description: Server error
 */
router.get('/dashboard/stats', authenticateAdmin, adminController.getDashboardStats);

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve all payments with filtering and pagination
 *     tags: [Admin Payment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filter by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
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
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Not an admin
 *       500:
 *         description: Server error
 */
router.get('/payments', authenticateAdmin, adminController.getAllPayments);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with search and pagination
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or matric number
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Not an admin
 *       500:
 *         description: Server error
 */
router.get('/users', authenticateAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /admin/fees:
 *   post:
 *     summary: Create fee category
 *     description: Create a new fee category
 *     tags: [Admin Fee Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Fee category name
 *               description:
 *                 type: string
 *                 description: Fee category description
 *               amount:
 *                 type: number
 *                 description: Fee amount in kobo/cents
 *     responses:
 *       201:
 *         description: Fee category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fee category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/FeeCategory'
 *       400:
 *         description: Invalid request - Missing required fields
 *       401:
 *         description: Unauthorized - Not an admin
 *       500:
 *         description: Server error
 */
router.post('/fees', authenticateAdmin, adminController.createFeeCategory);

/**
 * @swagger
 * /admin/fees/{id}:
 *   put:
 *     summary: Update fee category
 *     description: Update an existing fee category
 *     tags: [Admin Fee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fee category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Fee category name
 *               description:
 *                 type: string
 *                 description: Fee category description
 *               amount:
 *                 type: number
 *                 description: Fee amount in kobo/cents
 *     responses:
 *       200:
 *         description: Fee category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fee category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/FeeCategory'
 *       401:
 *         description: Unauthorized - Not an admin
 *       404:
 *         description: Fee category not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Deactivate fee category
 *     description: Soft delete a fee category
 *     tags: [Admin Fee Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fee category ID
 *     responses:
 *       200:
 *         description: Fee category deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fee category deactivated successfully
 *       401:
 *         description: Unauthorized - Not an admin
 *       404:
 *         description: Fee category not found
 *       500:
 *         description: Server error
 */
router.put('/fees/:id', authenticateAdmin, adminController.updateFeeCategory);
router.delete('/fees/:id', authenticateAdmin, adminController.deactivateFeeCategory);

/**
 * @swagger
 * /admin/reports/revenue:
 *   get:
 *     summary: Generate revenue report
 *     description: Generate a PDF report of revenue statistics
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request - Missing date range
 *       401:
 *         description: Unauthorized - Not an admin
 *       500:
 *         description: Server error
 */
router.get('/reports/revenue', authenticateAdmin, adminController.generateRevenueReport);

module.exports = router;