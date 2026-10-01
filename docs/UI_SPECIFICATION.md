# Senthuron Ops — UI/UX Design Specification

**Companion to:** *Enquiry Desk — Product Specification* · **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix), Lucide icons, Sonner toasts
**Status:** Design complete, ready for implementation. No application code is included here; token tables and wireframes are the contract.

---

## 0. Design intent and reconciliation with the product spec

**Intent.** Senthuron Ops should feel like a well-made internal tool from a serious software company: calm, exact, quick. The metaphor is a **desk ledger**. Content sits on warm paper, structure comes from ruled lines instead of boxes, headlines use a serif voice, and every piece of data (references, budgets, dates, phone numbers) is set in a monospaced face so it lines up and can be scanned.

**What makes it distinctive (and not a template dashboard)**

1. **Masthead rule.** Every page header ends with a double rule (a 2px ink line with a 1px hairline 3px below it), like a printed ledger heading.
2. **Stage glyphs.** Status is drawn as a progressively filled circle, not a coloured pill.
3. **Serif figures.** Dashboard numbers are large serif numerals separated by hairlines, not KPI cards with icons.
4. **A sentence, not a greeting.** The dashboard opens with a live plain-language summary of what needs attention.
5. **Ruled structure.** Tables, lists and forms are organised with rules and alignment. Panels appear only where containment adds meaning.
6. **Paper palette.** Warm neutrals with one deep "ledger green" brand colour. No purple, no blue-to-violet gradients.

**Changes from the product spec (these supersede it)**

| # | Product spec | This document | Reason |
|---|---|---|---|
| 1 | Name "Enquiry Desk", nav item "Desk" | **Senthuron Ops**, nav item **Dashboard** | Product name confirmed. |
| 2 | `ink-3` = `#8A8677` | **`#6F6B5E`**; new `ink-4` = `#9A9686` for disabled/decorative only | Original measured about 3.3:1 on paper, below the 4.5:1 text minimum. |
| 3 | Input borders used `rule-strong` | New **`field`** token `#8F8873` | Form control boundaries need 3:1 (WCAG 1.4.11). |
| 4 | Warning `#8A5A00`, Proposal Sent `#8A5A00`, Negotiation `#A24B1E`, Lost `#6B6357` | Darkened to `#7A4E00`, `#7A4E00`, `#963F14`, `#5F584D` | Guarantee ≥ 4.5:1 on their tints. |
| 5 | "Page transitions: not allowed" | **Allowed in a restrained form** (§9.4) | Requested; scoped to the content region, enter-only, ≤ 180ms. |
| 6 | "Avoid card grids" | **Panel** defined for specific uses only (§5.6) | Panels stay, but never as a decorative grid. |
| 7 | Charts: "CSS bars only" | Charts defined in §7 (HTML/CSS bars plus one optional hand-built SVG); **no chart library** | Keeps bundle small and output accessible. |
| 8 | Brand colour token named `accent` | Renamed **`brand`** in code | shadcn already uses `accent` for hover surfaces. |

---

## 1. Foundations

### 1.1 Colour tokens

Light theme only. All colours are CSS variables mapped into Tailwind's theme.

**Surfaces and lines**

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F5F2EA` | App background |
| `surface` | `#FBF9F4` | Inputs, panels, popovers, dialogs, toasts |
| `sunken` | `#EDE9DE` | Sidebar, table header, hover fill, skeletons, addons |
| `rule` | `#D9D3C3` | Hairline dividers, panel borders |
| `rule-strong` | `#BDB59F` | Header underlines, emphasis rules, hover borders on panels |
| `field` | `#8F8873` | Form control borders (≥ 3:1 against `surface`) |

**Text**

| Token | Hex | Ratio on `paper` (approx.) | Use |
|---|---|---|---|
| `ink` | `#1C1B18` | 15:1 | Primary text |
| `ink-2` | `#5A574E` | 6.4:1 | Secondary text, labels |
| `ink-3` | `#6F6B5E` | 4.8:1 | Placeholder, captions, muted metadata |
| `ink-4` | `#9A9686` | 2.9:1 | Disabled text, decorative marks only |

**Brand and semantic**

| Token | Hex | Notes |
|---|---|---|
| `brand` | `#1F4D3A` | Ledger green. Primary buttons, links, focus ring, active nav. About 8.6:1 on paper. |
| `brand-hover` | `#173A2C` | Hover and pressed |
| `brand-tint` | `#DDE8E1` | Selected/active filter background |
| `brass` | `#B8862B` | Decorative only: changed-field marker, activity highlight (as 14% tint). Never used for text. |
| `danger` | `#B3361F` | Overdue, errors, destructive. About 5.4:1 on paper. |
| `danger-tint` | `#F6E3DD` | Error backgrounds |
| `warning` | `#7A4E00` | Due today emphasis |
| `warning-tint` | `#F1E4C4` | Due today chip background |
| `success` | `#23663F` | Success accents |
| `success-tint` | `#E0EBE1` | Success backgrounds |

**Stage colours.** Text and glyph use the solid colour; the tinted background is the same colour at 12% opacity over `paper`.

| Stage | Colour | Fill of glyph |
|---|---|---|
| New | `#4B5A6B` (slate) | Empty ring |
| Contacted | `#2F5F8A` (steel blue) | 25% |
| Qualified | `#1E6B66` (teal) | 50% |
| Proposal Sent | `#7A4E00` (ochre) | 75% |
| Negotiation | `#963F14` (terracotta) | 92% |
| Won | `#23663F` (green) | 100% with tick |
| Lost | `#5F584D` (warm grey) | Empty ring with diagonal slash; label struck through |

**Rules.** Never use colour as the only signal. Contrast must be re-verified with a checker in the build (values above are computed estimates). Use at most one hue (brand) plus neutrals in any chart outside the stage chart.

**shadcn variable mapping**

| shadcn variable | Token |
|---|---|
| `--background` | `paper` |
| `--foreground` | `ink` |
| `--card`, `--popover` | `surface` |
| `--primary` | `brand` (foreground `surface`) |
| `--secondary`, `--muted`, `--accent` | `sunken` |
| `--muted-foreground` | `ink-2` |
| `--destructive` | `danger` |
| `--border` | `rule` |
| `--input` | `field` |
| `--ring` | `brand` |
| `--radius` | `3px` |

**Selection.** `::selection` background is `brand` at 20%.

### 1.2 Backgrounds

- The page is flat `paper`. No gradients, images, noise, patterns, blurred blobs or glows anywhere in the product.
- The sidebar is `sunken` with a 1px `rule` right border.
- Overlays are `ink` at 40% with **no backdrop blur**.
- The only permitted gradient-like effect is a 16px edge mask on horizontally scrolling strips, purely to signal overflow.

### 1.3 Typography

Fonts load through `next/font` with `display: swap`. Only the listed weights are included.

| Role | Family | Weights |
|---|---|---|
| Display and figures | **Newsreader** (variable, optical size on) | 400, 500, 600 |
| Interface and body | **IBM Plex Sans** | 400, 500, 600 |
| Data | **IBM Plex Mono** | 400, 500 |

Mono is used for: enquiry references, budgets, dates, phone numbers, counts, keyboard hints. Numerals in tables and figures use tabular alignment.

**Type styles**

| Style | Family | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `headline` | Newsreader | 32 / 38 | 500 | -0.01em | Dashboard sentence |
| `title` | Newsreader | 28 / 34 | 500 | -0.01em | Page titles, client name on detail |
| `figure` | Newsreader | 48 / 48 | 500 | -0.02em | Ledger figures (mobile primary: 40 / 40) |
| `figure-sm` | Newsreader | 28 / 32 | 500 | -0.01em | Secondary figures on mobile |
| `heading` | Newsreader | 20 / 28 | 500 | 0 | Section titles, dialog titles, empty-state titles (24 / 30) |
| `body` | Plex Sans | 14 / 22 | 400 | 0 | Default text |
| `body-strong` | Plex Sans | 14 / 22 | 600 | 0 | Client names, values |
| `label` | Plex Sans | 13 / 20 | 500 | 0 | Field labels, buttons small |
| `meta` | Plex Sans | 13 / 20 | 400 | 0 | Secondary lines, helper text, errors |
| `eyebrow` | Plex Sans | 12 / 16 | 500 | 0.08em, uppercase | Section labels, table headers (0.06em), date above headline |
| `data` | Plex Mono | 13 / 20 | 400 | 0 | Budget, dates, phones, counts |
| `data-strong` | Plex Mono | 14 / 20 | 500 | 0 | Table figures, references |
| `kbd` | Plex Mono | 12 / 16 | 500 | 0 | Keyboard hints |

Rules: sentence case everywhere; no text under 12px; body text never lighter than `ink-2`; line length capped at 72ch in descriptions and notes.

### 1.4 Spacing and layout

- Base unit **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Content max-width **1200px**, centred. Form measure **720px** plus a 240px label gutter.
- Page gutters: 16px (mobile), 24px (tablet), 32px (desktop).
- Sidebar width **232px**. Mobile top bar **52px**, bottom tab bar **56px** plus safe-area inset.
- Section spacing on dashboard: 48px, separated by a hairline rule.
- Table rows: 56px desktop, 48px tablet. Table header 40px. Form field 40px (44px on touch). Buttons 40px (32px small, 44px touch).
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1440. The rail appears at `lg`.

