const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const buildOpenApiSpec = () => {
  const options = {
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Project X API',
        version: '0.1.0',
        description:
          'OpenAPI documentation for Project X services. The specification is built from inline JSDoc annotations across feature modules.',
      },
      servers: [
        {
          url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000/api/v1',
          description: 'Primary API server',
        },
      ],
      components: {
        schemas: {
          ErrorResponse: {
            type: 'object',
            required: ['error'],
            properties: {
              error: {
                type: 'object',
                required: ['message', 'code', 'details', 'requestId', 'traceId'],
                properties: {
                  message: { type: 'string', description: 'Human readable error message.' },
                  code: { type: 'string', description: 'Application specific error code.' },
                  details: {
                    oneOf: [{ type: 'object' }, { type: 'string' }, { type: 'array' }, { type: 'null' }],
                    description: 'Optional metadata describing the error.',
                  },
                  requestId: {
                    type: ['string', 'null'],
                    description: 'Request correlation identifier propagated from middleware.',
                  },
                  traceId: {
                    type: ['string', 'null'],
                    description: 'Trace identifier for distributed tracing.',
                  },
                },
              },
            },
          },
          HealthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Overall health state derived from downstream checks.',
                enum: ['ok', 'degraded', 'error'],
              },
              latencyMs: {
                type: 'number',
                description: 'Total time taken to assemble the health payload.',
              },
              timestamp: { type: 'string', format: 'date-time' },
              environment: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  buildTimestamp: { type: ['string', 'null'], format: 'date-time' },
                },
              },
              uptime: {
                type: 'object',
                properties: {
                  seconds: { type: 'integer' },
                  humanized: { type: 'string' },
                },
              },
              api: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  connection: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                  query: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                },
              },
              minio: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  bucket: { type: 'string' },
                  connection: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                  bucketCheck: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                },
              },
              email: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  error: { type: 'string' },
                },
              },
              dns: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        host: { type: 'string' },
                        address: { type: 'string' },
                        family: { type: 'integer' },
                      },
                    },
                  },
                },
              },
              cors: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  allowedOrigins: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
              system: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  load: {
                    type: 'array',
                    items: { type: 'number' },
                  },
                  memory: {
                    type: 'object',
                    properties: {
                      free: { type: 'string' },
                      total: { type: 'string' },
                      usage: { type: 'string' },
                    },
                  },
                  disks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        mount: { type: 'string' },
                        size: { type: 'string' },
                        used: { type: 'string' },
                        available: { type: 'string' },
                        percentUsed: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          EmailTestRequest: {
            type: 'object',
            required: ['to'],
            properties: {
              to: {
                type: 'string',
                format: 'email',
                description: 'Recipient email address used for the connectivity test.',
              },
            },
          },
          EmailTestResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'sent',
              },
              messageId: {
                type: 'string',
                description: 'Identifier returned by Nodemailer for the outgoing message.',
              },
            },
          },
          StorageUploadResponse: {
            type: 'object',
            properties: {
              bucket: { type: 'string' },
              objectName: { type: 'string' },
              presignedUrl: {
                type: 'string',
                format: 'uri',
              },
            },
          },
        },
      },
    },
    apis: [path.resolve(__dirname, '../modules/**/*.router.js')],
  };

  return swaggerJsdoc(options);
};

const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'Project X API Docs',
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldPrint = args.includes('--print');
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  try {
    const spec = buildOpenApiSpec();

    if (outputPath) {
      const resolvedPath = path.resolve(process.cwd(), outputPath);
      fs.writeFileSync(resolvedPath, JSON.stringify(spec, null, 2));
      console.log(`OpenAPI specification written to ${resolvedPath}`);
    } else if (shouldPrint) {
      process.stdout.write(`${JSON.stringify(spec, null, 2)}\n`);
    } else {
      console.log('OpenAPI specification generated successfully');
    }
  } catch (error) {
    console.error('Failed to generate OpenAPI specification');
    console.error(error);
    process.exit(1);
  }
}

module.exports = {
  buildOpenApiSpec,
  swaggerUiOptions,
};
