# Relay

A modern help desk ticketing system — a replacement for a legacy
(BMC Footprints–era) system. Relay covers the whole loop: a ticket arrives by
phone, email, walk-up or the portal → it is triaged, assigned and worked
against an SLA clock → the requester tracks it themselves → managers see how
the team performed.

> **Note:** All data in this build is invented placeholder content for demo
> purposes — no real names, phone numbers, tickets or metrics. State lives
> in-memory in the browser; in production this becomes server state behind an
> API (tickets, SLA policies, on-call rotation, settings, presence).

## Three surfaces

Switch between them from the top-bar segmented control:

| Surface     | Who                 | Contains                                                                                     |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------- |
| **Desk**    | Agent, lead, admin  | Queue, ticket detail, new-ticket modal, assign, merge/link, command palette, SLA dashboard, on-call rotation, settings |
| **Portal**  | End user            | My requests, submit a request, request timeline + comment                                    |
| **Mobile**  | Agent on the floor  | My queue and live ticket detail in an iPhone frame                                            |

## Highlights

- **Live presence** — who is viewing / typing a ticket is a first-class element.
- **Live SLA clocks** — a 1-second tick drives every countdown and its color
  transitions (on track → at risk → breach imminent → breached).
- **One-click assignment** — the assign popover suggests the lightest qualified
  tech, sorted by open load.
- **On-call in the product** — a full rotation with escalation ladders, the next
  8 weeks, holidays and fairness tracking.
- **Command palette** — `⌘K` from anywhere; arrow keys + Enter to run.

### Keyboard

| Key             | Action                                            |
| --------------- | ------------------------------------------------- |
| `⌘K` / `Ctrl+K` | Toggle command palette (from anywhere)            |
| `Esc`           | Close palette / modal / popover and clear selection |
| `/`             | Open palette focused on search                    |
| `c`             | New ticket                                         |
| `e`             | Resolve the open ticket (detail view)             |
| `↑` `↓` `↵`     | Move / run the palette selection                  |

## Tech stack

- **React 18** + **TypeScript**
- **Vite** for dev server and build
- **Sector design system** tokens (dark-first, Apple system typography) — see
  `src/styles/tokens.css`. Components in `src/ds/` are recreated from the
  design-system reference.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  ds/            Sector design-system components (Button, Badge, Avatar, Card,
                 FilterChip, SegmentedControl)
  lib/
    data.ts      Seed tickets, agents, teams, KB, on-call tracks, holidays,
                 and the SLA / rotation math
    icons.tsx    Inline SVG icon set (SF Symbols in spirit)
  overlays/      Command palette, new-ticket modal, assign popover, merge modal,
                 bulk action bar, toast
  surfaces/      TopBar, DeskSidebar, Queue, TicketDetail, Dashboard, Oncall,
                 Settings, Portal, Mobile, IOSFrame
  store.tsx      Central state + actions (React context)
  styles/        Design tokens + global resets and keyframes
```

## Deploying to Firebase Hosting

`firebase.json` and `.firebaserc` are included. After creating a Firebase
project and installing the CLI:

```bash
npm run build
firebase login
firebase use --add        # pick your project
firebase deploy --only hosting
```

The `dist/` folder is served as a single-page app (all routes rewrite to
`index.html`).

## Not yet built (flagged as future work)

Automation/trigger rules, CSAT survey screens, an SLA policy editor, per-agent
notification preferences, and asset/CI management — all out of scope in the
original design.
