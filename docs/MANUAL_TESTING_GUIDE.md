# Manual API Testing Guide - Role-Based Authorization

## Setup

1. **Seed the admin user:**
```bash
npm run seed:admin
```

2. **Start the server:**
```bash
npm run dev
```

3. **Login as super admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Save the token from response: `JWT <your_token>`

---

## Test Scenarios

### 1. Super Admin Creates Tenant with Admin

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <super_admin_token>" \
  -d '{
    "tenant_name": "Acme School",
    "tenant_code": "ACME001",
    "email": "contact@acme.school",
    "subscription_plan": "premium",
    "max_users": 100,
    "admin_username": "acme_admin",
    "admin_email": "admin@acme.school",
    "admin_password": "securepass123",
    "admin_name": "John Admin"
  }'
```

**Expected:** ✅ 201 Created
- Returns both tenant and admin objects
- Admin has role: "tenant_admin"

---

### 2. Login as Tenant Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "acme_admin",
    "password": "securepass123"
  }'
```

Save this token: `JWT <tenant_admin_token>`

---

### 3. Tenant Admin Creates Teacher (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <tenant_admin_token>" \
  -d '{
    "username": "teacher_john",
    "email": "john@acme.school",
    "password": "teacherpass123",
    "user_fname": "John Teacher",
    "role": "teacher"
  }'
```

**Expected:** ✅ 201 Created
- User created with role: "teacher"
- Belongs to tenant_id of tenant admin

---

### 4. Tenant Admin Creates Regular User (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <tenant_admin_token>" \
  -d '{
    "username": "student_alice",
    "email": "alice@acme.school",
    "password": "studentpass123",
    "user_fname": "Alice Student",
    "role": "user"
  }'
```

**Expected:** ✅ 201 Created
- User created with role: "user"

---

### 5. Tenant Admin Tries to Create Super Admin (Should Fail)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <tenant_admin_token>" \
  -d '{
    "username": "hacker_admin",
    "email": "hacker@acme.school",
    "password": "hackpass123",
    "role": "super_admin"
  }'
```

**Expected:** ❌ 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: Tenant admins can only create user or teacher roles"
}
```

---

### 6. Tenant Admin Tries to Create Another Tenant Admin (Should Fail)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <tenant_admin_token>" \
  -d '{
    "username": "another_tadmin",
    "email": "tadmin2@acme.school",
    "password": "adminpass123",
    "role": "tenant_admin"
  }'
```

**Expected:** ❌ 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: Tenant admins can only create user or teacher roles"
}
```

---

### 7. Super Admin Creates Another Super Admin (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <super_admin_token>" \
  -d '{
    "username": "superadmin2",
    "email": "admin2@platform.com",
    "password": "securepass123",
    "user_fname": "Jane Smith",
    "role": "super_admin"
  }'
```

**Expected:** ✅ 201 Created
- User created with role: "super_admin"

---

### 8. Tenant Admin Lists Users (Tenant Scoped)

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: JWT <tenant_admin_token>"
```

**Expected:** ✅ 200 OK
- Returns only users from tenant admin's tenant
- Does NOT show users from other tenants

---

### 9. Super Admin Lists Users (All Tenants)

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: JWT <super_admin_token>"
```

**Expected:** ✅ 200 OK
- Returns users from ALL tenants
- Shows cross-tenant data

---

### 10. Regular User Tries to Create User (Should Fail)

First, login as a regular user (e.g., student_alice):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_alice",
    "password": "studentpass123"
  }'
```

Then try to create a user:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: JWT <user_token>" \
  -d '{
    "username": "hacker",
    "email": "hacker@test.com",
    "password": "hackpass123"
  }'
```

**Expected:** ❌ 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

---

### 11. Regular User Accesses Own Profile (Should Succeed)

```bash
curl -X GET http://localhost:3000/api/users/profile/me \
  -H "Authorization: JWT <user_token>"
```

**Expected:** ✅ 200 OK
- Returns user's own profile data

---

### 12. Tenant Admin Accesses Tenant Routes (Should Fail)

```bash
curl -X GET http://localhost:3000/api/tenants \
  -H "Authorization: JWT <tenant_admin_token>"
```

**Expected:** ❌ 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

---

## Quick Test Script

Save this as `test-roles.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${YELLOW}Starting Role-Based Authorization Tests...${NC}\n"

# 1. Login as super admin
echo -e "${YELLOW}1. Login as super admin${NC}"
SUPER_ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

