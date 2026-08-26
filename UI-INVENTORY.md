# UI inventory

What exists, what it renders, and why it looks the way it does. The reasoning matters: several decisions were made against an obvious alternative and reversing them without knowing that is a regression.

---

## Login

The front door, from Figma `900:95161`. A light page, a purple panel inset, and one white card
centred in it — a deliberately different frame from the console, so signing in reads as crossing a
threshold rather than changing tab.

- **Header** — "Log in" in `brand` at 30/600. Once the address is recognised, the user chip
  (avatar · name · address) and the environment lockup (`Bima` + `Endorse` in `accent`) appear to
  its right. The chip is absent until then; nothing is reserved for it.
- **`LoginField`** — Peetal's `interactive.input/alphanumeric`: label with a red mandatory marker, a
  **bottom-ruled** field (no box), a suffix stack (clear · help · divider · eye · validation tick),
  and a right-aligned help line. Three states: idle grey · success `brand` on a 2% purple wash ·
  error `#F10000` on a 2% red wash. The help row occupies 28px whether or not it has text, so the
  form never jumps when an error appears.
- **Environment switcher** — rendered in the disabled token for Nanditha, because she holds one
  environment. It states why on hover rather than sitting mute.
- **Button** — three states, per Peetal `button/primary.fill`: disabled grey → enabled `brand` →
  loading, which is `brandBg` with a spinner and no label.

States it must render: idle · address recognised · address unrecognised · password wrong ·
password revealed · submitting. The unrecognised-address state is the one the Figma does not show —
it reuses the error treatment and says "Not a registered admin address".

---

## Shell

Every view renders inside V001.1's frame: a neutral `canvas` page holding one floating white card, with a
sidebar on the left and a scrolling main pane on the right. This replaced a sticky top bar over a
`max-w-6xl` column. The top bar's four passengers were split — identity and navigation went to the
sidebar, actions to the breadcrumb.

- **`Sidebar`** — Figma `900:101884` (237px) and `900:102387` (92px). On neutral `canvas`, not the
  same `canvas` as the page. Top to bottom: the **BimaEndorse** lockup with the same inert environment control the
  login uses, the collapse toggle, a **deliberately disabled** search, the `Menu` label, four nav
  rows, the open ticket nested beneath My Tickets, the business-hours chip, and the profile card —
  avatar above name and role, sign-out top-right. Collapsed it becomes a **48px squircle**
  (`843:75701`): the rail's own 28px padding was crushing the card to 35×50, so the footer drops to
  20px there and the card and avatar are `shrink-0`.
  - **Active row is recessed grey `subtle`, not purple.** Purple means primary action; a nav row is
    not one. Idle rows are `figHint`, all at 14/600 with 24px icons.
  - **Reports is present and permanently disabled** — `rgba(169,172,177,0.48)`, `not-allowed`, no
    handler. It shows the destination exists without pretending it is built.
  - Collapsed, everything becomes a 36px square: search, each nav icon, the avatar. Labels drop to
    tooltips.
  - The collapse toggle is React state — V001.1 persisted this to `localStorage`, unavailable here.
  - No logo: neither this nor the login carries the BimaKavach mark, because neither Figma frame
    does. The ikkat survives as the page rule, not as a brand mark.
- **`Breadcrumb`** — sunken strip; current segment in `figInk`, ancestors in `figPlaceholder` and
  **clickable**, which is how a ticket is left. Its right slot carries the breached counter and Create
  ticket on every view except the ticket, where it becomes the `TicketPager`.
- **`PageHead`** — title, one line of orientation, then the ikkat rule **beneath the title row**. The
  `ruleFirst` variant (rule above the title) is no longer used: the breadcrumb already separates the
  page from the chrome, and a rule above cut the title off from what it heads.
- **`Greeting`** — Home only: avatar, clock, greeting, ikkat rule, at a tighter scale than V001.1's
  so the four metric tiles stay above the fold. **The clock shows `NOW`, not the wall clock.** `NOW`
  is pinned to 11:00 on the next working day and every deadline on screen derives from it; a live
  clock here would disagree with the countdowns inches below it.

---

## Views

### Home — triage

Figma `874:83640`. Reading order is deliberate: **greeting → Your Desk → Priority Cases.** Home
answers one question — *what do I do next* — and it only counts and links; it never mutates a ticket.

- **`Greeting`** — the desk clock and a greeting **in the user's own language**. Nanditha is
  Kannadiga, so she gets ಸ್ವಾಗತ, ನಂದಿತಾ. The string lives on the user in `PORTAL_USERS`, not in the
  component, because the next executive may need Tamil or Odia — Anek covers ten Indic scripts.
