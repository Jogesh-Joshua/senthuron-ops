# Senthuron Ops — Authentication: Architecture, Security Review and Implementation Plan

**Status:** planning only. No repository code was modified.
**Repository inspected:** `github.com/Jogesh-Joshua/senthuron-ops`, commit `13f5eca` ("Prepare project for code review"), read directly from a clone.
**Design reference:** your dashboard screenshot (2 Oct 2026).

**Evidence labels used throughout**

| Label | Meaning |
|---|---|
| **[V]** | Verified by reading the repository (file and line given). |
| **[D]** | Verified in the library's official documentation or the npm registry during this review. |
| **[R]** | My recommendation. |
| **[A]** | An assumption I had to make. Please confirm. |

---

## 0. Scope, sources and what I could not verify

**Sources used**
- Repository files: `package.json`, `package-lock.json`, `next.config.ts`, `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/**`, every route under `src/app/api`, all pages, the layout, sidebar, mobile nav, the enquiry components, and `src/app/globals.css`.
- Better Auth official documentation (Next.js integration, Prisma adapter, Email & Password, options reference, security, signup-disabled error page) and the npm registry, queried today.
- Your screenshot.

**Important discrepancy: your local app is ahead of GitHub [V]**
- The screenshot shows an interlocking-knot logo. `Sidebar.tsx:30–35` at commit `13f5eca` still renders the 20px outlined-square mark.
- The screenshot's quick actions and activity entries (e.g. ENQ-0033 created, status changed, assigned, follow-up set, details updated) imply the create/update bugs from my earlier review (C1–C3) are fixed locally. At `13f5eca` they are not.
- **Push your latest code, or have Antigravity re-read the files below before editing.** Line numbers in this document are for `13f5eca` and may have moved.

**Not verified**
- **Runtime behaviour.** I did not run the app (no database credentials) and did not install or execute Better Auth in your project.
- **Better Auth CLI output.** I did not run `npx auth@latest generate`, so the Prisma models in §5 are a sketch from the documented core schema. Compare them with the CLI output for the exact version you install.
- **Exact error-code strings** returned by Better Auth for duplicate accounts and bad credentials. Read them from the installed client (`authClient.$ERROR_CODES`) rather than trusting this document.
- **Google Cloud Console.** Steps in §8 follow Google's standard OAuth flow; the callback path is verified in Better Auth's docs.
- **Hidden files in your local copy** (for example an edit page if you created one). The plan names the places to gate if they exist.

---

## 1. Verified summary of the current architecture

### 1.1 Stack and tooling [V]

| Item | Value | Source |
|---|---|---|
| Next.js | 16.3.7, App Router, no `proxy.ts` / `middleware.ts` | `package.json`; file search |
| React | 19.2.8 | `package.json` |
| TypeScript / Tailwind | TS 5; Tailwind 4.3.3 | `package.json` |
| Prisma | 7.10.0, `@prisma/client` ^7.10, `@prisma/adapter-pg` ^7.10, `pg` 8.23 | `package.json` |
| Prisma generator | `prisma-client-js`, output `../src/generated/prisma` (git-ignored, `.gitignore:48`) | `schema.prisma:3–6` |
| Validation | Zod 4.6.5 | `package.json` |
| Other dependencies | `sonner`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `dotenv`, `server-only` (several are unused; see my code review) | `package.json` |
| Scripts | `build` = `prisma generate && next build`; `vercel-build` = `prisma migrate deploy && next build`; `db:seed` = `tsx prisma/seed.ts --reset` (**destructive**); `lint` = `eslint` | `package.json` |
| Lockfile | `package-lock.json` (npm) | repo root |
| Tests | None (no Vitest/Jest/Playwright config) | file search |
| Server actions | None (`"use server"` appears nowhere in `src`) | grep |
| Existing UI primitives | **None.** No modal, dropdown, popover or Radix. Only CSS classes in `globals.css` (`.btn-primary:513`, `.btn-secondary:537`, `.btn-sm:561`, `.input-field`, `.field-label`, `.field-error`, `.error-panel:1012`) and Sonner toasts | `globals.css`; `app/layout.tsx:63` |

### 1.2 Routes and layout [V]

| Path | File |
|---|---|
| `/` (dashboard) | `src/app/(app)/page.tsx` |
| `/enquiries` | `src/app/(app)/enquiries/page.tsx` |
| `/enquiries/new` | `src/app/(app)/enquiries/new/page.tsx` |
| `/enquiries/[id]` | `src/app/(app)/enquiries/[id]/page.tsx` |
| `/enquiries/[id]/edit` | **Does not exist at `13f5eca`** (but is linked at `[id]/page.tsx:60` and `:115`) |
| API | `src/app/api/enquiries/route.ts`, `.../[id]/route.ts`, `team-members/route.ts`, `health/route.ts` |
| Shell | `src/app/(app)/layout.tsx:13–24`: `<div class="app-shell">` containing `<Sidebar/>`, `<MobileNav/>`, `<main>` |
| Root layout | `src/app/layout.tsx`: skip link, `{children}`, global Sonner `<Toaster>` (`:63–70`), `robots: { index: false }` (`:37`) |

### 1.3 Sidebar and the exact constraint on the profile menu [V]

- `Sidebar.tsx` is an **async Server Component** that queries Prisma for the open count (`:10–19`). It renders: wordmark (`:27–41`), nav (`:44–78`), a secondary "New enquiry" link (`:80–89`), and the footer `<div class="sidebar-footer"><p class="sidebar-footer-brand">Senthuron Tech</p></div>` (`:91–94`).
- `.sidebar` (`globals.css:273–286`) is `position: sticky; top: 0; height: 100vh; **overflow-y: auto**; z-index: 20; display: flex; flex-direction: column`.
- **Consequence:** with `overflow-y: auto`, `overflow-x` also computes to `auto`, so any absolutely positioned child wider than the 232px sidebar is clipped or scrolled inside it. The sticky position plus `z-index: 20` also creates a stacking context. **An in-sidebar absolute menu will be clipped. A portal to `document.body` with `position: fixed` is required.** The mobile top bar (`globals.css:420–431`) is also `position: sticky; z-index: 20`.
- `.sidebar-footer` (`globals.css:407–411`): `padding: 16px 20px; border-top: 1px solid var(--color-rule)`. Text style `.sidebar-footer-brand` (`:413–417`): 13px, `--color-ink-3`.
- `MobileNav.tsx` (client): top bar (`:21–38`) with logo and a "New" link; bottom tab bar (`:41–85`) hidden on `/enquiries/new` and `*/edit` (`:16`). **It has no place for an auth control today.**
- Design tokens exist for everything the new UI needs: colours, `--radius: 3px`, `--radius-lg: 6px`, `--shadow-popover`, `--shadow-dialog` (`globals.css:47–57`), fonts (`--font-display` serif).

### 1.4 Write surface [V]: everything that can change data

