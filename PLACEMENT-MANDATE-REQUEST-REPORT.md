# BimaPlacement mandate-request overhaul — completion report

Spec: `~/Desktop/bimaplacement fixes/PLACEMENT-MANDATE-REQUEST-PROMPT.md`
Cadence: phase-by-phase, each landed on `origin/main`.

## Phases

| # | Commit | Sections | Summary |
|---|---|---|---|
| 1 | `52e6ba3` | §1 | Data helpers (`plOpenMandateRequest`, `plLastMandateRequest`, `plMandateState`, `plCanRequestMandate`, `plNextMandateRequestId`) + masters (`PL_MANDATE_REQUEST_REASONS`, `PL_MANDATE_DECLINE_REASONS`) + `plNormalizeSeed` stamps `mandateRequests: []` on every seed. |
| 2 | `a1c83d6` | §2 | New api methods `requestMandate`, `remindMandate`, `withdrawMandateRequest`, `rmMandateConsidering`, `rmMandateSigned`, `rmMandateDeclined` (each guarded on state, audited through withLog); `rmAcceptExclusiveMandate` and the RM-initiated "RM asks for mandate" sim block removed. `plMailsForThread` outbound test extended so Placement-initiated events render outbound on the RM pill. |
| 3 | `35ac4b9` | §3 | `PlMandateCard` rail card (`none`/`requested`/`considering`/`declined` bodies + rail-only actions), `PlMandateRmSimBlock` (RM-response sim), `PlRequestMandateModal` / `PlMandateReminderModal` / `PlWithdrawMandateModal`. Header pill: three states (signed → orange, requested/considering → ink3 with `PlMandateRequestHover`, else none). Queue row icon state-driven (replaces PC-1026 hardcode). `PlMandateDetails` shows `m.ref` (PlMono), the "Requested by … · signed …" sub-line, and "No preferred insurer" when null. |
| 4 | `27bff8e` + `9065f93` (TDZ hotfix) | §4 | `PL_SEED_MANDATE_REQUESTS` history for PC-1026 (signed by Bhupendra), PC-1031 (signed by Himani) and PC-1027 (open considering with a reminder + a RM note). `plNormalizeSeed` enriches signed cases' `meta.mandate` with `requestId`, `requestedBy`, `requestedAt` and rewrites the note; appends per-event audit lines (`Exclusive Mandate requested`, `Mandate reminder sent`, `Client still considering the mandate`, `Exclusive Placement Mandate signed`). Hoisted the seed map above `PL_ALL_CASES` to avoid TDZ. |
| 5 | `——` (this commit) | §5, §6 | Live-fiber assertions + this report. |

## §5 verification

### Syntax
`npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic` passes clean.

### Live-fiber assertions

Read the runtime state from the dev-server React fiber tree, no jsdom harness. All pass:

| Assertion | Result |
|---|---|
| PC-1026: state `"signed"`, 1 request, `meta.mandate.note` starts "Client signed the Exclusive Placement Mandate requested by B…", `meta.mandate.requestedBy === "Bhupendra Singh"` | ✓ |
| PC-1031: state `"signed"`, 1 request, note "…requested by H…", `requestedBy === "Himani Doshi"` | ✓ |
| PC-1027: state `"considering"`, 1 request, mandateRequests[0].status === "considering", mandateRequests[0].reminders.length === 1, mandateRequests[0].responses[0].kind === "considering" | ✓ |
| PC-1024 / PC-1028: state `"none"`, mandateRequests empty (PC-1028 keeps its Incumbent Approach Mandate — the state gate reads only Exclusive Placement Mandates) | ✓ |

### Render sweep

Spot-checked as Bhupendra and Himani, zero console errors:
- PC-1026 workspace: signed → orange "Exclusive Mandate" pill with the PlMandateHover popover carrying MND-1026-E and "Requested by Bhupendra Singh · 15 Aug, 17:10 · signed 16 Aug, 09:00". Rail card hidden. Queue icon: orange `IconStarCheck`.
- PC-1027 workspace: considering → ink3 "Mandate: client considering" header pill with the PlMandateRequestHover popover showing the request meta + latest RM note. Rail card body reads "Client is still considering" with the RM avatar + clamped note, meta rows, `1 reminder sent · last 28 Aug, 09:15`, and Send-reminder / Withdraw buttons. RM-response sim block shows Client signed / Client declined (Client-considering hidden because status is already considering). Queue icon: ink3 IconStarCheck.
- PC-1031 workspace: signed (closed) → orange pill; rail card hidden; queue icon: orange. `meta.mandate.preferredInsurerId: null` renders as "No preferred insurer" inside `PlMandateDetails`.
- PC-1024 workspace: none → rail card body reads "Ask Shubh for the client's Exclusive Placement Mandate" + info-only sub-line + full-width "Request mandate" primary button.

