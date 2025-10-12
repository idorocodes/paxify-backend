const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { updatePassword } = require('../../controllers/student/passwordController');

/**
 * @swagger
 * /api/v1/student/password:
 *   put:
 *     summary: Update user password
 *     description: Update the logged-in user's password. Requires current password verification.
 *     tags: [Student Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 description: User's current password
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password to set
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 description: Must match new_password
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: Password updated successfully
 *       400:
 *         description: Invalid request - Missing fields or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: New password and confirm password do not match
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Current password is incorrect
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to update password
 */
router.put('/', authenticate, updatePassword);

module.exports = router;