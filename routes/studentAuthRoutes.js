const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent } = require('../controllers/student/authController');

/**
 * @swagger
 * /api/v1/student/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Student Authentication]
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
 *                 description: Student's first name
 *               last_name:
 *                 type: string
 *                 description: Student's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Student's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Student's password
 *               matric_number:
 *                 type: string
 *                 description: Student's matriculation number
 *     responses:
 *       201:
 *         description: Student registered successfully
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
 *                   example: Student registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
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
 *                         matric_number:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 */
router.post('/register', registerStudent);

/**
 * @swagger
 * /api/v1/student/login:
 *   post:
 *     summary: Login a student
 *     tags: [Student Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matric_number
 *               - password
 *             properties:
 *               matric_number:
 *                 type: string
 *                 description: Student's matriculation number
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Student's password
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
 *                     student:
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
 *                         matric_number:
 *                           type: string
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 */
router.post('/login', loginStudent);

module.exports = router;