### 1.5 Borders and radius

| Element | Border | Radius |
|---|---|---|
| Hairline divider | 1px `rule` | — |
| Masthead rule | 2px `ink` + 3px gap + 1px `rule-strong` | — |
| Panel | 1px `rule` | 3px |
| Input, select, textarea | 1px `field` | 3px |
| Button | 1px (secondary) or none | 3px |
| Popover, dropdown, tooltip | 1px `rule` | 6px (tooltip 3px) |
| Dialog, sheet | 1px `rule` | 6px (sheet top corners 12px) |
| Follow-up chip, avatar | 1px | 999px |
| Progress track / chart bar | none | 2px |

### 1.6 Shadows and elevation

Structure uses borders, not shadows. Shadows appear only on floating layers.

| Token | Value | Use |
|---|---|---|
| `shadow-none` | none | Panels, tables, cards, sidebar |
| `shadow-popover` | `0 1px 2px rgba(28,27,24,.06), 0 8px 24px -6px rgba(28,27,24,.16)` | Dropdowns, selects, tooltips |
| `shadow-dialog` | `0 2px 4px rgba(28,27,24,.08), 0 24px 48px -12px rgba(28,27,24,.24)` | Dialogs, sheets |
| `shadow-toast` | `0 1px 2px rgba(28,27,24,.08), 0 12px 28px -8px rgba(28,27,24,.2)` | Toasts |

Z-index scale: base 0 · sticky 10 · sidebar/tabbar 20 · popover 40 · overlay 50 · dialog 60 · toast 70 · tooltip 80.

### 1.7 Iconography

Lucide, 16px in UI, 20px in empty/error states, stroke 1.5, colour inherits text. Icons never stand alone without an accessible name. No filled or duotone icons; no emoji.

Source icons: WhatsApp `MessageCircle`, Instagram `Instagram`, Email `Mail`, Website `Globe`, Referral `Handshake`, Direct `Users`, Other `CircleDot`.

### 1.8 Numbers, dates and text formats

| Item | Format |
|---|---|
| Budget in tables and forms | `₹48,20,000` (en-IN grouping); blank shows `—` |
| Budget in figures | Compact: `₹48.2L`, `₹1.2Cr` (custom formatter so output is consistent) |
| Reference | `ENQ-0042`, zero-padded to 4 |
| Follow-up | `Today`, `Tomorrow`, `Fri 3 Oct`; with year when not the current year |
| Overdue | `Overdue · 3d` (list), `Overdue by 3 days` (detail) |
| Timestamps | Relative up to 7 days (`2h ago`), otherwise `12 Sep 2026`; full value in a tooltip |
| Empty value | `—` (en dash, muted) |

---

## 2. Application shell, navigation, sidebar and header

### 2.1 Desktop shell (≥ 1024px)

```
┌──────────────┬────────────────────────────────────────────────────────┐
│ ▮ Senthuron  │                                                        │
│   OPS        │   <page header: eyebrow / title / actions>             │
│              │   ═══════════════════════════════════════════          │
│ ▎Dashboard   │   ───────────────────────────────────────────          │
│  Enquiries 24│                                                        │
│              │   <page content, max-width 1200>                       │
│ [+ New     N]│                                                        │
│              │                                                        │
│              │                                                        │
│ Shortcuts  ? │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘
   232px, sunken                    paper
```

**Sidebar (232px, `sunken`, right border `rule`, fixed full height)**

| Part | Spec |
|---|---|
| Wordmark block | 64px tall, 20px left padding. Mark: 20×20 square outlined in `ink` with three internal horizontal rules, the middle one in `brand`. "Senthuron" in Newsreader 18/500, with **OPS** in Plex Mono 11/500, `brand`, tracking 0.16em, on the same baseline. Links to Dashboard. |
| Nav list | 24px below wordmark; 12px side padding; 4px gap between items |
| Nav item | 36px tall, padding 0 12px, radius 3px. Icon 16px + label 14/500. Enquiries item shows open count in `data` at the right. |
| Nav item — hover | Fill `paper` at 60% (i.e. slightly lighter than sidebar), 120ms |
| Nav item — active | Fill `surface`, label `ink` 600, 2px `brand` bar on the left edge (inset, no layout shift). `aria-current="page"` |
| New enquiry button | Full-width primary button (40px) with `+` icon and `N` kbd chip at right. Placed under nav with 24px gap. |
| Footer | Pinned to bottom: ghost link "Keyboard shortcuts" with `?` kbd chip. Beneath it, "Senthuron Tech" in `meta`, `ink-3`. |

Nav items: **Dashboard** (`LayoutList` icon), **Enquiries** (`Inbox` icon).

### 2.2 Page header (all pages)

```
EYEBROW (12 uppercase)                                      [secondary] [primary]
Title (Newsreader 28)
═══════════════════════════════════════════════════════════════════════════
───────────────────────────────────────────────────────────────────────────
```

- Eyebrow: date on Dashboard; "Pipeline" on list; breadcrumb on detail/edit (`Enquiries / ENQ-0042`).
- Actions are right-aligned and wrap under the title on mobile.
- The masthead rule sits 16px below the title. Margin below the rule: 24px.
- There is **no global top bar on desktop**; the page header carries context and actions.

### 2.3 Tablet and mobile shell (< 1024px)

- **Top bar (52px, `paper`, bottom hairline):** wordmark (compact: mark + "Senthuron Ops") at left; at right a `+ New` secondary button (icon only under 380px). On detail/edit pages the left side becomes a back button plus the reference.
- **Bottom tab bar (56px + safe area, `surface`, top hairline):** three tabs — Dashboard, Enquiries, New. Each tab is a 44px-min touch target with a 20px icon and 12px label; active tab uses `brand` icon/label and a 2px `brand` bar along the top edge.
- The bottom bar is **hidden on Create and Edit** (focused task mode) so the sticky action bar has the screen bottom.
- Content scrolls under nothing; both bars are opaque.

### 2.4 Navigation behaviour

- Back from detail returns to the list with the previous filters (URL params preserved).
- Focus lands on the page `h1` after each route change (`tabindex="-1"`, no visible ring on programmatic focus).
- A skip link ("Skip to content") is the first focusable element.
- Route progress: a 2px `brand` line across the top of the content area appears after a 150ms delay and finishes on load.

---

## 3. Components

### 3.1 Buttons

| Variant | Default | Hover | Pressed | Use |
|---|---|---|---|---|
| **Primary** | bg `brand`, text `surface`, 600 | bg `brand-hover` | bg `brand-hover`, 0.5px downward shift | One per view: Create, Save, New enquiry |
| **Secondary** | bg `surface`, 1px `field`, text `ink` | bg `sunken` | bg `sunken`, border `ink-2` | Edit, Cancel-with-weight, filter actions |
| **Ghost** | transparent, text `ink-2` | bg `sunken`, text `ink` | bg `rule` | Cancel, Try again (secondary), pagination |
| **Destructive** | bg `danger`, text `surface` | darken 8% | darken 12% | Mark as lost, Discard |
| **Link** | text `brand`, underline offset 3px | underline thickness 2px | — | Inline navigation |

Sizes: `sm` 32px (padding 0 12), `md` 40px (padding 0 16), `lg` 44px (touch; default on mobile). Font 14/600 (`sm` 13/600). Icon 16px with 8px gap. Icon-only buttons are square at the same height with a tooltip and `aria-label`.

- **Disabled:** 50% opacity, `cursor: not-allowed`, no hover.
- **Loading:** label swaps to progress wording ("Creating…"), a 14px spinner replaces the leading icon, minimum width is locked to the resting width, button is `aria-busy` and non-interactive.
- **Focus:** see §8.

### 3.2 Inputs

Shared: height 40px (44px on touch), padding 0 12px, bg `surface`, 1px `field`, radius 3px, text 14 `ink`, placeholder `ink-3`.

| State | Treatment |
|---|---|
| Hover | Border `ink-2` |
| Focus | Border `brand` + 3px ring `brand` at 22% + (keyboard) outline per §8 |
| Filled | No change |
| Error | Border `danger`, 3px ring `danger` at 16% on focus; message below (see below) |
| Disabled | bg `sunken`, text `ink-4`, border `rule` |
| Read-only | bg `sunken`, border `rule`, text `ink` |

**Field anatomy (top to bottom):** label (13/500, `ink`; append ` optional` in `ink-3` regular for optional fields) → control → helper text (13, `ink-2`) or error (13, `danger`, 14px `AlertCircle` icon, `role` not needed; linked by `aria-describedby`). The form legend states "All fields are required unless marked optional."

- **Textarea:** min-height 128px, vertical resize, line-height 22. Character counter (`data`, 12, `ink-3`) at bottom-right appears from 80% of the limit and turns `danger` past it.
- **Currency input:** left addon cell 40px wide, bg `sunken`, `₹` in mono, joined to the input with a shared border. `inputmode="numeric"`; thousands separators shown on blur, stripped on focus.
- **Phone:** `inputmode="tel"`, `autocomplete="tel"`. **Email:** `inputmode="email"`, `autocomplete="email"`, `autocapitalize="off"`.
- **Date:** native `input type="date"` styled to match; a preset row sits beneath (see §3.3).
- **Search input:** magnifier icon left (16px, `ink-3`), clear button right when non-empty, `/` kbd chip right when empty and unfocused (desktop only).
- **Select (form):** styled native `<select>` with `appearance: none` and a 16px `ChevronDown` at right; used for Source, Service, Status (in forms) and Assigned person, for accessibility and mobile ergonomics.

