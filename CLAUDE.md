# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Frontend:**
- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Backend:**
- `cd backend && bun run dev` - Start backend server on port 3002
- `cd backend && bun run migrate` - Run database migrations
- `cd backend && bun run clear-users` - Clear all users from database
- `cd backend && bun run test-connection` - Test backend connectivity
- `cd backend && bun run test` - Run Jest tests

## Project Architecture

This is a full-stack study platform with React frontend and Node.js backend:

**Frontend Structure:**
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Radix UI components with Tailwind CSS
- **State:** React Query for server state, Context API for auth
- **Routing:** React Router with protected routes
- **Auth:** Custom AuthContext with localStorage persistence

**Backend Structure:**
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL
- **Auth:** JWT tokens with bcrypt password hashing
- **API:** RESTful endpoints under `/api/`

**Key Frontend Components:**
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/ProtectedRoute.tsx` - Route protection wrapper
- `src/pages/` - Main application pages (Feed, Perfil, Amigos, etc.)
- `src/components/ui/` - Reusable UI components (shadcn/ui)

**Backend API:**
- Authentication endpoints at `http://localhost:3002/api/auth/`
- Profile management at `http://localhost:3002/api/profile/`

## Configuration

**Build Tools:**
- Vite with React SWC plugin
- TypeScript with strict configuration
- ESLint with React hooks plugin
- Tailwind CSS with shadcn/ui components

**Path Aliases:**
- `@/` maps to `./src/`

**Development Servers:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3002

## Database Setup

Requires PostgreSQL database. Backend uses migrations system:
1. Ensure PostgreSQL is running
2. Configure database credentials in `backend/.env`
3. Run `cd backend && bun run migrate`

## Dependencies

**Frontend Stack:**
- React Query for API state management
- Radix UI for accessible components
- React Hook Form with Zod validation
- Lucide React for icons
- Date-fns for date utilities

**Backend Stack:**
- Express with CORS and Helmet
- PostgreSQL with pg driver
- Passport.js for OAuth (Facebook, Google, GitHub)
- Nodemailer for emails
- Rate limiting and validation middleware

## Development Notes

- Uses Bun as package manager for backend
- Frontend auth persists to localStorage
- Backend API expects `Authorization: Bearer <token>` headers
- All routes except `/auth` are protected
- Onboarding modal appears for new users
- Hot module reloading configured for development