| Layer | Item | Location |
|---|---|---|
| HTTP | `POST /api/enquiries` | `api/enquiries/route.ts:37` |
| HTTP | `PUT /api/enquiries/[id]` (and `PATCH = PUT` alias) | `api/enquiries/[id]/route.ts:36`, `:76` |
| Service | Only two Prisma write sites: `$transaction` in `createEnquiry` (`enquiry.service.ts:283`) and `updateEnquiry` (`:473`) | `enquiry.service.ts` |
| UI | `EnquiryForm` (`fetch POST`, `:108`); `HandlingPanel` (`fetch PUT`, `:51`) | `components/enquiries/` |
| Links to write UI | Sidebar `:82`; MobileNav `:31`, `:72`; dashboard header `(app)/page.tsx:147`; list header `enquiries/page.tsx:72`; detail `[id]/page.tsx:60` (Edit), `:115` (notes "Add"), `:135` (`HandlingPanel`); page `new/page.tsx:26` | as listed |
| Scripts (CLI only, not reachable over HTTP) | `prisma/seed.ts` (**wipes data with `--reset`**), `prisma/cleanup.js` (**deletes rows matching "test"**), `prisma/remove-test-data.*` | `prisma/` |

There is no other writer in `src`. That makes the server enforcement surface small: **three handlers**.

### 1.5 Read surface and publicly exposed data [V]

- Public routes: `GET /api/enquiries`, `GET /api/enquiries/[id]`, `GET /api/team-members`, `GET /api/health`, and every page.
- `ENQUIRY_SELECT` (`enquiry.service.ts:~35–50`) includes **`email`, `phone`, `description`, `notes`** (lines 37, 38, 41, 46), plus budget, assignee and the full activity list on the detail view. All of it is readable by anyone today. See §11.

### 1.6 API conventions [V]

- Success: `{ "data": … }`. Failure: `{ "error": { code, message, fieldErrors?, requestId } }` via `ok()` / `fail()` and `withErrorHandling` (`lib/api-response.ts`).
- Error classes (`lib/errors.ts`): `AppError`, `BadRequestError`, `ForbiddenOriginError`, `NotFoundError`, `ValidationError`, `InternalError`. **No `UnauthorizedError` yet.**
- Mutating handlers already begin with `assertSameOrigin(req)` then a content-type check (`enquiries/route.ts:37–48`).
- **Pre-existing defect that matters for auth [V]:** `assertSameOrigin` (`api-response.ts:109–116`) uses `origin.endsWith(host)`. `https://evilsenthuron.example` passes when the host is `senthuron.example`. Fix before relying on cookies (§6.2).

### 1.7 Database [V]

- Models: `TeamMember`, `Enquiry`, `EnquiryActivity` (`schema.prisma`). One migration: `20260930062547_init`.
- **No** `User`, `Session`, `Account`, `Verification`, or role fields. **No actor field** on `EnquiryActivity` (fields: `id, enquiryId, type, fromValue, toValue, note, createdAt`).
- The "assigned person" is `TeamMember` (seeded names), unrelated to login accounts.
- Client: `lib/db.ts` builds a `pg` `Pool` (max 5) wrapped by `PrismaPg` and exports a singleton `prisma`; the file imports `server-only`.
- `prisma.config.ts` reads `DIRECT_URL` (with a hand-rolled `.env` parser) for the CLI.

### 1.8 Environment handling [V]

- `lib/env.ts` validates `DATABASE_URL`, `DIRECT_URL?`, `APP_TIMEZONE`, `NODE_ENV` with Zod, but nothing imports it.
- `.env.example` documents unused `ACCESS_PASSPHRASE_*` variables (no gate exists). `.env` and `.env.local` are git-ignored (`.gitignore:34–38`).

---

## 2. Recommended authentication solution

### 2.1 Recommendation: Better Auth 1.7.7 [R], compatibility verified [D]

| Check | Result |
|---|---|
| Latest stable on npm | `better-auth@1.7.7`; `@better-auth/prisma-adapter@1.7.7` (npm registry) |
| Next.js | Peer range `^14 \|\| ^15 \|\| ^16`; docs state it is "fully compatible with Next.js 16" and show `proxy.ts` usage |
| React | Peer range `^18 \|\| ^19` |
| Prisma | Peer range for `prisma` and `@prisma/client`: `^5 \|\| ^6 \|\| ^7`; the Prisma adapter guide targets Prisma 7 + PostgreSQL and covers custom output paths (yours: `../src/generated/prisma`) |
| Email/password | Built in; `emailAndPassword.enabled`, `disableSignUp`, `minPasswordLength` (default 8); passwords hashed with **scrypt** (Node-native) |
| Google | Built-in social provider; callback path `/api/auth/callback/google` |
| Sessions | Server-side sessions in the database with a signed cookie; defaults `expiresIn` 7 days, `updateAge` 1 day; sign-out revokes the session |
| CSRF / redirects | Origin checks on non-GET requests; `callbackURL`, `redirectTo`, `errorCallbackURL`, `newUserCallbackURL` validated against `trustedOrigins` |
| Brute-force | Rate limiting on by default **in production only** |
| Sign-up gating | `databaseHooks.user.create.before` can throw an `APIError` to refuse account creation (documented on the "signup disabled" error page); this covers email sign-up *and* first-time Google sign-in |

**Documentation inconsistency to watch:** the Prisma adapter page tells you to install `@better-auth/prisma-adapter` but its code sample imports from `better-auth/adapters/prisma`. Both packages exist at 1.7.7. Pin both to the same version and use whichever import resolves; if both do, prefer the one the installed package's README shows. A v1.8 beta exists; do not use it.

### 2.2 Alternatives considered [D/R]

| Option | Verdict |
|---|---|
| Auth.js / NextAuth v5 | Not recommended. `next-auth`'s `latest` tag is still 4.24.x (v5 is beta), needs separate config files for proxy compatibility, and independent write-ups report friction with Prisma 7's schema/adapter changes. |
| Clerk / Auth0 / hosted auth | Not recommended. Adds an external service and cost, and you asked for your own modal and accounts persisted in your PostgreSQL. |
| Hand-rolled sessions | Not recommended. Highest security risk, and unnecessary. |

### 2.3 Intended configuration (summary) [R]

- `emailAndPassword`: enabled, `minPasswordLength: 10`, no email verification in phase 1 (no email provider exists in the repo).
- `socialProviders.google`: enabled only when both Google variables are set.
- `session`: `expiresIn` 7 days, `updateAge` 1 day. **Do not enable the cookie cache**; revoked sessions must stop working immediately (the docs note RSCs cannot refresh that cache).
- `trustedOrigins`: only the exact production origin and `http://localhost:3000` locally. Never leave localhost in production.
- `databaseHooks.user.create.before`: the invite gate (§3).
- Rate limiting: keep it on; because the in-memory store is per serverless instance, use database-backed storage so limits hold across instances. Confirm the option name when generating the schema (it adds a small `rateLimit` table). This is `[R]`: I verified rate limiting exists, not the exact storage option name.
- No separate `proxy.ts`. The app is public-read, so route-level redirects would fight the requirement. Authorization lives in the handlers (§6).

