# Senthuron Ops — Code Review

**Repository:** `Jogesh-Joshua/senthuron-ops` (public) · **Stack:** Next.js 16.3.7, React 19.2, Prisma 7.10 (`@prisma/adapter-pg`), Zod 4, Tailwind 4
**Status of this document:** findings and proposed fixes only. No code in the repository has been modified.

---

## 0. How I reviewed it, and what I could not verify

**What I did**
- You mentioned attached source files, but none were attached to the message, so I cloned the public GitHub repository and read the code directly: `prisma/`, `src/lib/**`, every API route, all pages, and the components in `src/components/enquiries`, `dashboard` and `layout`.
- I installed the dependencies, ran **ESLint** (real results, cited below), and ran the project's own **Zod schemas** against realistic payloads to confirm several validation bugs.
- I checked Next.js behaviour against the documentation that ships inside your `node_modules` (`next` 16.3.7).
- The "Impeccable Developer" skill file contains only a link and no instructions, so I applied a standard senior TypeScript/Next.js review checklist (the second list in your request).

**What I could not verify**

| Area | Why | What to do |
|---|---|---|
| **Runtime behaviour** (C1, C2, H1 below) | I have no database credentials, so I did not run the app. Those findings come from reading the code, the Next 16 docs, and executing the Zod schemas. | Confirm each in the browser after the fix (acceptance checks are at the end). |
| **TypeScript compiler output** | `prisma generate` needs to download a binary from a host my sandbox blocks, so the generated client was missing and `tsc` produced errors that are artefacts of that. I ignored them. | Run `npx tsc --noEmit` locally after fixes. |
| **Responsive and visual behaviour** | I did not render the app. I only confirmed `globals.css` has breakpoints at 639, 767 and 1023px. | Check 390px and 768px manually (see §6, item 10). |
| **Git history** | I cloned with `--depth 1`, so earlier commits were not scanned for secrets. The working tree has none (see §4). | Run `git log -p` or a scanner such as gitleaks locally. |
| **Tests** | There is no test script and no test framework in `package.json`. | See L7. |
| `prisma/seed.ts` data, `ActivityList`, `StageTrack`, `Sidebar`, `MobileNav`, `StatusStrip` | Read; no material problems found. | — |

**What is already good** (so you do not change it): the layering (route → service → Prisma) is clean; Prisma is used without raw SQL in the app; indexes match the filters; status counts correctly ignore the status filter; the update runs inside a transaction with activity rows; dashboard figures come from real Prisma queries (`count`, `aggregate`, `groupBy`), not hard-coded numbers; `.env.local` is ignored and only placeholders are committed; `server-only` is used on server modules; security headers are set in `next.config.ts`; Next 16 `params` are correctly awaited on the detail page and API routes.

---

## 1. Findings summary

| ID | Priority | Title | Main file |
|---|---|---|---|
| C1 | **Critical** | UI treats every successful create/update as a failure (wrong response shape) | `EnquiryForm.tsx`, `HandlingPanel.tsx` |
| C2 | **Critical** | Enquiry list ignores search, filters, sort and pagination (`searchParams` not awaited) | `enquiries/page.tsx` |
| C3 | **Critical** | Full "edit enquiry" is missing; the Edit links 404 | `enquiries/[id]/page.tsx` |
| H1 | High | Blank follow-up date makes the create form fail validation | `EnquiryForm.tsx` |
| H2 | High | No loading, error or not-found boundaries; success toasts never fire | `src/app/**` |
| M1 | Medium | `assertSameOrigin` can be bypassed and uses `require()` | `api-response.ts` |
| M2 | Medium | Filter bar fires twice per change and searches on every keystroke | `EnquiryFilters.tsx` |
| M3 | Medium | `getTeamMembers()` sends full team rows (incl. emails) to the client; duplicate of `listTeamMembers()` | `enquiry.service.ts` |
| M4 | Medium | Budget parsing silently accepts `12.5`, `12abc`, `1e5` | `validation/enquiry.ts`, `EnquiryForm.tsx` |
| M5 | Medium | One bad query parameter discards all filters; out-of-range page not handled | `enquiries/page.tsx` |
| M6 | Medium | Error handling: mismatched request IDs, unmapped FK error, repeated route boilerplate | `api-response.ts`, routes |
| M7 | Medium | Environment handling: `env.ts` is never used, documented passphrase gate does not exist | `env.ts`, `db.ts`, `.env.example` |
| M8 | Medium | Enum lists duplicated in three places | `constants.ts`, `validation/enquiry.ts`, `types/dto.ts` |
| M9 | Medium | `npm run lint` fails (17 errors) | several |
| M10 | Medium | Accessibility gaps (focus ring removed, status text in labels, wrong breadcrumb) | `globals.css`, `HandlingPanel.tsx`, `[id]/page.tsx` |
| M11 | Medium | Update service: noisy activity log and read outside the transaction | `enquiry.service.ts` |
| M12 | Medium | README is the create-next-app boilerplate | `README.md` |
| L1 | Low | `PUT` used as the main update verb | `[id]/route.ts` |
| L2 | Low | `prisma.config.ts` hand-rolls an `.env` parser and guesses the direct URL | `prisma.config.ts` |
| L3 | Low | Redundant code in `db.ts` | `db.ts` |
| L4 | Low | Duplicated helpers | `format.ts`, `page.tsx`, `service`, `mappers.ts` |
| L5 | Low | Unused dependencies | `package.json` |
| L6 | Low | Repository clutter and scratch scripts | repo root, `prisma/` |
| L7 | Low | No automated tests | — |
| L8 | Low | `api-client.ts` weaknesses (relevant once C1 makes it live) | `api-client.ts` |
| L9 | Low | Dashboard runs three queries sequentially after the main batch | `dashboard.service.ts` |

