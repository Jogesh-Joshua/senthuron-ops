# Enquiry Desk — Product Specification

**Client:** Senthuron Tech · **Track:** A — Full Stack · **Stack:** Next.js (App Router), TypeScript, PostgreSQL (Neon), Prisma, Tailwind CSS, shadcn/ui (Radix), Vercel

Working product name: **Enquiry Desk**. The organising metaphor is a well-kept *desk ledger*: every enquiry is a line in a ledger, every line has a stage and a next action, and the first thing you see each morning is what needs your attention today.

## Assumptions to confirm

| # | Assumption | Why it matters |
|---|---|---|
| A1 | No login. Team members are seeded records used only for "Assigned person". | Auth is not in the brief; see §32 for the mitigation. |
| A2 | One currency, defined in a single constant (default assumption: INR, Indian digit grouping). | Budget display and dashboard totals. |
| A3 | One business timezone, defined in a single constant. Follow-up dates are date-only. | "Due today" and "Overdue" must be unambiguous. |
| A4 | Enquiries are never deleted. "Lost" is the terminal state for dead enquiries. | Brief lists create, read, view and update only. |
| A5 | Team size is 2–8 people; data volume is hundreds of enquiries, not millions. | Justifies simple `ILIKE` search and offset pagination. |

---

## 1. Product vision

Enquiry Desk is the single place where Senthuron Tech's business enquiries live, from the first WhatsApp message to a won or lost outcome. It replaces scattered chats, notes and spreadsheets with one calm, fast, trustworthy record.

**Vision statement:** *No enquiry is forgotten, and everyone can see where every opportunity stands.*

**Success looks like:**
- A new enquiry is captured in under 60 seconds.
- A team member opens the app and knows what to do next without searching.
- A manager can describe the pipeline in one glance.

## 2. Target user

**Primary — the enquiry handler.** A business development or operations team member at Senthuron Tech who receives enquiries through WhatsApp, Instagram, email, the website, referrals and conversations. Works mostly at a desktop, but captures and updates from a phone between conversations. Comfortable with tools, impatient with ceremony.

**Secondary — the manager or founder.** Wants to understand pipeline health, workload spread and which channels produce real business. Reads more than they write.

## 3. User problems

1. Enquiry details are split across chat threads, notes and personal spreadsheets, so no single source of truth exists.
2. Follow-ups get missed because the next action lives in someone's memory.
3. Nobody can tell quickly whether an enquiry is new, being worked, or stalled.
4. Ownership is unclear: who is handling this client?
5. Requirements get lost or restated inconsistently across channels.
6. Leadership cannot see volume, stage distribution, channel quality or workload without asking around.
7. Capturing an enquiry feels like admin, so it gets skipped when things are busy.

## 4. Primary user journeys

**Journey A — Morning check (the daily loop)**
1. Open Enquiry Desk and land on the **Desk** (dashboard).
2. Read the headline: "3 follow-ups overdue, 2 due today."
3. Click the top item in **Needs attention**.
4. Read the requirement and notes on the detail page; contact the client outside the app.
5. Return, set the new status and the next follow-up date (one or two clicks each), and add a note if useful.
6. Go back to the Desk; the item has left the attention list.

**Journey B — Capture (the fast path)**
1. A WhatsApp enquiry arrives. Click **New enquiry**.
2. Fill in client, contact person, phone or email, source, service and a short description.
3. Optionally assign, set a budget and a follow-up date.
4. Save. Land on the new enquiry with a success confirmation.

**Journey C — Find and review**
1. Go to **Enquiries**, type a company name, or filter by status, source or assignee.
2. Open the enquiry, review, edit if needed.

**Journey D — Pipeline review (manager)**
1. Open the Desk, read the stage breakdown, source breakdown and workload by person.
2. Click a stage to see exactly those enquiries in the list.

## 5. Information architecture

```
Enquiry Desk
├── Desk (dashboard)               /
├── Enquiries
│   ├── List (search, filter, sort) /enquiries
│   ├── New enquiry                 /enquiries/new
│   └── Enquiry
│       ├── Detail                  /enquiries/[id]
│       └── Edit                    /enquiries/[id]/edit
└── System pages
    ├── Not found                   (404)
    └── Error                       (error boundary)
```

