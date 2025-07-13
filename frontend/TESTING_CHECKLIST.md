# Competition Management System - Manual Testing Checklist

## 🚀 Quick Setup Instructions

### Step 1: Start Backend Server
```bash
# Navigate to backend directory
cd /home/vietnq/Projects/SCI/sci-project/backend

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Expected output**: `INFO: Uvicorn running on http://0.0.0.0:8000`

### Step 2: Start Frontend Server
```bash
# Open new terminal and navigate to frontend directory
cd /home/vietnq/Projects/SCI/sci-project/frontend

# Start React development server
npm run dev
```
**Expected output**: 
```
  VITE v5.4.19  ready in 284 ms
  ➜  Local:   http://localhost:3001/
  ➜  Network: http://192.168.5.105:3001/
```
*Note: If port 3000 is in use, Vite will automatically use port 3001*

### Step 3: Verify Setup
- [x] Backend API docs: `http://localhost:8000/docs` loads successfully
- [x] Frontend home: `http://localhost:3001` loads successfully
- [x] API test: `http://localhost:8000/api/v1/competitions/` returns JSON data

---

## 🚀 Test Environment Setup

### Prerequisites
- [x] **Backend server** running on `http://localhost:8000`
- [x] **Frontend server** running on `http://localhost:3001`
- [x] **Database** with **5 test competitions** for comprehensive testing
- [x] **Admin credentials**: `admin@sci.com` / `admin123`

### Test Data Available
- **5 competitions total** with diverse characteristics:
  - 1 Local (Silicon Valley Science Fair) - closing soon
  - 1 Regional (Math Olympiad) - featured
  - 1 National (Test Science Fair + Environmental Challenge) - mixed
  - 1 International (Robotics Championship) - featured
  - Mix of featured (4) and non-featured (1) competitions
  - Different subject areas: Science, Math, Robotics, Environmental
  - Various registration deadlines for testing urgency indicators

### Recent Improvements
- **🔍 Enhanced Search UX**: Button-based search prevents page reloads and focus loss
  - Type freely without triggering search
  - Press Enter or click Search button to execute
  - Visual feedback (orange styling) for pending changes
  - No more laggy UI or interrupted typing experience
- **🎛️ Enhanced Filter UX**: Apply-based filtering prevents immediate page reloads
  - Change filters without immediate application
  - Visual feedback with orange styling for pending changes
  - Apply/Cancel buttons for better control
  - "Pending" indicator to show unsaved changes
  - No more interruptions while adjusting multiple filters
- **✏️ Fixed Form Pre-filling**: Competition and user management forms now properly pre-fill with existing data when editing
  - Competition edit form pre-fills all fields correctly
  - User edit form pre-fills all fields correctly
  - Form data resets automatically when switching between create/edit modes
  - Fixed field mapping issues for proper data display

### Verify Services
- [x] Backend API: `http://localhost:8000/docs` loads successfully
- [x] Frontend: `http://localhost:3001` loads successfully
- [x] API connection: `http://localhost:8000/api/v1/competitions/` returns data

---

## 📋 1. Competition Listing Tests

### Basic Functionality
- [x] Visit `http://localhost:3001/competitions`
- [x] Page loads without errors
- [x] Competition cards display with:
  - Competition image (or placeholder)
  - Competition title
  - Location information
  - Scale badge (Local/Regional/National/International)
  - Featured star badge (if applicable)
  - Registration deadline status
- [x] Results counter shows correct total
- [x] Responsive grid layout (1-4 columns based on screen size)

### Search Functionality
- [x] Search for "Test Science Fair" - should find results
- [x] **Button-based search**: Type "Silicon Valley" and click Search button - should find local science fair
- [x] **Enter key search**: Type "Math" and press Enter - should find Mathematical Olympiad
- [x] **Visual feedback**: Type in search box - input should turn orange indicating pending changes
- [x] **Search button feedback**: When typing, search button should turn orange
- [x] **Clear search**: Use X button to clear search input
- [x] **Search execution**: Only searches when clicking button or pressing Enter (no automatic search)
- [x] **Focus retention**: Input field maintains focus while typing
- [x] **No page reload**: Page doesn't reload while typing in search box
- [x] Search for "Robotics" - should find Global Robotics Championship
- [x] Search for "Environmental" - should find Environmental Innovation Challenge
- [x] Search for "nonexistent" - should show "no results"
- [x] Search box doesn't trigger search on every keystroke (no laggy UI)
- [x] Clear search box - should reset results

