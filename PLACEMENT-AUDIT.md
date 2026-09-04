# BimaPlacement — Consistency & Duplication Audit (2026-09-04)

Full sweep of the BimaPlacement env inside `prototype.jsx` (single-file React prototype, 12,080 lines; PL_/Pl-namespaced code L7423–L11900). Three parallel Explore agents ran the audit — primitives, screens/tabs, modals/forms. All findings are backed by file:line evidence in `prototype.jsx`.

UI-Supervisor scope only. No state, logic, SLA, or master-data changes.

---

## 1 — Primitive drift (internal, Placement-scope)

| # | Finding | Evidence |
|---|---|---|
| P1 | **`PlSearchModal` bypasses `PlModal`** — rolls its own `createPortal` shell, uses shared `C.*` tokens (not `PL_T.*`), scrim 0.32 + `backdropFilter: blur(2px)` vs canonical 0.42. `PlSearchCard` inside also uses `C.*`. | L11857–L11914; PlModal at L8810 |
| P2 | **Three uppercase-label idioms** duplicating `PlLabel` (L8782): inline `10 / 0.6 / 650 / ink3` blocks in metric strip, table `<th>`s, quote extract labels. | L9330, L9340, L9344, L9348, L9431, L9752, L9866, L9869, L10966, L10981, L11357 |
| P3 | **~30 inline `rounded-lg border` tone-callout blocks** — same shape, different tone. No `PlCallout` primitive exists. | L10031, L10068, L10620, L10629, L10636, L10659, L10681, L10704, L10717, L10739, L11071, L11178, L11340, L11365, L11391, L11434, L11477, … |
| P4 | **Focus ring missing** on `PlInput` / `PlTextArea` / `PlSelect` — all declare `outline-none` with no `focus-visible` replacement. A11y regression. | L8839, L8847, L8855 |
| P5 | **Queue-row usable badge duplicates `PlUsableMeter`** — hand-rolled 22×22 circular badge instead of `PlUsableMeter compact`. | L9065–L9067 vs L8925 |
| P6 | **Inline `borderBottom: 1px solid PL_T.border` dozens of times**; `PlDivider` (L8804) has 0 call sites in Placement. | L9752, L9760, L9954, L10877, L10951, L11004, … |
| P7 | **Dashed paused-chip is one-off** in `PlSlaChip` — no `PlChip` variant for "paused/simulation" state; reusable if extracted. | L8898–L8923 |
| P8 | **`PlModal tone="purple"` is a dead prop** — declared but never read. | L8810 |

## 2 — Screen & tab composition inconsistencies

| # | Finding | Evidence |
|---|---|---|
| S1 | **`PlRightRail` sits LEFT of every case tab and squeezes multi-column tabs.** On Quotes: rail (268 px) + quote list (244 px) + doc pane (340 px) + right pane → 4 columns simultaneously. On QCR: `<table minWidth 620>` inside `overflow-x-auto` because the rail eats the space it needs. | Rail: L9360–L9406; Quotes: L10862, L10864, L10953; QCR: L11353–L11354 |
| S2 | **`plNextAction(c).label` printed twice** — in the metric-strip CURRENT ACTION cell and the left NEXT ACTION rail card. Only the rail card is actionable ("Go there"). | Strip: L9350; Rail card: L9410 |
| S3 | **Stage encoding overlap** — header status chip + `PlStageRail` + strip's CURRENT ACTION cell (stage-adjacent). Two pure stage encodings; the third overlaps S2. | L9313, L9355, L9348 |
| S4 | **Screen-title inconsistency** — only `PlQueueScreen` uses `PageHead`; Inbox / Manual / Master / Reports use plain `<h1 style={fontSize:25}>`; Home uses `<Greeting>` + `<h2>` and no h1. Sisters route every screen through `PageHead`. | Queue L9009; Inbox L9511; Manual L9592; Master L9729; Reports L9823; Home L9211, L9216, L9231 |
| S5 | **Three tab-bar mechanisms live in Placement** — shared `TabBar` (Case only, L9357); `bk-pill` filter chips (Queue only, L9012); text-underline tabs (Inbox L9516 + Manual L9597, JSX duplicated locally, not shared). | as above |
| S6 | **Vestigial `flex gap-3 items-start` wrapper in `PlRfqTab`** now wraps a single `flex-1` child. | L10033–L10034 |
| S7 | **`PlSection` under-used.** Reports/Inbox/Manual/Market column headers/Negotiation round headers/Activity header/Quote-workspace headers all reimplement its chrome inline. | L9828, L9841, L9863, L9530, L9615, L9663, L10597, L11658, L11791, L10930, L11004, L11321 |
| S8 | **Toolbar/filter layout differs by screen** — Queue puts filter pills in `PageHead right=` and search in a toolbar row below; Master puts search inside the header row; Inbox/Manual have no search; Home puts `RangePills` in a section header. | L9012+L9027; L9736–L9743; L9232 |
| S9 | **Action-bar placement varies** — mostly primary-right, but `PlQuoteWorkspace` decision row is left-aligned with three primary/danger/default buttons plus a right-side note. Outlier. | L11080–L11094 |
| S10 | **Two "action panel" shapes in `PlQcrTab`** — "record client decision" (2-col button grid) and "release QCR" (justify-between with primary right). Consolidate. | L11244–L11302 |
| S11 | **Button-size discipline slip** — several `PlBtn` calls omit `size`, defaulting to `md` where `sm` or `lg` was intended. | L9324, L9742, L11252, L11646 |

