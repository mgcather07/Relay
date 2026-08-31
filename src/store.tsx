import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import {
  agents,
  seed,
  tracks,
  catTrack,
  onCallFor,
  monday,
  dur,
  personaById,
  capsFor,
  type Ticket,
  type ThreadMessage,
  type Persona,
  type Caps,
} from './lib/data'

/* ─────────────────────────────────────────────────────────────────────────
   Relay store — holds all client UI + demo "server" state and the actions
   that mutate it. Mirrors the prototype's single-component state model. In
   production, tickets / SLA / rotation / settings live behind APIs.
   ───────────────────────────────────────────────────────────────────────── */

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

export interface RelayState {
  currentUserId: string | null
  surface: 'Desk' | 'Portal'
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
  navOpen: boolean
  tickets: Ticket[]
}

const SLA_WARN_MINUTES = 60

function initialState(): RelayState {
  return {
    currentUserId: null,
    surface: 'Desk',
    page: 'queue',
    view: 'inbox',
    sortBy: 'SLA',
    filters: [],
    selected: [],
    openId: 'RLY-2841',
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
    nf: { subject: '', requester: '', channel: 'Phone', category: 'Hardware', priority: 'P3', assignee: 'tomas', body: '', tried: false },
    pf: { subject: '', category: null, impact: 'Annoying', body: '', tried: false },
    ocTab: 'This week',
    setSection: 'Organization',
    channels: ['Phone', 'Email', 'Walk-up'],
    cats: ['Applications', 'Infrastructure', 'Identity', 'Hardware', 'AV & Rooms', 'Onboarding'],
    newChannel: '',
    newCat: '',
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
    portalPage: 'list',
    portalOpenId: 'RLY-2830',
    pdReply: '',
    navOpen: false,
    tickets: seed(),
  }
}

type Updater = Partial<RelayState> | ((s: RelayState) => Partial<RelayState>)

export interface RelayStore {
  state: RelayState
  slaWarnMinutes: number
  setState: (u: Updater) => void
  currentUser: () => Persona | null
  caps: () => Caps
  signIn: (personaId: string) => void
  signOut: () => void
  agent: (id: string | null) => (typeof agents)[number] | null
  visible: (t: Ticket) => boolean
  viewTickets: (view: string) => Ticket[]
  filtered: () => Ticket[]
  openTicket: () => Ticket
  genThread: (t: Ticket) => ThreadMessage[]
  toast: (text: string, tint?: string) => void
  patch: (ids: string[], changes: Partial<Ticket>) => void
  // actions
  openDetail: (id: string) => void
  resolveOpen: () => void
  assignTo: (agentId: string) => void
  unassign: () => void
  sendReply: () => void
  createTicket: () => void
  submitPortal: () => void
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

export function RelayProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<RelayState>(initialState)
  const stateRef = useRef(state)
  stateRef.current = state
  const toastTimer = useRef<any>(null)
  const connTimers = useRef<Record<string, any>>({})

  const setState = useCallback((u: Updater) => {
    setStateRaw((s) => ({ ...s, ...(typeof u === 'function' ? (u as any)(s) : u) }))
  }, [])

  const currentUser = useCallback(() => personaById(stateRef.current.currentUserId), [])
  const caps = useCallback(() => {
    const u = personaById(stateRef.current.currentUserId)
    return capsFor(u ? u.role : 'employee')
  }, [])
  const signIn = useCallback(
    (personaId: string) => {
      const u = personaById(personaId)
      if (!u) return
      const employee = u.role === 'employee'
      setState({
        currentUserId: personaId,
        surface: employee ? 'Portal' : 'Desk',
        page: 'queue',
        view: 'inbox',
        portalPage: 'list',
        selected: [],
        navOpen: false,
        palette: false,
        composer: false,
        assignFor: null,
        merge: false,
        setSection: capsFor(u.role).settingsSections[0] || 'Organization',
      })
    },
    [setState],
  )
  const signOut = useCallback(() => setState({ currentUserId: null, navOpen: false, palette: false }), [setState])

