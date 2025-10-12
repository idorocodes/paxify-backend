const express = require('express');
const router = express.Router();
const { validate } = require('../utils/validation');
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a verification code to the user's email for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification code sent successfully
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
 *                   example: Verification code sent to your email
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: Email not found
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/verify-code:
 *   post:
 *     summary: Verify reset code
 *     description: Verify the 6-digit code sent to user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Code verified successfully
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
 *                   example: Code verified successfully
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify-code', authController.verifyCode);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Set new password
 *     description: Update user's password after verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_password, confirm_password, code]
 *             properties:
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "newSecurePass123"
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: "newSecurePass123"
 *               code:
 *                 type: string
 *                 example: "123456"
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
 *         description: Invalid request (passwords don't match or invalid code)
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;