---

## 2. Critical findings

### C1 — UI treats every successful create/update as a failure

**Files / functions:** `src/components/enquiries/EnquiryForm.tsx` → `handleSubmit` (lines 107–132); `src/components/enquiries/HandlingPanel.tsx` → `updateField` (lines 50–78). Envelope defined in `src/lib/api-response.ts` → `ok()` / `fail()` (lines 22–39).

**Problem:** The API returns `{ "data": … }` on success and `{ "error": { code, message, fieldErrors } }` on failure. Both components were written against a different shape:
- `EnquiryForm.tsx:116` and `HandlingPanel.tsx:59` check `result.success`, which never exists, so the success branch is unreachable.
- Failure branches read `result.errors` and `result.message` (`EnquiryForm.tsx:122–125`, `HandlingPanel.tsx:68`), which also never exist, so server field errors are never shown.
- A fully built helper, `apiPost` / `apiPatch` in `src/lib/api-client.ts`, is **imported nowhere** (I searched `src/`).

**Impact:**
- Creating an enquiry succeeds in the database but the form shows "Failed to create enquiry" and stays on the page. A second click creates a duplicate.
- A quick action (status, assignee, follow-up) is saved by the server, but the panel reverts the control and shows "Failed". The screen contradicts the database until a refresh.
- Server validation messages never reach the user.

**Priority:** Critical.

**Fix:** use the existing helper and its `ok` / `error` result (confirm the exact field names in `api-client.ts` lines 5–19 while editing).

```tsx
// EnquiryForm.tsx
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";
import type { EnquiryDTO } from "@/types/dto";

// …inside handleSubmit, replacing the fetch/res.json block:
const result = await apiPost<EnquiryDTO>("/api/enquiries", payload);

if (result.ok) {
  toast.success("Enquiry created", { description: result.data.reference });
  router.push(`/enquiries/${result.data.id}`); // detail page is force-dynamic, no router.refresh() needed
  return;
}

setErrors(result.error.fieldErrors ?? { _root: [result.error.message] });
setIsSubmitting(false);
```

```tsx
// HandlingPanel.tsx
import { apiPatch } from "@/lib/api-client";
import { toast } from "sonner";

const result = await apiPatch<EnquiryDetailDTO>(`/api/enquiries/${enquiry.id}`, payload);

if (result.ok) {
  setSavingField(`${field}-saved`);
  setTimeout(() => setSavingField((prev) => (prev === `${field}-saved` ? null : prev)), 2000);
  router.refresh();
} else {
  // revert
  if (field === "status") setStatus(originalValue);
  if (field === "assignedToId") setAssignedToId(originalValue);
  if (field === "nextFollowUpAt") setNextFollowUpAt(originalValue);
  setErrorField(field);
  setSavingField(null);
  toast.error("Couldn't save the change", { description: result.error.message });
}
```

The `try/catch` around it then only needs to handle unexpected exceptions.

---

### C2 — Enquiry list ignores search, filters, sort and pagination

**File / function:** `src/app/(app)/enquiries/page.tsx` → `EnquiriesPage` (lines 15–23).

**Problem:** The page declares `searchParams` as a plain object and passes it straight to `listQuerySchema.safeParse(searchParams)` without `await`. In Next.js 16, `searchParams` is a **Promise**; synchronous access was removed (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, line 285). The detail page awaits `params` correctly; this page does not.

I confirmed what happens next by running the project's schema: given a Promise, `listQuerySchema.safeParse(Promise.resolve({ status: "WON", page: "2" }))` succeeds and returns only the defaults (`due: ANY`, `sort: followup`, `page: 1`). TypeScript cannot catch this because the prop is typed as a plain object.

**Impact:** Requirement 6 (search and filter by status, source, assigned person) is effectively broken on the server. The URL changes when a user picks a filter, the filter controls look correct (they read the URL on the client), but the table always shows the unfiltered first page. Pagination links change the URL but never change the data.

**Priority:** Critical. *(Runtime not executed by me; confirm by opening `/enquiries?status=WON`.)*

**Fix:**

```tsx
interface EnquiriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EnquiriesPage({ searchParams }: EnquiriesPageProps) {
  const raw = await searchParams;
  const query = parseListQuery(raw); // see M5 for this helper
  // …rest unchanged
}
```

Check any other page that reads `searchParams` (only this one does today).

---

### C3 — Full "edit enquiry" is missing; Edit links 404

**Files:** `src/app/(app)/enquiries/[id]/page.tsx:60` (Edit button) and `:115` ("Add" notes link) both link to `/enquiries/${id}/edit`. There is **no** `src/app/(app)/enquiries/[id]/edit/` route (`find src/app -path '*edit*'` returns nothing). `EnquiryForm` only supports creating. `MobileNav.tsx:13,16` already expects an `/edit` path.

**Problem / impact:** The assessment requires updating enquiry information. Today only status, assignee and follow-up can change (via `HandlingPanel`). Client name, contact, email, phone, source, service, description, budget and notes cannot be edited from the UI, and clicking **Edit** shows a 404. The API (`updateEnquiry`) already supports all of those fields, so this is purely a missing UI route.

**Priority:** Critical (a stated requirement).

**Fix (no architecture change; reuse the form):**