Object model, in plain words: a **team member** is assigned many **enquiries**; an **enquiry** has one **status** and one **source**, at most one **next follow-up date**, and an **activity history**.

## 6. Page list

| Page | Route | Purpose |
|---|---|---|
| Desk | `/` | Today's attention list, pipeline summary, source and workload breakdowns. |
| Enquiries | `/enquiries` | Search, filter, sort and browse all enquiries. |
| New enquiry | `/enquiries/new` | Capture a new enquiry. |
| Enquiry detail | `/enquiries/[id]` | Full record, quick actions, activity. |
| Edit enquiry | `/enquiries/[id]/edit` | Edit all fields. |
| Not found | `not-found.tsx` | Missing enquiry or bad route. |
| Error | `error.tsx` | Unexpected failure with retry. |

## 7. Navigation structure

**Desktop (≥1024px): fixed left rail, 232px.**
- Wordmark at top ("Enquiry Desk" with the Senthuron Tech name as a small subline).
- Nav items: **Desk**, **Enquiries** (with open-enquiry count in mono type).
- Primary action button **New enquiry** pinned beneath the nav.
- Active item marked by a 2px ink bar on the left plus bolder weight, not a coloured pill.

**Tablet and mobile (<1024px):**
- Slim top bar: wordmark left, **New** button right.
- Bottom tab bar: Desk · Enquiries · New (44px+ touch targets, safe-area aware).

**Within a record:** breadcrumb `Enquiries / ENQ-0042`, and a clear **Back to list** that restores the previous filters (filters live in the URL).

## 8. Dashboard structure (the Desk)

Composed as a typographic briefing, **not** a grid of icon cards.

**8.1 Headline.** One serif sentence generated from live data: *"3 follow-ups are overdue and 2 are due today."* With nothing pending: *"You're clear. No follow-ups due today."* Today's date sits above it in small caps.

**8.2 Ledger figures.** One horizontal band of five figures separated by hairline rules, with large serif numerals and a small label under each:

| Figure | Definition |
|---|---|
| Open enquiries | Status is New, Contacted, Qualified, Proposal Sent or Negotiation. |
| Overdue | Open, with follow-up date before today. |
| Due today | Open, with follow-up date equal to today. |
| Open pipeline value | Sum of budgets on open enquiries (with "n without budget" caption). |
| Win rate | Won ÷ (Won + Lost), all time, shown as a percentage with the counts beneath. |

Each figure links to the matching filtered list where relevant.

**8.3 Needs attention (lead section).** Up to 8 rows, in this order: overdue (oldest first), due today, then open enquiries with **no follow-up set**. Each row shows follow-up chip, client, contact person, stage mark, assignee. Footer link: "View all n".

**8.4 Pipeline by stage.** A ruled list, one row per open stage: stage name, count, budget subtotal, and a proportional bar. Each row links to `/enquiries?status=...`. Won and Lost appear below a divider as a closed-outcomes summary.

**8.5 By source.** Ranked list of sources: count, share, and won count, with an inline bar. Answers "which channel actually converts?".

**8.6 Workload.** One row per team member: open count, overdue count, and an "Unassigned" row when relevant. Links to the assignee filter.

**8.7 Recent activity.** Last 6 events (created, status changed) with relative time. Lowest priority; collapsible on mobile.

## 9. Enquiry list structure

**Header:** title "Enquiries", total count, **New enquiry** button.

**Status strip:** a horizontal tab-like strip: *All · New · Contacted · Qualified · Proposal Sent · Negotiation · Won · Lost*, each with a count. Selecting one sets the status filter. Scrolls horizontally on small screens.

**Toolbar:** search input (left, wide), then Source, Assigned to, Follow-up (Any / Overdue / Due today / Next 7 days / Not set), Sort, and a **Clear filters** text button appearing only when filters are active.

**Desktop table (dense ledger rows, ~56px):**

| Column | Content |
|---|---|
| Enquiry | Client / company (semi-bold) over contact person (muted). Mono reference `ENQ-0042` on hover/secondary line. |
| Service | Service label. |
| Source | Source label with small channel glyph. |
| Stage | Stage mark (glyph + label). |
| Budget | Right-aligned, mono, tabular numerals; en dash if none. |
| Assigned | Name, or muted "Unassigned". |
| Next follow-up | Follow-up chip (Overdue / Today / date). |
| Updated | Relative time, muted. |

