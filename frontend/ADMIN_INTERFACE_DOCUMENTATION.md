# Admin Interface Documentation

## Overview

The admin interface provides comprehensive tools for managing competitions, users, and platform content. This document outlines the features and functionality available to administrators.

## Access Control

### Admin Role Requirements
- Users must have `role: 'ADMIN'` to access admin features
- Automatic redirect to login if not authenticated
- Redirect to account page if user is not an admin

## Dashboard (`/admin`)

### Statistics Overview
The admin dashboard displays real-time statistics:

- **Pending Reviews**: Number of competitions awaiting approval
- **Approved**: Number of approved competitions
- **Total Competitions**: Total number of competitions in the system
- **Featured**: Number of featured competitions

### Quick Actions
- **Pending Reviews Alert**: Prominent notification when competitions need review
- **Review Now Button**: Direct link to pending competitions page

### Navigation Cards
1. **Competition Moderation** (`/admin/pending`)
   - Review and approve pending competitions
   - Shows pending count badge

2. **Competition Management** (`/admin/competitions`)
   - Manage all competitions and features

3. **Featured Competitions** (`/admin/featured`)
   - Manage featured competitions

4. **User Management** (`/admin/users`)
   - Manage users, roles, and permissions

5. **System Health**
   - View system statistics and health status

6. **Recent Activity**
   - View recent admin actions (coming soon)

## Competition Moderation (`/admin/pending`)

### Features

#### List View
- **Pagination**: 10 competitions per page
- **Statistics Bar**: Shows total pending count, current page, total pages
- **Competition Cards**: Each competition displays:
  - Title and status badge
  - Introduction (truncated)
  - Location, format, scale
  - Registration deadline
  - Creation date and owner ID
  - Action buttons: View Details, Approve, Reject

#### Detail View
- **Comprehensive Information**: Full competition details including:
  - Basic info (title, introduction, overview)
  - Competition details (location, format, scale, size, age range)
  - Timeline (registration deadline, created, updated dates)
  - Additional sections (question type, selection process, history, etc.)
  - Images (background and detail images)
  - External links

#### Action Panel
- **Approve Button**: Instantly approve competition
- **Reject Button**: Open rejection modal with reason requirement
- **Competition Info**: Technical details (ID, owner ID, status flags)
- **External Links**: Direct links to competition websites

### Approval Process

#### Approving a Competition
1. Click "Approve" button on competition card or detail view
2. Confirm action in popup dialog
3. Competition status changes to `is_approved: true`
4. Competition becomes visible in public listings
5. User receives notification (if implemented)

#### Rejecting a Competition
1. Click "Reject" button
2. Modal opens requiring rejection reason
3. Enter detailed reason for rejection
4. Confirm rejection
5. Competition remains in system but marked as rejected
6. User receives notification with rejection reason

### API Integration

#### Endpoints Used
- `GET /api/v1/admin/competitions/pending` - Fetch pending competitions
- `PUT /api/v1/admin/competitions/{id}/approve` - Approve competition
- `PUT /api/v1/admin/competitions/{id}/reject` - Reject competition

#### Error Handling
- Network errors display user-friendly messages
- Validation errors show specific field issues
- Authentication errors redirect to login

## Competition Management (`/admin/competitions`)

### Features

#### List View
- **All Competitions**: View all competitions regardless of status
- **Filtering**: Filter by status (approved, pending, rejected)
- **Search**: Search competitions by title or content
- **Sorting**: Sort by creation date, title, or status

#### Competition Actions
- **View Details**: Full competition information
- **Edit**: Modify competition details (admin override)
- **Feature/Unfeature**: Toggle featured status
- **Activate/Deactivate**: Toggle active status
- **Delete**: Remove competition from system

### API Integration

#### Endpoints Used
- `GET /api/v1/admin/competitions` - Fetch all competitions
- `PUT /api/v1/admin/competitions/{id}/feature` - Feature competition
- `PUT /api/v1/admin/competitions/{id}/unfeature` - Unfeature competition
- `PUT /api/v1/admin/competitions/{id}/activate` - Activate competition
- `PUT /api/v1/admin/competitions/{id}/deactivate` - Deactivate competition
- `DELETE /api/v1/admin/competitions/{id}` - Delete competition

## Featured Competitions (`/admin/featured`)

### Features

#### Featured Management
- **Current Featured**: List of currently featured competitions
- **Add to Featured**: Select competitions to feature
- **Remove from Featured**: Remove competitions from featured list
- **Reorder**: Change order of featured competitions (future)

#### Selection Criteria
- Only approved competitions can be featured
- Maximum number of featured competitions (configurable)
- Automatic rotation (future enhancement)

### API Integration

#### Endpoints Used
- `GET /api/v1/admin/competitions/featured` - Fetch featured competitions
- `PUT /api/v1/admin/competitions/{id}/feature` - Feature competition
- `PUT /api/v1/admin/competitions/{id}/unfeature` - Unfeature competition

## User Management (`/admin/users`)

### Features

#### User List
- **All Users**: View all registered users
- **Search**: Search users by name, email, or username
- **Filter**: Filter by role, status, or registration date
- **Pagination**: Handle large user lists

#### User Actions
- **View Profile**: Full user information
- **Edit Role**: Change user role (USER, ADMIN)
- **Activate/Deactivate**: Toggle user account status
- **View Competitions**: List user's created competitions
- **Delete Account**: Remove user from system

### API Integration

#### Endpoints Used
- `GET /api/v1/admin/users` - Fetch all users
- `PUT /api/v1/admin/users/{id}/role` - Update user role
- `PUT /api/v1/admin/users/{id}/activate` - Activate user
- `PUT /api/v1/admin/users/{id}/deactivate` - Deactivate user
- `DELETE /api/v1/admin/users/{id}` - Delete user

## Security Considerations

### Access Control
- All admin routes require authentication
- Role-based access control (RBAC)
- Session management and timeout
- CSRF protection

### Data Protection
- Sensitive data encryption
- Audit logging for admin actions
- Rate limiting on admin endpoints
- Input validation and sanitization

### Error Handling
- Secure error messages (no sensitive data exposure)
- Proper HTTP status codes
- Logging of security events
- Graceful degradation

## Performance Optimization

### Caching
- Competition data caching
- User statistics caching
- Image optimization
- CDN integration for static assets

### Database Optimization
- Efficient queries with proper indexing
- Pagination for large datasets
- Lazy loading for images and content
- Connection pooling

## Monitoring and Analytics

### Admin Dashboard Metrics
- Real-time competition statistics
- User activity monitoring
- System performance metrics
- Error rate tracking

### Audit Trail
- Admin action logging
- User activity tracking
- Competition modification history
- Security event monitoring

## Future Enhancements

### Planned Features
- Advanced filtering and search
- Bulk operations for competitions
- Automated moderation tools
- Advanced analytics dashboard
- Email notifications for admins
- Competition templates
- User communication tools

### Technical Improvements
- Real-time updates using WebSockets
- Advanced caching strategies
- Mobile-responsive admin interface
- API rate limiting improvements
- Enhanced security features
