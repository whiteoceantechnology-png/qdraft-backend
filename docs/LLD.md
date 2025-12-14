# QB-Server Low-Level Design (LLD)

## 1. Document Information

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | December 13, 2025 |
| **Author** | QB-Server Team |
| **Status** | Active |

---

## 2. Project Structure

```
QB-Server/
├── src/
│   ├── index.js                 # Application entry point
│   ├── config/
│   │   ├── constants.js         # Environment variables & constants
│   │   ├── database.js          # Sequelize configuration
│   │   ├── middlewares.js       # Middleware setup
│   │   ├── swagger.js           # OpenAPI configuration
│   │   └── winston.js           # Logging configuration
│   ├── controllers/
│   │   ├── authentication.controller.js
│   │   ├── chapter.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── exam.controller.js
│   │   ├── pattern.controller.js
│   │   ├── question.controller.js
│   │   ├── questionType.controller.js
│   │   ├── blueprint.controller.js
│   │   ├── user.controller.js
│   │   ├── post.controller.js
│   │   └── seed.controller.js
│   ├── middlewares/
│   │   ├── performance.middleware.js
│   │   └── tenant.middleware.js
│   ├── models/
│   │   ├── index.js             # Model associations
│   │   ├── tenant.model.js
│   │   ├── user.model.js
│   │   ├── question.model.js
│   │   ├── chapter.model.js
│   │   ├── pattern.model.js
│   │   ├── exam.model.js
│   │   ├── blueprint.model.js
│   │   ├── questiontype.model.js
│   │   └── post.model.js
│   ├── routes/
│   │   ├── index.js             # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── question.routes.js
│   │   ├── chapter.routes.js
│   │   ├── pattern.routes.js
│   │   ├── exam.routes.js
│   │   ├── blueprint.routes.js
│   │   ├── questionType.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── post.routes.js
│   │   ├── seed.routes.js
│   │   └── docs.routes.js
│   ├── services/
│   │   ├── auth.js              # Passport strategies
│   │   ├── cache.js             # Caching service
│   │   ├── email.js             # Email service
│   │   ├── error.js             # Error handling
│   │   ├── log.js               # Logging service
│   │   └── s3.js                # S3 storage service
│   ├── utils/
│   │   ├── filteredBody.js      # Request body filtering
│   │   └── queryHelper.js       # Query utilities
│   ├── seeds/
│   │   └── user.seed.js         # Database seeding
│   └── locales/
│       ├── en/                  # English translations
│       └── fr/                  # French translations
├── __tests__/                   # Jest test files
├── data/                        # SQLite database (dev)
├── logs/                        # Application logs
├── scripts/                     # Utility scripts
├── docker-compose.yml
├── Dockerfile
├── package.json
└── .env
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ENTITY RELATIONSHIP DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                                 ┌─────────────┐
                                 │   TENANT    │
                                 │─────────────│
                                 │ tenant_id   │◄───────────────────────────────────┐
                                 │ tenant_name │                                    │
                                 │ is_active   │                                    │
                                 │ subscription│                                    │
                                 │ features    │                                    │
                                 └──────┬──────┘                                    │
                                        │                                           │
           ┌────────────────────────────┼────────────────────────────┐              │
           │                            │                            │              │
           ▼                            ▼                            ▼              │
   ┌───────────────┐          ┌─────────────────┐          ┌─────────────────┐     │
   │     USER      │          │    CHAPTER      │          │  QUESTION_TYPE  │     │
   │───────────────│          │─────────────────│          │─────────────────│     │
   │ user_id   [PK]│          │ chapter_id  [PK]│          │ type_id     [PK]│     │
   │ tenant_id [FK]│──────────│ tenant_id   [FK]│──────────│ tenant_id   [FK]│─────┘
   │ username      │          │ chapter_name    │          │ type_name       │
   │ email         │          │ is_active       │          │ description     │
   │ password_hash │          └────────┬────────┘          └────────┬────────┘
   │ role          │                   │                            │
   │ is_active     │                   │                            │
   │ last_login    │                   ▼                            │
   └───────┬───────┘          ┌─────────────────┐                   │
           │                  │    QUESTION     │                   │
           │                  │─────────────────│                   │
           │                  │ question_id [PK]│                   │
           ├─────────────────►│ tenant_id   [FK]│                   │
           │ (added_by)       │ chapter_id  [FK]│◄──────────────────┘
           │                  │ type_id     [FK]│  (question_type)
           │                  │ added_by    [FK]│
           │                  │ question_text   │
           │                  │ difficulty      │
           │                  │ is_active       │
           │                  └─────────────────┘
           │
           │                  ┌─────────────────┐
           │                  │    PATTERN      │
           ├─────────────────►│─────────────────│
           │ (added_by)       │ pattern_id  [PK]│
           │                  │ tenant_id   [FK]│
           │                  │ chapter_id  [FK]│
           │                  │ added_by    [FK]│
           │                  │ pattern_text    │
           │                  └─────────────────┘
           │
           │                  ┌─────────────────┐
           │                  │      EXAM       │
           ├─────────────────►│─────────────────│
           │ (created_by)     │ exam_id     [PK]│
           │                  │ tenant_id   [FK]│
           │                  │ chapter_id  [FK]│
           │                  │ created_by  [FK]│
           │                  │ updated_by  [FK]│
           │                  │ exam_name       │
           │                  │ total_marks     │
           │                  │ duration        │
           │                  └─────────────────┘
           │
           │                  ┌─────────────────┐
           ├─────────────────►│   BLUEPRINT     │
           │ (added_by)       │─────────────────│
           │                  │ blueprint_id[PK]│
           │                  │ tenant_id   [FK]│
           │                  │ added_by    [FK]│
           │                  │ blueprint_data  │
           │                  └─────────────────┘
           │
           │                  ┌─────────────────┐
           └─────────────────►│      POST       │
             (author)         │─────────────────│
                              │ post_id     [PK]│
                              │ tenant_id   [FK]│
                              │ author_id   [FK]│
                              │ title           │
                              │ content         │
                              │ status          │
                              └─────────────────┘
```