Row click opens the detail page; the whole row is a real link for keyboard and middle-click use.

**Mobile card:** client + stage mark on the first line; contact person and service on the second; follow-up chip, assignee initials and budget on the third.

**Footer:** "Showing 1–15 of 42", Previous / Next. Page size 15.

## 10. Enquiry detail structure

**Header block**
- Reference `ENQ-0042` (mono, muted), client/company in serif display type, contact person beneath.
- **Stage track:** the seven-step lifecycle drawn as a thin horizontal track with the current stage filled; Lost shown as a distinct terminated state.
- **Edit** button (secondary).

**Main column**
1. **Requirement:** service, full description.
2. **Contact:** contact person, email (`mailto:`), phone (`tel:`), plus a WhatsApp link when the phone is present.
3. **Notes:** additional notes, preserving line breaks.
4. **Activity:** reverse-chronological list (created, status changes, follow-up changes, reassignments) with timestamps.

**Side panel — "Handling" (sticky on desktop)**
- **Status:** inline select; changes save immediately.
- **Assigned to:** inline select.
- **Next follow-up:** date display with quick chips (Tomorrow, In 3 days, Next week, Pick date, Clear).
- **Budget** and **Source** (read-only here; edit via Edit).
- Created and last updated timestamps.

Quick actions save immediately with optimistic UI and roll back with an error message on failure. Full-field changes go through the Edit page.

## 11. Create enquiry flow

Route: `/enquiries/new`. Single page, single column, three labelled groups.

**Group 1 — Who**
- Client / Company name *
- Contact person *
- Email
- Phone
- (Helper text: "Provide at least an email or a phone number.")

**Group 2 — What**
- Enquiry source * (select)
- Service / Requirement * (select)
- Requirement description * (textarea, character counter)
- Estimated budget (numeric, currency prefix)

**Group 3 — Handling**
- Status (defaults to **New**)
- Assigned person (defaults to Unassigned)
- Next follow-up date (with quick chips: Today, Tomorrow, In 3 days, Next week)
- Additional notes

**Flow**
1. Land on the form; first field autofocused.
2. Fields validate on blur, then live once touched.
3. **Create enquiry** submits. Button enters a pending state ("Creating…") and the form is disabled.
4. On success: redirect to the new enquiry detail with a success toast: "Enquiry created" and the reference.
5. On validation failure from the server: field errors are mapped to fields, focus moves to the first invalid field, and an error summary appears at the top.
6. On a network or server failure: form stays intact with all input preserved, an inline alert explains and the button becomes available again.
7. **Cancel** returns to the list (confirm only if the form is dirty).

Should-have: a non-blocking notice "A similar enquiry may already exist" when the email, phone or company name matches an existing record, linking to it.

## 12. Update enquiry flow

Two deliberately different paths:

**Quick updates (detail page side panel).** Status, assignee and follow-up date. One interaction, saved immediately, confirmed by a subtle inline "Saved" and an activity entry. Moving to **Lost** opens a small confirmation with an optional closing note; moving to **Won** or **Lost** clears the follow-up date.

**Full edit (`/enquiries/[id]/edit`).** The same form component as Create, pre-filled, with a "Save changes" button.
1. Only changed fields are sent (PATCH semantics).
2. Leaving with unsaved changes prompts a confirmation.
3. On success: redirect to detail with toast "Changes saved".
4. Editing an enquiry that has meanwhile been changed elsewhere: last write wins for this scope; `updatedAt` is displayed so users can spot staleness.
5. A past follow-up date is allowed on edit but flagged as "in the past".

## 13. Status lifecycle

```
New → Contacted → Qualified → Proposal Sent → Negotiation → Won
  \________________________________________________________→ Lost
```

| Status | Meaning | Typical next action |
|---|---|---|
| New | Captured, nobody has responded yet. | First contact. |
| Contacted | First response sent or call made. | Understand the need. |
| Qualified | Real need, budget and fit confirmed. | Prepare a proposal. |
| Proposal Sent | Quote or proposal delivered. | Follow up on decision. |
| Negotiation | Discussing scope, price or terms. | Close. |
| Won | Client confirmed. Terminal. | — |
| Lost | Not proceeding. Terminal. | — |

