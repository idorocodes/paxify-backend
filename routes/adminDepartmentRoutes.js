const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

/**
 * @swagger
 * /admin/departments:
 *   post:
 *     summary: Create a new department
 *     description: Create a new academic department (Admin only)
 *     tags: [Admin Department Management]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Department name
 *               code:
 *                 type: string
 *                 description: Department code
 *               description:
 *                 type: string
 *                 description: Department description
 *               faculty:
 *                 type: string
 *                 description: Faculty name
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Department already exists
 *       500:
 *         description: Server error
 */
router.post('/departments', authenticateAdmin, departmentController.createDepartment);

/**
 * @swagger
 * /admin/departments/{id}:
 *   put:
 *     summary: Update a department
 *     description: Update an existing department (Admin only)
 *     tags: [Admin Department Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               faculty:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.put('/departments/:id', authenticateAdmin, departmentController.updateDepartment);

/**
 * @swagger
 * /admin/departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     description: Delete an existing department (Admin only)
 *     tags: [Admin Department Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.delete('/departments/:id', authenticateAdmin, departmentController.deleteDepartment);

module.exports = router;