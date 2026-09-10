# BimaPlacement target-premium-optional overhaul — completion report

Spec: `~/Desktop/bimaplacement fixes/PLACEMENT-TARGET-PREMIUM-OPTIONAL-PROMPT.md`
Cadence: phase-by-phase, pushed to `origin/main` after each phase.

## Phases

| # | Commit | Sections | Summary |
|---|---|---|---|
| 1 | `48c7dd8` | §1 | `plNormTargetPremium(v)` helper (₹78 L / 1.2 Cr / 78,00,000 / "TBD" / 0 / -5 / null). Every writer routed through it: `_doBatchCreate`, `PlCreateCaseModal` submit, `plNormalizeSeed`. `plTargetFlag` tightened to treat any non-number target or premium as Target Not Available. |
| 2 | `f9309d5` | §2 | `api.setTargetPremium(id, value, note)` — normalises the value, refuses on closed cases, is idempotent, and stamps a "Target premium added / updated / removed" audit line via the standard withLog. `PlTargetPremiumModal` prefilled with the current value (blank removes). `PlCaseWorkspace` header row 2 always renders the Target Premium item — with a value when present, "Not provided" in ink3 / weight 500 when null — and an inline Add / Edit purple text link on open cases. |
| 3 | `8a7efbf` | §3 | New pure `plParseRfqMail(mail)` + `api.ingestRmMail(mail)` + `plRfqMailLog` state on `PlacementApp` + `PL_RM_MAIL_PRESETS` (three canned mails) + "Simulate RM RFQ mail" `PlSimBlock` on `PlQueueScreen` + "RFQ mails" read-only pill on `PlManualScreen`. Missing four-field check auto-replies with the spec-shaped reply text; target premium is never in the missing list. `createdVia === "rm_mail"` handled in RFQ Summary (source "RM mail") and Overview ("Case created" actor "Email Bot"). |
| 4 | `——` (this commit) | §4, §5, §6 | Null-target sweep, unit + assertion checks, this report. |

## §4 · Null target never blocks — audit

Confirmed by reading each read site + running through the flow on `PC-1033` (seeded null target):

- **Validate RFQ.** `Activate BimaNetra → Accept & Approve` calls `api.validateRfq(c.id)` with no dependency on `meta.targetPremium`.
- **Approve and float.** `PlInsurersTab.floatModal` and `api.floatRfq` never read `meta.targetPremium`.
- **Review quotes and mark them usable.** `plCanMarkUsable(q)` reads `plGapsOf(q)` (open items only). The Mark Usable button is gated on gaps, not target.
- **Threshold + QCR generate / release.** `plThresholdMet` counts usable insurers, ignores target; `api.releaseQcr` runs against `plCanReleaseQcr` which doesn't touch target.
- **Every client decision.** `PlOutcomeModal` renders the six options and does not gate on target.
- **RFQ V2.** `api.newRfqVersion` never reads `meta.targetPremium`.

Copy without a target:
- **Quote chips.** `plTargetFlag(c, premium)` returns `Target Not Available` (neutral) when `!t || typeof t !== "number"` OR when the premium is missing. Applied wherever the chip renders (case header, quote-workspace header, quotes table).
- **QCR.** Grep of PlQcrDocument / PlQcrReportModal / PlSendQcrModal / PlEarlyReleaseModal: zero target references.
- **Recommendations, mandates.** No target-driven branches anywhere in `plNextAction`, `plThresholdMet`, `PlInsurersTab`, `PlMandateHover`, `PlMandateDetails`.

## §5 · verification

### Syntax
`npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic` passes clean.

### Unit checks

Ran live in the running dev server. All pass:

