const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const feeController = require('../controllers/feeController');

// Import Swagger schema definitions
require('../swagger/schemas');

/**
 * @swagger
 * /api/v1/fees:
 *   get:
 *     summary: Get all fee categories
 *     description: Retrieve a list of all fee categories with optional filtering
 *     tags: [Fees]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: is_active 
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: A list of fee categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeeCategory'
 */
router.get('/', feeController.getAllFees);

/**
 * @swagger
 * /api/v1/fees/{id}:
 *   get:
 *     summary: Get a fee category by ID
 *     description: Retrieve a single fee category by its ID
 *     tags: [Fees]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Fee category ID
 *     responses:
 *       200:
 *         description: Fee category data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FeeCategory'
 *       404:
 *         description: Fee category not found
 */
router.get('/:id', feeController.getFeeDetails);

/**
 * @swagger
 * /api/v1/fees/{id}:
 *   put:
 *     summary: Update a fee category
 *     description: Update an existing fee category
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Fee category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFeeCategoryRequest'
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
 *                 data:
 *                   $ref: '#/components/schemas/FeeCategory'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Fee category not found
 */
router.put('/:id', authenticateAdmin, feeController.updateFee);

module.exports = router;