# Business masters

Every list, number and label in the prototype traces to the client's master workbook (`Endorsement_master.xlsx`) or to the PRD. **Do not invent values.** If something is missing, say so.

---

## Wired in

### Product × Endorsement list — 14 products, 33 types

A verified finding worth preserving: **no endorsement type's mandatory fields or documents differ by product.** Across ~180 rows there were zero conflicts. So the master is stored as two tables, not a grid:

- `TYPES` — 33 types, each with `kind`, `fields[]`, `docs[]`
- `PRODUCTS` — 14 products, each an ordered list of the type names it offers

Every product carries an `Others` type: one mandatory free-text field, optional document.

Products: Fire & Burglary (20) · Marine Cargo (21) · Professional Indemnity (18) · Commercial General Liability (17) · Workmen Compensation (17) · Directors & Officers (16) · Cyber (11) · Errors & Omissions (9) · Trade Credit (5) · Crime (5) · Office / Package Policy (6) · Public Liability (5) · Engineering CAR/EAR/CPM (4) · Motor (2).

### SLA Master — SLA-01 to SLA-11

Statuses, allowances, units, owners, follow-up cadence, max follow-ups, three escalation levels and terminal actions, all verbatim. See `FUNCTIONAL-SPEC.md` §2 for the table. Codes are displayed in the UI.

### Working hours and holidays

Mon–Fri, 10:00–19:00 IST, 9 working hours per day, plus the eleven-date Keka 2026 holiday list.

### Ticket assignment parameters

Insurer → pod, round-robin within pod. Fallback owner is the Service Manager Head.

### Admin portal access — `PORTAL_USERS`

Added 2026-08-26. Who may sign in, and into which environment.

| Address | Name | Environment | Locked |
|---|---|---|---|
| `nanditha.p@bimakavach.com` | Nanditha P | BimaEndorse | yes |

**This is a list of one, and that is deliberate rather than complete.** The Figma
(`900:95161`) shows only Nanditha, so only Nanditha is wired — no other address was invented.
The moment a second person needs to demo, this table needs the real names, addresses, roles and
environments from the client.

`envLocked: true` means the user holds one environment and the switcher is inert. An admin would
carry several with `envLocked: false`; **that case is not built**, only designed.

The shared demo password is `pass-word`, held in `PORTAL_PASSWORD`. It is not a business value and
does not belong to any master — it exists so the screen can be demonstrated.

### Manual review escalation — `MR_ESCALATION`

Added 2026-08-26, **from the design, not the workbook**. Figma `917:106299` shows "1 Que over 8Hrs ·
Escalated to Endorsements Head", and the Status column shows "Endorsements Manager Notified" against
Umesh Bagri.

| Key | Value | Source |
|---|---|---|
| `overH` | 8 | Figma copy — **not** an SLA row |
| `to` | Endorsements Head | Figma — **not** in the `ESCALATION` ladder |
| `by` | Umesh Bagri | Figma layer name |
| `label` | Endorsements Manager Notified | Figma |

**None of this is in the master workbook.** The existing `ESCALATION` ladder has Service Manager
Head, Service Head, Insurer Head, Operations Head and Relationship manager — no Endorsements Head or
Manager. Confirm the role names and the 8-hour threshold before this reaches a client, or map them
onto the ladder that already exists.

### Servicing persona

The single persona is **Nanditha P**, Servicing executive, Pod A — she owns every seeded ticket and
is the subject of the `mine` / `team` scope filter. She was **Priya N** until 2026-08-26; the rename
followed the login design, which recognises `nanditha.p@bimakavach.com`. One person from the login
screen through to ticket ownership.

---

## Partially wired

**Payment configuration** — the tab exists with headers only, so per-insurer mode and link expiry are currently invented in `INSURERS` (`payMode`, `linkExpiryH`). Flag this whenever payment behaviour is discussed.

**Notification event map** — 43 rows across Email / WhatsApp / BimaKendra / TMS. Roughly eight are modelled, all email. WhatsApp and BimaKendra are absent entirely.

**Document repository** — the master defines allowed formats, max size, multiple-file rules, provided-by, collected-at-stage, customer and insurer visibility, sensitivity and a 7-year IRDAI retention rule. The prototype uses only the document *names*. Versioning, size and format validation, and visibility are not built.

**User role master** — a full V / A / A* permission matrix for Customer, SM, SH, Ops and Admin. The prototype has one persona and no enforcement. The login recognises an address; it does not grant or check a role.

### Brand assets — `INSURER_LOGO`, `PRODUCT_ICON`

The client's own insurer wordmarks and product rosettes, from `Public/Insurance.Comp` and
`Public/Prod.Icon`, keyed to the `INSURERS` and `PRODUCTS` masters and inlined as data URIs.

Not every key has a file. **Kotak General** has no wordmark; **Trade Credit**, **Errors & Omissions
(E&O)**, **Public Liability** and **Motor** have no rosette. Those fall back to a lucide glyph rather
than borrowing a near-neighbour — *Product Liability* is not *Public Liability*, and standing one in
for the other would put the wrong cover on a ticket. Send the missing five and they drop straight in.

### Sample tickets — `SEED`

Seven demo tickets, not a client master. **A seeded ticket's `legs` must be a complete walk of its
flow up to its current stage**, because `seedTrail` replays the trail from them — a gap shows up as a
ticket that teleported. END-1050 was missing its `Awaiting Endorsement Copy` and `Copy Received` legs,
so its trail read *"Submitted to insurer after 1d 0h: Closed"*; both were added.

---

## Assumed — needs confirming

**Insurer cycles is a derived display counter, not a master figure.** `insurerCycles(t)` counts the
legs whose stage owner is `insurer`, plus one if the ticket is sitting on an insurer clock now. It
answers "how many times has this gone back to them", which is what the design's counter asks for, but
the definition is mine — the workbook does not define a cycle. Customer cycles is simply the query
count, which is unambiguous.

**Bot confidence is not held per ticket.** The design's third header counter reports it; the prototype
only scores an extracted **quote** (`quote.confidence`, financial tickets) and a payment link. Rather
than invent a figure for non-financial tickets, that slot shows **Mandatory intake** — fields plus
documents required by the endorsement type, against what has arrived. Bot confidence still appears
where the real number lives, on Premium & payment.


**Classification is not a column in the Product × Endorsement tab.** The values in `TYPES[*].kind` were assigned by judgement:

- **Financial** — Sum Insured / Limit Enhancement · Asset Addition · Employee / Headcount Addition · Location Addition / Deletion · Risk Location Addition / Deletion / Change · Policy Period Extension / Reinstatement · Subsidiary Addition / Change · Trade Credit Buyer Addition · Marine Certificate Issuance · Coverage Wording addition
- **Return-Premium** — Refund - Excess Premium · Policy Cancellation · Policy Cancellation + Refund · Employee / Headcount Deletion · Asset Deletion
- **Non-Financial** — everything else

Several are genuinely arguable. *Location Addition / Deletion* is one type doing two opposite things. *Coverage Wording addition* may or may not carry premium. This column belongs in the sheet.

**Two documents were space-joined in single cells** — "GST certificate Certificate of Incorporation" and "Cancelled cheque Payment screenshot". They were split against the Document Repository names. A delimiter in the source would make that safe rather than inferred.

**Return-premium types are offered but blocked at creation**, with the reason shown, since that flow is PRD Appendix A.1 and not modelled.
