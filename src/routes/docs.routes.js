/**
 * API Documentation Routes
 * Swagger UI and OpenAPI spec endpoints
 */

import swaggerDefinition from '../config/swagger.js';

// Build paths object with all API documentation
const paths = {
  // ==================== Authentication ====================
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login user',
      description: 'Authenticate user with username and password. Returns JWT token on success.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginResponse',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
        429: {
          $ref: '#/components/responses/RateLimitError',
        },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register new user',
      description: 'Register a new user account. Requires either tenant_id or tenant_code.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterRequest',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Registration successful',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginResponse',
              },
            },
          },
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
        409: {
          description: 'Email or username already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        429: {
          $ref: '#/components/responses/RateLimitError',
        },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user',
      description: 'Get the currently authenticated user profile.',
      responses: {
        200: {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },
  '/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change password',
      description: 'Change the current user password.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  format: 'password',
                },
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 6,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Password changed successfully',
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh token',
      description: 'Get a new JWT token using current valid token.',
      responses: {
        200: {
          description: 'New token issued',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  access_token: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },

  // ==================== Chapters ====================
  '/chapters': {
    get: {
      tags: ['Chapters'],
      summary: 'List all chapters',
      description: 'Get a list of all chapters with question counts.',
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50 },
          description: 'Number of items to return',
        },
        {
          name: 'skip',
          in: 'query',
          schema: { type: 'integer', default: 0 },
          description: 'Number of items to skip',
        },
        {
          name: 'subjectId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by subject ID',
        },
        {
          name: 'deptId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by department ID',
        },
      ],
      responses: {
        200: {
          description: 'List of chapters',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Chapter',
                },
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
    post: {
      tags: ['Chapters'],
      summary: 'Create chapter',
      description: 'Create a new chapter.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChapterCreate',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Chapter created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Chapter',
              },
            },
          },
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },
  '/chapters/{id}': {
    get: {
      tags: ['Chapters'],
      summary: 'Get chapter by ID',
      description: 'Get a specific chapter by its ID.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Chapter ID',
        },
      ],
      responses: {
        200: {
          description: 'Chapter details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Chapter',
              },
            },
          },
        },
        404: {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
    patch: {
      tags: ['Chapters'],
      summary: 'Update chapter',
      description: 'Update an existing chapter.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChapterCreate',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Chapter updated',
        },
        404: {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
    delete: {
      tags: ['Chapters'],
      summary: 'Delete chapter',
      description: 'Delete a chapter by ID.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Chapter deleted',
        },
        404: {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
  },
  '/chapters/with-patterns': {
    get: {
      tags: ['Chapters'],
      summary: 'Get chapters with pattern counts',
      description: 'Get all chapters with their associated pattern counts.',
      responses: {
        200: {
          description: 'Chapters with pattern counts',
        },
      },
    },
  },
  '/chapters/by-subject/{subId}/department/{deptId}': {
    get: {
      tags: ['Chapters'],
      summary: 'Get chapters by subject and department',
      description: 'Filter chapters by subject and department.',
      parameters: [
        {
          name: 'subId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Subject ID',
        },
        {
          name: 'deptId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Department ID',
        },
      ],
      responses: {
        200: {
          description: 'Filtered chapters',
        },
      },
    },
  },

  // ==================== Questions ====================
  '/questions': {
    get: {
      tags: ['Questions'],
      summary: 'List all questions',
      description: 'Get a paginated list of questions.',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
        },
        {
          name: 'chapterId',
          in: 'query',
          schema: { type: 'integer' },
        },
        {
          name: 'difficulty',
          in: 'query',
          schema: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
      ],
      responses: {
        200: {
          description: 'List of questions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Question',
                    },
                  },
                  pagination: {
                    $ref: '#/components/schemas/Pagination',
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Questions'],
      summary: 'Create question',
      description: 'Create a new question.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/QuestionCreate',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Question created',
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
      },
    },
  },
  '/questions/{id}': {
    get: {
      tags: ['Questions'],
      summary: 'Get question by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Question',
              },
            },
          },
        },
        404: {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
    put: {
      tags: ['Questions'],
      summary: 'Update question',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/QuestionCreate',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Question updated',
        },
      },
    },
    delete: {
      tags: ['Questions'],
      summary: 'Delete question',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question deleted',
        },
      },
    },
  },
  '/questions/count': {
    get: {
      tags: ['Questions'],
      summary: 'Get question count',
      description: 'Get total number of questions.',
      responses: {
        200: {
          description: 'Question count',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  count: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/questions/bulk': {
    post: {
      tags: ['Questions'],
      summary: 'Bulk create questions',
      description: 'Create multiple questions at once.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/QuestionCreate',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Questions created',
        },
      },
    },
  },
  '/questions/qbm': {
    post: {
      tags: ['Questions'],
      summary: 'Get questions with related data',
      description: 'Get questions with chapter and question type information.',
      responses: {
        200: {
          description: 'Questions with related data',
        },
      },
    },
  },
  '/questions/chapter/{chapterId}': {
    post: {
      tags: ['Questions'],
      summary: 'Get questions by chapter with options',
      parameters: [
        {
          name: 'chapterId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Questions for chapter',
        },
      },
    },
  },

  // ==================== Exams ====================
  '/exams': {
    get: {
      tags: ['Exams'],
      summary: 'List all exams',
      description: 'Get a list of all exams.',
      responses: {
        200: {
          description: 'List of exams',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Exam',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Exams'],
      summary: 'Create exam',
      description: 'Create a new exam.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ExamCreate',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Exam created',
        },
      },
    },
  },
  '/exams/{id}': {
    get: {
      tags: ['Exams'],
      summary: 'Get exam by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Exam details',
        },
        404: {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
    put: {
      tags: ['Exams'],
      summary: 'Update exam',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Exam updated',
        },
      },
    },
    delete: {
      tags: ['Exams'],
      summary: 'Delete exam',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Exam deleted',
        },
      },
    },
  },
  '/exams/{id}/form': {
    get: {
      tags: ['Exams'],
      summary: 'Get exam form data',
      description: 'Get exam with all form data for editing.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Exam form data',
        },
      },
    },
  },
  '/exams/{id}/questions': {
    put: {
      tags: ['Exams'],
      summary: 'Replace exam questions',
      description: 'Replace all questions in an exam.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                question_ids: {
                  type: 'array',
                  items: { type: 'integer' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Questions replaced',
        },
      },
    },
    patch: {
      tags: ['Exams'],
      summary: 'Update exam question',
      description: 'Update a specific question in the exam.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question updated',
        },
      },
    },
  },
  '/exams/count': {
    get: {
      tags: ['Exams'],
      summary: 'Get exam count',
      responses: {
        200: {
          description: 'Exam count',
        },
      },
    },
  },

  // ==================== Blueprints ====================
  '/blueprints': {
    get: {
      tags: ['Blueprints'],
      summary: 'List all blueprints',
      responses: {
        200: {
          description: 'List of blueprints',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Blueprint',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Blueprints'],
      summary: 'Create blueprint',
      responses: {
        201: {
          description: 'Blueprint created',
        },
      },
    },
  },
  '/blueprints/{id}': {
    get: {
      tags: ['Blueprints'],
      summary: 'Get blueprint by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Blueprint details',
        },
      },
    },
    put: {
      tags: ['Blueprints'],
      summary: 'Update blueprint',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Blueprint updated',
        },
      },
    },
    delete: {
      tags: ['Blueprints'],
      summary: 'Delete blueprint',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Blueprint deleted',
        },
      },
    },
  },

  // ==================== Patterns ====================
  '/patterns': {
    get: {
      tags: ['Patterns'],
      summary: 'List all patterns',
      responses: {
        200: {
          description: 'List of patterns',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Pattern',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Patterns'],
      summary: 'Create pattern',
      responses: {
        201: {
          description: 'Pattern created',
        },
      },
    },
  },
  '/patterns/{id}': {
    get: {
      tags: ['Patterns'],
      summary: 'Get pattern by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Pattern details',
        },
      },
    },
    put: {
      tags: ['Patterns'],
      summary: 'Update pattern',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Pattern updated',
        },
      },
    },
    delete: {
      tags: ['Patterns'],
      summary: 'Delete pattern',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Pattern deleted',
        },
      },
    },
  },

  // ==================== Question Types ====================
  '/questiontypes': {
    get: {
      tags: ['Question Types'],
      summary: 'List all question types',
      responses: {
        200: {
          description: 'List of question types',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/QuestionType',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Question Types'],
      summary: 'Create question type',
      responses: {
        201: {
          description: 'Question type created',
        },
      },
    },
  },
  '/questiontypes/{id}': {
    get: {
      tags: ['Question Types'],
      summary: 'Get question type by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question type details',
        },
      },
    },
    put: {
      tags: ['Question Types'],
      summary: 'Update question type',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question type updated',
        },
      },
    },
    delete: {
      tags: ['Question Types'],
      summary: 'Delete question type',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Question type deleted',
        },
      },
    },
  },

  // ==================== Dashboard ====================
  '/dashboard/stats': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get dashboard statistics',
      description: 'Get overall statistics for the dashboard.',
      responses: {
        200: {
          description: 'Dashboard statistics',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DashboardStats',
              },
            },
          },
        },
      },
    },
  },
  '/dashboard/monthly-stats': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get monthly statistics',
      description: 'Get statistics grouped by month.',
      parameters: [
        {
          name: 'startDate',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'Start date (YYYY-MM-DD)',
        },
        {
          name: 'endDate',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'End date (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Monthly statistics',
        },
      },
    },
  },

  // ==================== Users ====================
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List all users',
      description: 'Get a list of all users in the tenant.',
      responses: {
        200: {
          description: 'List of users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Create user',
      description: 'Create a new user (admin only).',
      responses: {
        201: {
          description: 'User created',
        },
      },
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'User details',
        },
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update user',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'User updated',
        },
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'User deleted',
        },
      },
    },
  },
};

// Complete OpenAPI specification
export const openApiSpec = {
  ...swaggerDefinition,
  paths,
};

// Generate HTML documentation page
export function generateDocsHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QB Server API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs/spec.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>
  `;
}

export default { openApiSpec, generateDocsHtml };
