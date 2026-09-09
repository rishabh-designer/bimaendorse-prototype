# BimaEndorse — PRD Source of Truth

> **Purpose.** Single reference for engineers writing the production PRD and Data Masters. Consolidates the frozen behaviour from `FUNCTIONAL-SPEC.md`, `DATA-MASTERS.md`, `UI-INVENTORY.md`, `DESIGN-SYSTEM.md`, `OPEN-QUESTIONS.md`, and every behaviour landed in `prototype.jsx` since (refund flow, Reports, Client Channel insurer requests, next-action tab hints, team-scope UI).
>
> **How to read it.** Sections 1–8 are the model. Sections 9–13 are the surfaces. Sections 14–17 are the integrations and edge cases. Section 18 is what's still open.

---

## 1. Overview

### 1.1 What BimaEndorse is
BimaEndorse is BimaKavach's Ticket Management System (TMS) for **endorsement servicing** — every mid-policy change a commercial client asks for (address, sum insured, refund, name, wording, etc.), from intake through the insurer to the endorsement copy landing in the client's inbox. It sits alongside two sister TMS environments (**BimaClaim** for claims, **BimaPlacement** for policy placement) and shares a login, sidebar shell, and multi-env switcher.

### 1.2 Goals
- Move every endorsement to closure inside SLA, with the current owner and the current blocker visible at all times.
- Track intake completeness, insurer response, and client consent as first-class states — not free-text notes.
- Give the Service Manager (Umesh) a team-level view without ripping the Servicing Executive's individual view.
- Support three money directions cleanly: no money (Non-Financial), premium collected (Financial), premium refunded (Refund).

### 1.3 Non-goals (prototype scope)
- Historical rollups / warehouse-backed reports (Reports page reads live desk only).
- BimaKendra client portal (a stub — every "client action" is simulated).
- Automated bot layer (BimaEndorse Bot behaviours are simulated per stage).
- Auth against Google Workspace / SSO (portal has a static password gate).
- Any browser storage — `localStorage`, `sessionStorage`, IndexedDB are all off; state is React-only and re-seeds on refresh.

### 1.4 Terminology
| Term | Meaning |
|---|---|
| **Ticket** | One endorsement request. ID `END-nnnn`. |
| **Stage** | Where the ticket sits in the workflow (`Under Verification`, `Copy Received`, etc.). Owner + SLA per stage. |
| **Classification / Kind** | `Financial` \| `Non-Financial`. `Refund` is a *display label* for Financial tickets whose endorsement type carries `refund: true` — see §4. |
| **Servicing Executive (SE)** | The person who owns a ticket. Called "owner" in the data (`t.owner`). Persona: Nanditha P. |
| **Service Manager (SM) / Endorsements Head** | Team lead. Owns manual review + reports. Persona: Umesh Bagri. |
| **BH / WD / CD / Min** | Business Hours (Mon–Fri 10:00–19:00 IST) / Working Days / Calendar Days / Minutes. Every SLA is written in exactly one of these. |
| **Legs** | Elapsed history of the ticket per stage. Time in each stage is banked to `legs[]` when it moves. |

---

## 2. Users & roles

### 2.1 Personas

| Role | Person (prototype) | Envs | What they see |
|---|---|---|---|
| Servicing Executive | Nanditha P (Pod A), Rahul K (Pod B) | BimaEndorse | Own desk, own queue, own progress dashboard. |
| Relationship Manager | Anil S | — (never logs in) | Referenced on tickets, does not log in. |
| Service Manager / Endorsements Head | Umesh Bagri | BimaEndorse + BimaClaim | Own desk + Team desk (Me / Team switch), team queue, Manual Review, Reports. |
| Claim CM | Ruksana Khan | BimaClaim | (For env-switch demo only.) |

### 2.2 Role master
```
ROLES = {
  "Nanditha P": { role: "Servicing executive", pod: "Pod A" },
  "Rahul K":    { role: "Servicing executive", pod: "Pod B" },
  "Anil S":     { role: "Relationship manager", pod: null },
}
```
Umesh's role comes from `PORTAL_USERS`: `Claims & Endorsements Head`. He does not appear in `ROLES` — the presence of a role in `ROLES` is what marks someone as a queue owner; team leads gate features off `PORTAL_USERS[…].role`.

