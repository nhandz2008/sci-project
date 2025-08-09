# SCI Backend Development Plan

This document provides a high-level, sequential plan for developing the backend of the Science Competitions Insight (SCI) project. Follow these steps in order to ensure a smooth, dependency-free development process from the current setup to a fully functional, well-tested backend.

---

## Phase 1: Foundation & Project Structure

1. **Review and Finalize Project Structure** ✅
   - ✅ Audit the backend directory for required folders and files.
   - ✅ Align structure with best practices (see SCI_PROJECT_CONTEXT.md).
   - ✅ Remove or reorganize any legacy or unnecessary files.
   - ✅ Ensure Docker, environment, and dependency setup is complete.

2. **Configure Database** ✅
   - ✅ Double-check `.env` for correct PostgreSQL settings.
   - ✅ Test database connectivity using a simple script or CLI tool.
   - ✅ Set up Alembic for migrations if not already done.

3. **Implement Base Models** ✅
   - ✅ Define `User` and `Competition` models in the models directory.
   - ✅ Establish relationships (User has many Competitions).
   - ✅ Create and run initial Alembic migration to generate tables.
   - ✅ Verify tables are created in the database.

4. **Set Up Core Utilities** ✅
   - ✅ Implement database session management (dependency injection).
   - ✅ Add password hashing and JWT utility functions.
   - ✅ Configure CORS and environment-based settings in FastAPI.
   - ✅ Test that the app starts and connects to the database without errors.

**Phase 1 Status: COMPLETED** ✅

---

## Phase 2: Authentication & User Management

1. **Implement Authentication System** ✅
   - ✅ Set up OAuth2 password flow with FastAPI dependencies.
   - ✅ Implement JWT token creation and validation logic.
   - ✅ Add endpoints for user registration, login, and password reset.
   - ✅ Secure endpoints with authentication dependencies.

2. **User Management Endpoints** ✅
   - ✅ Add endpoint for retrieving current user profile.
   - ✅ Implement endpoint for updating user profile and changing password.
   - ✅ Add admin-only endpoints for listing and deleting users.
   - ✅ Enforce role-based access control (CREATOR, ADMIN) on endpoints.
   - ✅ Use Pydantic models for all request/response validation.

3. **Testing Authentication & User Management** ✅
   - ✅ Write unit tests for authentication logic (token creation, password hashing).
   - ✅ Write integration tests for all user-related endpoints.
   - ✅ Test edge cases: invalid credentials, duplicate users, unauthorized access, etc.

**Phase 2 Status: COMPLETED** ✅

---

## Phase 3: Competition Management

1. CRUD Endpoints for Competitions ✅/➕
   - ✅ Public listing and detail (approved only):
     - `GET /competitions` with pagination, search, filters (format, scale, location)
     - `GET /competitions/{id}` returns details if `is_approved=True`
   - ✅ Authenticated creator/admin actions:
     - `POST /competitions` create competition (owner = current user; `is_approved=False` by default)
     - `PUT /competitions/{id}` update competition (owner/admin only)
     - `DELETE /competitions/{id}` delete competition (owner/admin only)
     - `GET /competitions/my/competitions` list current user's competitions
    - ✅ Enhancements implemented:
      - `GET /competitions/featured` to list featured, approved competitions
      - Sorting (`sort_by=created_at|registration_deadline|title`, `order=asc|desc`) in listing endpoints
      - Case-insensitive search and location filter implemented with Postgres ILIKE
      - Enforced max `limit` of 1000 via schemas

2. Content Moderation Workflow ✅/➕
   - ✅ Admin moderation endpoints:
     - `GET /admin/competitions/pending` — list pending (to be adjusted; see below)
     - `PUT /admin/competitions/{id}/approve`
     - `PUT /admin/competitions/{id}/reject`
    - ✅ Adjustments:
      - Pending definition updated: `get_pending_competitions` now uses `is_approved=False`
      - Ensure public endpoints only show `is_approved=True`; creators can view their own regardless of approval
    - ✅ Optional:
      - Moderation audit fields on `Competition` added and persisted by endpoints: `approved_by`, `approved_at`, `rejection_reason`

