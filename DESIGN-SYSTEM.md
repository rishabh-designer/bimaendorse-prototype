# Design system and constraints

---

## Environment constraints — non-negotiable

| Constraint | Consequence |
|---|---|
| Single `.jsx` file, default-exported `App` | No module splitting, no separate CSS file |
| Tailwind **core utilities only** — no JIT | `bg-[#0B6E5F]` will not compile. Custom colour goes through inline `style` |
| No browser storage | All state is React state — including sidebar collapse, which V001.1 persisted |
| `lucide-react` for icons | No other icon library |
| **Two web fonts, loaded** | Anek Latin **and Anek Kannada** from Google Fonts, injected by `useAnek()`. A deliberate exception to the old system-stack-only rule. Kannada is there so a Kannadiga user is greeted in her own script; Anek covers ten Indic scripts, so add a face when a user needs one. The fallback stack is real, so an offline render degrades rather than breaks |
| Available libraries | recharts, lodash, d3, mathjs, papaparse, xlsx, chart.js, three, tone — none currently used |

Because arbitrary Tailwind values are unavailable, the palette lives in a single object `C` and is applied inline. **That object is the token file.** Change a value there and it propagates.

---

## Palette

```js
const C = {
  ink: "#0E1A1F",  ink2: "#3D5058",  ink3: "#7C8F97",   // text: primary, secondary, tertiary
  line: "#D2D5D8", lineSoft: "#ECECF1", subtle: "#E6E8EA", // borders, hairlines, recessed fills
  canvas: "#F4F5F6", white: "#FFFFFF",                   // sunken strips, surfaces
  teal: "#0B6E5F",  tealSoft: "#E4F0ED",                 // healthy SLA, verified, complete
  link: "#1458D2",                                        // client names, references
  breach: "#B3261E", breachSoft: "#FBEAE8",              // overdue, terminal, destructive
  warn: "#A15C00",  warnSoft: "#FDF2E1",                 // at risk, blocked, financial
  wait: "#4B5EAA",  waitSoft: "#EAECF7",                 // external party, on hold, portal

  // Chrome — V001.1's language. Dresses the shell; never states a ticket's condition.
  brand: "#4100CF", brand600: "#320099", brand400: "#7A4DEB",
  brand200: "#EDE6FF", brandBg: "#F4F1FF",
  cream: "#FFF6ED",  // brand-secondary-subtle — no longer the page ground; unused
  accent: "#FF7700", greet: "#9082B3",
  figInk: "#1C1D1F", figHint: "#6F7378", figTert: "#A9ACB1", figPlaceholder: "#BEC2C6",
};
```

**Colour carries meaning here — it is not decoration.**

The palette is two layers, and the split is the point. **Semantic** tones (teal · warn · breach ·
wait · ink3) state a ticket's condition and are unchanged from the original build. **Chrome** tones
(brand · accent · fig\*) dress the shell — nav, headings, primary buttons, brand marks — and
never encode status. Purple on a control means "this is the main action here", never "this ticket is
healthy".

Two tertiary greys coexist on purpose: `ink3` is the **data** tertiary (SLA codes, ages, meta lines,
where legibility at 11px matters) and `figTert` the **chrome** tertiary (section labels, hints, page
subtitles). Do not collapse them.

| Tone | Means |
|---|---|
| teal | healthy, broker-owned, primary action |
| warn | at risk, blocked on input, **financial classification** |
| breach | overdue, terminal, destructive |
| wait | waiting on someone outside the desk — customer, insurer, operations, portal |
| ink3 | system-owned, inert, not-yet-reached |

`semError` `#CF0000` and `semCaution` `#B38F0A` are the Peetal **label/semantic** pair, used for the
Stage due countdown — breached reads error, at risk reads caution. They are label colours, distinct
from the indicator dot/fill tokens.

Before reassigning a colour, check `toneOf` and the tables in `docs/UI-INVENTORY.md`. Financial-as-amber and external-as-blue are load-bearing.

---

## Typography

**Anek Latin** throughout, weights 100–800, with `system-ui` behind it. Loaded once by `useAnek()`,
alongside two exceptions:

- **Anek Kannada**, so a Kannadiga user can be greeted in her own script. The greeting belongs to the
  user record, not the component — see `PORTAL_USERS`.
