# Multi-Tenant Architecture - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANT ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE LAYER                                  │
└─────────────────────────────────────────────────────────────────────────────┘

              ┌─────────────────────────────────────┐
              │         tenants (Master)            │
              │─────────────────────────────────────│
              │ ⚡ tenant_id (PK)                   │
              │   tenant_name                       │
              │   tenant_code (UNIQUE)              │
              │   email (UNIQUE)                    │
              │   subscription_plan                 │
              │   is_active                         │
              │   max_users                         │
              │   features (JSON)                   │
              └──────────────┬──────────────────────┘
                             │
                             │ ONE-TO-MANY
                             │
     ┌───────────────────────┼────────────────────────┐
     │                       │                        │
     ▼                       ▼                        ▼
┌─────────┐           ┌─────────┐              ┌─────────┐
│  users  │           │chapters │              │questions│
│─────────│           │─────────│              │─────────│
│ user_id │           │ ch_id   │              │ qst_id  │
│►tenant_id (FK)      │►tenant_id (FK)         │►tenant_id (FK)
│ username│           │ name    │              │ question│
│ email   │           │ sub_id  │              │ answer  │
│ role    │           │ dept_id │              │ marks   │
└─────────┘           └─────────┘              └─────────┘
     │                     │                        │
     │                     │                        │
     ▼                     ▼                        ▼
┌─────────┐           ┌─────────┐              ┌─────────┐
│ exams   │           │patterns │              │q_types  │
│─────────│           │─────────│              │─────────│
│ exam_id │           │ ptn_id  │              │ type_id │
│►tenant_id (FK)      │►tenant_id (FK)         │►tenant_id (FK)
│ name    │           │ name    │              │ name    │
│ user_id │           │ chap_id │              │ marks   │
└─────────┘           └─────────┘              └─────────┘

     ▼                     ▼
┌─────────┐           ┌─────────┐
│blueprints│          │  posts  │
│─────────│           │─────────│
│ blp_id  │           │ post_id │
│►tenant_id (FK)      │►tenant_id (FK)
│ name    │           │ title   │
│ user_id │           │ author  │
└─────────┘           └─────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTHENTICATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. LOGIN REQUEST                    2. JWT TOKEN GENERATED
   ┌────────────┐                      ┌──────────────────┐
   │  Client    │                      │    Payload:      │
   │            │                      │  {               │
   │ POST /login│ ──────────▶         │   user_id: 123   │
   │            │                      │   tenant_id: 5   │◄── From user record
   │ username   │                      │   role: teacher  │
   │ password   │                      │   iat: ...       │
   └────────────┘                      │   exp: ...       │
                                       │  }               │
                                       └──────────────────┘
                                                │
3. SUBSEQUENT REQUESTS                          │
   ┌────────────┐                              │
   │  Client    │                              │
   │            │                              │
   │ GET /api/  │                              │
   │ chapters   │ ─────────────────────────────┘
   │            │
   │ Header:    │         4. MIDDLEWARE CHAIN
   │ Authorization: JWT <token>
   └────────────┘              │
                               ▼
                    ┌──────────────────────┐
                    │  authJwt Middleware  │
                    │──────────────────────│
                    │ Decode JWT           │
                    │ Attach req.user      │
                    │  - user_id           │
                    │  - tenant_id ◄───────┼── Extracted here!
                    │  - role              │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ tenantContext        │
                    │ Middleware           │
                    │──────────────────────│
                    │ Set req.tenantId     │◄── Attached to request
                    │ Verify tenant active │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Controller         │
                    │──────────────────────│
                    │ Use tenantFilter(req)│
                    │ Query filtered by    │
                    │ tenant_id            │
                    └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUERY FLOW WITH TENANT FILTER                        │
└─────────────────────────────────────────────────────────────────────────────┘

