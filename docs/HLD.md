# QB-Server High-Level Design (HLD)

## 1. Document Information

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | December 13, 2025 |
| **Author** | QB-Server Team |
| **Status** | Active |

---

## 2. Executive Summary

QB-Server is a multi-tenant SaaS Question Bank API built on Node.js/Express with Sequelize ORM. It provides a RESTful API for managing questions, exams, chapters, patterns, and blueprints with tenant isolation, role-based access control, and optimized performance targeting sub-500ms response times.

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                       │
│                  (Web Apps, Mobile Apps, Third-party Integrations)               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               LOAD BALANCER                                      │
│                        (Nginx / AWS ALB / Cloud LB)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              QB-SERVER API                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          EXPRESS.JS APPLICATION                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │  Middleware │  │   Routes    │  │ Controllers │  │     Services        │ │ │
│  │  │   Stack     │──│   Layer     │──│    Layer    │──│      Layer          │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────┐     ┌───────────────────────────────────────┐
│          DATABASE                  │     │           CACHE                       │
│  ┌─────────────────────────────┐  │     │  ┌─────────────────────────────────┐  │
│  │  MariaDB (Production)       │  │     │  │  In-Memory Cache (Development)  │  │
│  │  SQLite  (Development)      │  │     │  │  Redis (Production)             │  │
│  └─────────────────────────────┘  │     │  └─────────────────────────────────┘  │
└───────────────────────────────────┘     └───────────────────────────────────────┘
```

---

## 4. Key Architectural Decisions

### 4.1 Multi-Tenant Architecture

| Decision | Rationale |
|----------|-----------|
| **Shared Database, Tenant Isolation via `tenant_id`** | Cost-effective, easier maintenance, horizontal scaling |
| **JWT-based Tenant Context** | Stateless authentication, embedded tenant claims |
| **Row-Level Security** | All queries filtered by `tenant_id` automatically |

### 4.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime with ES Modules |
| **Framework** | Express.js | Fast, minimal web framework |
| **ORM** | Sequelize 6.x | SQL abstraction, migrations, associations |
| **Database** | MariaDB / SQLite | Relational data storage |
| **Authentication** | Passport.js + JWT | Stateless token-based auth |
| **Caching** | In-Memory / Redis | Performance optimization |
| **Documentation** | Swagger/OpenAPI 3.0 | Interactive API docs |

### 4.3 Design Principles

1. **Separation of Concerns** - Routes → Controllers → Services → Models
2. **Stateless Design** - No server-side sessions, JWT-based auth
3. **Fail-Fast** - Comprehensive validation and error handling
4. **Performance-First** - Caching, connection pooling, query optimization
5. **Security by Default** - Helmet, CORS, rate limiting, input validation

---

## 5. Component Architecture

### 5.1 Application Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │    Routes     │  │  Middleware   │  │   Request/Response        │   │
│  │  (Endpoints)  │  │   Pipeline    │  │      Formatting           │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │  Controllers  │  │   Services    │  │      Validators           │   │
│  │  (Handlers)   │  │ (Business     │  │   (Input Validation)      │   │
│  │               │  │   Logic)      │  │                           │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA ACCESS LAYER                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │    Models     │  │   Sequelize   │  │     Cache Service         │   │
│  │  (Entities)   │  │   (ORM)       │  │  (In-Memory / Redis)      │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE LAYER                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │
│  │   Database    │  │    Logging    │  │     External Services     │   │
│  │ (MariaDB/     │  │  (Winston)    │  │    (Email, S3, etc.)      │   │
│  │   SQLite)     │  │               │  │                           │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Core Modules

| Module | Description | Key Components |
|--------|-------------|----------------|
| **Authentication** | User login, registration, JWT issuance | Passport.js, JWT Strategy |
| **Tenant Management** | Multi-tenant isolation, tenant context | Tenant middleware, models |
| **Question Bank** | CRUD for questions, chapters, patterns | Controllers, validators |
| **Exam Management** | Exam creation, blueprint management | Exam, Blueprint models |
| **User Management** | User CRUD, role management | User model, auth service |
| **Dashboard** | Analytics and statistics | Aggregation queries |

---

## 6. Data Flow Diagrams

### 6.1 Authentication Flow

```
┌──────────┐      ┌─────────────┐      ┌──────────────┐      ┌────────────┐
│  Client  │      │  Auth Route │      │  Auth Service│      │  Database  │
└────┬─────┘      └──────┬──────┘      └──────┬───────┘      └─────┬──────┘
     │                   │                    │                    │
     │  POST /auth/login │                    │                    │
     │──────────────────>│                    │                    │
     │                   │  validateCredentials                    │
     │                   │───────────────────>│                    │
     │                   │                    │  findUser          │
     │                   │                    │───────────────────>│
     │                   │                    │<───────────────────│
     │                   │                    │  verifyPassword    │
     │                   │<───────────────────│                    │
     │                   │                    │                    │
     │  { token, user }  │                    │                    │
     │<──────────────────│                    │                    │
     │                   │                    │                    │