- **Your Desk** — two gradient `DeskCard`s (Critical & High on `error-subtle`, Pending Action on
  `caution-subtle`) beside three `DeskRow`s. The rows are **the three queues collapsed to a glance**:
  Overdue · Due Today · Freshly Assigned, each stating a count and opening a pre-set list.
- **Priority Cases** — every Critical and High ticket, **three at a time**, paged. Clicking the
  chevron slides the first three out of the container's width and brings the next in. Each card
  carries its status, id, client, type, classification and priority, the countdown, the participant
  stack, and `Take Action →` which opens the ticket.
- **`Participants`** — who is on the ticket *so far*, growing as it moves: owner from the start,
  insurer once submitted, client once asked something. Derived by `participantsOf`, never stored.
  Only Nanditha and Umesh have photographs; everyone else is an initials mark.

**Counts must equal their destination.** Each desk entry links through a slice that mirrors the
bucket it counted, so a row can never advertise a number the list then contradicts.

`TicketCard` and `Column` are **no longer used on Home** but remain defined — removing them is a
separate decision.

Empty states matter here — with a small working set a bucket is often zero, and Priority Cases falls
back to "Nothing Critical or High on your desk."

### My tickets — inventory

Figma `888:88939`. **The filters live in the column headings.** The split with Home is unchanged:
Home decides what to do next; My tickets holds everything and lets you slice it.

- **Pills, not tabs** — Needs attention (default) · All open · Closed & terminal · Recently worked,
  each with a count, sitting on the title row rather than under it.
- **Columns** — ID · Priority · Stage · Type · Client · Request · Stage due, at the widths from
  Figma `900:96152`: **100 · 100 · 200 · 132 · 200 · 250 · flex**. Stage due takes the remainder
  because it holds the longest string; Client is fixed because it holds one of the shortest. Five
  carry a chevron and open a multi-select menu; ID and Client do not. Columns **shrink rather than
  drop**, so all seven stay on screen at laptop widths. **Age was removed**; **Owner returns only
  when Home's scope is `team`**.
  - **No border and no outer padding.** A stroke would cost ~26px of horizontal room the table
    cannot spare, so the header strip is a full-bleed rounded bar and the rows sit directly beneath
    it. Table text is **14px**.
- **Indicator** is the row's pill (Figma `900:96152`): a 4px dot and a 0.5px hairline carry the
  meaning, and **the label is always basic ink** — never the tone. Tokens are the Peetal semantic
  set: error · caution · info · neutral. Priority maps Critical→error, High→caution, the rest
  neutral; Type maps Financial→caution, Non-Financial→info, Refund→neutral; Request is always
  neutral; Stage derives from `statusOf` — outside party→info, terminal→neutral, still moving→caution.
- **No search here.** The sidebar's global field is meant to carry it — and is still an inert stub,
  so there is currently no working search anywhere. Recorded as a gap, not a feature.
- **Sort stands apart**, right-aligned above the table, replaced by the window control on
  Recently worked.
- Footer reads `4 of 7 tickets · filters applied` beside the pager, so a filtered view never looks
  like an empty queue.
- **Every row shows.** Paging only appears past 10 rows in a tab, which the current seed set never
  reaches. See `FUNCTIONAL-SPEC.md` §9.

### Ticket — two panels, five tabs

Figma `917:106239`. The seven-tab layout is gone. The screen is now a header, an ikkat rule, and two
panels: **left, the state of the clock and the record of who did what; right, the work.**

**Header** — id at 28/600 `brand`, then four indicator pills: status (`big`), priority, classification
and endorsement type (all `thick`). A *Correct type* link sits beside them and turns the type pill into
a select, unchanged: classification can only be corrected before the request goes to the insurer.
Below, the meta row — client, policy, product, insurer, owner — each as **text then mark**: the client's
own product rosette and insurer wordmark where we hold one, Nanditha's photograph for the owner, a
lucide glyph otherwise. It **spans the full header width on its own line**, below the title and the
actions, so five items stay on one line instead of wrapping under the buttons. **The pod is not
shown** — it belongs to the routing rule, not to the person, and the two disagree on two seeds; it
sits in the owner's tooltip with the rule that produced it. See `OPEN-QUESTIONS.md`. Right: the stage's **next action as a filled button** and *Mark Customer
Withdrawn* as a red outline, both in the **small variant** (`917:105586` - 14/10 padding, r10, 12px
SemiBold). The footer keeps the default size, as the frame draws it. The **participant stack rides the
right end of the meta row**, centred on it (`917:105560`), rather than stacking under the buttons.