### 3.2 Table Definitions

#### 3.2.1 Tenant Table

```sql
CREATE TABLE tenants (
    tenant_id        INT AUTO_INCREMENT PRIMARY KEY,
    tenant_name      VARCHAR(255) NOT NULL,
    tenant_domain    VARCHAR(255),
    is_active        BOOLEAN DEFAULT TRUE,
    subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    features         JSON,
    max_users        INT DEFAULT 10,
    max_questions    INT DEFAULT 1000,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3.2.2 User Table

```sql
CREATE TABLE users (
    user_id          INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id        INT NOT NULL,
    username         VARCHAR(80) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    password         VARCHAR(255) NOT NULL,
    role             ENUM('admin', 'user', 'viewer') DEFAULT 'user',
    first_name       VARCHAR(100),
    last_name        VARCHAR(100),
    is_active        BOOLEAN DEFAULT TRUE,
    last_login       TIMESTAMP NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    UNIQUE KEY unique_username_per_tenant (tenant_id, username),
    UNIQUE KEY unique_email_per_tenant (tenant_id, email)
);
```

#### 3.2.3 Question Table

```sql
CREATE TABLE questions (
    qbs_question_id       INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id             INT NOT NULL,
    qbs_chapter_id        INT,
    qbs_qst_type_id       INT,
    qbs_question_added_by INT,
    qbs_question_text     TEXT NOT NULL,
    qbs_question_option_a TEXT,
    qbs_question_option_b TEXT,
    qbs_question_option_c TEXT,
    qbs_question_option_d TEXT,
    qbs_question_answer   VARCHAR(10),
    qbs_question_marks    DECIMAL(5,2),
    qbs_question_difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    is_active             BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (qbs_chapter_id) REFERENCES chapters(qbs_chapter_id),
    FOREIGN KEY (qbs_qst_type_id) REFERENCES questiontypes(qbs_qst_type_id),
    FOREIGN KEY (qbs_question_added_by) REFERENCES users(user_id),
    INDEX idx_tenant_chapter (tenant_id, qbs_chapter_id)
);
```

#### 3.2.4 Chapter Table

```sql
CREATE TABLE chapters (
    qbs_chapter_id        INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id             INT NOT NULL,
    qbs_chapter_name      VARCHAR(255) NOT NULL,
    qbs_chapter_desc      TEXT,
    is_active             BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id)
);
```

---

## 4. API Specifications

### 4.1 Authentication API

#### POST /api/auth/login

**Request:**
```json
{
    "username": "john_doe",
    "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "user_id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "role": "admin",
        "tenant": {
            "tenant_id": 1,
            "tenant_name": "Acme Corp",
            "subscription_plan": "premium"
        },
        "token": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

#### POST /api/auth/register

**Request:**
```json
{
    "username": "new_user",
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user_id": 2,
        "username": "new_user",
        "email": "newuser@example.com",
        "token": "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### 4.2 Questions API

#### GET /api/questions

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |
| `chapter_id` | integer | Filter by chapter |
| `type_id` | integer | Filter by question type |
| `difficulty` | string | Filter by difficulty (easy/medium/hard) |

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "questions": [
            {
                "qbs_question_id": 1,
                "qbs_question_text": "What is 2 + 2?",
                "qbs_question_option_a": "3",
                "qbs_question_option_b": "4",
                "qbs_question_option_c": "5",
                "qbs_question_option_d": "6",
                "qbs_question_answer": "B",
                "qbs_question_marks": 1.0,
                "qbs_question_difficulty": "easy",
                "chapter": {
                    "qbs_chapter_id": 1,
                    "qbs_chapter_name": "Basic Math"
                }
            }
        ],
        "pagination": {
            "total": 100,
            "page": 1,
            "limit": 20,
            "totalPages": 5
        }
    }
}
```

#### POST /api/questions

**Request:**
```json
{
    "qbs_question_text": "What is the capital of France?",
    "qbs_question_option_a": "London",
    "qbs_question_option_b": "Paris",
    "qbs_question_option_c": "Berlin",
    "qbs_question_option_d": "Madrid",
    "qbs_question_answer": "B",
    "qbs_question_marks": 2.0,
    "qbs_question_difficulty": "easy",
    "qbs_chapter_id": 5
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Question created successfully",
    "data": {
        "qbs_question_id": 101,
        "qbs_question_text": "What is the capital of France?",
        "created_at": "2025-12-13T10:00:00.000Z"
    }
}
```

### 4.3 Error Response Format

```json
{
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
        {
            "field": "username",
            "message": "Username is required"
        }
    ]
}
```

### 4.4 HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 5. Middleware Pipeline

### 5.1 Middleware Execution Order

```
Request ────────────────────────────────────────────────────────────► Response
    │                                                                    ▲
    ▼                                                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│  1. responseTime                                                        │
│     └── Starts timer, adds X-Response-Time header on response          │
├─────────────────────────────────────────────────────────────────────────┤
│  2. requestTimeout (30s dev / 60s prod)                                 │
│     └── Aborts request if exceeds timeout                              │
├─────────────────────────────────────────────────────────────────────────┤
│  3. compression                                                         │
│     └── Gzip compression for responses > 1KB                           │
├─────────────────────────────────────────────────────────────────────────┤
│  4. helmet                                                              │
│     └── Security headers (CSP, X-Frame-Options, etc.)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  5. cors                                                                │
│     └── Cross-origin resource sharing                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  6. bodyParser.json                                                     │
│     └── Parse JSON request body (limit: 5MB)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  7. passport.initialize                                                 │
│     └── Initialize Passport.js                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  8. apiRateLimit (on /api routes)                                      │
│     └── 100 requests per 15 minutes per IP                             │
├─────────────────────────────────────────────────────────────────────────┤
│  9. authJwt (on protected routes)                                      │
│     └── Validate JWT token, attach user to request                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 10. tenantContext (on protected routes)                                │
│     └── Extract tenant_id from user, validate tenant                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 11. Route Handler                                                       │
│     └── Controller logic                                                │
├─────────────────────────────────────────────────────────────────────────┤
│ 12. Error Handler                                                       │
│     └── Catch and format errors                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Middleware Implementation Details

#### 5.2.1 Response Time Middleware

```javascript
// src/middlewares/performance.middleware.js

export const responseTime = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    if (!res.headersSent) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to ms
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
    return originalEnd.apply(this, args);
  };
  
  next();
};
```

#### 5.2.2 Rate Limit Configuration

```javascript
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests per window
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
  },
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### 5.2.3 Tenant Context Middleware

