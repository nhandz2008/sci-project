# SCI Backend API — Integration Guide

---

## 1. Quick overview

- **Service name**: SCI Backend API
- **Purpose**: REST API for Science Competitions Insight (SCI) providing authentication, user management, and system endpoints.
- **Base URL (env)**
  - Production: `https://api.sci.example.com/api/v1` (TBA)
  - Staging: `https://staging.api.sci.example.com/api/v1` (TBA)
  - Local: `http://localhost:8000/api/v1`
- **OpenAPI / Swagger UI**: `{BASE_URL}/docs` (e.g., `http://localhost:8000/api/v1/docs`)

---

## 2. Auth & headers (global)

- **Auth method**: Bearer JWT access token in `Authorization` header
  ```http
  Authorization: Bearer <access_token>
  ```
- **Common headers**
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `X-Request-ID: <uuid>` — optional but recommended for tracing
- **CORS**: Allow-list configured via server settings (defaults include `http://localhost:3000`)
- **Cookies/CSRF**: Not used (token-based auth)

---

## 3. Conventions (global)

- **URL versioning**: `/api/v1/...`
- **Date/time format**: ISO 8601 in UTC (e.g. `2025-08-08T14:30:00+00:00`)
- **IDs**: UUID v4 (string)
- **Pagination**: `skip` (offset) and `limit` (page size). Defaults vary per endpoint; max `limit` for users is `1000`.
- **Filtering & search**: query params (e.g., `?role=CREATOR&is_active=true&search=alice`)
- **Response envelope**: Plain JSON objects (no extra wrappers)
- **Content types**: JSON for all endpoints in Phases 1–2
- **Rate limits**: Not enforced (as of Phases 1–2)

---

## 4. Error handling & status codes

### Standard HTTP status codes
- `200 OK`, `201 Created`, `204 No Content`
- `400 Bad Request` — validation or malformed request
- `401 Unauthorized` — missing/invalid/expired token
- `403 Forbidden` — insufficient permissions
- `404 Not Found`
- `409 Conflict` — duplicate resource
- `422 Unprocessable Entity` — request validation errors
- `500 Internal Server Error`

### Error response formats
- Validation errors (Pydantic/RequestValidationError):
  ```json
  {
    "error": {
      "type": "validation_error",
      "message": "Validation failed",
      "code": "VAL_001",
      "details": "Input validation failed. See field_errors for details.",
      "field_errors": { "field": "reason" }
    }
  }
  ```
- Custom application errors (raised via SCI exceptions):
  ```json
  {
    "error": {
      "type": "authentication_error",
      "message": "Inactive user",
      "code": "AUTH_005",
      "details": "User account has been deactivated"
    }
  }
  ```
- HTTP exceptions (FastAPI `HTTPException`):
  ```json
  { "detail": "Incorrect email or password" }
  ```

---

## 5. Pagination (example)

Users list (admin-only):
```json
{
  "users": [
    { "id": "uuid", "email": "...", "full_name": "...", "organization": "...", "role": "CREATOR", "is_active": true, "created_at": "..." }
  ],
  "total": 123,
  "skip": 0,
  "limit": 100
}
```

---

## 6. File uploads

Not implemented in Phases 1–2.

---

## 7. WebSockets / realtime

Not applicable in Phases 1–2.

---

## 8. Endpoints (implemented in Phases 1–2)

Base prefix for all endpoints below: `/api/v1`

### System

#### GET `/health`
- Purpose: Basic liveness probe
- Auth: No
- Response: `{ "status": "healthy" }`

#### GET `/api/v1/health`
- Purpose: API health probe with version
- Auth: No
- Response: `{ "status": "healthy", "version": "1.0.0" }`

---

### Authentication

#### POST `/auth/signup`
- Purpose: Register a new user
- Auth: No
- Body
  ```json
  {
    "email": "user@example.com",
    "full_name": "User Name",
    "organization": "Org",
    "phone_number": "+1234567890",
    "password": "StrongPass123"
  }
  ```
- Validation
  - `email`: valid email
  - `password`: ≥ 8 chars, must include at least one uppercase, one lowercase, and one digit
  - `phone_number`: matches `^\+?[1-9]\d{1,19}$`
- Success `200 OK` → User (see UserResponse)
- Errors: `400` duplicate email; `422` validation

#### POST `/auth/login`
- Purpose: Obtain JWT access token
- Auth: No
- Body
  ```json
  { "email": "user@example.com", "password": "StrongPass123" }
  ```
- Success `200 OK`
  ```json
  {
    "access_token": "<jwt>",
    "token_type": "bearer",
    "user": { /* UserResponse */ }
  }
  ```
- Errors: `401` invalid credentials

#### POST `/auth/forgot-password`
- Purpose: Initiate password reset (stateless response)
- Auth: No
- Body
  ```json
  { "email": "user@example.com" }
  ```
- Success `200 OK`
  ```json
  { "message": "If the email exists, a password reset link has been sent" }
  ```
- Notes: Email token is generated server-side; currently logged for development.

#### POST `/auth/reset-password`
- Purpose: Reset password using token
- Auth: No
- Body
  ```json
  { "token": "<reset_token>", "new_password": "NewPass123" }
  ```