The next action appears twice — filled in the header, outline in the Overview footer. Both are driven
by one set of predicates, so they cannot disagree, and the header copy keeps it reachable from every tab.

**Left panel** (523px, shrinks to 320)

- **`SlaCard`** — Figma `917:105652`. `SLA` and the code, then **whose clock it is named as a party,
  not a role**: `clockActor` resolves the stage's owner to Nanditha (with her photograph), the insurer,
  the customer, Operations or the product, and draws it with the audit trail's own `ActorMark` /
  `ActorName` — **the party alone**: the SLA code and its allowance move to the tooltip, because every
  stage row in the Workflow Stages drawer already carries them. Then the countdown at 18/600 in the
  state's tone, a 3px track,
  `{allowance} total • {elapsed} elapsed`, and the absolute start and due beside lucide's
  **`clock-fading`** in `figInk` — inlined, because lucide-react 0.469 predates that icon.
  *"· working hours only"* is gone: the SLA code already carries the unit. Renders **ok, at risk,
  breached, held and no-clock**; a held clock says which hold it is, and a stage with a 30 CD terminal
  rule says so.
- **Three `StatCard`s** — Mandatory intake (`n of m`, green complete / amber with gaps), Customer
  cycles, Insurer cycles. All three are derived; see `DATA-MASTERS.md`.
- **Alert rows** — silence, open query, breach, intake gaps, manual review, routing, awaiting an
  outside party, terminal. These outrank whichever tab is open, so they sit beside the clock rather
  than inside a tab. Manual review carries its *Resolve & resume* control.
- **`Drawer` — Audit trail** — Figma `802:65143`. The ticket's story, newest first. Each line is an
  orange ikkat mark, the sentence in `figInk`, its evidence beneath in `figTert`, and on the right the
  **actor's mark, name and how long ago** — `Nanditha P` with her photograph, `BimaEndorse` as the
  wordmark on a black serif *E*, `Customer` / `Operations` / `Notifications` on brand circles. Rows are
  parted by the **trail divider** (`964:119381`), a sparser, lighter ikkat than the page rule.
  Time is spelled out — *0 Mins Ago*, *22 Hrs Ago*, *3 Days Ago*. This replaces the Activity tab.
  - **Stage lines read `{stage} after {duration}`**, and name the destination only when it is
    terminal: *Copy received after 36m: Closed*. That is the sentence that ends a ticket.
  - **A seeded ticket replays its whole life**, so its trail reads like one that was worked rather
    than a list of legs. See `FUNCTIONAL-SPEC.md` §4.

**Right panel** — `TabBar` sitting **directly on** a `PanelCard`, no gap (`917:105780`): the active
tab's 2px rule meets the card's top edge. The body scrolls over a footer strip carrying that tab's
actions. The two panels follow the design's own proportion (`917:105649`): the 1388 panel, inset 24px
each side, splits **523 : 65 : 752**. It is reproduced as flex-grow `523`/`752` so the ratio holds at
any width, with the **65px gap fixed**; the left keeps a 320 floor and the right may shrink to 0, at
which point its tab row scrolls. At the widths the app runs, the right lands ~700px, so the six tabs of
a financial ticket sit on one line with ~160px to spare. Section titles are 18px.

| Tab | Body | Footer |
|---|---|---|
| Overview | `PhaseBar`, the **Workflow Stages** drawer, Captured at intake, Endorsement copy | note field + the blocked reason, *Ask the client*, *Log manually*, the next action |
| Document Vault | every document with status, filename, size, provenance | how the list is derived + *Upload* (stub) |
| Query Line | each query with its portal response nested on a `brand200` rule | *Ask a question*, disabled outside Under verification |
| Mail Trail | the whole trail, bodies open, 40px display-face avatars | message count, *Chase insurer*, *Summarise this trail* ⇄ *Read mail trail* |
| Premium & Payment | financial only — unchanged from the seven-tab layout | — |
| Manage Ticket | Reassign / Customer withdrawn cards, Reminders & escalation | *Reassign*. **Disabled and greyed on a terminal ticket**, which is the state the design draws |

- **`PhaseBar`** — one rule per phase: green closed, gold running, red if a leg ran over, grey ahead.
  A non-financial flow shows four phases, a financial one five. `PHASES` now groups the **actual**
  `FLOW` keys; before this change only two ever matched, so the strip was mostly empty.
