# SCI Backend API — Integration Guide

---

## 1. Quick overview

- **Service name**: SCI Backend API
- **Purpose**: REST API for Science Competitions Insight (SCI) providing authentication, user management, competition management, and content moderation.
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
- **Pagination**: `skip` (offset) and `limit` (page size). Defaults vary per endpoint; max `limit` is `1000`.
- **Filtering & search**: query params (e.g., `?role=CREATOR&is_active=true&search=alice`)
- **Response envelope**: Plain JSON objects (no extra wrappers)
- **Content types**: JSON for all endpoints
- **Rate limits**: Not enforced (as of current implementation)

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

#### 1. Validation errors (Pydantic/RequestValidationError)
```json
{
  "error": {
    "type": "validation_error",
    "message": "Validation failed",
    "code": "VAL_001",
    "details": "Input validation failed. See field_errors for details.",
    "field_errors": {
      "email": "value is not a valid email address",
      "password": "ensure this value has at least 8 characters",
      "phone_number": "string does not match pattern '^\\+?[1-9]\\d{1,19}$'"
    }
  }
}
```

#### 2. Custom application errors (SCI exceptions)
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

#### 3. HTTP exceptions (FastAPI `HTTPException`)
```json
{ "detail": "Incorrect email or password" }
```

### Common error codes

#### Authentication errors (AUTH_*)
- `AUTH_001` - Authentication failed
- `AUTH_002` - Authorization failed
- `AUTH_003` - Could not validate credentials (invalid/expired token)
- `AUTH_004` - Invalid token format
- `AUTH_005` - Inactive user
- `AUTH_006` - Not enough permissions (admin role required)

#### User errors (USER_*)
- `USER_001` - User not found
- `USER_002` - User already exists
- `USER_003` - User associated with token no longer exists
- `USER_004` - User with this email already exists
- `USER_005` - User not found (for deletion)
- `USER_006` - User not found (for deactivation)
- `USER_007` - User not found (for activation)
- `USER_008` - User not found (for role change)

#### Competition errors (COMP_*)
- `COMP_001` - Competition not found

#### Permission errors (PERM_*)
- `PERM_001` - Permission denied

#### Validation errors (VAL_*)
- `VAL_001` - Validation failed

#### Database errors (DB_*)
- `DB_001` - Database operation failed
- `DB_002` - Failed to create user
- `DB_003` - Failed to retrieve user by email
- `DB_004` - Failed to retrieve user by ID
- `DB_005` - Failed to update user
- `DB_006` - Failed to update user password
- `DB_007` - Failed to authenticate user
- `DB_008` - Failed to retrieve users
- `DB_009` - Failed to delete user
- `DB_010` - Failed to deactivate user
- `DB_011` - Failed to activate user
- `DB_012` - Failed to change user role

### Common error scenarios

#### Authentication failures
```json
// Missing token
{ "detail": "Not authenticated" }

// Invalid token
{
  "error": {
    "type": "authentication_error",
    "message": "Could not validate credentials",
    "code": "AUTH_003",
    "details": "Invalid or expired token"
  }
}

// Inactive user
{
  "error": {
    "type": "authentication_error",
    "message": "Inactive user",
    "code": "AUTH_005",
    "details": "User account has been deactivated"
  }
}
```

#### Authorization failures
```json
// Insufficient permissions
{
  "error": {
    "type": "authorization_error",
    "message": "Not enough permissions",
    "code": "AUTH_006",
    "details": "Admin role required for this operation"
  }
}

// Permission denied for competition
{
  "error": {
    "type": "permission_error",
    "message": "Permission denied",
    "code": "PERM_001",
    "details": "Not enough permissions to modify this competition"
  }
}
```

#### Validation failures
```json
// Password strength
{
  "error": {
    "type": "validation_error",
    "message": "Validation failed",
    "code": "VAL_001",
    "details": "Input validation failed. See field_errors for details.",
    "field_errors": {
      "password": "Password must contain at least one uppercase letter"
    }
  }
}

// Competition validation
{
  "error": {
    "type": "validation_error",
    "message": "Validation failed",
    "code": "VAL_001",
    "details": "Input validation failed. See field_errors for details.",
    "field_errors": {
      "registration_deadline": "Registration deadline must be in the future",
      "target_age_max": "Maximum age must be greater than minimum age",
      "competition_link": "URL must start with http:// or https://"
    }
  }
}
```