1. Create `src/app/(app)/enquiries/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getEnquiry, listTeamMembers } from "@/lib/services/enquiry.service";
import { EnquiryForm } from "@/components/enquiries/EnquiryForm";

export const dynamic = "force-dynamic";

export default async function EditEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [enquiry, teamMembers] = await Promise.all([
    getEnquiry(id).catch((e) => {
      if (e?.name === "NotFoundError") notFound(); // same check the detail page uses
      throw e;
    }),
    listTeamMembers(),
  ]);

  return (
    <>
      {/* reuse the header markup from enquiries/new/page.tsx, titled "Edit enquiry" */}
      <EnquiryForm mode="edit" enquiry={enquiry} teamMembers={teamMembers} />
    </>
  );
}
```

2. Extend `EnquiryForm` props: `mode?: "create" | "edit"` and `enquiry?: EnquiryDetailDTO`. Add `defaultValue={enquiry?.clientName}` (and so on) to each field. In edit mode:
   - Validate with a schema that **omits the "no past follow-up" rule** (export `editEnquirySchema` from `validation/enquiry.ts`; the spec allows past dates on edit).
   - Submit with `apiPatch(`/api/enquiries/${enquiry.id}`, changedFieldsOnly)`, then `toast.success("Changes saved")` and `router.push(`/enquiries/${enquiry.id}`)`.
   - Button label "Save changes"; Cancel links back to the detail page.
3. Edit-mode status and follow-up fields can stay in the form; the service already clears the follow-up when status becomes Won/Lost.

---

## 3. High-priority findings

### H1 — Blank follow-up date makes the create form fail validation

**File / function:** `src/components/enquiries/EnquiryForm.tsx` → `validateForm` (lines 47–67), compared with `handleSubmit` (lines 95–105).

**Problem:** `validateForm` builds its data with `Object.fromEntries(new FormData(form))` and only normalises `budget` (lines 53–56). A cleared `<input type="date">` posts `""`. `handleSubmit` later deletes empty fields from the payload, but validation has already run on the un-normalised data. I ran the project's `createEnquirySchema` on the form-shaped payload and it returns:

```
nextFollowUpAt: Enter a date in YYYY-MM-DD format.
nextFollowUpAt: Enter a valid calendar date.
```

The same payload with a date, or with the field omitted (as the API receives it), passes.

**Impact:** Unless the user fills in a follow-up date, the form cannot be submitted, even though the field is optional in the spec and the server accepts its absence.

**Priority:** High.

**Fix:** use one function to read and normalise the form, and use it for both validation and submission (this also removes the `as any` casts on lines 77 and 104).

```tsx
function readForm(form: HTMLFormElement) {
  const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
  return {
    ...raw,
    budget: raw.budget?.trim() || null,
    nextFollowUpAt: raw.nextFollowUpAt || null,
    assignedToId: raw.assignedToId || null,
    notes: raw.notes?.trim() || null,
  };
}

function validateForm(): boolean {
  if (!formRef.current) return false;
  const result = createEnquirySchema.safeParse(readForm(formRef.current));
  if (!result.success) { setErrors(result.error.flatten().fieldErrors); return false; }
  setErrors({});
  return true;
}

// in handleSubmit, send the parsed (and transformed) data instead of rebuilding it:
const parsed = createEnquirySchema.safeParse(readForm(formRef.current));
if (!parsed.success) return;
const result = await apiPost<EnquiryDTO>("/api/enquiries", parsed.data);
```

Also replace the synthetic submit in `handleKeyDown` (line 139) with `formRef.current?.requestSubmit()`, which respects native form behaviour.

---

### H2 — No loading, error or not-found boundaries; success toasts never fire

**Files:** there are no `loading.tsx`, `error.tsx`, `not-found.tsx` or `global-error.tsx` files anywhere under `src/app` (confirmed by listing). `src/app/layout.tsx:62–65` mounts Sonner's `<Toaster>`, but no file calls `toast(...)`.

**Problem / impact:** Requirement 9 (loading, empty, error and success states) is only partly met. Empty states and inline load errors exist on the list and dashboard pages. But:
- Navigation shows no skeleton or progress while the server queries run (Neon can add a cold-start delay).
- An unexpected render error falls through to Next's default error screen.
- `notFound()` on the detail page (line 29 onwards) renders Next's default unstyled 404.
- Creating or saving shows no success feedback beyond an inline "Saved" in the quick-action panel.

**Priority:** High.

**Fix (small files, reuse existing classes):**

```tsx
// src/app/(app)/error.tsx
"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="error-panel" role="alert">
      <p className="error-panel-msg">Something went wrong on our side. This is usually temporary.</p>
      <button type="button" className="btn-secondary" onClick={reset}>Try again</button>
    </div>
  );
}
```

- `src/app/(app)/loading.tsx` and `src/app/(app)/enquiries/loading.tsx`: render a few placeholder rows using a new `.skeleton` utility class (background `var(--color-sunken)`, subtle opacity pulse, disabled under `prefers-reduced-motion`, and a 150 ms `animation-delay` so fast loads do not flash).
- `src/app/(app)/enquiries/[id]/not-found.tsx` and `src/app/not-found.tsx`: reuse the empty/error panel markup already in `enquiries/page.tsx` (lines ~40–50) with "That enquiry doesn't exist" and a link back to `/enquiries`.
- `src/app/global-error.tsx`: minimal `<html><body>` fallback with a reload button.
- Add `toast.success(...)` calls as shown in C1/C3 (create, save changes, quick-action saved).

---

## 4. Medium-priority findings

### M1 — `assertSameOrigin` can be bypassed and uses `require()`