```javascript
// src/middlewares/tenant.middleware.js

export const tenantContext = async (req, res, next) => {
  try {
    if (!req.user) {
      req.tenantId = null;
      return next();
    }

    const tenantId = req.user.tenant_id;
    
    // Get tenant from cache or database
    const tenant = await getTenantCached(tenantId);

    if (!tenant || !tenant.is_active) {
      return res.status(403).json({
        success: false,
        code: 'TENANT_INACTIVE',
        message: 'Tenant not found or inactive',
      });
    }

    req.tenant = tenant;
    req.tenantId = tenantId;
    
    next();
  } catch (err) {
    next(err);
  }
};
```

---

## 6. Authentication Flow

### 6.1 JWT Token Structure

```javascript
// JWT Payload
{
  "user_id": 1,
  "tenant_id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "admin",
  "iat": 1702459200,      // Issued at
  "exp": 1703064000       // Expires (7 days)
}
```

### 6.2 Password Hashing

```javascript
// User Model - Password hashing before save
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Password verification method
User.prototype.authenticateUser = function(password) {
  return bcrypt.compareSync(password, this.password);
};
```

### 6.3 Token Generation

```javascript
// User Model - Generate JWT
// Note: Token is returned without prefix - client adds "Bearer " when making requests
User.prototype.toAuthJSON = function() {
  return {
    user_id: this.user_id,
    username: this.username,
    email: this.email,
    role: this.role,
    access_token: jwt.sign(
      {
        user_id: this.user_id,
        tenant_id: this.tenant_id,
        username: this.username,
        email: this.email,
        role: this.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    ),
  };
};
```

