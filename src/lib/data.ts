/* ─────────────────────────────────────────────────────────────────────────
   Seed data and domain helpers. All content is invented placeholder data —
   no real names, numbers, tickets or metrics. In production these become
   server state behind an API (see the handoff README).
   ───────────────────────────────────────────────────────────────────────── */

export interface Agent {
  id: string
  name: string
  short: string
  team: string
  load: number
  avail: string
}

export interface Track {
  id: string
  name: string
  short: string
  tint: string
  late?: boolean
  pool: string[]
  esc: string
}

export interface KBArticle {
  title: string
  excerpt: string
  match: string
  tags: string[]
}

export interface Holiday {
  iso: string
  name: string
  rule: string
}

export interface ThreadMessage {
  author: string
  role: string
  time: string
  body: string
  internal?: boolean
}

export interface Ticket {
  id: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  subj: string
  requester: string
  dept: string
  channel: string
  category: string
  team: string
  status: string
  assignee: string | null
  due: number
  window: number
  opened: string
  msgs: number
  links: string[]
  viewers: string[]
  thread: ThreadMessage[] | null
  asset?: string
}

export const AV = { sm: 22, md: 30, lg: 34, xl: 40 }

export const agents: Agent[] = [
  { id: 'you', name: 'Marcus Cathey', short: 'Me', team: 'Desktop Support', load: 7, avail: 'Available' },
  { id: 'dana', name: 'Dana Ruiz', short: 'Dana R.', team: 'Network', load: 12, avail: 'Heavy load' },
  { id: 'tomas', name: 'Tomás Vela', short: 'Tomás V.', team: 'Desktop Support', load: 4, avail: 'Available' },
  { id: 'priya', name: 'Priya Nair', short: 'Priya N.', team: 'Identity & Access', load: 9, avail: 'In a call' },
  { id: 'wes', name: 'Wes Okafor', short: 'Wes O.', team: 'Field Ops', load: 2, avail: 'On site — Bldg C' },
]

export const teams = [
  { name: 'Desktop Support', tint: 'var(--blue)' },
  { name: 'Network', tint: 'var(--green)' },
  { name: 'Identity & Access', tint: 'var(--purple)' },
  { name: 'Applications', tint: 'var(--orange)' },
  { name: 'Field Ops', tint: 'var(--cyan)' },
]

export const kb: KBArticle[] = [
  {
    title: 'Payroll portal 500 errors after SSO cert rotation',
    excerpt: 'Rotate the SP metadata in Okta, then flush the app pool on PAY-APP-02. Resolved 4 prior tickets.',
    match: '94%',
    tags: ['payroll', 'sso', 'applications'],
  },
  {
    title: 'MFA push not delivered — Duo/Entra token drift',
    excerpt: 'Have the user re-sync time on the authenticator, or issue a bypass code valid for 30 minutes.',
    match: '88%',
    tags: ['mfa', 'vpn', 'identity'],
  },
  {
    title: 'Mapping \\\\corp\\finance for hybrid-joined laptops',
    excerpt: 'Group Policy drive map fails off-VPN. Push the login script fix from KB-1187.',
    match: '71%',
    tags: ['drive', 'network', 'infrastructure'],
  },
]

export const categories = ['Applications', 'Infrastructure', 'Identity', 'Hardware', 'AV & Rooms', 'Onboarding']

