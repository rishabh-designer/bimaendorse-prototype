# Functional specification — frozen contract

Everything here must remain true after any UI Supervisor change. In Product Owner mode this file is edited alongside the code, never after it.

---

## 1. Shape

Single `.jsx` file, default export `App`. All state is React state in `App`, passed down as props. No context, no reducers, no persistence.

```
App state
  authed            false until the portal login succeeds
  tickets[]        the working set
  mails[]          unmatched inbound mail (pre-ticket)
  view             "home" | "list" | "ticket" | "review" | "create"
  filter           active list tab key
  openId           ticket id being viewed
  scope            "mine" | "team"
  preset           deep-link filter carried from a metric tile
  prefill          create-form seed from a claimed mail
  toast            transient confirmation string
```

### Ticket object

| Field | Meaning |
|---|---|
| `id` | `END-nnnn` |
| `client`, `short`, `policy`, `insurer`, `insurerMail` | party and contract |
| `product` | one of 14 products; decides which types are offered |
| `type` | one of 33 endorsement types |
| `kind` | `"Financial"` \| `"Non-Financial"` — decides the status sequence |
| `priority` | `Critical` \| `High` \| `Medium` \| `Low` |
| `stage` | current status key |
| `owner` | Service Manager |
| `inStage` | **calendar** hours elapsed in the current status |
| `lastAction` | **calendar** hours since anything was logged |
| `touched` | false until work is logged — drives "freshly assigned" |
| `legs[]` | `{ s: statusKey, h: calendarHours }` per completed status |
| `missing[]` | mandatory documents not yet received |
| `missingFields[]` | mandatory fields not yet captured |
| `queries[]` | clarification queries; each may carry a portal `reply` |
| `extraMail[]` | mail generated at runtime, merged into the derived trail |
| `endo` | endorsement copy `{ file, size, source, at, by }`, or `null` |
| `qcPassed` | boolean gate on sending the copy |
| `sends[]` | delivery log for the copy |
| `quote` | financial only `{ base, gst, total, file, version, at, source, confidence }` |
| `payMode`, `childTicket`, `childClosed`, `payLink`, `payment` | financial only |
| `terminal` | `"Customer Withdrawn"` \| `"Cancelled"` \| absent |
| `manualReview` | `{ reason, at, priorStatus }` \| null — bot-raised only |
| `priorStage` | status to return to after a clarification round |
| `history[]` | audit trail `{ text, by, at, note }` |

---

## 2. Status model

Statuses and SLAs come from the client's **SLA Master** tab. Each carries its code — the code is shown in the UI and must not be hidden.

**These ten keys are the only stage vocabulary in the file.** They come from the SLA Master.
Design frames and the Reminder Schedule tab label some of the same statuses differently — *Sent to
Insurer*, *Endorsement Copy Pending*, *Payment Pending*, *Payment Link Generation*, *Assigned* — and
those names must not appear in code. `stageOf()` falls back to `Closed` on an unknown key and
`posOf()` returns `-1`, so a misspelt stage fails **silently**, not loudly. Add a stage here first.

| Key | Code | SLA | Unit | Owner | Indicator |
|---|---|---|---|---|---|
| New / Unassigned | SLA-01 | 1 | MIN | system | neutral |
| Under Verification | SLA-02 | 4 | BH | Service Manager | caution |
| Awaiting Customer Information | SLA-04 | 24 | CD | customer | error |
| Submitted to Insurer | SLA-05 | 1 | WD | insurer | info |
| Awaiting Quote | SLA-06 | 2 | WD | insurer | info |
| Awaiting Payment Link | SLA-07 | 1 | BH | operations | info |
| Awaiting Payment | SLA-08 | 24 | CD | customer | caution |
| Awaiting Endorsement Copy | SLA-09 | 3 | WD | insurer | caution |
| Copy Received | SLA-11 | 1 | BH | Service Manager | success |
| Closed | — | — | — | — | muted |

**Indicator** is the status tone, and it belongs to the master, not to a component. The rule behind
the column (Figma `179:3672`): **blue** = an outside party holds the clock; **amber** = a clock we or
the customer own and can act on; **pink** = blocked, needing a chase; **green** = a milestone just
cleared; **grey** = routing or terminal. Sub-states override it — an open query reads
`Awaiting Customer Information`'s tone, manual review reads `error`, a terminal ticket reads `muted`.

`terminal` on a stage row holds a **sentence** on all nine open stages and the literal `true` only on
`Closed`. Test it as `=== true`. Reading it as truthy made every stage report itself Closed.

**Sequences**

- Non-Financial: New / Unassigned → Under Verification → Submitted to Insurer → Awaiting Endorsement Copy → Copy Received → Closed
- Financial: as above, with **Awaiting Quote → Awaiting Payment Link → Awaiting Payment** inserted after Submitted to Insurer

