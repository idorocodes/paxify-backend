const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     description: Retrieve all active departments. Can be filtered by faculty and search term.
 *     tags: [Departments]
 *     parameters:
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Filter departments by faculty
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search departments by name or code
 *     responses:
 *       200:
 *         description: List of departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       faculty:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', departmentController.getDepartments);

module.exports = router;