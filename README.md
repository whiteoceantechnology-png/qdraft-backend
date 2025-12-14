# QB-Server (Multi-Tenant Question Bank Server)

A multi-tenant REST API server for Question Bank management, built with Express.js and MariaDB (Sequelize ORM).

## Features

- **Multi-Tenant Architecture**: Shared database with tenant isolation via `tenant_id`
- **JWT Authentication**: Secure token-based auth with tenant context
- **Role-Based Access Control**: Super Admin, Tenant Admin, Teacher, User roles
- **Question Bank Management**: Questions, Chapters, Patterns, Blueprints
- **Exam Management**: Create and manage exams
- **Tenant Customization**: Settings, branding, subscription plans

---

## Quick Start

### Prerequisites

- Node.js >= 16.x
- MariaDB >= 10.5
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Configure your database settings in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The server will automatically create tables on first run (in development mode).

For production, run migrations manually or use `sequelize.sync()` once.

---

## Multi-Tenant Architecture

### Tenant Isolation

All data is isolated by `tenant_id`:
- Each tenant has their own users, questions, exams, etc.
- Queries automatically filter by `tenant_id` from JWT token
- Same email/username can exist across different tenants

### Authentication Flow

1. User logs in with username/password
2. Server validates credentials and tenant status
3. JWT token issued with `{ user_id, tenant_id, role }`
4. All subsequent requests include tenant context

### Roles

| Role | Description |
|------|-------------|
| `super_admin` | Platform-level admin, can manage all tenants |
| `tenant_admin` | Admin for a specific tenant |
| `teacher` | Can create/manage questions and exams |
| `user` | Regular user, read-only access |

#### Role Capabilities & Flow

- **Super Admin**
  - Create and manage other `super_admin` users
  - Create and manage `tenants`
  - While creating a tenant, optionally create its `tenant_admin`
  - View platform-wide dashboards and metrics
  - Access all tenant data across the platform

- **Tenant Admin**
  - Manage users and staff within their tenant (`teacher`, `user`)
  - Cannot create other `tenant_admin` or `super_admin` users
  - Manage tenant resources: questions, chapters, exams, patterns, blueprints
  - View tenant-scoped dashboards and metrics

- **Teacher**
  - Create and manage questions and exams
  - Limited administrative actions within tenant
  - Read access to tenant resources

- **User**
  - Consume content, limited read access
  - Can update own profile

All actions are tenant-scoped automatically via JWT containing `tenant_id`. Super admin actions operate across tenants.

## Multi-Tenant Architecture

QB-Server implements **row-level multi-tenancy** for complete data isolation between tenants.

### Key Features

- **Automatic Tenant Context:** All requests include `tenant_id` from JWT token
- **Row-Level Isolation:** Every table includes `tenant_id` foreign key
- **Helper Functions:** `tenantFilter(req)` and `tenantData(req)` ensure proper scoping
- **Performance Optimized:** Composite indexes on `tenant_id` + frequently queried columns
- **Security First:** All queries automatically filtered by tenant, preventing cross-tenant access

### Tenant-Linked Tables

All application tables automatically scope data by tenant:

```
✅ users           - User accounts (all roles)
✅ chapters        - Course chapters
✅ questions       - Question bank
✅ question_types  - Question type definitions
✅ patterns        - Question patterns
✅ blueprints      - Exam blueprints
✅ exams           - Generated exams
✅ posts           - Blog/content posts
```

### Setup Database Constraints

Run the tenant migration to ensure foreign keys and indexes:

```bash
npm run migrate:tenant
```

This migration:
- ✅ Adds `tenant_id` columns (if missing)
- ✅ Creates foreign key constraints to `tenants` table
- ✅ Adds single-column indexes on `tenant_id`
- ✅ Creates composite indexes for performance
- ✅ Verifies tenant isolation across all tables

### Usage in Controllers

All controllers follow the tenant-scoped pattern:

```javascript
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

// CREATE - automatically add tenant_id
const record = await Model.create({
  ...tenantData(req),      // Adds tenant_id from JWT
  field: req.body.field,
});

// READ - filter by tenant_id
const records = await Model.findAll({
  where: {
    ...tenantFilter(req),  // Adds tenant_id filter
    // additional filters
  },
});
```

For complete implementation details, see [Multi-Tenant Architecture Guide](docs/MULTI_TENANT_ARCHITECTURE.md).

---

#### Running Tests

The project includes comprehensive test coverage for role-based authorization:

