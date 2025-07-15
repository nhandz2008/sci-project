## Science Competitions Insight (SCI) Full‑Stack Design Document

### 1. Project Overview

**Purpose:**
SCI is a full‑stack web application for showcasing, managing, and recommending science & technology competitions worldwide. It connects content creators, administrators, and end users, offering AI‑powered recommendation and a clean, modern UI.

**Key Roles & Users:**

* **End User:** Browses competitions, searches and filters, uses recommendation wizard.
* **Content Creator:** Authenticated via signup, can create, edit, delete own competition postings.
* **Administrator:** Ultimate authority; can manage all competitions, user accounts, assign/revoke roles.

**Technology Stack:**

#### Frontend Technologies
* **React 18** with TypeScript for type-safe, modern component development
* **Vite** as the build tool for fast development and optimized production builds
* **TanStack Router** for type-safe routing with file-based routing patterns
* **TanStack React Query** for server state management, caching, and optimistic updates
* **Chakra UI** for accessible, customizable component library with dark mode support
* **React Hook Form** with Zod for performant form handling and validation
* **Axios** for HTTP client with interceptors for authentication and error handling
* **React Icons** for comprehensive icon library
* **Framer Motion** for smooth animations and micro-interactions
* **Day.js** for lightweight date manipulation and formatting
* **Swiper.js** for touch-enabled carousels and sliders

#### Backend Technologies
* **FastAPI** with ASGI (Uvicorn) for high-performance async API development
* **SQLModel** (SQLAlchemy + Pydantic) for type-safe database operations and data validation (used for both ORM and validation)
* **Pydantic v2** for data validation, serialization, and settings management (via SQLModel)
* **PostgreSQL** as the primary relational database
* **Alembic** for database migrations and schema management
* **Passlib** with bcrypt for secure password hashing
* **PyJWT** for JWT token generation and validation
* **Docker Compose** for containerized development and production environments
* **Basic logging** using Python’s logging module

#### Development & DevOps Tools
* **UV** for fast Python package management and dependency resolution
* **TypeScript** for type-safe JavaScript development
* **Biome** for fast linting and formatting (replacing ESLint + Prettier; do not use both)
* **Pre-commit hooks** for code quality enforcement
* **Docker Compose** for containerized development and production environments
* **GitHub Actions** for CI/CD pipeline automation (optional; manual deployment supported)
* **Pytest** for backend testing with coverage reporting
* **MyPy** for static type checking in Python

#### Infrastructure & Deployment
* **AWS EC2** (Ubuntu 22.04) with t3.small instance
* **Nginx** as reverse proxy with automatic HTTPS via Certbot
* **Docker** for containerization and consistent deployment environments
* **Route 53** for DNS management and domain routing
* **GitHub Container Registry** for Docker image storage

#### Security & Performance
* **JWT-based authentication** with refresh token rotation
* **Role-based access control** (RBAC) with granular permissions
* **CORS** configuration for secure cross-origin requests
* **Input validation** and sanitization at API boundaries
* **SQL injection prevention** through SQLModel ORM
* **XSS protection** through proper content encoding
* **HTTPS enforcement** with HSTS headers
* **Content Security Policy** (CSP) headers

#### Data & Analytics
* **PostgreSQL** for structured data with JSONB support for flexible schemas
* **Recommendation engine** with rule-based scoring and ML-ready architecture
* **Analytics tracking** for user behavior and competition performance (basic logging and database analytics)
* **Backup strategy** with automated PostgreSQL dumps to S3
* **Data export** capabilities (CSV, JSON) for admin operations

#### User Experience Features
* **Dark/Light mode** toggle with system preference detection
  - Users can switch between dark and light themes manually, or the site will automatically match the user's system preference. Theme changes are instant and persist across sessions.
* **Responsive design** with mobile-first approach
  - The layout adapts seamlessly to all screen sizes, ensuring usability and aesthetics on phones, tablets, and desktops. Navigation, grids, and images adjust responsively.
* **Accessibility** compliance (WCAG 2.1 AA standards)
  - All interactive elements are keyboard-navigable, have appropriate ARIA labels, and color contrast meets accessibility standards. Screen readers are fully supported.
* **Search with debouncing** and advanced filtering
  - Users can search competitions using a search bar. The search triggers only after 300ms of inactivity (debouncing) to minimize server load. Advanced filters (date, area, scale, fee) update results instantly as selected.

---

### 2. Website Features & Capabilities

#### 2.1 Core Features

**Competition Discovery & Browsing**
* **Global Competition Database**: Comprehensive collection of science and technology competitions worldwide
  - Users can browse a large, curated list of competitions from around the world, updated regularly by creators and admins.
