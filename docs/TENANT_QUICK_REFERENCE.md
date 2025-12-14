# Multi-Tenant Quick Reference

## 🎯 Quick Start

```bash
# 1. Run tenant migration (adds foreign keys & indexes)
npm run migrate:tenant

# 2. Verify tenant isolation
# Check logs for tenant_id columns and indexes on all tables
```

## 📋 Checklist: Is My Table Tenant-Ready?

- [ ] Has `tenant_id` column (INTEGER, NOT NULL)
- [ ] Foreign key to `tenants(tenant_id)`
- [ ] Index on `tenant_id` column
- [ ] Composite indexes for common queries
- [ ] Model includes `tenant_id` field
- [ ] Model has Tenant association
- [ ] Controller uses `tenantFilter(req)`
- [ ] Controller uses `tenantData(req)`
- [ ] Routes have `tenantContext` middleware
- [ ] Tests verify tenant isolation

## 🔧 Essential Code Patterns

### CREATE Operation
```javascript
const record = await Model.create({
  ...tenantData(req),  // ← Required! Adds tenant_id from JWT
  name: req.body.name,
  value: req.body.value,
});
```

### READ Operation
```javascript
const records = await Model.findAll({
  where: {
    ...tenantFilter(req),  // ← Required! Filters by tenant_id
    status: 'active',
  },
});
```

### READ BY ID
```javascript
const record = await Model.findOne({
  where: {
    ...tenantFilter(req),  // ← Prevents cross-tenant access
    id: req.params.id,
  },
});
```

### UPDATE Operation
```javascript
// Step 1: Find with tenant filter
const record = await Model.findOne({
  where: {
    ...tenantFilter(req),  // ← Must verify ownership first
    id: req.params.id,
  },
});

if (!record) {
  return res.status(404).json({ message: 'Not found' });
}

// Step 2: Update (tenant_id stays immutable)
await record.update({
  name: req.body.name,
  // Never update tenant_id!
});
```

### DELETE Operation
```javascript
const deleted = await Model.destroy({
  where: {
    ...tenantFilter(req),  // ← Prevents cross-tenant deletion
    id: req.params.id,
  },
});
```

## 🚨 Common Mistakes

### ❌ WRONG - No Tenant Filter
```javascript
// This leaks data across tenants!
const users = await User.findAll({
  where: { is_active: true }
});
```

### ✅ CORRECT - With Tenant Filter
```javascript
const users = await User.findAll({
  where: {
    ...tenantFilter(req),  // ← Always include
    is_active: true,
  }
});
```

---

### ❌ WRONG - No Tenant Data on Create
```javascript
// This creates record with NULL tenant_id!
const chapter = await Chapter.create({
  qbs_chapter_name: req.body.name,
});
```

### ✅ CORRECT - With Tenant Data
```javascript
const chapter = await Chapter.create({
  ...tenantData(req),  // ← Always include
  qbs_chapter_name: req.body.name,
});
```

---

### ❌ WRONG - Trusting Client Input
```javascript
// Security hole! Client can specify any tenant_id
const record = await Model.create({
  tenant_id: req.body.tenant_id,  // ← Never do this!
  name: req.body.name,
});
```

### ✅ CORRECT - Using JWT Context
```javascript
// tenant_id comes from authenticated JWT token
const record = await Model.create({
  ...tenantData(req),  // ← Secure, from authentication
  name: req.body.name,
});
```

## 📊 Database Schema Quick Reference

```sql
-- Standard tenant_id column definition
tenant_id INT NOT NULL,
FOREIGN KEY (tenant_id) 
  REFERENCES tenants(tenant_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT,

-- Always add index
INDEX idx_tablename_tenant_id (tenant_id),

-- Composite indexes for common queries
INDEX idx_tablename_tenant_filter (tenant_id, frequently_queried_column),

-- Unique constraints include tenant_id
UNIQUE INDEX idx_tablename_tenant_unique (tenant_id, unique_field),
```

## 🔄 JWT Token Flow

```
1. User Login
   ↓
2. Generate JWT with { user_id, tenant_id, role }
   ↓
3. Client sends: Authorization: Bearer <token>
   ↓
4. authJwt middleware decodes → req.user
   ↓
5. tenantContext middleware → req.tenantId
   ↓
6. Controller uses tenantFilter(req) → { tenant_id: req.tenantId }
   ↓
7. Query automatically filtered by tenant
```

## 🛡️ Security Rules

1. **Never trust client input for tenant_id**
   - Always use `tenantData(req)` from JWT context

2. **Always filter queries by tenant**
   - Use `tenantFilter(req)` in all where clauses

3. **Tenant ID is immutable**
   - Never allow updating `tenant_id` after creation

4. **Super admin bypass is explicit**
   - Only skip tenant filter when `role === 'super_admin'` AND intentional

