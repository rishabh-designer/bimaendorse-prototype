# BimaEndorse — Refund Logic

> **Scope.** Everything specific to a refund endorsement — how it's classified, how it moves through the stages, where the SM interacts with it, and what the data model looks like. Complements [BIMAENDORSE-PRD-SOURCE.md](BIMAENDORSE-PRD-SOURCE.md); doesn't duplicate the shared model.
>
> **Anchor ticket in the prototype.** `END-1069` — Acme Manufacturing Pvt Ltd, FIRE/2026/00812, ICICI Lombard, type `Refund - Excess Premium`. Seeded at `Awaiting Refund Details` so the whole loop demos from a fresh session.
>
> **Sync.** Written against `main` at `7e475de`.

---

## 1. What counts as a refund ticket

A ticket is a refund case when its endorsement **type carries `refund: true`** in the type master. The classification (`t.kind`) stays `Financial`. Refund is not a separate `kind`; it's a subtype of Financial where the money direction is *out* instead of *in*.

```js
// TYPES master (in prototype.jsx)
"Refund - Excess Premium":     { kind: "Financial", refund: true, fields: [], docs: ["Cancelled cheque", "Payment screenshot"] },
"Policy Cancellation":         { kind: "Financial", refund: true, fields: ["Reason for cancellation"], docs: ["Cancelled cheque"] },
"Policy Cancellation + Refund":{ kind: "Financial", refund: true, fields: ["Reason for cancellation"], docs: ["Cancelled cheque"] },
"Employee / Headcount Deletion": { kind: "Financial", refund: true, fields: ["Count of employees", "Skilled and unskilled split"], docs: [] },
"Asset Deletion":              { kind: "Financial", refund: true, fields: ["Asset category / type", "Value of asset"], docs: [] },

// Runtime check
const isRefund = (t) => !!TYPES[t.type]?.refund;
```

### 1.1 Why derive from type, not store on ticket
- Change Type (pre-Submission) may flip a ticket into or out of refund. Deriving keeps the two in sync automatically.
- Reports group by kind (`Financial | Non-Financial`); refund is a filter, not a bucket.
- The header pill still reads "Refund" thanks to `kindOf(t)` — display-only.

### 1.2 What "refund" means in this env
- The insurer owes the client money (return of premium).
- The endorsement copy still needs to travel: refund + copy are two separate deliverables that both must land before the ticket closes.
- Money moves outside the SLA clock — SLA-12 measures the insurer's response with the refund figure, not the actual credit hitting the bank.

---

## 2. Stage flow

Refund tickets get their **own 7-stage sequence**, distinct from the 9-stage regular Financial flow. `seqOf(t)` returns it when `isRefund(t)` is true.

```
New / Unassigned          SLA-01,  1 Min,  system
Under Verification        SLA-02,  4 BH,   Servicing Executive
Submitted to Insurer      SLA-05,  1 WD,   Insurer
Awaiting Refund Details   SLA-12,  2 WD,   Insurer            ← refund-only leg
Awaiting Endorsement Copy SLA-09,  3 WD,   Insurer
Copy Received             SLA-11,  1 BH,   Servicing Executive
Closed                    —        —       —
```

The regular Financial legs (`Awaiting Quote`, `Awaiting Payment Link`, `Awaiting Payment`) are skipped — no premium is being collected, so there's no quote and no payment link to generate.

### 2.1 PhaseBar

Refund tickets show a dedicated **Refund** phase between Insurer and Ticket Closure:

```
Ticket Intake · Verification · Insurer · Refund · Ticket Closure
```

