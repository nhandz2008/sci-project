# Step 3: Competition Management - Implementation Plan

## 📋 Current Status Analysis

### ✅ What's Ready:
- **Competition Model**: `app/models/competition.py` exists with all fields
- **Authentication System**: JWT and role-based access control implemented
- **User Management**: CRUD operations and routes implemented
- **Database Structure**: PostgreSQL with SQLModel setup

### ❌ What's Missing:
- **Competition Schemas**: No Pydantic schemas for competition operations
- **Competition CRUD**: No database operations for competitions
- **Competition Routes**: No API endpoints for competition management
- **Admin Moderation**: No content moderation workflow
- **Search Functionality**: No advanced search implementation

## 🎯 Implementation Strategy

### Phase 1: Create Competition Schemas
**Goal**: Create Pydantic models for competition operations

**Files to create**:
- `app/schemas/competition.py`

**Schemas to implement**:
- `CompetitionCreate` - For creating competitions
- `CompetitionUpdate` - For updating competitions
- `CompetitionResponse` - For competition responses
- `CompetitionListResponse` - For paginated competition lists
- `CompetitionFilterParams` - For filtering and search
- `CompetitionModerationResponse` - For moderation responses

### Phase 2: Create Competition CRUD Operations
**Goal**: Create database operations for competition management

**Files to create**:
- `app/crud/competition.py`

**Functions to implement**:
- `create_competition()` - Create new competition
- `get_competition_by_id()` - Get competition by ID
- `get_competitions()` - List competitions with filtering/pagination
- `update_competition()` - Update competition (owner/admin)
- `delete_competition()` - Delete competition (owner/admin)
- `get_pending_competitions()` - Get pending for moderation
- `approve_competition()` - Approve competition (admin)
- `reject_competition()` - Reject competition (admin)

### Phase 3: Create Competition Routes
**Goal**: Implement competition management endpoints

**Files to create**:
- `app/api/routes/competitions.py`

**Endpoints to implement**:
1. `GET /competitions` - List competitions (public)
2. `GET /competitions/{id}` - Get competition details (public)
3. `POST /competitions` - Create competition (authenticated)
4. `PUT /competitions/{id}` - Update competition (owner/admin)
5. `DELETE /competitions/{id}` - Delete competition (owner/admin)

### Phase 4: Create Admin Moderation Routes
**Goal**: Implement content moderation workflow

**Files to create**:
- `app/api/routes/admin.py`

**Endpoints to implement**:
1. `GET /admin/competitions/pending` - List pending competitions
2. `PUT /admin/competitions/{id}/approve` - Approve competition
3. `PUT /admin/competitions/{id}/reject` - Reject competition

### Phase 5: Update Router Structure
**Goal**: Organize and connect all routes

**Files to update**:
- `app/api/main.py` - Include competition and admin routers

## 🔧 Technical Requirements

### Competition Operations:
- **Public Access**: List and view competitions (approved only)
- **Creator Access**: Create, update, delete own competitions
- **Admin Access**: Full CRUD + moderation capabilities
- **Moderation Workflow**: Pending → Approved/Rejected

### Database Operations:
- **Filtering**: By format, scale, location, date range, approval status
- **Search**: Full-text search on title and description
- **Pagination**: Efficient pagination with total count
- **Relationships**: Proper owner relationship handling

### Security Requirements:
- **Owner Validation**: Only owners can modify their competitions
- **Admin Override**: Admins can modify any competition
- **Moderation Control**: Only admins can approve/reject
- **Public Filtering**: Only approved competitions visible publicly

### API Design:
- **RESTful Design**: Proper HTTP methods and status codes
- **Response Models**: Consistent response schemas
- **Error Handling**: Proper HTTP status codes and error messages
- **Documentation**: Comprehensive docstrings and OpenAPI tags

## 📁 File Structure to Create

```
sci-project/backend/app/
├── schemas/
│   └── competition.py
├── crud/
│   └── competition.py
├── api/routes/
│   ├── competitions.py
│   └── admin.py
└── api/main.py (update)
```

## 🧪 Testing Strategy

### Unit Tests:
- Test each CRUD function individually
- Test each endpoint with valid/invalid inputs
- Test competition flow end-to-end
- Test error handling and edge cases

### Integration Tests:
- Test complete competition management flow
- Test moderation workflow
- Test permissions and access control
- Test database operations

## 🚀 Success Criteria

### Functional Requirements:
- ✅ All competition endpoints working
- ✅ All admin moderation endpoints working
- ✅ Proper error handling and validation
- ✅ Security measures implemented
- ✅ Database operations working correctly

### Quality Requirements:
- ✅ Code passes linting and formatting
- ✅ Proper documentation and type hints
- ✅ Consistent error handling patterns
- ✅ Security best practices followed

### Performance Requirements:
- ✅ Fast response times for all endpoints
- ✅ Proper database query optimization
- ✅ Efficient filtering and search

## 📝 Implementation Order

1. **Start with schemas** (foundation)
2. **Implement CRUD operations** (data layer)
3. **Create competition routes** (core functionality)
4. **Add admin moderation routes** (admin operations)
5. **Update router structure** (organization)
6. **Test everything thoroughly** (quality assurance)

---

**Ready to begin implementation!** 