**File / function:** `src/lib/api-response.ts` → `assertSameOrigin` (lines 109–116).

**Problem:** `origin.endsWith(host)` is a string suffix test. `https://evilexample.com` ends with `example.com`, so it passes. The function also loads `ForbiddenOriginError` through `require()` inside the function (line 113), which ESLint flags and which should simply be a top-level import.

**Impact:** The only cross-origin protection on the mutating endpoints is weaker than it looks. With no authentication and fake data the risk is low, but it is a security control that does not do its job, and it is visible in a security-focused review.

**Priority:** Medium.

**Fix:**

```ts
import { AppError, ForbiddenOriginError } from "@/lib/errors";

export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, tests) send no Origin
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string | null = null;
  try { originHost = new URL(origin).host; } catch { /* malformed Origin */ }
  if (!host || originHost !== host) throw new ForbiddenOriginError();
}
```

---

### M2 — Filter bar fires twice per change and searches on every keystroke

**File / function:** `src/components/enquiries/EnquiryFilters.tsx` → `onChange` (lines 22–55), `<form onChange={onChange}>` (line 68) and each `<select onChange={onChange}>` (line 88 onwards).

**Problem:**
- Change events bubble, so each select change calls `onChange` twice (the select's own handler, then the form's).
- The search input has no debounce, so every keystroke runs `router.push`, which re-runs the three list queries on the server. The spec called for a 300 ms debounce.
- `router.push` adds a browser history entry per call, so the Back button steps through every keystroke.

**Impact:** Unnecessary database load, jittery typing, and a polluted history.

**Priority:** Medium.

**Fix:** keep one handler (on the form), debounce only the text field, and use `replace`.

```tsx
const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

function applyFilters() { /* existing body, but */ startTransition(() => router.replace(url)); }

function handleFormChange(e: React.ChangeEvent<HTMLFormElement>) {
  if ((e.target as HTMLInputElement).name === "q") {
    clearTimeout(timer.current);
    timer.current = setTimeout(applyFilters, 300);
  } else {
    applyFilters();
  }
}
// <form onChange={handleFormChange} onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
// …and remove onChange={onChange} from every <select>.
```

---

### M3 — `getTeamMembers()` leaks full team rows to the client and duplicates `listTeamMembers()`

**File / function:** `src/lib/services/enquiry.service.ts` → `getTeamMembers` (line 236, returns every column) and `listTeamMembers` (line 493, selects `id` and `name` only). Callers of the wide version: `enquiries/page.tsx:3,32`, `enquiries/[id]/page.tsx:4,34`, `enquiries/new/page.tsx:2,12`. Only `api/team-members/route.ts` uses the narrow one.

**Problem / impact:** The props of `HandlingPanel`, `EnquiryForm` and `EnquiryFilters` are typed `{ id, name }`, but the real objects include `email` and `createdAt`. Server Components serialise props sent to client components, so those fields end up in the page payload. Two near-identical functions also invite drift.

**Priority:** Medium.

**Fix:** delete `getTeamMembers` and import `listTeamMembers` in the three pages. Optionally move both team functions to a small `team.service.ts` as the architecture document suggested.

---

### M4 — Budget parsing silently accepts invalid input

**Files:** `src/lib/validation/enquiry.ts` (budget string transform) and `src/components/enquiries/EnquiryForm.tsx:104` (`parseInt(...)`).

**Problem:** `parseInt` stops at the first non-digit. Running the schema: `"12.5"` is accepted as `12`, `"12abc"` as `12`, `"1e5"` as `1`. Negative numbers are rejected, but these are not.

**Impact:** Data is silently altered (a budget of `1e5` is stored as 1). Both client and server share the flaw.

**Priority:** Medium.

**Fix:** parse strictly and reject anything else.

```ts
const parseBudget = (s: string) => (/^\d{1,9}$/.test(s.trim()) ? Number(s) : Number.NaN);
// use parseBudget in the string branch of the budget schema; the existing refine already rejects NaN
```

Remove the second `parseInt` in `EnquiryForm` (H1 already sends the parsed value).

---

### M5 — One bad query parameter discards all filters; out-of-range page not handled

**File / function:** `src/app/(app)/enquiries/page.tsx:22–23` (`queryParse.success ? … : listQuerySchema.parse({})`), plus `listEnquiries` in the service (no clamping).

**Problem:** I ran the schema: `?page=abc`, `?status=BOGUS`, and `?status=WON&status=LOST` (a repeated key becomes an array) all fail the whole parse, so the page falls back to **no filters at all**. Separately, `?page=99` runs `skip` past the end and returns zero rows while `total > 0`, so the pager reads "Showing 1,486–32 of 32".

**Impact:** Hand-edited or stale URLs silently show unfiltered data or an empty page.

**Priority:** Medium.

**Fix:** drop only the invalid keys, take the first value of repeated keys, and redirect out-of-range pages.

```ts
// validation/enquiry.ts
export function parseListQuery(raw: Record<string, string | string[] | undefined>): ListQuery {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const result = listQuerySchema.safeParse(flat);
  if (result.success) return result.data;
  const bad = new Set(result.error.issues.map((i) => String(i.path[0])));
  return listQuerySchema.parse(Object.fromEntries(Object.entries(flat).filter(([k]) => !bad.has(k))));
}
```

```tsx
// enquiries/page.tsx, after data is loaded
if (data.total > 0 && data.items.length === 0 && query.page > 1) {
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))
  );
  params.set("page", String(data.totalPages));
  redirect(`/enquiries?${params}`); // import { redirect } from "next/navigation"
}
```