**Rules**
- The interface presents the *next forward stage* as the primary action, with all other statuses reachable from the dropdown. Backward moves are allowed (people make mistakes and deals go backwards).
- **Lost** is reachable from any stage, and asks for confirmation.
- **Won** and **Lost** are terminal but can be reopened by choosing another status; the change is recorded in activity.
- On Won or Lost the follow-up date is cleared and no longer expected.
- Open stages with no follow-up date are surfaced on the Desk as "No follow-up set".
- Every status change is written to the activity history with old and new values.

**Stage glyphs (visual identity).** A circle that fills progressively: empty (New), quarter, half, three-quarter (Proposal Sent), nearly full (Negotiation), solid with a tick (Won), and struck-through (Lost). Colour is a secondary cue; the label and the fill level carry the meaning.

## 14. Search and filter behaviour

- **Search** matches, case-insensitively and by substring: client/company, contact person, email, phone (digits-normalised), and requirement description. Debounced by 300ms; also fires on Enter.
- **Filters** are Status, Source, Assigned to (including "Unassigned"), and Follow-up (Any, Overdue, Due today, Next 7 days, Not set). Combined with **AND**.
- **Sort:** Follow-up soonest (default, nulls last), Recently updated, Newest, Budget high→low.
- **URL is the state:** `?q=acme&status=QUALIFIED&source=WHATSAPP&assignee=<id>&due=overdue&sort=followup&page=2`. Links are shareable, the back button works, and refresh preserves the view.
- Changing any filter or search resets to page 1.
- Status counts in the strip reflect the *other* active filters, so numbers always match what the user would see after clicking.
- Result summary is announced to assistive tech: "12 enquiries found".
- Dashboard elements deep-link into pre-filtered lists.

## 15. Form validation

Validation is defined once as a Zod schema, shared by client and server. The server is authoritative.

| Field | Rule | Message (example) |
|---|---|---|
| Client / Company | Required, trimmed, 2–120 chars | "Enter the client or company name." |
| Contact person | Required, trimmed, 2–100 chars | "Enter the contact person's name." |
| Email | Optional; valid format; ≤254 chars | "Enter a valid email address." |
| Phone | Optional; 7–15 digits; allows `+`, spaces, hyphens, brackets | "Enter a valid phone number." |
| Email / Phone | At least one required | "Add an email or a phone number so you can reach them." |
| Source | Required, one of the enum values | "Choose where this enquiry came from." |
| Service | Required, one of the enum values | "Choose a service." |
| Description | Required, 10–2000 chars | "Describe the requirement in at least 10 characters." |
| Budget | Optional; whole number ≥ 0; ≤ 999,999,999 | "Enter a budget as a whole number." |
| Status | Required, enum; default New | — |
| Assigned person | Optional; must exist | "Choose a valid team member." |
| Follow-up date | Optional; valid date; on create must not be in the past | "Choose today or a future date." |
| Notes | Optional; ≤ 2000 chars | "Notes can be up to 2000 characters." |

**Behaviour**
- Messages say what to do, not what is wrong in the abstract.
- Errors appear beneath the field, linked by `aria-describedby`, plus a summary at the top on submit.
- Required fields are marked in the label text ("required"), not only by an asterisk.
- Whitespace is trimmed; the phone is stored as entered but searched normalised.
- Server errors return per-field messages in the same shape.

## 16. Loading states

- **Route level:** each route has a `loading.tsx` with skeletons that mirror the real layout (table rows, dashboard figures, detail blocks), so nothing jumps.
- **List refetch on filter change:** keep the previous results visible, dim slightly, and show a thin progress line under the toolbar; no full-page spinner.
- **Buttons:** pending label ("Creating…", "Saving…"), disabled, with a small spinner; width does not change.
- **Quick actions:** the control shows a subtle pending state; optimistic value applies immediately.
- **Skeletons** are static or very low-contrast pulse, and disabled under reduced motion.

## 17. Empty states

Each empty state has a short human sentence, a reason, and a next step.

| Situation | Message | Action |
|---|---|---|
| No enquiries exist yet | "No enquiries yet. Your first one starts the ledger." | **New enquiry** |
| Search or filters return nothing | "Nothing matches these filters." (echo the filters used) | **Clear filters** |
| Desk: nothing overdue or due | "You're clear. No follow-ups due today." | — |
| Desk: no enquiries at all | Onboarding-style prompt | **New enquiry** |
| Source or workload breakdown empty | "Nothing to show until enquiries are added." | — |
| Activity empty | "No activity yet." | — |
| Notes empty | "No notes." (muted, in place) | Edit link |

