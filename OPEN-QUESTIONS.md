# Open questions

Unresolved decisions. If a request touches one of these, say so before acting — several have been raised with the client and not yet closed.

---

## Contradictions between the prototype and the PRD

**Auto-close vs the QC gate.** PRD FR-095 / BR-039 say the ticket closes automatically once the correct endorsement copy is attached, and argue no post-closure dispute flow is needed *because* closure only happens on a correct copy. The prototype instead requires the copy to pass QC and be sent deliberately, and blocks close until then. The client asked for the gate; the PRD has not been rewritten. **Either FR-095 changes or the gate goes.**

**Intake completeness — RESOLVED (FR-004 / BR-002).** The desk now assumes **complete intake at creation**: the mail bot collects every required field and document in the thread, and the ticket is only made once everything is in. There is no missing-intake state; the SM instead **Queries** a captured field or document that looks invalid (which routes the ticket to *Awaiting Customer Information*). Submission blocks only on an open query. Recorded in `FUNCTIONAL-SPEC.md` §5.

**No policy master.** The Create form auto-fetches Client / Insurer / Product from the Policy Number and shows them read-only, but there is no policy master in the workbook to fetch from. `fetchPolicy` is a stub — it matches the SEED policies and a couple of samples, otherwise returns a generic record. A real policy master (or an API) is needed for the fetch to be true.

**SLA-02 duration.** The master says 4 BH for SM verification; the PRD §8.2 says 2 hours. The master is more recent and was taken.

---

## Closed — the stage vocabulary, resolved to the SLA Master

Both defects recorded here are **fixed**. The decision was to keep the **SLA Master's** ten status
names and correct every other spelling to them, rather than rename the masters to match the design
frames. Recorded in `FUNCTIONAL-SPEC.md` §2, which now states the ten keys are the only vocabulary.

What moved:

| Was | Now | Sites |
|---|---|---|
| `"Sent to Insurer"` | `Submitted to Insurer` | `mailOf`, `endoOf`, `summariseThread`, `canEditType`, `REMINDERS` |
| `"Endorsement Copy Pending"` | `Awaiting Endorsement Copy` (waiting) / `Copy Received` (arrived) | `endoOf`, `mailOf`, `FIN_ON_ENTER`, the close gate, the manual-upload path |
| `"Payment Pending"` | `Awaiting Payment` | link expiry, `revertPayment`, the premium-withheld notice |
| `"Payment Complete"` | folded into `Awaiting Endorsement Copy` | `FIN_ON_ENTER`, the revise/regenerate gates |
| `"Payment Link Generation"` | `Awaiting Payment Link` | `FIN_ON_ENTER`, the awaiting-link panel |
| `stage: "Assigned"`, legs `"New"` / `"Pending Assignment"` | `Under Verification`, leg `New / Unassigned` | `create()` |

`statusOf` now tests `terminal === true`, and the status tone comes off the master as `ind` rather
than being inferred from a colour. Every open ticket walks to `Closed`; the two stages that need an
outside party got ▶ Simulate controls.

**Still open from this family:** `endoOf` only fabricates a copy once the ticket is at `Copy Received`
— but a ticket that reached `Copy Received` before this change carries no `endo`, so seeded history is
regenerated rather than replayed. That is fine for a prototype and wrong for a real store.

---

## Still open — a pod is derived from the insurer, but people belong to pods

`ASSIGNMENT.podOf(insurer)` reads the pod off `INSURERS`, and `ROLES` gives each person a pod of their
own. The routing rule is *"By insurer → pod, then round-robin within pod"* — so a ticket's pod and its
owner's pod must be the same pod, or the rule was not followed.

They are not. Nanditha P is **Pod A**, but two seeded tickets on her desk route elsewhere:

| Ticket | Insurer | Ticket's pod | Owner's pod |
|---|---|---|---|
| END-1048 | IFFCO Tokio | Pod C | Pod A |
| END-1062 | Chola MS | Pod B | Pod A |