```bash
# Run all tests
npm test

# Run specific test suites
npm test role.middleware.test.js      # Role authorization tests
npm test user.controller.test.js      # User creation with role restrictions
npm test tenant.controller.test.js    # Tenant creation with admin
npm test user.routes.test.js          # User route integration tests
npm test tenant.routes.test.js        # Tenant route integration tests

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- ✅ Role middleware (super_admin, tenant_admin, teacher, user)
- ✅ Super admin can create any role including other super admins
- ✅ Tenant admin can only create user/teacher roles
- ✅ Tenant admin blocked from creating admin roles (403 Forbidden)
- ✅ Tenant creation with optional admin user
- ✅ Duplicate username/email validation
- ✅ Tenant scoping for user lists
- ✅ Authorization checks on all CRUD operations

#### Implementation Examples

**1. Super Admin creates a tenant with admin:**
```bash
POST /api/tenants
Authorization: Bearer <super_admin_token>

{
  "tenant_name": "Acme School",
  "tenant_code": "ACME001",
  "email": "admin@acme.school",
  "subscription_plan": "premium",
  "max_users": 100,
  "admin_username": "acme_admin",
  "admin_email": "admin@acme.school",
  "admin_password": "securepass123",
  "admin_name": "John Doe"
}
```

**2. Super Admin creates another super admin:**
```bash
POST /api/users
Authorization: Bearer <super_admin_token>

{
  "username": "superadmin2",
  "email": "admin2@platform.com",
  "password": "securepass123",
  "user_fname": "Jane Smith",
  "role": "super_admin"
}
```

**3. Tenant Admin creates a teacher:**
```bash
POST /api/users
Authorization: Bearer <tenant_admin_token>

{
  "username": "teacher_john",
  "email": "john@acme.school",
  "password": "teacherpass123",
  "user_fname": "John Teacher",
  "role": "teacher"
}
```

**4. Tenant Admin creates a regular user:**
```bash
POST /api/users
Authorization: Bearer <tenant_admin_token>

{
  "username": "student_alice",
  "email": "alice@acme.school",
  "password": "studentpass123",
  "user_fname": "Alice Student",
  "role": "user"
}
```

**Note:** Tenant admins attempting to create `super_admin` or `tenant_admin` roles will receive a 403 Forbidden error.

---

## API Endpoints

### Authentication

```
POST /api/auth/login          - Login with credentials
POST /api/auth/register       - Register new user
GET  /api/auth/me             - Get current user
POST /api/auth/change-password - Change password
POST /api/auth/refresh        - Refresh JWT token
```

### Questions

```
GET    /api/questions         - List questions (paginated)
GET    /api/questions/:id     - Get question by ID
POST   /api/questions         - Create question
PATCH  /api/questions/:id     - Update question
DELETE /api/questions/:id     - Delete question
```

### Exams

```
GET    /api/exams             - List exams
GET    /api/exams/:id         - Get exam by ID
POST   /api/exams             - Create exam
PATCH  /api/exams/:id         - Update exam
DELETE /api/exams/:id         - Delete exam
```

### Other Resources

- `/api/chapters` - Chapter management
- `/api/patterns` - Pattern management
- `/api/blueprints` - Blueprint management
- `/api/questiontypes` - Question type management
- `/api/dashboard` - Dashboard statistics
- `/api/users` - User management

### Seeds (Development Only)

```
GET  /api/seeds/clear         - Clear all data
GET  /api/seeds/users/clear   - Clear seed users
GET  /api/seeds/users/:count  - Create seed users
POST /api/seeds/tenant        - Create new tenant with admin
```

---

## Environment Variables

See `.env.example` for all configuration options.

Key variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (development/test/production) |
| `PORT` | Server port |
| `JWT_SECRET` | Secret for JWT signing |
| `DB_HOST_*` | Database host |
| `DB_PORT_*` | Database port |
| `DB_NAME_*` | Database name |
| `DB_USER_*` | Database user |
| `DB_PASS_*` | Database password |

---

## Raven Log

For get raven log create account here: [Sentry](https://sentry.io/)

---

## Body Whitelist

For security have add a whitelist function for your `req.body` coming from the front end. You can take a look of it in the `contants.js` file.

```js
const WHITELIST = {
  posts: {
    create: ['title', 'text'],
    update: ['title', 'text'],
  },
  users: {
    create: ['email', 'username', 'password'],
  },
};
```

## Pre-Commit Hook

I've add `pre-commit` and `lint-staged` for lint your code before commit. That can maybe take time :bowtie:

---

## Scripts

### DEV

```
yarn dev
```

or

```
npm run dev
```

**PS** That can crash if this is the first time but don't worry give it 2 sec the scripts gonna work. He just need to created a dist folder :) This way you have only one command to run.

### DEV-DEBUG

```
yarn dev:debug
```

or

```
npm run dev:debug
```

---

## Why toJSON on methods model ?

`toJSON()` help us to get only the data we want when we push the info to the client. So now we just need to put the user object in the `res.json(user)` and we received only what we want. Why `toAuthJSON()` ? Cause if we populated the post we get the `toJSON()` so the `toAuthJSON()` is the on to call on signup and login for get the token and _id.

```js
toAuthJSON() {
  return {
    _id: this._id,
    token: this.createToken(),  // Raw token - client adds Bearer prefix
  };
},