3. Schemas & Validation ✅/➕
   - ✅ Request models: `CompetitionCreate`, `CompetitionUpdate` with validators:
     - `registration_deadline` must be in the future
     - `target_age_max > target_age_min` when both provided
     - `detail_image_urls` handled as list in schema and stored as JSON string in model
   - ✅ Response models: `CompetitionResponse`, `CompetitionListResponse`, `CompetitionListPaginatedResponse`, moderation responses
    - ✅ Added sorting params on filters: `sort_by`, `order`
    - ✅ Strict URL validation for `competition_link`, image URLs

4. Permissions & Security ✅
   - Admin can modify/delete any competition
   - Owner can modify/delete only own competition (`can_modify_competition`, `can_delete_competition`)
   - Public can only see approved competitions; authenticated users see their own

5. Business Rules ✅/➕
   - ✅ Creation defaults: `is_active=True`, `is_featured=False`, `is_approved=False`
   - ✅ Update supports partial fields; image list merged via setter
    - ✅ Prevent updates that set past `registration_deadline`
    - ✅ Optional toggle endpoints (admin only): feature/unfeature, activate/deactivate

6. Testing Plan (to expand) ➕
    - Unit tests (CRUD):
     - Create/read/update/delete competition
     - Filters: `format`, `scale`, `location`, `is_approved`, `is_featured`, `owner_id`
      - Search behavior (case-insensitive with Postgres ILIKE)
     - Pagination and total counts
     - Permission checks for owner vs admin on update/delete
   - Route tests:
     - Public list shows only approved; detail returns 404 for unapproved
     - Creator create/update/delete and list their competitions
     - Admin can update/delete any; can approve/reject; pending list correctness
     - New: featured listing and sorting combinations
   - Moderation tests:
     - Approve/reject transitions; public visibility toggling
     - Optional audit fields (if implemented)
   - Edge cases:
     - Invalid UUIDs, empty/overlong titles, invalid URLs
     - Past `registration_deadline` on create/update (reject)
     - Large `detail_image_urls` arrays and JSON serialization

7. Implementation Tasks (ordered) ✅
   - [x] Update `get_pending_competitions` to treat `is_approved=False` as pending
   - [x] Add sorting params to `get_competitions` and surface in `/competitions`
   - [x] Add `GET /competitions/featured` (approved + featured)
   - [x] Strengthen URL validation for `competition_link` and images in schemas
   - [x] Enforce future `registration_deadline` in update path
   - [x] Optional: add `approved_by`, `approved_at`, `rejection_reason` fields; persist in moderation endpoints
   - [x] Optional admin endpoints: `PUT /admin/competitions/{id}/feature`, `PUT /admin/competitions/{id}/unfeature`
   - [x] Add comprehensive tests covering all above (see `backend/tests/test_competitions.py`)

**Phase 3 Status: COMPLETED** ✅

---

## Phase 4: File Upload & Media Management

1. **Integrate AWS S3 for Image Storage** ❌
   - ❌ Add S3 credentials and bucket info to `.env` and config.
   - ❌ Implement utility for uploading and deleting images from S3.
   - ❌ Add endpoints for image upload, deletion, and status checking.
   - ❌ Validate file type, size, and security on upload.
   - ❌ Link uploaded images to competitions in the database.

2. **Testing File Uploads** ❌
   - ❌ Write tests for image upload and deletion endpoints.
   - ❌ Test with valid and invalid file types/sizes.
   - ❌ Test error handling for failed uploads/deletions.

**Phase 4 Status: NOT STARTED** ❌

---

## Phase 5: Recommendations & Advanced Features

1. **Implement Recommendation Endpoint** ❌
   - ❌ Design input schema for recommendation requests.
   - ❌ Integrate with LLM API for generating recommendations.
   - ❌ Implement endpoint to receive user input and return recommended competitions.
   - ❌ Validate and sanitize all input data.

