# Multi-Tenant Architecture - Complete Implementation Guide

## Overview

QB-Server implements **row-level multi-tenancy** where all tenant data is stored in shared tables with a `tenant_id` foreign key. This ensures complete data isolation while maintaining performance and simplifying maintenance.

## Architecture Components

### 1. Tenant Model (`tenant.model.js`)
The central tenant table that all other tables reference:

```javascript
{
  tenant_id: PRIMARY KEY,
  tenant_name: STRING,
  tenant_code: STRING (UNIQUE),
  email: STRING (UNIQUE),
  subscription_plan: ENUM,
  is_active: BOOLEAN,
  max_users: INTEGER,
  features: JSON
}
```

### 2. Tenant-Linked Tables

All application tables include `tenant_id` foreign key:

| Table | Primary Key | Tenant FK | Purpose |
|-------|------------|-----------|---------|
| users | user_id | tenant_id | User accounts (all roles) |
| chapters | qbs_chapter_id | tenant_id | Course chapters |
| questions | qbs_question_id | tenant_id | Question bank |
| question_types | qbs_qs_type_id | tenant_id | Question type definitions |
| patterns | qbs_ptn_id | tenant_id | Question patterns |
| blueprints | qbs_blp_id | tenant_id | Exam blueprints |
| exams | qbs_exam_id | tenant_id | Generated exams |
| posts | post_id | tenant_id | Blog/content posts |

### 3. Tenant Middleware (`tenant.middleware.js`)

#### Automatic Tenant Context
```javascript
// Applied to all authenticated routes
app.use(authJwt);        // Extract user from JWT
app.use(tenantContext);   // Attach tenant_id to request
```

#### Helper Functions
```javascript
// Filter queries by tenant
tenantFilter(req)  // Returns: { tenant_id: req.tenantId }

// Add tenant_id to create operations
tenantData(req)    // Returns: { tenant_id: req.tenantId }

// Scope for advanced queries
createTenantScope(tenantId)
```

## Implementation Pattern

### Controller Pattern (Standard)

```javascript
import { tenantFilter, tenantData } from '../middlewares/tenant.middleware.js';

// CREATE - automatically add tenant_id
export async function create(req, res) {
  const record = await Model.create({
    ...tenantData(req),  // Adds tenant_id from JWT
    field1: req.body.field1,
    field2: req.body.field2,
    created_by: req.user.user_id,
  });
  
  return res.status(201).json(record);
}

// READ - filter by tenant_id
export async function getList(req, res) {
  const records = await Model.findAll({
    where: {
      ...tenantFilter(req),  // Adds tenant_id filter
      // Additional filters
    },
    limit: 50,
  });
  
  return res.status(200).json(records);
}

// READ BY ID - ensure tenant ownership
export async function getById(req, res) {
  const record = await Model.findOne({
    where: {
      ...tenantFilter(req),  // Prevents cross-tenant access
      id: req.params.id,
    },
  });
  
  if (!record) {
    return res.status(404).json({ message: 'Not found' });
  }
  
  return res.status(200).json(record);
}

// UPDATE - tenant-scoped
export async function update(req, res) {
  const record = await Model.findOne({
    where: {
      ...tenantFilter(req),
      id: req.params.id,
    },
  });
  
  if (!record) {
    return res.status(404).json({ message: 'Not found' });
  }
  
  await record.update({
    field1: req.body.field1,
    field2: req.body.field2,
  });
  
  return res.status(200).json(record);
}

// DELETE - tenant-scoped
export async function remove(req, res) {
  const deleted = await Model.destroy({
    where: {
      ...tenantFilter(req),
      id: req.params.id,
    },
  });
  
  if (!deleted) {
    return res.status(404).json({ message: 'Not found' });
  }
  
  return res.status(200).json({ message: 'Deleted' });
}
```

## Database Schema

### Foreign Key Constraints

```sql
-- All tables have this constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_tenant
FOREIGN KEY (tenant_id) 
REFERENCES tenants(tenant_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;  -- Prevent tenant deletion if records exist
```

### Indexes for Performance

```sql
-- Single column indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_questions_tenant_id ON questions(tenant_id);

-- Composite indexes (tenant + frequently queried column)
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_questions_tenant_chapter ON questions(tenant_id, qbs_chapter_id);
CREATE UNIQUE INDEX idx_posts_tenant_slug ON posts(tenant_id, slug);
```

### Migration Script

Run the migration to ensure all constraints are in place:

```bash
node scripts/migrations/add-tenant-foreign-keys.js
```

This script:
- ✅ Adds `tenant_id` column to any missing tables
- ✅ Creates foreign key constraints
- ✅ Adds single-column indexes
- ✅ Creates composite indexes for performance
- ✅ Verifies tenant isolation