toJSON() {
  return {
    _id: this._id,
    username: this.username,
  };
},
```

---

## For Validation on Request

I'm using Joi in this boilerplate, that make the validation really easy.

```js
export const validation = {
  create: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
      username: Joi.string().min(3).max(20).required(),
    },
  },
};

routes.post(
  '/signup',
  validate(UserController.validation.create),
  UserController.create,
);
```

## Seeds

For seed just run one of this following comand. This is helpful in dev for making fake user.

**This is only available in dev environment**

*You can change the number of seed by changing the number in each script inside `/scripts/seeds`*

- Seeds 10 user `yarn db:seeds-user`
- Clear user collection `yarn db:seeds-clear-user`
- Clear all collection `yarn db:seeds-clear`

### Admin Seed (Default Tenant)

Creates a default tenant and an admin user if they do not already exist.

Credentials:

- Username: `admin`
- Password: `admin123`

Tenant:

- Name: `Default Organization`
- Code: `DEFAULT`

Run the seed:

```bash
# Using npm
npm run seed:admin

# Or directly
node scripts/seed-admin.js
```

Requirements:

- Database must be reachable (env configured). If you use a non-default env file, start the app with:

```bash
npx cross-env DOTENV_CONFIG_PATH=.env nodemon -r dotenv/config ./src/index.js
```

Notes:

- The script is idempotent: it will not create duplicates if `DEFAULT` tenant or `admin` user already exist.
- Output will display the tenant details and admin credentials upon success.

Troubleshooting:

- `ECONNREFUSED` when running seed: The database connection details in your `.env` are incorrect or the DB is not reachable.
  - Ensure MariaDB is running and reachable from your machine.
  - Verify these `.env` variables (example):
    ```env
    NODE_ENV=development
    DB_DIALECT=mariadb
    DB_HOST_DEV=localhost
    DB_PORT_DEV=3306
    DB_NAME_DEV=qb_server_dev
    DB_USER_DEV=root
    DB_PASS_DEV=
    ```
  - If using a remote DB, update `DB_HOST_DEV`, `DB_NAME_DEV`, `DB_USER_DEV`, `DB_PASS_DEV` accordingly.
  - To use SQLite locally instead, set:
    ```env
    DB_DIALECT=sqlite
    SQLITE_STORAGE=./data/qb_server.sqlite
    ```
    Then run `npm run dev` once to create the file and tables, and rerun `npm run seed:admin`.

---

Monitoring Server on `http://localhost:3000/status`

---


## Docker

```
bash scripts/development.sh
```

---

## Techs

- [Helmet](https://github.com/helmetjs/helmet)
- [Cors](https://github.com/expressjs/cors)
- [Body-Parser](https://github.com/expressjs/body-parser)
- [Morgan](https://github.com/expressjs/morgan)
- [PassportJS](https://github.com/jaredhanson/passport)
- [Passport-Local](https://github.com/jaredhanson/passport-local)
- [Passport-JWT](https://github.com/themikenicholson/passport-jwt)
- [Raven](https://github.com/getsentry/raven-node)
- [Joi](https://github.com/hapijs/joi)
- [Http-Status](https://github.com/adaltas/node-http-status)
- [Lint-Staged](https://github.com/okonet/lint-staged)
- [Husky](https://github.com/typicode/husky)
- [Prettier](https://github.com/prettier/prettier)
- [Eslint Config Prettier](https://github.com/prettier/eslint-config-prettier)
- [CodeClimate](https://codeclimate.com/)
- [Coveralls](https://github.com/integrations/coveralls)
- [Travis Ci](https://travis-ci.org/)
- [Circle Ci](https://circleci.com/)
- [Greenkeeper](https://greenkeeper.io/)
- [Istanbul](https://github.com/gotwarlost/istanbul)
- [Mocha](https://github.com/mochajs/mocha)
- [Chai](https://github.com/chaijs/chai)
- [Supertest](https://github.com/visionmedia/supertest)
- [NPS](https://github.com/kentcdodds/nps)
- [Sequelize](https://sequelize.org/)
- [MariaDB](https://mariadb.org/)
- [Webpack3](https://webpack.js.org/)

---

## Todo

- [x] Multi-tenant architecture
- [x] Sequelize ORM migration
- [ ] Sendgrid or Other Mail supply
- [ ] Add S3 for user image
- [ ] Add tenant management API
- [ ] Add subscription management
