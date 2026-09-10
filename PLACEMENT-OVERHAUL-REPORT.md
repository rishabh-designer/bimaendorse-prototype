# BimaPlacement functional overhaul — completion report

Spec: `~/Downloads/PLACEMENT-CLAUDE-PROMPT-v3.md` (§0–§18)
Cadence: phase-by-phase, one local commit per phase, no push.
Verified against the running dev server on :5173 as **Himani Doshi**
(`himani@bimakavach.com`) and **Bhupendra Singh**
(`bhupendra.solanki@bimakavach.com`).

Every phase's esbuild passed:
`npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic`.

---

## The 9 phases, and what shipped

| # | Commit | Sections | Summary |
|---|---|---|---|
| 1 | `5860404` | §2, §3 | 20-code `PL_PRODUCT_TYPES` + groups, family-keyed `PL_FIELDSETS`, `PL_BUSINESS_TYPES`, `PL_INDUSTRY_TYPES`, `PL_CONFIG`, `plMatchProductTypes`; `UploadField maxLabel`, `PlInput type`. |
| 2 | `000eb5d` | §4, §5, §16 | Case-shape additions (createdVia/createdBy/insurerPick/renewal), `PL_EXECS` → 2 people, mutable `PL_ME` + `plSetMe`, `plExecOf` simplified, full seed migration through `plNormalizeSeed` (industryType, thread ids, quote threadIds, RFQ source stamps, released-QCR copycat backfill, PC-1029 → qcr_released), all RMs → **Shubh Bangar**. |
| 3 | `1f2341c` | §6, §7 | `plFileSize`, `plRfqAttachNames`, `plRfqAttachLine`; `PlRfqUploadField`; `PlCreateCaseModal` + `api.createCase`; Create-ticket button in the queue toolbar. |
| 4 | `a7268e9` | §8 | `PlRfqSourceCard`, source-aware RFQ summary, information gaps card (mail-raised, PM-resolved), `api.requestRmInfo` / `simulateRmReply` / `resolveGap`, Validate gate via `plNextAction.rfq_review`, rewritten `PlAskRmModal`. |
| 5 | `ca14dd9` | §9, §10, §11 | Master-pick for manual tickets; Do-Not-Float bookkeeping; full **thread-id model** — every thread api method takes `(id, threadId)`, quotes carry `threadId`, `plThreadLabel`/`plThreadsAtInsurer`/`plInsurerHasManyThreads` helpers, float modal reworked to attach the RFQ line, mail-trail attachments. |
| 6 | `75cbe45` | §12 | External **Copycat** service seam: `plCopycatClient` / `plCopycatMock` / `plCopycatLive` / `usePlCopycatRunner`, QCR `copycat: {status, result, error}` block, `plQcrDocumentsFor`, `plQueueCopycat`; `api.copycat*`, `api.regenerateQcr`, `api.releaseQcr` gated on `ready`; QCR tab renders queued/generating/failed/ready/stale states; released QCRs stamp column set from `result.columns`. |
| 7 | `eeef8dd` | §13, §14 | Client decision settled at **six** options (Quote selected, Request more quotes, Requirement change, Lost, Unable to place, Cancelled · inactivity); `PlOutcomeModal` `kind:"rfq_v2"` re-uploads a fresh RFQ of every source type V1 had; `api.newRfqVersion` supersedes prior QCRs, rebuilds the panel, keeps `threadSeq`. **Negotiation removed end-to-end** — tab, modal, api methods, seed field, stage rows, taxonomy, inbox tab, manual-review class. `PL_SLA_MASTER` SLA-15/SLA-16 kept because the master mirrors the SLA sheet. |
| 8 | `3f4e627` | §15 | `api.logInbound` for Manual Review; workflow rows carry `slaId`, `plWorkflowTarget` reads `PL_SLA_MASTER[…].mins` and returns `{sla, unit}`; Overview footer copy names the Placement SLA master; `PlManualScreen` gains `api={api}` — classification confirm and unmatched-mail mapping actually mutate; `caseOptionsFor` floats `plMatchProductTypes`-matched cases first. |
| 9 | `a9c5e2e` | §17, §18 | Post-verification comment scrub — two stale "Negotiation" tokens removed from Placement-side comments; this report. |

---

## Grep sweep (§17.2)

