const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const feeAssignmentController = require('../controllers/feeAssignmentController');

/**
 * @swagger
 * /admin/fees/assign:
 *   post:
 *     summary: Assign fees to students
 *     description: Assign fees to students based on level, faculty, or custom group
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
 *               - fee_category_id
 *               - target_type
 *             properties:
 *               fee_category_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the fee category to assign
 *               target_type:
 *                 type: string
 *                 enum: [LEVEL, FACULTY, CUSTOM_GROUP]
 *                 description: Type of target group for fee assignment
 *               levels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["100", "200"]
 *                 description: Required if target_type is LEVEL - Array of level numbers
 *               faculty_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Required if target_type is FACULTY - Array of faculty IDs
 *               departments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of department names to filter students
 *               student_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Required if target_type is CUSTOM_GROUP
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Optional due date for the payment
 *               description:
 *                 type: string
 *                 description: Optional description for the fee assignment
 *     responses:
 *       200:
 *         description: Fees assigned successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     fee_category:
 *                       $ref: '#/components/schemas/FeeCategory'
 *                     assigned_count:
 *                       type: integer
 *                     target_type:
 *                       type: string
 *                     level:
 *                       type: string
 *                     departments:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request - Invalid or missing parameters
 *       401:
 *         description: Unauthorized - Not an admin
 *       404:
 *         description: Fee category not found or no matching students
 *       500:
 *         description: Server error
 */
router.post('/fees/assign', authenticateAdmin, feeAssignmentController.assignFeeToStudents);

module.exports = router;