### 3.3 Date presets

A row of small rectangular toggle buttons under the follow-up date input: **Today · Tomorrow · In 3 days · Next week · Clear**.

- Height 28px, padding 0 10px, 1px `rule-strong`, radius 3px, text 13/500.
- Selected (date equals preset): bg `brand-tint`, border `brand`, text `brand`.
- Rectangular on purpose so they read as controls, not as the pill-shaped follow-up status chips.

### 3.4 Dropdowns, menus and popovers

| Part | Spec |
|---|---|
| Container | bg `surface`, 1px `rule`, radius 6px, `shadow-popover`, padding 4px, min-width = trigger width, max-height 320px with internal scroll |
| Item | Height 36px, padding 0 10px, radius 3px, 14/400; icon/glyph 16px with 8px gap |
| Item hover / keyboard highlight | bg `sunken` |
| Selected | Trailing `Check` (16px, `brand`) and 600 weight |
| Separator | 1px `rule`, 4px vertical margin |
| Disabled item | `ink-4` |
| Group label | `eyebrow`, `ink-3`, padding 8px 10px 4px |

- **Status select (quick action)** is a Radix Select whose trigger shows the current `StageMark` and whose items each show their `StageMark`. It supports typeahead.
- **Filter dropdowns** (Source, Assigned to, Follow-up, Sort) are Radix single-select menus with radio semantics.
- Opening animation: opacity 0→1 and translateY(-4px)→0, 140ms, `ease-out`; closing: opacity only, 100ms.

### 3.5 Badges and status indicators

**StageMark** — the core status indicator. A 16px SVG circle (stroke 1.5) plus label.

| Stage | Glyph construction |
|---|---|
| New | Ring only |
| Contacted | Ring + pie wedge 90° from 12 o'clock, clockwise |
| Qualified | Wedge 180° |
| Proposal Sent | Wedge 270° |
| Negotiation | Wedge 330° |
| Won | Solid disc with a `surface` tick |
| Lost | Ring with a 45° slash from top-right to bottom-left; label uses `line-through` |

Variants:
- `inline` (tables, cards, lists): glyph + label, no background, label 14/500 in stage colour.
- `solid` (detail header, status select trigger): bg = stage colour at 12%, 1px border = stage colour at 30%, radius 3px, padding 2px 8px 2px 6px, label 13/600.
- `glyph` (dense places, e.g. mobile card corner): glyph only, with `aria-label` and tooltip.

**FollowUpChip** — 24px tall, radius 999px, padding 0 10px, `data` 12/500.

| Kind | Look | Text |
|---|---|---|
| Overdue | bg `danger-tint`, text `danger`, `AlertCircle` 12px | `Overdue · 3d` |
| Today | bg `warning-tint`, text `warning` | `Today` |
| Upcoming | bg transparent, 1px `rule-strong`, text `ink-2` | `Fri 3 Oct` |
| Not set (open enquiry) | 1px dashed `ink-3`, text `ink-3` | `No follow-up` |
| Closed (Won/Lost) | none | `—` |

**Other indicators**
- **SourceLabel:** 16px icon + 14px text in `ink-2`, no background.
- **Count badge:** `data` 12/500, bg `sunken`, radius 3px, padding 1px 6px. Used in nav and status strip. Zero counts show `0` in `ink-3`.
- **Avatar:** 24px circle, bg `sunken`, 1px `rule`, initials 11/600 `ink-2`. "Unassigned" shows a dashed 1px `ink-3` circle with a 12px `UserPlus` icon, text "Unassigned" in `ink-3`.
- **Reference tag:** `data-strong`, `ink-2`, letter-spacing 0.02em.
- **Keyboard chip (`kbd`):** `kbd` type style, bg `surface`, 1px `rule-strong`, bottom border 2px, radius 3px, padding 1px 6px. Hidden on touch devices.

### 3.6 Panels (cards)

Panels are **containers with a purpose**, not a layout device. Permitted uses: detail Handling panel, mobile filter sheet content groups, empty/error blocks, and the create/edit "changed" summary. Everything else uses rules.

- bg `surface`, 1px `rule`, radius 3px, no shadow.
- Header: 44px, padding 0 16px, `eyebrow` label at left, optional action at right, bottom hairline.
- Body padding 16px (20px on desktop).
- Interactive panel (fully clickable): on hover border → `rule-strong`, 120ms. No lift, no shadow.

**Ledger figure** (not a panel): a text block with the `figure` numeral, an `eyebrow` label beneath (or above on mobile), and an optional `meta` caption. Adjacent figures are separated by 1px `rule` vertical dividers with 24px padding either side. If the figure links, the entire block is a link; hover underlines the label.

### 3.7 Tables

Anatomy: table → sticky header → rows → footer.

| Part | Spec |
|---|---|
| Header row | 40px, bg `sunken`, bottom border 1px `rule-strong`, `eyebrow` text in `ink-2`, sticky at `top: 0` with `z-10`. The sorted column shows a 12px chevron and `aria-sort`. |
| Body row | 56px (48px tablet), bottom border 1px `rule`, bg transparent |
| Cell | Padding 0 16px (first cell 0 16px 0 12px). Text `body`. Numeric columns right-aligned in `data`. |
| Row hover | bg `surface`, plus an inset 2px `brand` bar on the left (`box-shadow: inset 2px 0 0`) so nothing shifts. Transition 100ms. |
| Row keyboard focus | Same as hover plus the focus outline on the row link (see §8). |
| Row pressed | bg `sunken` |
| Truncation | Single-line ellipsis with tooltip on hover/focus for client name and description snippets. |

Whole-row clickability is done by an anchor in the first cell stretched over the row (`::after` absolute), so the row remains a real link.

**Desktop column plan (viewport ≥ 1280)**

| Column | Width | Content |
|---|---|---|
| Enquiry | 30% (min 260px) | Client (`body-strong`) over contact person (`meta`, `ink-2`); reference in `data` `ink-3` appended to the second line after a middle dot |
| Service | 13% | Service label |
| Source | 11% | SourceLabel |
| Stage | 14% | StageMark `inline` |
| Budget | 10% | Right-aligned `data`; `—` when empty |
| Assigned | 11% | Avatar + first name and last initial |
| Next follow-up | 11% | FollowUpChip |
| Updated | 72px, **only ≥ 1360px** | Relative time, `meta`, `ink-3` |

Tablet (640–1023): drop Service, Source moves under the client line, Updated hidden. Mobile: table becomes cards (§10).

### 3.8 Status strip (list tabs)

- Horizontal strip below the page header: **All · New · Contacted · Qualified · Proposal Sent · Negotiation · Won · Lost**, each with a count badge.
- Item height 40px, padding 0 14px, text 14/500 `ink-2`; hover text `ink`.
- Active: text `ink`, 2px `ink` underline; the underline is a single element that **slides** to the active tab (transform + width, 200ms).
- Container has a bottom hairline; overflows horizontally on small screens with 16px edge masks and hidden scrollbar.
- Radix Tabs semantics are **not** used because each item navigates (URL param); use links with `aria-current="true"`.

### 3.9 Filter bar

```
[ 🔍 Search enquiries…                 / ]  [Source: Any ▾] [Assigned: Any ▾] [Follow-up: Any ▾]   Sort: Follow-up ▾   Clear filters
```

- Search: 320px wide (grows to fill on tablet), 36px height. Filter triggers 36px height, padding 0 12px, 1px `field`, label in `ink-2` and value in `ink` 500.
- **Active filter:** bg `brand-tint`, border `brand`, value in `brand` 600.
- "Clear filters" is a link-style button, visible only when any filter or search is active.
- Search debounce 300ms; typing shows the list-loading progress line; results announced via a polite live region ("12 enquiries found").

### 3.10 Pagination

Footer row 48px, top hairline: left `data` "Showing 1–15 of 42"; right "Page 1 of 3" plus Previous/Next ghost buttons (icon + label; label hidden below 640px). Disabled ends at 50% opacity. Changing page scrolls to the top of the table and moves focus to the table caption.

### 3.11 Modals and drawers

**Dialog (AlertDialog / Dialog)**
- Width 440px (max 92vw), padding 24px, bg `surface`, 1px `rule`, radius 6px, `shadow-dialog`, centred.
- Title Newsreader 20/500; body 14 `ink-2`; footer buttons right-aligned, 12px gap, primary/destructive on the right.
- Overlay `ink` 40%, no blur.
- Focus trap, Esc closes (except while a destructive action is pending), focus returns to the trigger. Initial focus goes to the safe action (Cancel) for destructive dialogs.
- Enter: overlay fade 150ms; dialog opacity 0→1, scale .98→1, translateY(6px→0), 180ms `ease-out`. Exit: 120ms opacity only.

Dialogs in the product:

