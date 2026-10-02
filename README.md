# Senthuron Ops

## 1. Project Name
Senthuron Ops

## 2. Candidate Name
Jogesh Joshua

## 3. Selected Track
Full Stack

## 4. Project Overview
Senthuron Ops is a centralized business operations and client enquiry management web application. It empowers the Senthuron Tech team to capture, manage, and track incoming leads and client requests across a structured lifecycle, offering a single source of truth for all business opportunities and follow-ups.

## 5. Problem Understanding
Service-based teams often struggle with leads and enquiries scattered across multiple channels (WhatsApp, Instagram, Email, Direct). This fragmentation makes it difficult to track the current status of an enquiry, assign ownership, schedule follow-ups, and review historical activity. Senthuron Ops addresses this by centralizing all leads into a unified dashboard and pipeline track, providing clear visibility into team workload, overdue follow-ups, and financial pipeline value.

## 6. Features Implemented

### Completed

| Feature | Description |
|---------|-------------|
| **Dashboard metrics** | Provides a summary of open pipeline value, win rate, and total active enquiries. |
| **Enquiry listing** | A detailed, paginated table of all enquiries displaying client details, service type, and budget. |
| **Search** | Full-text search by client name, contact person, reference number, and phone number. |
| **Filtering** | Filter enquiries by their current status, due date (e.g., Overdue, Due Today), and service type. |
| **Pagination** | Server-side pagination handling. |
| **Enquiry details** | A dedicated view for each enquiry displaying full context, current stage, handling options, and activity logs. |
| **Status management** | Move enquiries across stages (New, Contacted, Qualified, Proposal Sent, Negotiation, Won, Lost). |
| **Assignment management** | Assign specific team members to handle individual enquiries. |
| **Follow-up date management** | Schedule and clear next follow-up dates to keep pipeline momentum. |
| **Notes** | Add rich text notes to an enquiry during status or detail updates. |
| **Activity/history tracking** | Immutable timeline recording all status changes, assignments, and notes with timestamps and actor names. |
| **Enquiry creation** | Server-validated form for capturing new client leads. |
| **Form validation** | Strong schema-based validation using Zod for robust data integrity. |
| **Responsive layouts** | Mobile-friendly navigation (bottom tab bar on mobile) and responsive grid layouts. |
| **Authentication** | Full integration with `better-auth` for secure session management. |
| **Server-side authorization** | Robust backend guards protecting all mutation API endpoints from unauthenticated access. |

### Partially Completed

| Feature | Description |
|---------|-------------|
| **Test Coverage** | Core utility and validation functions are covered with Vitest, but end-to-end integration tests are not implemented. |

### Not Implemented

| Feature | Description |
|---------|-------------|
| **Role-Based Access Control (RBAC)** | There are no tiered roles (e.g., Admin vs User). All authenticated users currently have equal permissions. |
| **Email Notifications** | Automated email reminders for follow-ups are not implemented. |

## 7. Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js (v16.3.7) | Full-stack React framework, routing, and API endpoints |
| React (v19) | UI library and component rendering |
| Tailwind CSS (v4) | Utility-first styling framework |
| PostgreSQL / Neon | Relational database |
| Prisma (v7.10) | Type-safe Database ORM and schema management |
| Better-auth (v1.7) | Authentication and session management |
| Zod (v4.6) | Schema declaration and input validation |
| Vitest (v5.0) | Unit testing framework |
| Vercel | Production build and hosting platform |

## 8. Architecture / Project Structure
The application follows the Next.js App Router paradigm, strictly separating server logic from client presentation.