2. **Testing Recommendations** ❌
   - ❌ Write tests for recommendation endpoint and LLM integration.
   - ❌ Test with various user profiles and scenarios.
   - ❌ Handle and test LLM API errors gracefully.

**Phase 5 Status: NOT STARTED** ❌

---

## Phase 6: Admin & Analytics

1. **Admin Endpoints** ✅/➕
   - ✅ Implement endpoint to list pending competitions for review.
   - ✅ Add endpoints for approving/rejecting competitions.
   - ❌ Implement analytics endpoints (competition stats, user engagement, etc.).
   - ✅ Add endpoints for user management (list, delete, change role).

2. **Analytics & Monitoring** ❌
   - ❌ Integrate logging and error monitoring (e.g., Sentry).
   - ❌ Add endpoints for platform analytics and reporting.
   - ❌ Ensure analytics endpoints are admin-only.

3. **Testing Admin & Analytics** ✅/➕
   - ✅ Write tests for all admin endpoints.
   - ✅ Test permissions and data accuracy.
   - ❌ Simulate analytics/reporting scenarios in tests.

**Phase 6 Status: PARTIALLY COMPLETED** ⚠️

---

## Phase 7: System Endpoints & Finalization

1. **System Endpoints** ✅
   - ✅ Implement `/health` and `/info` endpoints.
   - ❌ Ensure OpenAPI docs are complete and accurate.
   - ❌ Add versioning and metadata to API responses.

2. **Comprehensive Testing** ✅/➕
   - ✅ Write end-to-end tests for all major user flows.
   - ✅ Test error handling, edge cases, and security vulnerabilities.
   - ✅ Run full test suite and fix any failing tests.

3. **Documentation & Cleanup** ❌
   - ❌ Update README and API documentation with usage examples.
   - ❌ Clean up codebase, remove unused files, and ensure consistency.
   - ❌ Review and refactor code for maintainability and clarity.

**Phase 7 Status: PARTIALLY COMPLETED** ⚠️

---

## Current Project Status Summary

### ✅ Completed Components:
- **Project Structure**: All core directories and files are properly organized
- **Database Configuration**: PostgreSQL connection is working, tables are created
- **Base Models**: User and Competition models with relationships are implemented
- **Core Utilities**: Database session management, security utilities, CORS configuration
- **Basic System Endpoints**: Health check endpoints are working
- **Authentication System**: JWT auth (access/refresh), password reset, token validation
- **API Routes**: Authentication, User Management, and Competition Management (public, creator, admin moderation, featured) implemented and secured
- **Competition Enhancements**: Sorting, case-insensitive search, filters, featured listing, moderation audit fields
- **Migrations**: Alembic configured with initial and follow-up migrations
- **Testing**: Comprehensive tests (auth, users, competitions) pass against Postgres test DB with Alembic-managed schema
- **Docker Setup**: Postgres service is running and healthy; backend connects via environment configuration

### ❌ Missing Components:
- **File Upload**: No S3 integration or upload endpoints
- **Recommendations**: Recommendation endpoint and LLM integration
- **Admin Analytics**: Analytics endpoints and reporting
- **Documentation**: API documentation and examples can be expanded

### 🔄 Next Steps:
1. **Phase 4**: Integrate file upload functionality
2. **Phase 5**: Implement recommendation system
3. **Phase 6**: Add admin and analytics endpoints
4. **Phase 7**: Complete testing and documentation

---

## Ongoing: Best Practices

- Use Pydantic models for all input/output validation.
- Write tests for every new feature and endpoint.
- Use async functions for all I/O-bound operations.
- Handle errors and edge cases early in each function.
- Keep code modular, DRY, and well-documented.
- Regularly review and update dependencies for security.

---

**Follow this plan step by step to build a robust, maintainable, and well-tested backend for the SCI project.** 