* **Advanced Search & Filtering**: Multi-criteria search with filters for location, date range, age groups, competition scale, and entry fees
  - Users can refine their search using multiple filters simultaneously. The UI updates results in real time as filters are changed.
* **Smart Recommendations**: AI-powered competition matching based on user profiles, interests, and academic background
  - Users can fill out a recommendation wizard. The system analyzes their profile and suggests the most relevant competitions, ranked by fit.
* **Featured Competitions**: Curated selection of high-quality competitions with visual carousels
  - A visually prominent carousel on the homepage highlights selected competitions, chosen by admins or based on popularity.
* **Competition Categories**: Organized by scientific disciplines (Physics, Chemistry, Biology, Engineering, Computer Science, etc.)
  - Competitions are grouped by discipline, allowing users to quickly find events in their area of interest. Each category has its own landing page or filter.

**User Experience & Interface**
* **Modern, Intuitive Design**: Clean, professional interface optimized for both desktop and mobile devices
* **Interactive Recommendation Wizard**: Step-by-step guided process to find the perfect competition match
* **Real-time Updates**: Live countdown timers for registration deadlines and competition dates
* **Rich Competition Details**: Comprehensive information including eligibility criteria, prize structures, and official resources

**Content Management**
* **Creator Dashboard**: Intuitive interface for competition creators to manage their listings
* **Multi-step Competition Creation**: Guided form process with preview and validation
* **Rich Media Support**: Image galleries, embedded videos, and document attachments
* **Draft & Publishing System**: Save drafts and schedule publication dates

#### 2.2 Advanced Features (Future/Optional)

**AI-Powered Recommendations**
* **Personalized Matching**: Algorithm considers user age, academic performance, interests, and preferences
* **Machine Learning Integration**: (Future enhancement)
* **Multi-factor Scoring**: Evaluates competition fit based on multiple criteria simultaneously
* **Trend Analysis**: (Future enhancement)

**Administrative Capabilities**
* **User Management**: Comprehensive admin panel for managing user accounts and roles
* **Content Moderation**: Tools for reviewing and approving competition submissions
* **Analytics Dashboard**: Detailed insights into user engagement, popular competitions, and platform usage (basic analytics via logging and database queries)
* **Export Capabilities**: Data export in multiple formats for analysis and reporting

**Performance & Scalability**
* **High-Performance Architecture**: Optimized for fast loading and smooth user experience
* **Caching Strategy**: Intelligent caching of frequently accessed data (optional, can use in-memory or database-level caching)
* **Database Optimization**: Efficient queries and indexing for large datasets
* **Auto-scaling**: Infrastructure that adapts to traffic demands

#### 2.3 Technical Capabilities

**Security & Privacy**
* **Secure Authentication**: JWT-based authentication with refresh token rotation
* **Role-Based Access Control**: Granular permissions for different user types
* **Data Protection**: Encryption of sensitive data and secure API communications
* **Privacy Compliance**: GDPR-ready data handling and user consent management
* **Regular Security Audits**: Automated security scanning and vulnerability assessments

**Integration & APIs**
* **RESTful API**: Comprehensive API for third-party integrations

**Monitoring & Analytics**
* **Basic Logging**: Application and error logs using Python’s logging module
* **Cloud Monitoring (optional)**: Use AWS CloudWatch or similar for resource metrics
* **User Behavior Analytics**: Insights into how users discover and interact with competitions (via logs and database queries)
* **Competition Performance Tracking**: Analytics on competition popularity and engagement (via logs and database queries)

---

### 3. Frontend Design

#### 3.1 Global Layout

* **Header:**

  * Logo on left, navigation links (Home, Competitions, How it Works), and call‑to‑action buttons (Sign In / Sign Up or Profile Menu when logged in).
  * Sticky behavior: header remains at top on scroll.
* **Footer:**

  * Four columns: About SCI, Quick Links, Contact Info, Social Media icons.
  * Background: dark theme with contrasting text.
* **Background Layer:**

  * A subtle SVG or pattern fixed behind main content, with low opacity and responsive adjustments.

#### 3.2 Pages & Components

##### 3.2.1 Home Page

The Home Page is designed to inspire, inform, and guide users through the SCI platform’s core value proposition. It uses a modern, visually engaging layout with smooth transitions and interactive elements, leveraging React, Chakra UI, Swiper.js, and Framer Motion for a seamless user experience.