- **`StageList`** (Workflow Stages drawer) — every stage of this ticket's flow with a dashed rail:
  closed stages struck through on sunken ground, the running one on `brand200` with `LIVE`, ahead
  outlined. Each row names **the party** — `stageActor` resolved through the same `ActorMark` /
  `ActorName` the trail and the clock use, at 16px — then `SLA code · allowance` and calendar time
  taken. Units read as words and capitalised: `1 Min`, `4 BH`, `24 CD Hrs`.
- **Mail Trail** no longer accordions. The design shows every body open, and the attachment chips
  come with them.

**Breadcrumb is the way back.** There is no Back button; `MY TICKETS` is a link and the right slot
becomes a `TicketPager` — the id with prev/next chevrons walking the desk in `riskSort` order.

**Below ~1300px** the design's 1388 panel no longer fits, so three things give way in order: the
gutter drops from 64px to 24px, the three stat cards wrap to two rows (all three shrink; none is
allowed to crush the others), and the tab row scrolls. The tab row is right-aligned by `ml-auto`
inside an `overflow-x-auto` container, so when it overflows the margin collapses to zero and it
scrolls **from the left** — the active tab is never the one that disappears.

**Controls that are not wired** say so on hover rather than pretending: the two `Download` icons, the
`Download` in `DocViewer`, and the Vault's `Upload`. `Upload` is additionally **disabled on a terminal
ticket**, so a read-only ticket offers no write control at all.

**Modals** — `DocViewer` and `QueryModal` have no Figma frame yet. They share `ModalShell` with
Upload, Withdraw and Reassign: r16, a title row with a close cross, a scrolling body, a footer on
sunken ground. All five portal to `<body>`.

### Manual review · Create

**Manual Review Queue** (Figma `917:106299` / `917:107326`) is a shared queue at nav level with a
count badge — not one person's work. Same table treatment as My Tickets: no border, no outer
padding, 14px, header on a `canvas` strip. **This queue is not filterable, so the headings carry no
chevrons.**

- Columns: ID 120 · From flex · Bot guess 150 · Review Condition flex · Age 100 · Status flex ·
  Actions 150. They shrink rather than drop.
- **Alert strip** in the page head: a `breachSoft` chip counting mails past `MR_ESCALATION.overH`,
  then "Escalated to {to}". Both derived — the count from `m.received`, the wording from the master.
- **Bot guess** is a chip naming **the client only** — the guess is stored as
  `"Vertex Pharma Ltd — 3 active policies"` and the chip shows the part before the em dash, the same
  split `claim` uses to prefill. The full string stays on hover. Brand purple on `rgba(65,0,207,.08)`
  with an `#E8E2FF` hairline, or a grey `N/A` when the bot had no confident match.
- **Age** turns `semError` once past the escalation threshold.
- **Status** is `-` until a mail is late, then Umesh Bagri's avatar and "Endorsements Manager
  Notified".
- **Actions** is a `Create Ticket →` button that opens the Create modal, prefilled from the bot
  guess, **over the queue** rather than over the ticket list.

**Create is a modal** over My Tickets (Figma `900:99062` / `917:104341`), not a page. Client ·
Policy Number · Insurer · Product · Priority · Endorsement Type in a two-column grid, then the
type's mandatory fields, then its documents as upload fields, then a progress bar and Create Ticket.
Type drives everything below it: classification shows live, and the fields and documents redraw.
Return-premium types are offered but blocked with the reason shown. Closing returns to the list
underneath, which never unmounts.

**`UploadField`** — Peetal `3316:80930`, four states rendered verbatim:

| State | Border | Fill | Says |
|---|---|---|---|
| default | 1px dashed `#1869F4` | white → `#EEF4FF` | Upload {doc} · click to browse or drag and drop |
| disabled | 1px dashed `#D2D5D8` | white → `#F4F5F6` | Unable to Upload {doc} · Please Refresh or Try Again Later |
| success | 1px solid `#00B200` | white → `#ECFBEA` | Successfully Uploaded! · {file} has been uploaded · Cancel and Upload again |
| error | 1px solid `#F10000` | white → `#FFECEC` | Upload Failed · {file} is larger than 2MB · Try Again |

The illustrations are the design's own, inlined at 88px. **The disabled artwork exported blank from
Figma**, so it is the error artwork desaturated — the same drawing, which is what the spec shows.
Replace it if a real export appears.