Illustrations are avoided; empty states use typography and a simple ruled-line motif.

## 18. Error states

| Error | Presentation |
|---|---|
| List or dashboard fetch fails | Inline panel in place of content: "We couldn't load enquiries." with **Try again**. Toolbar stays usable. |
| Enquiry not found | Dedicated not-found page: "That enquiry doesn't exist or was removed." with a link to the list. |
| Invalid enquiry ID format | Treated as not found. |
| Form validation error | Field-level messages plus top summary; focus moved to first invalid field. |
| Submit failure (server/network) | Form preserved; inline alert with retry; toast not used for blocking errors. |
| Quick action failure | Optimistic change rolled back, with an inline message next to the control. |
| Unexpected exception | `error.tsx` boundary: calm message, **Try again**, and a link to Desk. |
| Offline | Detected on failure; message says "You appear to be offline." |

Error copy is plain, blames no one, and never shows stack traces or database messages.

## 19. Success states

- **Created:** redirect to detail; toast "Enquiry created · ENQ-0043".
- **Updated (full edit):** redirect to detail; toast "Changes saved".
- **Quick action:** inline "Saved" text beside the control for ~2 seconds; new entry appears at the top of activity.
- **Status to Won:** a restrained acknowledgement line ("Marked as won"), no confetti.
- Toasts appear bottom-right (desktop) or above the tab bar (mobile), auto-dismiss after ~4s, pause on hover/focus, and are announced via `aria-live="polite"`.

## 20. Responsive behaviour

| Breakpoint | Layout |
|---|---|
| **<640px (mobile)** | Single column. Top bar plus bottom tab bar. List becomes cards. Filters collapse into a **Filters** button with an active-count badge, opening a bottom sheet. Detail page is one column with the Handling panel moved above Requirement. Form actions in a sticky bottom bar. |
| **640–1023px (tablet)** | Top bar, no rail. Table appears with fewer columns (drop Service and Updated). Detail is a single column with a two-up handling grid. |
| **≥1024px (desktop)** | Left rail. Full table. Detail with sticky side panel. Dashboard figures in a single band; breakdowns in two columns. |
| **≥1440px** | Content max-width 1200px, centred; extra space stays empty rather than stretching tables. |

Touch targets are at least 44×44px. No horizontal page scroll at any width; only the status strip may scroll horizontally on its own.

## 21. Accessibility considerations

Target: **WCAG 2.2 AA**.
- Text contrast ≥ 4.5:1 (3:1 for large text and UI boundaries); verified for every status colour on its tint.
- Status is never communicated by colour alone: label + fill-level glyph.
- Everything is operable by keyboard; visible 2px focus ring in the accent colour with offset; logical tab order; **skip to content** link.
- Semantic structure: one `h1` per page, real `table` markup with `th scope`, `nav` and `main` landmarks.
- Every input has a visible label; errors linked with `aria-describedby`; `aria-invalid` set; error summary receives focus on failed submit.
- Toasts and result counts use `aria-live`; loading regions use `aria-busy`.
- Dialogs and sheets trap focus, close on Escape, and return focus to the trigger (Radix primitives).
- Respect `prefers-reduced-motion`; no information carried by animation.
- Date entry uses native date inputs for accessibility and mobile ergonomics.
- Body text never below 14px; users can zoom to 200% without loss.

## 22. Design principles

1. **Next action first.** The interface is organised around "what needs me now?", not around data.
2. **Calm density.** Information-rich but quiet, like a good ledger: rules and alignment instead of boxes and shadows.
3. **Ledger honesty.** Real numbers, real dates, tabular alignment. No decorative charts.
4. **Speed is a feature.** Capture in under a minute; common updates in one click.
5. **One clear primary action per screen.**
6. **Words over widgets.** Plain-sentence headlines and empty states carry personality.
7. **Everything is a link.** Every count and every row leads somewhere useful.
8. **Restraint.** If an element doesn't help someone act or understand, remove it.

## 23. Visual direction

**Concept: "The Desk Ledger".** Warm paper tones, ink-dark text, ruled hairlines, a serif voice for headlines and figures, and monospaced type for data. It should feel like a thoughtfully made internal tool from a small studio, not a template.