### 2.4 Forgot password: deliberately deferred [R]

A real reset flow needs `sendResetPassword`, which needs an email provider (Resend, SMTP, etc.). None is configured, so a "Forgot password?" link would be decorative, which you ruled out. Ship without it; document the recovery procedure (§12). Optional phase 9 adds it properly together with email verification.

---

## 3. Account provisioning: invite-only [R]

| Option | Pros | Cons |
|---|---|---|
| Open registration | Easiest | Any visitor can create an account and edit company data. Unacceptable with public read data. |
| **Allow-list of emails enforced server-side (recommended)** | No admin UI needed; one function; protects email *and* Google paths | Changing the list needs an env change and redeploy (fine for a small company) |
| Admin approval queue | Flexible | Needs an admin UI and roles; outside assessment scope |
| Admin-created accounts only | Strongest | Conflicts with your "Create Account" modal requirement |

**Design**
- `AUTH_SIGNUP_MODE` = `invite` (default) or `open`.
- `AUTH_ALLOWED_EMAILS` = comma-separated list, compared case-insensitively. Optional `AUTH_ALLOWED_EMAIL_DOMAIN` if Senthuron Tech has a company domain **[A: unknown]**.
- The hook rejects non-listed emails with a stable message that the modal maps to: "This email hasn't been invited to Senthuron Ops. Ask an administrator to add you."
- **No `role` column in v1.** Nothing in the app needs an administrator; all authenticated members have the same write access (your Section 8). An unauthenticated visitor therefore has no path to any privileged account. If roles are added later, make them an additional field with `input: false` so clients can never set them.

**Residual risk (be honest in the README)**
- Without email verification, someone who knows an allow-listed address could register it with a password before the real owner does. Mitigations: keep the list small; tell invited users to use **Google** (Google proves ownership of the address); enable email verification in phase 9.
- Recent Better Auth releases tightened implicit account linking so that a Google identity is linked to an existing local account only if that local email is verified. This is from a third-party summary of the changelog, so verify in the installed version. Practical effect: a user who registered with a password and later clicks Google with the same address may get a "sign in with your password" error. The modal should explain that.

**Assessment demo access [R]**
Reviewers need to create or use an account. Choose one and document it: (a) put the reviewer's email in `AUTH_ALLOWED_EMAILS`; (b) create a demo account and give the credentials in the submission (not in git); or (c) temporarily set `AUTH_SIGNUP_MODE=open` on the demo deployment. Option (c) plus public reads plus no email verification means **anyone on the internet can edit the data**. Use fictional data only and reset afterwards.

---

## 4. Files to change

### 4.1 New files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | Better Auth server config (server-only): Prisma adapter, email/password, Google, session, invite hook, `trustedOrigins` |
| `src/lib/auth-client.ts` | `createAuthClient` from `better-auth/react` |
| `src/lib/auth-guard.ts` | `getSessionUser()` (pages/layout) and `requireUser(req)` (handlers); returns `{ id, name }` |
| `src/app/api/auth/[...all]/route.ts` | `toNextJsHandler(auth)`: `GET`, `POST` (do **not** wrap in `withErrorHandling`) |
| `src/lib/validation/auth.ts` | Zod schemas for the sign-in/sign-up forms (client-side UX; Better Auth validates server-side) |
| `src/lib/safe-redirect.ts` | `safeReturnPath()` for the post-login return path |
| `src/components/auth/AuthProvider.tsx` | Client context: `user`, `openAuth()`, `signOut()`, `googleEnabled`; seeded with the server session |
| `src/components/auth/AuthModal.tsx` | `<dialog>` modal with three sliding panels |
| `src/components/auth/{WelcomePanel,SignInForm,SignUpForm,PasswordField,GoogleButton}.tsx` | Modal content |
| `src/components/auth/AuthControl.tsx` | Footer/top-bar control: Sign in button or initial avatar |
| `src/components/auth/ProfileMenu.tsx` | Portal-based floating menu |
| `src/components/auth/RequireAuthLink.tsx` | Renders a `Link` when signed in, a button that opens the modal when not |
| `src/components/auth/SignInRequired.tsx` | In-page "Please sign in to make changes" panel for write pages |
| `prisma/migrations/<timestamp>_add_auth/migration.sql` | Generated, additive migration (§5) |
| `docs/auth-setup.md` (or a README section) | Google setup, env vars, recovery procedure |

