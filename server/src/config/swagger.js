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

const generateRedocHtml = () => `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Project X API Documentation</title>
      <style>
        body {
          margin: 0;
          padding: 0;
        }
        redoc {
          height: 100vh;
        }
      </style>
      <link rel="icon" type="image/svg+xml" href="/api/docs/favicon.svg" />
    </head>
    <body>
      <redoc spec-url="/api/docs/swagger.json"></redoc>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </body>
  </html>`;

const setupSwaggerDocs = (app) => {
  const redocHtml = generateRedocHtml();

  app.get('/api/docs.json', (req, res) => {
    res.json(openApiSpecification);
  });

  app.get('/api/docs/swagger.json', (req, res) => {
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

  app.get('/docs', (req, res) => {
    res.type('html');
    res.send(redocHtml);
  });
};

module.exports = {
  openApiSpecification,
  setupSwaggerDocs,
};