Keep the strict `safeParse` → 400 behaviour in `GET /api/enquiries` (that is correct for an API).

---

### M6 — Error handling: mismatched request IDs, unmapped FK error, repeated boilerplate

**Files:** `src/lib/api-response.ts` (`fail` line 34, `withErrorHandling` lines 58–103); `src/app/api/enquiries/route.ts` (lines 37–70); `src/app/api/enquiries/[id]/route.ts` (lines 36–73).

**Problems:**
1. `fail()` generates its own `requestId` (line 34), but the catch-all in `withErrorHandling` logs a *different* one (line 87). The ID the user sees can never be found in the logs.
2. Only Prisma `P2025` is mapped; a foreign-key violation (`P2003`, e.g. a team member deleted between page load and save) becomes a generic 500.
3. `err.flatten()` is deprecated in Zod 4 (`z.flattenError(err)` replaces it).
4. The POST and PUT handlers repeat the same ~20 lines: origin check, content-type check, JSON parse, `safeParse` → `fail(...)`. `withErrorHandling` already converts a thrown `ZodError` into the same 422 response, so the per-route `safeParse` blocks are redundant.

**Impact:** Debuggability and maintainability; no user-visible failure today.

**Priority:** Medium.

**Fix:**

```ts
// api-response.ts
export function fail(code: string, message: string, status: number,
  fieldErrors?: Record<string, string[]>, requestId = crypto.randomUUID().slice(0, 8)) { /* … */ }

// catch-all branch:
const requestId = crypto.randomUUID().slice(0, 8);
console.error(JSON.stringify({ level: "error", requestId, message: /* … */, stack: /* … */ }));
return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500, undefined, requestId);

// add next to P2025:
if (code === "P2003") return fail("VALIDATION_ERROR", "A referenced record no longer exists.", 422);

// shared body reader (new, in api-response.ts)
export async function readJson(req: Request): Promise<unknown> {
  assertSameOrigin(req);
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", 415, "Request body must be application/json.");
  }
  try { return await req.json(); } catch { throw new BadRequestError("Request body is not valid JSON."); }
}
```

Then each mutating route becomes:

```ts
export const POST = withErrorHandling(async (req) => {
  const input = createEnquirySchema.parse(await readJson(req)); // ZodError → 422 via the wrapper
  return ok(await createEnquiry(input), 201);
});
```

(Confirm the `AppError` constructor argument order in `src/lib/errors.ts` when adding the 415 error, or add a small `UnsupportedMediaTypeError` class beside the others.)

---

### M7 — Environment handling is inconsistent

**Files:** `src/lib/env.ts`, `src/lib/db.ts:17`, `src/lib/constants.ts`, `.env.example`.

**Problems:**
1. `env.ts` validates environment variables with Zod, but **nothing imports it** (searched `src/` and `prisma/`). `db.ts` reads `process.env.DATABASE_URL` directly, so a missing or malformed URL surfaces as an obscure connection error, not the clear message `env.ts` was written to give.
2. `.env.example` documents `ACCESS_PASSPHRASE_*` variables, but the repository has **no `proxy.ts`/`middleware.ts`**, so the gate does not exist.
3. `constants.ts` reads `process.env.APP_TIMEZONE` and is imported by client code via the validation schema. Non-`NEXT_PUBLIC_` variables are not available in the browser, so if the variable is ever set, the client (default timezone) and server could disagree on what "today" is.

**Impact:** Misleading configuration, harder debugging, and a documented security feature that is not implemented.

**Priority:** Medium.

**Fix:**
- `db.ts`: `import { env } from "@/lib/env";` and use `env.DATABASE_URL`.
- Remove the `ACCESS_PASSPHRASE_*` lines from `.env.example` (simplest). Only keep them if you also add a `proxy.ts` basic-auth gate.
- Make the timezone a plain constant in `constants.ts` (for example `export const BUSINESS_TIMEZONE = "Asia/Kolkata";`) and delete the env lookup, or expose it as `NEXT_PUBLIC_APP_TIMEZONE` so client and server always agree.

---

### M8 — Enum lists duplicated in three places

**Files:** `src/lib/constants.ts` (labels and order), `src/lib/validation/enquiry.ts` (`STATUS_VALUES` and similar hard-coded arrays), `src/types/dto.ts` (string unions). The comments claim the lists are "derived from" one source so they cannot drift; they are separate copies.

**Impact:** Adding or renaming a status means editing three files and the compiler will not catch a miss.

**Priority:** Medium.

**Fix:** make the label maps the single source and key them by the Prisma enum type (type-only import, erased at build), so a change to `schema.prisma` becomes a compile error.

```ts
// constants.ts
import type { EnquiryStatus } from "@/generated/prisma";

export const STATUS_LABELS = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent", NEGOTIATION: "Negotiation", WON: "Won", LOST: "Lost",
} satisfies Record<EnquiryStatus, string>;

export const STATUS_VALUES = Object.keys(STATUS_LABELS) as [EnquiryStatus, ...EnquiryStatus[]];
// validation: z.enum(STATUS_VALUES)
// dto.ts:     export type { EnquiryStatus, EnquirySource, ServiceType } from "@/generated/prisma";
```

Do the same for source and service.

---

### M9 — `npm run lint` fails (17 errors)

ESLint output (generated code excluded):