### 4.2 Existing files to modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `User`, `Session`, `Account`, `Verification` (+ optional `RateLimit`); add nullable `actorId`, `actorName` and a relation to `EnquiryActivity` |
| `package.json` / `package-lock.json` | Add `better-auth` and `@better-auth/prisma-adapter` (same pinned version) |
| `src/lib/env.ts` | Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID?`, `GOOGLE_CLIENT_SECRET?`, `AUTH_SIGNUP_MODE`, `AUTH_ALLOWED_EMAILS?`; **and import it from `db.ts`/`auth.ts`** so it actually runs |
| `.env.example` | Document the new variables; delete the unused `ACCESS_PASSPHRASE_*` lines |
| `src/lib/errors.ts` | Add `UnauthorizedError` (401, code `UNAUTHENTICATED`) |
| `src/lib/api-response.ts` | Fix `assertSameOrigin` (`:109–116`) |
| `src/app/api/enquiries/route.ts` | `POST`: `requireUser` right after `assertSameOrigin` (`:37–38`); pass `actor` to `createEnquiry` |
| `src/app/api/enquiries/[id]/route.ts` | `PUT`/`PATCH` (`:36`, `:76`): same guard; pass `actor` to `updateEnquiry` |
| `src/lib/services/enquiry.service.ts` | `createEnquiry(input, actor)` and `updateEnquiry(id, input, actor)`; write `actorId`/`actorName` on every activity row created in the two transactions (`:283`, `:473`); include `actorName` in the activity select |
| `src/lib/mappers.ts`, `src/types/dto.ts` | Add `actorName: string \| null` to the activity DTO |
| `src/components/enquiries/ActivityList.tsx`; dashboard `activitySentence` in `(app)/page.tsx` | Optionally show "by *Name*" (older rows show nothing) |
| `src/app/(app)/layout.tsx` | Read the session server-side; wrap the shell in `AuthProvider`; render `AuthModal` |
| `src/components/layout/Sidebar.tsx` | Footer: brand left, `AuthControl` right (`:91–94`); replace the New-enquiry `Link` (`:82`) with `RequireAuthLink` |
| `src/components/layout/MobileNav.tsx` | Add `AuthControl` to the top bar (`:21–38`); guard the two New links (`:31`, `:72`) |
| `src/app/(app)/page.tsx:147`, `enquiries/page.tsx:72` | Replace New-enquiry links with `RequireAuthLink` |
| `src/app/(app)/enquiries/new/page.tsx` | Render `SignInRequired` when there is no session |
| `src/app/(app)/enquiries/[id]/page.tsx:60,115,135` | Edit/Add links via `RequireAuthLink`; pass `readOnly` to `HandlingPanel` when signed out |
| `src/app/(app)/enquiries/[id]/edit/page.tsx` (**if it exists locally**) | Same `SignInRequired` gate |
| `src/components/enquiries/HandlingPanel.tsx` | `readOnly` mode (controls disabled, with "Sign in to make changes"); on `401` open the modal |
| `src/components/enquiries/EnquiryForm.tsx` | On `401` open the modal and keep the entered values |
| `src/lib/api-client.ts` | Surface the `UNAUTHENTICATED` code so callers can react |
| `src/app/globals.css` | `.sidebar-footer` as a flex row with a minimum height; styles for modal, panels, avatar, menu, password field; reduced-motion rules |
| `README.md` | Auth section: setup, invite-only policy, Google steps, known limitations |

### 4.3 Files that must not be touched or run

`prisma/seed.ts` (`--reset` wipes data), `prisma/cleanup.js`, `prisma/remove-test-data.*`. Do not run `prisma migrate reset` or `prisma db push --force-reset`.

---

## 5. Database changes and safe migration sequence

### 5.1 Required additions

| Table (model) | Why | Notes |
|---|---|---|
| `users` (`User`) | Accounts | Unique `email`; `name`, `emailVerified`, `image`, timestamps |
| `sessions` (`Session`) | Server-side sessions | Unique `token`, `expiresAt`, `ipAddress`, `userAgent`, FK to user (cascade) |
| `accounts` (`Account`) | Credential and Google identities | `providerId` = `credential` (stores the scrypt hash) or `google`; tokens for OAuth; FK to user (cascade) |
| `verifications` (`Verification`) | Tokens for email verification / reset (unused in phase 1 but part of the core schema) | Create now so phase 9 needs no further migration |
| `rate_limits` (optional) | Database-backed rate limiting | Only if you choose that storage; confirm the model from the CLI |
| `enquiry_activities` (**ALTER**) | Record who did what | Add `actorId String?` (FK → `User`, `onDelete: SetNull`), `actorName String?`, index on `actorId` |

**Roles:** not needed (see §3). **Per-user ownership:** none; `Enquiry` is untouched.
**`TeamMember`:** keep it separate from `User` **[A]**. Assigning enquiries still uses the seeded team list. Open question (§13): should signed-in users appear as assignable people?

### 5.2 Reference sketch (compare with the CLI output; do not paste blindly)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  activities    EnquiryActivity[]
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  @@index([userId])
  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
  @@map("verifications")
}

// EnquiryActivity: ADD these fields only
//   actorId   String?
//   actor     User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
//   actorName String?
//   @@index([actorId])
```

No name collides with existing models (`TeamMember`, `Enquiry`, `EnquiryActivity`) **[V]**. `@@map` keeps the snake-case table style used by your existing models; Better Auth's Prisma adapter works with Prisma model names, so `@@map` is safe.

### 5.3 Safe migration sequence

1. **Back up first [R].** In Neon, create a branch or snapshot from `main` before touching production.
2. **Work on a dev branch database**, never directly on production.
3. Commit current work, then edit `schema.prisma` (hand-written from §5.2, or via `npx auth@latest generate` and review the diff; the CLI edits the file but does not migrate).
4. Create the migration without applying it: `npx prisma migrate dev --name add_auth --create-only`.
5. **Read the generated SQL.** It must contain only `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE … ADD COLUMN`, and `ADD CONSTRAINT`. If you see `DROP`, `TRUNCATE`, or column type changes, stop.
6. If Prisma reports **drift** and offers to reset the database, **answer No**. Never run `prisma migrate reset`.
7. Apply to dev: `npx prisma migrate dev`, then `npx prisma generate`.
8. Record row counts before and after for `enquiries` and `enquiry_activities`; they must match.
9. Deploy. `vercel-build` runs `prisma migrate deploy` before `next build` (`package.json`), so the additive migration lands first. Old code keeps working against the new tables, so there is no downtime ordering problem.
10. Existing activity rows keep `actorId = NULL`; the UI simply omits "by …" for them.

**Do not** change the existing `Enquiry`, `TeamMember` or enum definitions, and do not rename existing tables.

---

## 6. Client and server authorization design

### 6.1 Principle

**Public reads, authenticated writes; the server is the authority; the UI is advisory.**

### 6.2 Server enforcement

**Guard.** `requireUser(req)` calls `auth.api.getSession({ headers: req.headers })` [D: the documented pattern; route handlers can pass request headers]. A missing or invalid session throws `UnauthorizedError`, which `withErrorHandling` converts into:

```json
{ "error": { "code": "UNAUTHENTICATED", "message": "Please sign in to make changes.", "requestId": "…" } }
```
with HTTP **401**.

**Order inside every mutating handler:** `assertSameOrigin` → `requireUser` → content-type check → JSON parse → Zod validation → service call with `actor`. Authenticating before parsing means anonymous callers learn nothing about validation.

**Fix `assertSameOrigin` first.** Compare parsed hosts: `new URL(origin).host === (x-forwarded-host ?? host)`, import `ForbiddenOriginError` normally (the current `require()` is also a lint error). Better Auth's cookie is `SameSite=Lax` by default, which already blocks most cross-site POSTs, but this check is your own defence in depth and is currently bypassable.

**Endpoint matrix**

| Endpoint | Today | After |
|---|---|---|
| `GET /api/enquiries`, `GET /api/enquiries/[id]`, `GET /api/team-members`, `GET /api/health` | public | **public (unchanged)** |
| `POST /api/enquiries` | public (!) | **401 unless signed in** |
| `PUT` and `PATCH /api/enquiries/[id]` | public (!) | **401 unless signed in** |
| `/api/auth/*` (new, Better Auth) | n/a | Owned by the library: sign-up gated by the invite hook, origin/CSRF checks, rate limits |

**Defence in depth in the service layer.** Make `actor` a required parameter of `createEnquiry` and `updateEnquiry`. TypeScript then refuses to compile any future caller that forgets to authenticate, and the actor lands on every activity row.

**Pages.** `/enquiries/new` (and `/edit` if present) server-render `SignInRequired` instead of the form when there is no session. Do **not** redirect to a separate login page; the CTA opens the modal over the current route.

**Session reading in layouts.** `(app)/layout.tsx` reads the session with `await headers()`. Those routes are already dynamic (database reads), so there is no new caching concern. One extra session query per render is acceptable on Neon.

### 6.3 Client design