---

## 7. Caching Strategy

### 7.1 Cache Key Patterns

```javascript
// src/services/cache.js

export const keys = {
  tenant: (id) => `tenant:${id}`,
  user: (id) => `user:${id}`,
  userByUsername: (tenantId, username) => `user:${tenantId}:username:${username}`,
  questions: (tenantId, page, limit) => `questions:${tenantId}:${page}:${limit}`,
  chapters: (tenantId) => `chapters:${tenantId}`,
  questionTypes: (tenantId) => `questionTypes:${tenantId}`,
  dashboard: (tenantId) => `dashboard:${tenantId}`,
};

export const TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 900,      // 15 minutes
  VERY_LONG: 3600 // 1 hour
};
```

### 7.2 Cache Operations

```javascript
// Get with cache
export function get(key) {
  const expiry = cacheExpiry.get(key);
  
  if (expiry && Date.now() > expiry) {
    cache.delete(key);
    cacheExpiry.delete(key);
    return null;
  }
  
  return cache.get(key) || null;
}

// Set with TTL
export function set(key, value, ttl = 300) {
  // LRU-like eviction when max size reached
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
    cacheExpiry.delete(firstKey);
  }
  
  cache.set(key, value);
  cacheExpiry.set(key, Date.now() + (ttl * 1000));
}

// Delete by pattern (e.g., "questions:*")
export function delPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cacheExpiry.delete(key);
    }
  }
}
```

### 7.3 Cache Invalidation Triggers

| Event | Cache Keys Invalidated |
|-------|----------------------|
| User Update | `user:{id}`, `user:{tenant}:username:*` |
| Question Create/Update/Delete | `questions:{tenant}:*` |
| Chapter Update | `chapters:{tenant}`, `questions:{tenant}:*` |
| Tenant Update | `tenant:{id}` |

---

## 8. Database Configuration

### 8.1 Connection Pool Settings

```javascript
// src/config/database.js

const poolConfig = {
  development: {
    max: 10,       // Maximum connections
    min: 2,        // Minimum connections
    acquire: 30000, // Max time to acquire (30s)
    idle: 10000,   // Close idle after (10s)
  },
  production: {
    max: 50,
    min: 10,
    acquire: 30000,
    idle: 10000,
    evict: 1000,   // Check idle every 1s
  },
};
```

### 8.2 SQLite Configuration (Development)

```javascript
if (useSQLite) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data/qb_server.sqlite',
    logging: isDev ? console.log : false,
    pool: {
      max: 1,       // SQLite single connection
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}
```

### 8.3 MariaDB Configuration (Production)

```javascript
sequelize = new Sequelize(database, username, password, {
  host: host,
  port: port,
  dialect: 'mariadb',
  benchmark: isDev,
  pool: poolConfig.production,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false,
  },
  dialectOptions: {
    connectTimeout: 10000,
    compress: isProd,
    dateStrings: true,
    typeCast: true,
  },
});
```

---

## 9. Model Associations

### 9.1 Association Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODEL ASSOCIATIONS                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

Tenant (1) ──────────────────────────────────────────────────────► (N) User
    │                                                                   │
    │ hasMany                                                    belongsTo
    │                                                                   │
    ├──────────────────────────────────────────────────────────────────►│
    │                                                                   │
    ▼                                                                   ▼
Tenant (1) ─────► (N) Question ◄─────── (1) Chapter
                       │                     │
                       │                     │
                       ▼                     ▼
               QuestionType (1) ◄─── (N) Pattern
                                          │
                                          │
                                          ▼
                                    Exam ◄───── Blueprint