## JWT Token Structure

```javascript
{
  user_id: 123,
  tenant_id: 5,      // ← Tenant context
  role: 'teacher',
  iat: 1702569600,
  exp: 1703174400
}
```

### Token Flow

1. **Login** → JWT includes `tenant_id` from user record
2. **Request** → authJwt middleware decodes token, attaches `req.user`
3. **Tenant Context** → tenantContext middleware extracts `tenant_id`, attaches `req.tenantId`
4. **Query** → All queries automatically filtered by `req.tenantId`

## Security Features

### 1. Automatic Tenant Isolation

```javascript
// ❌ WRONG - Cross-tenant access possible
const user = await User.findByPk(userId);

// ✅ CORRECT - Tenant-scoped query
const user = await User.findOne({
  where: {
    ...tenantFilter(req),
    user_id: userId,
  },
});
```

### 2. Create Operations Always Include Tenant

```javascript
// ❌ WRONG - Record could end up in wrong tenant
const chapter = await Chapter.create({
  qbs_chapter_name: name,
});

// ✅ CORRECT - Explicitly set from JWT context
const chapter = await Chapter.create({
  ...tenantData(req),  // Adds tenant_id from authenticated user
  qbs_chapter_name: name,
});
```

### 3. Super Admin Bypass

```javascript
// Super admins can see all tenants
export async function getAllTenants(req, res) {
  // No tenant filter for super admin operations
  const tenants = await Tenant.findAll({
    order: [['tenant_name', 'ASC']],
  });
  
  return res.status(200).json(tenants);
}
```

### 4. Prevent Tenant Modification

```javascript
// ❌ Tenants should NEVER be modified in update operations
export async function update(req, res) {
  // tenant_id is NOT included in update data
  await record.update({
    field1: req.body.field1,
    // tenant_id is immutable after creation
  });
}
```

## Model Associations

```javascript
// Tenant → Users (One-to-Many)
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Tenant → Questions (One-to-Many)
Tenant.hasMany(Question, { foreignKey: 'tenant_id', as: 'questions' });
Question.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Include tenant in queries
const user = await User.findOne({
  where: { user_id: 123 },
  include: [{
    model: Tenant,
    as: 'tenant',
    attributes: ['tenant_name', 'subscription_plan'],
  }],
});
```

## Testing Tenant Isolation

### Unit Test Pattern

```javascript
describe('Question Controller', () => {
  it('should only return questions from user tenant', async () => {
    // Setup
    const tenant1Questions = await createQuestions({ tenant_id: 1 }, 5);
    const tenant2Questions = await createQuestions({ tenant_id: 2 }, 3);
    
    // Mock request with tenant 1
    req.tenantId = 1;
    
    // Execute
    await getList(req, res);
    
    // Assert - should only see tenant 1 questions
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining(
        tenant1Questions.map(q => expect.objectContaining({ tenant_id: 1 }))
      )
    );
    expect(res.json).not.toHaveBeenCalledWith(
      expect.arrayContaining(
        tenant2Questions
      )
    );
  });
});
```

### Manual Testing

```bash
# 1. Create two tenants
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: JWT <super_admin_token>" \
  -d '{"tenant_name":"Tenant A","tenant_code":"TA001","email":"a@test.com"}'

curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: JWT <super_admin_token>" \
  -d '{"tenant_name":"Tenant B","tenant_code":"TB001","email":"b@test.com"}'

# 2. Login as Tenant A admin
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"admin_a","password":"pass123"}'
# Save token: TENANT_A_TOKEN

# 3. Create records as Tenant A
curl -X POST http://localhost:3000/api/chapters \
  -H "Authorization: JWT <TENANT_A_TOKEN>" \
  -d '{"qbs_chapter_name":"Chapter 1"}'

# 4. Login as Tenant B admin
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"admin_b","password":"pass123"}'
# Save token: TENANT_B_TOKEN

# 5. Try to list chapters as Tenant B
curl -X GET http://localhost:3000/api/chapters \
  -H "Authorization: JWT <TENANT_B_TOKEN>"

# ✅ Should return empty array (Tenant A's chapters are isolated)
```

## Performance Optimization

### 1. Index Strategy

```sql
-- Always index tenant_id (single column)
CREATE INDEX idx_table_tenant ON table(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_table_tenant_filter ON table(tenant_id, frequently_filtered_column);

-- Covering indexes for read-heavy queries
CREATE INDEX idx_table_tenant_covering 
ON table(tenant_id, col1, col2, col3);
```

### 2. Query Optimization

