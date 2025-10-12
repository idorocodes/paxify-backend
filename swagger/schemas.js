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
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         amount:
 *           type: number
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *           format: uuid
 *         updated_at:
 *           type: string
 *           format: date-time
 *         updated_by:
 *           type: string
 *           format: uuid
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