### Filter Controls
- [ ] **Apply-based filters**: Change scale to "National" - should show orange styling but NOT apply immediately
- [ ] **Pending indicator**: When changing filters, "Pending" badge should appear in filter toggle
- [ ] **Orange styling**: Advanced filter container should turn orange when there are pending changes
- [ ] **Apply button**: Click "Apply Filters" button - should apply changes and show 2 National results
- [ ] **Cancel changes**: Make filter changes, then click "Cancel" - should revert to previous state
- [ ] **Footer buttons**: Apply/Cancel buttons should appear in advanced filters when there are pending changes
- [ ] **No immediate apply**: Filters should NOT apply automatically when changed
- [ ] **Scale Filter**: Select "Local" and apply - should show 1 result (Silicon Valley)
- [ ] **Scale Filter**: Select "Regional" and apply - should show 1 result (Math Olympiad)
- [ ] **Scale Filter**: Select "International" and apply - should show 1 result (Robotics)
- [ ] **Location Filter**: Enter "CA" and apply - should find Silicon Valley competition
- [ ] **Location Filter**: Enter "Japan" and apply - should find Robotics competition
- [ ] **Featured Toggle**: Enable "Featured Only" and apply - should show 4 results
- [ ] **Featured Toggle**: Disable "Featured Only" and apply - should show all 5 results
- [ ] **Age Range**: Set min=14, max=18 and apply - should filter appropriately
- [ ] **Grade Level**: Set grade range 9-12 and apply - should filter appropriately
- [ ] **Subject Areas**: Select "Mathematics" and apply - should find Math Olympiad
- [ ] **Subject Areas**: Select "Computer Science" and apply - should find relevant competitions

### Filter Management
- [ ] **Multiple filters work together**: Change scale AND location, then apply - should work correctly
- [ ] **Apply button functionality**: "Apply Filters" button only appears when there are pending changes
- [ ] **Cancel functionality**: "Cancel" button reverts all pending changes to previous state
- [ ] **Clear all filters**: "Clear all" button immediately clears and applies empty filters
- [ ] **Active filter count**: Indicator shows correct number of APPLIED filters (not pending)
- [ ] **Filter chips**: Display for applied filters with individual remove buttons
- [ ] **State persistence**: Applied filter state persists during navigation
- [ ] **Pending vs Applied**: Visual distinction between pending changes and applied filters

---

## 🔍 2. Competition Detail Tests

### Navigation
- [ ] Click competition card - navigates to detail page
- [ ] Direct URL access: `http://localhost:3001/competitions/2` (Test Science Fair)
- [ ] Direct URL access: `http://localhost:3001/competitions/4` (Silicon Valley Science Fair)
- [ ] Direct URL access: `http://localhost:3001/competitions/5` (Math Olympiad)
- [ ] Direct URL access: `http://localhost:3001/competitions/6` (Robotics Championship)
- [ ] Direct URL access: `http://localhost:3001/competitions/7` (Environmental Challenge)
- [ ] Non-existent competition: `http://localhost:3001/competitions/999` shows 404

### Detail Page Content
- [ ] Competition title displays correctly
- [ ] Full description shows
- [ ] Competition image displays (or placeholder)
- [ ] Location information
- [ ] Scale badge with correct color
- [ ] Start and end dates
- [ ] Registration deadline
- [ ] Prize structure (if available)
- [ ] Eligibility requirements
- [ ] External registration URL
- [ ] Creator information

### Interactive Elements
- [ ] **Countdown Timer**: Shows time until registration deadline
- [ ] **Timer Updates**: Counter updates every second
- [ ] **Register Button**: Opens external URL in new tab
- [ ] **Share Button**: Web Share API or clipboard copy works
- [ ] **Back Navigation**: Browser back button works
- [ ] **Responsive Design**: Layout adapts to mobile/tablet

### Status Indicators
- [ ] "2 days left" type messages show correctly
- [ ] "Registration closes today" appears for same-day deadlines
- [ ] "Registration closed" appears for past deadlines
- [ ] Urgency indicators (red for closing soon)
- [ ] Silicon Valley Science Fair shows "13 days left" (closes July 25th)
- [ ] Math Olympiad shows "39 days left" (closes August 20th)
- [ ] Environmental Challenge shows "51 days left" (closes September 1st)
- [ ] Robotics Championship shows "65 days left" (closes September 15th)

---

## 🔐 3. Authentication Tests