* **Hero Section**
  * Soft, full-width gradient background (white to very-light-grey) behind a central headline: “Empowering the Next Generation of STEM Leaders.”
  * Two-line supporting paragraph introducing the platform’s mission.
  * No call-to-action button here; the primary CTA is relocated to the Resource Library section below.

* **Impact Metrics Strip**
  * Three circular-icon cards, centered and evenly spaced, highlight platform impact:
    * 10,000+ Students Mentored
    * 500+ Competition Winners
    * 50+ Partner Schools
  * Uses Chakra UI cards with icon badges and responsive flex/grid layout.

* **Understanding STEM Competitions**
  * Section heading: “Understanding STEM Competitions”.
  * Brief definition paragraph: “What is STEM?”
  * Four discipline tiles (Science, Technology, Engineering, Mathematics) with pastel icon badges, arranged in a responsive grid.

* **Benefits of Participating**
  * Two-column grid of bordered cards, each representing a key benefit:
    * Critical Thinking
    * Collaboration
    * Achievement Recognition
    * Career Preparation
  * Cards use hover effects for interactivity and accessibility.

* **Resource Library**
  * Horizontal Swiper carousel featuring resource cards (e.g., Guide, Math Olympiad, Science Fair Ideas, Robotics Programming).
  * Primary call-to-action button (“Find the Competition That Fits You”) is centered below the carousel, styled with a black background, rounded corners, and shadow.
  * On click, triggers smooth scroll and vertical expansion animation (Framer Motion) to reveal the Recommendation Wizard Panel.

* **Recommendation Wizard Panel**
  * Initially hidden; revealed after CTA click with a slide-open animation.
  * Contains four accordion-style boxes (only one expanded at a time):
    1. Demographics — Age slider, GPA dropdown.
    2. Profile — Achievements textarea, Interest Areas checkbox grid.
    3. Preferences — Competition Scale (Global/Regional/Local), School Type (Gifted/Other).
    4. Review & Submit — Summary card with inline edit icons, Submit button.
  * On submit, shows a loading spinner, then displays a grid of the top 10 recommended competitions (image, title, quick-view link).

* **Explore More**
  * Section appears after the wizard (renamed from “What SCI Provides?”).
  * Three hover-lift cards:
    * AI Recommendations — explains the matching algorithm.
    * Global Database — highlights 2,000+ competitions indexed.
    * Easy Management — describes the personal dashboard for deadlines & documents.
  * Cards use scale and shadow effects for interactivity.

##### 3.2.2 Competitions List Page

* **Search & Filters Bar:**

  * Search input with debounce (300 ms).
  * Filters: Date range picker, area (dropdown), scale (checkbox group), free/paid toggle.
* **Competitions Grid:**

  * Responsive grid (2‑3 columns on tablet/desktop, 1 on mobile).
  * Each card: thumbnail, title, short tagline, tags (chips), "View Details" button.
* **Pagination Controls:**

  * Previous/Next with page numbers

##### 3.2.3 Competition Detail Page

* **Header:** Competition title, location tags, start/end dates, registration deadline countdown (using dayjs for live update).
* **Image Carousel:**

  * If multiple images; fallback to default placeholder.
* **Information Sections (Accordion style on mobile):**

  1. **Metadata:** Creator name (link to creator profile), published date.
  2. **General Info:** Table layout: dates, age range, scale, location.
  3. **Eligibility & Prizes:** Rich text with markdown parser.
  4. **Description & Resources:** Links to official sites, docs.
* **Call‑to‑Action:** "Register Now" button (opens external URL in new tab).
* **Related Competitions:** Carousel of 4 similar competitions (based on tags).

##### 3.2.4 Authentication & Dashboards

* **Sign up / Login Pages:**

  * Simple forms (email, password, confirm, role hidden = creator).
  * OAuth options (Google, GitHub) for creators.
* **User Dashboard:**

  * **List View:** Table of user’s competitions with status badges (Draft, Published, Expired).
  * **Actions:** Buttons to Edit, Delete, Publish/Unpublish.
  * **Create Competition:** Floating action button opens multi‑step form similar to detail creation (with preview step).
* **Admin Dashboard:**

  * **User Management:** Table of all users with roles; actions to promote/demote or deactivate.
  * **Competition Management:** Global CRUD on competitions; bulk actions (e.g., batch delete, export CSV).
  * **Analytics:** Charts showing number of competitions per month, top categories (use recharts), number of visitors to website/visit competition.

#### 3.3 State Management & API Integration

* Global state with React Query for data fetching/caching.
* Authentication context to store JWT and refresh token handling.
* Axios instance with interceptors for auth headers and error handling.
* Form state with Formik/Yup for validation.

---

### 4. Backend Design

