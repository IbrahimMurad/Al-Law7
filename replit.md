# Quran Manuscript Tracker

## Overview

A mobile-first web application designed for a Sheikh (Islamic teacher) to manage and track Quran manuscript recitations (loo7 - لوح) for students. The system enables daily assignment creation, progress tracking, and performance evaluation of Quran memorization through a right-to-left Arabic interface optimized for mobile use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React 18 with TypeScript for type-safe component development
- Wouter for lightweight client-side routing (no React Router)
- Vite as build tool and development server with hot module replacement

**UI Component System**
- Shadcn UI components (New York style variant) built on Radix UI primitives
- Material Design 3 principles for mobile-first, RTL-optimized layouts
- Tailwind CSS for utility-first styling with custom design tokens
- Component aliases configured for clean imports (`@/components`, `@/lib`, etc.)

**State Management**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod resolvers for form validation
- Local component state with React hooks

**Design System**
- RTL (right-to-left) layout by default for Arabic text
- Custom typography: Noto Sans Arabic for UI, Amiri Quran for Quranic text
- Mobile-optimized with minimum 48px touch targets
- Spacing based on Tailwind's spacing scale (4, 6, 8, 12, 16px units)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for REST API endpoints
- ESM (ES Modules) throughout the codebase
- Custom middleware for request logging and JSON response capture

**API Structure**
- RESTful endpoints organized by resource:
  - `/api/students` - Student CRUD operations
  - `/api/loo7` - Manuscript assignment management
  - `/api/quran/surahs` - Quran metadata retrieval
- Request validation using Zod schemas shared between client and server
- Centralized error handling with appropriate HTTP status codes

**Data Access Layer**
- Storage abstraction interface (`IStorage`) allowing multiple implementations
- In-memory storage implementation (`MemStorage`) for development
- Designed to swap in database implementations (PostgreSQL via Drizzle ORM configured but not currently connected)

### Database Schema

**Design Pattern**
- Drizzle ORM configured for PostgreSQL with schema-first approach
- Schema definitions in TypeScript generate both database migrations and Zod validators
- Cascade deletion for student-loo7 relationships

**Core Entities**

*Students Table*
- UUID primary key with server-generated defaults
- Fields: name (required), age, contact info, notes (all optional except name)
- Timestamps for creation and updates

*Loo7s (Manuscripts) Table*
- UUID primary key
- Foreign key to students with cascade delete
- Loo7 type enum: "new", "near_past", "far_past" (memorization recency)
- Quran reference: surah number/name, start/end aya numbers
- Recitation tracking: date, status (pending/completed), completion timestamp
- Evaluation: score enum (excellent/good/weak/repeat), optional notes

### External Dependencies

**Quran Data API**
- External API integration for retrieving Quran text (surahs and ayas)
- Data includes surah metadata (names, numbers, aya counts)
- Used for displaying verses during assignment creation and evaluation

**Database Provider**
- Neon serverless PostgreSQL configured via `@neondatabase/serverless`
- Connection via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations to `./migrations` directory

**Font Services**
- Google Fonts CDN for Arabic typography (Noto Sans Arabic, Amiri Quran)
- Preconnect optimization for faster font loading

**Development Tools**
- Replit-specific plugins for development (runtime error overlay, cartographer, dev banner)
- Only loaded in development environment via conditional imports

### Key Architectural Decisions

**Mobile-First Approach**
- Rationale: Primary user (Sheikh) manages students from mobile device
- Implementation: RTL layouts, large touch targets (48px minimum), responsive containers (max-width: 2xl)
- Trade-off: Desktop experience is adequate but not optimized

**Type-Safe Data Flow**
- Rationale: Prevent runtime errors from invalid data shapes
- Implementation: Shared Zod schemas between client/server, TypeScript throughout
- Benefit: Compile-time validation catches issues before deployment

**Storage Abstraction**
- Rationale: Decouple business logic from data persistence implementation
- Current state: In-memory storage for rapid prototyping
- Future path: Swap to PostgreSQL implementation without changing route handlers
- Trade-off: Additional abstraction layer adds complexity but provides flexibility

**Modular UI Components**
- Rationale: Reusable, accessible components reduce development time
- Implementation: Shadcn UI provides pre-built primitives on top of Radix
- Benefit: Accessibility features (ARIA attributes, keyboard navigation) built-in

**Query-Based Data Fetching**
- Rationale: Automatic caching, background updates, optimistic updates
- Implementation: TanStack Query with custom query functions
- Configuration: Infinite stale time, disabled automatic refetching (manual refresh preferred)