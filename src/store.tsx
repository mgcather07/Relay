import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  arrayUnion,
  increment,
} from 'firebase/firestore'
import { db } from './lib/firebase'
import { useSession, roleTitle } from './session'
import { SLA_WINDOWS, fmtOpened, makeInviteCode, type AuditEvent, type Role, type TicketDoc } from './lib/model'
import {
  agents as demoAgents,
  tracks as demoTracks,
  kb as demoKb,
  teams as demoTeams,
  dutyManager as demoDutyManager,
  catTrack,
  onCallForIn,
  contact,
  dur,
  type Agent,
  type Ticket,
  type ThreadMessage,
  type Track,
} from './lib/data'

/* ─────────────────────────────────────────────────────────────────────────
   Relay store. Two modes share one interface:

     demo — the in-memory sample workspace (marketing demo). Seed data,
            fake persona, nothing persists.
     live — a real company workspace: tickets, settings and audit live in
            Firestore under orgs/{orgId}, scoped by security rules, synced
            in real time to every signed-in browser on the network.
   ───────────────────────────────────────────────────────────────────────── */

export type Mode = 'demo' | 'live'

export interface Toast {
  text: string
  tint: string
}

export interface NewForm {
  subject: string
  requester: string
  channel: string
  category: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  assignee: string
  body: string
  tried: boolean
}

export interface PortalForm {
  subject: string
  category: string | null
  impact: string
  body: string
  tried: boolean
}

export interface Me {
  id: string
  name: string
  email: string
  role: Role
  team: string
  title: string
}

export interface RelayState {
  surface: 'Desk' | 'Portal' | 'Mobile'
  page: 'queue' | 'detail' | 'dashboard' | 'oncall' | 'settings'
  view: string
  sortBy: string
  filters: string[]
  selected: string[]
  openId: string
  replyMode: string
  replyText: string
  palette: boolean
  paletteQ: string
  paletteIdx: number
  composer: boolean
  assignFor: string | null
  merge: boolean
  mergeMode: string
  toast: Toast | null
  now: number
  nf: NewForm
  pf: PortalForm
  ocTab: string
  setSection: string
  channels: string[]
  cats: string[]
  newChannel: string
  newCat: string
  org: { name: string; domain: string; tz: string; hours: string }
  ldap: any
  sql: any
  logging: { actions: boolean; timings: boolean; digest: boolean; verbatim: boolean; retention: string }
  portalPage: 'list' | 'new' | 'detail'
  portalOpenId: string
  pdReply: string
  tickets: Ticket[]
}

const SLA_WARN_MINUTES = 60

const demoSeedImport = () => import('./lib/data').then((m) => m.seed())

function demoInitial(): Pick<
  RelayState,
  'org' | 'ldap' | 'sql' | 'logging' | 'channels' | 'cats' | 'openId' | 'portalOpenId'
> {
  return {
    openId: 'RLY-2841',
    portalOpenId: 'RLY-2830',
    channels: ['Phone', 'Email', 'Walk-up'],
    cats: ['Applications', 'Infrastructure', 'Identity', 'Hardware', 'AV & Rooms', 'Onboarding'],
    org: { name: 'Northgate Industrial', domain: 'corp.local', tz: 'America/Chicago', hours: '7:00 AM – 6:00 PM' },
    ldap: {
      status: 'connected',
      host: 'ldaps://dc01.corp.local',
      port: '636',
      baseDn: 'DC=corp,DC=local',
      bind: 'svc-relay@corp.local',
      synced: '2 minutes ago',
      latency: '38 ms',
      users: 1284,
      groups: [
        { dn: 'CN=IT-Helpdesk,OU=Groups', role: 'Agent', members: 14, on: true },
        { dn: 'CN=IT-Leads,OU=Groups', role: 'Manager', members: 4, on: true },
        { dn: 'CN=IT-NetSec,OU=Groups', role: 'Agent · Net/Sec', members: 9, on: true },
        { dn: 'CN=All-Staff,OU=Groups', role: 'Requester', members: 1284, on: true },
        { dn: 'CN=Contractors,OU=Groups', role: 'Requester (no portal)', members: 37, on: false },
      ],
    },
    sql: {
      status: 'connected',
      host: 'sql-relay01.corp.local',
      instance: 'MSSQLSERVER',
      db: 'RelayArchive',
      auth: 'Windows authentication',
      size: '42.6 GB',
      rows: '1,184,220',
      lastJob: 'Tonight 2:00 AM',
      archiveAfter: '90 days',
      purgeAfter: '7 years',
      importSource: 'Footprints (legacy)',
    },
    logging: { actions: true, timings: true, digest: true, verbatim: false, retention: '2 years' },
  }
}