| Dialog | Title | Body | Actions |
|---|---|---|---|
| Mark as lost | "Mark this enquiry as lost?" | "It will move out of your open pipeline and its follow-up date will be cleared. You can reopen it later." + optional textarea "Closing note (optional)" | Cancel · **Mark as lost** (destructive) |
| Discard changes | "Discard your changes?" | "You have unsaved changes to this enquiry." | **Keep editing** (primary) · Discard (secondary, `danger` text) |
| Keyboard shortcuts | "Keyboard shortcuts" | Two-column list of shortcuts; footer toggle "Single-key shortcuts" (on/off) | Close |

**Bottom sheet (mobile filters)**
- Slides up from the bottom, max-height 85vh, top corners 12px radius, `shadow-dialog`, 36×4px grab handle in `rule-strong`.
- Header: "Filters" (Newsreader 20) and a Close icon button. Body: Source, Assigned to, Follow-up, Sort as stacked native selects with 20px gaps.
- Sticky footer with safe-area padding: **Clear** (ghost) and **Show 12 results** (primary), live-updating count.
- Enter 240ms `ease-out` translateY(100%→0); exit 180ms. Drag-to-dismiss is supported; Esc/back closes.

There is **no desktop side drawer** in scope; detail is a page, not a peek.

### 3.12 Toast notifications

Sonner, restyled.

| Property | Spec |
|---|---|
| Size | 360px wide (mobile: viewport − 32px), padding 12px 14px |
| Surface | bg `surface`, 1px `rule-strong`, radius 3px, `shadow-toast` |
| Accent | 3px left bar: `success` (success), `danger` (error), `ink-2` (info) |
| Content | Icon 16px, title 14/600, optional description 13 `ink-2`, optional action link (`brand`, 600), close icon button 24px |
| Position | Desktop bottom-right, 24px inset. Mobile bottom-centre at `72px + safe-area` (above the tab bar; `16px + safe-area` when the tab bar is hidden). |
| Duration | Success 4s; error (rollback) 6s; pauses on hover and focus |
| Stack | Max 3 visible, 8px gap |
| Motion | Enter opacity 0→1 + translateY(8px→0), 200ms `ease-out`; exit opacity 150ms; swipe-to-dismiss on touch |
| A11y | `aria-live="polite"` for success, `assertive` for errors; never the only place an error is shown |

### 3.13 Tooltips

bg `ink`, text `surface`, 12/16, padding 6px 8px, radius 3px, `shadow-popover`. Open delay 500ms (instant when moving between tooltips), close 80ms. Used only for icon-only buttons, truncated text, and full timestamps. Never for essential information; never on touch.

### 3.14 Skeletons and progress

- Skeleton blocks: bg `sunken`, radius 2px. Pulse: opacity 1 ↔ 0.55, 1.4s `ease-in-out`, infinite. Static under reduced motion.
- **Skeleton delay:** a skeleton wrapper starts at `opacity: 0` and fades in after 150ms, so fast loads never flash placeholders. Once visible, it stays at least 300ms.
- **Route progress line:** 2px `brand`, top of the content area, indeterminate-to-determinate, appears after 150ms.
- **List refetch line:** 2px `brand` line under the toolbar while results dim to 60% opacity.
- **Spinner:** 14px (buttons) and 20px (blocks), 1.5 stroke arc, 700ms linear rotation.

### 3.15 Empty and error blocks

- Block sits inside the content area, centred, max-width 480px, 64px top padding. No border unless it is an error (see §6.7). Icon 20px in `ink-3`, title `heading` (24/30), body `body` `ink-2` (max 44ch), actions stacked or inline with 12px gap.
- A **ruled-lines motif** (five 1px `rule` lines, 320px wide, 16px apart, fading to 40% opacity toward the bottom by stroke opacity, not gradient) sits above the title on empty states only. It is decorative and hidden from assistive tech.

### 3.16 Activity list

Vertical 1px `rule` line at x=6px; each item has a 12px node (ring for events, dot for creation) aligned to the first text line. Item: sentence in `body` (values in 600), timestamp in `data` 12 `ink-3` beneath. 16px between items. No author names (there are no accounts).

---

## 4. Motion

### 4.1 Principles

1. **Explain, don't decorate.** Motion shows cause and effect (something opened, something saved, something changed).
2. **Fast and quiet.** Most transitions are 100–200ms; nothing exceeds 400ms.
3. **Transform and opacity only.** Never animate width, height, top or left except the sliding tab indicator (transform-based) and bar charts (transform: scaleX).
4. **Never delay the user.** Animations are enter-only where possible and never block navigation or input.
5. **Reduced motion is respected**: all transitions collapse to instant or a 1ms opacity change; no pulse; charts appear at final size.

### 4.2 Tokens

| Token | Value |
|---|---|
| `duration-instant` | 80ms |
| `duration-fast` | 120ms |
| `duration-base` | 180ms |
| `duration-slow` | 260ms |
| `duration-chart` | 400ms |
| `ease-out` (default enter) | `cubic-bezier(0.2, 0, 0, 1)` |
| `ease-in` (exit) | `cubic-bezier(0.4, 0, 1, 1)` |
| `ease-in-out` (state morph) | `cubic-bezier(0.4, 0, 0.2, 1)` |

### 4.3 Transition catalogue

| Element | Trigger | Property | Duration / easing |
|---|---|---|---|
| Button, link, nav item, icon button | Hover / press | background, border, colour | 120ms `ease-out` |
| Table row | Hover | background, inset bar | 100ms |
| Input | Focus / error | border, ring | 120ms |
| Dropdown / popover | Open / close | opacity + translateY(-4px) / opacity | 140ms / 100ms |
| Dialog | Open / close | opacity + scale(.98) + translateY(6px) / opacity | 180ms / 120ms |
| Bottom sheet | Open / close | translateY | 240ms / 180ms |
| Toast | Enter / exit | opacity + translateY(8px) / opacity | 200ms / 150ms |
| Status strip underline | Tab change | transform + width | 200ms `ease-in-out` |
| StageMark glyph | Status change | Wedge sweep from old to new fill; label cross-fade | 240ms `ease-in-out` / 150ms |
| StageTrack | Status change | Segment fill (scaleX) and node fill | 240ms |
| Activity item (new) | Insert | opacity + translateY(4px), then `brass` 14% background fading to transparent | 200ms + 1200ms fade |
| List results | Filter / search change | Previous results dim to 60%; new results swap with 120ms opacity fade | 120ms |
| Dashboard bars | First paint | scaleX from 0 (origin left) with 30ms stagger per row | 400ms `ease-out` |
| Dashboard attention rows | First paint | opacity + translateY(4px), 20ms stagger, max 8 rows | 180ms |
| Inline "Saved" text | After quick action | Fade in, hold 2s, fade out | 120ms / 2s / 200ms |
| Field error | Appears | Height-free: opacity + translateY(-2px) | 120ms |
| Skeleton | Loading | Opacity pulse | 1.4s loop |

**Not animated:** counters, page-load confetti, hover lifts, parallax, background effects, layout shifts.

### 4.4 Page transitions

- The sidebar/top bar/bottom bar persist; only the **content region** transitions.
- On route change the new content fades and rises in: opacity 0→1, translateY(6px→0), **160ms** `ease-out`. There is no exit animation, so navigation never waits.
- Not applied to query-string changes on the same page (search, filters, pagination); those use the results dimming behaviour instead.
- Focus moves to the new `h1` immediately; the animation must not delay focus or content interactivity.
- Optional progressive enhancement: the View Transitions API cross-fade limited to the content region, disabled when unsupported or under reduced motion.
- Route progress line (§3.14) covers slow loads.

---

## 5. Keyboard interactions

### 5.1 Global shortcuts

Single-key shortcuts are inactive while an input, textarea, select or contenteditable is focused, while any dialog or menu is open, and when a modifier key (Ctrl/Cmd/Alt) is held. The Shortcuts dialog includes an on/off toggle for single-key shortcuts (stored in `localStorage`, on by default) to meet WCAG 2.1.4.

| Keys | Action | Where |
|---|---|---|
| `/` | Focus search | Enquiries list |
| `n` | Open New enquiry | Anywhere |
| `g` then `d` | Go to Dashboard | Anywhere |
| `g` then `e` | Go to Enquiries | Anywhere |
| `?` | Open Keyboard shortcuts | Anywhere |
| `Esc` | Close dialog/menu; clear search when focused; cancel form (with dirty check) | Contextual |

### 5.2 Page-specific

| Keys | Action | Where |
|---|---|---|
| `j` / `k` | Move row highlight down/up | Enquiries list (could-have) |
| `Enter` | Open highlighted row | Enquiries list |
| `e` | Edit enquiry | Enquiry detail |
| `s` | Focus the Status control | Enquiry detail |
| `f` | Focus the Follow-up control | Enquiry detail |
| `Ctrl/Cmd + Enter` | Submit form | Create, Edit (works from inside fields) |

### 5.3 Component keyboard behaviour

| Component | Keys |
|---|---|
| Select / menu | `↑ ↓` move, `Home/End` jump, type to search, `Enter/Space` select, `Esc` close, `Tab` moves on |
| Status strip | `←/→` move focus between links, `Enter` activate |
| Date presets | `Tab` between buttons, `Space/Enter` toggle |
| Dialog | `Tab`/`Shift+Tab` cycle within, `Esc` closes |
| Toast | `Tab` reaches action/close; hover or focus pauses timer |
| Pagination | Standard tab order |