- `AuthProvider` receives `initialUser` from the server layout, which prevents a signed-out flash, then follows `authClient.useSession()` so sign-in and sign-out update the sidebar immediately. After either, call `router.refresh()` so server-rendered gates (`SignInRequired`, `readOnly` panels) update.
- Context API: `{ user, openAuth({ reason, mode }), signOut(), googleEnabled }`.
- `useRequireAuth()` returns a function that runs an action if signed in, otherwise opens the modal with the banner "Please sign in to make changes."

**Gating matrix**

| Control | Logged out | Logged in |
|---|---|---|
| New enquiry (sidebar, mobile bar, mobile tab, dashboard header, list header) | Visible; click opens the modal with the banner | Link to `/enquiries/new` |
| `/enquiries/new` direct URL | `SignInRequired` panel with a Sign in button | Form |
| Edit / notes "Add" on detail | Opens the modal with the banner | Link to edit |
| `HandlingPanel` (status, assignee, follow-up) | Controls disabled (`disabled` + `aria-disabled`), note "Sign in to make changes" with a button | Active |
| Search, filters, pagination, dashboard, detail reading | Unchanged | Unchanged |

- **Session expiry mid-edit:** a `401` from the API opens the modal with "Your session has expired. Sign in to continue." The form keeps its values; nothing navigates.

### 6.4 Return path and open-redirect prevention

- The return path is computed on the client from the current location (`pathname + search`), **not** from user-typed input, then passed through `safeReturnPath()`: must start with a single `/`; reject `//`, `\`, any scheme, and anything under `/api/auth`.
- Better Auth additionally validates `callbackURL`, `errorCallbackURL` and `newUserCallbackURL` against `trustedOrigins` [D]. Set `trustedOrigins` to your exact origins only.
- Password sign-in does not redirect at all: the modal closes and the page refreshes in place. Only the Google flow leaves the page, using `callbackURL = safeReturnPath(current)`.

### 6.5 Actor attribution

`activity.actorId = user.id` and `activity.actorName = user.name` (snapshot, so history survives renames or deletion). Show "by Name" in `ActivityList` and the dashboard feed; null for old rows.

---

## 7. Modal and floating profile menu

### 7.1 Modal: native `<dialog>` [R]

Why: the repo has no UI primitive library, and `<dialog>.showModal()` gives, with no new dependency, a top-layer overlay, focus trapping, an inert background, and Esc-to-close.

- **Backdrop:** `::backdrop { background: rgba(28,27,24,.45); backdrop-filter: blur(4px); }` (ink at 45% plus a soft blur).
- **Surface:** `--color-surface`, `1px solid var(--color-rule)`, `--radius-lg`, `--shadow-dialog`; width `min(420px, calc(100vw - 32px))`; `max-height: calc(100dvh - 32px)` with internal scrolling; serif title (`--font-display`).
- **Behaviour:** open via `openAuth()`; close on the X button, Esc (`cancel` event), and backdrop click; focus returns to the trigger; scroll lock with `body:has(dialog[open]) { overflow: hidden }`.
- **Toasts:** Sonner renders in the page, not in the top layer, so a toast fired while the dialog is open would appear *behind* the backdrop. Always close the dialog first, then call `toast`.
- **Mobile:** same centred dialog; inputs at 16px font and 44px height (avoids iOS zoom); buttons full width.

### 7.2 Welcome, Sign In and Sign Up in one modal

- Three panels in a horizontally laid-out track: **Welcome → Sign In → Sign Up**. A viewport with `overflow: hidden` shows one at a time; the track uses `transform: translateX(-100% × index / 3)` with a 260ms `ease-out` transition (use your existing `--ease-out`).
- **No layout jump:** Sign Up is taller than Sign In, so animate the viewport's height to the active panel's measured height (`ResizeObserver`), also with 260ms.
- Inactive panels get `inert` and `aria-hidden="true"` so keyboard focus cannot enter them. After a switch, focus the first field of the active panel.
- **Reduced motion:** under `prefers-reduced-motion: reduce` set `transition: none` on track and height (instant switch, same logic).
- Typed email survives switching between Sign In and Sign Up (state lives in the modal, not the panels).
- Switching never closes the modal or reloads the page.

**Panel contents**

| Panel | Content |
|---|---|
| Welcome | "Senthuron Ops" wordmark, one-line description, **Sign In** (primary) and **Create Account** (secondary) |
| Sign In | Email, Password with show/hide (`aria-pressed`), **Sign In** (primary), **Continue with Google**, link "Create an account" |
| Sign Up | Full name, Email, Password, Confirm password, **Create Account** (primary), **Sign up with Google**, link "Already have an account? Sign in" |

**Validation (client UX; the server is authoritative)**

| Field | Rule |
|---|---|
| Full name | 2–80 characters, trimmed |
| Email | Valid format, lower-cased |
| Password | At least 10 characters (matches `minPasswordLength`) |
| Confirm | Equals password |

Use `autocomplete` correctly (`name`, `email`, `current-password`, `new-password`). Show field errors under inputs with the existing `.field-error` style, plus a `role="alert"` form-level message. Pending state: all inputs and buttons disabled, spinner in the submit button.

**Message map**

| Situation | Message |
|---|---|
| Wrong email or password | "Incorrect email or password." |
| Duplicate account | "An account with this email already exists. Sign in instead." (with a link to the Sign In panel) |
| Not on the invite list | "This email hasn't been invited to Senthuron Ops. Ask an administrator to add you." |
| Rate limited (429) | "Too many attempts. Please wait a minute and try again." |
| Network failure | "Can't reach the server. Check your connection and try again." |
| Google error (returned via the error callback) | "Google sign-in didn't complete. Please try again." |
| Success | Close the dialog, then toast "Signed in as *Name*" / "Account created" |

Map by the client's `error.code` / HTTP status, not by matching message text.

**Google buttons:** call `authClient.signIn.social({ provider: "google", callbackURL: safeReturnPath(current), errorCallbackURL: <current path>?auth_error=google })`. On return, `AuthProvider` sees `auth_error`, reopens the modal on the Sign In panel with the message, then removes the parameter with `router.replace`. Hide the Google buttons when the Google variables are not set (the server passes `googleEnabled`), so there is never a dead button.

### 7.3 Floating profile menu

**Why a portal [V]:** see §1.3. `.sidebar` clips horizontal overflow and creates a stacking context, so an in-sidebar absolute menu cannot extend over the dashboard.

**Implementation**
1. `ProfileMenu` renders with `createPortal(…, document.body)` and `position: fixed`.
2. On open, in `useLayoutEffect`, read the avatar's `getBoundingClientRect()`. Prefer **above**: `bottom = innerHeight − rect.top + 8`, `left = rect.left`. After the menu mounts, measure it and **clamp** `left` into `[8, innerWidth − menuWidth − 8]`. If there is not enough space above (always true for the mobile top bar), **flip below**.
3. Recompute on `resize`, on `scroll` (capture phase, passive, so it follows any scrolling ancestor) and on `visualViewport` resize.
4. `z-index: 60`: above the sidebar and top bar (20), below Sonner toasts. Define it as a token.
5. **Size:** `width: max-content; min-width: 240px; max-width: min(360px, calc(100vw − 16px))`; the email uses `overflow-wrap: anywhere`, so a long name or address is never truncated.
6. **Look:** `--color-surface` background, `1px solid var(--color-rule)`, `--radius-lg`, `--shadow-popover`, padding 8px.
7. **Animation:** `opacity 0→1` and `translateY(6px→0)` over 140ms `ease-out`, `transform-origin: bottom left`; none under reduced motion.
8. **Contents:** full name (14px / 600), email (13px, `--color-ink-2`), 1px `--color-rule` divider, then **Sign out** with an inline SVG icon (consistent with the rest of the codebase, which uses inline SVGs).
9. **Close on:** avatar click (toggle), `pointerdown` outside both menu and avatar, `Escape` (focus returns to the avatar), route change, successful sign-out.
10. **Accessibility:** avatar is a `<button aria-haspopup="menu" aria-expanded aria-controls aria-label="Account menu, {name}">`; menu has `role="menu"` with a `role="menuitem"` Sign out; focus moves into the menu on open; Enter/Space activates; Tab closes it.

**Avatar:** 32px circle, filled `--color-brand` with `--color-surface` text, first character of the name (`Array.from(name.trim())[0]?.toUpperCase()`). A green fill avoids confusion with the existing grey assignee initials.

**Sign out:** `authClient.signOut()` deletes the session server-side and clears the cookie [D]; then `router.refresh()`. The nanostore-backed session updates the control immediately, and the toast "Signed out" fires after the menu closes.

### 7.4 Sidebar and mobile placement

- `.sidebar-footer` becomes `display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px` (same height in both states so nothing above shifts). Left: the existing `Senthuron Tech` text, unchanged. Right: **Sign in** (`.btn-secondary .btn-sm`, 32px) when logged out; the 32px avatar when logged in.
- The sidebar's width (232px), nav, and "New enquiry" button are untouched.
- Below 1024px the sidebar is hidden, so add the same `AuthControl` to the right of `.mobile-topbar` next to "New" (the menu opens downward there).

---

## 8. Google OAuth configuration

**Callback path [D]:** `/api/auth/callback/google` on your origin.

1. In **Google Cloud Console**, create or choose a project.
2. **APIs & Services → OAuth consent screen**: user type *External*; app name "Senthuron Ops"; support email; developer contact. Scopes: the default `openid`, `email`, `profile` are enough.
3. While the app is in **Testing**, only the **test users** you list can sign in. Add every person who will use Google sign-in (including reviewers). Moving to *In production* removes that limit; for basic scopes no Google verification review is normally required, but confirm the current consent-screen rules.
4. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized JavaScript origins: `http://localhost:3000` and `https://<your-production-domain>`.
   - Authorized redirect URIs (must match **exactly**):
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-production-domain>/api/auth/callback/google`
5. Copy the client ID and secret into `.env.local` (local) and Vercel project settings (production). **Never commit them.**
6. Changes can take a few minutes to take effect.

| Variable | Local | Production |
|---|---|---|
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://<production-domain>` |
| `BETTER_AUTH_SECRET` | random 32+ chars (`openssl rand -base64 32`) | a **different** random value |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from step 5 | from step 5 |
| `AUTH_SIGNUP_MODE` | `invite` (or `open` for local testing only) | `invite` |
| `AUTH_ALLOWED_EMAILS` | your test addresses | the real invite list |