### 2.3 Scope switch (Me / Team)
The Me / Team pill on Home is a **manager-only control** (`ROLES[user.name]?.role === "Servicing executive"` → hide). Toggling Team:
- Sidebar nav item **"My Tickets" → "Tickets"**.
- Ticket list gains an **Owner** column (110px, executive's first name).
- Ticket detail meta row gains an **`Owner: <name>`** chip.
- Home headings flip: `Your Desk / Your Team's Desk`, `Your Progress / Your Team's Progress`.
- `Home > Escalated to You` panel appears (mirrors BimaClaim).
- Reports (§9.8) is unchanged — always team-wide, only visible to managers.

---

## 3. Ticket data model

### 3.1 Ticket object
```jsonc
{
  "id": "END-1069",                    // stable, END-nnnn
  "short": "acmemfg",                  // short slug, used in mail addresses / file names
  "client": "Acme Manufacturing Pvt Ltd",
  "policy": "FIRE/2026/00812",
  "insurer": "ICICI Lombard",
  "insurerMail": "endorsement@icicilombard.com",
  "product": "Fire & Burglary",
  "type": "Refund - Excess Premium",  // one of the 33 endorsement types
  "kind": "Financial",                 // Financial | Non-Financial (Refund is derived from type)
  "priority": "High",                  // hidden from UI (kept for sort/back-compat)

  "stage": "Awaiting Refund Details",
  "owner": "Nanditha P",
  "priorStage": null,                  // set only while sideways in Awaiting Customer Information

  "inStage": 4,                        // calendar hours in current stage
  "lastAction": 4,                     // calendar hours since last human touch
  "touched": true,                     // has anyone touched this ticket yet
  "legs": [                            // banked history per stage
    { "s": "New / Unassigned",     "h": 0.2 },
    { "s": "Under Verification",   "h": 3   },
    { "s": "Submitted to Insurer", "h": 24  }
  ],

  "missing": [],                       // intake docs still owed
  "missingFields": [],                 // intake fields still owed
  "queries": [],                       // SM → client questions (raised from Client Channel)
  "insurerQueries": [],                // insurer → CM questions surfaced by BimaEndorse Bot
  "extraMail": [],                     // ad-hoc mail attached to the ticket
  "unread": {},                        // { tabKey: true } — clears on tab open
  "endo": null,                        // { file, size, source, at, by } once the copy is on file
  "qcPassed": false,
  "sends": [],                         // [{ by, at }] each time the copy went to the client

  // Financial-only
  "quote": null,                       // { base, gst, total, file, version, at, source, confidence }
  "quoteVersions": null,
  "payMode": null,                     // "Portal" | "Email"
  "childTicket": null,                 // "PAY-nnnn" when Portal
  "payLink": null,                     // { ref, at, expiresIn, source, by, confidence, regens }
  "payment": null,                     // { mode, utr, date, file, at }

  // Refund-only (t.type.refund === true)
  "refund": null,                      // { amount, insurerRef, confirmedOn, clientAccept,
                                       //   utr, paymentDate, endoCopyFile,
                                       //   clientConfirmed, step: "rejected"? }

  "terminal": null,                    // "Customer Withdrawn" | "Cancelled"
  "manualReview": null,                // { reason, priorStatus, at } — sideways state
  "vals": {},                          // captured field values from Create form
  "ups": {},                           // uploaded docs from Create form

  "history": []                        // append-only audit trail
}
```

### 3.2 Derived — never stored
- `stage indicator tone`: read `ALL_STAGES[stage].ind`.
- `client-facing label`: `statusOf(t)` — collapses `manualReview` and open queries into their own labels.
- `age` (whole days): `ageOf(t)` sums legs + inStage; freezes at closure.
- `docs`: `docsOf(t)` — the Document Vault view; joins TYPES.docs + client portal uploads + endo copy.
- `intake`: `intakeOf(t)` — the Captured at Ticket Intake view; prefers `t.vals[label]` over `FIELD_VALUES[label]`.
- `mail trail`: `mailOf(t)` — synthetic mail thread reconstructed from legs.

---

## 4. Classification & flow

### 4.1 Three flow sequences

| Kind | Stages | Notes |
|---|---|---|
| **Non-Financial** | 6 | New → Under Verification → Submitted to Insurer → Awaiting Endorsement Copy → Copy Received → Closed |
| **Financial** (regular) | 9 | New → Under Verification → Submitted to Insurer → **Awaiting Quote → Awaiting Payment Link → Awaiting Payment** → Awaiting Endorsement Copy → Copy Received → Closed |
| **Refund** (Financial + `refund: true`) | 7 | New → Under Verification → Submitted to Insurer → **Awaiting Refund Details** → Awaiting Endorsement Copy → Copy Received → Closed |

`seqOf(t)` returns the Refund sequence when `TYPES[t.type]?.refund` is true, else `FLOW[t.kind]`.

### 4.2 Kind vs Refund

- **Backend classification**: two values only — `Financial`, `Non-Financial`. Stored on `t.kind`.
- **Refund**: a `refund: true` flag on the endorsement type master (§7). Every refund type is `kind: "Financial"`. There is no `kind: "Refund"`.
- **Header pill**: `kindOf(t)` returns `"Refund" | "Financial" | "Non-Financial"`. The Refund label is display-only; filter and reports still group by `kind`.
- **Money direction**: Financial = premium in, Refund = premium out, Non-Financial = no money.

### 4.3 Interrupt states (not on the happy path)

| State | Triggered by | Owner | SLA | Terminal? |
|---|---|---|---|---|
| Awaiting Customer Information | SM raises a query | Customer | 24 CD Hrs, auto-cancels at 30 CD | Cancelled after 30 CD unpaid |
| Manual Review | Mail bot low confidence | SM | none (system) | Returns to prior stage on resolve |

Both return to `priorStage` when they clear.

### 4.4 Terminal states
- `Closed` — happy path.
- `Customer Withdrawn` — client-initiated, requires reason + email upload, no reopen.
- `Cancelled` — timer-driven from Awaiting Customer Information at 30 CD.

---

## 5. Stage catalogue (SLA master)

### 5.1 Full table

| Stage | Code | SLA | Owner | Verb (primary action) | Indicator |
|---|---|---|---|---|---|
| New / Unassigned | SLA-01 | 1 Min | System | (auto-assign) | Neutral |
| Under Verification | SLA-02 | 4 BH | Servicing Executive | Verify & submit to insurer | Caution |
| Awaiting Customer Information | SLA-04 | 24 CD Hrs, auto-cancel 30 CD | Customer | (SM sends reminder) | Error |
| Submitted to Insurer | SLA-05 | 1 WD | Insurer | Log insurer acceptance | Info |
| Awaiting Quote | SLA-06 | 2 WD | Insurer | Log quote received | Info |
| **Awaiting Refund Details** | **SLA-12** | **2 WD** | **Insurer** | (SM logs refund figure via Refund tab) | **Info** |
| Awaiting Payment Link | SLA-07 | 1 BH | Operations (BimaPlacement) | (link arrives) | Info |
| Awaiting Payment | SLA-08 | 24 CD Hrs, auto-cancel 30 CD | Customer | Log payment confirmed | Caution |
| Awaiting Endorsement Copy | SLA-09 | 3 WD | Insurer | (bot fetches copy) | Caution |
| Copy Received | SLA-11 | 1 BH | Servicing Executive | Pass QC | Success |
| Closed | — | no clock | — | — | Muted |

**No SLA-03 or SLA-10** — kept in the master for future use. SLA-12 is the new refund-details slot added for the Refund flow.

### 5.2 Follow-ups & escalations

Every non-system stage carries a `followUp` cadence and an `escalate` ladder. Escalation is triggered on breach: `n * follow-up interval` past due, escalate to the next rung.

| SLA | Cadence | Ladder |
|---|---|---|
| SLA-02 | 0.5 BH × 3 | Owning SM + Service Head → +2 BH → +4 BH → +1 WD |
| SLA-04 | 48 CD × 4 | Customer + RM + Service Head → +2 CD → +4 CD → +10 CD |
| SLA-05/-06/-09/-12 | 1 WD × 3 | Insurer POC + POC head + Service Head → +1 WD × 3 |
| SLA-07 | 0.5 BH × 3 | Operations + Ops Head + Service Head → +1 BH → +4 BH → +1 WD |
| SLA-08 | 24 CD × 3 | Customer + RM + Service Head → +2 CD → +4 CD → +12 CD |
| SLA-11 | 0.5 BH × 3 | Owning SM + Service Head → +30 min BH → +2 BH → +4 BH |

### 5.3 Terminal per stage
Most stages terminate as "Remains open — no auto-termination insurer-side". Two auto-cancel: SLA-04 at 30 CD (Cancelled), SLA-08 at 30 CD (Cancelled).

---

## 6. Business calendar

- **Business hours**: Monday–Friday, 10:00–19:00 IST.
- **Holidays** (2026, Keka): 4 Jan (Sat) obs., 26 Jan, 21 Mar, 14 Apr, 15 Aug, 2 Oct, 20 Oct, 25 Dec — full list on `BIZ.holidays`. Update annually.
- **BH** = clock ticks only inside the window. `4 BH from Mon 17:00 → Tue 12:00`.
- **WD** = same clock time next working day. `+1 WD from Fri 14:00 → Mon 14:00`.
- **CD** = 24×7 elapsed; delivery held to the next working morning.
- **SLA due date landing on a holiday** → recompute forward; never display a due date on a non-working day.
- **NOW pin (prototype only)**: `atH(nextWorkday, 11)` — 11:00 next workday, so seeded numbers stay stable across sessions.

---

## 7. Endorsement type master (33 types)

Every type carries:
- `kind`: `Financial` \| `Non-Financial`.
- `refund`: optional boolean. When true, the type opts the ticket into the Refund flow (§13).
- `fields`: mandatory field labels captured at Intake.
- `docs`: mandatory doc labels captured at Intake.

### 7.1 Non-Financial (14)
- Hypothecation - Addition | `Bank name`
- Address Change / Correction / Update | `Complete address with PIN code` | `GST certificate`
- Contact Details Update (Email / Mobile) | `Email ID`, `Contact number`
- Name / Entity Change | `Name` | `GST certificate`, `Certificate of Incorporation`
- Tax Invoice / Invoice Request | `Policy Number`
- Hypothecation - Removal | — | `NOC from financier`
- Business Description Correction | `Exact business description to be added in the policy`
- GST Details Update | — | `GST certificate`
- Correction in Policy | `Provide exact wording of the correction/changes to be added`
- Retrieve Policy document | `Policy Number`
- Policy Genuineness Verification | `Mail confirmation from insurer to client`
- Balance Transfer / Ledger Statement | — | `Declaration till date`
- Portal Access / Credentials / Training | `Email ID`, `Mobile number`
- Declaration Submission | — | `Declaration till date`
- Vendor Registration / Audit Documentation | — | —
- Certificate of Insurance (COI) / Certificate | `Certificate holder name`, `Certificate holder address`

### 7.2 Financial — non-refund (14)
- Location Addition / Deletion | `Location details`, `PIN code`
- Sum Insured / Limit Enhancement | `Amount of sum insured to be enhanced`
- Asset Addition | `Asset category / type`, `Value of asset`
- Policy Period Extension / Reinstatement | `Number of months`
- Risk Location Addition / Deletion / Change | `Complete address with PIN code`
- Marine Certificate Issuance | `Draft number` | `Commercial invoice`
- Trade Credit - Buyer Addition / Limit Assessment | `Buyer details with address`, `Buyer limits`
- Coverage Wording / Policy Clause Addition or Correction | `Exact wording of the coverage / clause to be added`
- Subsidiary Addition / Change | `Ownership %`, `Nature of work`
- Employee / Headcount Addition | `Count of employees`, `Monthly average salary`, `Skilled and unskilled split`

### 7.3 Refund (`refund: true`, `kind: "Financial"`) (5)
- **Refund - Excess Premium** | — | `Cancelled cheque`, `Payment screenshot`
- **Policy Cancellation** | `Reason for cancellation` | `Cancelled cheque`
- **Policy Cancellation + Refund** | `Reason for cancellation` | `Cancelled cheque`
- **Employee / Headcount Deletion** | `Count of employees`, `Skilled and unskilled split` | —
- **Asset Deletion** | `Asset category / type`, `Value of asset` | —

### 7.4 Field/doc semantics
- Fields in `TYPES[type].fields` must be captured at intake OR queried from the client (routes to `Awaiting Customer Information`).
- Docs in `TYPES[type].docs` must be uploaded at intake OR asked from the client.
- Actual values captured in the Create form land on `t.vals[label]` / `t.ups[label]` and drive the Overview → Captured at Ticket Intake section (prefers `t.vals` over the canned `FIELD_VALUES` fallback).

---

## 8. Product master (14 products)

Every product has an `Others` type wildcard on top of the specific types.

| Product | Insurers currently seeded |
|---|---|
| Fire & Burglary | ICICI Lombard, Bajaj Allianz, IFFCO Tokio, Chola MS |
| Marine Cargo | IFFCO Tokio, Bajaj Allianz |
| Directors & Officers (D&O) | ICICI Lombard |
| Professional Indemnity (PI) | ICICI Lombard, TATA AIG |
| Workmen Compensation (WC) | ICICI Lombard |
| Group Medical Cover (GMC) | HDFC Ergo, ICICI Lombard |
| Group Personal Accident (GPA) | Bajaj Allianz, ICICI Lombard |
| Office / Package Policy | Bajaj Allianz |
| Machinery Breakdown (MBD) | Bajaj Allianz |
| Cyber Liability | HDFC Ergo |
| Product Liability | HDFC Ergo |
| Commercial General Liability (CGL) | ICICI Lombard |
| Contractors' All Risks (CAR) | Bajaj Allianz |
| Motor | HDFC Ergo |

Insurer POC mails live on `t.insurerMail` (e.g., `endorsement@icicilombard.com`, `corp.endo@bajajallianz.co.in`).

---

## 9. UI surfaces

### 9.1 Login
- Single email + password. Password `pass-word` for all portal users (prototype).
- On verify, sees a personalised greeting in the user's preferred script (Nanditha in Kannada, Ruksana in Devanagari, etc.).

### 9.2 Shell
- Sidebar 237px expanded / 92px collapsed. Env lockup at top; profile + sign-out at bottom.
- Nav (Umesh): Home · Tickets (or "My Tickets" in Me scope) · Manual Review · **Reports (live)**.
- Nav (Nanditha): Home · My Tickets · Manual Review · Reports (greyed out).
- The active ticket nests under the list nav as a `-1069` caption / breadcrumb.
- **Env switcher** — multi-env users (Umesh: BimaEndorse + BimaClaim) get a portal-menu chevron beside the wordmark.

### 9.3 Home
- **Greeting** — day, time, personalised.
- **Your Desk / Your Team's Desk** — five count cards routing into pre-filtered My Tickets:
  1. Insurer Response (`awaitingInsurer`)
  2. Client Response (`onHold` = open queries)
  3. Freshly Assigned (`isFresh`)
  4. Due Today (`atRisk`)
  5. Overdue (`breached`)
- **Escalated to You** panel (team scope only) — mirrors BimaClaim.
- **Your Progress** — two `ProgressCard` tiles + Ticket Time Distribution donut. Range pills: Last Week / Last Month / Last Quarter / **Custom** (opens two side-by-side month-picker cards).

### 9.4 My Tickets (list)
- Pill tabs: Needs Attention · All Open · Closed & Terminal · Recently Worked.
- Table columns: ID · Stage · Type · Ticket Age · Client · Request · Stage due · (**Owner** in team scope).
- Header filters open a MenuCard picker per column (Stage, Type, Request, Stage due).
- Sort: Urgency (default) · Oldest First · Newest First · Last Worked.
- Slices: Everything · Overdue only · Due today only · Pending 15d+ only · Intake gaps only · Awaiting client only.
- 10 rows per page.

### 9.5 Ticket Detail — shell
Left panel (persistent across tabs):
- **SlaCard** — stage timeline, elapsed vs due.
- **Next Action card** (yellow) — plain-language what happened + what's next + primary action button + optional simulate button. Owns the primary stage action.

Right panel — `TabBar` + `PanelCard`:
- Overview · Company Profile · Document Vault · Client Channel · Mail Trail · Ticket History · **Premium & Payment** (Financial non-refund) OR **Refund & Payment** (refund) · Manage Ticket.
- **Tab red-dot indicator**: lights when `t.unread[tab]` is set OR the current stage's primary action lives on that tab (see §9.5.4). Clears on tab open.

#### 9.5.1 Overview
- Ticket Workflow phase bar — 4–5 phases depending on flow (Ticket Intake / Verification / Insurer / [Payment | Refund] / Ticket Closure).
- Workflow Stages collapsible with per-stage SLA + actual timing.
- Captured at Ticket Intake — one row per `TYPES[type].fields` entry, values from `t.vals` (typed in Create form) with `FIELD_VALUES` fallback for seed tickets.
- **Refund details** section (refund tickets only) — amount, insurer reference, confirmed-on date, UTR, payment date, endorsement copy tile.
- Endorsement copy tile (once on file) — View / Download / Pass QC / Send to customer.
- Reminders & escalation drawer.

#### 9.5.2 Company Profile
Empty state: "Company Profile is syncing info from Client 360" — placeholder for the eventual Client 360 sync.

#### 9.5.3 Client Channel
Two stacked sections:
1. **Insurer requests** (top, when present) — questions the insurer raised mid-flight, surfaced by BimaEndorse Bot with the insurer's wordmark. Two response paths per card:
   - **Answer & send to insurer** → inline textarea, optional **Choose document** drawer (right-slide, lists `docsOf(t)`) to attach a file from the ticket. Fallback: "Ask client for this document" from the drawer's footer.
   - **Ask client for this** → forwards to a client-facing query. The reply nests inside the same insurer-query card when it lands.
2. **Client queries** (SM → client) — Ask Client button, threaded questions with client-portal replies.

#### 9.5.4 Mail Trail
- Search box (subject / body / attachment name).
- Thread pill tabs at the right (All · Thread 1 · Thread 2 …) — groups by normalised subject stem.
- Chase button (only on insurer-owned stages).

#### 9.5.5 Ticket History
Append-only trail. Every mutation writes one row `{ text, by, at, note? }`.

#### 9.5.6 Premium & Payment (Financial, non-refund only)
Sections: Quote & premium · Payment link (BimaPlacement source) · Payment confirmation. Includes quote version history and payment-mismatch revert.

#### 9.5.7 Refund & Payment (refund tickets only)
Gated until `t.stage === "Awaiting Refund Details"` or later. See §13.

#### 9.5.8 Manage Ticket
Reassign · Mark Customer Withdrawn · Change Type (pre-submission only).

#### 9.5.9 Next-action tab hint
Every stage has a canonical tab (`NEXT_ACTION_TAB[stage]`):
- Under Verification / Submitted to Insurer / Awaiting Endorsement Copy / Copy Received → **overview**
- Awaiting Quote / Awaiting Payment Link / Awaiting Payment → **payment**
- Awaiting Refund Details → **refund**
- Awaiting Customer Information → **queries**

The tab dot lights on that tab (unless the SM is already on it). Clicking any primary action first switches to the target tab, then opens the Confirm Action modal — so the confirmation and result land in context.

#### 9.5.10 Confirm Action modal
Every primary button that moves the ticket to the next stage funnels through `askConfirm(fn)`: opens a small modal with copy "This action will move the ticket to the next stage and this cannot be undone. Are you sure you want to proceed?" · Cancel · **Move Ticket**. Simulate buttons bypass it — they won't exist in prod.

### 9.6 Manual Review
Queue of mails the bot couldn't confidently attribute (`R1..R8` reasons). Two paths: **Create Ticket from mail** or **Assign to Existing Ticket** (nested modal with wide MenuCard picker).

### 9.7 Create Ticket flow
- PAN-first modal. Enter PAN → confirm → Policy Number becomes a MenuCard dropdown of the PAN's policies → picking a policy auto-fills Client / Insurer / Product (locked). Swap link swaps to Policy Number entry.
- **Endorsement Type** — searchable combobox (MenuCard, opens upward so the list stays inside the modal).
- Per-type field inputs + doc uploads (from `TYPES[type].fields` / `.docs`).
- Progress bar % Complete.
- Return-Premium warning strip (existing — refund-typed tickets are now built end to end, but the warning stays for now until the master formally lifts the flag).

### 9.8 Reports (Umesh-only)
Live desk read-out — no historical store. Sections:
- **4 KPI tiles**: Open tickets · Overdue · Awaiting outside party · Median open age (days).
- **3 grouped-count tables**: By stage · By insurer · By servicing executive. Sorted desc by count.
- **What's coming** strip — items needing a warehouse (SLA compliance over time, first-response by insurer POC, manual-review resolution rate, executive throughput vs capacity, closed-reason breakdown).

---

## 10. Handlers & business rules

### 10.1 Handler roster
| Handler | Trigger | Effect |
|---|---|---|
| `create(f)` | Create Ticket submit | New ticket at `Under Verification`, auto-assigned to SE by pod round-robin. Stores `vals`, `ups`. |
| `advance(id)` | Primary action button on Overview / Payment / Refund | Move to `nextOf(t)`. Banks leg + writes history. Runs `FIN_ON_ENTER` for financial gates. |
| `attachCopy(id, opts)` | Bot fetch OR manual upload (Awaiting Endorsement Copy) OR refund simPayment | Sets `t.endo`, advances → `Copy Received`. |
| `passQc(id)` | Pass QC | Flags `qcPassed`. On refund tickets, does not close (waits for client-confirm). |
| `sendCopy(id)` | Send to customer | Appends `sends[]` entry. |
| `raiseQuery(id, q)` | Ask Client | Creates a query, moves to `Awaiting Customer Information`, snapshots `priorStage`. |
| `receiveReply(id, qid)` | Simulate portal response | Client answers, ticket returns to `priorStage`, banks the CD hold as a leg. |
| `receiveLink(id)` | Simulate link arriving | Populates `payLink`, closes childTicket (Portal). |
| `reviseQuote(id, x)` | Update Quote | Appends to `quoteVersions`, updates active quote. |
| `regenerateLink(id)` | Regenerate Payment Link | Appends a `regens[]` entry. |
| `revertPayment(id)` | Payment mismatch | Reverts from Awaiting Endorsement Copy back to Awaiting Payment. |
| `withdraw(id, { file, reason })` | Mark Customer Withdrawn | Sets `t.terminal`. Reason and email upload required. |
| `reassign(id, { to, reason })` | Reassign Ticket | Changes owner, does NOT reset `inStage`. Reason mandatory. |
| `resolveManualReview(id)` | Resume from Manual Review | Clears `manualReview`, returns to prior stage. |
| `changeType(id, next)` | Change Type | Pre-submission only. Recomputes intake/doc requirements. |
| `sendReminder(id)` | Send reminder now | Bumps chase counter; writes history. |
| `chase(id)` | Chase Insurer | Only on insurer-owned stages. |
| `refundAdvance(id, refundPatch, ticketPatch, note)` | Refund sim buttons | Merges into `t.refund`, optionally patches ticket, writes history. |
| `answerInsurerQ(id, iqid, answer)` | Insurer request Answer & send | Sets `answered_by_sm`, records answer. |
| `forwardInsurerQ(id, iqid)` | Insurer request Ask client for this | Creates a mirror client query (`forwardedFrom: iqid`), links reply back to the insurer card. |
| `markSeen(id, tab)` | Tab open | Clears `t.unread[tab]`. |

### 10.2 Rules that must not break
1. **Submission** — blocked only by open query. Missing intake docs no longer block; those become intake queries.
2. **Closure** — blocked until `endo` exists, `qcPassed === true`, and `sends.length > 0`.
3. **Change Type** — blocked once `atOrPast(t, "Submitted to Insurer")`. After that the money-direction has committed.
4. **Withdraw** — requires `reason.trim() && file`. Sets `terminal`; ticket is read-only forever.
5. **Reassign** — requires `to` and `reason.trim()`. Does not reset `inStage` (SLA continues from previous owner).
6. **Chase** — only on insurer-owned stages (`stageOf(t.stage).owner === "insurer"`).
7. **Query loop** — raising a query snapshots `priorStage` and moves to Awaiting Customer Information; receiving a reply returns to `priorStage`. Auto-cancels the ticket if the CD clock hits 30.
8. **Refund Pass QC** — does not close the ticket. Closure waits for client-confirm on the Refund tab (or the Next Action card's `Simulate: Client Confirms`).

### 10.3 Automation boundaries
- **Auto-assign** at intake (system).
- **Payment link arrival** (bot mail scrape OR child-ticket close from Ops).
- **Endorsement copy fetch** at Awaiting Endorsement Copy (bot mail scrape).
- **Manual Review triage** at mail intake (bot low-confidence).
- Everything else is a manual SM/SE action.

---

## 11. Notifications & escalations (event map)

### 11.1 Event codes
| Event | When | Recipient | Channels |
|---|---|---|---|
| `EVT-INT-01` | Ticket created | Customer | Email, WhatsApp, BimaKendra |
| `EVT-ASN-01` | Assigned to SE | SE | TMS |
| `EVT-VER-01` | Query raised | Customer | Email, BimaKendra |
| `EVT-INS-01` | Submitted to insurer | Insurer POC | Email |
| `EVT-QUO-01` | Quote received | Customer | Email, BimaKendra |
| `EVT-LNK-01` | Payment link ready | Customer | Email, WhatsApp, BimaKendra |
| `EVT-PAY-01` | Payment confirmed | Customer | Email, WhatsApp, BimaKendra |
| `EVT-AMT-01` | Refund figure confirmed | Customer | Email, BimaKendra |
| `EVT-STL-01` | Refund credited | Customer | Email, WhatsApp, BimaKendra |
| `EVT-CPY-01` | Copy received & QC'd | Customer | Email, WhatsApp, BimaKendra |
| `EVT-CLS-01` | Closed | Customer | Email, WhatsApp, BimaKendra |

Event codes are shared across Financial and Refund; **template content is classification-specific** (`TPL-AMT-01-E-FIN` vs `TPL-AMT-01-E-RP`).

### 11.2 Overdue events
| Trigger | Recipients |
|---|---|
| `EVT-INS-02` (submission overdue) | Insurer POC + POC head + SH |
| `EVT-AMT-02` (refund figure overdue) | Insurer POC + POC head + SH |
| `EVT-STL-02` (settlement overdue) | Insurer POC + POC head + SH (Refund) / Customer + RM + SH (Financial) |
| `EVT-CPY-02` (copy overdue) | Insurer POC + POC head + SH |

### 11.3 Escalation model
Broadcast: every rung fires to the same recipient set, marked in the subject as `[Escalation n/3]`. Follow-ups precede escalation (see §5.2).

---

## 12. Integrations & external actors

| Actor | Direction | Role |
|---|---|---|
| **Customer** | Reader + writer via BimaKendra portal | Sees queries, uploads docs, accepts/declines refund, pays premium, confirms endorsement receipt. |
| **BimaKendra** | Portal surface | Customer-facing UI (out of scope for prototype). |
| **BimaPlacement** | Handoff | Payment links generated here; child ticket `PAY-nnnn`. |
| **BimaEndorse Bot** | Automation | Fetches insurer mail, extracts quote, extracts payment link, extracts endorsement copy, surfaces insurer requests into Client Channel. |
| **Mail Bot** | Automation | Attaches insurer mails to tickets; sends manual-review low-confidence mails to the review queue. |
| **Insurer** | Reader + writer via email | Owns SLA-05, -06, -09, -12. Mail POC per insurer. |
| **RM** (Relationship Manager) | Reader + escalation recipient | Named on tickets, escalation recipient on customer-owned stages. |

---

## 13. Refund flow (deep dive)

### 13.1 Trigger
A ticket carries `refund: true` from its type master → `isRefund(t)` returns true → `seqOf(t)` returns the 7-stage Refund flow.

### 13.2 Stage progression
```
New / Unassigned              (SLA-01, 1 Min, system)
  ↓ auto-assign
Under Verification            (SLA-02, 4 BH, SE)
  ↓ Verify & submit to insurer
Submitted to Insurer          (SLA-05, 1 WD, insurer)
  ↓ Log insurer acceptance
Awaiting Refund Details       (SLA-12, 2 WD, insurer)   ← new refund-only leg
  ↓ (SM logs insurer's refund figure)
  ↓ (client accepts refund) — sim advances stage
Awaiting Endorsement Copy     (SLA-09, 3 WD, insurer)
  ↓ (insurer sends UTR + endorsement copy) — sim advances stage
Copy Received                 (SLA-11, 1 BH, SE)
  ↓ Pass QC (send to client, DO NOT close)
Copy Received (still)         — Next Action card now offers "Simulate: Client Confirms"
  ↓ Client confirms receipt
Closed
```

### 13.3 Refund & Payment tab
Gated until `atOrPast(t, "Awaiting Refund Details")`. Five sub-sections keyed off `t.stage` + `t.refund`:

1. **Refund details from insurer** — waits, then reveals `amount / insurerRef / confirmedOn`.
2. **Client consent** — awaiting → accepted / declined.
3. **Payment & endorsement copy** — with insurer → credited (UTR + payment date + endo file).
4. **QC on Overview** — "Go to Overview to QC" navigates to Overview so the SM eyeballs the copy.
5. **Client confirmation** — awaiting → confirmed → Closed.

Rejected branch (client declines): flow halts, secondary "Reopen for consent" available.

### 13.4 Sim ladder (Refund tab + Next Action card)
| Where | When | Advances |
|---|---|---|
| Simulate: Insurer confirms refund | Awaiting Refund Details, no amount | `t.refund.amount` set (no stage change) |
| Simulate: Client Accepts | Awaiting Refund Details, amount in | Stage → Awaiting Endorsement Copy |
| Simulate: Client Rejects | Awaiting Refund Details, amount in | `t.refund.step = "rejected"`; no stage change |
| Simulate: Insurer sends UTR + copy | Awaiting Endorsement Copy | `t.refund.utr/paymentDate/endoCopyFile` set; `attachCopy` sets `t.endo` and advances to Copy Received |
| **Pass QC** (Overview) | Copy Received | QC + send to client; **does not close** for refund |
| Simulate: Client Confirms | Copy Received, qcDone + sends | Stage → Closed; `t.refund.clientConfirmed = true` |

Every sim button appears on both the Refund tab step card AND the Next Action card, wired to the same handler pair (`onRefund` + `onAdvance`/`onAttachCopy`). Both surfaces stay in lockstep.

### 13.5 Refund details on Overview
Once `t.refund.amount` exists, Overview renders a Refund details section between Captured at Ticket Intake and Endorsement copy — `amount / insurerRef / confirmedOn / utr / paymentDate`. Chip flips from "confirmed" (amber) to "credited" (green) when UTR arrives.

---

## 14. Client Channel — insurer requests

### 14.1 Model
The insurer can hold the ticket by requesting a document / detail at any stage from Submitted-to-Insurer through Copy Received. These arrive on the ticket as `t.insurerQueries[]`:
```jsonc
{
  "id": "IQ-1",
  "at": 0.5,                          // hours ago (prototype)
  "question": "Please share the client's current GST certificate…",
  "doc": "GST certificate",           // optional; the specific doc requested
  "status": "pending" | "answered_by_sm" | "forwarded_to_client" | "closed"
}
```

### 14.2 SM's two response paths

**A. Answer & send to insurer** (SM has the detail on file, e.g., GST cert)
- Inline textarea.
- **Choose document** button → right-slide drawer listing `docsOf(t)`. Pick one to attach.
- Fallback in drawer footer: "Ask client for this document" — closes drawer and drops to path B.
- Send to insurer → status `answered_by_sm`, answer + attachment recorded.

**B. Ask client for this** (details only with the client, e.g., Voter ID)
- Creates a mirror SM→client query (`t.queries[]` entry with `forwardedFrom: <iqid>`) and moves the ticket to Awaiting Customer Information via the standard query path.
- Filtered out of the main client-queries list to avoid duplication.
- When the client replies on the portal, the reply nests inside the same insurer-query card ("Client responded" chip) with a **Send response to insurer** button that closes the loop.

### 14.3 Red dot
`Client Channel` tab shows the red dot until the SM opens it AND clears the pending insurer request.

---

## 15. Manual Review queue

- Populated by the mail bot when confidence < threshold or attribution fails.
- Reason codes: R1 (low confidence, no linkage) · R2 (ambiguous linkage) · R3 (classification failed) · R4 (policy not found) · R5 (policy not active) · R6 (sender unrecognised) · R7 (critical extraction failed) · R8 (out of scope).
- Two paths: **Create Ticket from mail** (prefills client / type) OR **Assign to Existing Ticket** (nested modal with a wide MenuCard picker). The mail vanishes from the queue only when a ticket exists / is linked.
- Manual Review escalation: 8h → Endorsements Head (Umesh Bagri), title "Endorsements Manager Notified".

---

## 16. Edge cases

1. **Settled ≠ confirmed amount (refund)** — block save until a mismatch reason is entered. Audit.
2. **Withdrawal attempted after refund stage 4** — hide the action; don't disable.
3. **Beneficiary last-4 mismatch against cancelled cheque** — warn, allow override with audited reason.
4. **Copy arrives before settlement (refund)** — currently blocked by the sequence; §18 open.
5. **SLA due lands on a holiday** — recompute forward.
6. **Insurer never credits (refund)** — Esc-3 exhausts; needs a parked state (§18).
7. **Classification wrong at intake** — correctable only pre-Submission; audited.
8. **Terminal off happy path** — panel shows stages completed to that point, then the terminal stage. Do not render unreached happy-path stages as pending.
9. **Insurer query on a ticket already in Awaiting Customer Information** — insurer request appears alongside the existing client query; both open in parallel.
10. **Payment mismatch** — `revertPayment` returns the ticket from Awaiting Endorsement Copy back to Awaiting Payment, banks the leg, records the mismatch reason.

---

## 17. Copy & tone conventions

- **Units**: `1 Min` / `4 BH` / `24 CD Hrs` / `2 WD`. Abbreviations take a period (`Min.`, `Hrs.`), full words don't (`Day`, `Days`).
- **No em dashes** anywhere in UI copy.
- **Next Action copy** — under 10 words, plain language, present tense.
- **Buttons** — label-only (no icons) unless the Figma explicitly specifies.
- **Confirmation modal** — one line: "This action will move the ticket to the next stage and this cannot be undone. Are you sure you want to proceed?"

---

## 18. Open questions

### 18.1 From the original OPEN-QUESTIONS.md (still open)
1. **FR-095 / BR-039** — auto-close vs QC gate. Client wants gate; PRD unchanged.
2. **Policy master** — no live source; `fetchPolicy` is a fixture. Owner: BKTech.
3. **SLA-02 duration** — master (4 BH) vs earlier PRD (2 h). Master wins; PRD stale.
4. **Pod-vs-owner contradiction** — END-1048 / END-1062 seed data disagree. Confirm mapping rule.
5. Nine unfixed defects (`hold` semantics, missing legs on raiseQuery/receiveReply, fabricated payment record, create() dropping intake, `used` mixing clocks, revertPayment deletes leg, breach unrecoverable, StageList reads first leg, misc).

### 18.2 Refund flow — carry from the knowledge-centre spec
1. **5 WD spread** — is 5 WD the whole refund section or crediting alone? Prototype default: section total, split 2 WD (Awaiting Refund Details) + 3 WD (Awaiting Endorsement Copy).
2. **Copy before settlement** — allow attach any time after amount confirmation; hold closure until both. Currently gated by sequence.
3. **Short credit** — record with an audited reason or block closure? Prototype: record with reason, don't block.
4. **After Esc-3 on insurer stages** — parked state, weekly cadence. Not modelled.
5. **Refund stage naming convention** — "Awaiting refund computation" / "Awaiting refund credit" vs the shorter names in use. Panel convention is "Awaiting X" when waiting on external party; stages 4 & 6 are insurer-owned, so the pedantic names would be "Awaiting refund computation" and "Awaiting refund credit". Held with the shorter names as the master.

### 18.3 New from the recent rebuild
1. **Refund type = Financial with `refund: true`** — needs formal recording in DATA-MASTERS (currently the doc says "Return-Premium offered but blocked at creation, not modelled" — that's stale as of the refund-flow commits).
2. **`kind` enum** — commit to `Financial | Non-Financial` at the classification level, treat Refund as a display tag. DATA-MASTERS still lists "Return-Premium" as a third value in places.
3. **NEXT_ACTION_TAB map** — codify per-stage which tab owns the next action. Currently only in code (§9.5.9).
4. **Insurer request stages** — should the insurer be able to raise an `insurerQuery` before the ticket is Submitted? Prototype allows it; PRD hasn't ruled.
5. **Refund tab gate** — currently opens at `atOrPast("Awaiting Refund Details")`. Should Client Consent flip stage → Awaiting Endorsement Copy the moment consent is recorded, or wait for the insurer's payment call? Prototype: flips immediately.
6. **Reports** — Umesh-only right now (`role === "Claims & Endorsements Head"`). Confirm access model for Ops Head / Service Head when they exist.
7. **Tab red-dot** — mixes two signals (unread work + next-action hint). Confirm both should render as the same red dot, or split visual language.

---

## Appendix A — Roster & fixtures

### A.1 Portal users (prototype)
| Email | Name | Role | Envs |
|---|---|---|---|
| `nanditha.p@bimakavach.com` | Nanditha P | Servicing executive | BimaEndorse |
| `ruksana.khan@bimakavach.com` | Ruksana Khan | Claims manager | BimaClaim |
| `umesh.bagri@bimakavach.com` | Umesh Bagri | Claims & Endorsements Head | BimaEndorse + BimaClaim |
| `salvi@bimakavach.com` | Salvi Vaishya | Placement Executive | BimaPlacement |
| `himani@bimakavach.com` | Himani | Placement Head | BimaPlacement |

Password: `pass-word`.

### A.2 Seed tickets (BimaEndorse)
`END-1041` (Nanditha, Under Verification, Non-Financial) · `END-1043` (Nanditha, Under Verification, Non-Financial, breached) · `END-1048` (Rahul K, Submitted to Insurer, Non-Financial) · `END-1050` (Nanditha, Closed) · `END-1062` (Nanditha, Awaiting Payment Link, Financial) · `END-1063` (Rahul K, Awaiting Payment, Financial) · `END-1065` (Rahul K, Awaiting Endorsement Copy, Financial) · `END-1066` (Nanditha, Under Verification, Financial, has two seeded insurer requests: GST cert + Voter ID) · **`END-1069`** (Nanditha, Awaiting Refund Details, Refund — the anchor for the refund flow demo).

### A.3 Assignment mapping (Pod)
- Pod A (Nanditha P): ICICI Lombard, Bajaj Allianz.
- Pod B (Rahul K): Chola MS, IFFCO Tokio, HDFC Ergo, TATA AIG.
- Fallback: SM Head.

---

_Last synced with `main` at commit `7e475de` (body-text ramp collapse). Next diff to feed back into PRD: whatever ships next._