Shortcut hints are shown as `kbd` chips (search placeholder, New enquiry button, tooltips) on pointer devices only.

---

## 6. Screen specifications

Sample data is fictional. Wireframes show the desktop layout at a 1280px viewport unless stated.

### 6.1 Dashboard

**Purpose:** answer "what needs me today?" first, then "how is the pipeline?".

```
WEDNESDAY 30 SEPTEMBER 2026                                        [ + New enquiry ]
3 follow-ups are overdue and 2 are due today.
═══════════════════════════════════════════════════════════════════════════════
───────────────────────────────────────────────────────────────────────────────

  24         │   3          │   2          │   ₹48.2L         │   38%
  OPEN       │   OVERDUE    │   DUE TODAY  │   OPEN PIPELINE  │   WIN RATE
  ENQUIRIES  │   ▲ oldest 6d│              │   4 without budget│   5 won · 8 lost
───────────────────────────────────────────────────────────────────────────────

NEEDS ATTENTION                                   PIPELINE BY STAGE
OVERDUE · 3                                       ○ New            6  ▓▓▓▓▓▓▓▓░░   ₹6.1L
 Overdue · 6d  Meridian Logistics     ◑ Qualified   PR   ›    ◔ Contacted      5  ▓▓▓▓▓▓▓░░░   ₹9.0L
 Overdue · 2d  Bluepeak Clinics       ◔ Contacted   AK   ›    ◑ Qualified      6  ▓▓▓▓▓▓▓▓░░   ₹14.2L
 Overdue · 1d  Harvest & Co           ○ New         —    ›    ◕ Proposal Sent  4  ▓▓▓▓▓░░░░░   ₹11.5L
DUE TODAY · 2                                     ● Negotiation    3  ▓▓▓▓░░░░░░   ₹7.4L
 Today         Northfield Studio      ◕ Proposal    SN   ›    ─────────────────────────────
 Today         Kestrel Energy         ◑ Qualified   PR   ›    ✓ Won            5              ₹18.0L
NO FOLLOW-UP SET · 1                              ⊘ Lost           8
 No follow-up  Ivory Row Interiors    ○ New         —    ›
 View all 6 ›

BY SOURCE                                         WORKLOAD
 WhatsApp   ▓▓▓▓▓▓▓▓▓▓▓░░░  18 · 2 won            PR Priya R.   ▓▓▓▓▓▓▓▓░░  9 open · 2 overdue
 Website    ▓▓▓▓▓▓▓░░░░░░  11 · 1 won            AK Arun K.    ▓▓▓▓▓░░░░░  6 open · 1 overdue
 Referral   ▓▓▓▓░░░░░░░░   7 · 2 won            SN Sana N.    ▓▓▓▓░░░░░░  5 open
 Email      ▓▓▓░░░░░░░░░   5 · 0 won            ○ Unassigned  ▓▓░░░░░░░░  4 open
 Instagram  ▓▓░░░░░░░░░░   4 · 0 won

RECENT ACTIVITY
 10:42  ENQ-0042 Meridian Logistics · Status changed Contacted → Qualified
 09:15  ENQ-0047 Kestrel Energy · New enquiry created
```

**Structure and behaviour**

1. **Masthead.** Eyebrow = full date (`eyebrow` style). Headline is the live sentence in `headline` style; the numbers within it are 600 weight. Primary action **New enquiry** at right. Variants: "You're clear. No follow-ups are due today." / "1 follow-up is overdue." / "2 follow-ups are due today."
2. **Ledger band.** Five figures at equal widths (CSS grid, 5 columns, 1px `rule` dividers). Captions in `meta`: Overdue shows "oldest 6d", Pipeline shows "n without budget", Win rate shows "5 won · 8 lost". Overdue figure uses `danger` colour only when > 0. Each figure links to its filtered list (Open → `?due=any&status=open`, Overdue → `?due=overdue`, Due today → `?due=today`).
3. **Needs attention** (7/12 columns). Grouped in the order Overdue, Due today, No follow-up set. Group heading = `eyebrow` + count, 32px tall with hairline below. Row: 52px; columns FollowUpChip (128px) · Client + contact (flex) · StageMark inline (150px) · Avatar (32px) · chevron. Max 8 rows total. Footer link "View all n ›" goes to the list with the matching filter. Rows are links with the same hover as tables.
4. **Pipeline by stage** (5/12 columns): chart per §7.1.
5. **By source** and **Workload** (6/12 each): charts per §7.2 and §7.3.
6. **Recent activity:** last 6 events, `data` timestamp + sentence; each row links to its enquiry. Lowest priority.

**Layout rules:** ≥ 1024px two-column sections; < 1024px single column ordered Masthead → Figures → Needs attention → Pipeline → Source → Workload → Activity. Sections are separated by 48px and a top hairline with an `eyebrow` heading, not by panels.

**States:** Loading (skeleton mirroring every section), Empty (§6.6), Error (per-section inline error, so one failing aggregate does not blank the page).

### 6.2 Enquiry list

```
PIPELINE                                                          [ + New enquiry ]
Enquiries                                                              42 total
═══════════════════════════════════════════════════════════════════════════════
───────────────────────────────────────────────────────────────────────────────
 All 42 │ New 6 │ Contacted 5 │ Qualified 6 │ Proposal Sent 4 │ Negotiation 3 │ Won 5 │ Lost 8
 ━━━━━━
[🔍 Search enquiries…       /] [Source ▾] [Assigned ▾] [Follow-up ▾]      Sort: Follow-up ▾
───────────────────────────────────────────────────────────────────────────────
 ENQUIRY                    SERVICE      SOURCE     STAGE          BUDGET  ASSIGNED   FOLLOW-UP
───────────────────────────────────────────────────────────────────────────────
▎Meridian Logistics         Custom       ◯ WhatsApp ◑ Qualified   ₹6,50,000 (PR) Priya R.  (Overdue · 6d)
 Priya Raman · ENQ-0042     software
 Bluepeak Clinics           Web dev      ✉ Email    ◔ Contacted   ₹2,00,000 (AK) Arun K.   (Overdue · 2d)
 Dr. A. Khan · ENQ-0039
 Harvest & Co               UI/UX        ⓘ Instagram ○ New         —         ( ) Unassigned (Today)
 Meera S. · ENQ-0047
 …
───────────────────────────────────────────────────────────────────────────────
 Showing 1–15 of 42                                       Page 1 of 3   [‹ Prev] [Next ›]
```

**Behaviour**
- Default sort is *Follow-up (soonest), nulls last*. Overdue rows sort first automatically.
- Status strip counts respect the other active filters.
- All state lives in the URL (`q`, `status`, `source`, `assignee`, `due`, `sort`, `page`).
- Search and filters trigger the refetch pattern (dim + progress line); the result live region announces the count.
- Row = link to detail. There are no row menus or bulk selection.
- Sticky table header while scrolling.
- The header count reads "42 total" or "12 of 42" when filtered.

**States:** Loading (§6.7), Empty-none (§6.6), Empty-filtered (§6.6), Error (§6.8).

### 6.3 Create enquiry

Route `/enquiries/new`. A ledger-style form: a **label gutter** on the left explains each group; fields sit in a 640px column on the right.

```
ENQUIRIES / NEW
New enquiry                                                 
═══════════════════════════════════════════════════════════════════════════════
───────────────────────────────────────────────────────────────────────────────
All fields are required unless marked optional.

 Who                        │ Client / company
 Who is asking?             │ [_______________________________________]
 Add at least an email or   │ Contact person
 a phone number.            │ [_______________________________________]
                            │ Email                     Phone
                            │ [__________________]      [__________________]
 ───────────────────────────┼─────────────────────────────────────────────
 What                       │ Source                    Service
 What do they need?         │ [Choose source      ▾]    [Choose service   ▾]
                            │ Requirement description
                            │ [                                          ]
                            │ [                                          ]
                            │                                    0 / 2000
                            │ Estimated budget  optional
                            │ [₹][__________________]
 ───────────────────────────┼─────────────────────────────────────────────
 Handling                   │ Status                    Assigned to  optional
 Who owns it and what       │ [New                ▾]    [Unassigned       ▾]
 happens next?              │ Next follow-up  optional
                            │ [dd/mm/yyyy____]
                            │ [Today][Tomorrow][In 3 days][Next week][Clear]
                            │ Additional notes  optional
                            │ [                                          ]
───────────────────────────────────────────────────────────────────────────────
 Ctrl+Enter to create                             [ Cancel ]  [ Create enquiry ]
```