### Login Flow
- [ ] Visit `http://localhost:3001/competitions/create` (should redirect to login)
- [ ] Login page loads correctly
- [ ] Enter credentials: `admin@sci.com` / `admin123`
- [ ] Successful login redirects to intended page
- [ ] Invalid credentials show error message
- [ ] Empty fields show validation errors

### Authentication State
- [ ] After login, user avatar/menu appears in header
- [ ] "Create Competition" button becomes visible
- [ ] Protected routes are accessible
- [ ] Login state persists on page refresh
- [ ] Logout functionality works correctly

### Authorization
- [ ] Admin can see all competitions
- [ ] Admin can edit/delete any competition
- [ ] Content creators can only edit their own competitions
- [ ] Unauthorized actions show appropriate messages

### User Management (Admin Only)
- [ ] Navigate to `http://localhost:3000/dashboard/users` (as admin)
- [ ] User management page loads with user list
- [ ] "Create User" button opens create form
- [ ] Create form has empty fields for new user
- [ ] **Edit Form Pre-filling**: Click "Edit" button on any user
- [ ] **Form Pre-fills Correctly**: All fields populate with existing user data:
  - Username field shows current username
  - Email field shows current email
  - Password field is empty (security)
  - Role dropdown shows current role (admin/creator)
  - Active status checkbox shows current status
- [ ] **Form Reset**: Switch between different users - form updates each time
- [ ] **Create vs Edit**: Click "Create User" then "Edit" on user - form switches correctly
- [ ] Form validation works for required fields
- [ ] Form submission updates user correctly
- [ ] Cancel closes form without saving changes

---

## ✏️ 4. Competition Creation Tests

### Form Access
- [ ] "Create Competition" button visible when logged in
- [ ] Form loads with all required fields
- [ ] Form validation prevents submission of empty required fields

### Form Fields
- [ ] **Title**: Required, shows error if empty
- [ ] **Description**: Required, character limit respected
- [ ] **Location**: Required field
- [ ] **Scale**: Dropdown with all options (Local/Regional/National/International)
- [ ] **Start Date**: Date picker, validation for future dates
- [ ] **End Date**: Must be after start date
- [ ] **Registration Deadline**: Must be before start date
- [ ] **External URL**: Valid URL format required
- [ ] **Prize Structure**: Optional text field
- [ ] **Eligibility**: Optional text field
- [ ] **Age Range**: Min/max validation
- [ ] **Grade Range**: Min/max validation
- [ ] **Subject Areas**: Multi-select functionality
- [ ] **Featured**: Checkbox (admin only)

### Image Upload
- [ ] Image upload button works
- [ ] Valid image files (jpg, png, gif) upload successfully
- [ ] Invalid file types show error message
- [ ] Image preview displays after upload
- [ ] File size validation (if implemented)
- [ ] Replace image functionality works

### Form Submission
- [ ] Valid form submits successfully
- [ ] Loading state shows during submission
- [ ] Success message appears after creation
- [ ] Redirects to new competition detail page
- [ ] Error handling for API failures
- [ ] Form data persists during validation errors

---

## ✏️ 5. Competition Editing Tests

### Edit Access
- [ ] "Edit" button visible for own/admin competitions
- [ ] Edit form pre-populates with existing data
- [ ] Unauthorized users cannot access edit forms

### Edit Functionality
- [ ] All fields can be modified
- [ ] Image can be replaced
- [ ] Changes save correctly
- [ ] Validation still applies
- [ ] Cancel button discards changes
- [ ] Success message shows after update

### Delete Functionality
- [ ] Delete button shows confirmation dialog
- [ ] Confirm deletion removes competition
- [ ] Cancel deletion keeps competition
- [ ] Redirects to competitions list after deletion
- [ ] Unauthorized users cannot delete

---

## 📱 6. Responsive Design Tests

### Desktop (1920px+)
- [ ] Competition grid shows 4 columns
- [ ] All UI elements properly spaced
- [ ] Navigation menu fully expanded
- [ ] Forms use full width appropriately

### Tablet (768px - 1024px)
- [ ] Competition grid shows 2-3 columns
- [ ] Touch-friendly button sizes
- [ ] Navigation adapts to tablet layout
- [ ] Forms remain usable

### Mobile (320px - 767px)
- [ ] Competition grid shows 1 column
- [ ] Cards stack vertically
- [ ] Touch-friendly interface
- [ ] Navigation collapses to hamburger menu
- [ ] Forms adapt to mobile layout
- [ ] Text remains readable
- [ ] Buttons are touch-friendly (44px min)

---

## 🔍 7. Search & Filter Advanced Tests