- **Instrument Serif Italic** as the **display face**, and only there: the initials on participant
  marks and mail-trail avatars (`label-system/typeface/display` in the client's system, `SERIF` here).
  It is never used for running text.

`font-mono` is **gone**. It previously carried the "data" voice; V001.1 has no mono anywhere and uses
weight for that job instead. Digit alignment is preserved by the `.bk-num` class
(`font-variant-numeric: tabular-nums`), applied everywhere `font-mono` used to be — ticket ids,
countdowns, durations, SLA allowances, money, UTRs, policy numbers, counts. **Keep applying `.bk-num`
to columns of digits**; without it a table of countdowns stops aligning.

Scale in use: `text-xs` (11–12px) for meta and labels, `text-sm` for body and table rows, `text-base`
for card headlines, `text-lg` for the ticket type heading. Page titles are 32/600 at `-0.8px`
tracking in `brand`; the Home greeting is 26/600; metric values are 26/600 in their tone.

Section labels are small-caps-ish: `text-xs font-semibold uppercase tracking-wider` in `figTert`.

---

## Layout

The **shell** is a **`canvas` `#F4F5F6` page** (background/foundation/card-sunken) at `p-3`, with the
entire console inside one floating white card — 20px radius, 1px `lineSoft`,
`0 2px 8px rgba(28,27,31,.06)`. Inside it, a **237px** `Sidebar` (collapsing to **92px**) and a
scrolling `main` at `px-8 py-6`. The page does not scroll; the main pane does.

V001.1 used the warm `cream` `#FFF6ED` here; **this build does not.** The ground is neutral, so the
only warmth left is `accent` on the BimaEndorse wordmark and the progress bar. `cream` remains in the
palette but nothing uses it.

The sidebar sits on the same `canvas` as the page, separated by the white card's edge. Its active nav
row is the recessed grey `subtle`, **not** purple — purple is reserved for the primary action, and a
nav row is not one.

- Every view opens with the `Breadcrumb` strip (`canvas`, 12px radius, `p-3`). Its right slot is the
  **permanent top bar**: the breached counter as a `rounded-full` `breachSoft` pill reading
  "N Tickets Breached", and Create Ticket in the brand fill. Both appear on every view; Create Ticket
  is the only route into `Create`.
- Then `PageHead` — title, one line of orientation, the ikkat rule. Home substitutes `Greeting`.
  `ruleFirst` flips the rule above the title, which is what My Tickets uses so the rule separates the
  breadcrumb from the page rather than the title from the table.

## Table controls

The filters live in the column headings (Figma `888:88939`), not in a row above the table.

- **Header cell** — a 16px `r5` white chevron button with a 0.5px `subtle` border, then the label at
  15/600 in `#1C1C1C`. A `brandBg` count badge appears when a filter is active.
- **Menu** — one card for every dropdown, filter and sort alike (Figma `900:96980`): white,
  **16px** radius, 1px `#DFE0E2`, `0 2px 16px rgba(169,172,177,.24)`, `px-2 py-3`. Options are
  16/500 at `px-2 py-3` `rounded-lg`, selected on `brandBg`, each with a circle ticker — filled
  green when chosen, grey outline when not. Rows hover on `brandBg` via `.bk-opt`.
- **`chevron.controls`** — the 16px `r5` white square with a 0.5px `subtle` border is a shared
  component: it is the column-heading chevron *and*, at 24px, the modal close button. Not a circle.
- **Pills** — `rounded-full`, dot + label + count. Selected takes brand text, border and dot on
  white; idle takes `figHint` text, `line` border, `figTert` dot.
- **Dot-pill in a row** — filled for priority and stage, outlined for type and request, label
  truncating so a long endorsement type cannot widen the column.
- **`Indicator` has one fill rule and three sizes.** The dot and hairline carry the meaning; the
  label stays **basic ink**, except in the `outline` variant where it takes the tone itself
  (`IND_TEXT`) — that one is for the desk rows only.

  | Size | Padding | Radius | Border | Used by |
  |---|---|---|---|---|
  | default | 6px | 8 | 0.5px | ticket-table row pills |
  | `big` | 8px | 10 | 0.5px | priority-card status pill (`874:83812`) |
  | `thick` | 3/6px | 8 | 1px | priority-card type & priority (`874:83823`) |

- **Priority card** (`874:83810`) — 1px `subtle`, **r16**, `p-4`, and a vertical gradient
  `brandBg → white at 50%`. It is the only card in the build that is not flat.

**The ticket table carries no border and no outer padding** (Figma `893:91118`). A stroke costs
~26px of horizontal room across the table, which the seven columns cannot spare. Table text is 14px;
the header strip is a full-bleed `canvas` bar at `rounded-xl`.

Two mechanics worth knowing before touching this:

1. The table section carries **no `overflow-hidden`** — it would clip an open menu. Its header strip
   is rounded with `rounded-t-2xl` instead.
2. `useSquircle` skips overflow-visible containers holding a positioned child, so the table
   **loses its corner smoothing while a menu is open** and regains it on close. That is the guard
   working, not a bug.
- Radius scale, all Tailwind core: `rounded-lg` 8 (chips, buttons, nav rows) · `rounded-xl` 12
  (panels, cards) · `rounded-2xl` 16 (queue columns, ticket table) · 20 inline (shell card only) ·
  `rounded-full` pills and avatars · `rounded-sm` the SLA track.
- Borders: 1px `line` for containers, `lineSoft` for row dividers. Action cards use 2px.
- Density: table rows `py-2.5`, card rows `py-3`, panels `p-3–4`. Still tight — V001.1's airier
  spacing was taken on chrome, not on the queues and table.
- Panel pattern: header strip on `canvas` with title, count, hint and an action slot; body on white.

## Corner smoothing

Every rounded element carries Figma's 60% corner smoothing, applied by `useSquircle()` — a global DOM
manager masking each element with a superellipse matched to its own radius. `squirclePath()` is a
port of `figma-squircle` (MIT), verified numerically against that library.

It uses `mask-image`, not `clip-path`, so shadows survive. It **skips**: pills and circles, elements
already carrying a mask (the ikkat rule and marks), anything marked `data-no-squircle`, and
overflow-visible containers holding a positioned child — masking those would clip an open dropdown.

A mask establishes a stacking context, so a fixed overlay inside a masked ancestor gets clipped.
Modals therefore render through `Overlay`, which portals to `<body>`. **Any new modal must use
`Overlay`**, or the shell card will cut it off.

---

## Tooltips

`Tip` (Peetal `87:23267`): recessed `subtle` ground, 8/4 padding, r8, 14px Medium in `figInk`, with a
7px arrow beneath pointing at what it describes. It sits **above** its anchor.

Because the participant stack lives at the right edge of its row, the tooltip is anchored on its
**right** and grows leftward, with the arrow scrubbed to land on the mark - the same manoeuvre the
frame performs by hand. A centred tooltip there would run off the panel.

Native `title` and a `Tip` must never both fire on the same element; `Mark` takes `title={null}` when
it is inside a stack that provides one.

---

## Buttons

Two sizes, both from `button/primary.fill`:

| | padding | radius | label |
|---|---|---|---|
| default | 12 / 20 | r12 | 14px SemiBold |
| **small** (`917:105586`) | 10 / 14 | r10 | 12px SemiBold |

Small is for actions riding a title row - the ticket header's next action and *Mark Customer
Withdrawn*, and the endorsement copy's *Send to customer*. Panel footers use the default: a footer is
where the eye lands last and the action should not shrink there.

Fill is brand on brand; outline is white with a 0.5px stroke in the action's own tone (`semError` for
a terminal action). A blocked action keeps its place, greys to `canvas` / `figDisabled`, and states
why on hover.