**Specifications**
- Group headings in the gutter: `heading` style (Newsreader 20) plus a `meta` helper line. Groups are separated by hairlines spanning the full width.
- Field pairs use a 2-column grid with 16px gap; Description and Notes are full width. Vertical rhythm 20px between fields.
- Autofocus on "Client / company".
- Validation: on blur first, then on change once a field has been touched. On submit failure, the error summary appears above the first group, receives focus, and links to each invalid field.
- Status defaults to New; Assigned defaults to Unassigned. If Won or Lost is chosen, the follow-up date input is disabled with helper "Not needed for closed enquiries."
- Action bar is sticky to the bottom of the viewport when the form is taller than the screen (paper background, top hairline).
- Submit: button shows "Creating…", all fields become read-only (not disabled, to preserve focus), and the form has `aria-busy`.
- Success: navigate to the new enquiry; toast "Enquiry created — ENQ-0043" with action "View" is unnecessary because the user is already there, so the toast has no action.
- Cancel: returns to the previous page; if the form is dirty, the Discard dialog opens.

**Optional (could-have):** non-blocking notice beneath Client/Email/Phone when a match exists: "A similar enquiry exists: ENQ-0031 Meridian Logistics ›" in `warning-tint` with a link.

### 6.4 Enquiry detail

```
ENQUIRIES / ENQ-0042                                      [ Edit ]
Meridian Logistics
Priya Raman
═══════════════════════════════════════════════════════════════════════════════
───────────────────────────────────────────────────────────────────────────────
 ◑ Qualified     ●━━━━●━━━━◐───○───○───○     New  Contacted  Qualified  Proposal  Negotiation  Won

 REQUIREMENT                                                │ HANDLING
 Custom software                                            │ ┌───────────────────────────┐
 Web-based dispatch and tracking tool for a 40-vehicle     │ │ STATUS                    │
 fleet. Needs driver mobile view and monthly reports.       │ │ [◑ Qualified          ▾]  │
                                                            │ │ ASSIGNED TO               │
 CONTACT                                                    │ │ [(PR) Priya Raman     ▾]  │
 Priya Raman                                                │ │ NEXT FOLLOW-UP            │
 ✉ priya@meridian.example        ☎ +91 98765 43210          │ │ (Overdue by 6 days)       │
 [Email] [Call] [WhatsApp]                                  │ │ Fri 24 Sep                │
                                                            │ │ [Today][Tomorrow][3d]     │
 NOTES                                                      │ │ [Next week][Pick][Clear]  │
 Prefers calls after 4 pm. Introduced by Kestrel Energy.    │ │ ─────────────────────     │
                                                            │ │ BUDGET      ₹6,50,000     │
 ACTIVITY                                                   │ │ SOURCE      WhatsApp      │
 ○ Status changed from Contacted to Qualified  30 Sep 10:42 │ │ CREATED     12 Sep 2026   │
 ○ Assigned to Priya Raman                     14 Sep 09:10 │ │ UPDATED     2h ago        │
 ● Enquiry created                             12 Sep 16:30 │ └───────────────────────────┘
```

**Specifications**
- **Header:** eyebrow breadcrumb; client name in `title`; contact person in `body` `ink-2`. **Edit** is a secondary button with `e` kbd hint. Created/updated live in the side panel.
- **StageTrack:** below the masthead rule, a `solid` StageMark at left, then a horizontal track. Nodes are 12px circles; connecting segments are 2px. Passed stages are filled `ink`; the current stage is a `brand` ring with a filled centre; future stages are `rule-strong` rings. Labels below nodes (12px, `ink-2`; current in `ink` 600). Won: all nodes filled `success`. Lost: nodes muted `ink-4`, terminal "Lost" node with slash in Lost colour.
- **Layout:** two columns at ≥ 1024px — main (1fr) and the **Handling panel** (320px, sticky at `top: 24px`), 32px gap. Main sections are separated by hairlines with `eyebrow` headings.
- **Contact:** email is a `mailto:` link, phone a `tel:` link, plus a WhatsApp link (`https://wa.me/<digits>`) shown when a phone exists. Each of the three appears as a 36px secondary button with an icon; unavailable ones are omitted, not disabled.
- **Handling panel (the one panel on this page):** Status (Radix Select with StageMarks), Assigned to (Select with avatars), Next follow-up (chip showing state + full date, date presets, "Pick" opens native date input, Clear). Budget, Source, Created and Updated are read-only rows below a hairline. Quick actions save immediately with optimistic UI; a `Saved` micro-label appears next to the control's label for 2s. Failure reverts the value and shows an inline message (§6.8).
- Selecting **Lost** opens the Mark-as-lost dialog before saving. Selecting **Won** or **Lost** clears the follow-up display ("Not needed").
- **Activity:** newest first, uses §3.16. Shows up to 20 items with "Show earlier" beyond that.
- Notes preserve line breaks; empty sections show muted "No notes." with an inline "Add" link that opens Edit at the notes field.

### 6.5 Edit enquiry

Same form component as Create (§6.3) with these differences:

```
ENQUIRIES / ENQ-0042 / EDIT                       Last updated 2h ago
Edit enquiry
Meridian Logistics
═══════════════════════════════════════════════════════════════════════════════
 …fields pre-filled…
 ▎ Requirement description   (brass 2px bar at left = changed)
───────────────────────────────────────────────────────────────────────────────
 2 unsaved changes                                [ Cancel ]  [ Save changes ]
```

- Eyebrow shows the breadcrumb ending in EDIT. Right of the header shows "Last updated 2h ago" (`meta`) so people notice staleness.
- **Changed-field marker:** a 2px `brass` bar on the left of any field whose value differs from the saved one, plus visually hidden text "changed" in the label. It is a decorative aid and never the only indicator (the counter states the total).
- The action bar shows a mono counter "2 unsaved changes" on the left. **Save changes** is disabled until the form is dirty.
- Changing Status to Won or Lost shows helper text under the status field: "The follow-up date will be cleared."
- Leaving with unsaved changes (Cancel, breadcrumb, back, nav, browser unload) triggers the Discard dialog (browser `beforeunload` for tab close).
- Success: navigate to detail, toast "Changes saved". The newest activity entry is highlighted per §4.3.
- Not-found enquiry renders the 404 state (§6.8).

### 6.6 Empty states

**A. No enquiries at all (list)**

```
 ─────────────────────────────────
 ─────────────────────────────────    (ruled-lines motif)
 ─────────────────────────────────
 ─────────────────────────────────
 ─────────────────────────────────

        No enquiries yet
 Capture the first enquiry from WhatsApp, Instagram, email or your website.
 Each one appears here with its stage and next follow-up.

           [ + New enquiry  N ]
```

The status strip and filter bar are hidden; the page header remains.

**B. No results for the current filters**

```
        Nothing matches these filters
 [Status: Qualified ✕] [Source: WhatsApp ✕] [Search: "acme" ✕]
 Try removing a filter or searching for something broader.

           [ Clear filters ]
```

The toolbar stays visible. Each chip is removable (secondary, 28px, ✕ icon button with `aria-label`). The status strip stays with the counts for the active non-status filters.

**C. Dashboard with no data**
- Headline: "No enquiries yet. Start with your first one."
- Ledger figures show `0` (and `—` for win rate).
- Needs attention: inline block "Nothing to follow up yet." with a New enquiry button.
- Chart sections show one muted line each ("Appears once you add enquiries.").

**D. Dashboard with data but nothing due**
- Headline: "You're clear. No follow-ups are due today."
- Needs attention lists only "No follow-up set" items if any; otherwise the line "Nothing needs attention right now."

**E. Section-level empties**
- Activity: "No activity yet."
- Notes: "No notes." (muted)
- Workload with only unassigned enquiries: shows the Unassigned row only, with caption "Assign enquiries to see workload by person."

### 6.7 Loading states

Skeletons mirror the final layout exactly so content never shifts. All use §3.14 timing (150ms show-delay, 300ms minimum).

| Screen | Skeleton |
|---|---|
| Dashboard | Headline bar (60% width, 32px) · five figures (numeral bar 56×40 + label bar) · attention: 3 group headings + 6 rows (chip 96×24, name bar, stage bar 80×12, avatar circle) · chart rows: label bar + 8px track · activity: 4 lines |
| List | Status strip real labels with skeleton counts · toolbar real · 8 skeleton rows with the desktop column widths (two-line first cell) |
| Detail | Title bar 280×28, subtitle 160×16, track bar, four text blocks (3 lines each), Handling panel with three 40px control bars |
| Create/Edit | Real labels and gutter text; controls as 40px bars (edit only, while the record loads); action bar real but Save disabled |

**Interaction loading patterns**
- Filter or search change: existing rows dim to 60% and stay interactive-looking but pointer-disabled, with a 2px `brand` progress line beneath the toolbar. The new rows fade in over 120ms.
- Buttons: "Creating…", "Saving…", "Marking as lost…"; spinner in place of icon.
- Quick actions: the changed control shows a 14px spinner at its right edge; value updates optimistically.
- Pagination: table dims; focus stays on the pressed button.
- Route change: top progress line after 150ms.

### 6.8 Error states

**A. List/dashboard fetch failure** — replaces the affected region, toolbar and header stay.

```
┃ ⚠  We couldn't load enquiries
┃    This is usually temporary. Check your connection and try again.
┃    [ Try again ]   Go to dashboard
```
Panel: bg `danger-tint`, 3px `danger` left bar, 1px `rule`, padding 20px, `role="alert"`, icon 20px `danger`. **Try again** re-runs the request and shows the spinner inside the button. On the dashboard each section handles its own failure ("Couldn't load pipeline. Try again").

**B. Enquiry not found (404)**

