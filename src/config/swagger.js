/**
 * Swagger/OpenAPI Configuration
 * API Documentation for QB-Server
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'QB Server API',
    version: '1.0.0',
    description: `
## Question Bank Server - Multi-tenant SaaS API

A comprehensive REST API for managing question banks, exams, blueprints, and patterns.

### Features
- 🔐 **Multi-tenant Architecture** - Complete data isolation between tenants
- 🚀 **High Performance** - Optimized for sub-500ms response times
- 🔒 **Secure** - JWT authentication with rate limiting
- 📊 **Dashboard Analytics** - Real-time statistics and reports

### Authentication
All API endpoints (except login/register) require JWT authentication.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

### Rate Limiting
- **API Endpoints**: 120 requests per minute
- **Auth Endpoints**: 10 requests per 15 minutes

### Response Format
All responses follow a consistent format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
\`\`\`
    `,
    contact: {
      name: 'API Support',
      email: 'support@qbserver.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Chapters',
      description: 'Chapter/topic management',
    },
    {
      name: 'Questions',
      description: 'Question bank management',
    },
    {
      name: 'Exams',
      description: 'Exam creation and management',
    },
    {
      name: 'Blueprints',
      description: 'Exam blueprint templates',
    },
    {
      name: 'Patterns',
      description: 'Question patterns and templates',
    },
    {
      name: 'Question Types',
      description: 'Question type definitions',
    },
    {
      name: 'Dashboard',
      description: 'Analytics and statistics',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'JWT token with "JWT " prefix. Example: "JWT eyJhbGciOiJIUzI1NiIs..."',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE',
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            example: 100,
          },
          page: {
            type: 'integer',
            example: 1,
          },
          limit: {
            type: 'integer',
            example: 20,
          },
          totalPages: {
            type: 'integer',
            example: 5,
          },
          hasNext: {
            type: 'boolean',
            example: true,
          },
          hasPrev: {
            type: 'boolean',
            example: false,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          user_id: {
            type: 'integer',
            example: 1,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          user_fname: {
            type: 'string',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'superadmin'],
            example: 'user',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'johndoe',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user_id: {
            type: 'integer',
            example: 1,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          email: {
            type: 'string',
            example: 'john@example.com',
          },
          role: {
            type: 'string',
            example: 'user',
          },
          tenant: {
            type: 'object',
            properties: {
              tenant_id: {
                type: 'integer',
              },
              tenant_name: {
                type: 'string',
              },
              subscription_plan: {
                type: 'string',
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            example: 'newuser',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'newuser@example.com',
          },
          password: {
            type: 'string',
            minLength: 6,
            format: 'password',
            example: 'securepassword123',
          },
          user_fname: {
            type: 'string',
            example: 'New User',
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
          tenant_code: {
            type: 'string',
            example: 'TENANT001',
          },
        },
      },
      Chapter: {
        type: 'object',
        properties: {
          qbs_chapter_id: {
            type: 'integer',
            example: 1,
          },
          qbs_chapter_name: {
            type: 'string',
            example: 'Algebra Basics',
          },
          qbs_sub_id: {
            type: 'integer',
            example: 1,
          },
          qbs_dept_id: {
            type: 'integer',
            example: 1,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
          question_count: {
            type: 'integer',
            example: 25,
          },
        },
      },
      ChapterCreate: {
        type: 'object',
        required: ['qbs_chapter_name'],
        properties: {
          qbs_chapter_name: {
            type: 'string',
            example: 'New Chapter',
          },
          qbs_sub_id: {
            type: 'integer',
            example: 1,
          },
          qbs_dept_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      Question: {
        type: 'object',
        properties: {
          qbs_question_id: {
            type: 'integer',
            example: 1,
          },
          question_text: {
            type: 'string',
            example: 'What is 2 + 2?',
          },
          option_a: {
            type: 'string',
            example: '3',
          },
          option_b: {
            type: 'string',
            example: '4',
          },
          option_c: {
            type: 'string',
            example: '5',
          },
          option_d: {
            type: 'string',
            example: '6',
          },
          correct_answer: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
            example: 'B',
          },
          explanation: {
            type: 'string',
            example: '2 + 2 equals 4',
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            example: 'easy',
          },
          marks: {
            type: 'integer',
            example: 1,
          },
          qbs_chapter_id: {
            type: 'integer',
            example: 1,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      QuestionCreate: {
        type: 'object',
        required: ['question_text', 'correct_answer'],
        properties: {
          question_text: {
            type: 'string',
            example: 'What is the capital of France?',
          },
          option_a: {
            type: 'string',
            example: 'London',
          },
          option_b: {
            type: 'string',
            example: 'Paris',
          },
          option_c: {
            type: 'string',
            example: 'Berlin',
          },
          option_d: {
            type: 'string',
            example: 'Madrid',
          },
          correct_answer: {
            type: 'string',
            enum: ['A', 'B', 'C', 'D'],
            example: 'B',
          },
          explanation: {
            type: 'string',
            example: 'Paris is the capital city of France.',
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            example: 'easy',
          },
          marks: {
            type: 'integer',
            example: 1,
          },
          qbs_chapter_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      Exam: {
        type: 'object',
        properties: {
          qbs_exam_id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Final Examination',
          },
          description: {
            type: 'string',
            example: 'End of semester exam',
          },
          duration_minutes: {
            type: 'integer',
            example: 120,
          },
          total_marks: {
            type: 'integer',
            example: 100,
          },
          passing_marks: {
            type: 'integer',
            example: 40,
          },
          is_published: {
            type: 'boolean',
            example: false,
          },
          start_date: {
            type: 'string',
            format: 'date-time',
          },
          end_date: {
            type: 'string',
            format: 'date-time',
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      ExamCreate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'Midterm Exam',
          },
          description: {
            type: 'string',
            example: 'Midterm examination for semester 1',
          },
          duration_minutes: {
            type: 'integer',
            example: 90,
          },
          total_marks: {
            type: 'integer',
            example: 50,
          },
          passing_marks: {
            type: 'integer',
            example: 20,
          },
          blueprint_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      Blueprint: {
        type: 'object',
        properties: {
          qbs_blueprint_id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Standard Exam Blueprint',
          },
          description: {
            type: 'string',
            example: 'Blueprint for standard exams',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      Pattern: {
        type: 'object',
        properties: {
          qbs_pattern_id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'MCQ Pattern',
          },
          description: {
            type: 'string',
            example: 'Multiple choice question pattern',
          },
          total_questions: {
            type: 'integer',
            example: 50,
          },
          total_marks: {
            type: 'integer',
            example: 100,
          },
          duration_minutes: {
            type: 'integer',
            example: 60,
          },
          tenant_id: {
            type: 'integer',
            example: 1,
          },
        },
      },
      QuestionType: {
        type: 'object',
        properties: {
          qbs_qtype_id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Multiple Choice',
          },
          code: {
            type: 'string',
            example: 'MCQ',
          },
          description: {
            type: 'string',
            example: 'Multiple choice questions with single correct answer',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalExams: {
            type: 'integer',
            example: 25,
          },
          totalQuestions: {
            type: 'integer',
            example: 500,
          },
          totalBlueprints: {
            type: 'integer',
            example: 10,
          },
          totalChapters: {
            type: 'integer',
            example: 30,
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or token invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Invalid or expired token',
              code: 'INVALID_TOKEN',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Access denied',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Validation error',
              code: 'VALIDATION_ERROR',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Too many requests, please try again later',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

export default swaggerDefinition;
