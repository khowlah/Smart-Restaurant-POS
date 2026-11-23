import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Restaurant & Café POS + Live Kitchen Display System Backend API',
    version: '1.0.0',
    description: 'Production-ready RESTful backend API for Smart Restaurant & Café Point-of-Sale with live Kitchen Display System, Supabase PostgreSQL, and strict Role-Based Access Control.',
    contact: {
      name: 'khowlah al_hebshi',
      email: 'www.khowlah2001@gmail.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Bearer JWT token or demo tokens (demo-manager-token, demo-cashier-token, demo-kitchen-token)'
      }
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation completed successfully' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data: { type: 'null', example: null },
          message: { type: 'string', example: 'Validation error' }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        description: 'Authenticate with email and password to receive JWT token and profile.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'manager@restaurant.pos' },
                  password: { type: 'string', example: 'manager123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful login' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current Authenticated User',
        description: 'Returns profile and role of authenticated user.',
        responses: {
          200: { description: 'Profile retrieved' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List Categories',
        description: 'Retrieve all active food and beverage categories.',
        security: [],
        responses: {
          200: { description: 'Categories list' }
        }
      },
      post: {
        tags: ['Categories'],
        summary: 'Create Category (Manager Only)',
        responses: {
          201: { description: 'Category created' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/menu': {
      get: {
        tags: ['Menu'],
        summary: 'List Menu Items',
        description: 'List menu items with category and availability filters.',
        security: [],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'is_available', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } }
        ],
        responses: {
          200: { description: 'List of menu items' }
        }
      },
      post: {
        tags: ['Menu'],
        summary: 'Create Menu Item (Manager Only)',
        responses: {
          201: { description: 'Created' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/menu/{id}/availability': {
      patch: {
        tags: ['Menu'],
        summary: 'Toggle Menu Item Availability (Manager Only)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_available'],
                properties: {
                  is_available: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Availability updated' }
        }
      }
    },
    '/api/tables': {
      get: {
        tags: ['Tables'],
        summary: 'List Dining Tables',
        responses: {
          200: { description: 'List of dining tables' }
        }
      }
    },
    '/api/tables/{id}/status': {
      patch: {
        tags: ['Tables'],
        summary: 'Update Dining Table Status (Cashier / Manager)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['available', 'occupied', 'billing_pending'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Table status updated' }
        }
      }
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create Order (Cashier / Manager)',
        description: 'Creates dine_in, takeaway, or delivery order. Atomically checks & reserves table if dine_in, recalculates prices server-side, validates taxes and discounts.',
        responses: {
          201: { description: 'Order created successfully' },
          400: { description: 'Validation or price error' },
          409: { description: 'Table conflict / already occupied' }
        }
      },
      get: {
        tags: ['Orders'],
        summary: 'List All Orders',
        responses: {
          200: { description: 'Orders list' }
        }
      }
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get Order by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Order details' },
          404: { description: 'Order not found' }
        }
      }
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders', 'KDS'],
        summary: 'Transition Order Status (Kitchen / Cashier / Manager)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['new', 'preparing', 'ready', 'completed', 'cancelled'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Status updated' },
          400: { description: 'Invalid transition' }
        }
      }
    },
    '/api/kds/orders': {
      get: {
        tags: ['KDS'],
        summary: 'List Active Kitchen Orders',
        description: 'Returns new, preparing, ready orders sorted chronologically with seconds_elapsed.',
        responses: {
          200: { description: 'Active kitchen orders' }
        }
      }
    },
    '/api/orders/{id}/settle': {
      post: {
        tags: ['Payments'],
        summary: 'Settle Order Bill (Cashier / Manager)',
        description: 'Atomically processes payment (cash, card, online), marks order completed, and releases dining table.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['payment_method', 'amount'],
                properties: {
                  payment_method: { type: 'string', enum: ['cash', 'card', 'online'] },
                  amount: { type: 'number', example: 51.75 },
                  transaction_reference: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Payment settled and table released' },
          400: { description: 'Amount mismatch or order cancelled' },
          409: { description: 'Duplicate settlement' }
        }
      }
    },
    '/api/reports/summary': {
      get: {
        tags: ['Reports'],
        summary: "Daily Sales Report Summary (Manager Only)",
        description: 'Returns revenue, order count, order type breakdown, and top 5 best selling items.',
        responses: {
          200: { description: 'Sales report summary' },
          403: { description: 'Forbidden: manager only' }
        }
      }
    }
  }
};

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