#### Resource not found
```json
// User not found
{ "detail": "User not found" }

// Competition not found
{ "detail": "Competition not found" }

// Competition not approved (public endpoints)
{ "detail": "Competition not found" }
```

#### Business logic errors
```json
// Duplicate user
{ "detail": "User with this email already exists" }

// Cannot delete self
{ "detail": "Cannot delete your own account" }

// Cannot change own role
{ "detail": "Cannot change your own role" }
```

---

## 5. Pagination (example)

Competitions list:
```json
{
  "competitions": [
    { "id": "uuid", "title": "...", "introduction": "...", "location": "...", "format": "ONLINE", "scale": "INTERNATIONAL", "registration_deadline": "...", "is_featured": true, "is_approved": true, "created_at": "..." }
  ],
  "total": 123,
  "skip": 0,
  "limit": 100
}
```

---

## 6. File uploads

Not implemented in current version.

---

## 7. WebSockets / realtime

Not applicable in current version.

---

## 8. Endpoints (implemented)

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
- Errors: `401/403` invalid/missing token

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
- Errors: `400` invalid UUID format or deactivating self; `404` not found; `500` on failure

#### PUT `/users/{user_id}/activate`
- Purpose: Activate user (admin-only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "User activated successfully" }
  ```
- Errors: `400` invalid UUID format; `404` not found; `500` on failure

#### PUT `/users/{user_id}/role?new_role=ADMIN|CREATOR`
- Purpose: Change user role (admin-only)
- Auth: Yes (admin)
- Notes: Admin cannot change their own role
- Success `200 OK`
  ```json
  { "message": "User role changed to ADMIN successfully" }
  ```
- Errors: `400` invalid UUID format or changing own role; `404` not found; `500` on failure

---

### Competitions

All endpoints below are under `/competitions`.

#### GET `/competitions`
- Purpose: List competitions with pagination/filters (public - only approved competitions)
- Auth: No
- Query params
  - `skip`: int ≥ 0 (default `0`)
  - `limit`: int 1–1000 (default `100`)
  - `format`: `ONLINE` | `OFFLINE` | `HYBRID` (optional)
  - `scale`: `PROVINCIAL` | `REGIONAL` | `INTERNATIONAL` (optional)
  - `location`: string (optional)
  - `search`: string (matches title and introduction, case-insensitive) (optional)
  - `sort_by`: `created_at` | `registration_deadline` | `title` (optional)
  - `order`: `asc` | `desc` (optional)
- Success `200 OK` → `CompetitionListPaginatedResponse`
- Notes: Only returns approved competitions

#### GET `/competitions/featured`
- Purpose: List featured competitions (approved + featured)
- Auth: No
- Query params
  - `skip`: int ≥ 0 (default `0`)
  - `limit`: int 1–1000 (default `10`)
  - `sort_by`: `created_at` | `registration_deadline` | `title` (optional)
  - `order`: `asc` | `desc` (optional)
- Success `200 OK` → `CompetitionListPaginatedResponse`

#### GET `/competitions/{competition_id}`
- Purpose: Get competition details by ID (public - only approved competitions)
- Auth: No
- Success `200 OK` → `CompetitionResponse`
- Errors: `400` invalid ID format; `404` not found or not approved

#### POST `/competitions`
- Purpose: Create a new competition (authenticated users only)
- Auth: Yes (active user)
- Body: `CompetitionCreate` schema
  ```json
  {
    "title": "Competition Title",
    "introduction": "Competition description",
    "overview": "Comprehensive overview of the competition",
    "question_type": "Multiple choice",
    "selection_process": "Online test",
    "history": "Established in 2020",
    "scoring_and_format": "100 points total",
    "awards": "Gold, Silver, Bronze medals",
    "penalties_and_bans": "No cheating allowed",
    "notable_achievements": "Winners from top universities",
    "competition_link": "https://example.com",
    "background_image_url": "https://example.com/image.jpg",
    "detail_image_urls": ["https://example.com/detail1.jpg"],
    "location": "Online",
    "format": "ONLINE",
    "scale": "INTERNATIONAL",
    "registration_deadline": "2025-12-31T23:59:59Z",
    "size": 1000,
    "target_age_min": 16,
    "target_age_max": 25
  }
  ```
- Validation
  - `registration_deadline` must be in the future
  - `target_age_max > target_age_min` when both provided
  - URLs must start with http:// or https://
  - `overview` field is optional, max length 2000 characters
- Success `200 OK` → `CompetitionResponse`
- Notes: Creates competition with `is_approved=False` by default

#### PUT `/competitions/{competition_id}`
- Purpose: Update competition by ID (owner/admin only)
- Auth: Yes (active user)
- Body: `CompetitionUpdate` schema (any subset of fields)
- Success `200 OK` → `CompetitionResponse`
- Errors: `400` invalid ID format; `403` insufficient permissions; `404` not found; `422` validation errors

#### DELETE `/competitions/{competition_id}`
- Purpose: Delete competition by ID (owner/admin only)
- Auth: Yes (active user)
- Success `200 OK`
  ```json
  { "message": "Competition deleted successfully" }
  ```
- Errors: `400` invalid ID format; `403` insufficient permissions; `404` not found; `500` on failure

#### GET `/competitions/my/competitions`
- Purpose: Get current user's competitions
- Auth: Yes (active user)
- Query params
  - `skip`: int ≥ 0 (default `0`)
  - `limit`: int 1–1000 (default `100`)
- Success `200 OK` → `CompetitionListPaginatedResponse`
- Notes: Shows user's own competitions regardless of approval status

---

### Admin

All endpoints below are under `/admin`.

#### GET `/admin/competitions/pending`
- Purpose: Get pending competitions for moderation (admin only)
- Auth: Yes (admin)
- Query params
  - `skip`: int ≥ 0 (default `0`)
  - `limit`: int 1–1000 (default `100`)
- Success `200 OK` → `CompetitionModerationListResponse`
- Notes: Returns competitions with `is_approved=False`

#### PUT `/admin/competitions/{competition_id}/approve`
- Purpose: Approve competition by ID (admin only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "Competition approved successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

#### PUT `/admin/competitions/{competition_id}/reject`
- Purpose: Reject competition by ID (admin only)
- Auth: Yes (admin)
- Body
  ```json
  { "rejection_reason": "Optional reason for rejection" }
  ```
- Success `200 OK`
  ```json
  { "message": "Competition rejected successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

#### PUT `/admin/competitions/{competition_id}/feature`
- Purpose: Feature competition by ID (admin only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "Competition featured successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

#### PUT `/admin/competitions/{competition_id}/unfeature`
- Purpose: Unfeature competition by ID (admin only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "Competition unfeatured successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

#### PUT `/admin/competitions/{competition_id}/activate`
- Purpose: Activate competition by ID (admin only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "Competition activated successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

#### PUT `/admin/competitions/{competition_id}/deactivate`
- Purpose: Deactivate competition by ID (admin only)
- Auth: Yes (admin)
- Success `200 OK`
  ```json
  { "message": "Competition deactivated successfully" }
  ```
- Errors: `400` invalid ID format; `404` not found

---

## 9. Schemas (selected)

### UserRole
```json
"ADMIN" | "CREATOR"
```

### CompetitionFormat
```json
"ONLINE" | "OFFLINE" | "HYBRID"
```

### CompetitionScale
```json
"PROVINCIAL" | "REGIONAL" | "INTERNATIONAL"
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

### CompetitionResponse
```json
{
  "id": "uuid",
  "title": "Competition Title",
  "introduction": "Description",
  "overview": "Comprehensive overview of the competition",
  "question_type": "Multiple choice",
  "selection_process": "Online test",
  "history": "Established in 2020",
  "scoring_and_format": "100 points total",
  "awards": "Gold, Silver, Bronze medals",
  "penalties_and_bans": "No cheating allowed",
  "notable_achievements": "Winners from top universities",
  "competition_link": "https://example.com",
  "background_image_url": "https://example.com/image.jpg",
  "detail_image_urls": ["https://example.com/detail1.jpg"],
  "location": "Online",
  "format": "ONLINE",
  "scale": "INTERNATIONAL",
  "registration_deadline": "2025-12-31T23:59:59Z",
  "size": 1000,
  "target_age_min": 16,
  "target_age_max": 25,
  "is_active": true,
  "is_featured": false,
  "is_approved": true,
  "owner_id": "uuid",
  "created_at": "2025-08-08T14:30:00+00:00",
  "updated_at": "2025-08-08T15:00:00+00:00"
}
```

### CompetitionListResponse
```json
{
  "id": "uuid",
  "title": "Competition Title",
  "introduction": "Description",
  "overview": "Comprehensive overview of the competition",
  "background_image_url": "https://example.com/image.jpg",
  "location": "Online",
  "format": "ONLINE",
  "scale": "INTERNATIONAL",
  "registration_deadline": "2025-12-31T23:59:59Z",
  "size": 1000,
  "target_age_min": 16,
  "target_age_max": 25,
  "is_featured": false,
  "is_approved": true,
  "owner_id": "uuid",
  "created_at": "2025-08-08T14:30:00+00:00"
}
```

### CompetitionListPaginatedResponse
```json
{
  "competitions": [ /* array of CompetitionListResponse */ ],
  "total": 123,
  "skip": 0,
  "limit": 100
}
```

### CompetitionModerationResponse
```json
{
  "id": "uuid",
  "title": "Competition Title",
  "introduction": "Description",
  "overview": "Comprehensive overview of the competition",
  "owner_id": "uuid",
  "created_at": "2025-08-08T14:30:00+00:00",
  "is_approved": false
}
```

### CompetitionModerationListResponse
```json
{
  "competitions": [ /* array of CompetitionModerationResponse */ ],
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
const res = await fetch("http://localhost:8000/api/v1/competitions?limit=10", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
```

### Create a competition
```js
const competitionData = {
  title: "International Science Olympiad",
  introduction: "A prestigious international science competition",
  overview: "This comprehensive competition brings together the brightest young minds from around the world to compete in rigorous scientific challenges across multiple disciplines including physics, chemistry, biology, and mathematics.",
  format: "ONLINE",
  scale: "INTERNATIONAL",
  registration_deadline: "2025-12-31T23:59:59Z",
  competition_link: "https://example.com/olympiad"
};

const res = await fetch("http://localhost:8000/api/v1/competitions", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(competitionData)
});

// Handle response
if (!res.ok) {
  const errorData = await res.json();
  if (errorData.error?.type === "validation_error") {
    // Handle validation errors
    console.error("Validation errors:", errorData.error.field_errors);
  } else {
    console.error("Error:", errorData.detail || errorData.error?.message);
  }
}
```

### Update a competition with overview
```js
const updateData = {
  title: "Updated Competition Title",
  overview: "Updated comprehensive overview with more detailed information about the competition's scope and significance.",
  introduction: "Updated introduction"
};

const res = await fetch(`http://localhost:8000/api/v1/competitions/${competitionId}`, {
  method: "PUT",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(updateData)
});

if (res.ok) {
  const updatedCompetition = await res.json();
  console.log("Updated overview:", updatedCompetition.overview);
}
```

### Error handling example
```js
async function handleApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle different error types
      if (errorData.error) {
        switch (errorData.error.code) {
          case "AUTH_003":
          case "AUTH_005":
            // Token expired or user inactive - redirect to login
            window.location.href = "/login";
            break;
          case "AUTH_006":
            // Insufficient permissions
            showError("You don't have permission to perform this action");
            break;
          case "VAL_001":
            // Validation errors
            showValidationErrors(errorData.error.field_errors);
            break;
          default:
            showError(errorData.error.message);
        }
      } else {
        // Simple HTTP exception
        showError(errorData.detail);
      }
      
      throw new Error(errorData.error?.message || errorData.detail);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      // Network error
      showError("Network error. Please check your connection.");
    } else {
      // Re-throw API errors
      throw error;
    }
  }
}
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
- [ ] Handle competition approval workflow (creators submit, admins approve)
- [ ] Implement featured competitions display
- [ ] Handle user role-based permissions (ADMIN vs CREATOR)
- [ ] Handle overview field in competitions (optional, max 2000 chars)
- [ ] Implement comprehensive error handling:
  - [ ] Handle authentication errors (AUTH_* codes)
  - [ ] Handle authorization errors (AUTH_006, PERM_001)
  - [ ] Handle validation errors with field_errors
  - [ ] Handle resource not found errors (404)
  - [ ] Handle business logic errors (duplicate users, self-deletion, etc.)
  - [ ] Handle database errors (DB_* codes)
  - [ ] Provide user-friendly error messages
  - [ ] Log errors for debugging
- [ ] Implement proper error recovery:
  - [ ] Retry failed requests with exponential backoff
  - [ ] Show appropriate loading states during requests
  - [ ] Handle network connectivity issues
  - [ ] Provide offline feedback when possible

---

## 12. Overview Field

The competition system includes an optional `overview` field that provides comprehensive information about each competition:

### Overview Field Characteristics
- **Type**: `string | None` (optional field)
- **Max Length**: 2000 characters
- **Purpose**: Provides detailed, comprehensive information about the competition
- **Usage**: Complements the `introduction` field with more extensive descriptions

### Overview Field in API Responses
- **CompetitionResponse**: Includes overview in detailed competition responses
- **CompetitionListResponse**: Includes overview in list responses
- **CompetitionCreate**: Optional field for competition creation
- **CompetitionUpdate**: Optional field for competition updates

### Overview Field Validation
- **Optional**: Can be omitted during creation/update
- **Length Limit**: Maximum 2000 characters
- **Content**: Can contain any text content describing the competition
- **Null Handling**: Can be set to `null` to clear the field

### Example Overview Content
```json
{
  "overview": "The International Science Olympiad brings together the brightest young minds from around the world to compete in rigorous scientific challenges. Participants demonstrate their knowledge across multiple disciplines including physics, chemistry, biology, and mathematics. The competition features both theoretical and practical components, with emphasis on innovative problem-solving and real-world applications of scientific principles."
}
```

## 13. Notes & limits (current implementation)

- Access token expiry defaults to `settings.ACCESS_TOKEN_EXPIRE_MINUTES` (currently 1440 minutes).
- Password strength required on signup/reset/change: ≥ 8 chars, with upper/lowercase and digit.
- Search in competitions list is case-insensitive (PostgreSQL ILIKE).
- Competition creation defaults to `is_approved=False` and requires admin approval.
- Public endpoints only show approved competitions (`is_approved=True`).
- Featured competitions are approved competitions with `is_featured=True`.
- CORS allow-list is configurable; ensure your frontend origin is whitelisted.
- File upload functionality is not yet implemented.
- Recommendation system is not yet implemented.

## 14. Testing Coverage

The competition management system includes comprehensive test coverage:

### CRUD Tests (`test_crud_competition.py`)
- ✅ Basic CRUD operations (create, read, update, delete)
- ✅ Advanced query operations (filtering, pagination, sorting)
- ✅ Moderation workflows (approve, reject, feature, activate)
- ✅ Permission checks (owner vs admin access)
- ✅ Overview field integration (creation, retrieval, updates)

### Route Tests (`test_competitions.py`)
- ✅ Public endpoints (listing, detail, featured)
- ✅ Creator workflows (create, update, delete own competitions)
- ✅ Admin workflows (moderation, featuring, activation)
- ✅ Validation error handling
- ✅ Permission boundary testing
- ✅ Overview field in API responses

### Schema Tests (`test_schemas.py`)
- ✅ Competition creation validation
- ✅ Competition update validation
- ✅ Response serialization
- ✅ Filter parameter validation
- ✅ Overview field validation (optional, max length 2000)
- ✅ Edge cases and error scenarios

### Test Coverage Areas
- **Database Operations**: All CRUD operations with filtering, search, pagination
- **API Endpoints**: All public, creator, and admin endpoints
- **Schema Validation**: All request/response schemas with validation rules
- **Security**: Permission checks, authentication requirements
- **Overview Field**: Complete integration testing for the new overview field 