## 3 — Modal & form duplication

| # | Finding | Evidence |
|---|---|---|
| M1 | **Four search-input shells** for the same job — Queue (`rounded-xl px-3 py-2.5`), Master (`rounded-lg px-2.5 py-1.5`), PlSearchModal (`rounded-xl px-4 py-3`), Add-insurer (via `PlInput`). | L9027–L9033, L9737–L9741, L11887–L11891, L10483 |
| M2 | **Numeric input has no dedicated widget.** Only one live editable numeric field exists — money field in `PlQuoteWorkspace` — using plain `PlInput mono={f.kind==="money"}` with the parent doing `Number(draft.replace(/[^\d]/g,""))` on save. No `inputMode="numeric"`, no ₹-prefix, no thousands-grouping in the input, no right-align. `plInr` (L7537) formats en-IN only for read-only display. | L11027, L11029 |
| M3 | **Text-field-type outlier** — `PlRestartThreadsModal` uses single-line `PlInput` for a "Reason (required)" field where every peer modal uses `PlTextArea`. | L10777 vs L11147, L11411, L11573 |
| M4 | **Five picker/selector patterns** — `PlTick` checkbox, bespoke `<button>` rows (taxonomy, market select), bespoke `rounded-full` toggle chips, outcome-card grid, `PlBtn size="sm" variant="primary"` acting as a chip. | L10249 / L10354 / L10385 / L10749 (PlTick); L11459, L11535; L11475, L9641; L11292; L11145 |
| M5 | **Footer copy irregularities** — `PlAddInsurerModal` single "Done" button (no Cancel/primary pair); Negotiation-draft modal uses "Close" not "Cancel"; `PlSimThreadRmModal` omits the `Check` icon its sibling `PlSimRmModal` has. | L10482, L11740, L10808 vs L10271 |
| M6 | **`PlBtn` icon overuse** — 44 of ~73 `PlBtn` calls in Placement carry an `icon=` prop (Send, Plus, Pencil, Eye, MessageSquare, RefreshCw, …). Memory rule: label-only unless Figma specifies. | grep of `icon=` in Placement range |
| M7 | **Chip vs pill vs dot inconsistency** — `PlChip` dot is 5×5; decorative dots elsewhere are 5×5, 6×6, 7×7. | L8738; L9072, L10619, L11295, L11804 |
| M8 | **No open/close transition** on `PlModal` — components mount/unmount instantly. | L8810 |

## 4 — Hover / focus / disabled / transition drift

- `PlBtn` uses `transition-colors` with **no `hover:` rule** defined per variant — clickable feel comes from the base color only (L8756).
- Only two `hover:` usages in Placement: `hover:bg-slate-50` on queue rows (raw Tailwind, not tokenized to `PL_T.navHover`), and `bk-pill` tab.
- No focus ring on `PlInput` / `PlTextArea` / `PlSelect` (see P4).
- `PlBtn` disabled state is consistent; bespoke `<button>` picker rows (L11292, L11335, L11459, L11475, L11535) have no disabled treatment at all.
- `PlFold` chevron rotates via inline `transform` with no `transition-duration`.

---

## Reconciliation plan — 4 tiers, ranked by impact × ease

User decisions on 2026-09-04: **all four tiers in one pass**; **rail moves to the right** of every case tab.

### Tier 1 — high-impact, low-risk fixes

| # | Change | Fixes | Sites |
|---|---|---|---|
| T1.1 | Route Home / Inbox / Manual / Master / Reports through the shared `PageHead`. Home keeps `Greeting` + `RangePills`; Section h2s stay. | S4 | 5 headers |
| T1.2 | Move `PlRightRail` to the **right** of tab content in `PlCaseWorkspace`. | S1 | L9360–L9375 |
| T1.3 | Repurpose the metric-strip CURRENT ACTION cell (e.g. "Awaiting …" text with no CTA), or drop it. Rail card stays as the actionable one. | S2, S3 | L9347–L9352 |
| T1.4 | Remove the vestigial wrapper `<div className="flex gap-3 items-start">` in `PlRfqTab`. | S6 | L10033–L10034 |
| T1.5 | Add a `focus-visible` ring (`2px PL_T.purple`, 1 px offset) to `PlInput`, `PlTextArea`, `PlSelect`. | P4 | L8836–L8859 |
| T1.6 | Change `PlRestartThreadsModal` "Reason" from `PlInput` to `PlTextArea rows={2}`. | M3 | L10777 |
| T1.7 | Normalise footer copy — `Close` → `Cancel` in Negotiation-draft; add `Check` icon to `PlSimThreadRmModal` for parity with `PlSimRmModal`; leave `PlAddInsurerModal` as "Done" but re-tone as ghost (view-only intent). | M5 | L11740, L10808, L10482 |
| T1.8 | Add explicit `size` on ambiguous `PlBtn` calls per the Action-Panel rule. | S11 | L9324, L9742, L11252, L11646 |
| T1.9 | Remove dead `tone="purple"` prop from `PlModal` signature. | P8 | L8810 |