  const agent = useCallback((id: string | null) => agents.find((a) => a.id === id) || null, [])
  const visible = useCallback((t: Ticket) => t.status !== 'Resolved', [])

  const viewTickets = useCallback(
    (view: string) => {
      const ts = stateRef.current.tickets
      const now = stateRef.current.now
      const meId = personaById(stateRef.current.currentUserId)?.agentId || 'you'
      if (view === 'mine') return ts.filter((t) => t.assignee === meId && visible(t))
      if (view === 'unassigned') return ts.filter((t) => !t.assignee && visible(t))
      if (view === 'breaching') return ts.filter((t) => visible(t) && t.due - now < 60 * 60000)
      if (view === 'waiting') return ts.filter((t) => t.status === 'Waiting on user')
      if (view === 'resolved') return ts.filter((t) => t.status === 'Resolved')
      return ts.filter((t) => visible(t))
    },
    [visible],
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
            : b.id.localeCompare(a.id),
      )
    return ts
  }, [viewTickets])

  const openTicket = useCallback(() => {
    const s = stateRef.current
    return s.tickets.find((t) => t.id === s.openId) || s.tickets[0]
  }, [])

  const genThread = useCallback((t: Ticket): ThreadMessage[] => {
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
  }, [])

  const toast = useCallback((text: string, tint = 'var(--green)') => {
    setState({ toast: { text, tint } })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setState({ toast: null }), 3200)
  }, [setState])

  const patch = useCallback(
    (ids: string[], changes: Partial<Ticket>) => {
      setState((s) => ({ tickets: s.tickets.map((t) => (ids.indexOf(t.id) >= 0 ? { ...t, ...changes } : t)) }))
    },
    [setState],
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
    toast(
      done ? t.id + ' reopened' : t.id + ' resolved — requester notified, CSAT sent',
      done ? 'var(--orange)' : 'var(--green)',
    )
  }, [openTicket, patch, toast])

  const assignTo = useCallback(
    (agentId: string) => {
      const s = stateRef.current
      const ids = s.assignFor === '__bulk' ? s.selected : [s.assignFor as string]
      const a = agent(agentId)
      patch(ids, { assignee: agentId, status: 'In progress', team: a ? a.team : 'Desktop Support' })
      setState({ assignFor: null, selected: [] })
      toast(
        ids.length + (ids.length > 1 ? ' tickets' : ' ticket') + ' assigned to ' + (a ? a.name : 'unassigned'),
        'var(--blue)',
      )
    },
    [agent, patch, setState, toast],
  )

  const unassign = useCallback(() => {
    const s = stateRef.current
    const ids = s.assignFor === '__bulk' ? s.selected : [s.assignFor as string]
    patch(ids, { assignee: null, status: 'New' })
    setState({ assignFor: null, selected: [] })
    toast('Returned to the unassigned pool', 'var(--orange)')
  }, [patch, setState, toast])

  const sendReply = useCallback(() => {
    const s = stateRef.current
    const t = openTicket()
    const internal = s.replyMode !== 'Public reply'
    const body = s.replyText.trim()
    if (!t || !body) return
    const me = personaById(s.currentUserId)
    const msg: ThreadMessage = { author: me?.name || 'Marcus Cathey', role: me?.title || 'Desktop Support · Lead', time: 'now', internal, body }
    setState((st) => ({
      replyText: '',
      tickets: st.tickets.map((x) =>
        x.id === t.id ? { ...x, thread: (x.thread || genThread(x)).concat([msg]), msgs: x.msgs + 1 } : x,
      ),
    }))
    toast(
      internal ? 'Internal note added — not visible to the requester' : 'Reply sent to ' + t.requester,
      internal ? 'var(--yellow)' : 'var(--green)',
    )
  }, [openTicket, genThread, setState, toast])

  const createTicket = useCallback(() => {
    const s = stateRef.current
    const nf = s.nf
    if (!nf.subject.trim() || !nf.requester.trim()) {
      setState({ nf: { ...nf, tried: true } })
      return
    }
    const win = ({ P1: 240, P2: 480, P3: 1440, P4: 2880 } as Record<string, number>)[nf.priority]
    const id = 'RLY-' + (2842 + Math.floor(Math.random() * 6))
    const a = agent(nf.assignee)
    const me = personaById(s.currentUserId)
    const t: Ticket = {
      id,
      priority: nf.priority,
      subj: nf.subject.trim(),
      requester: nf.requester.trim(),
      dept: 'Logged by ' + (me?.name.split(' ')[0] || 'the desk'),
      channel: nf.channel,
      category: nf.category,
      team: a ? a.team : 'Desktop Support',
      status: 'In progress',
      assignee: nf.assignee,
      due: Date.now() + win * 60000,
      window: win,
      opened: 'just now',
      msgs: 1,
      links: [],
      viewers: [],
      thread: [
        {
          author: me?.name || 'Marcus Cathey',
          role: 'Logged on behalf of ' + nf.requester.trim(),
          time: 'now',
          internal: true,
          body: nf.body.trim() || 'Called in. ' + nf.subject.trim(),
        },
      ],
    }
    setState((st) => ({
      tickets: [t].concat(st.tickets),
      composer: false,
      openId: id,
      page: 'detail',
      nf: { subject: '', requester: '', channel: 'Phone', category: 'Hardware', priority: 'P3', assignee: 'tomas', body: '', tried: false },
    }))
    toast(id + ' created and assigned to ' + (a ? a.name : 'the pool'), 'var(--blue)')
  }, [agent, setState, toast])

  const submitPortal = useCallback(() => {
    const s = stateRef.current
    const pf = s.pf
    if (!pf.subject.trim()) {
      setState({ pf: { ...pf, tried: true } })
      return
    }
    const prio = pf.impact === 'Blocking my work' ? 'P2' : pf.impact === 'Whole team' ? 'P1' : 'P3'
    const win = ({ P1: 240, P2: 480, P3: 1440 } as Record<string, number>)[prio]
    const id = 'RLY-' + (2850 + Math.floor(Math.random() * 9))
    const me = personaById(s.currentUserId)
    const reqName = me?.name || 'Marcus Cathey'
    const t: Ticket = {
      id,
      priority: prio as Ticket['priority'],
      subj: pf.subject.trim(),
      requester: reqName,
      dept: me?.title || 'Desktop Support',
      channel: 'Portal',
      category: pf.category || 'Hardware',
      team: 'Desktop Support',
      status: 'New',
      assignee: null,
      due: Date.now() + win * 60000,
      window: win,
      opened: 'just now',
      msgs: 1,
      links: [],
      viewers: [],
      thread: [{ author: reqName, role: 'Requester', time: 'now', body: pf.body.trim() || pf.subject.trim() }],
    }
    setState((st) => ({
      tickets: [t].concat(st.tickets),
      portalPage: 'detail',
      portalOpenId: id,
      pf: { subject: '', category: null, impact: 'Annoying', body: '', tried: false },
    }))
    toast(id + ' submitted — routed to Desktop Support', 'var(--green)')
  }, [setState, toast])

  const testConn = useCallback(
    (key: 'ldap' | 'sql') => {
      const label = key === 'ldap' ? 'Active Directory' : 'SQL Server'
      setState((s) => ({ [key]: { ...s[key], status: 'testing' } } as any))
      clearTimeout(connTimers.current[key])
      connTimers.current[key] = setTimeout(() => {
        setState((s) => ({ [key]: { ...s[key], status: 'connected', synced: 'just now' } } as any))
        toast(
          label + ' connection verified' + (key === 'ldap' ? ' — 5 groups read' : ' — archive database reachable'),
          'var(--green)',
        )
      }, 1400)
    },
    [setState, toast],
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
    const me = personaById(s.currentUserId)
    const c = capsFor(me ? me.role : 'employee')
    const meId = me?.agentId || 'you'
    const cmds: PaletteItem[] = [
      { kind: 'view', label: 'Go to Unassigned', meta: 'Queue view', icon: 'inbox', run: () => setState({ page: 'queue', view: 'unassigned', palette: false }) },
      { kind: 'view', label: 'Go to Breaching soon', meta: 'Queue view', icon: 'clock', run: () => setState({ page: 'queue', view: 'breaching', palette: false }) },
      { kind: 'view', label: 'Go to Assigned to me', meta: 'Queue view', icon: 'user', run: () => setState({ page: 'queue', view: 'mine', palette: false }) },
      { kind: 'cmd', label: 'New ticket', meta: 'Shortcut C', icon: 'plus', run: () => setState({ composer: true, palette: false }) },
      { kind: 'cmd', label: 'Assign open ticket to me', meta: 'Reassign', icon: 'user', run: () => { patch([stateRef.current.openId], { assignee: meId, status: 'In progress' }); setState({ palette: false }); toast(stateRef.current.openId + ' assigned to you', 'var(--blue)') } },
      { kind: 'cmd', label: 'Resolve open ticket', meta: 'Shortcut E', icon: 'check', run: () => { setState({ palette: false }); resolveOpen() } },
      ...(c.canDashboard ? [{ kind: 'cmd', label: 'SLA dashboard', meta: 'Reports', icon: 'chart', run: () => setState({ page: 'dashboard', palette: false }) }] : []),
      { kind: 'cmd', label: 'Who is on call this week?', meta: 'On-call rotation', icon: 'phone', run: () => setState({ page: 'oncall', palette: false }) },
      ...(c.canSettings ? [{ kind: 'cmd', label: 'Settings — directory, archive, logging', meta: 'Admin', icon: 'gear', run: () => setState({ page: 'settings', palette: false }) }] : []),
    ]
    const tickets: PaletteItem[] = s.tickets.map((t) => ({
      kind: t.priority,
      label: t.subj,
      meta: t.id + ' · ' + t.requester + ' · ' + t.status,
      icon: 'ticket',
      tint: ({ P1: 'var(--red)', P2: 'var(--orange)', P3: 'var(--blue)', P4: 'var(--ink-gray)' } as Record<string, string>)[t.priority],
      run: () => openDetail(t.id),
    }))
    const all = cmds.concat(tickets)
    if (!q) return cmds.concat(tickets.slice(0, 5))
    return all.filter((x) => (x.label + ' ' + x.meta).toLowerCase().indexOf(q) >= 0).slice(0, 9)
  }, [setState, patch, toast, resolveOpen, openDetail])

  /* ── 1s SLA clock ─────────────────────────────────────────────────── */
  useEffect(() => {
    const timer = setInterval(() => setState({ now: Date.now() }), 1000)
    return () => clearInterval(timer)
  }, [setState])

  /* ── Keyboard shortcuts ───────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cu = personaById(stateRef.current.currentUserId)
      // Agent shortcuts only apply to signed-in agents.
      if (!cu || cu.role === 'employee') return
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
  }, [setState, resolveOpen, paletteList])

  const store: RelayStore = {
    state,
    slaWarnMinutes: SLA_WARN_MINUTES,
    setState,
    currentUser,
    caps,
    signIn,
    signOut,
    agent,
    visible,
    viewTickets,
    filtered,
    openTicket,
    genThread,
    toast,
    patch,
    openDetail,
    resolveOpen,
    assignTo,
    unassign,
    sendReply,
    createTicket,
    submitPortal,
    testConn,
    setLdap,
    setSql,
    closeOverlays,
    paletteList,
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
