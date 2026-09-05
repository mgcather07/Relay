import type { Ticket } from './data'

/* ─────────────────────────────────────────────────────────────────────────
   Multi-tenant data model. Everything a customer company owns lives under
   orgs/{orgId}; invite codes live at the root so a joining user can look
   one up before they belong to the org.

     users/{uid}                  → UserDoc      (which org am I in)
     orgs/{orgId}                 → OrgDoc       (settings, ticket counter)
     orgs/{orgId}/members/{uid}   → MemberDoc    (role inside the org)
     orgs/{orgId}/tickets/{id}    → Ticket + TicketMeta
     orgs/{orgId}/audit/{autoId}  → AuditEvent   (append-only)
     invites/{code}               → InviteDoc
   ───────────────────────────────────────────────────────────────────────── */

export type Role = 'admin' | 'agent' | 'requester'

export interface UserDoc {
  name: string
  email: string
  orgId: string | null
}

export interface MemberDoc {
  name: string
  email: string
  role: Role
  team: string
  joinedAt: number
  /** Code used to join — validated by security rules. Founders join without one. */
  inviteCode?: string
}

export interface OrgSettings {
  org: { name: string; domain: string; tz: string; hours: string }
  channels: string[]
  cats: string[]
  teams: string[]
  logging: { actions: boolean; timings: boolean; digest: boolean; verbatim: boolean; retention: string }
}

export interface OrgDoc {
  name: string
  ownerUid: string
  createdAt: number
  prefix: string
  seq: number
  invites: { agent: string; requester: string }
  settings: OrgSettings
}

export interface InviteDoc {
  orgId: string
  orgName: string
  role: Role
  createdAt: number
}

export interface TicketMeta {
  createdAt: number
  requesterUid: string | null
  resolvedAt: number | null
  sample?: boolean
}

export type TicketDoc = Ticket & TicketMeta

export interface AuditEvent {
  at: number
  who: string
  what: string
  tint: string
}

export const SLA_WINDOWS: Record<'P1' | 'P2' | 'P3' | 'P4', number> = { P1: 240, P2: 480, P3: 1440, P4: 2880 }

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  agent: 'Agent',
  requester: 'Requester',
}

export function makeInviteCode(role: Role): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let body = ''
  const rand = new Uint8Array(8)
  crypto.getRandomValues(rand)
  for (const b of rand) body += alphabet[b % alphabet.length]
  return (role === 'agent' ? 'AGT-' : 'REQ-') + body
}

export function defaultOrgSettings(companyName: string, domain: string): OrgSettings {
  return {
    org: {
      name: companyName,
      domain,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
      hours: '8:00 AM – 5:00 PM',
    },
    channels: ['Phone', 'Email', 'Walk-up'],
    cats: ['Applications', 'Infrastructure', 'Identity', 'Hardware', 'AV & Rooms', 'Onboarding'],
    teams: ['Helpdesk'],
    logging: { actions: true, timings: true, digest: false, verbatim: false, retention: '2 years' },
  }
}

export function fmtOpened(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const sameDay = new Date(now).toDateString() === d.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const days = Math.floor((now - ts) / 86400000)
  if (days <= 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Starter tickets so a brand-new workspace shows the product, not a blank table. */
export function sampleTickets(prefix: string, startSeq: number, founderName: string): TicketDoc[] {
  const now = Date.now()
  const mk = (
    n: number,
    priority: Ticket['priority'],
    subj: string,
    category: string,
    dueMin: number,
    body: string,
  ): TicketDoc => ({
    id: prefix + '-' + (startSeq + n),
    priority,
    subj,
    requester: founderName,
    dept: 'Sample data',
    channel: 'Portal',
    category,
    team: 'Helpdesk',
    status: 'New',
    assignee: null,
    due: now + dueMin * 60000,
    window: SLA_WINDOWS[priority],
    opened: fmtOpened(now),
    msgs: 1,
    links: [],
    viewers: [],
    thread: [{ author: founderName, role: 'Sample ticket', time: fmtOpened(now), body }],
    createdAt: now - n * 60000,
    requesterUid: null,
    resolvedAt: null,
    sample: true,
  })
  return [
    mk(0, 'P2', 'Sample — VPN drops every 20 minutes on the guest network', 'Infrastructure', SLA_WINDOWS.P2,
      'This is a sample ticket so you can try the queue, replies and SLA clock. Resolve or delete it whenever you like.'),
    mk(1, 'P3', 'Sample — New laptop request for a starter on Monday', 'Hardware', SLA_WINDOWS.P3,
      'Sample ticket. Try assigning it to yourself from the queue, or open it and send a public reply.'),
    mk(2, 'P4', 'Sample — Access to the shared marketing drive', 'Identity', SLA_WINDOWS.P4,
      'Sample ticket. The portal view shows how this looks to the person who asked for help.'),
  ]
}