**Only default → success is reachable in the demo.** There is no real file handling, so clicking a
dropzone always succeeds. `disabled` and `error` are built and styled but nothing triggers them.

**Field behaviour in the modal.** Every field's cross clears it back to idle — the underline returns
to `line`, the tick greys, the cross disappears and the progress bar drops. Single selects hide the
native chevron (`appearance-none`) so **the cross is the only control**, and a cleared select shows
a `Select …` placeholder. A cleared required field disables Create Ticket.

**Portalled modals now carry the font.** `Overlay` sets `fontFamily` because it renders into
`<body>`, outside the root that declares Anek — every modal was falling back to the system stack.

---

## Components and their states

Every component below renders more states than a static screen shows. A redesign that handles only the happy state is incomplete.

| Component | States it must render |
|---|---|
| `SlaCell` | ok · at risk · breached · on hold · closed; insurer-owned variant; absolute deadline line |
| `SlaBar` | proportional overrun (track scales to the larger of allowance or elapsed) · at risk · held · SLA code + allowance label |
| `TicketCard` | 4 priorities · 2 classifications · 5 channel sources · silent · docs pending · team scope |
| `TableRow` | as above, plus Critical row tint and progressive column hiding |
| `Journey` | 5 phases, collapsed and expanded; system and insurer markers; per-stage overrun |
| `Panel` / `Collapsible` | with and without count, hint, action, badge; empty |
| `KindTag`, `PriorityTag` | Financial / Non-financial; Critical / High / Medium / Low, hot vs muted |
| `Metric` | four tones; zero values — **unused since the Home redesign** |
| `DeskCard` | singular vs plural count; one pill vs two |
| `DeskRow` | error · brand · success tone; zero count |
| `PriorityCases` | one page vs many; pager hidden at ≤3; empty |
| `Participants` | one mark (owner) · two (＋insurer) · three (＋client) |
| Modals | `DocViewer` · `QueryModal` · `UploadModal` · `WithdrawModal` · `ReassignModal` — each with a disabled-until-valid confirm. All five render through `Overlay` (portalled to `<body>`) |
| `Create` modal fields | idle · filled · cleared-by-cross · select with placeholder |
| Manual review row | matched vs unmatched bot guess · within vs past the escalation threshold · with and without a notified status |
| `Sidebar` | expanded (237) · collapsed (92) · active · idle · **disabled (Reports)** · Manual Review count badge · nested open ticket · disabled search |
| `Breadcrumb` | one segment and two · with and without the breached counter |
| `PageHead` / `Greeting` | with and without a right slot; long titles truncate |
| `LoginField` | idle · success · error · masked and revealed · with and without a clear button |
| `Login` button | disabled · enabled · loading |
| `HeaderFilter` | closed · open · with and without a selection badge · long option lists scroll |
| `StagePills` | selected · idle, each with a count, wrapping at narrow widths |
| `SortControl` | closed · open · replaced by the window control on Recently worked |
| `Pager` | single page (both arrows disabled) · first · middle · last |
| `DotPill` | filled (priority, stage) · outlined (type, request) · truncating on a long label |
| `StageDue` | ok · at risk · breached · held · closed |

---

**Ticket screen** (`917:106239`)

| Component | States it renders |
|---|---|
| `SlaCard` | ok · at risk · breached · held (manual review / open query) · no clock · clock stopped · 30 CD terminal note |
| `StatCard` | complete (green) · gaps (amber) · plain count |
| `PhaseBar` | closed · running · over-run · ahead; four phases non-financial, five financial |
| `StageList` | closed (struck, sunken) · running (`brand200`, LIVE) · ahead (outlined) · over-run (error) · no clock |
| `StageCheck` | done (filled tick) · now (filled dash) · next (outlined) |
| `Drawer` | closed (chevron) · open (close cross) |
| `TabBar` | active (`brand` tint + 2px rule) · idle (`greet`) · disabled (`figDisabled`); 5 tabs, 6 on a financial ticket |
| `PanelCard` | with footer · without footer |
| `TicketPager` | first · middle · last (each end disables its chevron) |
| `Mark` / `Participants` | owner (photograph) · insurer · client, stacked at −6px; **hover isolates** — the hovered mark holds full opacity and gains the brand glow, the rest fall to 10%, and a `Tip` above names it |
| `Tip` | tooltip on a recessed ground, arrow beneath, anchored right so it grows leftward and never leaves the panel |
| `ModalShell` | with footer · without · any tint |

## Decisions worth knowing before you change them