---

## Punctuation

**No em dashes in UI text.** Interface copy uses a plain hyphen `-`; the em dash survives only in
source comments and these docs. Durations read as words and capitalised — `1 Min`, `24 CD Hrs`,
`3 Days Ago` — never `1 min` or `24 cd hrs`.

---

## The ikkat rule, twice

The block-print motif appears at two weights. **`.bk-rule`** is the page rule: 4px tall, brand purple,
alternating outlined and solid marks on a 20px pitch. **`.bk-trail`** (`964:119381`) is the audit
trail's divider: 2px tall, `line` grey, one small mark every 16px. The trail carries dozens of rows,
so its rule has to recede; the page rule is a statement and appears three or four times a screen.

Both are the same SVG masked over a background colour — see `IKKAT_RULE_URI` / `IKKAT_TRAIL_URI`.

---

## Status colour

A stage's tone is **data, not a component decision** — it lives on the SLA Master row as `ind`, and
`stageInd()` reads it. See `FUNCTIONAL-SPEC.md` §2 for the table and the rule behind it (Figma
`179:3672`): blue = an outside party holds the clock, amber = a clock we or the customer can act on,
pink = blocked and needing a chase, green = a milestone cleared, grey = routing or terminal.

`Indicator` has two fills for the same tone. **`fill`** is the table/type treatment (white for info,
neutral, success — so a Type pill reads as an outline). **`tint`** is the status treatment: a status
pill always carries its tone as a wash, and is drawn with `<Indicator status …>`. Adding `muted`
completed the set, for terminal tickets — grey wash, grey label.