**Limitations to document**
- Vercel **preview deployments** have changing URLs, which Google rejects unless each is registered. Treat Google sign-in as supported on localhost and the production domain only.
- Do not simulate Google: if the variables are absent, hide the button.

---

## 9. Phased implementation plan

Order matters: **enforce on the server before building any UI**, so the app is never "read-only in the UI but writable over HTTP" at any point.

| Phase | Work | Done when |
|---|---|---|
| **0. Prerequisites** | Push your latest local code. Confirm the create/update bugs from my code review are fixed (or fix them first). Fix `assertSameOrigin`. Create a Neon backup branch and a dev branch. Add a feature branch. | Clean `git status`; `npm run build` passes on the starting point |
| **1. Database + auth core** | Install pinned `better-auth` (and the Prisma adapter package). Extend `env.ts` and **import it in `db.ts`**. Add `auth.ts`, the `/api/auth/[...all]` route, and the schema changes; create and review the migration (§5.3). | Migration applied on dev with row counts unchanged; `POST /api/auth/sign-up/email` works for an allow-listed email and is refused otherwise |
| **2. Server-side authorization** | `UnauthorizedError`; `requireUser`; guard POST/PUT/PATCH; make `actor` a required service parameter and write `actorId/actorName`. | `curl` writes without a cookie return **401**; GETs still return 200; signed-in writes succeed and record the actor |
| **3. Client auth plumbing** | `auth-client.ts`, `AuthProvider`, `safeReturnPath`, `RequireAuthLink`, `SignInRequired`; gate the New/Edit links, `new` page and `HandlingPanel`; handle `401` in `EnquiryForm`/`HandlingPanel`. | Logged-out UI is read-only and every blocked action opens the (stub) modal path |
| **4. Modal** | `AuthModal` with Welcome/Sign In/Sign Up, validation, loading, messages, slide animation, reduced-motion, focus management. | All flows work on every page; Back/forward and refresh behave |
| **5. Sidebar control + profile menu** | Footer layout, `AuthControl`, `ProfileMenu` portal, mobile top-bar placement. | Menu floats over the dashboard at 1024, 1440 and 1920px, flips correctly on mobile, and sign-out updates the UI instantly |
| **6. Activity attribution UI** | Show "by Name" in activity lists. | New activity rows show the actor; old rows render unchanged |
| **7. Google OAuth** | Console setup (§8), env vars, buttons, error-callback handling. | Real Google round trip creates (or signs into) an allow-listed account on localhost and production |
| **8. Hardening + docs** | Rate-limit storage, `trustedOrigins` review, README, security checklist (§10), optionally Vitest for the helpers. | Checklist passes; README explains invite-only policy and limitations |
| **9. Optional** | Email provider, email verification, forgot-password. | Only if you want it; not required for the assessment |

---

## 10. Regression and security test checklist

### A. Server authorization (run with `curl`, no cookie)
- [ ] `POST /api/enquiries` with a valid body → **401** `UNAUTHENTICATED`; nothing written (check the table).
- [ ] `PUT` and `PATCH /api/enquiries/<id>` → **401**; row unchanged.
- [ ] A forged `Origin: https://evil.example` header with a valid session cookie → **403**.
- [ ] `GET /api/enquiries`, `/api/enquiries/<id>`, `/api/team-members`, `/api/health` → **200** (public reads preserved).
- [ ] With a valid session: POST → 201 and PUT/PATCH → 200; the activity rows carry the correct `actorId`/`actorName`.
- [ ] Tampered or random session cookie → 401.

