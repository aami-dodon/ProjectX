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
      url: '/api',
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
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

const setupSwaggerDocs = (app) => {
  app.get('/api/docs.json', (req, res) => {
    res.json(openApiSpecification);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification, swaggerUiOptions));
};

module.exports = {
  openApiSpecification,
  setupSwaggerDocs,
};