| File | Issue |
|---|---|
| `src/app/(app)/enquiries/page.tsx:44` | Unescaped `'` in JSX text |
| `src/app/(app)/enquiries/page.tsx:46` | `<a href="/enquiries/">` for internal navigation (full page reload); use `<Link>` |
| `src/app/(app)/page.tsx:109, 218` | Unescaped `'` in JSX text |
| `src/app/(app)/page.tsx:111` | `<a href="/">` instead of `<Link>` |
| `src/app/(app)/enquiries/[id]/page.tsx:36` | `catch (e: any)` |
| `src/components/enquiries/EnquiryForm.tsx:77, 104` | `any` |
| `src/components/enquiries/HandlingPanel.tsx:30 (×2), 40` | `any`; `payload` should be `const` |
| `src/lib/api-response.ts:113` | `require()` import |
| `prisma/cleanup.js:1–3` | `require()` imports (file should be deleted, see L6) |

Warnings (unused): `relativeTime` and `formatCurrency` in `(app)/page.tsx:13–14`; `RouteContext` in `[id]/route.ts:17`; `fail` in `health/route.ts:2`; `EnquiryStatus` in `StageMark.tsx:5`; `z` in `EnquiryForm.tsx:7`; `useRef` in `HandlingPanel.tsx:3`; unused `catch` bindings; `_d`/`_n` destructured and discarded in `mappers.ts:94` (pick the fields you want instead).

**Impact:** A failing lint is the first thing a reviewer's CI or editor shows; the `<a>` links are also real behaviour bugs.

**Priority:** Medium.

**Fix:** apply the specific edits above (`&apos;` or a typographic apostrophe, `<Link>`, typed payloads such as `Partial<Record<"status" | "assignedToId" | "nextFollowUpAt", string | null>>`, `catch (e: unknown)` with an `instanceof`/name check), then run `npm run lint` until clean.

---

### M10 — Accessibility gaps

1. **Focus ring removed on filter selects.** `globals.css:1222–1226` sets `.filter-select:focus { outline: none; … }`. Its specificity beats the global `:focus-visible` ring (lines 105–109), so keyboard users get no visible focus on the Source, Assigned, Follow-up and Sort controls. `.filter-input-search` (line 1168) also sets `outline: none`; I did not verify whether its `:focus` rule at line 1175 draws an indicator, so check it.
   *Fix:* `.filter-select:focus-visible { outline: 2px solid var(--color-brand); outline-offset: -2px; }` and drop `outline: none` from the `:focus` rule.
2. **Status messages inside `<label>`.** In `HandlingPanel.tsx` (lines 88–93 and the same pattern for the other fields) "Saving…", "Saved" and "Failed" are children of the `<label>`, so they become part of the control's accessible name and are never announced.
   *Fix:* move them to a sibling `<span aria-live="polite">`.
3. **Breadcrumb shows the database id.** `[id]/page.tsx:52` prints `enquiry.id.toUpperCase()` (a cuid string) instead of `enquiry.reference` (for example `ENQ-0042`).
4. **Table header scope.** `EnquiryTable.tsx` (lines 32–38) has `<th>` without `scope="col"`.
5. **Responsive (could not verify).** The `components/enquiries` folder has no card/list variant of the table, so unless `globals.css` converts rows into cards at small widths (I did not trace this), the 7-column table relies on horizontal scrolling at 390px. Check it on a phone-sized viewport and confirm the table sits inside an `overflow-x: auto` wrapper.

**Priority:** Medium (items 1–2), Low (items 3–5).

---

### M11 — Update service: noisy activity log and read outside the transaction

**File / function:** `src/lib/services/enquiry.service.ts` → `updateEnquiry` (lines 321–490).

**Problems:**
1. Line 432 defines `followUpClearedByStatus` and line 434 logs a `FOLLOW_UP_CHANGED` entry for it, although the nearby comment says an automatic clear should not be logged. The dashboard screenshot shows the result: "Status changed Qualified → Lost" immediately followed by "Follow-up changed to cleared".
2. The current row is read at line 326 with a separate `findUnique`, and the update runs later in `$transaction` (line 473). Two simultaneous edits both diff against stale data, so the activity log can record an inaccurate "from" value.

**Impact:** Noisy history; occasionally wrong history under concurrent edits (low probability for this app).

**Priority:** Medium (1), Low (2).

**Fix:**
- Delete `followUpClearedByStatus` and change line 434 to `if (followUpChangedManually)`.
- Optionally move the `findUnique` inside the `$transaction` callback and compute the diff there.

---

### M12 — README is the create-next-app boilerplate

**File:** `README.md`.

**Problem / impact:** For an assessment submission the README is the first thing a reviewer reads. It currently says nothing about the project, how to run it, the decisions made, or what was left out.

**Priority:** Medium.

**Fix:** replace it with: one-paragraph description, features, tech stack, setup (`.env`, Neon branches, `npm run db:migrate`, `npm run db:seed`), environment variables table, scripts, API endpoint list (`GET/POST /api/enquiries`, `GET/PATCH /api/enquiries/:id`, `GET /api/team-members`, `GET /api/health`), key decisions (service layer, URL-driven filters, date-only follow-ups, no auth), assumptions, deliberately out-of-scope items, and known limitations.

---

## 5. Low-priority findings

**L1 — `PUT` is the primary update verb.** `src/app/api/enquiries/[id]/route.ts:36` exports `PUT`, with `export const PATCH = PUT` at line 76, and the comment admits PATCH semantics. `HandlingPanel` calls `PUT` (line 52). *Fix:* define `export const PATCH = withErrorHandling(...)`, delete `PUT` and the unused `RouteContext` type (line 17), and use `apiPatch` (C1).