function initialState(mode: Mode, live?: { org: any }): RelayState {
  const base: RelayState = {
    surface: 'Desk',
    page: 'queue',
    view: 'inbox',
    sortBy: 'SLA',
    filters: [],
    selected: [],
    openId: '',
    replyMode: 'Public reply',
    replyText: '',
    palette: false,
    paletteQ: '',
    paletteIdx: 0,
    composer: false,
    assignFor: null,
    merge: false,
    mergeMode: 'Merge as duplicate',
    toast: null,
    now: Date.now(),
    nf: { subject: '', requester: '', channel: 'Phone', category: 'Hardware', priority: 'P3', assignee: '', body: '', tried: false },
    pf: { subject: '', category: null, impact: 'Annoying', body: '', tried: false },
    ocTab: 'This week',
    setSection: 'Organization',
    channels: [],
    cats: [],
    newChannel: '',
    newCat: '',
    org: { name: '', domain: '', tz: 'America/Chicago', hours: '' },
    ldap: { status: 'off', host: '', port: '636', baseDn: '', bind: '', synced: '—', latency: '—', users: 0, groups: [] },
    sql: { status: 'off', host: '', instance: '', db: '', auth: 'SQL login', size: '—', rows: '—', lastJob: '—', archiveAfter: '90 days', purgeAfter: '7 years', importSource: '—' },
    logging: { actions: true, timings: true, digest: false, verbatim: false, retention: '2 years' },
    portalPage: 'list',
    portalOpenId: '',
    pdReply: '',
    tickets: [],
  }
  if (mode === 'demo') return { ...base, ...demoInitial(), tickets: [] }
  const st = live?.org?.settings
  if (st) {
    base.org = { ...st.org }
    base.channels = st.channels.slice()
    base.cats = st.cats.slice()
    base.logging = { ...st.logging }
    base.nf.channel = st.channels[0] || 'Phone'
    base.nf.category = st.cats[0] || 'Hardware'
  }
  return base
}

type Updater = Partial<RelayState> | ((s: RelayState) => Partial<RelayState>)

export interface RelayStore {
  state: RelayState
  mode: Mode
  me: Me
  canAdmin: boolean
  isRequester: boolean
  agents: Agent[]
  tracks: Track[]
  teams: { name: string; tint: string }[]
  kb: typeof demoKb
  dutyManagerName: string
  audit: AuditEvent[]
  nextTicketLabel: string
  inviteCodes: { agent: string; requester: string } | null
  slaWarnMinutes: number
  setState: (u: Updater) => void
  agent: (id: string | null) => Agent | null
  isMe: (id: string | null | undefined) => boolean
  visible: (t: Ticket) => boolean
  viewTickets: (view: string) => Ticket[]
  filtered: () => Ticket[]
  openTicket: () => Ticket
  genThread: (t: Ticket) => ThreadMessage[]
  toast: (text: string, tint?: string) => void
  patch: (ids: string[], changes: Partial<Ticket>) => void
  onCall: (trackId: string, mon: Date) => ReturnType<typeof onCallForIn>
  trackForCategory: (cat: string) => string
  contactFor: (name: string) => { ext: string; mobile: string }
  // actions
  openDetail: (id: string) => void
  resolveOpen: () => void
  assignTo: (agentId: string) => void
  unassign: () => void
  sendReply: () => void
  createTicket: () => void
  submitPortal: () => void
  portalReply: () => void
  clearSampleData: () => void
  regenerateInvite: (role: 'agent' | 'requester') => void
  setMemberRole: (uid: string, role: Role) => void
  testConn: (key: 'ldap' | 'sql') => void
  setLdap: (k: string, v: string) => void
  setSql: (k: string, v: string) => void
  closeOverlays: () => void
  paletteList: () => PaletteItem[]
}

export interface PaletteItem {
  kind: string
  label: string
  meta: string
  icon: string
  tint?: string
  run: () => void
}

const Ctx = createContext<RelayStore | null>(null)
export const useRelay = () => useContext(Ctx)!

const TEAM_TINTS = ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--orange)', 'var(--cyan)', 'var(--indigo)', 'var(--yellow)']