```javascript
// ❌ BAD - Multiple queries
const chapters = await Chapter.findAll({ where: tenantFilter(req) });
for (const chapter of chapters) {
  chapter.questionCount = await Question.count({
    where: { ...tenantFilter(req), qbs_chapter_id: chapter.qbs_chapter_id },
  });
}

// ✅ GOOD - Single query with JOIN
const chapters = await Chapter.findAll({
  where: tenantFilter(req),
  attributes: [
    'qbs_chapter_id',
    'qbs_chapter_name',
    [fn('COUNT', col('questions.qbs_question_id')), 'questionCount'],
  ],
  include: [{
    model: Question,
    as: 'questions',
    attributes: [],
    where: tenantFilter(req),  // Ensure tenant filter on join
    required: false,
  }],
  group: ['Chapter.qbs_chapter_id'],
});
```

### 3. Caching

```javascript
import cache, { keys, TTL } from '../services/cache.js';

// Cache tenant data (rarely changes)
async function getTenantCached(tenantId) {
  const cacheKey = keys.tenant(tenantId);
  let tenant = cache.get(cacheKey);
  
  if (!tenant) {
    tenant = await Tenant.findByPk(tenantId);
    cache.set(cacheKey, tenant, TTL.LONG);  // 15 minutes
  }
  
  return tenant;
}
```

## Common Patterns

### Pattern 1: Cross-Tenant Reference (Super Admin)

```javascript
// Super admin viewing all users across tenants
export async function getAllUsers(req, res) {
  // Verify super admin
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // No tenant filter - see all tenants
  const users = await User.findAll({
    include: [{
      model: Tenant,
      as: 'tenant',
      attributes: ['tenant_name', 'tenant_code'],
    }],
    order: [['created_at', 'DESC']],
  });
  
  return res.status(200).json(users);
}
```

### Pattern 2: Tenant Admin Creating Users

```javascript
// Tenant admin creates user within their tenant only
export async function createUser(req, res) {
  // tenantData(req) automatically adds tenant_id from JWT
  const user = await User.create({
    ...tenantData(req),  // ← Ensures user belongs to admin's tenant
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role || 'user',
  });
  
  return res.status(201).json(user);
}
```

### Pattern 3: Soft Tenant Switching (Not Recommended)

```javascript
// ❌ AVOID - Allowing users to switch tenants is a security risk
// Users should only access their assigned tenant from JWT
```

## Troubleshooting

### Issue: Cross-Tenant Data Leak

**Symptom:** User sees data from other tenants

**Solution:**
```javascript
// Always use tenantFilter(req) in where clause
const records = await Model.findAll({
  where: {
    ...tenantFilter(req),  // ← Missing this?
    // other conditions
  },
});
```

### Issue: Tenant ID Not Set on Create

**Symptom:** Records created with null tenant_id

**Solution:**
```javascript
// Always use tenantData(req) when creating
const record = await Model.create({
  ...tenantData(req),  // ← Missing this?
  // other fields
});
```

### Issue: Super Admin Can't See All Data

**Symptom:** Super admin queries return limited results

**Solution:**
```javascript
// Super admin operations should NOT use tenantFilter
if (req.user.role === 'super_admin') {
  // No tenant filter
  const records = await Model.findAll();
} else {
  // Regular tenant-scoped query
  const records = await Model.findAll({
    where: tenantFilter(req),
  });
}
```

## Migration Checklist

- [ ] Run `node scripts/migrations/add-tenant-foreign-keys.js`
- [ ] Verify all tables have `tenant_id` column
- [ ] Check foreign key constraints are in place
- [ ] Verify indexes exist for performance
- [ ] Test tenant isolation with multiple tenants
- [ ] Update all controllers to use `tenantFilter` and `tenantData`
- [ ] Add tenant context middleware to routes
- [ ] Test cross-tenant access prevention
- [ ] Document any exceptions (super admin routes)
- [ ] Run integration tests

## Best Practices

1. **Always use helper functions** - `tenantFilter(req)` and `tenantData(req)`
2. **Never trust client input for tenant_id** - Always use JWT context
3. **Test isolation** - Create multiple tenants and verify data separation
4. **Index tenant_id** - Every tenant-linked table needs indexes
5. **Document exceptions** - Super admin routes that bypass tenant filter
6. **Immutable tenant_id** - Never allow changing a record's tenant
7. **Cascade carefully** - Use RESTRICT on tenant deletion to prevent data loss
8. **Cache tenant data** - Reduce database queries for tenant information

## Resources

- [Models Index](../src/models/index.js) - Tenant associations
- [Tenant Middleware](../src/middlewares/tenant.middleware.js) - Helper functions
- [Migration Script](../scripts/migrations/add-tenant-foreign-keys.js) - Database setup
- [Example Controller](../src/controllers/chapter.controller.js) - Implementation pattern