```

### 6.2 API Request Flow (Protected Endpoint)

```
┌──────────┐   ┌────────────┐   ┌─────────────┐   ┌────────────┐   ┌──────────┐
│  Client  │   │ Middleware │   │  Controller │   │   Model    │   │ Database │
└────┬─────┘   └─────┬──────┘   └──────┬──────┘   └─────┬──────┘   └────┬─────┘
     │               │                 │                │               │
     │ GET /api/questions              │                │               │
     │──────────────>│                 │                │               │
     │               │ 1. responseTime │                │               │
     │               │ 2. helmet       │                │               │
     │               │ 3. cors         │                │               │
     │               │ 4. rateLimit    │                │               │
     │               │ 5. authJwt      │                │               │
     │               │ 6. tenantContext│                │               │
     │               │────────────────>│                │               │
     │               │                 │ findAll()      │               │
     │               │                 │───────────────>│               │
     │               │                 │                │ SELECT        │
     │               │                 │                │──────────────>│
     │               │                 │                │<──────────────│
     │               │                 │<───────────────│               │
     │ JSON Response │<────────────────│                │               │
     │<──────────────│                 │                │               │
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY CONTROLS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  NETWORK LAYER                                                   │   │
│  │  • TLS/HTTPS encryption                                          │   │
│  │  • Rate limiting (100 req/15min per IP)                         │   │
│  │  • CORS policy enforcement                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  APPLICATION LAYER                                               │   │
│  │  • Helmet.js security headers                                    │   │
│  │  • JWT authentication with expiry                                │   │
│  │  • Input validation & sanitization                               │   │
│  │  • SQL injection prevention (Sequelize parameterized queries)    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  DATA LAYER                                                      │   │
│  │  • Password hashing (bcrypt, 10 rounds)                          │   │
│  │  • Tenant data isolation                                          │   │
│  │  • Connection encryption (TLS)                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication & Authorization

| Mechanism | Implementation |
|-----------|----------------|
| **Authentication** | JWT tokens with 7-day expiry |
| **Password Storage** | bcrypt hashing with salt rounds |
| **Token Transport** | Authorization header (`Bearer <token>`) |
| **Role-Based Access** | User roles: admin, user, viewer |

---

## 8. Performance Architecture

### 8.1 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **API Response Time** | < 500ms (p95) | Caching, query optimization |
| **Database Queries** | < 50ms (p95) | Connection pooling, indexes |
| **Throughput** | 1000+ req/sec | Horizontal scaling |
| **Availability** | 99.9% | Health checks, graceful shutdown |