**L2 — `prisma.config.ts` hand-rolls an `.env` parser.** Lines 12–34 re-implement dotenv (no multiline values, no `export`, no inline comments), while `dotenv` is in `package.json`. Line 42 also guesses a direct URL by stripping `-pooler`, and falls back to an empty string. *Fix:*

```ts
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config(); // .env fallback (dotenv never overrides values already set)

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
```

**L3 — Redundant code in `db.ts`.** Lines 27–30 are a ternary with identical branches (`["warn", "error"]`); `pgPool` is stored on `globalThis` (lines 12, 33–36) but never read. *Fix:* use `log: ["warn", "error"]` and remove the `pgPool` bookkeeping.

**L4 — Duplicated helpers.** `getInitials` exists in `format.ts:46` and again in `(app)/page.tsx:22`; `extractDigits` in `format.ts:59` and `enquiry.service.ts:70`; the reference formatter in `format.ts:39` (`formatReference`) and `mappers.ts:47` (`toReference`). *Fix:* keep the `format.ts` versions and import them.

**L5 — Unused dependencies.** No imports found in `src/` or `prisma/` for `react-hook-form`, `@hookform/resolvers` or `lucide-react`. `dotenv` is used only by `prisma/cleanup.js` today (it becomes used again after L2). `sonner` is imported only for `<Toaster>` until C1/C3 add `toast` calls. *Fix:* `npm uninstall react-hook-form @hookform/resolvers lucide-react`. Alternatively adopt `react-hook-form` in `EnquiryForm`, but that is a larger change than this review recommends.

**L6 — Repository clutter.** Tracked files that should not be in a submission: `int.txt` (setup notes containing a Neon project id in `neon link --project-id …`; an identifier rather than a credential, but internal infrastructure detail), `prisma/cleanup.js`, `prisma/remove-test-data.sql`, `prisma/remove-test-data.ts` (three overlapping one-off scripts; `cleanup.js` runs `DELETE … WHERE lower("clientName") LIKE '%test%'` with no confirmation, which would also remove a real client such as "Contest Co."). `AGENTS.md` and `CLAUDE.md` are tooling files you may want to remove. *Fix:* delete them (they remain in git history; no secrets were present in the working tree).

**L7 — No automated tests.** No test script and no test framework. *Fix (small and honest):* add Vitest and 6–8 unit tests for `createEnquirySchema` (blank follow-up, budget edge cases, email-or-phone rule), `parseListQuery`, `computeFollowUpState`, and `buildWhere` (export it for testing). Add `"test": "vitest run"`.

**L8 — `api-client.ts` weaknesses** (from my read of `apiRequest`, around lines 25–63; confirm while editing). (a) The `fetch` options are spread after the default `headers`, so passing any `headers` would silently drop `Content-Type`; merge them instead. (b) `res.json()` sits inside the same `try` as `fetch`, so a non-JSON response (for example an HTML 502/504 from the platform) is reported as `NETWORK_ERROR` rather than a server error. *Fix:* parse JSON in its own `try`, and on failure return `{ ok: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server response." } }`.

**L9 — Dashboard query waterfall.** In `dashboard.service.ts`, `wonBySource` (line 233), the team-member lookup (line 246) and `overdueByAssignee` (line 254) run sequentially after the main `Promise.all` (line 126). *Fix:* add them to the same `Promise.all`. The dashboard also uses one try/catch for the whole page (lines 95–110), so a single failing query blanks everything; acceptable for the assessment, but wrapping sections independently (as the spec suggested) would be more resilient.

---

## 6. Requirement checklist (as shown in the code)

| Requirement | Status | Notes |
|---|---|---|
| Create enquiry | **Broken in UI** | Server and schema are fine; see C1, H1. |
| Read/list enquiries | Works | |
| View single enquiry | Works | Breadcrumb shows the wrong identifier (M10.3). |
| Update enquiry | **Partial** | Only quick actions, and they report failure (C1); no full edit (C3). |
| Search | **Broken** | C2. Service logic itself looks correct. |
| Filter by status / source / assignee | **Broken** | C2. Service `buildWhere` is correct. |
| Dashboard from real data | Works | Prisma `count`/`aggregate`/`groupBy`; no hard-coded figures. |
| Validation (client and server) | Mostly works | Shared Zod schema; H1, M4, M5. |
| Loading states | **Missing** | H2. |
| Empty states | Present | List and dashboard. |
| Error states | **Partial** | Inline panels on list/dashboard; no boundaries (H2). |
| Success states | **Partial** | Toaster mounted but unused (H2). |
| Responsive | Unverified | CSS breakpoints exist; table behaviour at 390px not confirmed (M10.5). |
| Secrets in repo | None found in working tree | `.env.local` ignored; `.env.example` has placeholders; see L6 for `int.txt`. |

---

## 7. Ordered change list for Antigravity

Apply these in order. After each numbered group, run `npm run lint` and `npx tsc --noEmit`.