```
        404
 That enquiry doesn't exist
 It may have been removed, or the link may be wrong.
        [ Back to enquiries ]
```
"404" in `data` 12 `ink-3` above the title. Applies to malformed IDs too.

**C. Unexpected error boundary**
Centred block inside the content area: title "Something went wrong", body "An unexpected error occurred. You can try again, or head back to the dashboard.", buttons **Try again** and **Dashboard**. No technical details are shown; an optional muted reference code (`data`) may appear.

**D. Form validation failure**
- Field errors beneath fields (§3.2).
- Error summary above the form: bg `danger-tint`, 3px `danger` left bar, title "Please fix 3 problems", list of links each focusing its field. Summary receives focus on failed submit.

**E. Submit failure (server/network)**
- The same alert style above the form: "We couldn't save the enquiry. Nothing was lost — your entries are still here. Try again." The button re-enables. If offline: "You appear to be offline. Your entries are still here."

**F. Quick-action failure**
- Value reverts with a 120ms transition. Inline message under the control (13px `danger`, `AlertCircle`): "Couldn't update status. Reverted." Clears after 6s or on next change. A rollback toast (error, 6s) also appears because the control might be off-screen on mobile.

### 6.9 Success feedback

| Moment | Feedback |
|---|---|
| Enquiry created | Redirect to detail; heading receives focus; toast (success): **"Enquiry created"** with description "ENQ-0043 · Meridian Logistics"; first activity entry animates in with highlight |
| Changes saved (edit) | Redirect to detail; toast: **"Changes saved"**; changed values are not highlighted (the activity entry is) |
| Status changed (quick) | StageMark glyph sweeps to the new fill; StageTrack segment fills; inline "Saved" label; new activity entry; no toast |
| Won | Same as status change plus success toast **"Marked as won"**; all track nodes fill `success` |
| Lost | Dialog closes; toast **"Marked as lost"** with action **Undo** (5s) that restores the previous status (could-have) |
| Assignee / follow-up changed | Inline "Saved" only |
| Copy actions (if added) | Not in scope |

Success feedback is calm: no confetti, no sound, no full-screen confirmation.

### 6.10 Microcopy reference

| Context | Copy |
|---|---|
| Primary create button | Create enquiry |
| Primary edit button | Save changes |
| Pending labels | Creating… · Saving… · Marking as lost… |
| Required-fields note | All fields are required unless marked optional. |
| Contact hint | Add an email or a phone number so you can reach them. |
| Search placeholder | Search by company, contact, email or phone |
| Result count (live region) | 12 enquiries found · No enquiries found |
| Unassigned | Unassigned |
| No follow-up | No follow-up set |
| Closed follow-up | Not needed |
| Offline | You appear to be offline. |

Tone: plain, specific, no exclamation marks, no blame, no jargon.

---

## 7. Charts

No charting library. Charts are semantic HTML lists with CSS bars, plus one optional SVG. Every value is printed as text next to its bar, so bars are visual reinforcement only (`aria-hidden`).

### 7.1 Pipeline by stage (horizontal bars)

- Rows: New, Contacted, Qualified, Proposal Sent, Negotiation. Then a 1px `rule-strong` divider. Then Won and Lost as summary rows (no bars).
- Row height 44px; grid columns: label (150px: StageMark inline) · track (flex) · count (48px right, `data-strong`) · value (80px right, `data` `ink-2`).
- Track: 8px tall, bg `sunken`, radius 2px. Fill: the stage's solid colour. Width = count ÷ max open-stage count (scaled to the largest row). A non-zero row is at least 4px wide. Zero rows show an empty track and `0` in `ink-3`.
- Row is a link to the filtered list. Hover: bg `surface`, chevron fades in at right (120ms). Focus outline per §8.
- Load animation: `scaleX` 0→1, origin left, 400ms, 30ms stagger; skipped under reduced motion.
- Accessible name: "Qualified, 6 enquiries, ₹14.2L. View list."

### 7.2 By source (horizontal bars with won overlay)

- Rows sorted by total enquiries descending; each shows SourceLabel (140px), track, and text "18 · 2 won" (`data`).
- Track: 8px, bg `sunken`. Fill 1 (all enquiries): `brand` at 35%. Fill 2 (won): `brand` at 100%, overlaid from the left, width = won ÷ max total.
- A small legend beneath the section title: ▮ Enquiries ▮ Won (12px text, swatches 8×8).
- Sources with zero enquiries are hidden. Top 5 sources shown; "Show all" if more.
- Row links to the list filtered by source.

### 7.3 Workload (stacked horizontal bars)

- Rows: Avatar + name (150px), track, text "9 open · 2 overdue".
- Track: 8px `sunken`. Segment 1 (open, not overdue): `ink-2` at 45%. Segment 2 (overdue): `danger`. Scale = person with most open enquiries.
- Overdue count text is `danger` 500 when > 0.
- Unassigned row appears last, with dashed avatar.
- Row links to the list filtered by assignee.

### 7.4 Weekly intake (optional, could-have)

- A hand-built SVG column chart of enquiries created per week for the last 8 weeks, placed full-width under Workload.
- Height 96px, columns 24px wide with 12px gaps, `brand` at 100% for the current week and 45% for earlier weeks. Baseline is a 1px `rule-strong` line; there are no gridlines or y-axis. Value above each column (`data` 12); week-start label beneath (`data` 12, `ink-3`, e.g. `8 Sep`).
- Columns are `<rect>` elements with `<title>` text; the whole chart has a text alternative and a visually hidden table.
- Animation: columns grow with `scaleY`, 400ms, 30ms stagger.

### 7.5 Chart rules

- Colours never appear without labels. Only one hue family beyond the stage colours.
- No pie or donut charts, gradients, shadows, 3D, animated legends, or hover-only data.
- Text alternatives: each chart section has an `h2` and the list markup carries the data.

---

## 8. Hover, focus and active states

### 8.1 Hover (pointer devices only, `@media (hover: hover)`)

| Element | Hover |
|---|---|
| Primary button | bg → `brand-hover` |
| Secondary button | bg → `sunken` |
| Ghost button / icon button | bg → `sunken`, text → `ink` |
| Link | underline thickens to 2px |
| Nav item | bg → `paper` at 60% |
| Table row / attention row / chart row | bg → `surface`, inset left `brand` bar (table/list rows), chevron reveal (chart rows) |
| Input / select | border → `ink-2` |
| Filter trigger | border → `ink-2` |
| Status strip item | text → `ink` |
| Panel (interactive only) | border → `rule-strong` |
| Chip (date preset) | bg → `sunken` |
| Dropdown item | bg → `sunken` |

### 8.2 Focus

- **Focus ring (keyboard, `:focus-visible`):** 2px solid `brand`, offset 2px, radius follows the element. On `sunken` surfaces (sidebar) the offset gap is `sunken`; the ring is still `brand`.
- **Inputs** additionally show border → `brand` and a 3px `brand` 22% halo on any focus (mouse or keyboard).
- **Rows:** ring applies to the stretched link, drawn inset (`outline-offset: -2px`) so it isn't clipped.
- **Programmatic focus** (headings, error summaries) uses `outline: none` on the target but is always followed by visible content changes.
- Never remove an outline without replacing it. Focus indicators must maintain ≥ 3:1 contrast against adjacent colours.

### 8.3 Active / pressed and disabled

- Buttons shift 0.5px down and darken (§3.1). Rows use `sunken`. Chips use `brand-tint`.
- Disabled elements use `ink-4` text or 50% opacity, no hover, `cursor: not-allowed`, and remain discoverable via `aria-disabled` when a tooltip explains why.

---

## 9. Accessibility (applies to every screen)

- Target **WCAG 2.2 AA**. Colour pairs from §1.1 are verified in build.
- Landmarks: `header`/`nav` (sidebar or top bar), `main`, one `h1` per page; sections have `h2`; tables use `caption` (visually hidden) and `th scope`.
- Forms: every control has a visible label; errors use `aria-describedby` and `aria-invalid`; summary receives focus.
- Live regions: result counts (polite), toasts (polite/assertive), inline Saved/error messages (polite).
- Dialogs, sheets, menus use Radix for focus trapping and return.
- Touch targets ≥ 44×44 CSS px on touch devices; nothing relies on hover.
- Text can zoom to 200% and reflow at 320px width without horizontal page scroll.
- Motion respects `prefers-reduced-motion`; keyboard shortcuts can be disabled.
- Status is always text plus glyph; overdue is text plus icon plus colour.

---

## 10. Responsive versions

### 10.1 Breakpoint behaviour summary

| Area | < 640 | 640–1023 | ≥ 1024 |
|---|---|---|---|
| Navigation | Top bar + bottom tabs | Top bar + bottom tabs | Left sidebar |
| Dashboard figures | 2-up primary + 3-up secondary | 5 across, compact | 5 across |
| Dashboard sections | Single column | Single column, two-up charts | Two columns |
| List | Cards | Table (fewer columns) | Full table |
| Filters | Bottom sheet | Inline toolbar (wrap) | Inline toolbar |
| Create/Edit | Single column, sticky actions | Single column, gutter above fields | Gutter + fields |
| Detail | Single column, Handling first | Single column, handling grid | Two columns |

### 10.2 Mobile dashboard (390px)

