# SCI Backend Testing Guide

This document provides a comprehensive guide to testing the SCI backend application, covering all aspects of the Phase 2 implementation (Authentication & User Management).

## 📋 Test Overview

The test suite is designed to provide comprehensive coverage of all Phase 2 functionality:

- **Authentication System** (JWT tokens, password hashing, login/signup)
- **User Management** (CRUD operations, profile updates, admin functions)
- **Security** (token validation, password strength, authorization)
- **API Endpoints** (all routes with proper error handling)
- **Data Validation** (Pydantic schemas, input validation)
- **Integration Flows** (complete user journeys)

## 🏗️ Test Structure

```
tests/
├── __init__.py
├── conftest.py                 # Test configuration and fixtures
├── test_auth_routes.py         # Authentication endpoint tests
├── test_user_routes.py         # User management endpoint tests
├── test_crud_user.py           # CRUD operation tests
├── test_security.py            # Security utility tests
├── test_dependencies.py        # FastAPI dependency tests
├── test_schemas.py            # Pydantic schema tests
└── test_integration.py        # Integration flow tests
```

## 🚀 Running Tests

### Prerequisites

1. Install test dependencies:
```bash
pip install pytest pytest-cov
```

2. Ensure you're in the backend directory:
```bash
cd sci-project/backend
```

### Running All Tests

```bash
python run_tests.py
```

### Running Specific Test Files

```bash
# Run authentication tests only
python run_tests.py test_auth_routes

# Run user management tests only
python run_tests.py test_user_routes

# Run security tests only
python run_tests.py test_security
```

### View Test Summary

```bash
python run_tests.py --summary
```

### Running with Coverage

```bash
pytest tests/ -v --cov=app --cov-report=html
```

This will generate a coverage report in `htmlcov/index.html`.

## 📊 Test Coverage

### 1. Authentication Routes (`test_auth_routes.py`)

**Coverage**: All authentication endpoints and flows

**Tests Include**:
- ✅ User registration (success and failure cases)
- ✅ User login (valid/invalid credentials)
- ✅ Password reset flow (request and confirmation)
- ✅ Token validation and expiration
- ✅ Current user profile retrieval
- ✅ Input validation (email, password strength, phone numbers)
- ✅ Error handling (duplicate emails, invalid tokens)

**Key Test Scenarios**:
```python
# Successful registration
def test_signup_success()

# Duplicate email handling
def test_signup_duplicate_email()

# Weak password validation
def test_signup_weak_password()

# Successful login
def test_login_success()

# Invalid credentials
def test_login_invalid_credentials()

# Password reset flow
def test_reset_password_success()
```

### 2. User Management Routes (`test_user_routes.py`)

**Coverage**: All user management endpoints and admin operations

**Tests Include**:
- ✅ User profile retrieval and updates
- ✅ Password change functionality
- ✅ Admin user listing with pagination/filtering
- ✅ User activation/deactivation
- ✅ Role management (CREATOR/ADMIN)
- ✅ Authorization checks
- ✅ Input validation

**Key Test Scenarios**:
```python
# Profile management
def test_get_current_user_profile_success()
def test_update_current_user_profile_success()

# Password changes
def test_change_password_success()
def test_change_password_wrong_current()

# Admin operations
def test_get_users_list_admin_success()
def test_delete_user_admin_success()
def test_activate_user_admin_success()
```

### 3. CRUD Operations (`test_crud_user.py`)

**Coverage**: All database operations and utility functions

**Tests Include**:
- ✅ User creation, reading, updating, deletion
- ✅ User authentication and validation
- ✅ User management utilities (activation, role changes)
- ✅ Search and filtering functionality
- ✅ Pagination and bulk operations
- ✅ Error handling for database operations

**Key Test Scenarios**:
```python
# CRUD operations
def test_create_user_success()
def test_get_user_by_email_success()
def test_update_user_success()
def test_delete_user_success()

# Authentication
def test_authenticate_user_success()
def test_authenticate_user_wrong_password()

# User management
def test_get_users_with_pagination()
def test_get_users_with_filters()
def test_search_users_by_name()
```

### 4. Security Utilities (`test_security.py`)

**Coverage**: All security-related functions and token handling

**Tests Include**:
- ✅ Password hashing and verification
- ✅ Password strength validation
- ✅ JWT token creation and validation
- ✅ Token expiration handling
- ✅ Password reset token functionality
- ✅ Security edge cases

**Key Test Scenarios**:
```python
# Password security
def test_get_password_hash()
def test_verify_password_success()
def test_validate_password_strength_success()

# JWT tokens
def test_create_access_token()
def test_verify_token_success()
def test_verify_token_expired()

# Token security
def test_tokens_are_different()
def test_token_verification_consistency()
```

### 5. FastAPI Dependencies (`test_dependencies.py`)

**Coverage**: All FastAPI dependency injection functions

**Tests Include**:
- ✅ Authentication dependencies
- ✅ Authorization dependencies
- ✅ User role validation
- ✅ Token validation in dependencies
- ✅ Error handling in dependencies

**Key Test Scenarios**:
```python
# Authentication dependencies
def test_get_current_user_success()
def test_get_current_user_invalid_token()

# Authorization dependencies
def test_get_current_admin_user_success()
def test_get_current_admin_user_creator()

# Dependency chains
def test_dependency_chain_success()
def test_dependency_chain_with_inactive_user()
```