`PHASES` includes an entry `{ label: "Refund", stages: ["Awaiting Refund Details"] }` that filters in only for refund tickets (its stage isn't in a non-refund `seq`, so `phasesOf(t)` drops it).

### 2.2 What changes at each stage

| Stage | Who acts | Action | Advances to |
|---|---|---|---|
| Under Verification | SE | Verify & submit | Submitted to Insurer |
| Submitted to Insurer | Insurer + SE | Insurer sends refund figure via mail; SE logs it | Awaiting Refund Details |
| **Awaiting Refund Details** | Insurer | Refund amount confirmed | *(stays here until client consent)* |
| Awaiting Refund Details | Client (via BimaKendra) | Accept / decline | Awaiting Endorsement Copy (accept) OR halt (decline) |
| Awaiting Endorsement Copy | Insurer | Credit the refund + share UTR + endorsement copy | Copy Received |
| Copy Received | SE | Pass QC + send to customer (**does not close**) | *(stays at Copy Received)* |
| Copy Received | Client (via BimaKendra) | Confirm receipt | Closed |

Note the two "stays here" cases — the ticket stops on the stage but the internal `t.refund.step` progresses via sim buttons. See §5.

---

## 3. Ticket state — `t.refund`

Every mutation on the refund flow patches `t.refund`. The object grows as the flow moves; nothing is deleted along the way.

```jsonc
t.refund = {
  // Filled at "Insurer confirms refund" (still at Awaiting Refund Details)
  "amount": 18450,
  "insurerRef": "ICL-END-99213",
  "confirmedOn": "5 Sep 2026",
  "insurerAt": 0,

  // Filled at "Client accepts / rejects"
  "clientAccept": true,          // true | false | null (not asked yet)
  "consentAt": 0,
  "step": null,                  // set to "rejected" only when client declines

  // Filled at "Insurer sends UTR + copy" (paired with attachCopy)
  "utr": "HDFC260908A991",
  "paymentDate": "8 Sep 2026",
  "endoCopyFile": "endorsement_FIRE_2026_00812.pdf",
  "paidAt": 0,

  // Filled at "Client confirms" (paired with advance → Closed)
  "clientConfirmed": true,
  "confirmedAt": 0
}
```

### 3.1 Derived UI step
The Refund tab renders its sub-sections off a derived `step`, not off a stored one:

```js
const derivedStep =
    t.stage === "Closed" ? "closed"
  : t.stage === "Copy Received" && (t.sends || []).length ? "confirm"    // QC done + sent
  : t.stage === "Copy Received"                        ? "qc"            // copy on file, not QC'd yet
  : t.stage === "Awaiting Endorsement Copy"            ? "payment"        // waiting on UTR
  : r.amount                                           ? "consent"        // amount in, awaiting client
  :                                                       "insurer";      // waiting on insurer's figure
const step = r.step === "rejected" ? "rejected" : derivedStep;
```

This means the Refund tab is always in sync with `t.stage` — no risk of the tab thinking the ticket is at step 3 while stage is still at step 1.

---

## 4. Handlers

Two handlers do the actual mutation. Everything else in the refund UI composes these:

### 4.1 `refundAdvance(id, refundPatch, ticketPatch, note)`
Merges into `t.refund`, optionally patches ticket fields, appends `history[]`, sets `touched: true`.

```js
const refundAdvance = (id, refundPatch, ticketPatch, note) => {
  setTickets((ts) => ts.map((t) => {
    if (t.id !== id) return t;
    const refund = { ...(t.refund || {}), ...refundPatch };
    const history = note ? [...t.history, { text: note, by: t.owner, at: 0 }] : t.history;
    return { ...t, ...(ticketPatch || {}), refund, lastAction: 0, touched: true, history };
  }));
  if (note) flash(note);
};
```

### 4.2 `attachCopy(id, opts)`
Existing handler shared with the non-refund flow. On refund, it's called from `simPayment` so:
- Sets a real `t.endo` record (not just `t.refund.endoCopyFile`) so `endoOf(t)` returns the copy and Pass QC on Overview unlocks.
- Advances `Awaiting Endorsement Copy → Copy Received` in the same call.

```js
onAttachCopy(t.id, { file: `endorsement_${t.policy.replace(/\//g, "_")}.pdf` });
```

### 4.3 Why not one handler
`refundAdvance` can't own the stage transition because it doesn't know about `FIN_ON_ENTER` (which resets `t.endo` on entry to Awaiting Endorsement Copy). Composing the two — `refundAdvance` for refund state, `advance` or `attachCopy` for stage — keeps the money flow and the ticket lifecycle honest.

---

## 5. Sim ladder

Every refund transition has a **Simulate** button that stands in for the external party until BimaKendra + the mail bot are wired. Both surfaces (Refund tab and Next Action card) render the same buttons, wired to the same handlers, so either surface can drive the ticket end to end.

### 5.1 The five sims

| Sim button | Visible when | Effect |
|---|---|---|
| `Simulate: Insurer confirms refund` | Refund tab step 1 / Next Action card at Awaiting Refund Details with no `r.amount` | `refundAdvance({ amount: 18450, insurerRef: "ICL-END-99213", confirmedOn: "5 Sep 2026" })` — no stage change |
| `Simulate: Client Accepts` | Refund tab step 2 / Next Action card at Awaiting Refund Details with `r.amount` | `refundAdvance({ clientAccept: true })` + `advance()` → Awaiting Endorsement Copy |
| `Simulate: Client Rejects` | Refund tab step 2 | `refundAdvance({ step: "rejected", clientAccept: false })` — no stage change; flow halts |
| `Simulate: Insurer sends UTR + copy` | Refund tab step 3 / Next Action card at Awaiting Endorsement Copy | `refundAdvance({ utr, paymentDate, endoCopyFile })` + `attachCopy({ file })` → Copy Received |
| `Simulate: Client Confirms` | Refund tab step 5 / Next Action card at Copy Received with `qcDone && sends.length` | `refundAdvance({ clientConfirmed: true })` + `advance()` → Closed |

### 5.2 Pass QC is not a sim
`Pass QC` on Overview at Copy Received is the SE's real action. It:
- Sets `t.qcPassed = true` (`passQc`)
- Sends the copy to the client (`sendCopy`)
- **Does not** call `doAdvance()` when `isRefund(t)` — closure waits for Client Confirms.

The button hides itself once `qcDone && sends.length` on a refund ticket, and the Next Action card swaps in `Simulate: Client Confirms` to take over the last mile.

---

## 6. UI split

Three surfaces carry refund content, each with a different job:

### 6.1 Overview tab

Shows a **Refund details** section between Captured at Ticket Intake and Endorsement copy, once `t.refund.amount` exists:

```
Refund amount       Insurer reference       Confirmed on
₹18,450             ICL-END-99213           5 Sep 2026
UTR / txn reference Payment date
HDFC260908A991      8 Sep 2026
```

Section chip flips:
- `confirmed` (amber) once `r.amount` exists
- `credited` (green) once `r.utr` exists

### 6.2 Refund & Payment tab

Gated: appears only for `isRefund(t)`, disabled until `atOrPast(t, "Awaiting Refund Details")`. Tooltip on the disabled tab: "The refund flow opens once the ticket is submitted and the insurer starts working on the refund details."

Five sub-sections, each rendered based on `derivedStep`:
1. Refund details from insurer
2. Client consent
3. Payment & endorsement copy
4. **QC on Overview** — no controls here; a "Go to Overview to QC" button switches tabs so the SE eyeballs the endorsement copy in context.
5. Client confirmation

Rejected path: shows a persistent red "Client declined the refund" note at the top and a secondary "Reopen for consent" button on the consent section.

### 6.3 Next Action card

Always visible in the left panel. On refund tickets:

| `t.stage` + state | Copy | Primary control |
|---|---|---|
| Awaiting Refund Details, no `r.amount` | "Insurer owes the refund figure. Log it in." | `Simulate: Insurer confirms refund` |
| Awaiting Refund Details, `r.amount` in | "Insurer owes the refund figure. Log it in." | `Simulate: Client Accepts` (with a secondary `Simulate: Client Rejects` on the Refund tab only) |
| Awaiting Endorsement Copy | "Payment done. Simulate the copy arriving." | `Simulate: Insurer sends UTR + copy` |
| Copy Received, not QC'd | "Copy is in. Pass QC to send to client and close." | `Pass QC` (Overview action; the Confirm Action modal switches to Overview first) |
| Copy Received, `qcDone && sends.length` | "Copy passed QC and sent to Acme Manufacturing Pvt Ltd. Awaiting their confirmation on the portal." | `Simulate: Client Confirms` |

### 6.4 Tab red-dot
`Refund & Payment` lights the red dot whenever the ticket's next primary action lives on that tab (per `NEXT_ACTION_TAB[t.stage] === "refund"`). Applies at Awaiting Refund Details. Overview lights up at Copy Received (Pass QC).

---

## 7. Client Channel — insurer requests still apply

Refund tickets share the standard Client Channel model: the insurer can raise a mid-flight document/detail request through the bot, and the SE answers via one of the two paths (details on file → `answered_by_sm`; details with client → `forwarded_to_client`). See [BIMAENDORSE-PRD-SOURCE.md §14](BIMAENDORSE-PRD-SOURCE.md#14-client-channel--insurer-requests).

Nothing about the insurer-request flow is refund-specific; the same `Choose document` drawer and `Ask client for this document` fallback work here.

---

## 8. Documents

Every refund ticket needs the refund docs collected at intake:

| Doc | Refund types that require it | Blocks |
|---|---|---|
| Cancelled cheque | All 3 explicit refund types | Insurer submission (Awaiting Refund Details won't process without a valid beneficiary account) |
| Payment screenshot | Refund - Excess Premium | Same |

The **endorsement copy** is delivered by the insurer as part of `Simulate: Insurer sends UTR + copy`. Uses the same file convention (`endorsement_<policy>.pdf`) as regular financial tickets.

Both the cancelled cheque and the endorsement copy carry bank details — visible to the assigned SE and the Endorsements Head only. (Prototype does not enforce ACL yet; production will.)

---

## 9. Copy conventions specific to refund

- **Amount** — always `₹18,450` style with `money(n)` helper (`toLocaleString("en-IN")`). No decimal padding unless the amount actually has paise.
- **UTR** — `HDFC260908A991` style; alphanumeric, no separators.
- **Payment date / Confirmed on** — `8 Sep 2026` style; short month, no leading zero on day.
- **Stage label** — `Awaiting refund details` in the master; the header pill capitalises to `Awaiting Refund Details` via the shared indicator.
- **Amount confirmed vs credited chip** — never mix. `confirmed` = insurer said the number. `credited` = money moved.
- **Refund vs Return-Premium** — the pill and UI say **Refund**. The word "Return-Premium" is deprecated in this env; use it only when quoting the older PRD or an insurer's master.

---

## 10. Handler wiring — call graph

```
                       ┌───── Refund & Payment tab
                       │             │
                       │       simInsurer ──────► onRefund(id, { amount, insurerRef, confirmedOn })
                       │       simAccept  ──────► onRefund(id, { clientAccept: true })
                       │                    └──► onAdvance(id, "Client consent recorded…")
                       │       simReject  ──────► onRefund(id, { step: "rejected", clientAccept: false })
                       │       simPayment ──────► onRefund(id, { utr, paymentDate, endoCopyFile })
                       │                    └──► onAttachCopy(id, { file })  ── sets t.endo, advances stage
                       │       simClientConfirm ─► onRefund(id, { clientConfirmed: true })
                       │                       └► onAdvance(id, "Client confirmed…")  ── → Closed
                       │
Ticket detail ────────┼───── Next Action card (simulate slot)
                       │        same five sims, same handlers
                       │
                       └───── Overview (real actions)
                                Pass QC → onQc + onSendCopy
                                            ↑
                                        (no onAdvance on refund tickets)
```

Sub-agents (in code):
- `onRefund` = `refundAdvance` on EndorseApp.
- `onAdvance` = the shared `advance` handler (uses `nextOf(t)` which walks the refund sequence).
- `onAttachCopy` = the shared `attachCopy` handler (plants `t.endo`, advances Awaiting Endorsement Copy → Copy Received in one setState).

---

## 11. Edge cases

1. **Client declines the refund** (`Simulate: Client Rejects`) — `t.refund.step = "rejected"`. The Refund tab shows a red "Client declined" note at the top and a "Reopen for consent" button (loops back to step 2 with `clientAccept: null`). No stage change. Next Action card falls back to a neutral "Waiting on insurer" message; there's nothing on the SE's desk. Escalation policy: not modelled — waits for the SM to reassign or manually cancel via the standard Cancel path.
2. **Insurer credits less than confirmed** (`r.utr && amountSettled !== r.amount`) — panel shows both figures with a delta, reveals a `Mismatch reason` textarea, blocks Save until filled, writes to audit. (Same behaviour as the Financial payment-mismatch pattern in §16.1 of the main PRD.)
3. **Endorsement copy arrives before settlement** — currently blocked by sequence (`simPayment` bundles them). Open question in PRD §18.
4. **Insurer never credits** — SLA-09 escalates to Esc-3. No further chase after that; needs a parked state. Open.
5. **Refund rejected after credit already fired** (impossible in prototype, possible in prod) — recorded on audit only. Reversal is out of scope for this env; would need a `disputed` sub-state.
6. **Beneficiary last-4 mismatch on cancelled cheque** — warn, allow override with audited reason. Not modelled in prototype.
7. **Copy is on file but Pass QC never runs** — Refund tab step 4 stays at "QC on Overview" and offers the tab-switch button. The Next Action card also carries Pass QC. Both stay live until the SE actually passes QC.
8. **Client Confirms fires without QC done** — impossible; the sim button only appears when `qcDone && sends.length`.

---

## 12. What's not implemented (yet)

- **BimaKendra portal** — real client accept / reject / confirm come through here in prod. Every "client action" in this env is a sim button.
- **Bank-details visibility ACL** — cancelled cheque and endorsement copy are visible to everyone with ticket access; production will limit to the assigned SE + Service Head.
- **Reconciliation** — the prototype records `r.utr` but doesn't reconcile against the insurer's bank feed.
- **Parked state after Esc-3 exhaustion** — insurer-owned stages currently escalate three times then stop. Refund tickets that stall past Esc-3 need a formal parked bucket.
- **Withdrawal semantics** — refund tickets share the standard Withdraw flow. If a client withdraws after `r.utr` is set, we currently mark Customer Withdrawn but leave the refund fields in place. Whether that's the right audit posture is open.
- **Change Type into or out of refund** — allowed pre-Submission by the shared `changeType` handler; refund-specific implications (re-intake of `Cancelled cheque` etc.) not yet enforced.

---

## Appendix — Anchor demo walk-through (END-1069)

1. **Fresh session** → login as Nanditha (`nanditha.p@bimakavach.com` / `pass-word`). END-1069 sits in All Open at `Awaiting Refund Details`, header pill reads **Refund**.
2. **Overview** — Ticket Workflow shows the 5 refund phases; Refund is amber (current). Refund details section is absent (no amount yet). Next Action card offers **Simulate ICICI Lombard confirming the refund**.
3. Click sim → refund details appear on Overview (₹18,450 · ICL-END-99213 · 5 Sep 2026, `confirmed` chip). Next Action card swaps to **Simulate: Client accepts the refund**.
4. Click sim → stage advances to Awaiting Endorsement Copy. Next Action becomes **Simulate ICICI Lombard sending UTR + copy**.
5. Click sim → `attachCopy` fires + `onRefund` writes UTR/paymentDate. Stage → Copy Received. Overview's Refund details section chip flips to `credited`, Endorsement copy tile appears with Pass QC + Send to customer buttons. Next Action becomes **Pass QC** (routed to Overview when clicked from any other tab via the Confirm Action modal).
6. Click Pass QC → Confirm Action modal opens on Overview; confirm. QC passes, copy is sent. Next Action swaps to **Simulate: Client Confirms**; the dead Pass QC button hides itself.
7. Click sim → stage advances to Closed. Refund tab step 6 (Closed) is now the current section with a green tick note "Refund settled and confirmed by the client. Ticket is closed."

_All five sim buttons also live on the Refund & Payment tab; either surface can drive the ticket end to end._
