const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paxify Backend API',
      version: '1.0.0',
      description: 'API documentation for Paxify student management system',
      contact: {
        name: 'Paxify Team',
        email: 'support@paxify.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server (with API prefix /api/v1)',
      },
      {
        url: 'https://api.paxify.com/api/v1',
        description: 'Production server (with API prefix /api/v1)',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Auto-generated user ID',
            },
            first_name: {
              type: 'string',
              description: 'First name of the user',
              example: 'John',
            },
            last_name: {
              type: 'string',
              description: 'Last name of the user',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@university.edu',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              minLength: 6,
            },
            matric_number: {
              type: 'string',
              description: 'Student matriculation number (optional)',
              example: 'MAT2023001',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            full_name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@university.edu',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              minLength: 6,
            },
            matric_number: {
              type: 'string',
              description: 'Student matriculation number (optional)',
              example: 'MAT2023001',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['matric_number', 'password'],
          properties: {
            matric_number: {
              type: 'string',
              description: 'Student matriculation number',
              example: 'MAT2023001',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Student password',
            },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address',
              example: 'john.doe@university.edu',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Response data (when applicable)',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Indicates the request failed',
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Something went wrong',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Include nested route folders so swagger picks up JSDoc in subdirectories (e.g. routes/student)
  apis: ['./routes/**/*.js', './controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};