5. **Test isolation thoroughly**
   - Create 2+ tenants and verify data separation

## 📝 Model Checklist

```javascript
// ✅ Proper Model Definition
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class MyModel extends Model {}

MyModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {  // ✅ Required
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenant_id',
      },
    },
    // ... other fields
  },
  {
    sequelize,
    modelName: 'MyModel',
    tableName: 'my_models',
    timestamps: true,
    indexes: [
      { fields: ['tenant_id'] },  // ✅ Required
      { fields: ['tenant_id', 'other_field'] },  // ✅ Common queries
    ],
  }
);

export default MyModel;
```

## 🏗️ Associations

```javascript
// In models/index.js

// ✅ Tenant associations (One-to-Many)
Tenant.hasMany(MyModel, { foreignKey: 'tenant_id', as: 'myModels' });
MyModel.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ✅ Include tenant in queries
const record = await MyModel.findOne({
  where: { ...tenantFilter(req), id: recordId },
  include: [{
    model: Tenant,
    as: 'tenant',
    attributes: ['tenant_name', 'subscription_plan'],
  }],
});
```

## 🧪 Testing Pattern

```javascript
describe('MyController', () => {
  it('should only return records from user tenant', async () => {
    // Setup - create records in 2 tenants
    await MyModel.create({ tenant_id: 1, name: 'Tenant 1 Record' });
    await MyModel.create({ tenant_id: 2, name: 'Tenant 2 Record' });
    
    // Mock request from tenant 1
    req.tenantId = 1;
    req.user = { user_id: 1, tenant_id: 1, role: 'teacher' };
    
    // Execute controller
    await getList(req, res);
    
    // Assert - only tenant 1 records returned
    const data = res.json.mock.calls[0][0];
    expect(data.every(r => r.tenant_id === 1)).toBe(true);
    expect(data.some(r => r.tenant_id === 2)).toBe(false);
  });
});
```

## 🎨 Super Admin Pattern

```javascript
// Super admin can see ALL tenants
export async function listAll(req, res) {
  // Check super admin permission
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // NO tenant filter - intentional cross-tenant access
  const records = await Model.findAll({
    include: [{
      model: Tenant,
      as: 'tenant',
      attributes: ['tenant_name', 'tenant_code'],
    }],
  });
  
  return res.status(200).json(records);
}
```

## 📈 Performance Tips

```javascript
// ✅ GOOD - Single query with tenant filter in JOIN
const chapters = await Chapter.findAll({
  where: tenantFilter(req),
  include: [{
    model: Question,
    as: 'questions',
    where: tenantFilter(req),  // ← Apply to JOIN too
    required: false,
  }],
});

// ❌ BAD - N+1 query problem
const chapters = await Chapter.findAll({ where: tenantFilter(req) });
for (const chapter of chapters) {
  chapter.questions = await Question.findAll({
    where: { ...tenantFilter(req), chapter_id: chapter.id }
  });
}
```

## 🔍 Debugging Checklist

**Problem:** User sees data from other tenants

- [ ] Check `tenantFilter(req)` is in where clause
- [ ] Verify `req.tenantId` is set (check middleware order)
- [ ] Confirm JWT includes correct `tenant_id`
- [ ] Look for raw queries bypassing ORM

**Problem:** Records created with null tenant_id

- [ ] Check `tenantData(req)` is in create data
- [ ] Verify `req.tenantId` exists
- [ ] Check middleware is applied to route
- [ ] Confirm user is authenticated

**Problem:** Super admin can't access all data

- [ ] Verify role check: `req.user.role === 'super_admin'`
- [ ] Remove `tenantFilter(req)` for super admin queries
- [ ] Document as intentional cross-tenant access

## 📚 Reference Files

- [Multi-Tenant Architecture Guide](./MULTI_TENANT_ARCHITECTURE.md) - Complete documentation
- [Tenant Middleware](../src/middlewares/tenant.middleware.js) - Helper functions
- [Migration Script](../scripts/migrations/add-tenant-foreign-keys.js) - Database setup
- [Models Index](../src/models/index.js) - Tenant associations
- [Example Controller](../src/controllers/chapter.controller.js) - Implementation pattern

## 🚀 Migration Command

```bash
# Run this to set up tenant isolation
npm run migrate:tenant
```

**What it does:**
- Adds `tenant_id` columns (if missing)
- Creates foreign key constraints
- Adds single-column indexes
- Creates composite indexes for performance
- Verifies tenant isolation across tables

## ⚡ Quick Commands

```bash
# Setup
npm run migrate:tenant          # Add tenant constraints

# Seed default tenant & admin
npm run seed:admin              # Creates DEFAULT tenant + admin user

# Development
npm run dev                     # Start server with hot reload

# Testing
npm test                        # Run all tests
npm test user.controller.test   # Test specific controller
```
