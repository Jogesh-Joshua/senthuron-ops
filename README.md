# Senthuron Ops

A business operations dashboard and enquiry management system for tracking incoming leads, prioritizing follow-ups, and managing the sales pipeline. 

## Features
- **Dashboard**: High-level metrics, stage distribution, and urgent follow-up tracking.
- **Enquiry Management**: Create, view, search, filter, and edit enquiries.
- **Activity Log**: Automatic timeline of state changes and manual notes.
- **Ledger Aesthetics**: Professional, structured, high-density UI optimized for desktop scanning.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (Strict mode)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma 7 (with `@prisma/adapter-pg`)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest

## Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file based on the table below. If using Neon, create separate branches for development and testing.

3. **Database Setup**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string for your PostgreSQL database (e.g. Neon connection pooler URL). |

## Scripts
- `npm run dev` - Starts the Next.js development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint.
- `npm run test` - Runs Vitest test suite.
- `npm run db:migrate` - Applies Prisma migrations.
- `npm run db:seed` - Seeds the database with test data.
- `npm run db:generate` - Generates Prisma client.

## API Endpoints

- `GET /api/enquiries` - List enquiries (supports search, filters, pagination).
- `POST /api/enquiries` - Create a new enquiry.
- `GET /api/enquiries/:id` - Get a specific enquiry with activity history.
- `PATCH /api/enquiries/:id` - Update an enquiry.
- `GET /api/team-members` - List active team members.
- `GET /api/health` - Simple health check endpoint.

## Key Decisions
- **Service Layer**: All database access happens in `src/lib/services/*.ts`. Route handlers and React Server Components call these services; they do not query Prisma directly.
- **URL-Driven Filters**: Dashboard and list filters sync to the URL `searchParams`, ensuring shareable links and proper browser history. Next.js 16 requires treating `searchParams` as Promises.
- **Date-only Follow-ups**: Follow-up dates are stored in the database as pure dates (`YYYY-MM-DD`). The server manages the current date context; no client timezone math is performed.
- **No Auth**: Authentication and authorization are explicitly excluded from this phase.

## Assumptions & Out of Scope
- No authentication or role-based access control.
- No user management UI.
- No real-time updates (WebSockets).
- Dashboard is strictly for top-level aggregation, not highly-customisable per user.
- Focus is on desktop ops layout, not a fully mobile-first responsive design, though it degrades gracefully.

## Known Limitations
- The `EnquiryFilters` casting relies on React synthetic events which requires a double-cast via `unknown`.
- Neon cold starts might occasionally cause the first request to be slower.