export function RelayProvider({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  const session = useSession()
  const [state, setStateRaw] = useState<RelayState>(() =>
    initialState(mode, mode === 'live' ? { org: session.org } : undefined),
  )
  const stateRef = useRef(state)
  stateRef.current = state
  const toastTimer = useRef<any>(null)
  const connTimers = useRef<Record<string, any>>({})
  const [audit, setAudit] = useState<AuditEvent[]>([])

  const orgId = mode === 'live' ? session.orgId! : null
  const orgDoc = mode === 'live' ? session.org : null
  const sessionMe = mode === 'live' ? session.me : null

  const me: Me = useMemo(() => {
    if (mode === 'live' && sessionMe)
      return {
        id: sessionMe.uid,
        name: sessionMe.name,
        email: sessionMe.email,
        role: sessionMe.role,
        team: sessionMe.team,
        title: roleTitle(sessionMe),
      }
    return { id: 'you', name: 'Marcus Cathey', email: 'demo@relay.app', role: 'admin', team: 'Desktop Support', title: 'Desktop Support · Lead' }
  }, [mode, sessionMe])

  const canAdmin = me.role === 'admin'
  const isRequester = me.role === 'requester'
  const isStaff = !isRequester

  const setState = useCallback((u: Updater) => {
    setStateRaw((s) => ({ ...s, ...(typeof u === 'function' ? (u as any)(s) : u) }))
  }, [])

  /* ── Demo seed (loaded async so the live bundle path stays clean) ───── */
  useEffect(() => {
    if (mode !== 'demo') return
    let on = true
    demoSeedImport().then((tickets) => on && setState({ tickets }))
    return () => {
      on = false
    }
  }, [mode, setState])

  /* ── Live: tickets subscription ─────────────────────────────────────── */
  useEffect(() => {
    if (mode !== 'live' || !orgId) return
    const col = collection(db(), 'orgs', orgId, 'tickets')
    const q = isStaff ? query(col) : query(col, where('requesterUid', '==', me.id))
    return onSnapshot(
      q,
      (snap) => {
        const tickets = snap.docs
          .map((d) => d.data() as TicketDoc)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setState({ tickets })
      },
      (err) => console.warn('tickets subscription error', err),
    )
  }, [mode, orgId, isStaff, me.id, setState])

  /* ── Live: audit subscription (staff only) ──────────────────────────── */
  useEffect(() => {
    if (mode !== 'live' || !orgId || !isStaff) return
    const q = query(collection(db(), 'orgs', orgId, 'audit'), orderBy('at', 'desc'), limit(30))
    return onSnapshot(q, (snap) => setAudit(snap.docs.map((d) => d.data() as AuditEvent)), () => {})
  }, [mode, orgId, isStaff])

  /* ── Live: settings sync (remote → state, state → remote debounced) ─── */
  const lastSettingsJson = useRef<string>('')
  useEffect(() => {
    if (mode !== 'live' || !orgDoc) return
    const remote = {
      org: orgDoc.settings.org,
      channels: orgDoc.settings.channels,
      cats: orgDoc.settings.cats,
      logging: orgDoc.settings.logging,
    }
    const json = JSON.stringify(remote)
    if (json !== lastSettingsJson.current) {
      lastSettingsJson.current = json
      setState({
        org: { ...remote.org },
        channels: remote.channels.slice(),
        cats: remote.cats.slice(),
        logging: { ...remote.logging },
      })
    }
  }, [mode, orgDoc, setState])

  useEffect(() => {
    if (mode !== 'live' || !orgId || !canAdmin) return
    const local = { org: state.org, channels: state.channels, cats: state.cats, logging: state.logging }
    const json = JSON.stringify(local)
    if (json === lastSettingsJson.current || !state.org.name) return
    const t = setTimeout(() => {
      lastSettingsJson.current = json
      updateDoc(doc(db(), 'orgs', orgId), {
        name: local.org.name,
        'settings.org': local.org,
        'settings.channels': local.channels,
        'settings.cats': local.cats,
        'settings.logging': local.logging,
      }).catch((e) => console.warn('settings save failed', e))
    }, 800)
    return () => clearTimeout(t)
  }, [mode, orgId, canAdmin, state.org, state.channels, state.cats, state.logging])

  /* ── Requesters live on the portal surface ──────────────────────────── */
  useEffect(() => {
    if (isRequester && stateRef.current.surface !== 'Portal') setState({ surface: 'Portal' })
  }, [isRequester, state.surface, setState])

  /* ── Roster: agents, teams, tracks ──────────────────────────────────── */
  const liveStaff = useMemo(
    () => (mode === 'live' ? session.members.filter((m) => m.role !== 'requester') : []),
    [mode, session.members],
  )

  const agents: Agent[] = useMemo(() => {
    if (mode === 'demo') return demoAgents
    return liveStaff.map((m) => {
      const parts = m.name.split(' ')
      const short = m.uid === me.id ? 'Me' : parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '')
      const load = stateRef.current.tickets.filter((t) => t.assignee === m.uid && t.status !== 'Resolved').length
      return { id: m.uid, name: m.name, short, team: m.team, load, avail: m.email }
    })
  }, [mode, liveStaff, me.id, state.tickets])

  const teams = useMemo(() => {
    if (mode === 'demo') return demoTeams
    const names = orgDoc?.settings.teams?.length ? orgDoc.settings.teams : ['Helpdesk']
    const extra = Array.from(new Set(liveStaff.map((m) => m.team).filter((t) => t && !names.includes(t))))
    return names.concat(extra).map((name, i) => ({ name, tint: TEAM_TINTS[i % TEAM_TINTS.length] }))
  }, [mode, orgDoc, liveStaff])

  const tracks: Track[] = useMemo(() => {
    if (mode === 'demo') return demoTracks
    const admins = liveStaff.filter((m) => m.role === 'admin')
    const esc = admins[0]?.name || liveStaff[0]?.name || '—'
    return teams
      .map((t, i) => {
        const pool = liveStaff.filter((m) => m.team === t.name).map((m) => m.name)
        const fallback = pool.length ? pool : i === 0 ? liveStaff.map((m) => m.name) : []
        return { id: 't' + i, name: t.name, short: t.name, tint: t.tint, pool: fallback, esc }
      })
      .filter((t) => t.pool.length > 0)
  }, [mode, teams, liveStaff])

  const dutyManagerName = useMemo(() => {
    if (mode === 'demo') return demoDutyManager
    return liveStaff.find((m) => m.role === 'admin')?.name || liveStaff[0]?.name || '—'
  }, [mode, liveStaff])

  const kb = mode === 'demo' ? demoKb : []

  const onCall = useCallback((trackId: string, mon: Date) => onCallForIn(tracks, trackId, mon), [tracks])

  const trackForCategory = useCallback(
    (cat: string) => {
      if (mode === 'demo') return catTrack[cat] || 'hd'
      return tracks[0]?.id || 't0'
    },
    [mode, tracks],
  )

  const contactFor = useCallback(
    (name: string) => {
      if (mode === 'demo') return contact(name)
      const m = session.members.find((x) => x.name === name)
      return { ext: m?.email || '', mobile: '' }
    },
    [mode, session.members],
  )

  const nextTicketLabel = mode === 'demo' ? 'RLY-2842' : (orgDoc ? orgDoc.prefix + '-' + orgDoc.seq : '…')
  const inviteCodes = mode === 'live' && canAdmin && orgDoc ? orgDoc.invites : null

  const agent = useCallback((id: string | null) => agents.find((a) => a.id === id) || null, [agents])
  const isMe = useCallback((id: string | null | undefined) => !!id && id === me.id, [me.id])
  const visible = useCallback((t: Ticket) => t.status !== 'Resolved', [])

  const ticketRef = useCallback(
    (id: string) => doc(db(), 'orgs', orgId!, 'tickets', id),
    [orgId],
  )

  const logAudit = useCallback(
    (what: string, tint = 'var(--blue)') => {
      if (mode !== 'live' || !orgId || !stateRef.current.logging.actions) return
      addDoc(collection(db(), 'orgs', orgId, 'audit'), {
        at: Date.now(),
        who: me.name,
        what,
        tint,
      } satisfies AuditEvent).catch(() => {})
    },
    [mode, orgId, me.name],
  )

  const viewTickets = useCallback(
    (view: string) => {
      const ts = stateRef.current.tickets
      const now = stateRef.current.now
      if (view === 'mine') return ts.filter((t) => t.assignee === me.id && visible(t))
      if (view === 'unassigned') return ts.filter((t) => !t.assignee && visible(t))
      if (view === 'breaching') return ts.filter((t) => visible(t) && t.due - now < 60 * 60000)
      if (view === 'waiting') return ts.filter((t) => t.status === 'Waiting on user')
      if (view === 'resolved') return ts.filter((t) => t.status === 'Resolved')
      return ts.filter((t) => visible(t))
    },
    [visible, me.id],
  )

  const filtered = useCallback(() => {
    const s = stateRef.current
    const f = s.filters
    let ts = viewTickets(s.view)
    if (f.length)
      ts = ts.filter((t) => f.every((x) => x === t.priority || x === t.category || x === t.channel || x === t.team))
    const sort = s.sortBy
    ts = ts
      .slice()
      .sort((a, b) =>
        sort === 'SLA'
          ? a.due - b.due
          : sort === 'Priority'
            ? a.priority.localeCompare(b.priority) || a.due - b.due
            : ((b as any).createdAt || 0) - ((a as any).createdAt || 0) || b.id.localeCompare(a.id),
      )
    return ts
  }, [viewTickets])

  const openTicket = useCallback(() => {
    const s = stateRef.current
    return s.tickets.find((t) => t.id === s.openId) || s.tickets[0]
  }, [])

  const genThread = useCallback(
    (t: Ticket): ThreadMessage[] => {
      if (mode === 'live') return t.thread || []
      return [
        {
          author: t.requester,
          role: 'Requester · ' + t.dept,
          time: t.opened || 'earlier',
          body: t.subj + '. It started this morning and I have already restarted twice. Let me know what else you need from me.',
        },
        {
          author: 'Relay',
          role: 'Auto-triage',
          time: t.opened || 'earlier',
          internal: true,
          body: 'Routed to ' + t.team + ' · category ' + t.category + ' · priority ' + t.priority + '. Resolution target ' + dur(t.window * 60000) + '.',
        },
      ]
    },
    [mode],
  )

  const toast = useCallback(
    (text: string, tint = 'var(--green)') => {
      setState({ toast: { text, tint } })
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setState({ toast: null }), 3200)
    },
    [setState],
  )

  const patch = useCallback(
    (ids: string[], changes: Partial<Ticket>) => {
      const full: Partial<Ticket> & { resolvedAt?: number | null } = { ...changes }
      if (changes.status === 'Resolved') full.resolvedAt = Date.now()
      else if (changes.status && changes.status !== 'Resolved') full.resolvedAt = null
      if (mode === 'live') {
        for (const id of ids) updateDoc(ticketRef(id), full as any).catch((e) => console.warn('patch failed', e))
        return
      }
      setState((s) => ({ tickets: s.tickets.map((t) => (ids.indexOf(t.id) >= 0 ? { ...t, ...full } : t)) }))
    },
    [mode, ticketRef, setState],
  )

  const openDetail = useCallback(
    (id: string) => setState({ openId: id, page: 'detail', palette: false, replyText: '', replyMode: 'Public reply' }),
    [setState],
  )

  const resolveOpen = useCallback(() => {
    const t = openTicket()
    if (!t) return
    const done = t.status === 'Resolved'
    patch([t.id], { status: done ? 'In progress' : 'Resolved' })
    logAudit((done ? 'reopened ' : 'resolved ') + t.id, done ? 'var(--orange)' : 'var(--green)')
    toast(
      done ? t.id + ' reopened' : t.id + ' resolved — requester notified, CSAT sent',
      done ? 'var(--orange)' : 'var(--green)',
    )
  }, [openTicket, patch, toast, logAudit])

  const assignTo = useCallback(
    (agentId: string) => {
      const s = stateRef.current
      const ids = s.assignFor === '__bulk' ? s.selected : [s.assignFor as string]
      const a = agent(agentId)
      patch(ids, { assignee: agentId, status: 'In progress', team: a ? a.team : stateRef.current.tickets[0]?.team || 'Helpdesk' })
      setState({ assignFor: null, selected: [] })
      logAudit('assigned ' + ids.join(', ') + ' to ' + (a ? a.name : 'unassigned'))
      toast(
        ids.length + (ids.length > 1 ? ' tickets' : ' ticket') + ' assigned to ' + (a ? a.name : 'unassigned'),
        'var(--blue)',
      )
    },
    [agent, patch, setState, toast, logAudit],
  )

  const unassign = useCallback(() => {
    const s = stateRef.current
    const ids = s.assignFor === '__bulk' ? s.selected : [s.assignFor as string]
    patch(ids, { assignee: null, status: 'New' })
    setState({ assignFor: null, selected: [] })
    logAudit('returned ' + ids.join(', ') + ' to the unassigned pool', 'var(--orange)')
    toast('Returned to the unassigned pool', 'var(--orange)')
  }, [patch, setState, toast, logAudit])

  const sendReply = useCallback(() => {
    const s = stateRef.current
    const t = openTicket()
    const internal = s.replyMode !== 'Public reply'
    const body = s.replyText.trim()
    if (!t || !body) return
    const msg: ThreadMessage = {
      author: me.name,
      role: me.title,
      time: mode === 'live' ? fmtOpened(Date.now()) : 'now',
      internal,
      body,
    }
    if (mode === 'live') {
      updateDoc(ticketRef(t.id), {
        thread: arrayUnion(msg),
        msgs: increment(1),
        ...(internal ? {} : t.status === 'New' ? { status: 'In progress' } : {}),
      }).catch((e) => console.warn('reply failed', e))
      setState({ replyText: '' })
      logAudit((internal ? 'added an internal note on ' : 'replied on ') + t.id, internal ? 'var(--yellow)' : 'var(--blue)')
    } else {
      setState((st) => ({
        replyText: '',
        tickets: st.tickets.map((x) =>
          x.id === t.id ? { ...x, thread: (x.thread || genThread(x)).concat([msg]), msgs: x.msgs + 1 } : x,
        ),
      }))
    }
    toast(
      internal ? 'Internal note added — not visible to the requester' : 'Reply sent to ' + t.requester,
      internal ? 'var(--yellow)' : 'var(--green)',
    )
  }, [openTicket, genThread, setState, toast, mode, me, ticketRef, logAudit])

  /** Allocate the next org-wide ticket id and write the ticket, atomically. */
  const createLiveTicket = useCallback(
    async (build: (id: string, now: number) => TicketDoc) => {
      const orgRef = doc(db(), 'orgs', orgId!)
      return runTransaction(db(), async (tx) => {
        const snap = await tx.get(orgRef)
        const data = snap.data() as { prefix: string; seq: number }
        const id = data.prefix + '-' + data.seq
        tx.update(orgRef, { seq: increment(1) })
        tx.set(doc(db(), 'orgs', orgId!, 'tickets', id), build(id, Date.now()))
        return id
      })
    },
    [orgId],
  )

  const createTicket = useCallback(() => {
    const s = stateRef.current
    const nf = s.nf
    if (!nf.subject.trim() || !nf.requester.trim()) {
      setState({ nf: { ...nf, tried: true } })
      return
    }
    const win = SLA_WINDOWS[nf.priority]
    const a = agent(nf.assignee)
    const resetNf: NewForm = {
      subject: '', requester: '', channel: s.channels[0] || 'Phone', category: s.cats[0] || 'Hardware',
      priority: 'P3', assignee: '', body: '', tried: false,
    }
    const build = (id: string, now: number): TicketDoc => ({
      id,
      priority: nf.priority,
      subj: nf.subject.trim(),
      requester: nf.requester.trim(),
      dept: 'Logged by ' + me.name.split(' ')[0],
      channel: nf.channel,
      category: nf.category,
      team: a ? a.team : teams[0]?.name || 'Helpdesk',
      status: a ? 'In progress' : 'New',
      assignee: nf.assignee || null,
      due: now + win * 60000,
      window: win,
      opened: mode === 'live' ? fmtOpened(now) : 'just now',
      msgs: 1,
      links: [],
      viewers: [],
      thread: [
        {
          author: me.name,
          role: 'Logged on behalf of ' + nf.requester.trim(),
          time: mode === 'live' ? fmtOpened(now) : 'now',
          internal: true,
          body: nf.body.trim() || 'Called in. ' + nf.subject.trim(),
        },
      ],
      createdAt: now,
      requesterUid: null,
      resolvedAt: null,
    })
    if (mode === 'live') {
      createLiveTicket(build)
        .then((id) => {
          setState({ composer: false, openId: id, page: 'detail', nf: resetNf })
          logAudit('created ' + id + ' for ' + nf.requester.trim())
          toast(id + ' created and assigned to ' + (a ? a.name : 'the pool'), 'var(--blue)')
        })
        .catch((e) => {
          console.warn('create failed', e)
          toast('Couldn’t create the ticket — check your connection', 'var(--red)')
        })
      return
    }
    const id = 'RLY-' + (2842 + Math.floor(Math.random() * 6))
    const t = build(id, Date.now())
    setState((st) => ({ tickets: ([t] as Ticket[]).concat(st.tickets), composer: false, openId: id, page: 'detail', nf: resetNf }))
    toast(id + ' created and assigned to ' + (a ? a.name : 'the pool'), 'var(--blue)')
  }, [agent, setState, toast, mode, me, teams, createLiveTicket, logAudit])

  const submitPortal = useCallback(() => {
    const s = stateRef.current
    const pf = s.pf
    if (!pf.subject.trim()) {
      setState({ pf: { ...pf, tried: true } })
      return
    }
    const prio = (pf.impact === 'Blocking my work' ? 'P2' : pf.impact === 'Whole team' ? 'P1' : 'P3') as Ticket['priority']
    const win = SLA_WINDOWS[prio]
    const team = teams[0]?.name || 'Helpdesk'
    const resetPf: PortalForm = { subject: '', category: null, impact: 'Annoying', body: '', tried: false }
    const build = (id: string, now: number): TicketDoc => ({
      id,
      priority: prio,
      subj: pf.subject.trim(),
      requester: me.name,
      dept: me.team || 'Portal',
      channel: 'Portal',
      category: pf.category || s.cats[0] || 'Hardware',
      team,
      status: 'New',
      assignee: null,
      due: now + win * 60000,
      window: win,
      opened: mode === 'live' ? fmtOpened(now) : 'just now',
      msgs: 1,
      links: [],
      viewers: [],
      thread: [
        { author: me.name, role: 'Requester', time: mode === 'live' ? fmtOpened(now) : 'now', body: pf.body.trim() || pf.subject.trim() },
      ],
      createdAt: now,
      requesterUid: mode === 'live' ? me.id : null,
      resolvedAt: null,
    })
    if (mode === 'live') {
      createLiveTicket(build)
        .then((id) => {
          setState({ portalPage: 'detail', portalOpenId: id, pf: resetPf })
          toast(id + ' submitted — routed to ' + team, 'var(--green)')
        })
        .catch((e) => {
          console.warn('portal submit failed', e)
          toast('Couldn’t submit the request — check your connection', 'var(--red)')
        })
      return
    }
    const id = 'RLY-' + (2850 + Math.floor(Math.random() * 9))
    const t = build(id, Date.now())
    setState((st) => ({ tickets: ([t] as Ticket[]).concat(st.tickets), portalPage: 'detail', portalOpenId: id, pf: resetPf }))
    toast(id + ' submitted — routed to ' + team, 'var(--green)')
  }, [setState, toast, mode, me, teams, createLiveTicket])

  const portalReply = useCallback(() => {
    const s = stateRef.current
    const body = s.pdReply.trim()
    const t = s.tickets.find((x) => x.id === s.portalOpenId)
    if (!body || !t) return
    const msg: ThreadMessage = {
      author: me.name,
      role: 'Requester',
      time: mode === 'live' ? fmtOpened(Date.now()) : 'now',
      body,
    }
    if (mode === 'live') {
      updateDoc(ticketRef(t.id), { thread: arrayUnion(msg), msgs: increment(1) }).catch(() => {})
      setState({ pdReply: '' })
    } else {
      setState((st) => ({
        pdReply: '',
        tickets: st.tickets.map((x) =>
          x.id === t.id ? { ...x, thread: (x.thread || genThread(x)).concat([msg]), msgs: x.msgs + 1 } : x,
        ),
      }))
    }
    toast('Comment sent to the technician', 'var(--green)')
  }, [mode, me, ticketRef, setState, toast, genThread])

  const clearSampleData = useCallback(() => {
    if (mode !== 'live' || !orgId) return
    const samples = stateRef.current.tickets.filter((t) => (t as any).sample)
    for (const t of samples) deleteDoc(ticketRef(t.id)).catch(() => {})
    logAudit('removed ' + samples.length + ' sample tickets', 'var(--ink-gray)')
    toast(samples.length + ' sample tickets removed', 'var(--orange)')
  }, [mode, orgId, ticketRef, toast, logAudit])

  const regenerateInvite = useCallback(
    (role: 'agent' | 'requester') => {
      if (mode !== 'live' || !orgId || !orgDoc || !canAdmin) return
      const oldCode = orgDoc.invites[role]
      const code = makeInviteCode(role)
      setDoc(doc(db(), 'invites', code), { orgId, orgName: orgDoc.name, role, createdAt: Date.now() })
        .then(() => updateDoc(doc(db(), 'orgs', orgId), { ['invites.' + role]: code }))
        .then(() => deleteDoc(doc(db(), 'invites', oldCode)).catch(() => {}))
        .then(() => toast('New ' + role + ' invite code issued — the old one no longer works', 'var(--blue)'))
        .catch(() => toast('Couldn’t regenerate the code', 'var(--red)'))
    },
    [mode, orgId, orgDoc, canAdmin, toast],
  )

  const setMemberRole = useCallback(
    (uid: string, role: Role) => {
      if (mode !== 'live' || !orgId || !canAdmin) return
      updateDoc(doc(db(), 'orgs', orgId, 'members', uid), { role })
        .then(() => {
          const m = session.members.find((x) => x.uid === uid)
          logAudit('changed ' + (m?.name || uid) + '’s role to ' + role, 'var(--purple)')
          toast((m?.name || 'Member') + ' is now: ' + role, 'var(--blue)')
        })
        .catch(() => toast('Couldn’t change that role', 'var(--red)'))
    },
    [mode, orgId, canAdmin, session.members, toast, logAudit],
  )

  const testConn = useCallback(
    (key: 'ldap' | 'sql') => {
      const label = key === 'ldap' ? 'Active Directory' : 'SQL Server'
      if (mode === 'live') {
        toast(label + ' sync is an Enterprise add-on — contact sales to enable the connector', 'var(--orange)')
        return
      }
      setState((s) => ({ [key]: { ...s[key], status: 'testing' } }) as any)
      clearTimeout(connTimers.current[key])
      connTimers.current[key] = setTimeout(() => {
        setState((s) => ({ [key]: { ...s[key], status: 'connected', synced: 'just now' } }) as any)
        toast(
          label + ' connection verified' + (key === 'ldap' ? ' — 5 groups read' : ' — archive database reachable'),
          'var(--green)',
        )
      }, 1400)
    },
    [setState, toast, mode],
  )

  const setLdap = useCallback((k: string, v: string) => setState((s) => ({ ldap: { ...s.ldap, [k]: v, status: 'stale' } })), [setState])
  const setSql = useCallback((k: string, v: string) => setState((s) => ({ sql: { ...s.sql, [k]: v, status: 'stale' } })), [setState])

  const closeOverlays = useCallback(
    () => setState({ palette: false, composer: false, merge: false, assignFor: null }),
    [setState],
  )

  const paletteList = useCallback((): PaletteItem[] => {
    const s = stateRef.current
    const q = s.paletteQ.trim().toLowerCase()
    const cmds: PaletteItem[] = [
      { kind: 'view', label: 'Go to Unassigned', meta: 'Queue view', icon: 'inbox', run: () => setState({ page: 'queue', view: 'unassigned', palette: false }) },
      { kind: 'view', label: 'Go to Breaching soon', meta: 'Queue view', icon: 'clock', run: () => setState({ page: 'queue', view: 'breaching', palette: false }) },
      { kind: 'view', label: 'Go to Assigned to me', meta: 'Queue view', icon: 'user', run: () => setState({ page: 'queue', view: 'mine', palette: false }) },
      { kind: 'cmd', label: 'New ticket', meta: 'Shortcut C', icon: 'plus', run: () => setState({ composer: true, palette: false }) },
      { kind: 'cmd', label: 'Assign open ticket to me', meta: 'Reassign', icon: 'user', run: () => { patch([stateRef.current.openId], { assignee: me.id, status: 'In progress' }); setState({ palette: false }); toast(stateRef.current.openId + ' assigned to you', 'var(--blue)') } },
      { kind: 'cmd', label: 'Resolve open ticket', meta: 'Shortcut E', icon: 'check', run: () => { setState({ palette: false }); resolveOpen() } },
      { kind: 'cmd', label: 'SLA dashboard', meta: 'Reports', icon: 'chart', run: () => setState({ page: 'dashboard', palette: false }) },
      { kind: 'cmd', label: 'Who is on call this week?', meta: 'On-call rotation', icon: 'phone', run: () => setState({ page: 'oncall', palette: false }) },
      ...(canAdmin
        ? [{ kind: 'cmd', label: 'Settings — organization, team, invites', meta: 'Admin', icon: 'gear', run: () => setState({ page: 'settings', palette: false }) }]
        : []),
      { kind: 'cmd', label: 'Switch to the end-user portal', meta: 'Surface', icon: 'portal', run: () => setState({ surface: 'Portal', palette: false }) },
      { kind: 'cmd', label: 'Preview mobile app', meta: 'Surface', icon: 'phone', run: () => setState({ surface: 'Mobile', palette: false }) },
    ]
    const ticketItems: PaletteItem[] = s.tickets.map((t) => ({
      kind: t.priority,
      label: t.subj,
      meta: t.id + ' · ' + t.requester + ' · ' + t.status,
      icon: 'ticket',
      tint: ({ P1: 'var(--red)', P2: 'var(--orange)', P3: 'var(--blue)', P4: 'var(--ink-gray)' } as Record<string, string>)[t.priority],
      run: () => openDetail(t.id),
    }))
    const all = cmds.concat(ticketItems)
    if (!q) return cmds.concat(ticketItems.slice(0, 5))
    return all.filter((x) => (x.label + ' ' + x.meta).toLowerCase().indexOf(q) >= 0).slice(0, 9)
  }, [setState, patch, toast, resolveOpen, openDetail, me.id, canAdmin])

  /* ── 1s SLA clock ─────────────────────────────────────────────────── */
  useEffect(() => {
    const timer = setInterval(() => setState({ now: Date.now() }), 1000)
    return () => clearInterval(timer)
  }, [setState])

  /* ── Keyboard shortcuts ───────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isRequester) return
      const k = (e.key || '').toLowerCase()
      const meta = e.metaKey || e.ctrlKey
      if (meta && k === 'k') {
        e.preventDefault()
        setState((s) => ({ palette: !s.palette, paletteQ: '', paletteIdx: 0 }))
        return
      }
      if (k === 'escape') {
        setState({ palette: false, composer: false, merge: false, assignFor: null, selected: [] })
        return
      }
      const typing = e.target && /input|textarea/i.test((e.target as HTMLElement).tagName || '')
      if (typing) return
      if (k === '/') {
        e.preventDefault()
        setState({ palette: true, paletteQ: '', paletteIdx: 0 })
      } else if (k === 'c') {
        e.preventDefault()
        setState({ composer: true })
      } else if (k === 'e' && stateRef.current.page === 'detail') {
        e.preventDefault()
        resolveOpen()
      }
    }
    const onKeyNav = (e: KeyboardEvent) => {
      if (!stateRef.current.palette) return
      const k = (e.key || '').toLowerCase()
      const n = paletteList().length
      if (k === 'arrowdown') {
        e.preventDefault()
        setState((s) => ({ paletteIdx: (s.paletteIdx + 1) % Math.max(n, 1) }))
      } else if (k === 'arrowup') {
        e.preventDefault()
        setState((s) => ({ paletteIdx: (s.paletteIdx - 1 + n) % Math.max(n, 1) }))
      } else if (k === 'enter') {
        e.preventDefault()
        const it = paletteList()[stateRef.current.paletteIdx]
        if (it) it.run()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keydown', onKeyNav)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onKeyNav)
    }
  }, [setState, resolveOpen, paletteList, isRequester])

  const store: RelayStore = {
    state,
    mode,
    me,
    canAdmin,
    isRequester,
    agents,
    tracks,
    teams,
    kb,
    dutyManagerName,
    audit,
    nextTicketLabel,
    inviteCodes,
    slaWarnMinutes: SLA_WARN_MINUTES,
    setState,
    agent,
    isMe,
    visible,
    viewTickets,
    filtered,
    openTicket,
    genThread,
    toast,
    patch,
    onCall,
    trackForCategory,
    contactFor,
    openDetail,
    resolveOpen,
    assignTo,
    unassign,
    sendReply,
    createTicket,
    submitPortal,
    portalReply,
    clearSampleData,
    regenerateInvite,
    setMemberRole,
    testConn,
    setLdap,
    setSql,
    closeOverlays,
    paletteList,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