`Awaiting Customer Information` is **not** in either sequence. It is entered sideways from Under Verification and returns there. `posOf` falls back to `priorStage` when the ticket is in it — do not remove that fallback.

**Terminal statuses:** `Closed`, `Customer Withdrawn`, `Cancelled`. Terminal tickets are read-only: no stage advance, no queries, no sends, no reassignment. `readOnly(t)` gates this and must gate every action control.

---

## 3. Time model

`NOW` is fixed at **11:00 on the next working day**, computed once at load, so the prototype reads identically whenever it is opened. Do not replace it with a live clock — the seeded SLA states depend on it.

Four units, one deadline function `dueFrom(entered, sla, unit)`:

| Unit | Meaning |
|---|---|
| `BH` | business hours — 10:00–19:00, Mon–Fri, holidays excluded |
| `WD` | working days — same clock time on the Nth working day |
| `CD` | calendar days — 24×7 |
| `MIN` | minutes, 24×7 |

Helpers: `bizBetween`, `addBiz`, `subBiz`, `addWD`, `isWorkday`, `fmtWhen`, `fmtBiz`, `fmtDur`.

`clock(t)` returns `{ state, entered, due, used, sla, unit, label, left, cancelAt, external }`.

**States:** `ok` · `atRisk` (≥75% of the window consumed) · `breached` (past `due`) · `held` (manual review) · `closed`. Colour mapping lives in `toneOf` — one source of truth.

Durations below one hour render as minutes. Below a working day, hours and minutes. Above, working days (`wd`). Never a decimal.

---

## 4. Derived data — never store what can be computed

### The audit trail

`history` **is** stored — it is the record, and a record cannot be recomputed after the fact. But
**every sentence in it has exactly one home**, in `TRAIL`. The mutators write through it and
`seedTrail` replays through it, so a ticket that was seeded and a ticket that was driven tell the same
story in the same words. Never write a history string inline.

- `legLine(from, h, to)` → *"Under verification after 36m"*, and *"…: Closed"* only when the ticket
  lands somewhere terminal.
- `onEnterTrail(t, stage)` → what the desk logs when a ticket **arrives** in a stage: the quote and
  link request, the link landing, the payment proof, the copy arriving, QC and delivery. `FIN_ON_ENTER`
  emits the same lines from the same place.
- `seedTrail(t)` walks the ticket's own `legs` and stamps each line with when it happened. `at` is
  hours ago. For a closed ticket the walk starts at `ageOf(t) + lastAction`, so the legs describe the
  working life and `lastAction` says how long ago it finished.
- `actorOf(by, t)` resolves a line's signature to a person or one of the desk's system personas —
  the product, Operations, the notification engine, the client.

**The trail is where pace is legible.** A ticket's story should show that the stages we own close in
minutes while the ones we wait on take days. That falls out of the legs; do not smooth it.

| Function | Returns |
|---|---|
| `statusOf(t)` | displayed status, including sub-state overlays |
| `clock(t)` | SLA position for the current status |
| `remindersOf(t)` | follow-ups fired, next due, escalation ladder, terminal action |
| `intakeOf(t)` | mandatory fields with captured values or `null` |
| `docsOf(t)` | mandatory documents plus portal uploads and the copy |
| `mailOf(t)` | the mail trail, `extraMail` merged, newest first |
| `endoOf(t)`, `sendsOf(t)` | endorsement copy and its delivery log |
| `summariseThread(t)` | the bot's précis of the trail |
| `bucketOf(t)`, `riskSort` | queue placement and ordering |
| `ageDays(t)`, `fmtAge(t)` | ticket age in whole days |

**Ticket age** is `round(ageOf(t) / 24)` — creation→now while the ticket is open, frozen at creation→closure once it closes (`ageOf` stops accruing when `isOpen` is false). It surfaces as the **Ticket Age** column in My Tickets (between Type and Client), as a line beside the Overview's Ticket Workflow, and drives the **Oldest First / Newest First** sorts.

---

## 5. Rules that must not break

**Blocking**

- Submit to insurer is blocked only while a client query is open. (Mandatory intake is complete before the ticket exists — see **Intake** below — so it never blocks submission.) The reason is stated on the control.
- Close is blocked until the copy exists, has passed QC, and has been sent.
- Customer Withdrawn requires **both** a reason and an uploaded withdrawal email.
- Reassignment requires a target **and** a reason, and does not reset `inStage`.
- Endorsement type is editable only before `Submitted to Insurer`, and only within the product's offered list.

**Intake is complete at creation**

- The mail bot collects every mandatory field and document *before* the ticket is created — it chases anything missing in the mail thread, and the ticket is only made once everything is in. So the desk has **no missing-intake state**; the `Mandatory intake` counter always reads *N of N*.
- What the SM does instead is **challenge** a capture that looks wrong: **Query** a captured field (Name, Address — value + a Query link, nothing to view) or a document (**View + Query**). A Query routes the ticket to *Awaiting Customer Information* and is the only thing that blocks submission.

