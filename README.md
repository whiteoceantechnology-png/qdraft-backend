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
    token: `JWT ${this.createToken()}`,
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
