import { OpenAPIV3 } from './openapi.types';

export const openApiSpec: OpenAPIV3 = {
  openapi: '3.0.3',
  info: {
    title: 'Pasta la Vista API',
    description: `
## API de Delivery de Comida Italiana

Backend completo para o aplicativo Pasta la Vista, um sistema de delivery de comida italiana com:

- **Autenticacao** via JWT (access + refresh tokens)
- **Cardapio** com produtos armazenados em MongoDB e cache Redis
- **Pedidos** com validacao de estoque e calculo server-side
- **Estoque** gerenciado em PostgreSQL com status automatico

### Autenticacao

Todas as rotas protegidas requerem um token JWT no header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

O access token expira em 15 minutos. Use o endpoint \`/auth/refresh\` para obter um novo.

### Padrao de Resposta

Todas as respostas seguem o formato:

\`\`\`json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "..." 
}
\`\`\`

### Rate Limiting

- Rotas gerais: 100 requisicoes / 15 minutos
- Rotas de autenticacao: 20 requisicoes / 15 minutos
    `,
    version: '1.0.0',
    contact: {
      name: 'Augusto Almeida',
      email: 'admin@pastalavista.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3333',
      description: 'Desenvolvimento Local',
    },
    {
      url: 'https://api.pastalavista.render.app',
      description: 'Producao (Render)',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Verificacao de saude da API',
    },
    {
      name: 'Autenticacao',
      description: 'Registro, login, refresh e logout de usuarios',
    },
    {
      name: 'Cardapio',
      description: 'Consulta de produtos, busca e filtragem por categoria',
    },
    {
      name: 'Cardapio (Admin)',
      description: 'Gerenciamento de produtos (apenas ADMIN)',
    },
    {
      name: 'Pedidos',
      description: 'Criacao e consulta de pedidos',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Verifica se a API esta funcionando corretamente.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'API funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time', example: '2026-04-09T22:00:00.000Z' },
                    environment: { type: 'string', example: 'development' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // AUTH
    '/api/v1/auth/register': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Registrar novo usuario',
        description: 'Cria um novo usuario com role CLIENT. Retorna tokens de acesso.',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
              example: {
                name: 'Maria Silva',
                email: 'maria@email.com',
                password: 'Senha123!',
                phone: '+5511999991111',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': {
            description: 'Email ja cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { status: 'error', message: 'Email ja cadastrado' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Login',
        description: 'Autentica usuario com email e senha. Retorna access e refresh tokens.',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
              example: {
                email: 'maria@email.com',
                password: 'Senha123!',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login bem-sucedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Renovar access token',
        description: 'Usa o refresh token para obter novos tokens. Requer autenticacao.',
        operationId: 'refreshToken',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshInput' },
              example: {
                refresh_token: 'eyJhbGciOiJIUzI1NiIs...',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens renovados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        access_token: { type: 'string' },
                        refresh_token: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Autenticacao'],
        summary: 'Logout',
        description: 'Invalida a sessao do usuario removendo o refresh token do Redis.',
        operationId: 'logoutUser',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout realizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Logout realizado com sucesso' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // MENU (publico)
    '/api/v1/menu': {
      get: {
        tags: ['Cardapio'],
        summary: 'Listar cardapio',
        description: 'Retorna todos os produtos ativos do cardapio. Resultado cacheado no Redis por 5 minutos.',
        operationId: 'getMenu',
        responses: {
          '200': {
            description: 'Lista de produtos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Cardapio (Admin)'],
        summary: 'Criar produto',
        description: 'Cria um novo produto no cardapio. Requer role ADMIN. Invalida cache Redis.',
        operationId: 'createProduct',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductInput' },
              example: {
                name: 'Pizza Napolitana',
                description: 'Molho de tomate, anchovas, alcaparras e oregano',
                price: 46.90,
                category: 'pizzas',
                preparation_time: 25,
                customizations: [
                  { type: 'size', name: 'Pequena (4 fatias)', price_modifier: 0, available: true },
                  { type: 'size', name: 'Media (8 fatias)', price_modifier: 10, available: true },
                  { type: 'size', name: 'Grande (12 fatias)', price_modifier: 20, available: true },
                ],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Produto criado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/menu/search': {
      get: {
        tags: ['Cardapio'],
        summary: 'Buscar produtos',
        description: 'Busca produtos por nome usando regex case-insensitive. Limite de 20 resultados. Sem cache.',
        operationId: 'searchProducts',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Termo de busca',
            schema: { type: 'string', minLength: 1 },
            example: 'pizza',
          },
        ],
        responses: {
          '200': {
            description: 'Resultados da busca',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Termo de busca obrigatorio',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/menu/category/{category}': {
      get: {
        tags: ['Cardapio'],
        summary: 'Filtrar por categoria',
        description: 'Retorna produtos ativos de uma categoria especifica. Resultado cacheado por 5 minutos.',
        operationId: 'getByCategory',
        parameters: [
          {
            name: 'category',
            in: 'path',
            required: true,
            description: 'Categoria do produto',
            schema: {
              type: 'string',
              enum: ['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Produtos da categoria',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/menu/{id}': {
      get: {
        tags: ['Cardapio'],
        summary: 'Detalhe do produto',
        description: 'Retorna detalhes completos de um produto. Cacheado por 10 minutos.',
        operationId: 'getProductById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto (MongoDB ObjectId)',
            schema: { type: 'string' },
            example: '507f1f77bcf86cd799439011',
          },
        ],
        responses: {
          '200': {
            description: 'Detalhes do produto',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Cardapio (Admin)'],
        summary: 'Atualizar produto',
        description: 'Atualiza um produto existente. Campos parciais aceitos. Invalida cache Redis.',
        operationId: 'updateProduct',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProductInput' },
              example: {
                price: 49.90,
                description: 'Nova descricao atualizada',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Produto atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Cardapio (Admin)'],
        summary: 'Remover produto (soft delete)',
        description: 'Desativa um produto definindo active=false. O produto nao aparece mais no cardapio.',
        operationId: 'deleteProduct',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Produto desativado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ORDERS
    '/api/v1/orders': {
      post: {
        tags: ['Pedidos'],
        summary: 'Criar pedido',
        description: `Cria um novo pedido. O servidor:
1. Valida que todos os produtos existem e estao ativos
2. Verifica estoque disponivel
3. Calcula precos server-side (nunca confia no cliente)
4. Salva no PostgreSQL (Order + OrderItems) e MongoDB (OrderLog)
5. Decrementa estoque automaticamente
6. Retorna o pedido com status PENDING`,
        operationId: 'createOrder',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderInput' },
              example: {
                items: [
                  {
                    product_id: '507f1f77bcf86cd799439011',
                    quantity: 2,
                    customizations: [
                      { customization_id: 'cust123', price_modifier: 10 },
                    ],
                  },
                ],
                address: {
                  street: 'Rua das Flores',
                  number: '42',
                  complement: 'Apto 101',
                  city: 'Sao Paulo',
                  state: 'SP',
                  zip: '01234-567',
                },
                notes: 'Sem cebola, por favor',
                payment_method: 'PIX',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pedido criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': {
            description: 'Produto invalido ou estoque insuficiente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  status: 'error',
                  message: 'Estoque insuficiente para "Pizza Margherita". Disponivel: 3',
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Pedidos'],
        summary: 'Listar meus pedidos',
        description: 'Retorna todos os pedidos do usuario autenticado, ordenados por data decrescente.',
        operationId: 'listOrders',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de pedidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/orders/{id}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Detalhe do pedido',
        description: 'Retorna detalhes completos de um pedido. Apenas o dono do pedido pode visualizar.',
        operationId: 'getOrder',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do pedido (UUID)',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Detalhes do pedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token JWT obtido via /auth/login ou /auth/register',
      },
    },
    schemas: {
      // AUTH
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100, description: 'Nome completo' },
          email: { type: 'string', format: 'email', description: 'Email unico' },
          password: { type: 'string', minLength: 8, description: 'Minimo 8 chars, 1 maiuscula, 1 minuscula, 1 numero' },
          phone: { type: 'string', description: 'Telefone (opcional)' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string', description: 'Refresh token JWT' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['CLIENT', 'ADMIN'] },
            },
          },
          access_token: { type: 'string', description: 'JWT valido por 15 minutos' },
          refresh_token: { type: 'string', description: 'JWT valido por 7 dias' },
        },
      },

      // PRODUCT
      Customization: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'ID da customizacao' },
          type: { type: 'string', enum: ['size', 'ingredient'] },
          name: { type: 'string', description: 'Nome da opcao' },
          price_modifier: { type: 'number', description: 'Valor adicionado ao preco base' },
          available: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'MongoDB ObjectId' },
          name: { type: 'string', example: 'Pizza Margherita' },
          description: { type: 'string', example: 'Molho de tomate, mussarela de bufala, manjericao' },
          price: { type: 'number', format: 'double', example: 42.90 },
          image: { type: 'string', description: 'URL da imagem (Cloudflare R2)' },
          category: { type: 'string', enum: ['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'] },
          active: { type: 'boolean', default: true },
          preparation_time: { type: 'integer', description: 'Tempo de preparo em minutos', example: 25 },
          customizations: {
            type: 'array',
            items: { $ref: '#/components/schemas/Customization' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductInput: {
        type: 'object',
        required: ['name', 'price', 'category'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          price: { type: 'number', format: 'double', minimum: 0.01 },
          image: { type: 'string', format: 'uri' },
          category: { type: 'string', enum: ['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'] },
          active: { type: 'boolean', default: true },
          preparation_time: { type: 'integer', minimum: 1, default: 30 },
          customizations: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'name'],
              properties: {
                type: { type: 'string', enum: ['size', 'ingredient'] },
                name: { type: 'string' },
                price_modifier: { type: 'number', minimum: 0, default: 0 },
                available: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      UpdateProductInput: {
        type: 'object',
        description: 'Todos os campos sao opcionais (partial update)',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', format: 'double' },
          image: { type: 'string' },
          category: { type: 'string', enum: ['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'] },
          active: { type: 'boolean' },
          preparation_time: { type: 'integer' },
          customizations: { type: 'array', items: { type: 'object' } },
        },
      },

      // ORDER
      OrderItem: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          product_name: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          unit_price: { type: 'number', format: 'double' },
          customizations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                customization_id: { type: 'string' },
                name: { type: 'string' },
                price_modifier: { type: 'number' },
              },
            },
          },
          subtotal: { type: 'number', format: 'double' },
        },
      },
      Address: {
        type: 'object',
        required: ['street', 'number', 'city', 'state', 'zip'],
        properties: {
          street: { type: 'string', example: 'Rua das Flores' },
          number: { type: 'string', example: '42' },
          complement: { type: 'string', example: 'Apto 101' },
          city: { type: 'string', example: 'Sao Paulo' },
          state: { type: 'string', minLength: 2, maxLength: 2, example: 'SP' },
          zip: { type: 'string', pattern: '^\\d{5}-?\\d{3}$', example: '01234-567' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' },
          },
          subtotal: { type: 'number', format: 'double', example: 105.80 },
          delivery_fee: { type: 'number', format: 'double', example: 5.00 },
          discount: { type: 'number', format: 'double', example: 0 },
          total: { type: 'number', format: 'double', example: 110.80 },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
            description: 'Status do pedido',
          },
          address: { $ref: '#/components/schemas/Address' },
          notes: { type: 'string' },
          payment_method: { type: 'string', enum: ['PIX', 'CREDIT_CARD', 'CASH'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateOrderInput: {
        type: 'object',
        required: ['items', 'address', 'payment_method'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['product_id', 'quantity'],
              properties: {
                product_id: { type: 'string', description: 'MongoDB ObjectId do produto' },
                quantity: { type: 'integer', minimum: 1 },
                customizations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      customization_id: { type: 'string' },
                      price_modifier: { type: 'number', minimum: 0 },
                    },
                  },
                },
                obs: { type: 'string', maxLength: 500 },
              },
            },
          },
          address: { $ref: '#/components/schemas/Address' },
          notes: { type: 'string', maxLength: 1000 },
          payment_method: { type: 'string', enum: ['PIX', 'CREDIT_CARD', 'CASH'] },
        },
      },

      // ERROR
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Dados de entrada invalidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              status: 'error',
              message: 'Dados invalidos',
              errors: [
                { field: 'email', message: 'Email invalido' },
                { field: 'password', message: 'Senha deve ter no minimo 8 caracteres' },
              ],
            },
          },
        },
      },
      Unauthorized: {
        description: 'Token ausente, invalido ou expirado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { status: 'error', message: 'Token invalido ou expirado' },
          },
        },
      },
      Forbidden: {
        description: 'Sem permissao para acessar este recurso',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { status: 'error', message: 'Acesso negado' },
          },
        },
      },
      NotFound: {
        description: 'Recurso nao encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { status: 'error', message: 'Recurso nao encontrado' },
          },
        },
      },
    },
  },
};