**Automation boundaries** — these are system actions and must never become manual controls:

- Assignment (SLA-01) is rule-driven; unrouted tickets are hidden from every desk view.
- The payment link arrives by itself — Operations upload it on the child ticket, or the bot extracts it from insurer mail. Either way the customer is notified automatically.
- Manual Review is raised by the bot. A Service Manager may only resolve it.

**Customer channel**

- Clarification responses arrive **only** through the portal, bound to a query id. No matching, no confidence, no email path.

**Queues**

- Overdue · Due today · Freshly assigned still run in parallel as **`bucketOf` buckets**, but Home no
  longer renders them as parallel columns — each is one collapsed row stating its count. Ticket-level
  scanning moved to Priority Cases. The buckets are a mutually exclusive cascade (silent outranks
  breached), so a breached-and-silent ticket is counted once, under Pending action.
- The three rows link through `SLICES.qOverdue` / `qDueToday` / `qFresh`, which mirror the buckets
  exactly so a row's count always equals what clicking it opens. They carry `queue: true` and are
  therefore **not offered in the Stage due menu** — they are buckets, not due dates.
- Priority cases is a lens above them, paged three at a time; Pending action is `lastAction ≥ 360`
  calendar hours.
- Sort is `riskSort`: bucket first, priority as tiebreaker, then time to deadline. Priority alone never determines order.

---

## 6. Handlers

`advance` · `attachCopy` · `passQc` · `sendCopy` · `raiseQuery` · `receiveReply` · `receiveLink` · `reviseQuote` · `regenerateLink` · `revertPayment` · `withdraw` · `reassign` · `resolveManualReview` · `changeType` · `sendReminder` · `chase` · `create` · `claim`

Every one writes a `history` entry. That is the audit trail — no silent mutations.

`reviseQuote(id, { base, gst, file, reason })` (M5) replaces the quote with a **new version** and keeps every prior one in `quoteVersions` — nothing is overwritten in place. The SM enters the change in the Update Quote modal; the version-history drawer on the Payment tab reads that array.

`chase(id)` sends a reminder to the insurer: it drafts an outbound mail into `extraMail` (so `mailOf` renders it as the latest entry on the Mail Trail), writes the audit line, and resets the pending-action clock. The reminder is offered **only while an insurer stage is live** — `Submitted to Insurer`, `Awaiting Quote`, `Awaiting Endorsement Copy` (the stages the master gives `owner: "insurer"`, via `awaitingInsurer(t)`). Once the copy arrives — `Copy Received` / `Closed` — there is nothing to chase, so the control is hidden.

`raiseQuery(id, q)` can ask **several questions in one query**, sent to the client as a single BimaKendra form. The Ask-the-Client modal holds a list of question/document stacks; **Add Another** appends one; **Create Query** submits them all. The query stores the full `items: [{ text, docs }]` list, plus `text` (first question) and `docs` (union of all requested documents) so the reply flow (`receiveReply`) and legacy readers are unchanged — one form still counts as one customer cycle and still moves the ticket to `Awaiting Customer Information`.

---

## 6a. Reaching Closed

The desk cannot leave three stages on its own, because an outside party has to act:

| Stage | Who acts | What the prototype offers |
|---|---|---|
| Awaiting Payment Link | Operations, or the insurer by mail | **▶ Simulate** in the Overview footer and on Premium & Payment |
| Awaiting Endorsement Copy | the insurer | **▶ Simulate**, or *Log manually — upload copy* |
| Awaiting Customer Information | the client | **▶ Simulate portal response** on the query |

**The copy arriving is a transition, not an attachment.** `attachCopy` closes the SLA-09 leg and moves
the ticket to `Copy Received`, where SLA-11 runs and `Publish & close` lives. That action stays
**blocked until the copy exists, has passed QC, and has been sent to the client** — the gate the
client asked for, and the reason FR-095's auto-close is still open in `OPEN-QUESTIONS.md`.

Every ticket must be able to reach `Closed`. If a stage has no `verb`, it needs a ▶ control.

---

## 7. Demo controls

Controls prefixed **▶** simulate an external actor (client portal response, Operations upload, bot fetch). They are labelled as demo affordances deliberately. Keep them visually secondary and keep the label.

---

## 7a. Addresses

Every view has a URL, kept in step with `view` / `openId` through `history.pushState` and read back on
`popstate`, so the browser's Back and Forward work:

| Path | View |
|---|---|
| `/` | Home |
| `/tickets` | My Tickets |
| `/tickets/END-1048` | that ticket |
| `/tickets/new` | the Create modal |
| `/review` | Manual Review Queue |