### B. Authentication flows
- [ ] Sign up with an allow-listed email → account created, signed in; **a second sign-up with the same email** is refused ("already exists").
- [ ] Sign out, then sign in again with the same credentials → same user id (no duplicate account).
- [ ] Wrong password → generic "Incorrect email or password" (no hint whether the email exists).
- [ ] Non-allow-listed email (email path **and** Google path) → refused with the invite message; no `users` row created.
- [ ] Password under 10 chars, mismatched confirm, bad email, empty name → field errors.
- [ ] Rapid repeated wrong passwords → 429 in production mode.

### C. Sessions
- [ ] Refresh and reopen the browser → still signed in.
- [ ] Sign out → **replay the old cookie with `curl`** → 401 (session truly revoked, not just hidden).
- [ ] Cookie flags in production: `HttpOnly`, `Secure`, `SameSite=Lax`; nothing in `localStorage` or `sessionStorage`.
- [ ] Session expiry (shorten `expiresIn` temporarily): next write returns 401 and the modal opens with the expiry banner without losing form values.

### D. Google
- [ ] Real consent screen, account chosen, returned to the **same page** you started from.
- [ ] Cancel at Google → back on the page with the error message.
- [ ] Redirect URI mismatch is not present in console logs.
- [ ] Existing password account + Google with the same email behaves as documented (§3).

### E. Redirect safety
- [ ] `safeReturnPath` rejects `//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:…`, `/api/auth/…`.
- [ ] Manually tampering `callbackURL` in the sign-in request to an external URL is rejected.
- [ ] `trustedOrigins` contains no `localhost` entry in production.

### F. UI regression (existing behaviour must be unchanged)
- [ ] Dashboard figures, charts, attention list, recent activity render identically logged out and in.
- [ ] Enquiry list: search, status/source/assignee filters, sorting, pagination.
- [ ] Detail page reading: notes, activity, contact details.
- [ ] Logged in: create, quick actions, edit all still work.
- [ ] Logged out: every New/Edit link and the `HandlingPanel` show "Please sign in to make changes" and open the modal; `/enquiries/new` shows `SignInRequired`.
- [ ] Sidebar width, nav, "New enquiry" button, and "Senthuron Tech" label unchanged; footer height identical in both states.

### G. Modal and menu
- [ ] Focus trapped in the modal, Esc closes, backdrop click closes, focus returns to the trigger.
- [ ] Sign In ↔ Sign Up slide has no height jump; with reduced motion enabled it switches instantly.
- [ ] Modal usable at 360px and 390px widths; no horizontal scroll.
- [ ] Profile menu **extends past the sidebar edge** over the dashboard; not clipped; full name and email visible.
- [ ] Menu closes on avatar click, outside click, Esc, route change, and sign-out; repositions on window resize and when the page scrolls.
- [ ] On mobile the menu opens downward and stays inside the viewport.
- [ ] Toasts appear **after** the dialog closes and are visible.

### H. Migration safety
- [ ] Row counts for `enquiries`, `enquiry_activities`, `team_members` identical before and after.
- [ ] Migration SQL contains no `DROP`/`TRUNCATE`; no reset prompt was accepted.
- [ ] `git grep` shows no committed secrets; `.env.local` is untracked.

### I. Build and quality
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.
- [ ] Production build starts without `BETTER_AUTH_SECRET` → fails fast with a clear message (via `env.ts`).

---

## 11. Privacy and confidentiality of publicly readable data

You asked for logged-out read access, so I have **not** changed it. Please weigh these implications **[V]** (data exposed) **[R]** (advice):

- **What is public today and stays public:** client/company names, contact names, **emails, phone numbers**, requirement descriptions, budgets, notes, assignee names, activity history, and the team member list, via both pages and the JSON API (`enquiry.service.ts:37–46`; `GET /api/enquiries/[id]`).
- **No access control exists** beyond obscurity. `robots: { index: false }` (`app/layout.tsx:37`) only asks search engines not to index; it prevents nothing.
- **Search makes it enumerable:** the public list and `q` search let anyone page through every record.
- **Compliance:** real client personal data on a world-readable URL may conflict with data-protection obligations (consent, purpose limitation). Take advice before using real data.
- **Recommendations, in order of cost:**
  1. For the assessment: use **fictional data only** and show a "Demo data" note.
  2. Later: a viewer-aware mapper that **redacts email, phone, notes and budget for anonymous visitors** (names and stages stay visible). It touches only `mappers.ts` and the select, and keeps your read-only-browsing requirement intact.
  3. For real use: require sign-in for reads.
- Also: fix the pre-existing leak where `getTeamMembers()` sends team emails into client component props (`enquiry.service.ts:236`, used by three pages) while `listTeamMembers()` already returns only `id` and `name`.

---

## 12. Known risks and manual configuration

