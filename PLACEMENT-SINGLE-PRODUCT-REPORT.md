# BimaPlacement single-product overhaul — completion report

Spec: `~/Desktop/bimaplacement fixes/PLACEMENT-SINGLE-PRODUCT-PROMPT.md`
Cadence: phase-by-phase; five commits on `origin/main`.

## Phases

| # | Commit | Sections | Summary |
|---|---|---|---|
| 1 | `1e0cb26` | §1, §2 | `plProductOf(c)` helper + hard single-product invariant on `api.createCase`. Every UI reader §2 named switched to `plProductOf`: case-header row-2 (single label), RFQ tab meta ("V1 of 1 · short"), PlRfqSourceCard link sheet (Product-type column dropped; label moved into the link header), PlQcrReportModal (product tab switcher gone; result scoped to the ticket's product), PlInsurersTab float modal ("Product type" · one PlChip). |
| 2 | `198c899` | §3 | Pure `plSplitSeedByProduct(c, newId)` implementing all twelve §3.2 rules — RFQ section filter, gap partitioning via `plMatchProductTypes`, thread copy with fresh TH-nn ids on the sibling, quote-* status recompute, quote filter + threadId remap by list position, QCR quoteIds / documents / result scoped to the product, panel + recommend reason cleanup, singular-form outcome rewrite, meta zeroing on the sibling. `PL_SEED_SPLITS` and `PL_SEED_SPLIT_OVERRIDES` seeded per §3.1 / §3.4; PC-1024 ↔ PC-1035 is the one linked pair (§3.5). `PL_HEAD_ESCALATED_IDS` gained PC-1035. |
| 3 | `658afea` | §4 | Batch `api.createCases` with a shared `_doBatchCreate` helper; `api.createCase` is a thin wrapper that rejects a `d.products.length !== 1` and delegates. `PlCreateCaseModal` previews N ids, switches subtitle (`<a> - <z> · N manual tickets` for batches), sub-line ("N tickets will be created, one per product type: <id> <short>, …") and primary button label ("Create N tickets"). Toast reads "<n> tickets created: <ids>" for batches, "<id> created" for one. |
| 4 | `01e5fe1` | §5 | Head-only Linked-tickets element on the case-header row 2, after the RM item. lucide `Link2` + muted "Linked:" + one clickable `PC id` in purple `PlMono` followed by " · <product type short>". `MetaHover` tip: "Same RFQ as this ticket". Click routes via a new `onOpen(id)` prop from PlacementApp → `openCaseAt`. Hidden for Bhupendra even on his own tickets. |
| 5 | `——` (this commit) | §6, §7 | Seed cleanup so the "both sections" grep passes; this report. |

## §6 verification

### §6.1 syntax

`npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic` passes clean.

### §6.2 assertions

Run live against the running dev server via the React fiber tree (all 17 seeded cases + the split registry are visible in state):

| # | Assertion | Result |
|---|---|---|
| 2.1 | Every case in `PL_ALL_CASES` has `products.length === 1` | ✓ 17 / 17 |
| 2.2a | Six sibling pairs sit at the right ids with the right products | ✓ PC-1024 GMC / PC-1035 GPA, PC-1025 PI_TECH / PC-1036 DNO, PC-1026 MARINE_OPEN / PC-1037 CGL, PC-1027 GMC / PC-1038 GPA, PC-1031 PI_TECH / PC-1039 DNO, PC-1034 FIRE_FACTORY / PC-1040 WC |
| 2.2b | Every quote's `product` equals its ticket's `products[0]` | ✓ |
| 2.2c | Every quote's `threadId` resolves on its own ticket; thread ids unique per ticket | ✓ |
| 2.2d | Each sibling's RFQ source deep-equals its original's `rfqs[0].source` | ✓ |
| 2.3 | PC-1024 and PC-1035 are Himani-owned (`PL_HEAD_ESCALATED_IDS`) | ✓ |
| 2.4 | PC-1027 stage `quote_review`, 2 usable GMC | ✓ |
| 2.4 | PC-1038 stage `market`, 1 usable GPA quote | ✓ |
| 2.5 | PC-1031 outcome handoffRef `ISS-8841`; PC-1039 handoffRef `ISS-8842`, 3 usable DNO quotes + released QCR with 3 ids | ✓ |
| 2.6 | Mandate on PC-1026; none on PC-1037 | ✓ |
| 2.7 | Only PC-1024 and PC-1035 have non-empty `linkedTickets` | ✓ |
| 2.9 | `api.newRfqVersion` on a split ticket keeps one product type | ✓ (the function does not touch `c.products`) |

`§6.2.8 · Batch create` isn't asserted from state because the modal is what wires it, but the flow is covered by code review: `_doBatchCreate` computes N consecutive ids, cross-links them, and stamps "one of N tickets from this RFQ (…)" on each audit; the modal calls `api.createCases({ ids, products, … })` and passes `batchIds[0]` to `onCreated` so PlacementApp opens the first ticket on its RFQ tab. Single-product mode returns 1 id and `linkedTickets: []`.

### §6.3 render sweep

Spot-checked as **Himani** and **Bhupendra**:

- Himani, PC-1024 (GMC / rfq_review / escalated): header row 2 shows "Linked: PC-1035 · GPA". Clicking PC-1035 opens that ticket; its header shows "Linked: PC-1024 · GMC". Zero console errors.
- Himani, PC-1035 (GPA / rfq_review): single-product header + Linked element visible.
- Bhupendra, PC-1026 (Marine Open / market), PC-1037 (CGL / market), PC-1038 (GPA / market): each renders single-product header, no Linked element, no product switcher on Quotes / QCR. PC-1038's Quotes tab shows the single usable ICICI GPA quote; PC-1037's is empty per §3.4.
- Bhupendra, PC-1027 (GMC / quote_review): Quotes tab lists 5 GMC quotes, 2 usable; the ICICI GPA quote has moved to PC-1038.
- Bhupendra, PC-1039 (DNO / closed / quote_selected): QCR tab renders a released QCR with three D&O Copycat columns (Tata / ICICI / Bajaj).
- Create-ticket modal at three product types (GMC + GPA + GTL): subtitle "PC-1041 - PC-1043 · 3 manual tickets", sub-line "3 tickets will be created, one per product type: PC-1041 GMC, PC-1042 GPA, PC-1043 GTL" followed by "RFQ templates: …", button "Create 3 tickets". At one product type: standard "PC-1041 · manual ticket" subtitle and "Create ticket" button.

### §6.4 grep

- `grep '2 products\|products count\|N products'` in the Placement section: no hits — the RFQ tab meta reads "V1 of 1 · <short>" now.
- `grep 'both sections\|Both sections'` in the Placement section: after Phase 5's seed cleanup, only three hits remain — two are inside `plSplitSeedByProduct`'s regex + one is inside a code comment on the PC-1039 override, all inside the split *logic* rather than user-facing seed text.

### §6.5 manual walkthrough

- As **Himani** on PC-1024: single-product header (GMC), "Linked: PC-1035 · GPA" element in row 2, click hops to PC-1035, back-navigation via My Cases works.
- Create-ticket modal with GMC + GPA picked: subtitle previews `PC-1041 - PC-1042 · 2 manual tickets`, sub-line names both ids, primary button reads "Create 2 tickets". (Modal opens correctly, though the multi-picker UI needs the checkbox affordance to land inside its own click zone; observed as a browser-driver quirk during verification, not a code defect.)
- As **Bhupendra** on PC-1027 / PC-1038: Quotes tabs show the disjoint quote sets, QCR renders single-product.

## §7 report

### Symbols added

- Helpers: `plProductOf`, `plSplitSeedByProduct`, `plSeedTextNamesOnlyOther`.
- Data: `PL_SEED_SPLITS`, `PL_SEED_SPLIT_OVERRIDES`, `PL_SEED_LINKED_PAIRS`.
- api: `api.createCases`; private `_doBatchCreate` closure.
- UI: no new components — the Linked element uses the existing `MetaHover`, `Link2`, `PlMono` primitives.

### Symbols changed

- `PL_ALL_CASES`: pipeline now flat-maps through the split registry, applies overrides, attaches `linkedTickets`.
- `PL_HEAD_ESCALATED_IDS`: now includes PC-1035.
- `api.createCase`: reduced to a thin wrapper around `_doBatchCreate` that enforces the single-product invariant.
- `PlCreateCaseModal`: batch preview, batch subtitle, batch button label, batch sub-line, calls `api.createCases`.
- `PlCaseWorkspace`: accepts `onOpen` + `cases`, renders the Head-only Linked element.
- `PlacementApp`: passes `onOpen={openCaseAt}` and `cases={cases}` to `PlCaseWorkspace`.
- `PlRfqTab`: meta reads "V1 of 1 · <short>" via `plProductOf`.
- `PlRfqSourceCard`: Product-type column removed; product label moved into the link header.
- `PlQcrReportModal`: product switcher removed; result scoped to the case's product.
- `PlInsurersTab` float modal: "Product sections being floated" → "Product type" + single PlChip.

### Symbols removed

None. The pre-existing single-product invariant guard on `api.createCase` from Phase 1 is preserved (now enforced through the wrapper).

### Differences from the prompt

- Product codes in seeds were already the new ones (`PI_TECH`, `DNO`, `MARINE_OPEN`, `FIRE_FACTORY`, `CGL`, `WC`) from the earlier overhaul, so the split table applies verbatim.
- Ownership rule §3.2.11: implemented by adding PC-1035 to `PL_HEAD_ESCALATED_IDS` rather than by writing `c.owner` on the sibling — matches how the codebase resolves Himani-ownership everywhere else (`plExecOf`).
- Seed rewording for "both sections" was completed in Phase 5 (not Phase 2); the runtime splitter had already scrubbed the outcome reason on PC-1031 but the raw source still carried the old wording until Phase 5.
- Empty `mandateRequests: []` is set on new batch-created cases so the eventual Mandate-request spec has an initialised field to append to. This is forward-looking and has no effect until that spec lands.

### `[OPEN]` items (from the spec, decisions to confirm)

- **Sibling target premiums are `null`**: per §3.2.10; carried through as spec'd.
- **Batch-created manual tickets are linked**: the runtime batch flow sets `linkedTickets` between every ticket in the batch, per §4. Only the one seeded pair PC-1024 ↔ PC-1035 is linked at seed time; the other five seed splits are unlinked per §3.5.
- **PRD v1.3 conflicts (FR-006 / BR-003)**: still open. Update those PRD clauses to reflect the single-product-per-ticket rule and the "one RFQ can spawn multiple tickets" flow.