### 6. Pydantic Schemas (`test_schemas.py`)

**Coverage**: All Pydantic model validation and serialization

**Tests Include**:
- ✅ Input validation for all schemas
- ✅ Serialization and deserialization
- ✅ Error handling for invalid data
- ✅ Edge cases and boundary conditions
- ✅ Unicode and special character handling

**Key Test Scenarios**:
```python
# Schema validation
def test_user_create_valid()
def test_user_create_invalid_email()
def test_user_create_weak_password()

# Serialization
def test_user_response_serialization()
def test_token_response_serialization()

# Edge cases
def test_user_response_with_unicode()
def test_user_update_all_none()
```

### 7. Integration Tests (`test_integration.py`)

**Coverage**: Complete user flows and end-to-end scenarios

**Tests Include**:
- ✅ Complete user registration and profile management flow
- ✅ Complete admin user management flow
- ✅ Complete password reset flow
- ✅ Complete error handling flow
- ✅ Complete pagination and filtering flow
- ✅ Complete security flow

**Key Test Scenarios**:
```python
# Complete user flows
def test_complete_user_registration_flow()
def test_complete_admin_flow()
def test_complete_password_reset_flow()

# Error handling
def test_complete_error_handling_flow()

# Advanced features
def test_complete_pagination_and_filtering_flow()
def test_complete_security_flow()
```

## 🔧 Test Configuration

### Test Database

Tests use SQLite for faster execution:
- **Database**: `test.db` (SQLite)
- **Isolation**: Each test runs in isolation
- **Cleanup**: Database is recreated for each test session

### Environment Variables

Test environment variables are set automatically:
```python
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["POSTGRES_PASSWORD"] = "test-password"
os.environ["FIRST_SUPERUSER_PASSWORD"] = "test-admin-password"
```

### Fixtures

Key fixtures available:
- `client`: FastAPI test client
- `session`: Database session
- `auth_headers`: Authenticated user headers
- `admin_headers`: Admin user headers

## 📈 Test Metrics

### Expected Coverage

- **Authentication Routes**: 100%
- **User Management Routes**: 100%
- **CRUD Operations**: 100%
- **Security Utilities**: 100%
- **Dependencies**: 100%
- **Schemas**: 100%
- **Integration Flows**: 100%

### Test Count

- **Total Test Files**: 7
- **Total Test Functions**: ~150+
- **Test Categories**: 8

## 🐛 Debugging Tests

### Running Individual Tests

```bash
# Run specific test function
pytest tests/test_auth_routes.py::TestAuthSignup::test_signup_success -v

# Run with debug output
pytest tests/test_auth_routes.py -v -s
```

### Common Issues

1. **Database Connection Errors**:
   - Ensure SQLite is available
   - Check file permissions for test.db

2. **Import Errors**:
   - Ensure you're in the backend directory
   - Check that all dependencies are installed

3. **Token Expiration Tests**:
   - Some tests use `time.sleep()` for token expiration
   - These tests may be slow but are necessary for security validation

## 🚀 Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.10
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: |
          cd sci-project/backend
          python run_tests.py
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## 📝 Adding New Tests

### Test Naming Convention

- **Test Classes**: `Test<Feature>`
- **Test Functions**: `test_<scenario>_<expected_result>`
- **File Names**: `test_<module>.py`

### Example Test Structure

```python
class TestNewFeature:
    """Test new feature functionality."""
    
    def test_new_feature_success(self, client: TestClient, session: Session):
        """Test successful new feature operation."""
        # Arrange
        # Act
        # Assert
        
    def test_new_feature_failure(self, client: TestClient):
        """Test new feature failure scenario."""
        # Arrange
        # Act
        # Assert
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should clearly describe the scenario
3. **Arrange-Act-Assert**: Follow the AAA pattern
4. **Error Testing**: Always test both success and failure cases
5. **Edge Cases**: Test boundary conditions and edge cases
6. **Documentation**: Add docstrings to test classes and functions

## 🎯 Test Priorities

### High Priority (Must Pass)
- Authentication flows
- Security validation
- Authorization checks
- Input validation
- Error handling

### Medium Priority (Should Pass)
- CRUD operations
- Pagination and filtering
- Admin operations
- Integration flows

### Low Priority (Nice to Have)
- Performance tests
- Load tests
- Stress tests

## 📊 Coverage Reports

After running tests, coverage reports are generated:

- **Terminal**: Shows missing lines
- **HTML**: Detailed coverage in `htmlcov/index.html`
- **XML**: For CI/CD integration

### Coverage Targets

- **Overall Coverage**: >95%
- **Critical Paths**: 100%
- **Security Functions**: 100%
- **API Endpoints**: 100%

## 🔍 Test Maintenance

### Regular Tasks

1. **Update Tests**: When adding new features
2. **Review Coverage**: Ensure new code is tested
3. **Update Fixtures**: When changing data models
4. **Performance**: Monitor test execution time

### Test Data

- Use realistic but safe test data
- Avoid hardcoded credentials
- Use environment variables for sensitive data
- Clean up test data after each test

This comprehensive testing suite ensures the SCI backend is robust, secure, and maintainable for production use. 