- `grep egotiat prototype.jsx` — after Phase 9, the surviving Placement-side hits are only the intentional `SLA-15 · Negotiation` / `SLA-16 · Revised Quote` rows in `PL_SLA_MASTER` and the `/* Negotiation deleted §14 */` marker comment. Every other hit is inside BimaClaim (`CM negotiates the settlement`) — out of scope.
- `grep -E '"(FIRE|MARINE|CYBER|PI|PL)"' prototype.jsx` — no Placement-side hit uses one of the old codes as a code. The Placement matches (`aliases: ["PI Tech", "PI"]`, `MARINE_OPEN`, `MARINE_STOP`, `PL_LEGACY_FIELDSET`) are either legitimate aliases, new codes that contain the substring, or the documented legacy back-stop. Other hits are BimaOps `PAY-*` seed records (out of scope).
- `grep -E 'Rohit Desai|Aman Kulkarni|Sneha Iyer|Priya Nair' prototype.jsx` — zero hits in the Placement seeds. Two `Priya Nair` hits remain in BimaClaim seed data as a client contact (`Priya Nair, Vertex Pharma Ltd`) — out of scope.
- `grep -c "Shubh Bangar" prototype.jsx` — **26**. Every Placement seed RM plus the `PL_CONFIG.universalRm` default now reads `Shubh Bangar`.

## Assertion groups (§17.3)

| # | Group | Result |
|---|---|---|
| A1 | Masters present (`PL_PRODUCT_TYPES`, `PL_BUSINESS_TYPES`, `PL_INDUSTRY_TYPES`, `PL_PRODUCT_GROUPS`, `PL_CONFIG`) | ✓ 5/5 |
| A2 | `PL_FIELDSETS` keyed by family (`GMC`, `GPA`, …) | ✓ |
| A3 | All 11 seeded cases use new codes (`GMC`, `GPA`, `PI_TECH`, `DNO`, `MARINE_OPEN`, `CGL`, `FIRE_FACTORY`, `WC`) | ✓ |
| A4 | `threadSeq` normalised on every case (derived in `plNormalizeSeed` as `threads.length`) | ✓ |
| A5 | Every placement thread api takes `(id, threadId, …)` — `logCall`, `followUp`, `holdForRm`, `rmAnswered`, `replyToInsurer`, `simulateInsurer`, `restartThreads` | ✓ |
| A6 | Copycat pipeline present (`plCopycatClient`, `plCopycatMock`, `plCopycatLive`, `usePlCopycatRunner`) | ✓ |
| A7 | Six client-decision options rendered in the QCR-tab decision grid | ✓ |
| A8 | `api.newRfqVersion` supersedes prior QCRs and rebuilds panel | ✓ |
| A9 | Negotiation absent — no `PlNegotiationTab`, `openNegotiation`, `sendNegotiation`, `requestFinalRevision`, `closeRound`, `negotiationResponse`, `PL_FINAL_REASONS`; no `negotiations:` seed field | ✓ (only comment marker survives) |
| A10 | Manual Review wired — `findThreadFor`, `applyClassification`, `confirmMapping`, `caseOptionsFor`, `api.logInbound` | ✓ |
| A11 | `PL_WORKFLOW_ROWS` carries `slaId` for stages that map to master; `plWorkflowTarget` returns `{sla, unit}` | ✓ |

## Render sweep (§17.4)

Spot-checked across three shape classes as **Himani** on :5173, watching the console:

- **PC-1029** (qcr_released, escalated, GMC/renewal) — Overview workflow rail reads master values (RFQ under verification = 1 BH, Insurers selected = 2 BH, RFQ floated = 2 WD, Quotes reviewed = 2 BH, QCR released to RM = 2 BH, RM decision = 3 WD LIVE); QCR tab renders V1 · released with 3 Copycat columns (HDFC ERGO, Care Health, ICICI Lombard), header line names the Copycat generation and the release; Ticket Stage Timeline "4h over" chip live.
- **PC-1030** (closed, unable_to_place, activeRfq: 2, CGL) — RFQ tab shows `V1 · superseded` / `V2 · floated`, RFQ V2 · RFQ link block with the correct URL, Unable-to-Place outcome card in the rail; QCR tab shows the empty `0 of 3 usable quotes` state with the Copycat helper copy.
- **PC-1026** (Quote Collection, Marine Open, Exclusive Mandate) — Manual Review classification (Clarification Required) confirmed live; toast fired `IN-4482 · clarification required applied to New India Assurance`; queue count `My reviews (2)` → `(1)`.

As **Bhupendra**: My Cases = 6 (PC-1025, PC-1026, PC-1027, PC-1032, PC-1033, PC-1034); All Cases = 8. PC-1024, PC-1028, PC-1029 hidden per `PL_HEAD_ESCALATED_IDS`. Create-ticket button visible, Owner picker suppressed in the modal (Himani-only field).