Type tones come from the same node: Non-Financial **info**, Financial **success**, Refund **caution**.

---

## Brand assets

The client's own marks live in `Public/`. The artifact has no `/public`, so they are downscaled and
inlined as webp data URIs beside the masters they key off:

| Map | Source | Size on screen | Coverage |
|---|---|---|---|
| `INSURER_LOGO` | `Public/Insurance.Comp` | 22–24px tall, width auto | 8 of the 9 insurers in `INSURERS` |
| `PRODUCT_ICON` | `Public/Prod.Icon` | 22–24px square | 10 of the 14 products in `PRODUCTS` |
| `AVATAR`, `AVATAR_UMESH` | `Public/` | 20–38px round | the two people the prototype names |

Used on the ticket header meta row and in the Create form's Insurer and Product fields. **Anything
without a mark falls back to a lucide glyph** — Kotak General, Trade Credit, E&O, Public Liability and
Motor have no file, and the near-matches in the folder are different covers, so nothing stands in for
them. Encoded at 48px (wordmarks) and 64px (rosettes) so they stay crisp at 2×; the whole set is ~60 KB.

---

## Iconography

`lucide-react` at 10–17px. Sizes are load-bearing: 10–11px inline in meta lines, 12–13px in buttons, 14–17px in headers and cards.

Recurring semantics — keep these stable:

| Icon | Means |
|---|---|
| `PauseCircle` | insurer time, clock held |
| `Cpu` | system-driven step |
| `Globe` | client portal |
| `Sparkles` | bot-generated |
| `MoonStar` | silent 15 days+ |
| `FileClock` | awaiting a document or field |
| `IndianRupee` | financial classification |
| `AlertTriangle` / `XCircle` | breached / terminal |
| `History` | the audit trail |
| `ListChecks` | the workflow stage list |
| `BadgeCheck` | a document's provenance is confirmed |

---

## Motion

V001.1's language, reproduced with CSS keyframes — `motion`/framer-motion is not available here.

- `.bk-route` — view enter: opacity + 8px rise, `.4s`, `.05s` delay.
- `.bk-item` + `stagger(i)` — list children: opacity + 10px rise, `.45s`, delay `0.1 + i × 0.06s`.
- Shared easing `cubic-bezier(.22, 1, .36, 1)`.

Two deliberate departures from V001.1, both for this console's sake:

**The stagger is capped at index 6** (max `0.46s`). V001.1 staggers 4–6 widgets; a 14-row ticket
table would leave the last row waiting nearly a second — exactly the "motion that delays reading"
this document warns against.

**Fill mode is `backwards`, not `both`.** The resting style is already visible, so a renderer that
never runs the animation still shows content. `both` would hold it at opacity 0 forever.

`prefers-reduced-motion: reduce` collapses every duration and delay to ~0.

---

## What is deliberate

- Density over whitespace in the data surfaces. This is an all-day operations console.
- Numbers in `.bk-num` tabular figures, never decimal.
- SLA codes displayed next to countdowns so any deadline traces to a master row.
- Muted Medium and Low priorities so Critical and High actually pop.
- Amber for financial, so money-carrying tickets are identifiable before you read anything.

- Purple never states status. A purple control is the main action, not a healthy one.

## What is not defended

Everything else. Specifically open to redesign: the queue column layout, card composition, table row
rhythm, empty states, the document preview, and the entire responsive story.

**Still open — the ticket Detail screen.** Phase A gave it tokens, type, radii and motion only; its
seven-tab structure is untouched. Whether the tabs survive, whether V001.1's ambient metadata strip
goes in beneath the header, and where Premium & payment and Manage live under a two-panel layout are
all undecided. The closed-state SLA block also reads hollow — worth addressing there.