**Deliberately avoided:** purple/blue gradient hero areas, glassmorphism, rounded-2xl card grids with floating icons, drop-shadow stacks, emoji, stock illustrations, generic donut charts, and "Welcome back 👋" greetings.

**Signature details**
- Progressive-fill **stage glyphs** used everywhere a status appears.
- **Hairline ruled layouts** (borders instead of card containers).
- **Serif numerals** for dashboard figures; **mono** for references, budgets, dates and phone numbers.
- A subtle **paper background** with no texture image (flat colour only).
- The **reference number** (`ENQ-0042`) treated as a small typographic badge of record.
- Corners are nearly square (3px radius) to reinforce the printed-document feel.

## 24. Typography direction

| Role | Typeface | Usage |
|---|---|---|
| Display / figures | **Newsreader** (variable serif) | Page titles, dashboard headline, big numerals, client name on detail. |
| UI / body | **IBM Plex Sans** | Labels, inputs, navigation, table text, body copy. |
| Data | **IBM Plex Mono** | References, budgets, dates, phone numbers, counts. Tabular numerals on. |

Loaded via `next/font` with `display: swap`; only the weights used are included.

**Scale (px / line-height):** 12/16 caption · 13/20 table meta · 14/22 body · 16/24 emphasis · 20/28 section title · 28/34 page title · 40/44 headline · 48/48 figures.
**Weights:** 400 body, 500 labels/nav, 600 client names and buttons. Serif headings use 500.
**Rules:** sentence case everywhere; small-caps labels only for section eyebrows; numbers right-aligned in tables.

## 25. Color system

Defined as CSS variables mapped into Tailwind's theme. Light theme only.

**Neutrals (paper and ink)**

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F5F2EA` | App background |
| `surface` | `#FBF9F4` | Inputs, popovers, table rows on hover |
| `sunken` | `#EDE9DE` | Table headers, selected rows |
| `rule` | `#D9D3C3` | Hairline borders |
| `rule-strong` | `#BDB59F` | Input borders, emphasis rules |
| `ink` | `#1C1B18` | Primary text |
| `ink-2` | `#5A574E` | Secondary text |
| `ink-3` | `#8A8677` | Muted/disabled (non-essential text only) |

**Brand and semantic**

| Token | Hex | Use |
|---|---|---|
| `accent` | `#1F4D3A` | Primary buttons, links, focus ring (ledger green) |
| `accent-hover` | `#173A2C` | Hover/active |
| `brass` | `#B8862B` | Decorative marks only (never for text) |
| `danger` | `#B3361F` | Overdue, destructive, errors |
| `danger-tint` | `#F6E3DD` | Error backgrounds |
| `success` | `#23663F` | Success feedback |
| `warning` | `#8A5A00` | Due-today emphasis |

**Stage colours** (text colour on a 12% tint of the same hue, glyph in the text colour)

| Stage | Text | Feel |
|---|---|---|
| New | `#4B5A6B` | Slate |
| Contacted | `#2F5F8A` | Steel blue |
| Qualified | `#1E6B66` | Teal |
| Proposal Sent | `#8A5A00` | Ochre |
| Negotiation | `#A24B1E` | Terracotta |
| Won | `#23663F` | Green |
| Lost | `#6B6357` | Warm grey, label struck through |

Follow-up chip colours: **Overdue** danger, **Today** warning, **Upcoming** ink-2, **Not set** muted with dashed outline.

## 26. Spacing system

- Base unit **4px**. Scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Page gutters: 16px mobile, 24px tablet, 32px desktop. Content max-width 1200px.
- Left rail width 232px. Table row height 56px (48px compact on tablet).
- Form field vertical rhythm: 20px between fields, 32px between groups. Field height 40px (44px on touch).
- Section spacing on Desk: 48px between sections, separated by a hairline rule rather than card borders.
- Radius: 3px default; 6px for sheets/dialogs; pills only for the follow-up chip.
- Elevation: borders first. Shadows are reserved for popovers, dialogs and toasts (one soft shadow token).

## 27. Component system

Base: **shadcn/ui on Radix primitives**, restyled to the tokens above so nothing looks like the defaults. Icons: **Lucide** at 16px, stroke 1.5.