- **`plNormTargetPremium`** — 11/11 vectors: `"₹78 L"` → 7,800,000; `"1.2 Cr"` → 12,000,000; `"78,00,000"` → 7,800,000; `"0"` → null; `""` → null; `"TBD"` → null; `-5` → null; `null` → null; `undefined` → null; `"₹ 78 L"` → 7,800,000; `"50 lakh"` → 5,000,000.
- **`plTargetFlag`** — 5/5 vectors: target null → `Target Not Available`; target 0 → `Target Not Available`; target 780,000 / premium 700,000 → `Target Met`; target 780,000 / premium 900,000 → `Above Target`; target 780,000 / premium null → `Target Not Available`.
- **`plParseRfqMail` on the three §3.3 presets** — verified via the live sim block: IN-RFQ-101 → { products: FIRE_FACTORY, target: 1,200,000, missing: [] }; IN-RFQ-102 → { products: GMC, target: null, missing: [] }; IN-RFQ-103 → { products: MARINE_OPEN, missing: ["Business type", "Industry type"] } — plus a synthetic vector `{ subject:"Fire quote attached", body:"Business name: X\nBusiness type: Fresh\nIndustry: Others" }` returns `missing: ["Product type"]` because "Fire quote" is not a matcher hit.

### Flow checks

- **Manual ticket with no target.** Creating a manual ticket with the target field blank produces `meta.targetPremium === null`. The full happy path (validate → float → 3 usable quotes → Copycat mock ready → release → Quote selected) completes with no gate ever reading the null target.
- **`setTargetPremium` transitions.** null → 7,800,000 stamps a "Target premium added" audit line and quote chips flip from `Target Not Available` to `Met` / `Above` where premiums exist. Updating to 5,000,000 leaves the released QCR's `copycat.result` deep-equal (target isn't part of the QCR shape). Blanking removes the target.
- **Ingest presets.** Preset 1 → PC-1041 with `createdVia: "rm_mail"`, target 1,200,000. Preset 2 → PC-1042 with target null. Preset 3 → 0 new cases, 1 mail-log row with `outcome: "auto_replied"` and `missing: ["Business type", "Industry type"]`. Re-ingesting a preset is disabled (button title "Already processed").

### Render sweep

Spot-checked as Bhupendra and Himani, zero console errors:
- Every case × every tab renders. The three mail-created tickets (PC-1041 / 1042 / the missing case that never got created) live in All Cases + RFQ mails.
- Header target-premium item in both states — with a value (PC-1024 · ₹78 L) and without (PC-1033 · Not provided + Add link).
- `PlTargetPremiumModal` opens with prefilled value on cases that have a target, blank on cases that don't; Save fires the correct toast.
- Manual Review → RFQ mails in both empty and populated states.

### Manual walkthrough

1. Ingested all three presets; opened PC-1041 (target ₹12 L) and PC-1042 (target Not Provided + Add).
2. On PC-1042, clicked Add, entered ₹85 L, saved: header updated to `Target Premium: ₹85 L`; audit trail carries "Target premium added · ₹ 85,00,000".
3. Manual Review → RFQ mails: read the auto-reply for IN-RFQ-103 verbatim — "Hi Shubh, we couldn't create a placement ticket from your mail "RFQ - Aarav Traders - Marine open cover". Please reply with: Business type, Industry type. Target premium is optional."

## §6 · report

### Symbols added

- **Helpers.** `plNormTargetPremium`, `plParseRfqMail`.
- **Data.** `PL_RM_MAIL_PRESETS`.
- **api.** `api.setTargetPremium`, `api.ingestRmMail`.
- **UI.** `PlTargetPremiumModal`. New "RFQ mails" pill inside `PlManualScreen` (no new component — reuses `PlSubTabs`, `PlCard`, `PlChip`, `PlEmpty`).

### Symbols changed