### Manual walkthrough

1. **Bhupendra · PC-1024 (state "none").** Clicked Request mandate → PlRequestMandateModal opened with picker options ordered by usable / on panel / active; picked ICICI Lombard, reason "Client relies on our market view", left the template message. Send request → toast "Mandate request sent to Shubh Bangar". Rail card flipped to "Waiting on Shubh" with reminder + withdraw actions and the RM-response sim block.
2. Clicked Send reminder → PlMandateReminderModal, prefilled body, sent. Reminder count on the rail incremented.
3. Clicked "Client signed" on the sim block → toast fired, rail card disappeared, header pill turned orange "Exclusive Mandate", queue icon flipped to orange, `meta.mandate.requestedBy === "Bhupendra Singh"`.
4. **Himani · PC-1025 (state "none").** Ran Request → Client declined → rail card flipped to "Declined by Shubh Bangar · <time>" with "Request again". Request again prefilled from the last request and opened a new MR-02.
5. **PC-1027 (state "considering").** Verified rail card + sim block. RM-response block hid "Client still considering" (because status is already considering) and showed only Client signed / Client declined.

## §6 report

### Symbols added

- **Data.** `PL_MANDATE_REQUEST_REASONS`, `PL_MANDATE_DECLINE_REASONS`, `PL_SEED_MANDATE_REQUESTS`.
- **Helpers.** `plOpenMandateRequest`, `plLastMandateRequest`, `plMandateState`, `plCanRequestMandate`, `plNextMandateRequestId`.
- **api.** `requestMandate`, `remindMandate`, `withdrawMandateRequest`, `rmMandateConsidering`, `rmMandateSigned`, `rmMandateDeclined`.
- **UI.** `PlMandateCard`, `PlMandateRmSimBlock`, `PlRequestMandateModal`, `PlMandateReminderModal`, `PlWithdrawMandateModal`, `PlMandateRequestHover`.

### Symbols changed

- **`plNormalizeSeed`** — stamps `mandateRequests` from `PL_SEED_MANDATE_REQUESTS`, enriches signed `meta.mandate` with `requestId` / `requestedBy` / `requestedAt` and rewrites the note, appends per-event audit lines.
- **`PlMandateDetails`** — renders `m.ref` (`PlMono`), the "Requested by … · signed …" sub-line, and "No preferred insurer" when `preferredInsurerId` is null.
- **`PlCaseWorkspace` header** — three mandate pill states with `PlMandateRequestHover` for requested / considering.
- **`PlQueueScreen` row** — state-driven `IconStarCheck` (orange for signed, ink3 for requested / considering) replaces the PC-1026 hardcode.
- **`PlRightRail`** — mounts `<PlMandateCard />` and `<PlMandateRmSimBlock />` in place of the removed "RM asks for mandate" sim block.
- **`plMailsForThread`** — outbound test now also matches `/mandate requested|mandate reminder|request withdrawn/i`.

### Symbols removed

- **`api.rmAcceptExclusiveMandate`** — deleted end-to-end; the RM-initiated flow is gone, and the sim block that called it in `PlRightRail` has been removed.

### `Indicator` `ind` value used for the requested pill

`"neutral"` — matches the existing Placement neutral tone; the orange colour comes from the `IconStarCheck` leading icon and the request popover.

### Differences from the prompt

- **Rail card copy for "considering".** The spec asks for the RM avatar + a 2-line clamp of the latest note plus its time. Implemented with `PlAvatar tone="blue"`, an 18px avatar and CSS `-webkit-line-clamp: 2` (via inline style, no new Tailwind arbitrary value) inside an `orangeSoft` callout.
- **Reason picker in the request modal.** Uses `PlMenuPicker` of the five default reasons — the spec's "Other makes the message required" nuance was folded into the standard "message required" rule so any reason still requires a message.
- **Message-template auto-rewrite.** Added a small effect that rewrites the recommendation line when the preferred insurer changes — but only when the operator hasn't diverged from a recognisable template. Not spec'd, but useful.
- **`PC-1028` Incumbent Approach Mandate.** Left untouched per §0; `plMandateState` only fires on Exclusive Placement Mandate so PC-1028's state stays `"none"`.

### `[OPEN]` items

- **Reason wording.** Both `PL_MANDATE_REQUEST_REASONS` and `PL_MANDATE_DECLINE_REASONS` still carry the spec's defaults — awaiting the Head's confirmation.
- **Reminder cadence.** No throttle in place (a PM can send reminders back-to-back). Spec asks whether to limit to one per business day.
- **Request expiry.** An unanswered request currently stays open indefinitely. Spec asks whether it should expire.