The ticket header used to print `${owner} · ${podOf(insurer)}`, so the same person appeared to be in
three pods depending on which ticket you opened. **The label now shows the owner's own pod**, which is
true, and the routing pod moved into the tooltip. The underlying contradiction is untouched and needs
a decision:

- **Fix the data** — give each seed an owner from the right pod. There is only one persona with a
  desk, so this means seeding Rahul K (Pod B) and a third executive for Pod C.
- **Fix the rule** — if a pod is a *preference* rather than a constraint, say so, and the header
  should show both: the pod it routed to and who actually picked it up.
- **Drop the pod from the ticket** — if round-robin within a pod is the whole of it, the pod is an
  attribute of the person and the ticket only needs an owner.

Until it closes, no screen should assert a ticket's pod as a fact about its owner.

---

## Closed — dismissing the Create modal no longer destroys the manual-review mail

**Fixed (2026-08-28).** `claim(mid)` used to remove the mail from the queue *before* the Create modal
opened, so closing the modal lost the mail with no ticket created. Now `claim` only records the mail
id (`claimId`); the mail leaves the queue inside `create()`, once a ticket actually exists, and
`claimId` is cleared if the form is dismissed. Verified: opening and closing Create on a queue row
leaves both rows intact.

**Still open (separate, pre-existing):** a Create form opened from a claim carries a prefilled Client,
and its policy-fetch does not auto-fill Insurer/Product in that path — so a claimed ticket can be hard
to complete through the form. Not caused by the removal-timing fix; worth a follow-up.

---

## From the six-agent audit — unfixed, ranked