export const tracks: Track[] = [
  { id: 'ba', name: 'Business Apps', short: 'Business Apps', tint: 'var(--blue)', late: true, pool: ['Nora Vance', 'Desmond Kyle', 'Petra Ilves', 'Owen Marsh'], esc: 'Rhea Calloway' },
  { id: 'bas', name: 'Custom Applications', short: 'Custom Apps', tint: 'var(--indigo)', late: true, pool: ['Yusuf Demir', 'Clare Bexley', 'Tobin Marsh'], esc: 'Rhea Calloway' },
  { id: 'oa', name: 'Operations Apps', short: 'Ops Apps', tint: 'var(--orange)', pool: ['Hana Sørensen', 'Miles Ferraro', 'Aditi Rao', 'Bruno Kesler'], esc: 'Devon Pike' },
  { id: 'hd', name: 'Helpdesk', short: 'Helpdesk', tint: 'var(--yellow)', pool: ['Tomás Vela', 'Marcus Cathey', 'Wes Okafor', 'Priya Nair'], esc: 'Devon Pike' },
  { id: 'net', name: 'Network · Security · Infrastructure', short: 'Net / Sec / Infra', tint: 'var(--green)', pool: ['Dana Ruiz', 'Ivo Brandt', 'Sasha Neumann', 'Leland Cho', 'Farida Amin'], esc: 'Corin Ashby' },
]

export const dutyManager = 'Adrienne Kolb'

export const catTrack: Record<string, string> = {
  Applications: 'ba',
  Infrastructure: 'net',
  Identity: 'net',
  Hardware: 'hd',
  'AV & Rooms': 'hd',
  Onboarding: 'oa',
}

export const holidays: Holiday[] = [
  { iso: '2026-01-01', name: 'New Year’s Day', rule: 'January 1st' },
  { iso: '2026-01-02', name: 'Floating day', rule: 'Assigned by the department' },
  { iso: '2026-05-25', name: 'Memorial Day', rule: 'Last Monday in May' },
  { iso: '2026-07-03', name: 'Independence Day', rule: 'July 4th — observed Friday' },
  { iso: '2026-09-07', name: 'Labor Day', rule: 'First Monday in September' },
  { iso: '2026-11-26', name: 'Thanksgiving', rule: 'Fourth Thursday in November' },
  { iso: '2026-11-27', name: 'Day after Thanksgiving', rule: 'Friday after Thanksgiving' },
  { iso: '2026-12-24', name: 'Christmas Eve', rule: 'December 24th' },
  { iso: '2026-12-25', name: 'Christmas Day', rule: 'December 25th' },
  { iso: '2027-01-01', name: 'New Year’s Day', rule: 'January 1st' },
]

/* ── Deterministic contact generator ─────────────────────────────────── */
export function contact(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973
  return { ext: 'x' + (4200 + (h % 700)), mobile: '(205) 555-0' + (100 + (h % 899)) }
}

/* ── Rotation math ───────────────────────────────────────────────────── */
export function monday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
export function weekIndex(mon: Date) {
  return Math.floor((mon.getTime() - new Date(2026, 0, 5).getTime()) / 604800000)
}
export function onCallForIn(trackList: Track[], trackId: string, mon: Date) {
  const tr = trackList.find((t) => t.id === trackId)
  if (!tr || tr.pool.length === 0) return null
  const i = ((weekIndex(mon) % tr.pool.length) + tr.pool.length) % tr.pool.length
  const name = tr.pool[i]
  const next = tr.pool[(i + 1) % tr.pool.length]
  return Object.assign({ name, next, track: tr.name, tint: tr.tint, id: tr.id }, contact(name))
}
export function onCallFor(trackId: string, mon: Date) {
  return onCallForIn(tracks, trackId, mon)
}
export function fmtDay(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export function holidayIn(mon: Date) {
  const end = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6, 23, 59)
  const hit = holidays.find((h) => {
    const d = new Date(h.iso + 'T12:00:00')
    return d >= mon && d <= end
  })
  return hit ? hit.name : ''
}
export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
}
export function range(mon: Date) {
  const end = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  return fmtDay(mon) + ' – ' + fmtDay(end)
}

/* ── Duration & SLA formatting ───────────────────────────────────────── */
export function dur(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h ' + (m % 60) + 'm'
  return Math.floor(h / 24) + 'd ' + (h % 24) + 'h'
}