### Advanced Search
- [ ] Search works with partial matches
- [ ] Search ignores case sensitivity
- [ ] Search works across multiple fields (title, description, location)
- [ ] Special characters in search work correctly
- [ ] Empty search shows all results

### Filter Combinations
- [ ] Scale + Location filters work together
- [ ] Search + Filters work together
- [ ] Multiple filters don't conflict
- [ ] Filter state updates URL parameters (if implemented)

### Performance
- [ ] Search is debounced (doesn't search on every keystroke)
- [ ] Filter changes are responsive
- [ ] Large result sets load efficiently
- [ ] No flickering during filter changes

---

## 🚨 8. Error Handling Tests

### Network Errors
- [ ] Stop backend server temporarily
- [ ] Frontend shows appropriate error messages
- [ ] Retry functionality works (if implemented)
- [ ] Graceful degradation for offline state

### Invalid Data
- [ ] Invalid competition IDs show 404 page
- [ ] Malformed API responses handled gracefully
- [ ] Form validation prevents invalid submissions
- [ ] Image upload errors show user-friendly messages

### Edge Cases
- [ ] Empty competition list handled gracefully
- [ ] Competitions with missing data display correctly
- [ ] Long competition titles/descriptions don't break layout
- [ ] Special characters in competition data handled correctly

---

## 🎯 9. Performance Tests

### Load Times
- [ ] Competition list loads within 2 seconds
- [ ] Competition detail pages load quickly
- [ ] Image uploads complete in reasonable time
- [ ] Search results appear quickly

### User Experience
- [ ] Smooth animations and transitions
- [ ] No layout shifting during load
- [ ] Loading states provide feedback
- [ ] Form submissions feel responsive

---

## 🔗 10. Integration Tests

### API Integration
- [ ] All CRUD operations work correctly
- [ ] Search API returns expected results
- [ ] Filter API parameters work correctly
- [ ] Authentication API integration works
- [ ] Error responses handled appropriately

### Data Consistency
- [ ] Created competitions appear in listing
- [ ] Edited competitions reflect changes
- [ ] Deleted competitions disappear from listing
- [ ] Search results stay current with data changes

---

## 📊 11. Browser Compatibility Tests

### Chrome/Chromium
- [ ] All functionality works correctly
- [ ] Performance is good
- [ ] Console shows no errors

### Firefox
- [ ] All functionality works correctly
- [ ] Layout renders correctly
- [ ] No browser-specific issues

### Safari (if available)
- [ ] All functionality works correctly
- [ ] Layout renders correctly
- [ ] No browser-specific issues

### Edge
- [ ] All functionality works correctly
- [ ] Layout renders correctly
- [ ] No browser-specific issues

---

## 🏆 Success Criteria

### Must Pass (Critical)
- [ ] Competition listing loads and displays correctly
- [ ] Competition detail pages show all information
- [ ] Search and basic filtering work
- [ ] Authentication and login work
- [ ] Competition creation works
- [ ] Competition editing works (for authorized users)
- [ ] Mobile responsive design works
- [ ] Error pages display appropriately

### Should Pass (Important)
- [ ] Advanced filtering works correctly
- [ ] Image upload works
- [ ] Share functionality works
- [ ] Countdown timers work
- [ ] Loading states provide feedback
- [ ] Delete functionality works
- [ ] Form validation prevents errors

### Nice to Have (Enhancement)
- [ ] Smooth animations and transitions
- [ ] Advanced search features
- [ ] Keyboard navigation works
- [ ] Accessibility features work
- [ ] Performance optimizations evident

---

## 📋 Test Summary

**Total Tests**: _____ / _____  
**Critical Tests Passed**: _____ / _____  
**Important Tests Passed**: _____ / _____  
**Nice to Have Tests Passed**: _____ / _____  

**Overall Status**: ✅ PASS | ❌ FAIL | ⚠️ NEEDS WORK

**Notes:**
_Add any observations, issues found, or recommendations here._

---

## 🐛 Issues Found

| Issue | Severity | Page/Feature | Description | Status |
|-------|----------|--------------|-------------|---------|
| 1 | High/Medium/Low | | | Open/Fixed |
| 2 | High/Medium/Low | | | Open/Fixed |
| 3 | High/Medium/Low | | | Open/Fixed |

---

## 🎯 Next Steps

Based on test results:
- [ ] Fix critical issues
- [ ] Address important issues
- [ ] Consider enhancements
- [ ] Plan next development iteration

---

*Last Updated: [Current Date]*  
*Tester: [Your Name]*  
*Version: Competition Management System v1.0* 