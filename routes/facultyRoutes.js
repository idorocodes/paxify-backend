const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');



/**
 * @swagger
 * /api/v1/faculties:
 *   get:
 *     summary: Get all faculties
 *     description: Retrieve all active faculties with optional search filtering (Public endpoint)
 *     tags: [Faculties]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search faculties by name or code
 *     responses:
 *       200:
 *         description: List of faculties retrieved successfully
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
 *                       is_active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get('/faculties/', facultyController.getAllFaculties);


/**
 * @swagger
 * /api/v1/admin/faculties:
 *   post:
 *     summary: Create a new faculty
 *     description: Create a new academic faculty (Admin only)
 *     tags: [Admin Faculty Management]
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
 *                 description: Name of the faculty (e.g. "Faculty of Science")
 *               code:
 *                 type: string
 *                 description: Unique code identifier for the faculty (e.g. "SCI")
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/admin/faculties', authenticateAdmin, facultyController.createFaculty);

/**
 * @swagger
 * /api/v1/admin/faculties/{id}:
 *   put:
 *     summary: Update a faculty
 *     description: Update an existing faculty (Admin only)
 *     tags: [Admin Faculty Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Faculty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated faculty name
 *               code:
 *                 type: string
 *                 description: Updated faculty code
 *               is_active:
 *                 type: boolean
 *                 description: Whether the faculty is active
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 *       404:
 *         description: Faculty not found
 *       500:
 *         description: Server error
 */
router.put('/admin/faculties/:id', authenticateAdmin, facultyController.updateFaculty);



module.exports = router;