# SCI Frontend

React + TypeScript frontend for the Science Competitions Insight (SCI) platform.

## 🚀 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible UI components
- **React Hook Form** - Form handling
- **Yup** - Schema validation
- **Swiper** - Carousel component
- **Date-fns** - Date utilities
- **Lucide React** - Icons

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── Common/         # Common layout components
│   ├── Competition/    # Competition-specific components
│   ├── Auth/          # Authentication components
│   └── Admin/         # Admin dashboard components
├── routes/            # TanStack Router route definitions
│   ├── __root.tsx     # Root layout
│   ├── index.tsx      # Home page
│   ├── competitions/  # Competition routes
│   ├── auth/         # Authentication routes
│   └── dashboard/    # Dashboard routes
├── hooks/            # Custom React hooks
├── services/         # API service functions
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── client/          # API client configuration
└── main.tsx         # Application entry point
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run generate:routes` - Generate TanStack Router route tree

## 🎨 Styling

The project uses **Tailwind CSS** with a custom design system:

- **CSS Variables** - For theme colors and dark mode support
- **Custom Components** - Base button and layout classes
- **Responsive Design** - Mobile-first approach
- **Design Tokens** - Consistent spacing, typography, and colors

### Custom CSS Classes

```css
.btn-primary    /* Primary button style */
.btn-secondary  /* Secondary button style */
.btn-outline    /* Outlined button style */
.btn-ghost      /* Ghost button style */

.container-padding  /* Consistent container padding */
.section-spacing   /* Consistent section spacing */
```

## 🚦 Routing

Uses **TanStack Router** for type-safe routing:

- **File-based routing** - Routes defined in `src/routes/`
- **Type safety** - Full TypeScript support
- **Code splitting** - Automatic route-based splitting
- **Route generation** - Auto-generated route tree

### Route Structure

- `/` - Home page
- `/competitions` - Competition listing
- `/competitions/$id` - Competition details
- `/auth/login` - Login page
- `/dashboard` - User dashboard
- `/admin` - Admin dashboard

## 📊 State Management

- **TanStack Query** - Server state management and caching
- **React Context** - Client state and auth state
- **React Hook Form** - Form state management

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.eslintrc.cjs` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `tsr.config.json` - TanStack Router configuration

## 🌐 API Integration

The frontend is configured to proxy API requests to the FastAPI backend:

- **Development proxy** - `/api/*` requests routed to `http://localhost:8000`
- **Axios client** - Configured with base URL and interceptors
- **React Query** - Automatic caching and background updates

## 🧪 Testing

- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **Jest DOM** - DOM testing utilities

## 🏗️ Build & Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Preview production build:**
   ```bash
   npm run preview
   ```

The build outputs to the `dist/` directory and includes:
- Code splitting by route and vendor libraries
- CSS optimization and purging
- Asset optimization and hashing

## 🔄 Development Workflow

1. **Code formatting** - Prettier formats on save
2. **Linting** - ESLint runs on file changes
3. **Type checking** - TypeScript validates on build
4. **Hot reload** - Instant updates during development
5. **Route generation** - Auto-generated on route file changes

## 📦 Key Dependencies

### Production
- `@tanstack/react-router` - Type-safe routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `@radix-ui/*` - Accessible UI primitives
- `tailwindcss` - CSS framework
- `swiper` - Carousel component

### Development
- `vite` - Build tool
- `typescript` - Type checking
- `eslint` - Code linting
- `prettier` - Code formatting
- `vitest` - Testing framework

## 🎯 Next Steps

With the frontend foundation complete, you can now:

1. **Implement authentication components** - Login forms, protected routes
2. **Create competition components** - Cards, lists, detail views
3. **Build dashboard interfaces** - User and admin dashboards
4. **Add recommendation wizard** - AI-powered recommendation modal
5. **Integrate with backend API** - Connect to FastAPI endpoints

The development server is running and ready for building the SCI platform! 🚀 