SUPER_ADMIN_TOKEN=$(echo $SUPER_ADMIN_RESPONSE | jq -r '.access_token')

if [ "$SUPER_ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Super admin login successful${NC}\n"
else
  echo -e "${RED}✗ Super admin login failed${NC}\n"
  exit 1
fi

# 2. Create tenant with admin
echo -e "${YELLOW}2. Create tenant with admin${NC}"
TENANT_RESPONSE=$(curl -s -X POST $BASE_URL/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: $SUPER_ADMIN_TOKEN" \
  -d '{
    "tenant_name": "Test School",
    "tenant_code": "TEST999",
    "email": "test@school.com",
    "admin_username": "test_admin",
    "admin_email": "admin@school.com",
    "admin_password": "testpass123"
  }')

TENANT_ID=$(echo $TENANT_RESPONSE | jq -r '.tenant.tenant_id')

if [ "$TENANT_ID" != "null" ]; then
  echo -e "${GREEN}✓ Tenant created with admin${NC}\n"
else
  echo -e "${RED}✗ Tenant creation failed${NC}\n"
fi

# 3. Login as tenant admin
echo -e "${YELLOW}3. Login as tenant admin${NC}"
TENANT_ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_admin","password":"testpass123"}')

TENANT_ADMIN_TOKEN=$(echo $TENANT_ADMIN_RESPONSE | jq -r '.access_token')

if [ "$TENANT_ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Tenant admin login successful${NC}\n"
else
  echo -e "${RED}✗ Tenant admin login failed${NC}\n"
fi

# 4. Tenant admin creates teacher (should succeed)
echo -e "${YELLOW}4. Tenant admin creates teacher${NC}"
TEACHER_RESPONSE=$(curl -s -X POST $BASE_URL/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: $TENANT_ADMIN_TOKEN" \
  -d '{
    "username": "test_teacher",
    "email": "teacher@school.com",
    "password": "teachpass123",
    "role": "teacher"
  }')

TEACHER_SUCCESS=$(echo $TEACHER_RESPONSE | jq -r '.success')

if [ "$TEACHER_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Teacher created successfully${NC}\n"
else
  echo -e "${RED}✗ Teacher creation failed${NC}\n"
fi

# 5. Tenant admin tries to create super admin (should fail)
echo -e "${YELLOW}5. Tenant admin tries to create super admin${NC}"
HACK_RESPONSE=$(curl -s -X POST $BASE_URL/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: $TENANT_ADMIN_TOKEN" \
  -d '{
    "username": "hack_admin",
    "email": "hack@school.com",
    "password": "hackpass123",
    "role": "super_admin"
  }')

HACK_SUCCESS=$(echo $HACK_RESPONSE | jq -r '.success')

if [ "$HACK_SUCCESS" == "false" ]; then
  echo -e "${GREEN}✓ Correctly rejected (403 Forbidden)${NC}\n"
else
  echo -e "${RED}✗ Security breach! Tenant admin created super admin!${NC}\n"
fi

echo -e "${YELLOW}Tests completed!${NC}"
```

Make it executable and run:
```bash
chmod +x test-roles.sh
./test-roles.sh
```

---

## Expected Results Summary

| Test | Expected Result | Status Code |
|------|----------------|-------------|
| Super admin creates tenant + admin | ✅ Success | 201 |
| Tenant admin creates teacher | ✅ Success | 201 |
| Tenant admin creates user | ✅ Success | 201 |
| Tenant admin creates super_admin | ❌ Forbidden | 403 |
| Tenant admin creates tenant_admin | ❌ Forbidden | 403 |
| Super admin creates super_admin | ✅ Success | 201 |
| Tenant admin lists users | ✅ Tenant scoped | 200 |
| Super admin lists users | ✅ All tenants | 200 |
| User creates user | ❌ Forbidden | 403 |
| User views own profile | ✅ Success | 200 |
| Tenant admin accesses tenants | ❌ Forbidden | 403 |

---

## Troubleshooting

### 401 Unauthorized
- Check that Authorization header format is: `JWT <token>`
- Verify token is not expired
- Confirm user is authenticated

### 403 Forbidden
- Verify user role has permission for the action
- Check tenant scoping for tenant_admin
- Confirm role hierarchy rules

### 400 Bad Request
- Check for duplicate username/email
- Verify all required fields are present
- Validate field formats (email, password strength)

### 404 Not Found
- Verify endpoint URL is correct
- Check that resource exists
- Confirm tenant_id scoping