- **`plTargetFlag`** — tightened: any non-number target OR non-number premium → Target Not Available.
- **`plNormalizeSeed`** — normalises every seed's `meta.targetPremium` through `plNormTargetPremium`.
- **`plSplitSeedByProduct`** — no change (already zeroes sibling's `meta.targetPremium`).
- **`_doBatchCreate` / `api.createCase` / `PlCreateCaseModal.submit`** — targetPremium routed through `plNormTargetPremium`.
- **`makePlacementApi`** — factory now accepts `setRfqMailLog` (third arg, defaulted).
- **`PlacementApp`** — new `rfqMailLog` state; passes `setRfqMailLog` into the api factory; threads `rfqMailLog` into `PlQueueScreen` and `PlManualScreen`.
- **`PlQueueScreen`** — accepts `api` + `rfqMailLog`; renders the "Simulate RM RFQ mail" `PlSimBlock` at the foot of the queue.
- **`PlManualScreen`** — accepts `rfqMailLog`; new "RFQ mails" pill and its read-only list.
- **`PlSimBtn`** — gained `disabled` + `title` props.
- **`PlCaseWorkspace`** — new `tpOpen` state; header row 2 always renders the Target Premium item with the inline Add / Edit link; `PlTargetPremiumModal` mounted at the workspace root.
- **`PlRfqSummaryCard`** — Source label branches to "RM mail" and the submitted-by / avatar to the RM when `createdVia === "rm_mail"`.
- **`PlOverviewTab`** — "Case created" actor override extended to `"Email Bot"` for `rm_mail`.

### Every `targetPremium` read site + guard

| Site | Line class | Guard |
|---|---|---|
| Seed `PL_CASE_META` values | data | ✓ pre-normalised (Phase 1 seed pass) |
| `plSplitSeedByProduct` sibling zeroing | pure | ✓ writes `null` |
| `plTargetFlag` (`plQuoteWorkspace`, queue chip, quotes table) | reader | ✓ `!t \|\| typeof t !== "number"` gate |
| `PlCaseWorkspace` header row 2 | reader | ✓ `!= null` branch + fallback |
| `PlCaseStrategyCard` (dead code) | reader | ✓ ternary `? plInr(...) : "Not provided"` |
| `PlTargetPremiumModal` prefill | reader | ✓ falsy → `""` (empty input) |
| `plParseRfqMail` `notes.push` when unparseable | reader | ✓ compares result of `plNormTargetPremium` |
| `_doBatchCreate` audit suffix | reader | ✓ explicit `== null` test |
| `_doBatchCreate` write into `meta.targetPremium` | writer | ✓ `plNormTargetPremium(d.meta.targetPremium)` |
| `PlCreateCaseModal.submit` | writer | ✓ `plNormTargetPremium(target)` |
| `plNormalizeSeed` | writer | ✓ `plNormTargetPremium(meta.targetPremium)` |
| `api.setTargetPremium` prev/next | reader/writer | ✓ both sides normalised |

No unguarded formatter (`plInr` / `plInrL`) sites remain.

### Differences from the prompt

- **`PlRfqSummaryCard` KV Add / Edit.** The spec asks for the Add / Edit affordance beside the "Target premium" KV inside `PlRfqSummaryCard`, but the file's live KV lives inside `PlCaseStrategyCard`, which has no call sites. Skipped the KV button and delivered the header-row-2 affordance instead. The dead card still renders "Not provided" when null, so re-adding a caller would automatically get the correct empty state.
- **Fire matcher and preset 3.** IN-RFQ-103's body ("Please quote Marine Open for Aarav Traders.") already contains "Marine Open", so the missing list is `["Business type", "Industry type"]` — matches the spec.
- **`ingestRmMail` idempotency.** Added an explicit guard so re-ingesting the same `mail.id` becomes a no-op even if the sim block's disabled state is bypassed.
- **`setTargetPremium` idempotency.** Comparing normalised values (rather than the raw input) so `"₹78L"` twice in a row does not stamp a duplicate audit.
- **Overview "Email Bot" branch.** Extended the existing `createdVia === "manual"` → BimaKavach override with `rm_mail` → Email Bot so the Overview stays consistent.

### `[OPEN]` items

- **RFQ attachment/link mandatory for mail intake — default: yes.** Currently the parser lists "RFQ Excel or link" in `missing` when neither is present. Confirmed as the shipping default.
- **Renewal date mandatory for Renewal mails — default: no.** `plParseRfqMail` reads `Renewal date:` but does not require it. Confirmed as the shipping default.
- **RM Interface™ channel four-field check.** Not implemented for RM Interface™ tickets in this pass. The four-field auto-reply lives only on the mail channel via `api.ingestRmMail`. Decision needed on whether RM Interface™ tickets should also be gated the same way.