### 8.2 Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE OPTIMIZATIONS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CACHING LAYER                                                       │
│     ├── In-memory cache for development                                 │
│     ├── Redis for production (optional)                                  │
│     ├── TTL-based expiration (5-15 minutes)                             │
│     └── Cache key patterns: tenant:<id>, user:<id>                      │
│                                                                          │
│  2. DATABASE OPTIMIZATION                                               │
│     ├── Connection pooling (max: 50 connections)                        │
│     ├── Query result caching                                            │
│     ├── Eager loading (avoid N+1 queries)                               │
│     └── Indexed columns (tenant_id, primary keys)                       │
│                                                                          │
│  3. RESPONSE OPTIMIZATION                                               │
│     ├── Gzip compression (level 6)                                      │
│     ├── Response time header (X-Response-Time)                          │
│     └── Pagination for list endpoints                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Deployment Architecture

### 9.1 Environment Configurations

| Environment | Database | Cache | Features |
|-------------|----------|-------|----------|
| **Development** | SQLite (local file) | In-Memory | Debug logging, status monitor |
| **Test** | SQLite (in-memory) | In-Memory | Jest test runner |
| **Production** | MariaDB | Redis (optional) | Compression, rate limiting |

### 9.2 Container Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DOCKER COMPOSE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐        │
│  │   QB-Server     │   │    MariaDB      │   │     Redis       │        │
│  │   (Node.js)     │   │    (Database)   │   │   (Cache)       │        │
│  │   Port: 3000    │   │   Port: 3306    │   │   Port: 6379    │        │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘        │
│           │                     │                     │                  │
│           └─────────────────────┴─────────────────────┘                  │
│                           Docker Network                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. API Overview

### 10.1 API Endpoints Summary

| Module | Base Path | Description |
|--------|-----------|-------------|
| **Auth** | `/api/auth` | Login, registration, token refresh |
| **Users** | `/api/users` | User management CRUD |
| **Questions** | `/api/questions` | Question bank operations |
| **Chapters** | `/api/chapters` | Chapter management |
| **Patterns** | `/api/patterns` | Question patterns |
| **Exams** | `/api/exams` | Exam management |
| **Blueprints** | `/api/blueprints` | Exam blueprints |
| **Dashboard** | `/api/dashboard` | Analytics & statistics |

### 10.2 API Documentation

- **Interactive Docs**: `/api-docs` (Swagger UI)
- **OpenAPI Spec**: `/api-docs/spec.json`

---

## 11. Monitoring & Observability

### 11.1 Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Quick liveness check | `{ status: 'ok' }` |
| `/health/detailed` | Full health with DB check | Memory, cache, DB status |
| `/ready` | Kubernetes readiness probe | `OK` or `NOT READY` |
| `/metrics` | Basic metrics | Uptime, memory, cache stats |
| `/status` | Express status monitor | Real-time dashboard (dev only) |

### 11.2 Logging

- **Logger**: Winston with console + file transports
- **Log Levels**: error, warn, info, http, debug
- **Log Files**: `logs/app.log`, `logs/error.log`

---

## 12. Future Considerations

### 12.1 Scalability Roadmap

1. **Horizontal Scaling** - Multiple API instances behind load balancer
2. **Database Read Replicas** - Separate read/write connections
3. **Redis Cluster** - Distributed caching
4. **Message Queue** - Async job processing (Bull/Redis)
5. **CDN Integration** - Static asset delivery

### 12.2 Feature Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Audit logging for compliance
- [ ] Multi-region deployment support
- [ ] Advanced analytics and reporting
- [ ] Plugin architecture for extensibility

---

## Appendix A: Technology Reference

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.x |
| ORM | Sequelize | 6.x |
| Database | MariaDB / SQLite | 10.x / 3.x |
| Auth | Passport.js | 0.6.x |
| Testing | Jest | 29.x |
| Documentation | Swagger/OpenAPI | 3.0 |
| Process Manager | PM2 | 5.x |
| Containerization | Docker | 20.x |

---

*End of High-Level Design Document*
