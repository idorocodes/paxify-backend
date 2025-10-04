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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.paxify.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Student: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'matric_no'],
          properties: {
            id: {
              type: 'integer',
              description: 'Auto-generated student ID',
            },
            full_name: {
              type: 'string',
              description: 'Full name of the student',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address',
              example: 'john.doe@university.edu',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Student password',
              minLength: 6,
            },
            matric_no: {
              type: 'string',
              description: 'Student matriculation number',
              example: 'MAT2023001',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address',
              example: 'john.doe@university.edu',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Student password',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'matric_no'],
          properties: {
            full_name: {
              type: 'string',
              description: 'Full name of the student',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address',
              example: 'john.doe@university.edu',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Student password',
              minLength: 6,
            },
            matric_no: {
              type: 'string',
              description: 'Student matriculation number',
              example: 'MAT2023001',
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
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};