CONTROLLER CODE:
┌──────────────────────────────────────────────────────────┐
│  export async function getList(req, res) {               │
│    const chapters = await Chapter.findAll({             │
│      where: {                                            │
│        ...tenantFilter(req),  // { tenant_id: 5 }       │
│        qbs_sub_id: req.query.subjectId,                 │
│      },                                                  │
│      order: [['qbs_chapter_name', 'ASC']],              │
│    });                                                   │
│    return res.json(chapters);                           │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
GENERATED SQL:
┌──────────────────────────────────────────────────────────┐
│  SELECT * FROM chapters                                  │
│  WHERE tenant_id = 5          ◄── Automatic isolation!   │
│    AND qbs_sub_id = 10                                   │
│  ORDER BY qbs_chapter_name ASC;                          │
└──────────────────────────────────────────────────────────┘

RESULT:
┌──────────────────────────────────────────────────────────┐
│  [                                                       │
│    { chapter_id: 1, tenant_id: 5, name: 'Chapter 1' },  │
│    { chapter_id: 5, tenant_id: 5, name: 'Chapter 2' },  │
│    // Only returns tenant 5's data                      │
│  ]                                                       │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       TENANT ISOLATION EXAMPLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

DATABASE STATE:
┌─────────────────────────────────────────────────────────┐
│                    chapters table                        │
│─────────────────────────────────────────────────────────│
│ chapter_id │ tenant_id │ name          │ subject_id     │
│────────────┼───────────┼───────────────┼────────────────│
│     1      │     1     │ Math Ch 1     │      10        │  ◄── Tenant A
│     2      │     1     │ Math Ch 2     │      10        │  ◄── Tenant A
│     3      │     2     │ Physics Ch 1  │      20        │  ◄── Tenant B
│     4      │     2     │ Chemistry Ch 1│      30        │  ◄── Tenant B
│     5      │     1     │ Math Ch 3     │      10        │  ◄── Tenant A
└─────────────────────────────────────────────────────────┘

USER FROM TENANT A QUERIES:
┌──────────────────────────────────────────────────────────┐
│  req.tenantId = 1                                        │
│  const chapters = await Chapter.findAll({               │
│    where: tenantFilter(req)  // { tenant_id: 1 }        │
│  });                                                     │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
TENANT A SEES:
┌─────────────────────────────────────────────────────────┐
│  [                                                       │
│    { chapter_id: 1, tenant_id: 1, name: 'Math Ch 1' },  │
│    { chapter_id: 2, tenant_id: 1, name: 'Math Ch 2' },  │
│    { chapter_id: 5, tenant_id: 1, name: 'Math Ch 3' }   │
│  ]                                                       │
│                                                          │
│  ✅ Cannot see Tenant B's data (chapter_id 3, 4)        │
└─────────────────────────────────────────────────────────┘

USER FROM TENANT B QUERIES:
┌──────────────────────────────────────────────────────────┐
│  req.tenantId = 2                                        │
│  const chapters = await Chapter.findAll({               │
│    where: tenantFilter(req)  // { tenant_id: 2 }        │
│  });                                                     │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
TENANT B SEES:
┌─────────────────────────────────────────────────────────┐
│  [                                                       │
│    { chapter_id: 3, tenant_id: 2, name: 'Physics Ch 1'},│
│    { chapter_id: 4, tenant_id: 2, name: 'Chemistry Ch 1'}│
│  ]                                                       │
│                                                          │
│  ✅ Cannot see Tenant A's data (chapter_id 1, 2, 5)     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        CREATE OPERATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

CONTROLLER CODE:
┌──────────────────────────────────────────────────────────┐
│  export async function create(req, res) {                │
│    const chapter = await Chapter.create({               │
│      ...tenantData(req),  // { tenant_id: 5 }           │
│      qbs_chapter_name: req.body.name,                   │
│      qbs_sub_id: req.body.subjectId,                    │
│    });                                                   │
│    return res.status(201).json(chapter);                │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
GENERATED SQL:
┌──────────────────────────────────────────────────────────┐
│  INSERT INTO chapters                                    │
│    (tenant_id, qbs_chapter_name, qbs_sub_id)            │
│  VALUES                                                  │
│    (5, 'New Chapter', 10);   ◄── tenant_id auto-added!  │
└──────────────────────────────────────────────────────────┘

RESULT:
┌──────────────────────────────────────────────────────────┐
│  {                                                       │
│    chapter_id: 6,                                        │
│    tenant_id: 5,          ◄── Automatically set from JWT│
│    qbs_chapter_name: 'New Chapter',                     │
│    qbs_sub_id: 10                                        │
│  }                                                       │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY BOUNDARIES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│        REGULAR USER (Teacher)        │
│──────────────────────────────────────│
│  JWT: { tenant_id: 5, role: teacher }│
│                                      │
│  ✅ CAN:                             │
│    • Create records in tenant 5      │
│    • Read records from tenant 5      │
│    • Update records in tenant 5      │
│    • Delete records in tenant 5      │
│                                      │
│  ❌ CANNOT:                           │
│    • See records from other tenants  │
│    • Modify tenant_id of records     │
│    • Access tenant management        │
│    • Create/delete tenants           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         TENANT ADMIN                 │
│──────────────────────────────────────│
│  JWT: { tenant_id: 5,                │
│         role: tenant_admin }         │
│                                      │
│  ✅ CAN:                             │
│    • All teacher permissions         │
│    • Create users in tenant 5        │
│    • Manage tenant 5 settings        │
│    • Create teachers in tenant 5     │
│                                      │
│  ❌ CANNOT:                           │
│    • Create super_admin or           │
│      tenant_admin users              │
│    • Access other tenants            │
│    • Delete tenant                   │
│    • See platform-wide data          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         SUPER ADMIN                  │
│──────────────────────────────────────│
│  JWT: { tenant_id: 1,                │
│         role: super_admin }          │
│                                      │
│  ✅ CAN:                             │
│    • Create/manage ALL tenants       │
│    • Create other super admins       │
│    • See cross-tenant data           │
│    • Manage any tenant's users       │
│    • Access platform-wide features   │
│                                      │
│  ❌ Cannot accidentally:              │
│    • Mix tenant data (must be        │
│      explicit when bypassing filter) │
└──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE OPTIMIZATION                             │
└─────────────────────────────────────────────────────────────────────────────┘

INDEX STRATEGY:

1. Single Column Index:
   ┌──────────────────────────┐
   │ CREATE INDEX             │
   │   idx_users_tenant       │
   │ ON users(tenant_id);     │
   └──────────────────────────┘
   Fast filtering by tenant

2. Composite Index:
   ┌──────────────────────────────┐
   │ CREATE INDEX                 │
   │   idx_users_tenant_email     │
   │ ON users(tenant_id, email);  │
   └──────────────────────────────┘
   Fast tenant-scoped lookups

3. Covering Index:
   ┌────────────────────────────────────────┐
   │ CREATE INDEX                           │
   │   idx_users_tenant_list                │
   │ ON users(tenant_id, role, is_active);  │
   └────────────────────────────────────────┘
   Query answered from index alone

QUERY PLAN:
┌─────────────────────────────────────────┐
│ EXPLAIN SELECT * FROM users             │
│ WHERE tenant_id = 5 AND email = '...';  │
│                                         │
│ Uses: idx_users_tenant_email            │
│ Rows scanned: 1 (instead of all rows)  │
│ Cost: 0.35 (very fast!)                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FILE STRUCTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

src/
├── models/
│   ├── tenant.model.js           ◄── Master tenant table
│   ├── user.model.js              ◄── Has tenant_id FK
│   ├── chapter.model.js           ◄── Has tenant_id FK
│   ├── question.model.js          ◄── Has tenant_id FK
│   └── index.js                   ◄── Tenant associations
│
├── middlewares/
│   ├── tenant.middleware.js       ◄── tenantFilter, tenantData helpers
│   └── role.middleware.js         ◄── Role-based access control
│
├── controllers/
│   ├── tenant.controller.js       ◄── Tenant CRUD (super admin)
│   ├── user.controller.js         ◄── Uses tenantFilter/tenantData
│   ├── chapter.controller.js      ◄── Uses tenantFilter/tenantData
│   └── question.controller.js     ◄── Uses tenantFilter/tenantData
│
└── routes/
    └── *.routes.js                ◄── Apply tenantContext middleware

scripts/
└── migrations/
    └── add-tenant-foreign-keys.js ◄── Database setup script

docs/
├── MULTI_TENANT_ARCHITECTURE.md   ◄── Complete guide
└── TENANT_QUICK_REFERENCE.md      ◄── Quick patterns
```