| # | Risk / manual step | Impact | Mitigation |
|---|---|---|---|
| 1 | Local code is ahead of GitHub | Plan references may not match your files | Push latest; have Antigravity re-read files first |
| 2 | **No email verification** and **no password reset** in phase 1 | Allow-listed address can be pre-registered; forgotten passwords have no self-service path | Prefer Google for invitees; document admin recovery (delete the user's `accounts` credential row and `users` row in Neon, then they re-register); optional phase 9 |
| 3 | Rate limiting is in-memory by default and serverless instances do not share memory | Weaker brute-force protection | Use database-backed rate-limit storage (verify option name) |
| 4 | Better Auth CLI imports your auth config; `server-only` in `auth.ts`/`db.ts` throws outside Next | `npx auth@latest generate` may fail | Hand-write the models (§5.2) or run the CLI against a scratch config that avoids `server-only` |
| 5 | Prisma adapter import path differs between docs sections | Compile error on install | Use whichever of `better-auth/adapters/prisma` or `@better-auth/prisma-adapter` resolves; pin the same version for both |
| 6 | Cookie cache disabled → one session query per request | Slight latency (Neon cold starts) | Accept; it keeps logout immediate |
| 7 | `AUTH_SIGNUP_MODE=open` | Anyone can create accounts and edit data | Use only for local testing or a throwaway demo |
| 8 | Google "Testing" mode limits sign-in to listed test users; preview URLs unsupported | Reviewers may be refused | Add them as test users or publish the consent screen; document |
| 9 | Toasts hidden behind a top-layer `<dialog>` | Missed success messages | Close the dialog before `toast()` |
| 10 | Existing destructive scripts (`db:seed --reset`, `cleanup.js`) | Data loss | Never run them; consider guarding `seed.ts` with a production check |
| 11 | `assertSameOrigin` bypass and other defects from my earlier review | Weakens the CSRF layer; some bugs may recur | Fix in Phase 0 |
| 12 | Dashboard `formatDate` (`(app)/page.tsx:31–46`) uses the server's timezone (UTC on Vercel), not `APP_TIMEZONE` | "Today"/"Yesterday" labels wrong around midnight in the business timezone | Use `BUSINESS_TIMEZONE` formatting (low priority) |
| 13 | Public read data (§11) | Confidentiality | Fictional data; consider redaction |
| 14 | Secrets | Leakage | Only in Vercel settings and `.env.local`; rotate if ever exposed; never put real values in `.env.example` |
| 15 | Library version drift | API differences from this plan | Pin exact versions; read the installed package's docs; do not use the 1.8 beta |

---

## 13. Decisions I need from you

1. **Demo access strategy** (§3): reviewer emails in the allow-list, a seeded demo account, or temporary open sign-up?
2. **Company email domain?** If one exists, `AUTH_ALLOWED_EMAIL_DOMAIN` is an easy second gate.
3. **Should signed-in users be assignable?** Default: no, keep `TeamMember` separate.
4. **Phase 9** (email verification and password reset) in scope, or documented as future work?
5. **Redact contact fields for anonymous visitors**, or keep everything public as the brief says?

---

## 14. Ordered instructions for Antigravity

**Guardrails to paste first**
> Work on a new git branch. Before editing, re-read every file named below (the repo may differ from my notes). Do not run `npm run db:seed`, `prisma/cleanup.js`, `prisma/remove-test-data.*`, `prisma migrate reset`, or `prisma db push --force-reset`. Never commit `.env` or `.env.local`. Use a Neon **dev** branch, not production. Install only `better-auth` and its Prisma adapter, pinned to the same exact version. After each step run `npx tsc --noEmit` and `npm run lint`. Do not redesign existing components; reuse existing CSS tokens and classes.

1. **Prerequisites.** Fix `assertSameOrigin` in `src/lib/api-response.ts` (compare `new URL(origin).host` to `x-forwarded-host ?? host`; import `ForbiddenOriginError` at the top; remove `require`).
2. **Env.** Extend `src/lib/env.ts` with the §8 variables (Google optional; `AUTH_SIGNUP_MODE` default `invite`); import `env` in `src/lib/db.ts`; update `.env.example` (add new variables, delete `ACCESS_PASSPHRASE_*`).
3. **Dependencies.** `npm install better-auth @better-auth/prisma-adapter` pinned to the same version.
4. **Schema.** Add the four auth models and the `EnquiryActivity` additions from §5.2 to `prisma/schema.prisma` without modifying existing models. Create the migration with `--create-only`, show me the SQL, and stop if it contains `DROP` or `TRUNCATE`.
5. **Apply and generate** on the dev branch; record row counts of `enquiries` and `enquiry_activities` before and after.
6. **Auth core.** Create `src/lib/auth.ts` (Prisma adapter with the existing `prisma` client, email/password with `minPasswordLength: 10`, optional Google, 7-day sessions, cookie cache **off**, `trustedOrigins` limited to `BETTER_AUTH_URL`, invite hook), `src/app/api/auth/[...all]/route.ts`, and `src/lib/auth-guard.ts`.
7. **Errors.** Add `UnauthorizedError` (401, `UNAUTHENTICATED`, "Please sign in to make changes.") to `src/lib/errors.ts`.
8. **Enforce on the server.** In `POST /api/enquiries` and `PUT`/`PATCH /api/enquiries/[id]`, call `requireUser(req)` immediately after `assertSameOrigin`. Change `createEnquiry` and `updateEnquiry` to require an `actor` and write `actorId`/`actorName` on every activity row. Update the mapper and DTO.
9. **Verify** with the curl checks in §10-A before building any UI.
10. **Client plumbing.** Add `auth-client.ts`, `safe-redirect.ts`, `AuthProvider` (seeded from the server session in `src/app/(app)/layout.tsx`), `RequireAuthLink`, `SignInRequired`.
11. **Gate the UI** per the §6.3 matrix: Sidebar, MobileNav, dashboard header, list header, detail page, `new` page (and `edit` page if present), `HandlingPanel` read-only mode, `401` handling in `EnquiryForm` and `HandlingPanel`.
12. **Modal.** Build `AuthModal` with the native `<dialog>`, three sliding panels, validation, messages, reduced-motion handling, and the Google buttons hidden when not configured (§7.1–7.2).
13. **Sidebar control and menu.** Update `.sidebar-footer`; add `AuthControl` and the portal `ProfileMenu` (§7.3–7.4); add the control to the mobile top bar.
14. **Activity attribution UI.** Show "by Name" in `ActivityList` and the dashboard feed.
15. **Google.** Follow §8 to create credentials; test the real round trip locally.
16. **Docs.** Update `README.md` and add the Google/recovery notes.
17. **Run the full checklist in §10**, then `npx tsc --noEmit`, `npm run lint`, `npm run build`.

---

## Appendix A: Quick fix for the Recent activity overlap (your earlier question)

**Cause [V].** In `src/app/globals.css`, `.activity-time` (`:931–939`) is `width: 80px; flex-shrink: 0; white-space: nowrap` in 12px monospace. "28 Sept 11:57" is 13 characters (about 94px) and "Yesterday 11:57" is 15 characters (about 108px). Both overflow the 80px box and run into the reference. Rows like "Today 03:06" fit, which is why only older rows collide.

**Fix.** Change the two rules to:

```css
.activity-time {
  flex: 0 0 120px;
  width: 120px;
}
.activity-text {
  flex: 1;
  min-width: 0;
}
```

The same class names are redefined later for the detail-page timeline (`:1996–2004`), which only sets colours, so they do not conflict today; rename those to `.timeline-*` when convenient.

**Prompt for Antigravity**
> In `src/app/globals.css`, in the Recent activity block (`.activity-time`, around line 931), replace `width: 80px` with `flex: 0 0 120px; width: 120px`, and add `flex: 1; min-width: 0;` to `.activity-text`. Do not change any other rule. Check the dashboard at 1280px and 1920px: no timestamp may touch the `ENQ-` reference.

## Appendix B: Reference sketches (illustrative, not applied)

```ts
// src/lib/auth-guard.ts
import "server-only";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function requireUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new UnauthorizedError();
  return { id: session.user.id, name: session.user.name };
}
```

```ts
// handler order (enquiries/route.ts, POST)
export const POST = withErrorHandling(async (req) => {
  assertSameOrigin(req);
  const actor = await requireUser(req);   // before reading the body
  // …content-type check, JSON parse, Zod validation…
  const enquiry = await createEnquiry(parsed.data, actor);
  return ok(enquiry, 201);
});
```

```ts
// invite gate inside betterAuth({ databaseHooks: … })
user: { create: { before: async (user) => {
  if (!isSignupAllowed(user.email)) {
    throw new APIError("FORBIDDEN", { message: "NOT_INVITED" });
  }
}}}
// isSignupAllowed: mode === "open" || allowlist.has(email.toLowerCase())
```

```ts
// src/lib/safe-redirect.ts
export function safeReturnPath(path: string): string {
  const ok = path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    && !/^\/api\/auth(\/|$)/.test(path);
  return ok ? path : "/";
}
```