**Group A — make the existing flows work (Critical/High)**
1. `src/app/(app)/enquiries/page.tsx`: type `searchParams` as a `Promise<Record<string, string | string[] | undefined>>`, `await` it into `raw`, and parse with `parseListQuery(raw)` (C2).
2. `src/lib/validation/enquiry.ts`: add and export `parseListQuery` (M5 snippet). Replace `parseInt` budget logic with a strict `/^\d{1,9}$/` parser (M4). Export an `editEnquirySchema` that is the create schema without the past-date follow-up rule.
3. `src/components/enquiries/EnquiryForm.tsx`: add `readForm()` and use it in both `validateForm` and `handleSubmit`; send the parsed data (H1). Replace the `fetch` block with `apiPost`, show `toast.success`, push to the detail page, and map `result.error.fieldErrors` to field errors (C1). Replace the synthetic submit with `requestSubmit()`. Remove both `as any` casts and the unused `z` import.
4. `src/components/enquiries/HandlingPanel.tsx`: replace the `fetch` block with `apiPatch`, use `result.ok` / `result.error.message`, add `toast.error` on failure (C1). Type `payload` as a typed `const`. Remove the unused `useRef` import. Move status text out of `<label>` into an `aria-live="polite"` sibling (M10.2). Simplify line 24 to `useState(enquiry.nextFollowUpAt ?? "")`.
5. Create `src/app/(app)/enquiries/[id]/edit/page.tsx` (C3 snippet) and extend `EnquiryForm` with `mode="edit"` and an `enquiry` prop (default values, `editEnquirySchema`, `apiPatch` with changed fields only, "Save changes", `toast.success("Changes saved")`).
6. `src/app/(app)/enquiries/page.tsx`: add the out-of-range page redirect (M5).

**Group B — states and feedback (High)**
7. Add `src/app/(app)/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/(app)/enquiries/[id]/not-found.tsx` (H2).
8. Add `src/app/(app)/loading.tsx` and `src/app/(app)/enquiries/loading.tsx` plus a `.skeleton` class in `globals.css` (150 ms delayed fade-in, reduced-motion safe) (H2).

**Group C — API and server hardening (Medium)**
9. `src/lib/api-response.ts`: fix `assertSameOrigin` and import `ForbiddenOriginError` at the top (M1); share the `requestId` between the log and the response, map `P2003`, add `readJson()` (M6).
10. `src/app/api/enquiries/route.ts` and `src/app/api/enquiries/[id]/route.ts`: use `readJson` and `schema.parse(...)`; export `PATCH` as the main handler, delete `PUT` and `RouteContext` (M6, L1). Keep `safeParse` → 400 in the list `GET`.
11. `src/lib/services/enquiry.service.ts`: delete `getTeamMembers`; remove `followUpClearedByStatus` from the activity condition; optionally read the current row inside the transaction (M3, M11).
12. Replace `getTeamMembers` with `listTeamMembers` in `enquiries/page.tsx`, `enquiries/[id]/page.tsx`, `enquiries/new/page.tsx` (M3).
13. `src/components/enquiries/EnquiryFilters.tsx`: single form-level handler, 300 ms debounce for `q`, `router.replace`, remove per-select `onChange` (M2).

**Group D — maintainability (Medium/Low)**
14. `src/lib/constants.ts`, `validation/enquiry.ts`, `types/dto.ts`: single-source the enum lists using `satisfies Record<Enum, string>` (M8).
15. `src/lib/db.ts`: import `env`, simplify `log`, remove `pgPool` (M7, L3). `src/lib/constants.ts`: make the timezone a constant (M7). `.env.example`: remove `ACCESS_PASSPHRASE_*`.
16. `prisma.config.ts`: replace the manual parser with `dotenv` (L2).
17. Remove duplicate helpers and import from `src/lib/format.ts` (L4). Remove unused imports/variables listed in M9, including `mappers.ts:94`.
18. Fix the lint errors in M9 (`<Link>`, escaped apostrophes, `unknown` instead of `any`). Run `npm run lint` until it passes with no errors.
19. `src/lib/api-client.ts`: merge headers and parse JSON separately (L8). `dashboard.service.ts`: fold the three sequential queries into the `Promise.all` (L9).

**Group E — accessibility and polish (Medium/Low)**
20. `globals.css`: replace `.filter-select:focus { outline: none }` with a `:focus-visible` outline; confirm `.filter-input-search` shows a focus indicator (M10.1).
21. `enquiries/[id]/page.tsx:52`: show `enquiry.reference` in the breadcrumb. `EnquiryTable.tsx`: add `scope="col"` to headers (M10).

**Group F — submission quality (Medium/Low)**
22. Delete `int.txt`, `prisma/cleanup.js`, `prisma/remove-test-data.sql`, `prisma/remove-test-data.ts`, and (optionally) `AGENTS.md`/`CLAUDE.md` (L6).
23. `npm uninstall react-hook-form @hookform/resolvers lucide-react` (L5).
24. Rewrite `README.md` (M12).
25. (Optional) Add Vitest and the unit tests listed in L7.

**Acceptance checks to run in the browser after the changes**
- Create an enquiry **without** a follow-up date → it succeeds, a success toast appears, and you land on the detail page. No duplicate rows.
- Create with invalid data (for example no email and no phone) → field errors from the server and client are shown next to the fields.
- Open `/enquiries?status=WON` → only Won enquiries; try `?source=WHATSAPP`, `?assignee=<id>`, `?q=acme`, `?page=2`, `?page=99` (redirects to last page), `?page=abc` (ignores only the bad value).
- Type in the search box → one request after you stop typing; the Back button does not step through keystrokes.
- On the detail page change status, assignee and follow-up → each shows "Saved" and the activity list updates; moving to Won/Lost clears the follow-up with a single activity entry for the status change.
- Click **Edit** → the form opens pre-filled; change the description and budget; save; the detail page reflects it. Open `/enquiries/does-not-exist` → styled not-found page.
- Throttle the network in dev tools → loading skeletons appear after about 150 ms.
- Keyboard only: tab through the filter bar and confirm a visible focus ring on every control.
- At 390px width: no horizontal page scroll; the table is usable.
- `npm run lint` and `npx tsc --noEmit` both pass; `npm run build` succeeds.