**This is the address bar, not storage** — the no-browser-storage rule is untouched. Reading
`location` can throw inside a sandboxed frame, so both directions are wrapped: the app runs either
way, the URL just stops following.

A link to a ticket that does not exist lands on My Tickets rather than an empty screen, and the login
gate does not consume the URL: sign in on `/tickets/END-1048` and that is where you arrive.

---

## 8. Access — admin portal login

Added 2026-08-26 (Product Owner). The console is reached through the BimaKavach admin portal, so
the address is **recognised, not registered**: there is no sign-up, and only addresses present in
`PORTAL_USERS` may enter.

**State.** `authed` in `App`, boolean, React state. It starts `false`, so the prototype opens on
`Login`. Signing out from the sidebar profile card returns it to `false`. Nothing persists — a
reload returns to the login screen, by design.

**Recognition.** On every keystroke the trimmed, lower-cased email is looked up in `PORTAL_USERS`.

| Result | Field | Header |
|---|---|---|
| Match | success rule, value in `brand`, green tick | user chip (avatar · name · address) + environment appear |
| No match, address looks complete (`/@.+\..+/`) | error rule, red cross, *"Not a registered admin address"* | nothing |
| No match, still typing | idle | nothing |

The address is judged only once it looks finished, so the field does not report failure mid-keystroke.

**Environment.** Each user carries `env` and `envLocked`. Nanditha holds **BimaEndorse** only, so the
chevron renders in the disabled token and states why on hover. An admin with more than one
environment would unlock it. Only the locked case is built.

**Password.** A single shared demo value, `PORTAL_PASSWORD = "pass-word"`. Anything else sets
*"Incorrect Password"* on the password field and does not advance. The error clears on the next
keystroke. There is no lockout, no attempt count and no reset flow.

**Submit.** Enabled only when the address is recognised **and** the password is non-empty — an empty
password can never be submitted. On success the button enters its loading state for ~900ms, then
`authed` becomes `true` and the console opens on Home.

**Not built:** sign-up, password reset, session expiry, attempt limiting, more than one environment,
and any role enforcement behind the login. Recognition is a lookup, not authentication.

---

## 9. My Tickets — filtering, sorting, paging

Added 2026-08-26 (Product Owner), per Figma `888:88939`. The filters moved out of a control row and
into the column headings; the lifecycle slices became pills.

**Filters are multi-select.** Each of Priority, Stage, Type, Request and Stage due holds a `Set`.
**An empty set means All** — the same thing the old "All priorities" option meant. Selecting nothing
and selecting everything are therefore the same query, and "All" simply clears the set. Within a
column the values are OR-ed; across columns they are AND-ed.

| Column | Filters on | Options |
|---|---|---|
| Priority | `t.priority` | Critical · High · Medium · Low |
| Stage | `t.stage` | the eleven `ALL_STAGES` keys |
| Type | `t.kind` | Financial · Non-Financial · Refund (`Return-Premium`) |
| Request | `t.type` | **only the endorsement types present in the data** — never a full catalogue |
| Stage due | derived | the `SLICES` predicates |

`ID` and `Client` are not filterable. There is no free-text search on this screen.

**Stage due now applies on every tab.** It was previously gated to `Needs attention`
(`tab === "attention" ? SLICES[slice].fn : …`). As a column filter that gate is gone — a column
heading that silently stopped working on three of four tabs would be a lie.

**Home's metric tiles still deep-link.** `{prio:"hot"}` becomes `Set{Critical, High}`;
`{slice:"x"}` becomes `Set{x}`. The four tiles must keep landing on a pre-filtered list.

**Paging.** A tab shows **every row it has**. `PAGE_SIZE = 10` and the pager only appears once a tab
exceeds it — with the current seed set (4 · 6 · 1 · 6) it never does. A display rule, not a business
value. `page` is zero-based and **resets to 0 whenever the tab or any filter changes**, so a filter
can never strand you on a page that no longer exists; arrows disable at the ends.

**Sorting.** Four options, per Figma `900:97172`: **Priority · Urgency · Oldest First · Newest
First**. `newest` was added in this change as the inverse of `oldest`. Still single-select, and still
forced to `touched` on `Recently worked`, where the window control (Yesterday / Last week /
Last month) replaces the sort field.

**Create Ticket lives in the breadcrumb**, on every view, and is the only route to `Create`.
`Create`'s Back returns to **My Tickets**, not Home.

The Create form takes **three inputs** — Policy Number, Priority, and Endorsement Type. Entering the policy **auto-fetches** Client, Insurer, and Product, which then render **read-only** (there is no real policy master yet — the fetch is a stub, see `OPEN-QUESTIONS.md`). The endorsement type's own mandatory fields and document uploads sit in a **second column** on the right so the form stays on one screen; the modal keeps its two-column width throughout, with the right column empty until a type that has such fields is chosen.