#### 4.1 Architecture & Frameworks

* **FastAPI** with ASGI (uvicorn) for performance.
* **PostgreSQL** as primary database; **SQLModel** + Alembic for migrations.
* **SQLModel** for both ORM and data validation (no duplicate models).
* **Alembic** for database migrations and schema management.
* **Passlib** with bcrypt for secure password hashing.
* **PyJWT** for JWT token management.
* **Basic logging** for error and event tracking.

#### 4.2 Data Models (Pydantic & SQLAlchemy)

* **User**: id, name, email, hashed_password, role (Enum: ADMIN, CREATOR), created_at.
* **Competition**: id, title, description, images (JSON list), start_date, end_date, registration_deadline, age_min, age_max, area, scale, location, prize_structure (JSON), eligibility_text, official_url, creator_id (FK), created_at, updated_at.
* **RecommendationProfile**: id, user_id, age, gpa, achievements_text, interests (array), scale_preference (array), school_type.
* **RoleAssignment**: user_id, role, assigned_by, assigned_at.

#### 4.3 API Endpoints

| Method | Path               | Description                                      | Auth Required?   |
| ------ | ------------------ | ------------------------------------------------ | ---------------- |
| POST   | /auth/signup       | Create new creator account                       | No               |
| POST   | /auth/login        | Obtain JWT tokens                                | No               |
| GET    | /competitions      | List competitions with query params              | No               |
| GET    | /competitions/{id} | Retrieve detailed competition info               | No               |
| POST   | /competitions      | Create competition                               | CREATOR or ADMIN |
| PUT    | /competitions/{id} | Update competition                               | Creator or ADMIN |
| DELETE | /competitions/{id} | Delete competition                               | Creator or ADMIN |
| GET    | /users             | List users (admin only)                          | ADMIN only       |
| PUT    | /users/{id}/role   | Change user role                                 | ADMIN only       |
| POST   | /recommendations   | Provide recommendations based on profile payload | No               |

#### 4.4 Authentication & Security

* JWT tokens (access + refresh) with OAuth2 Password flow.
* Passwords hashed with bcrypt.
* Role‑based dependencies in FastAPI for route protection.
* Rate limiting (optional, can be added later if needed).

#### 4.5 Recommendation Engine

* Simple rule‑based scoring on attributes (age, gpa, areas).
* Future enhancement: integrate a small ML model (e.g., scikit‑learn) to learn preferences.

#### 4.6 Background Tasks & Notifications

* Use FastAPI’s BackgroundTasks for non-blocking jobs (e.g., sending emails).
* For scheduled jobs (e.g., daily cleanup), use cron jobs or simple Python scripts.

#### 4.7 Logging & Monitoring

* Basic logging with Python’s logging module for errors and events.
* Optional: Use cloud provider monitoring (e.g., AWS CloudWatch) for resource metrics.

---

### 5. Deployment & DevOps

#### 5.1 Infrastructure

* **AWS EC2 (Ubuntu 22.04)**: t3.small instance.
* **Security Groups:** Allow HTTP/HTTPS (80/443) and SSH.
* **Docker Compose**:
  * `frontend` service (React built to static files served by Nginx).
  * `backend` service (Uvicorn + FastAPI).
  * `db` service (PostgreSQL volume).

#### 5.2 Reverse Proxy & TLS

* **Nginx** as reverse proxy for both frontend (port 80/443) and backend (/api to FastAPI).
* **Certbot** automated certificate renewal for domain SSL.
* **Route 53** managed DNS records pointing `www.sci-example.com` and apex domain to EC2 Elastic IP.

#### 5.3 CI/CD Pipeline (GitHub Actions)

* **On push to `main` (optional):**
  1. Run linting (ESLint for frontend, flake8 for backend).
  2. Run tests (Jest for React, pytest for FastAPI).
  3. Build Docker images and push to GitHub Container Registry.
  4. SSH into EC2, pull latest images, run `docker-compose pull && docker-compose up -d --build`.
* **Manual deployment is supported and recommended for MVP.**

#### 5.4 Monitoring & Backups

* **Basic logging** for application and error events.
* **CloudWatch** or similar (optional) for resource metrics.
* Daily backups of PostgreSQL via `pg_dump` to S3 bucket.

---

### 6. Roadmap & Future Enhancements

1. **User Reviews & Ratings** for competitions. (Future)
2. **Social Login expansion (Facebook, LinkedIn).** (Future)
3. **Mobile App (React Native) sync.** (Future)
4. **Advanced ML Recommendations using user behavior.** (Future)
5. **Multi‑language Support (i18n) for global audience.** (Future)