**Base components (restyled):** Button, Input, Textarea, Select, Label, Field error, Popover, Dropdown menu, Dialog / Alert dialog, Sheet (mobile filters), Toast (Sonner), Tooltip, Skeleton, Table primitives, Tabs-like status strip.

**Custom components**

| Component | Purpose |
|---|---|
| `StageMark` | Progressive-fill glyph + label for a status. |
| `StageTrack` | Seven-step lifecycle track on the detail header. |
| `FollowUpChip` | Overdue / Today / date / Not set. |
| `LedgerFigure` | Large numeral with label and optional link. |
| `RuledList` / `BarRow` | Stage, source and workload rows with inline proportional bar. |
| `EnquiryRow` / `EnquiryCard` | Table row and mobile card variants. |
| `FilterBar` | Search, selects, clear; synced to URL. |
| `EnquiryForm` | Shared create/edit form with field groups. |
| `HandlingPanel` | Inline status/assignee/follow-up controls. |
| `ActivityList` | Timeline entries. |
| `EmptyState`, `ErrorPanel`, `PageHeader`, `FieldGroup` | Structural pieces. |

Components live in a small `components/ui` (base) and `components/enquiry` (domain) split.

## 28. Interaction patterns

- **URL-driven state** for search, filters, sort and page.
- **Rows are links**, not click handlers on divs.
- **Inline quick edits** save on selection; forms use explicit Save.
- **Optimistic updates** for status, assignee and follow-up with rollback.
- **Confirm only when it matters:** marking Lost, leaving a dirty form.
- **Follow-up chips** (Today, Tomorrow, In 3 days, Next week) make date entry one tap.
- **Contact shortcuts:** email, phone and WhatsApp links open the right app.
- **Keyboard shortcuts (could-have):** `/` focus search, `n` new enquiry.
- **Focus management:** after create/save redirects, focus lands on the page heading; after errors, on the first invalid field.
- **Preserve context:** returning from a detail page restores the list's filters and scroll.

## 29. Animation principles

- **Purposeful and quick:** 120–200ms, `ease-out`; nothing decorative or looping.
- **Allowed motion:** toast slide/fade, sheet and dialog enter/exit, stage-track fill transition, status glyph fill on change, skeleton pulse, and a thin list-loading progress line.
- **Not allowed:** page transitions, parallax, bouncing, confetti, animated counters.
- **Layout stability:** motion never shifts content that the user is reading or clicking.
- **Reduced motion:** all transitions collapse to instant opacity changes under `prefers-reduced-motion`.

## 30. Database entities required

PostgreSQL on Neon, accessed through Prisma.

**TeamMember**

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Unique, display name |
| `email` | String? | Optional |
| `createdAt` | DateTime | Default now |

**Enquiry**

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key, used in URLs |
| `number` | Int | Auto-increment, unique; displayed as `ENQ-0042` |
| `clientName` | String | Client / Company name |
| `contactPerson` | String | |
| `email` | String? | |
| `phone` | String? | |
| `source` | Enum `EnquirySource` | WHATSAPP, INSTAGRAM, EMAIL, WEBSITE, REFERRAL, DIRECT, OTHER |
| `service` | Enum `ServiceType` | WEB_DEVELOPMENT, MOBILE_APP, UI_UX_DESIGN, CUSTOM_SOFTWARE, MAINTENANCE_SUPPORT, CONSULTING, OTHER |
| `description` | String | Requirement description |
| `budget` | Int? | Whole currency units (avoids Decimal serialisation friction) |
| `status` | Enum `EnquiryStatus` | NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST; default NEW |
| `assignedToId` | String? | FK to TeamMember |
| `nextFollowUpAt` | Date? | `@db.Date`, date-only |
| `notes` | String? | Additional notes |
| `createdAt` / `updatedAt` | DateTime | |

**EnquiryActivity**

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `enquiryId` | String | FK, cascade |
| `type` | Enum | CREATED, STATUS_CHANGED, FOLLOW_UP_CHANGED, ASSIGNEE_CHANGED, DETAILS_UPDATED |
| `fromValue` / `toValue` | String? | Human-readable old and new values |
| `note` | String? | Optional closing note |
| `createdAt` | DateTime | |