```
senthuron-ops/
├── prisma/               # Database schema, migrations, and seed scripts
├── tests/                # Vitest unit test files
├── src/
│   ├── app/              # Next.js App Router pages, layouts, and API routes
│   │   ├── (app)/        # Protected and public application views (Dashboard, Enquiries)
│   │   └── api/          # Server API endpoints handling JSON payloads
│   ├── components/       # Reusable React components
│   │   ├── auth/         # Authentication dialogs and guards
│   │   ├── dashboard/    # Dashboard widgets and chips
│   │   ├── enquiries/    # Enquiry forms, tracks, lists, and activity feeds
│   │   └── layout/       # Sidebars, topbars, and mobile navigation
│   └── lib/              # Core business logic and shared utilities
│       ├── services/     # Server-side data access layer (Prisma wrappers)
│       ├── validation/   # Zod schemas for API payload validation
│       └── db.ts, env.ts # Singleton initializations
```

Data flows from the frontend components making standard fetch requests to the `api/` routes. The API routes enforce authorization (via `auth-guard.ts`), validate payloads (via Zod schemas), and invoke the `services/` layer to interact safely with the Prisma database client.

## 9. Setup Instructions
To run this project locally, ensure you have Node.js (v20+) and an active PostgreSQL database (e.g. locally or via Neon).

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jogesh-Joshua/senthuron-ops.git
   cd senthuron-ops
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your specific database strings and auth secrets.
   ```bash
   cp .env.example .env.local
   ```
4. **Setup the database:**
   Run migrations and generate the Prisma client.
   ```bash
   npm run db:migrate
   ```
5. **(Optional) Seed the database:**
   Populate the database with test team members and enquiries.
   ```bash
   npm run db:seed
   ```
6. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

- Note: To run the unit tests, use `npm test`.

## 10. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Primary connection string for the PostgreSQL database (used by Prisma). | Yes |
| `DIRECT_URL` | Direct, non-pooled connection string used specifically for Prisma migrations. | Optional |
| `APP_TIMEZONE` | The business timezone for calculating "today" and formatting dates (defaults to `Asia/Kolkata`). | No |
| `NODE_ENV` | Application environment state (`development`, `test`, `production`). | No |
| `BETTER_AUTH_SECRET` | Secret key used to sign and encrypt session tokens. | Yes |
| `BETTER_AUTH_URL` | Base URL of the application for authentication redirects (e.g., `http://localhost:3000`). | Yes |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google Sign-In integration. | No |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret for Google Sign-In integration. | No |

## 11. Demo / Hosted URL
[Open Senthuron Ops](https://senthuron-ops.vercel.app/)

## 12. Test Credentials
No public test credentials have been hardcoded into the application for security reasons. Anonymous reviewers may view the dashboard and browse enquiries in a read-only state. 

To test write operations (creating/updating enquiries), you must sign in. You may use the **Google Sign-In** option provided on the authentication modal to quickly create a session using your own Google account, assuming the OAuth configuration permits it.

## 13. AI Usage Declaration
AI tools were used during the development of this project.

Tools used:
- Claude
- Antigravity

AI was used for:
- Product and UX brainstorming
- UI/UX design exploration
- Architecture discussion
- Code implementation assistance
- Debugging assistance
- Code review
- Documentation assistance

All AI-assisted output was reviewed, tested and modified as necessary before inclusion in the final submission. I remain responsible for the architecture, implementation, testing, deployment and explanation of the submitted project.

## 14. Known Limitations
- **Google OAuth Verification:** If the Google OAuth app has not been verified for production use, new users attempting to sign in may see a Google "Unverified App" warning.
- **Public Read Access:** Currently, viewing dashboard metrics and reading enquiry details is publicly accessible without authentication. While this is intentional for a portfolio demonstration, a real enterprise application would likely enforce authentication globally.
- **Pagination Constraints:** The maximum page size is hardcoded to 50 items. Users cannot fetch bulk exports larger than this without direct database access.

## 15. Future Improvements
- **More granular role-based access control:** Differentiating between "Admin" (can delete enquiries) and "Agent" (can only update assigned enquiries).
- **Automated follow-up reminders:** Integrating an email or push notification service to alert team members of overdue follow-ups.
- **Better analytics:** Implementing chart-based historical reporting for enquiries won/lost over time.
- **Production hardening:** Enforcing stricter global authentication, rate limiting API endpoints, and implementing CSRF protections for state-mutating requests.