```

### 9.2 Association Code

```javascript
// src/models/index.js

// Tenant Associations
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Question, { foreignKey: 'tenant_id', as: 'questions' });
Question.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Question Associations
Chapter.hasMany(Question, { foreignKey: 'qbs_chapter_id', as: 'questions' });
Question.belongsTo(Chapter, { foreignKey: 'qbs_chapter_id', as: 'chapter' });

QuestionType.hasMany(Question, { foreignKey: 'qbs_qst_type_id', as: 'questions' });
Question.belongsTo(QuestionType, { foreignKey: 'qbs_qst_type_id', as: 'questionType' });

User.hasMany(Question, { foreignKey: 'qbs_question_added_by', as: 'addedQuestions' });
Question.belongsTo(User, { foreignKey: 'qbs_question_added_by', as: 'addedBy' });

// Exam Associations
User.hasMany(Exam, { foreignKey: 'created_by', as: 'createdExams' });
Exam.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
```

---

## 10. Controller Patterns

### 10.1 Standard Controller Structure

```javascript
// src/controllers/question.controller.js

import { Question, Chapter, QuestionType } from '../models/index.js';
import HTTPStatus from 'http-status';
import cache, { keys, TTL, delPattern } from '../services/cache.js';

export async function getQuestions(req, res, next) {
  try {
    const { tenantId } = req;
    const { page = 1, limit = 20, chapter_id, type_id } = req.query;

    // Build where clause
    const where = { tenant_id: tenantId };
    if (chapter_id) where.qbs_chapter_id = chapter_id;
    if (type_id) where.qbs_qst_type_id = type_id;

    // Check cache
    const cacheKey = keys.questions(tenantId, page, limit);
    let result = cache.get(cacheKey);

    if (!result) {
      // Database query
      const { count, rows } = await Question.findAndCountAll({
        where,
        include: [
          { model: Chapter, as: 'chapter', attributes: ['qbs_chapter_id', 'qbs_chapter_name'] },
          { model: QuestionType, as: 'questionType', attributes: ['qbs_qst_type_id', 'qbs_qst_type_name'] },
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']],
      });

      result = {
        questions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      };

      // Cache result
      cache.set(cacheKey, result, TTL.MEDIUM);
    }

    res.status(HTTPStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { tenantId, user } = req;
    
    const question = await Question.create({
      ...req.body,
      tenant_id: tenantId,
      qbs_question_added_by: user.user_id,
    });

    // Invalidate cache
    delPattern(`questions:${tenantId}:*`);

    res.status(HTTPStatus.CREATED).json({
      success: true,
      message: 'Question created successfully',
      data: question,
    });
  } catch (err) {
    next(err);
  }
}
```

### 10.2 Error Handling Pattern

```javascript
// Standard error response
export async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    const question = await Question.findOne({
      where: { qbs_question_id: id, tenant_id: tenantId },
    });

    if (!question) {
      return res.status(HTTPStatus.NOT_FOUND).json({
        success: false,
        code: 'QUESTION_NOT_FOUND',
        message: `Question with ID ${id} not found`,
      });
    }

    res.status(HTTPStatus.OK).json({
      success: true,
      data: question,
    });
  } catch (err) {
    next(err);
  }
}
```

---

## 11. Route Definitions

### 11.1 Route Structure

```javascript
// src/routes/question.routes.js

import { Router } from 'express';
import validate from 'express-validation';
import * as questionController from '../controllers/question.controller.js';
import * as questionValidation from '../controllers/question.validations.js';
import { authJwt } from '../services/auth.js';

const routes = new Router();

// All routes require authentication
routes.use(authJwt);

// GET /api/questions
routes.get('/', questionController.getQuestions);

// GET /api/questions/:id
routes.get('/:id', questionController.getQuestionById);

// POST /api/questions
routes.post(
  '/',
  validate(questionValidation.createQuestion),
  questionController.createQuestion
);

// PUT /api/questions/:id
routes.put(
  '/:id',
  validate(questionValidation.updateQuestion),
  questionController.updateQuestion
);

// DELETE /api/questions/:id
routes.delete('/:id', questionController.deleteQuestion);

export default routes;
```

### 11.2 Route Aggregation

```javascript
// src/routes/index.js

import { Router } from 'express';
import { tenantContext } from '../middlewares/tenant.middleware.js';

import AuthRoutes from './auth.routes.js';
import QuestionRoutes from './question.routes.js';
import ChapterRoutes from './chapter.routes.js';
// ... other routes

