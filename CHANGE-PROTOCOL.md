# Change protocol

---

## Before you start

1. Confirm the active role. Default is **UI Supervisor**. If the last few messages have been product direction rather than design direction, ask in one line.
2. Read `FUNCTIONAL-SPEC.md` if you have not this session.
3. Name the components you intend to touch, using `UI-INVENTORY.md`, and say so before editing.

## While you work

**Small, verifiable edits.** Prefer a targeted string replacement over rewriting a component. A single edit that touches four components is hard to review and hard to revert.

**Do not reflow unrelated code.** No reformatting, no reordering imports, no renaming for tidiness. Diff noise hides regressions.

**Preserve every state.** Before changing a component, list the states it renders (`UI-INVENTORY.md` has them per component) and confirm each still renders afterwards.

**When a UI change needs a behavioural one, stop.** Say which rule is in the way and what the options are. Do not quietly widen a permission, remove a guard, or change when a control is enabled.

**Do not delete demo controls.** The `▶` controls simulate external actors and are how the prototype is demonstrated.

---

## Verification — every time

**1. It compiles.**

```bash
npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic
```

**2. Behavioural checklist** — walk this after any change that touches a shared component:

- [ ] Home shows Your Desk (2 cards + 3 collapsed rows) and Priority Cases paged 3 at a time; all five desk entries deep-link into pre-set lists, and **each count equals what clicking it opens**
- [ ] A Critical ticket is visually distinct in every list it appears in
- [ ] SLA states render in all five forms: ok, at risk, breached, held, closed
- [ ] Deadlines still respect BH / WD / CD / MIN — a `1 WD` ticket and a `24 CD` ticket show different maths
- [ ] The ticket screen renders header · rule · a narrow left rail (stage-timeline clock + three metric counters) · a wide Action Panel; the primary stage action lives in one **persistent Action Panel footer** shown on every tab (there is **no** action button in the header)
- [ ] `PhaseBar` shows four phases on a non-financial ticket and five on a financial one; `StageList` lists every stage of that flow with owner, SLA code, allowance and time taken
- [ ] The **Ticket Trail** tab shows the audit history; Workflow Stages opens and closes; the breadcrumb and the ticket pager both navigate
- [ ] Blocked controls still state their reason
- [ ] Submit is blocked with intake gaps or an open query; Close is blocked until copy + QC + sent
- [ ] **Every open ticket walks to `Closed`** — the three stages that need an outside party carry a ▶ control
- [ ] No stage name appears in code that is not one of the ten keys in `FUNCTIONAL-SPEC.md` §2
- [ ] Stage pills are not all one colour: blue, amber, pink, green and grey each appear where §2 says
- [ ] Raising a query moves the ticket to Awaiting Customer Information; a portal response returns it to Under Verification
- [ ] Terminal tickets render read-only with no action controls
- [ ] Financial ticket shows the Premium & Payment tab; non-financial does not. Manage Ticket is greyed on a terminal ticket
- [ ] Every action still writes a history entry, **through `TRAIL`** — no inline history strings
- [ ] A seeded ticket and a driven one word the same event identically; every seed's `legs` walk its flow without a gap

**3. Say what you changed and what you did not.** One short paragraph. If you noticed something wrong but out of scope, name it rather than fixing it.

---

## Mode switching

| Trigger | Effect |
|---|---|
| *"switching to Product Owner"*, *"PO mode"*, *"as Product Owner"* | Behavioural changes permitted. `FUNCTIONAL-SPEC.md` must be updated in the same change |
| *"back to UI"*, *"as UI Supervisor"*, or a return to visual direction | Behaviour frozen again |
| Ambiguous | Ask. Never assume the wider permission |

In Product Owner mode, also update `OPEN-QUESTIONS.md` when a decision closes one, and `DATA-MASTERS.md` when a master changes.

---

## Definition of done

- Compiles clean
- Behavioural checklist walked
- No state left unrendered
- No business value invented
- Docs updated if behaviour or masters moved
- Change summarised in a few lines, with anything deferred named
