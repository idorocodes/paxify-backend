const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin } = require('../controllers/admin/authController');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/admin/auth/register:
 *   post:
 *     summary: Register a new admin (Super admin only)
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: Admin's first name
 *               last_name:
 *                 type: string
 *                 description: Admin's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Admin's password
 *               role:
 *                 type: string
 *                 enum: [admin, super_admin]
 *                 default: admin
 *                 description: Admin's role
 *               department:
 *                 type: string
 *                 description: Admin's department (optional)
 *               permissions:
 *                 type: object
 *                 description: Admin's specific permissions (optional)
 *     responses:
 *       201:
 *         description: Admin account created successfully
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
 *                   example: Admin account created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         department:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 */
router.post('/register', authenticateAdmin, registerAdmin);

/**
 * @swagger
 * /api/v1/admin/auth/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         department:
 *                           type: string
 *                         permissions:
 *                           type: object
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 */
router.post('/login', loginAdmin);

module.exports = router;