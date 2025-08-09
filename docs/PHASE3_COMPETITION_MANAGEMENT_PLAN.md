# Phase 3: Competition Management — Detailed Implementation Plan

This document outlines the detailed steps for implementing and finalizing competition management in the SCI backend. Follow these steps in order to ensure proper implementation without dependency issues.

---

## Step 1: Define Schemas (Pydantic)

### 1.1 Create/Verify Competition Schemas
- File: `app/schemas/competition.py`
- Ensure the following models exist and are correct:
  - `CompetitionCreate`
  - `CompetitionUpdate`
  - `CompetitionResponse`
  - `CompetitionListResponse`
  - `CompetitionListPaginatedResponse`
  - `CompetitionModerationResponse`
  - `CompetitionModerationListResponse`
- Validation rules:
  - `registration_deadline` must be in the future
  - `target_age_max > target_age_min` when both provided
  - `detail_image_urls`: list[str] (serialize to JSON string in model layer)
- Enhancements status:
  - ✅ Sorting params added to filter params: `sort_by`, `order`
  - ✅ URL format checks for `competition_link`, `background_image_url`, `detail_image_urls`

---

## Step 2: Implement CRUD Utilities

### 2.1 CRUD Functions
- File: `app/crud/competition.py`
- Ensure the following functions exist and are correct:
  - `create_competition(session, competition_create, owner_id)`
  - `get_competition_by_id(session, competition_id)`
  - `get_competitions(session, skip, limit, format, scale, location, is_approved, is_featured, search, owner_id)`
  - `update_competition(session, competition, competition_update)`
  - `delete_competition(session, competition_id)`
  - Permission helpers: `can_modify_competition(user, competition)`, `can_delete_competition(user, competition)`
- Moderation helpers:
  - `get_pending_competitions(session, skip, limit)` — Update logic to treat `is_approved=False` as pending (currently checks `IS NULL`)
  - `approve_competition(session, competition_id)` sets `is_approved=True`
  - `reject_competition(session, competition_id)` sets `is_approved=False`
- Optional helpers:
  - `get_featured_competitions(session, skip, limit)` — `is_featured=True` & `is_approved=True`
  - `get_approved_competitions(session, skip, limit)` — `is_approved=True`

### 2.2 Sorting & Case-insensitive Search
- ✅ `get_competitions` supports `sort_by`, `order`
- ✅ Case-insensitive search compatible with SQLite/Postgres using `func.lower(...).like('%term%')`

---

## Step 3: Public Competition Routes

### 3.1 List & Details (Public)
- File: `app/api/routes/competitions.py`
- Endpoints:
  - `GET /competitions`: list approved competitions only with pagination, filters, search
  - `GET /competitions/{id}`: show details only if `is_approved=True`
- Enhancements:
  - ✅ Sorting support added (`sort_by`, `order`)
  - ✅ `GET /competitions/featured` implemented

---

## Step 4: Creator/Admin Competition Routes

### 4.1 Creator (Authenticated Active User)
- Endpoints:
  - `POST /competitions`: create competition (defaults: `is_active=True`, `is_featured=False`, `is_approved=False`)
  - `PUT /competitions/{id}`: update if owner or admin
  - `DELETE /competitions/{id}`: delete if owner or admin
  - `GET /competitions/my/competitions`: list own competitions

### 4.2 Admin Actions (Moderation)
- File: `app/api/routes/admin.py`
- Endpoints:
  - `GET /admin/competitions/pending`: list pending — adjust to match pending definition (`is_approved=False`)
  - `PUT /admin/competitions/{id}/approve`
  - `PUT /admin/competitions/{id}/reject` (accepts `rejection_reason`)
- Optional admin endpoints:
  - `PUT /admin/competitions/{id}/feature`
  - `PUT /admin/competitions/{id}/unfeature`
  - `PUT /admin/competitions/{id}/activate`
  - `PUT /admin/competitions/{id}/deactivate`