```
┌──────────────────────────────────┐
│ ▮ Senthuron Ops          [ + New]│  top bar 52
├──────────────────────────────────┤
│ WED 30 SEPTEMBER 2026            │
│ 3 follow-ups are overdue         │
│ and 2 are due today.             │
│ ═════════════════════════════════│
│ ─────────────────────────────────│
│   3            │   2             │
│   OVERDUE      │   DUE TODAY     │  figure 40
│ ─────────────────────────────────│
│ 24        │ ₹48.2L   │ 38%       │  figure-sm 28
│ OPEN      │ PIPELINE │ WIN RATE  │
│ ─────────────────────────────────│
│ NEEDS ATTENTION                  │
│ (Overdue · 6d)                   │
│ Meridian Logistics            ›  │
│ ◑ Qualified · PR                 │
│ ─────────────────────────────────│
│ (Overdue · 2d)                   │
│ Bluepeak Clinics              ›  │
│ ◔ Contacted · AK                 │
│ View all 6 ›                     │
│ ─────────────────────────────────│
│ PIPELINE BY STAGE                │
│ ○ New              6     ₹6.1L   │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░                │
│ …                                │
├──────────────────────────────────┤
│ Dashboard    Enquiries     New   │  tab bar 56
└──────────────────────────────────┘
```

- Attention rows are two-line (chip on top, name, then stage + assignee) at 64px minimum height.
- Chart rows are two-line: label + count + value on top, full-width track beneath.
- By source and Workload show the top 4 rows with a "Show all" link. Recent activity is collapsed behind a disclosure.

### 10.3 Mobile list (390px)

```
┌──────────────────────────────────┐
│ ▮ Senthuron Ops          [ + New]│
├──────────────────────────────────┤
│ Enquiries                42 total│
│ ═════════════════════════════════│
│ ─────────────────────────────────│
│ [ All 42 ][ New 6 ][ Contacted 5 ][ ›…scroll
│ [🔍 Search…            ] [⚲ 2]  │  filters button + active count
│ ─────────────────────────────────│
│ Meridian Logistics    ◑ Qualified│
│ Priya Raman · Custom software    │
│ (Overdue · 6d)  (PR)   ₹6,50,000 │
│ ─────────────────────────────────│
│ Bluepeak Clinics      ◔ Contacted│
│ Dr. A. Khan · Web development    │
│ (Overdue · 2d)  (AK)   ₹2,00,000 │
│ …                                │
│ Showing 1–15 of 42     [‹] [›]   │
├──────────────────────────────────┤
│ Dashboard    Enquiries     New   │
└──────────────────────────────────┘
```

- Cards are rows separated by hairlines (no boxes), min height 88px, whole card is a link.
- Sort lives inside the Filters sheet on mobile.
- Filter sheet per §3.11 with a live "Show n results" button.

### 10.4 Mobile create and edit (390px)

```
┌──────────────────────────────────┐
│ ‹ Back                  New      │  top bar (no bottom tab bar)
├──────────────────────────────────┤
│ New enquiry                      │
│ ═════════════════════════════════│
│ ─────────────────────────────────│
│ All fields are required unless   │
│ marked optional.                 │
│                                  │
│ WHO                              │
│ Client / company                 │
│ [______________________________] │
│ Contact person                   │
│ [______________________________] │
│ Email                            │
│ [______________________________] │
│ Phone                            │
│ [______________________________] │
│ …                                │
├──────────────────────────────────┤
│ [ Cancel ]   [ Create enquiry  ] │  sticky action bar 64 + safe area
└──────────────────────────────────┘
```

- Group headings become `eyebrow` section labels with the helper text beneath. Fields are single column, 44px tall, native selects/date pickers, correct `inputmode`.
- The action bar is sticky with a top hairline; Cancel is ghost (40% width), primary takes the rest. On edit, the counter "2 unsaved changes" sits above the buttons.
- When the on-screen keyboard opens, the focused field scrolls into view with 96px clearance above the action bar.
- Error summary appears at the top and the page scrolls to it.

### 10.5 Mobile detail (390px)

```
┌──────────────────────────────────┐
│ ‹ Enquiries       ENQ-0042  [✎]  │  top bar, Edit icon button
├──────────────────────────────────┤
│ Meridian Logistics               │
│ Priya Raman                      │
│ ═════════════════════════════════│
│ ─────────────────────────────────│
│ ◑ Qualified   Step 3 of 6        │  compact track: 6 dots, current labelled
│ ●──●──◐──○──○──○                 │
│                                  │
│ [ ☎ Call ] [ WhatsApp ] [ ✉ ]    │  44px action row
│                                  │
│ HANDLING                         │
│ Status        [◑ Qualified    ▾] │
│ Assigned to   [(PR) Priya R.  ▾] │
│ Next follow-up (Overdue by 6 days)│
│ [Today][Tomorrow][3d][Wk][Clear] │  horizontally scrollable presets
│ Budget ₹6,50,000 · WhatsApp      │
│ ─────────────────────────────────│
│ REQUIREMENT                      │
│ Custom software                  │
│ Web-based dispatch and …         │
│ ─────────────────────────────────│
│ NOTES · ACTIVITY (latest 3)      │
│ Show all activity ›              │
├──────────────────────────────────┤
│ Dashboard    Enquiries     New   │
└──────────────────────────────────┘
```

- Handling comes **before** requirement on mobile because status and follow-up are the most frequent updates.
- The Handling block is a bordered panel with the same controls; presets scroll horizontally.
- The Call/WhatsApp/Email row only shows the actions whose data exists.
- Activity shows the latest 3 entries with "Show all activity".

### 10.6 Mobile states

- **Loading:** identical skeletons scaled to mobile; the top progress line sits under the top bar.
- **Empty:** block is left-aligned in a full-width column; primary button spans full width (44px).
- **Error:** same panels, full width; buttons stack vertically.
- **Success:** toast bottom-centre above the tab bar (or above the action bar on forms); swipe to dismiss.
- **Dialogs** on mobile render as bottom-anchored sheets with 12px top radius; buttons stack full-width with the primary first.

---

## 11. Component inventory and state matrix

| Component | Default | Hover | Focus | Active | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Input / Textarea | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| Select (form) | ✓ | ✓ | ✓ | — | ✓ | — | ✓ |
| Status select (quick) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ (inline) |
| Date presets | ✓ | ✓ | ✓ | selected | ✓ (closed) | — | — |
| Filter trigger | ✓ | ✓ | ✓ | active filter | — | — | — |
| Status strip item | ✓ | ✓ | ✓ | current | — | count skeleton | — |
| Table row | ✓ | ✓ | ✓ | pressed | — | skeleton | — |
| Attention row | ✓ | ✓ | ✓ | pressed | — | skeleton | — |
| Chart row | ✓ | ✓ | ✓ | pressed | — | skeleton | inline |
| Nav item | ✓ | ✓ | ✓ | current | — | — | — |
| Toast | success / error / info | pause timer | ✓ | — | — | — | ✓ |
| Dialog / sheet | ✓ | — | trap | — | — | pending action | inline |

Domain components to build (names align with the product spec): `StageMark`, `StageTrack`, `FollowUpChip`, `SourceLabel`, `Avatar`, `LedgerFigure`, `BarRow`, `AttentionRow`, `EnquiryRow`, `EnquiryCard`, `StatusStrip`, `FilterBar`, `FilterSheet`, `EnquiryForm`, `DatePresets`, `HandlingPanel`, `ActivityList`, `PageHeader`, `EmptyState`, `ErrorPanel`, `Kbd`, `ShortcutsDialog`.

---

## 12. Implementation guidance and acceptance checklist

**Implementation notes**
- Tokens live in one `globals.css` `:root` block and one Tailwind `theme.extend`; components consume tokens only, never raw hex.
- shadcn components are copied in and restyled via the token mapping in §1.1; delete unused ones.
- Animations use Tailwind utilities plus a small set of keyframes (`page-in`, `pulse-soft`, `bar-grow`, `highlight-fade`); `tw-animate-css` handles Radix enter/exit states. Avoid a motion library unless a specific need appears.
- Currency, date and relative-time formatting are centralised in one `format.ts` module so tables, figures and forms match.
- Charts are plain components taking already-aggregated data from the dashboard service.
- Build the shell, tokens and `StageMark` first; they set the visual identity for every later screen.

**Visual acceptance checklist**
- [ ] No gradients, glows, blurs, textures, 3D or decorative illustrations anywhere.
- [ ] Masthead double rule on every page header.
- [ ] Every status shows glyph + label; every overdue item shows text + icon + colour.
- [ ] All data (budget, dates, phones, references, counts) is monospaced and aligned.
- [ ] Only floating layers have shadows.
- [ ] Focus is visible on every interactive element in both themes of context (paper, sunken, surface).
- [ ] Skeletons match final layout; no layout shift on load.
- [ ] Filters, search and pagination live in the URL and survive refresh and back.
- [ ] Create → detail and edit → detail flows show a toast and move focus to the heading.
- [ ] All screens verified at 320, 390, 768, 1024, 1280 and 1440px.
- [ ] Reduced-motion mode shows no movement and no pulse.
- [ ] Keyboard-only run-through: create, filter, open, change status, edit, discard dialog.
