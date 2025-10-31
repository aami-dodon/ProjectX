const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.1.0',
  info: {
    title: 'Project X API',
    version: '1.0.0',
    description:
      'Interactive reference for the Project X REST API. Use the authorize button to attach bearer tokens when required.',
  },
  servers: [
    {
      url: '/',
      description: 'Current environment',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      AuthUser: {
        type: 'object',
        required: ['id', 'email', 'status', 'roles', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          fullName: {
            type: 'string',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INVITED'],
          },
          emailVerifiedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          mfaEnabled: {
            type: 'boolean',
          },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerJsdocOptions = {
  definition: swaggerDefinition,
  apis: [
    path.resolve(__dirname, '../modules/**/*.router.js'),
    path.resolve(__dirname, '../modules/**/controllers/*.js'),
  ],
};

const openApiSpecification = swaggerJsdoc(swaggerJsdocOptions);

const swaggerUiOptions = {
  // Link a custom stylesheet for Swagger UI
  customCssUrl: '/api/docs/swagger.css',
  customfavIcon: '/api/docs/favicon.svg',
  customSiteTitle: 'Project-X',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

const setupSwaggerDocs = (app) => {
  app.get('/api/docs.json', (req, res) => {
    res.json(openApiSpecification);
  });

  // Serve the custom Swagger UI theme CSS
  app.get('/api/docs/swagger.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.resolve(__dirname, 'swagger.css'));
  });

  app.get('/api/docs/favicon.svg', (req, res) => {
    res.type('image/svg+xml');
    res.sendFile(path.resolve(__dirname, 'favicon.svg'));
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification, swaggerUiOptions));
};

module.exports = {
  openApiSpecification,
  setupSwaggerDocs,
};