Status:
- ✅ Pending definition updated (`is_approved=False`)
- ✅ Approve/Reject endpoints working (reject accepts reason)
- ✅ Optional toggles implemented (feature/unfeature, activate/deactivate)

---

## Step 5: Model Layer & Business Rules

### 5.1 SQLModel: `app/models/competition.py`
- Ensure fields:
  - Strings length-capped, types aligned with schemas
  - `detail_image_urls` stored as JSON string, access via `detail_image_urls_list` property
  - Indices for `title`, `registration_deadline`, `is_approved`, `is_featured`
- Business rules:
  - On create: set defaults (`is_active=True`, `is_featured=False`, `is_approved=False`)
  - ✅ On update: prevent setting past `registration_deadline` (schema validator)
  - Optional: add audit fields for moderation (`approved_by`, `approved_at`, `rejection_reason`)
  - ✅ Fields added in `Competition` model
  - ✅ Values set by approve/reject endpoints (approved_by, approved_at, rejection_reason)

---

## Step 6: Permissions & Security

- Ownership: only owner or admin can update/delete
- Visibility: public endpoints show only `is_approved=True`
- Auth/role enforcement via dependencies:
  - `get_current_active_user` for creator endpoints
  - `get_current_admin_user` for admin moderation endpoints

---

## Step 7: Database & Performance

- Cross-DB case-insensitive search:
  - SQLite (test): `LIKE ... COLLATE NOCASE`
  - PostgreSQL (prod): `ILIKE`
- Add sensible pagination defaults and maximums (limit ≤ 1000)
- ✅ Added additional indices: `format`, `scale`, `owner_id`

---

## Step 8: Testing Setup

### 8.1 Unit Tests (CRUD)
- Create/read/update/delete competition
- Filters: `format`, `scale`, `location`, `is_approved`, `is_featured`, `owner_id`
- Search behavior, sorting, pagination, total counts
- Permission checks for owner vs admin

### 8.2 Route Tests
- Public list returns only approved; detail 404 for unapproved
- Creator flow: create/update/delete/list own
- Admin flow: pending list/approve/reject; can update/delete any
- Featured list and sorting combinations

Status:
- ➕ Write tests for all new competition behaviors
  - Featured listing and toggle endpoints
  - Sorting combinations and pagination
  - Pending definition and visibility rules
  - URL validation errors and deadline validators
  - Filters: format, scale, location, owner, approved/featured

### 8.3 Moderation Tests
- Transitions: create (pending) → approve/reject → visibility
- Optional audit fields assertions (if implemented)

### 8.4 Edge Cases
- Invalid UUIDs, invalid URLs, overlong fields
- Past `registration_deadline` on create/update (reject)
- Large `detail_image_urls` arrays and JSON serialization safety

---

## Step 9: Documentation & OpenAPI

- Tag endpoints under `competitions` and `admin`
- Add descriptions and example requests/responses for all endpoints
- Document filters, pagination, sorting
- Clarify error responses (HTTPException `{detail}` vs custom `{error:{...}}`)

---

## Step 10: Implementation Order & Dependencies

1. Schemas and validators (Step 1)
2. CRUD utilities + moderation helpers (Step 2)
3. Public routes with filters/search/sorting (Step 3)
4. Creator routes (create/update/delete/my list) (Step 4.1)
5. Admin moderation routes (pending/approve/reject) (Step 4.2)
6. Business rules and permissions checks (Steps 5–6)
7. DB search compatibility and indices (Step 7)
8. Comprehensive tests (Step 8)
9. Documentation/OpenAPI updates (Step 9)

---

## Success Criteria

- Public endpoints return only approved competitions
- Creators can fully manage their own competitions
- Admins can moderate (pending list, approve, reject) and optionally feature/activate
- Filters, search, sorting, and pagination work consistently across SQLite/PostgreSQL (implemented; tests pending)
- Validation prevents invalid data (deadlines, ages, URLs)
- All tests pass with good coverage; OpenAPI docs are up-to-date

---

**Follow this plan to complete a robust, secure, and well-documented competition management module for SCI.** 