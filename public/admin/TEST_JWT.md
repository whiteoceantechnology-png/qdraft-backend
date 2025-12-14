# JWT Authentication Testing Guide

## Overview
The admin panel now uses JWT token authentication for all API requests.

## Authentication Flow

### 1. Login
```javascript
// User logs in with username and password
api.login(username, password)
```

**Backend Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "tenant_id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "tenant": {
    "tenant_id": 1,
    "tenant_name": "Default Tenant"
  }
}
```

### 2. Token Storage
- Token is stored in `localStorage.adminToken`
- User data is stored in `localStorage.adminUser`
- Client adds 'Bearer ' prefix when making requests

### 3. Authenticated Requests
All API requests automatically include the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Token Validation
- On app load, token is validated with `/api/auth/me`
- On 401 responses, token is cleared and user redirected to login
- Token remains valid until expiration or manual logout

## Testing Steps

### 1. Test Login
1. Open `/admin/` in browser
2. Enter credentials in login form
3. Check browser console for successful login
4. Verify token in `localStorage.adminToken`

### 2. Test Authenticated Requests
1. Navigate to any page (Users, Questions, etc.)
2. Open Network tab in DevTools
3. Verify all API requests include `Authorization: Bearer ...` header
4. Check responses are successful (200 status)

### 3. Test Token Expiration
1. Manually expire or remove token from localStorage
2. Refresh the page
3. Should be redirected to login

### 4. Test Logout
1. Click logout button
2. Verify token is cleared from localStorage
3. Verify redirected to login

## API Methods with JWT

All these methods now use JWT authentication:

**Dashboard:**
- `api.getDashboardStats()`

**Tenants:**
- `api.getTenants()`
- `api.createTenant(data)`
- `api.updateTenant(id, data)`
- `api.deleteTenant(id)`

**Users:**
- `api.getUsers()`
- `api.createUser(data)`
- `api.updateUser(id, data)`
- `api.deleteUser(id)`

**Questions:**
- `api.getQuestions()`
- `api.createQuestion(data)`
- `api.updateQuestion(id, data)`
- `api.deleteQuestion(id)`

**Chapters:**
- `api.getChapters()`
- `api.createChapter(data)`
- `api.updateChapter(id, data)`
- `api.deleteChapter(id)`

**Exams:**
- `api.getExams()`
- `api.createExam(data)`
- `api.updateExam(id, data)`
- `api.deleteExam(id)`

**Auth:**
- `api.getCurrentUser()`
- `api.changePassword(oldPassword, newPassword)`
- `api.refreshToken()`
- `api.logout()`

## Security Notes

1. **Token Format:** Backend expects `Bearer <token>` format (standard OAuth 2.0)
2. **Token Storage:** Uses localStorage (consider httpOnly cookies for production)
3. **Token Expiration:** Handled by backend JWT expiration time
4. **CORS:** Ensure CORS headers allow Authorization header
5. **HTTPS:** Use HTTPS in production to protect token in transit

## Troubleshooting

### Token Not Sent
- Check `localStorage.adminToken` exists
- Verify client adds 'Bearer ' prefix before sending
- Check browser console for errors

### 401 Unauthorized
- Token may be expired
- Token format may be incorrect (must be 'Bearer <token>')
- User may be deactivated
- Tenant may be inactive

### Token Not Persisting
- Check localStorage is enabled in browser
- Verify domain/origin matches
- Check for privacy/incognito mode restrictions
