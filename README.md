# BimaEndorse — Endorsement Desk (Prototype)

A single-file React prototype of BimaKavach's endorsement-servicing TMS. Deployed as a shareable
prototype link; the source in this repo is private.

**Run locally**

```
npm install
npm run dev
```

**Sign in** — email `nanditha.p@bimakavach.com`, password `pass-word` (the gate is a prototype prop,
not real auth). The app holds no data outside React state — nothing is stored in the browser.

The rest of this file, and the `*.md` docs beside it, are the working pack (spec, masters, design
system, open questions). `prototype.jsx` is the single source; `src/main.jsx` mounts it.

---

# UI fork — start here

A Claude Code working pack for the BimaKavach TMS endorsement prototype.

## What this is

`prototype.jsx` is a single-file React prototype of the endorsement Ticket Management System. It is functionally complete for the happy path across both endorsement classifications, and is wired to the client's real business masters. This fork exists to improve its **visual and interaction design** without changing what it does.

## Setup

```
.
├── CLAUDE.md                    read first — modes and hard rules
├── prototype.jsx                the artifact
└── docs/
    ├── FUNCTIONAL-SPEC.md       the frozen behavioural contract
    ├── UI-INVENTORY.md          every screen and component, and why it looks that way
    ├── DESIGN-SYSTEM.md         tokens and environment constraints
    ├── DATA-MASTERS.md          where every list and number comes from
    ├── CHANGE-PROTOCOL.md       how to propose, apply and verify a change
    └── OPEN-QUESTIONS.md        unresolved decisions — check before acting
```

Drop the prototype file in as `prototype.jsx`.

## Verify

```bash
npx esbuild prototype.jsx --loader:.jsx=jsx --outfile=/dev/null --jsx=automatic
```

## The one thing to get right

There are two roles. **UI Supervisor is the default** — visual direction only, behaviour frozen. **Product Owner** is entered explicitly and unlocks functional change, with an obligation to update the spec in the same breath. If you are unsure which is active, ask; never assume the wider permission.
