# BimaKavach TMS — Endorsement Desk Prototype

A single-file React prototype of the Ticket Management System for endorsement servicing at BimaKavach, an IRDAI-licensed commercial insurance broker. It runs both endorsement classifications — Non-Financial and Financial — end to end, against real business masters.

**The prototype is functionally complete and behaviourally frozen. This repository exists to improve how it looks and feels, not what it does.**

---

## Operating modes

You are working with one person. They occupy one of two roles at any moment, and the role governs what you are allowed to change. **Default to UI Supervisor.**

### UI Supervisor (default)

The person directs visual and interaction design. They have their own UI screens and will explain design solutions to you — often by walking you through **nodes** (Figma or equivalent). Your job is to translate that direction into the prototype without disturbing its behaviour.

**You may change:** colour, type, spacing, layout, component composition, iconography, motion, copy tone, empty states, responsive behaviour, information hierarchy, which surface a control lives on.

**You may not change:** state shape, business logic, SLA arithmetic, status transitions, blocking rules, derived-data functions, master data, or the meaning of any label. If a visual change appears to require a behavioural one, **stop and say so** rather than doing both.

Moving a control between tabs is a UI change. Removing a control, or changing when it is enabled, is a behavioural change — ask first.

### Product Owner

Entered only when the person says so explicitly — for example *"switching to Product Owner"*, *"PO mode"*, *"as Product Owner"*. It persists until they hand the role back.

In this mode functional changes are on the table: new statuses, new rules, altered SLAs, new masters, changed blocking conditions. Two obligations follow:

1. **Update `docs/FUNCTIONAL-SPEC.md` in the same change.** The spec is the contract; a behavioural change that leaves it stale is incomplete work.
2. **Flag PRD and master divergence.** Say plainly when a request contradicts `docs/DATA-MASTERS.md` or an item in `docs/OPEN-QUESTIONS.md`, and record the decision.

When the person stops giving product direction, revert to UI Supervisor. If you are unsure which role is active, ask in one line — do not assume the wider permission.

---

## Hard rules

1. **Behaviour is frozen in UI Supervisor mode.** `docs/FUNCTIONAL-SPEC.md` describes what must remain true. Read it before your first edit.
2. **One file.** The prototype is a single `.jsx` file with a default-exported `App`. Do not split it into modules — it has to render as a self-contained artifact.
3. **No browser storage.** `localStorage`, `sessionStorage` and IndexedDB are unavailable and will break rendering. All state is React state.
4. **Tailwind core utilities only.** No JIT arbitrary values (`bg-[#0B6E5F]` will not compile). Every custom colour goes through inline `style` using the `C` palette object.
5. **Icons come from `lucide-react`.** Import what you use; do not add icon libraries.
6. **Verify before you hand back.** `npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic` must pass, and you must walk `docs/CHANGE-PROTOCOL.md`'s behavioural checklist.
7. **Do not invent business data.** Products, endorsement types, mandatory fields and documents, SLA rows, holidays and escalation ladders come from the client's master workbook. If something is missing, say so — do not fill the gap with plausible-looking values.

---

## Reading order

| File | Read it when |
|---|---|
| `docs/FUNCTIONAL-SPEC.md` | Before any edit. The frozen contract |
| `docs/UI-INVENTORY.md` | Before touching a screen — what exists and why it looks that way |
| `docs/DESIGN-SYSTEM.md` | Before any visual change — tokens, constraints, what is deliberate |
| `docs/DATA-MASTERS.md` | When a label, list or number looks wrong |
| `docs/CHANGE-PROTOCOL.md` | Every session — how to propose, apply and verify |
| `docs/OPEN-QUESTIONS.md` | When a request touches an unresolved decision |

---

## Working with node walkthroughs

The person will often explain a design by reference to nodes in their own screens. When that happens:

- **Extract, don't copy.** Pull tokens, spacing rhythm, hierarchy and interaction intent. Their screens may use components this prototype has no equivalent for.
- **Map to what exists.** Name the prototype component you intend to change before changing it. `docs/UI-INVENTORY.md` is the map.
- **Ask about data you cannot see.** If a node shows a field the prototype does not hold, that is a Product Owner question, not a UI one.
- **Preserve every state.** Components render more states than a static screen shows — overdue, at risk, on hold, terminal, empty, blocked. `docs/UI-INVENTORY.md` lists them per component. A redesign that only handles the happy state is not done.

---

## What good work looks like here

Dense, fast, legible. This is an operations console used all day by servicing executives, not a marketing surface. Information density is a feature. Every number should be traceable to a rule someone can look up — that is why SLA codes appear next to countdowns.

Avoid: decorative gradients, oversized hero areas, animation that delays reading, colour used without meaning, and any pattern that makes a queue slower to scan.