Nine defects were fixed in the same pass (see the change log at the end of this file's history).
These were left because each changes a rule, a master, or a stored shape.

**1. "The stage clock holds" is false.** `clock()` returns `held` for exactly one reason —
`t.manualReview` (which nothing ever sets). An open query does not pause anything: `raiseQuery` moves
the ticket to `Awaiting Customer Information` and starts a **fresh, running SLA-04**. So `SlaCard`
prints *"On hold · Paused while the client answers"* while the list counts down and Home's Overdue
queue counts a ticket its own page calls paused. The `QueryModal` promises the hold in writing.
Either `clock()` learns about `openQueries(t)`, or the copy stops claiming it.

**2. `raiseQuery` / `receiveReply` push no leg and reset `inStage`.** A clarification round trip is
erased: END-1043's age drops 33.2h → 3.2h the moment you ask a question, and every timestamp derived
from `ageOf` — the whole mail trail — jumps forward with it. The seeds carry two `Under Verification`
legs and no `Awaiting Customer Information` leg, a shape no mutator can produce.

**3. A desk click stands in for a counterparty event.** *Log payment confirmed* runs
`FIN_ON_ENTER["Awaiting Endorsement Copy"]`, which **fabricates** a UTR, a date and a proof filename,
then writes an audit line *"Payment proof uploaded by customer in BimaKendra"* signed `by: t.client`.
One click manufactures a financial record in the customer's name, against a 7-year retention rule.

**4. `create` discards the intake it just collected.** `onCreate(f)` passes only the six header
fields; `vals` and `ups` — every value typed and every document uploaded in the modal — are dropped,
and the ticket is hardcoded `missing: [], missingFields: []`. A manually raised ticket can therefore
**never** hit the submission block. It also never sets `kind`, so `FLOW[undefined]` falls back to
Non-Financial: raise a *Sum Insured / Limit Enhancement* and you get a non-financial ticket with no
Premium tab — while the modal was showing you *"Classification: Financial"*.

**5. `used` mixes two clocks.** `clock()` computes `used = calendar-elapsed / calendar-span-of-a-BH-window`.
Enter a 4 BH stage at Friday 18:00 and by Monday 09:00 the bar reads ~94% and flips to `atRisk` with
**one of four business hours consumed**. `atRisk` feeds `bucketOf`, `riskSort`, Needs Attention and
every Home queue.

**6. `revertPayment` deletes a leg.** `legs.filter(l => l.s !== "Awaiting Payment")` makes the ticket
younger, shifts every derived timestamp, and destroys a breach. Correcting a payment rewrites history.

**7. A breach is unrecoverable once a stage closes.** `legs` store `{s, h}` — no due, no breach flag,
no actor, no exit reason. Historical SLA compliance is not unbuilt; it cannot be reconstructed from
what is stored. `overStage` admits this by inventing `sla * 2.7` to convert BH to calendar.

**8. `StageList` reads only the first leg of a re-entered stage.** Five of seven seeds show two
`Under Verification` legs; the drawer reports the first (END-1048: *3h*, actual *9h*).

**9. Smaller, verified:** `overStage` fires on `New / Unassigned` for all seven seeds (0.2h against a
1 MIN SLA), so every phase bar's first segment is red and the red carries no signal ·
`FIELD_VALUES` is missing *"Mobile number"* · `docsOf` fabricates receipt times from current state, so
a document's recorded arrival moves as the ticket ages · `withdraw` leaves `stage` untouched so a
terminal ticket keeps a live, breaching clock · the toast after a portal reply names **SLA-03**, which
is not a stage · `t.query` is read in two places and set nowhere · `touched` is maintained by 3 of 17
mutators, so a chased, QC'd, sent ticket still reads *freshly assigned* · reassigning to
`ESCALATION.serviceHead` picks a name that is not in `ROLES`, so they render *"Unassigned"* and the
trail classifies them as a bot.

**Trail coverage.** Only `attachCopy`, `passQc` and `sendCopy` write through `TRAIL`; sixteen inline
history strings remain across chase, query, reply, withdraw, reassign, type change, reminder,
regenerate and revert. `seedTrail` has no home for any of those events, so a seeded ticket and a
driven one still diverge outside the happy path.

---

## Missing rules

**No QC-fail path.** QC can only pass. A wrong copy needs a "Return to insurer" action that puts the ticket back on the insurer clock with a reason and a rework count.

**Link regeneration ownership.** Regeneration is currently SM-triggered. Should the system regenerate automatically on expiry and re-notify? FR-079/080 require it to be supported and logged, but not who initiates it.

**Two users answering the same query.** All authorised portal users can respond. First response releases the SLA hold — whether later responses append or are rejected is unstated.

**Routing failure destination.** If no assignment rule matches, the ticket has no owner and is hidden from every desk view by design. The fallback owner is defined but the queue that surfaces it is not built.

---

## Not built, deliberately

- **Rejected** flow and **Insurer Clarification Requested** — happy path only for now
- **Manual Review rework** — paused by the client mid-design. The state exists and is bot-raised; the FR-118 workspace (edit extracted values, reclassify, feedback capture) is not built
- **Return-premium / refund** — PRD Appendix A.1, offered at creation but blocked
- **BimaKendra** — the customer portal has no representation at all. Every customer interaction is asserted in a log line. Roughly half the PRD status table is customer-facing, so this is the largest single gap
- **The other Internal Tools** — the shared admin login (`TOOLS`) recognises BimaEndorse and BimaClaim; only **BimaEndorse** is built. BimaClaim (and, by extension, Placement/Admin/Sahaayak/Relationship) render an *under-construction* page, not the tool. One prototype simplification to note: **"Visit BimaEndorse"** on that page enters Nanditha's desk for *any* signed-in user (Ruksana included), because BimaEndorse is the only built tool — it is a fallback, not an access grant. Real access control across tools is out of scope here (`FUNCTIONAL-SPEC.md` §8)

---

## Known gaps against the PRD

- `Cancelled` is reachable in principle via the 30 CD terminal actions on SLA-04 and SLA-08, but nothing fires it
- No duplicate detection at intake (FR-008, BR-005)
- The payment child ticket is a reference string, not a record with its own queue and SLA
- Payment mode is preset, not customer-chosen (FR-073/082)
- Endorsement number is not captured from the copy (FR-094)
- No document versioning, format/size validation, or internal-vs-customer visibility
- No role enforcement; one persona only
- No transition validation table (FR-140) — the flow array is walked linearly
- No admin configurator; all 16 masters are constants