export interface SlaResult {
  text: string
  color: string
  pct: number
  caption: string
}
export function sla(t: { due: number; window: number; status: string }, now: number, warnMinutes = 60): SlaResult {
  const warn = warnMinutes * 60000
  const left = t.due - now
  const total = t.window * 60000
  const done = t.status === 'Resolved'
  if (done) return { text: 'Met', color: 'var(--green)', pct: 100, caption: 'closed inside target' }
  if (left <= 0) {
    const over = Math.abs(left)
    return { text: '−' + dur(over), color: 'var(--red)', pct: 100, caption: 'past target — breached' }
  }
  const pct = Math.max(4, Math.min(100, 100 - (left / total) * 100))
  const color = left < warn / 2 ? 'var(--red)' : left < warn ? 'var(--orange)' : 'var(--green)'
  const caption = left < warn / 2 ? 'breach imminent' : left < warn ? 'at risk' : 'on track'
  return { text: dur(left), color, pct, caption }
}

/* ── Priority / status mappings ──────────────────────────────────────── */
export function prioColor(p: string) {
  return ({ P1: 'var(--red)', P2: 'var(--orange)', P3: 'var(--blue)', P4: 'var(--ink-gray)' } as Record<string, string>)[p] || 'var(--ink-gray)'
}
export function prioTone(p: string) {
  return ({ P1: 'poor', P2: 'fair', P3: 'accent', P4: 'neutral' } as Record<string, string>)[p] || 'neutral'
}
export function prioWord(p: string) {
  return ({ P1: 'Critical', P2: 'High', P3: 'Normal', P4: 'Low' } as Record<string, string>)[p] || ''
}
export function statusTone(s: string) {
  return (
    ({
      New: 'cyan',
      Triage: 'purple',
      'In progress': 'accent',
      'Waiting on user': 'fair',
      Resolved: 'prime',
    } as Record<string, string>)[s] || 'neutral'
  )
}

