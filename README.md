# Relay

Help desk software for internal IT teams, sold as a multi-tenant web platform. Each customer
company creates its own **workspace**; its people, tickets, settings, and audit trail live in
Firestore under that workspace and are walled off from every other company by server-side
security rules. Everything runs in the browser — any computer on any network, nothing to install.

**Live stack:** React 18 + TypeScript + Vite · Firebase Auth (email/password) · Cloud Firestore
(real-time sync) · Firebase Hosting.

## How it works

| Surface | Who | What |
| --- | --- | --- |
| Marketing site | Visitors | Landing page, features, pricing, sign-up, live demo |
| Desk | Agents & admins | Queue with live SLA clocks, ticket detail, dashboard, on-call |
| Portal | Requesters | Submit and track their own requests only |
| Settings | Admins | Org profile, team & invite codes, channels/categories, logging & audit |

- **Two modes, one codebase.** `demo` runs the original in-memory sample workspace (the
  "Explore the live demo" button — nothing persists). `live` is the real product: all state in
  Firestore, synced in real time to every signed-in browser.
- **Joining a workspace.** The founder signs up and names the company. Relay generates two
  invite codes — `AGT-…` (service desk) and `REQ-…` (portal). Codes are unguessable capability
  tokens stored at `invites/{code}`; regenerating one revokes the old one instantly.
- **Ticket IDs** (`RLY-1000`, `RLY-1001`, …) are allocated atomically via a Firestore
  transaction on the org's counter.
- **Security** is enforced in `firestore.rules`, not the client: staff see the whole queue,
  requesters only documents where `requesterUid` is their own uid; settings writes are
  admin-only; the audit trail is append-only for everyone.

## One-time activation (new deployment)

1. In the [Firebase console](https://console.firebase.google.com/project/relay-helpdesk/overview):
   - **Firestore** → Create database (production mode, any location)
   - **Authentication** → Get started → enable **Email/Password**
2. Run `bash scripts/setup.sh` — registers the web app, writes `src/firebase-config.json`,
   builds, and deploys hosting + rules.

Until activation, the deployed site still serves the marketing page and the demo; sign-up
explains that accounts aren't enabled yet.

## Development

```bash
npm install
npm run dev            # http://localhost:5173
npx tsc --noEmit       # typecheck (vite build does not)
npm run build          # production build → dist/
```

To exercise the live mode locally without touching production data, start the emulators and
open the app with `?emu=1`:

```bash
firebase emulators:start --only auth,firestore   # needs Java 21+
# then visit http://localhost:5173/?emu=1
```

## Layout

```
src/
  main.tsx              entry — SessionProvider → AppRoot
  AppRoot.tsx           routes: landing / onboarding / demo / live workspace
  session.tsx           auth state, org membership, sign-up/in, create/join workspace
  store.tsx             the app store; demo (in-memory) and live (Firestore) actions
  marketing/            Landing (public site + auth), Onboarding (create/join org)
  surfaces/             Desk pages, Portal, Mobile preview, Settings, chrome
  overlays/             modals, command palette (⌘K), bulk bar, toasts
  lib/
    firebase.ts         SDK bootstrap (+ emulator hookup via ?emu=1)
    model.ts            multi-tenant types, defaults, invite codes, sample tickets
    data.ts             demo seed data + shared domain math (SLA, rotation)
  ds/                   "Sector" design system components
firestore.rules         tenant isolation & role enforcement
scripts/setup.sh        one-time deployment activation
```

## Not built yet (roadmap)

- Real billing (Stripe) — pricing page currently routes Enterprise to a sales email
- Email notifications on ticket updates
- Knowledge base authoring for live workspaces (demo shows the concept)
- LDAP/AD directory sync and SQL archive connectors (shown as Enterprise add-ons)
- Custom domain (`relay.yourcompany.com`) via Firebase Hosting domain setup