const routes = new Router();

// Public routes
routes.use('/auth', AuthRoutes);

// Protected routes with tenant context
routes.use('/questions', tenantContext, QuestionRoutes);
routes.use('/chapters', tenantContext, ChapterRoutes);
// ... other protected routes

// 404 handler
routes.all('*', (req, res, next) =>
  next(new APIError('Not Found!', 404, true))
);

export default routes;
```

---

## 12. Testing Strategy

### 12.1 Test Structure

```
__tests__/
├── setup.js                  # Jest setup
├── controllers/
│   ├── authentication.controller.test.js
│   ├── chapter.controller.test.js
│   └── dashboard.controller.test.js
├── integration/
│   ├── auth.routes.test.js
│   └── chapter.routes.test.js
├── middlewares/
│   ├── performance.middleware.test.js
│   └── tenant.middleware.test.js
├── models/
│   ├── user.model.test.js
│   └── post.model.test.js
├── services/
│   ├── auth.service.test.js
│   └── cache.service.test.js
└── unit/
    └── user.model.test.js
```

### 12.2 Test Example

```javascript
// __tests__/services/cache.service.test.js

import { get, set, del, flush, stats } from '../../src/services/cache.js';

describe('Cache Service', () => {
  beforeEach(() => {
    flush();
  });

  describe('set and get', () => {
    it('should store and retrieve value', () => {
      set('test-key', { data: 'test' });
      const result = get('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for expired keys', async () => {
      set('expiring-key', 'value', 0.001); // 1ms TTL
      await new Promise(resolve => setTimeout(resolve, 10));
      const result = get('expiring-key');
      expect(result).toBeNull();
    });
  });
});
```

### 12.3 Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## 13. Environment Configuration

### 13.1 Environment Variables

```dotenv
# .env

# Environment
NODE_ENV=development

# Server
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Database Mode (true = SQLite, false = MariaDB)
DB_USE_SQLITE=true

# MariaDB Configuration
DB_HOST_DEV=localhost
DB_PORT_DEV=3306
DB_NAME_DEV=qb_server_dev
DB_USER_DEV=root
DB_PASS_DEV=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
ENABLE_REQUEST_LOGGING=false
LOG_LEVEL=info

# CORS
CORS_ORIGIN=*
```

### 13.2 Constants Configuration

```javascript
// src/config/constants.js

const constants = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};

export default constants;
```

---

## 14. Deployment

### 14.1 Docker Configuration

```dockerfile
# Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### 14.2 Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST_PROD=mariadb
      - DB_USE_SQLITE=false
    depends_on:
      - mariadb
    networks:
      - qb-network

  mariadb:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: qb_server
      MYSQL_USER: qbuser
      MYSQL_PASSWORD: qbpass
    volumes:
      - mariadb-data:/var/lib/mysql
    networks:
      - qb-network

volumes:
  mariadb-data:

networks:
  qb-network:
    driver: bridge
```

### 14.3 PM2 Configuration

```javascript
// ecosystem.config.cjs

module.exports = {
  apps: [{
    name: 'qb-server',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    time: true,
  }]
};
```

---

## 15. Appendix

### 15.1 HTTP Status Code Reference

| Code | Constant | Usage |
|------|----------|-------|
| 200 | `HTTPStatus.OK` | Success |
| 201 | `HTTPStatus.CREATED` | Resource created |
| 204 | `HTTPStatus.NO_CONTENT` | Deleted |
| 400 | `HTTPStatus.BAD_REQUEST` | Validation error |
| 401 | `HTTPStatus.UNAUTHORIZED` | Not authenticated |
| 403 | `HTTPStatus.FORBIDDEN` | Not authorized |
| 404 | `HTTPStatus.NOT_FOUND` | Not found |
| 429 | `HTTPStatus.TOO_MANY_REQUESTS` | Rate limited |
| 500 | `HTTPStatus.INTERNAL_SERVER_ERROR` | Server error |

### 15.2 Common Import Paths

```javascript
// Models
import { User, Tenant, Question, Chapter } from '../models/index.js';

// Services
import cache, { keys, TTL } from '../services/cache.js';
import { authJwt } from '../services/auth.js';
import APIError from '../services/error.js';

// Middleware
import { tenantContext, requireTenant } from '../middlewares/tenant.middleware.js';

// Config
import constants from '../config/constants.js';
import { sequelize } from '../config/database.js';
```

---

*End of Low-Level Design Document*