**The SLA reads differently in three places, on purpose.** A pill with a countdown *and* an absolute deadline in tables and cards; a proportional bar with the code and allowance in the ticket header. A countdown answers "what do I touch next"; a deadline answers "when do I do it". Showing both everywhere was noisy.

**The overrun bar scales.** A breached bar fills to 100% in most systems, which cannot distinguish one hour late from nine working days late. Here the track scales to elapsed, the allowance shows muted, the overrun shows red, and a tick marks the boundary.

**Eleven statuses do not fit on a strip.** `Journey` groups them into five phases with a "Now — status · step 7 of 11 · operations owns the next move" line, and the full stage table behind an *All stages* toggle. The trade-off: the current status is no longer found by scanning the sequence. That was accepted.

**Priority led every row** — full-height colour bar, uppercase tag, Critical rows tinted, Medium and
Low greyed. **Reversed on 2026-08-26** to match Figma `888:88939`: priority is now a dot-pill in the
second column, with no bar and no row tint. The pill keeps the tone (`PRIORITY[p].color` / `.bg`), so
Critical still reads red — but a Critical row no longer announces itself before you read it. This
cost scanning speed deliberately, on design direction; reinstating the tint is a one-line change in
`TableRow`.

**Blocked controls state their reason** rather than merely disabling. Disabled with no explanation is the single most common complaint about internal tools.

**Demo controls are visually secondary and labelled ▶.** They simulate external actors. Making them look like primary actions would misrepresent the product in a stakeholder session.

**Purple is chrome; it never states status.** Primary action buttons moved from teal to `brand`, which
freed teal to mean only what the tone table says it means — healthy, verified, complete. Selection and
attachment states (a chosen document chip, a picked file) were left teal deliberately: they read as
confirmation, not as the page's main action. Worth revisiting as one decision, not piecemeal.

---

## Known rough edges — fair game

- Queue columns are fixed-width and scroll horizontally; below ~1400px the third column is often
  half-visible. Kept deliberately in the V001.1 pass — restyled, not relaid-out.
- Mobile collapses everything to a single stack; nothing has been designed for that width.
- The document preview is a placeholder page of grey bars.
- `Recently worked` cards duplicate a subset of `TableRow` information in a different shape.
- Toast is a single fixed-position string with no queueing.
- No focus-visible styling, no keyboard navigation between queues.
- Colour is doing all the work in the SLA states; there is no non-colour redundancy for accessibility.
- The Type column in the ticket table is narrow enough that `Non-financial` can wrap to two lines.
- On a terminal ticket the header SLA block collapses to the word `CLOSED` in an otherwise empty
  container — it reads as broken rather than finished. Pre-existing; queued for the Detail pass.
- **Resolved 2026-08-26:** Create ticket no longer appears twice. The breadcrumb is now the permanent
  top bar — breached count and Create Ticket, on every view — and the page head carries the stage
  pills instead.
- `lucide-react` 0.469 has no `list-sort-descending`; the sort control uses `ArrowDownWideNarrow`,
  its nearest glyph. Upgrading lucide would let the exact icon in.
- The Create modal shows **no "Auto-Filled!" or "Also Found on Bima Kendra" helpers**. The design
  fills Insurer and Product from the Policy Number, but there is no policy master to look them up
  in — faking it would be inventing business data. Insurer and Product stay user-chosen. Give us a
  policy master and the auto-fill is straightforward.
- **Claiming a mail removes it from the queue immediately**, before any ticket is created. Dismiss
  the Create modal and the mail is gone with nothing to show for it. Pre-existing — the old Create
  page lost it the same way on Back — but a dismissible modal makes it far easier to hit. The fix is
  to remove the mail in `create` rather than in `claim`; that is a mutator change, so it is flagged
  rather than taken.
- Below roughly 1200px the table columns compress hard and labels truncate. They shrink rather than
  drop so nothing disappears, but the design assumes ~1388px of content width.
- The Figma gives **both** login fields the placeholder "Enter Email Address". The password field
  says "Enter Password" here — read as a copy slip in the design, not a decision. Worth confirming.
- The sidebar footer renders `ROLES["Nanditha P"].role` — **"Servicing executive"**. The Figma says
  "Service Executive". The master wins over a Figma label for business data, so the master is what
  ships; change `ROLES` if "Service Executive" is the real title.
- The Figma sidebar draws no count badge on Manual Review. The badge is kept here, because the
  number is real and dropping it would hide work.

Reduced motion **is** handled: `prefers-reduced-motion: reduce` collapses every animation to ~0.