### Tier 2 — primitive extractions

| # | Change | Fixes | Sites |
|---|---|---|---|
| T2.1 | **Extract `PlSearchField({size:"sm"\|"md"\|"lg"})`** — one bordered search shell with Search-icon left, optional clear-X. Migrate Queue L9027, Master L9737, Add-insurer L10483, Search-modal L11887. | M1 | 4 sites |
| T2.2 | **Extract `PlCallout({tone, children})`** — the `rounded-lg border` tinted panel that appears ~30 times. | P3 | ~30 sites |
| T2.3 | Extend **`PlLabel`** with `size` prop (`xs`=9.5, `sm`=10 default, `md`=10.5). Migrate 10 inline sites. | P2 | 10 sites |
| T2.4 | **Extract `PlUnderlineTabs({tabs, active, onChange})`** — the shared underline+count-pill idiom. Route Inbox + Manual through it. | S5 | 2 sites |
| T2.5 | **Fold `PlSearchModal` into `PlModal`** (add `wide2` = 1000 px). Migrate `PlSearchCard` tokens from `C.*` to `PL_T.*`. | P1 | L11857, L11828 |
| T2.6 | Route every card-header strip through **`PlSection`** — Reports/Inbox/Manual/Market/Negotiation/Activity/Quotes-workspace headers. | S7 | 11 sites |
| T2.7 | Route Queue-row usable-count badge through **`PlUsableMeter compact`**. | P5 | L9065 |

### Tier 3 — form-affordance normalisation

| # | Change | Fixes | Sites |
|---|---|---|---|
| T3.1 | Extend **`PlInput`** with `kind: "text"\|"money"\|"percent"\|"hours"` — adds `inputMode="numeric"`, right-align, live en-IN grouping, prefix. Migrate L11027. | M2 | 1 site |
| T3.2 | Extract **`PlPickerRow`** + **`PlPickerChip`** + **`PlOptionCard`**. Migrate the five picker sites; also gives them disabled/hover states. | M4 | 6 sites |
| T3.3 | Audit `PlBtn icon=` per Figma; keep only for destructive, primary confirmation, navigation. Strip decorative Send/Plus/Pencil/Eye/MessageSquare/RefreshCw. | M6 | ~44 sites |
| T3.4 | Standardise in-screen action-bar placement to primary-right; special-case the `PlQuoteWorkspace` decision row into a footer strip of its containing `PlCard`. | S9 | L11080 |
| T3.5 | Consolidate the two `PlQcrTab` action-panels into one call-to-action shape. | S10 | L11244, L11276 |

### Tier 4 — motion & polish

| # | Change | Fixes | Sites |
|---|---|---|---|
| T4.1 | Add `PlModal` open/close transition — `opacity 0→1` + `translateY 4px→0`, 120 ms; standardise scrim to `rgba(28,27,31,0.42)`. | M8 | L8810 |
| T4.2 | Add per-variant `hover:` on `PlBtn` (subtle bg / brightness shift) + `duration-150`. Tokenize queue-row hover from `hover:bg-slate-50` to `PL_T.navHover`. | §4 | L8744, L9054 |
| T4.3 | Expose the dashed variant on `PlChip` (`dashed=true`) so paused/simulation states elsewhere can share it. | P7 | L8727 |
| T4.4 | Standardise decorative dots at 6×6 across `PlChip`, thread rows, next-action, activity. | M7 | as listed |
| T4.5 | Introduce `<PlDivider />` uses in place of the inline `borderBottom: 1px solid PL_T.border` calls (opportunistic — do while touching the surrounding section). | P6 | as encountered |

### Explicitly deferred

- **Serif-monogram question** (`SERIF = "Instrument Serif"`) — cross-env decision, awaiting user pick.
- **All-10-tabs-visible-per-stage** — behavioural (visibility rule); out of UI-Supervisor scope.
- **"Happy Path Demo" • dot in the queue** — waiting on user cue; tiny.

---

## Verification

1. `npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic` passes.
2. Dev server on the assigned port (autoPort). Log in as `nanditha.p@bimakavach.com` / `pass-word`, pick BimaPlacement.
3. Screen sweep — confirm every screen title uses `PageHead` (T1.1). Confirm Inbox + Manual share one underline-tab component (T2.4). Confirm no `outline-none` field loses its focus indicator (T1.5).
4. Case-workspace sweep — walk RFQ → Insurers → Threads → Quotes → QCR → Negotiation → Activity. Confirm rail is on the right and Quotes/QCR breathe (T1.2). Confirm CURRENT ACTION no longer appears twice (T1.3).
5. Modal sweep — open every modal listed. Confirm one shell, one footer discipline, one label idiom, one search shell (T2.1, T2.5, T1.6, T1.7).
6. Behavioural walk-through per `CHANGE-PROTOCOL.md` — full case lifecycle must render identically to `main` (UI-only work).