**Indexes:** `status`, `source`, `assignedToId`, `nextFollowUpAt`, `updatedAt`, and `(enquiryId, createdAt)` on activity.
**Seed:** 5 team members and ~30 realistic but fictional enquiries across all stages, sources, overdue and due-today follow-ups, so the dashboard and every state can be demonstrated.
**Migrations:** Prisma Migrate; the runtime uses Neon's pooled connection string and migrations use the direct one.

## 31. API requirements

Route Handlers under `/api`, backed by a shared service layer (`lib/enquiries`) that server components also call directly. All inputs validated with Zod.

| Method & path | Purpose |
|---|---|
| `GET /api/enquiries` | List. Params: `q`, `status`, `source`, `assignee`, `due`, `sort`, `page`, `pageSize` (max 50). Returns `items`, `total`, `page`, `pageSize`, `statusCounts`. |
| `POST /api/enquiries` | Create. Returns 201 with the enquiry. Writes a CREATED activity. |
| `GET /api/enquiries/:id` | Single enquiry including assignee and activity. |
| `PATCH /api/enquiries/:id` | Partial update. Writes activity entries for status, assignee, follow-up and details changes. |
| `GET /api/dashboard` | Headline counts, ledger figures, needs-attention list, stage/source/workload aggregates, recent activity. |
| `GET /api/team-members` | For assignee selects and filters. |

**Conventions**
- JSON in and out; ISO dates.
- Error shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fieldErrors": { "email": ["…"] } } }`.
- Status codes: 200, 201, 400 (malformed), 404, 422 (validation), 500 (generic message).
- No delete endpoint.

## 32. Security considerations

- **Validate everything server-side** with the shared Zod schema; enforce max lengths and enum membership.
- **Prisma only, no raw SQL**, so queries are parameterised; search terms are passed as parameters.
- **Output safety:** React escaping only; no `dangerouslySetInnerHTML`; `mailto:` and `tel:` links built from validated values.
- **Secrets:** database URLs in Vercel environment variables, never committed; `.env.example` provided.
- **Prisma client singleton** to avoid connection exhaustion on serverless; pooled Neon URL at runtime.
- **Pagination caps** (`pageSize ≤ 50`) and bounded input sizes to limit abuse.
- **Error hygiene:** generic 500 messages; no stack traces or SQL in responses; no personal data in logs.
- **Security headers** via `next.config` (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a basic CSP).
- **Same-origin API** with no permissive CORS.
- **Data hygiene:** seed data is entirely fictional; no real client data goes into the deployed demo.
- **No authentication (A1):** the deployed URL is public. Mitigation: state it explicitly in the README, and optionally add a lightweight shared-passphrase gate through middleware and an environment variable. Full authentication and roles are out of scope.

## 33. What should NOT be implemented (out of scope)

- Authentication, user accounts, roles and permissions.
- Delete, archive, restore or bulk actions.
- Kanban / drag-and-drop pipeline board (tempting, but the list plus stage strip meets the brief).
- Integrations: WhatsApp, Instagram, email inbox sync, website form webhooks, calendar sync.
- Email, SMS or push notifications and reminder scheduling.
- File attachments, document generation, proposals, quotes or invoicing.
- Comment threads, @mentions and real-time collaboration.
- Custom fields, custom pipelines or configurable statuses.
- CSV import/export and report builders.
- AI features (auto-summaries, lead scoring, auto-replies).
- Multi-tenant, multi-currency or multi-language support.
- Dark mode and theme switching.
- Native/PWA offline support.
- Complex charting libraries; the ruled-list bars need only CSS.
- Audit and compliance logging beyond the lightweight activity history.

---

## Appendix — Priority tiers for the assessment window

**Must have (core, done well):** create, list, detail, edit; search; filters by status, source, assignee; dashboard with attention list and stage/source/workload breakdowns; shared validation; loading, empty, error and success states; responsive layouts; seed data; deployed to Vercel with Neon.

**Should have:** quick actions on the detail page; activity history; follow-up filter and chips; URL-synced state; accessibility pass; README with decisions, assumptions and a scope note.

**Could have (only if time remains):** duplicate-enquiry notice; keyboard shortcuts; undo on status change; shared-passphrase gate; a few Zod-schema unit tests.

**Suggested build order:** schema + seed → service layer + API → design tokens and base components → list → create/edit form → detail and quick actions → dashboard → states polish → accessibility and responsive pass → deploy and README.