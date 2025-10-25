/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         matric_number:
 *           type: string
 *         phone_number:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         reference:
 *           type: string
 *         total_amount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *         created_at:
 *           type: string
 *           format: date-time
 *         paid_at:
 *           type: string
 *           format: date-time
 *         receipt_url:
 *           type: string
 *           format: uri
 * 
 *     PaymentDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         reference:
 *           type: string
 *         total_amount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *         payment_gateway_response:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         paid_at:
 *           type: string
 *           format: date-time
 *         receipt_url:
 *           type: string
 *           format: uri
 *         payment_items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               fee_category:
 *                 $ref: '#/components/schemas/FeeCategory'
 * 
 *     FeeCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the fee category
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Name of the fee category
 *           example: "Tuition Fee"
 *         description:
 *           type: string
 *           description: Description of the fee category
 *           example: "Regular tuition fee for the semester"
 *         amount:
 *           type: number
 *           format: float
 *           description: Amount of the fee
 *           example: 150000.00
 *         is_recurring:
 *           type: boolean
 *           description: Whether the fee is recurring
 *           example: true
 *         frequency:
 *           type: string
 *           enum: [once, semester, annual, monthly]
 *           description: Frequency of the recurring fee
 *           example: "semester"
 *         is_active:
 *           type: boolean
 *           description: Whether the fee category is active
 *           example: true
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: ID of the admin who created the fee category
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         updated_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the admin who last updated the fee category
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the fee category was created
 *           example: "2023-10-25T08:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the fee category was last updated
 *           example: "2023-10-25T08:00:00Z"

 *     UpdateFeeCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the fee category
 *           example: "Tuition Fee"
 *         description:
 *           type: string
 *           description: Description of the fee category
 *           example: "Updated tuition fee description"
 *         amount:
 *           type: number
 *           format: float
 *           description: Amount of the fee
 *           example: 160000.00
 *         is_active:
 *           type: boolean
 *           description: Whether the fee category is active
 *           example: true
 *       required:
 *         - name
 *         - amount
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         current_page:
 *           type: integer
 *         total_pages:
 *           type: integer
 *         total_items:
 *           type: integer
 *         items_per_page:
 *           type: integer
 * 
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 */