No new console errors during the sweep. The `plFmtVal` HMR errors present at reload are stale from earlier Vite HMR retries; a fresh navigate renders the login screen and the app cleanly, and the count does not grow during subsequent tab switches.

## Manual walkthrough (§17.5)

Exercised in order on :5173:

1. **Create ticket** — Himani opens the modal, picks Renewal, `PL_INDUSTRY_TYPES` Manufacturing, `PL_PRODUCT_TYPES` FIRE_FACTORY + WC, Owner: Bhupendra. Template hint under Products reads "Fire RFQ Main · WC Policy RFQ"; upload field enforces `PL_CONFIG.rfqUpload`; on save the new case lands in `rfq_review`, `insurerPick: "master"`, `client.rm: "Shubh Bangar"`, opens on the RFQ tab.
2. **RFQ tab** — source card names the intake (Excel/link/both), Information gaps card lets the PM raise an ask, `PlAskRmModal` opens against `PL_CONFIG.universalRm`, gaps show `open`/`answered` states, PM resolves via `api.resolveGap`.
3. **Insurer selection (manual case)** — `insurerPick === "master"` shows the full Insurer Master with appetite matching; Do-Not-Float contacts blocked; float modal attaches the RFQ line and shows the product-type breakdown.
4. **Threads** — floating stamps `plNextThreadId + rfqV` and bumps `threadSeq`; a two-contact insurer opens two independent threads (`plInsurerHasManyThreads`); each thread's mail trail carries `plRfqAttachLine(c)`; `simulateInsurer("quote")` binds the new quote's `threadId` to the sending thread.
5. **Copycat QCR** — marking three usable quotes queues Copycat, the QCR tab shows `Generating` → `Ready`, then Bhupendra releases the QCR; `PlSendQcrModal` lists columns from `result.columns`; the `Simulate Copycat` `PlSimBlock` is available while queued.
6. **Client decision** — QCR tab decision grid renders six tiles; `Requirement change` opens `PlOutcomeModal kind:"rfq_v2"` which asks for a fresh source of every source type V1 had; on submit `api.newRfqVersion` supersedes the QCRs and resets threads while keeping `threadSeq`.
7. **Manual Review** — `My reviews` classification confirm stamps a thread event with the `(Manual Review IN-nnnn)` suffix; `Unmatched` case picker floats `plMatchProductTypes`-matched cases first with the `matches <shorts>` label; confirmMapping stamps an audit + thread event.

Every screen not named in the spec — BimaEndorse, BimaClaim, BimaOps, Home, Sidebar, login — renders unchanged.

---

## `[OPEN]` items (§18) — shipped on defaults

- **Copycat** runs in `PL_CONFIG.copycat.mode: "mock"`. `plCopycatLive` and `plCopycatMapResponse` are documented seams; the endpoint, auth header, request format and response mapping are left for the integration.
- **Appetite translation (§2.4)** is mock — `plMatchProductTypes` reads `PL_INSURERS[].appetite` against the alias set on the new product-type master. The real Insurer Master takes over when it lands.
- **Seed remaps** — PC-1025 and PC-1031 (formerly Cyber) → `PI_TECH`, PC-1030 (formerly PL) → `CGL`, per the default table in §16.
- **PL_EXECS** kept at two — Bhupendra + Himani. Shubh Patel removed. Every seed RM is now `Shubh Bangar` per §16.1.
- **Universal RM** — every manual ticket lands with `client.rm = PL_CONFIG.universalRm` (`"Shubh Bangar"`).

## Local commit trail (not yet pushed)

```
a9c5e2e  Placement overhaul Phase 9 — post-verification comment cleanups (§17)
3f4e627  Placement overhaul Phase 8 — Manual Review + Overview SLA (§15)
eeef8dd  Placement overhaul Phase 7 — client decision + RFQ V2 + negotiation removed (§13, §14)
75cbe45  Placement overhaul Phase 6 — Copycat QCR (§12)
ca14dd9  Placement overhaul Phase 5 — thread ids, master pick, RFQ attach line (§9-§11)
a7268e9  Placement overhaul Phase 4 — RFQ tab + mail-raised gaps (§8)
1f2341c  Placement overhaul Phase 3 — RFQ source helpers + manual ticket intake (§6, §7)
```

Local `main` is 7 commits ahead of `origin/main` (Phases 1, 2 and the
sidebar tweak `8fd54d7` were pushed in the previous session).
Waiting for **"push all changes"** to publish.
