import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Unified Event Analytics API',
      version: '1.0.0',
      description: 'Scalable backend API for website and mobile app analytics',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3000',//FIXME:
        description: 'Prod server'
      }, 

    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for event collection'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and API key management'
      },
      {
        name: 'Analytics',
        description: 'Event collection and analytics endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
