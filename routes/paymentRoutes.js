const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /api/v1/payments/initialize:
 *   post:
 *     summary: Initialize payment
 *     description: Initialize a new payment with selected fee categories
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fee_ids
 *             properties:
 *               fee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of fee category IDs
 *     responses:
 *       201:
 *         description: Payment initialized successfully
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
 *                   example: Payment initialized successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment_id:
 *                       type: string
 *                       format: uuid
 *                     reference:
 *                       type: string
 *                     authorization_url:
 *                       type: string
 *                       format: uri
 *                     total_amount:
 *                       type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fee_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           amount:
 *                             type: number
 *       400:
 *         description: Invalid request - Invalid fee selection
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/initialize', authenticate, paymentController.initializePayment);

/**
 * @swagger
 * /api/v1/payments/verify/{reference}:
 *   get:
 *     summary: Verify payment
 *     description: Verify a payment using its reference
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference from Paystack
 *     responses:
 *       200:
 *         description: Payment verified successfully
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
 *                     payment_id:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [success, pending, failed]
 *                     total_amount:
 *                       type: number
 *                     paid_at:
 *                       type: string
 *                       format: date-time
 *                     receipt_url:
 *                       type: string
 *                       format: uri
 *       400:
 *         description: Invalid request - Payment verification failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/verify/:reference', authenticate, paymentController.verifyPayment);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get payment history
 *     description: Get authenticated user's payment history
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
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
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_paid:
 *                           type: number
 *                         pending_payments:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment details
 *     description: Get detailed information about a specific payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentDetail'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, paymentController.getPaymentDetails);

/**
 * @swagger
 * /api/v1/payments/{id}/receipt:
 *   get:
 *     summary: Download payment receipt
 *     description: Download the PDF receipt for a completed payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Receipt downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Receipt not available - Payment not completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:id/receipt', authenticate, paymentController.downloadReceipt);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Paystack webhook
 *     description: Handle payment webhook events from Paystack
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 *       500:
 *         description: Server error
 */
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;