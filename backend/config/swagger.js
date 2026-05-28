const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PAW Project — Marketplace API',
      version: '2.0.0',
      description: 'API REST para a aplicação de frontoffice do marketplace de supermercados. Permite aos clientes pesquisar supermercados, gerir o carrinho de compras, criar encomendas e acompanhar o estado das entregas.',
      contact: {
        name: 'PAW Project Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no login. Formato: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            phone: { type: 'string', example: '912345678' },
            nif: { type: 'string', example: '123456789' },
            address: { type: 'string', example: 'Rua das Flores, 10' },
            city: { type: 'string', example: 'Porto' },
            district: { type: 'string', example: 'Porto' },
            role: { type: 'string', enum: ['customer'], example: 'customer' }
          }
        },
        Supermarket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Supermercado Central' },
            description: { type: 'string' },
            location: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            deliveryMethods: { type: 'array', items: { type: 'string', enum: ['pickup', 'courier'] } },
            pickupCost: { type: 'number' },
            courierCost: { type: 'number' },
            openingHour: { type: 'number' },
            openingMinute: { type: 'number' },
            closingHour: { type: 'number' },
            closingMinute: { type: 'number' },
            averageRating: { type: 'number' },
            totalRatings: { type: 'number' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Leite Meio Gordo' },
            description: { type: 'string' },
            category: { type: 'string', example: 'Laticínios' },
            price: { type: 'number', example: 1.29 },
            image: { type: 'string' },
            stock: { type: 'number', example: 50 },
            supermarket: { $ref: '#/components/schemas/Supermarket' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            product: { $ref: '#/components/schemas/Product' },
            supermarket: { $ref: '#/components/schemas/Supermarket' },
            quantity: { type: 'number', example: 2 }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            customer: { type: 'string' },
            supermarket: { $ref: '#/components/schemas/Supermarket' },
            courier: { $ref: '#/components/schemas/User' },
            deliveryMethod: { type: 'string', enum: ['pickup', 'courier'] },
            deliveryCost: { type: 'number' },
            deliveryDistrict: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                  subtotal: { type: 'number' }
                }
              }
            },
            total: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivering', 'delivered', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            order: { type: 'string' },
            customer: { type: 'string' },
            supermarket: { type: 'string' },
            courier: { type: 'string' },
            supermarketRating: { type: 'number', minimum: 1, maximum: 5 },
            courierRating: { type: 'number', minimum: 1, maximum: 5 },
            supermarketComment: { type: 'string' },
            courierComment: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./routes/api/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