/* ── Seed tickets ────────────────────────────────────────────────────── */
export function seed(base = Date.now()): Ticket[] {
  const m = (min: number) => base + min * 60000
  const T = (
    id: string,
    priority: Ticket['priority'],
    subj: string,
    requester: string,
    dept: string,
    channel: string,
    category: string,
    team: string,
    status: string,
    assignee: string | null,
    dueMin: number,
    extra?: Partial<Ticket>,
  ): Ticket =>
    Object.assign(
      {
        id,
        priority,
        subj,
        requester,
        dept,
        channel,
        category,
        team,
        status,
        assignee,
        due: m(dueMin),
        window: 240,
        opened: '',
        msgs: 3,
        links: [] as string[],
        viewers: [] as string[],
        thread: null as ThreadMessage[] | null,
      },
      extra || {},
    )

  return [
    T('RLY-2841', 'P1', 'Payroll portal returns 500 for all of Finance after login', 'Dana Whitfield', 'Finance · Bldg A', 'Email', 'Applications', 'Applications', 'In progress', 'you', 26, {
      window: 240,
      opened: '2:14 PM',
      msgs: 5,
      links: ['RLY-2839', 'RLY-2811'],
      viewers: ['dana'],
      asset: 'PAY-APP-02',
      thread: [
        { author: 'Dana Whitfield', role: 'Requester · Finance', time: '2:14 PM', body: 'Nobody in Finance can get into the payroll portal. Every login comes back with a 500 error page. We have to submit hours by 5 PM today or the run misses the bank cutoff.' },
        { author: 'Relay', role: 'Auto-triage', time: '2:14 PM', internal: true, body: 'Matched 3 similar tickets in the last 40 minutes → likely incident. Priority raised to P1, routed to Applications. Suggested article: “Payroll portal 500 errors after SSO cert rotation” (94% match).' },
        { author: 'Marcus Cathey', role: 'Desktop Support · Lead', time: '2:21 PM', body: 'Thanks Dana — confirmed on our side, this is affecting the whole Finance group, not just you. I have escalated to the Applications team and I am watching it personally. I will update you within 20 minutes.' },
        { author: 'Tomás Vela', role: 'Desktop Support', time: '2:26 PM', internal: true, body: 'SSO signing cert rotated at 1:58 PM. SP metadata on PAY-APP-02 still has the old thumbprint. Applying the KB fix and recycling the app pool — expect a 2 minute blip.' },
        { author: 'Dana Whitfield', role: 'Requester · Finance', time: '2:33 PM', body: 'Understood. Six of us are standing by. Ping me the second it is back and I will start the run.' },
      ],
    }),
    T('RLY-2839', 'P2', 'Cannot reach shared drive \\\\corp\\finance from home', 'Luis Prieto', 'Finance · Remote', 'Portal', 'Infrastructure', 'Network', 'New', null, 74, { window: 480, opened: '1:52 PM', msgs: 2, links: ['RLY-2841'] }),
    T('RLY-2836', 'P3', 'New hire setup — Amara Osei starts Monday', 'Renée Boyd', 'People Ops', 'Portal', 'Onboarding', 'Identity & Access', 'Triage', 'priya', 460, { window: 1440, opened: '11:40 AM', msgs: 4 }),
    T('RLY-2834', 'P2', 'Zoom room in Conference B drops after five minutes', 'Facilities Desk', 'Facilities', 'Walk-up', 'AV & Rooms', 'Field Ops', 'In progress', 'wes', 132, { window: 480, opened: '12:05 PM', msgs: 6, viewers: ['tomas'] }),
    T('RLY-2830', 'P4', 'Request: second monitor for hot desk 14', 'Marcus Cathey', 'Desktop Support', 'Portal', 'Hardware', 'Desktop Support', 'Waiting on user', 'tomas', 1180, { window: 2880, opened: 'Yesterday', msgs: 3 }),
    T('RLY-2828', 'P1', 'VPN MFA push not arriving — 14 users affected', 'Service Desk', 'IT · Tier 1', 'Phone', 'Identity', 'Identity & Access', 'In progress', 'priya', -18, { window: 240, opened: '9:36 AM', msgs: 9, viewers: ['priya', 'dana'] }),
    T('RLY-2825', 'P3', 'Laptop fan noise then thermal shutdown', 'Ken Adeyemi', 'Legal', 'Email', 'Hardware', 'Desktop Support', 'New', null, 290, { window: 1440, opened: '10:22 AM', msgs: 2 }),
    T('RLY-2822', 'P2', 'Print queue stuck on the third floor MFP', 'Nadia Salter', 'Marketing', 'Slack', 'Infrastructure', 'Desktop Support', 'Triage', null, 48, { window: 480, opened: '11:02 AM', msgs: 3 }),
    T('RLY-2818', 'P3', 'Locked out of Active Directory after password change', 'Owen Brandt', 'Sales · Bldg B', 'Phone', 'Identity', 'Identity & Access', 'Resolved', 'you', 900, { window: 1440, opened: 'Yesterday', msgs: 4 }),
    T('RLY-2815', 'P4', 'Access request: Figma editor seat', 'Marcus Cathey', 'Desktop Support', 'Portal', 'Applications', 'Applications', 'Waiting on user', 'you', 1900, { window: 2880, opened: 'Monday', msgs: 2 }),
    T('RLY-2811', 'P2', 'Email delivery delays to vendor domains', 'Grace Lin', 'Procurement', 'Email', 'Applications', 'Applications', 'In progress', 'dana', 88, { window: 480, opened: '9:05 AM', msgs: 7, links: ['RLY-2841'] }),
    T('RLY-2808', 'P3', 'Docking station not charging the ThinkPad', 'Ines Duarte', 'Design', 'Walk-up', 'Hardware', 'Desktop Support', 'Resolved', 'tomas', 700, { window: 1440, opened: 'Monday', msgs: 3 }),
  ]
}