- Validation: same password strength rules as signup
- Success `200 OK`
  ```json
  { "message": "Password has been reset successfully" }
  ```
- Errors: `400` invalid/expired token or user not found/inactive; `422` weak password

#### GET `/auth/me`
- Purpose: Get current authenticated user (shortcut)
- Auth: Yes
- Success `200 OK` → User (UserResponse)
- Errors: `401/403` invalid/missing token

---

### Users

All endpoints below are under `/users`.

#### GET `/users/me`
- Purpose: Get current user profile
- Auth: Yes (active user)
- Success `200 OK` → `UserDetailResponse`

#### PUT `/users/me`
- Purpose: Update current user profile
- Auth: Yes (active user)
- Body (any subset)
  ```json
  { "full_name": "Updated Name", "organization": "Updated Org", "phone_number": "+1987654321" }
  ```
- Success `200 OK` → `UserDetailResponse`
- Errors: `422` validation

#### PUT `/users/me/password`
- Purpose: Change current user password
- Auth: Yes (active user)
- Body
  ```json
  { "current_password": "OldPass123", "new_password": "NewPass123" }
  ```
- Success `200 OK`
  ```json
  { "message": "Password changed successfully" }
  ```
- Errors: `400` wrong current password; `422` weak new password

#### GET `/users`
- Purpose: List users with pagination/filters (admin-only)
- Auth: Yes (admin)
- Query params
  - `skip`: int ≥ 0 (default `0`)
  - `limit`: int 1–1000 (default `100`)
  - `role`: `ADMIN` | `CREATOR` (optional)
  - `is_active`: `true` | `false` (optional)
  - `search`: string (matches name/email, case-insensitive) (optional)
- Success `200 OK` → `UserListPaginatedResponse`
- Errors: `403` insufficient permissions

#### DELETE `/users/{user_id}`
- Purpose: Delete user by ID (admin-only)
- Auth: Yes (admin)
- Notes: Admin cannot delete self
- Success `200 OK`
  ```json
  { "message": "User deleted successfully" }
  ```
- Errors: `400` invalid UUID or deleting self; `404` not found; `500` on delete failure

#### PUT `/users/{user_id}/deactivate`
- Purpose: Deactivate user (admin-only)
- Auth: Yes (admin)
- Notes: Admin cannot deactivate self
- Success `200 OK`
  ```json
  { "message": "User deactivated successfully" }
  ```

#### PUT `/users/{user_id}/activate`
- Purpose: Activate user (admin-only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "User activated successfully" }
  ```

#### PUT `/users/{user_id}/role?new_role=ADMIN|CREATOR`
- Purpose: Change user role (admin-only)
- Auth: Yes (admin)
- Notes: Admin cannot change their own role
- Success `200 OK`
  ```json
  { "message": "User role changed to ADMIN successfully" }
  ```

---

## 9. Schemas (selected)

### UserRole
```json
"ADMIN" | "CREATOR"
```

### UserResponse
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "User Name",
  "organization": "Org",
  "phone_number": "+1234567890",
  "role": "CREATOR",
  "is_active": true,
  "created_at": "2025-08-08T14:30:00+00:00",
  "updated_at": "2025-08-08T15:00:00+00:00"
}
```

### UserDetailResponse
Same fields as `UserResponse`.

### UserListResponse
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "User Name",
  "organization": "Org",
  "role": "CREATOR",
  "is_active": true,
  "created_at": "2025-08-08T14:30:00+00:00"
}
```

### UserListPaginatedResponse
```json
{
  "users": [ /* array of UserListResponse */ ],
  "total": 123,
  "skip": 0,
  "limit": 100
}
```

### TokenResponse
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { /* UserResponse */ }
}
```

### MessageResponse
```json
{ "message": "..." }
```

---

## 10. Examples

### Curl — Login and call protected endpoint
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123"}' \
  | jq -r .access_token)

# Get current user
curl -s http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript — Fetch with Authorization
```js
const res = await fetch("http://localhost:8000/api/v1/users?limit=10", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
```

---

## 11. Integration checklist

- [ ] Base URL and environment variables set
- [ ] Store and send access token in `Authorization: Bearer <token>`
- [ ] Set headers: `Content-Type`, `Accept`, optional `X-Request-ID`
- [ ] Encode path and query params properly
- [ ] Validate request body client-side where possible
- [ ] Handle success and error formats (both `{detail}` and `{error:{...}}`)
- [ ] Respect pagination (`skip`, `limit`) and filters
- [ ] Log out/refresh on `401` (re-login when token expires)

---

## 12. Notes & limits (current phases)

- Access token expiry defaults to `settings.ACCESS_TOKEN_EXPIRE_MINUTES` (currently 1440 minutes). Refresh token helpers exist but are not exposed via endpoints yet.
- Password strength required on signup/reset/change: ≥ 8 chars, with upper/lowercase and digit.
- Search in users list is case-insensitive (SQLite vs PostgreSQL handled in backend).
- CORS allow-list is configurable; ensure your frontend origin is whitelisted. 