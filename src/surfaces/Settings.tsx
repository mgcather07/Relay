import { useRelay } from '../store'
import { useSession } from '../session'
import { Avatar, Badge, Button } from '../ds'
import { AV } from '../lib/data'
import type { Role } from '../lib/model'

const SECTIONS = ['Organization', 'Team & invites', 'Channels & categories', 'Directory (LDAP)', 'Data & archive', 'Manager logging']

const TIMEZONES = [
  'America/Chicago', 'America/New_York', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix',
  'UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
]

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border-card)',
  background: 'var(--surface-2)',
  borderRadius: 'var(--radius-xl)',
  padding: 18,
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 13px',
  background: 'var(--surface-inset)',
  border: '1px solid var(--hairline-soft)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--ink-1)',
  fontSize: 13.5,
}
const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-label)',
  color: 'var(--ink-gray)',
  textTransform: 'uppercase',
  marginBottom: 7,
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 38,
        height: 22,
        borderRadius: 'var(--radius-pill)',
        background: on ? 'var(--blue)' : 'rgba(255,255,255,.12)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background var(--duration-fast) var(--ease-standard)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
          transition: 'left var(--duration-fast) var(--ease-out)',
        }}
      />
    </div>
  )
}

export default function Settings() {
  const {
    state, setState, toast, testConn, setLdap, setSql,
    mode, agents, tracks, trackForCategory, inviteCodes, regenerateInvite, setMemberRole, clearSampleData, audit: liveAudit, me,
  } = useRelay()
  const session = useSession()
  const s = state
  const sec = s.setSection
  const live = mode === 'live'
  const sampleCount = s.tickets.filter((t) => (t as any).sample).length
  const tzOptions = TIMEZONES.includes(s.org.tz) ? TIMEZONES : [s.org.tz, ...TIMEZONES]

  const ldapStatus = s.ldap.status
  const ldapConn = {
    tone: ldapStatus === 'connected' ? 'prime' : ldapStatus === 'testing' ? 'accent' : 'fair',
    label: ldapStatus === 'connected' ? 'Connected' : ldapStatus === 'testing' ? 'Testing…' : 'Not verified',
    dot: ldapStatus === 'connected' ? 'var(--green)' : ldapStatus === 'testing' ? 'var(--blue)' : 'var(--orange)',
    meta:
      ldapStatus === 'connected'
        ? 'Bound over LDAPS · ' + s.ldap.latency + ' · synced ' + s.ldap.synced
        : ldapStatus === 'testing'
          ? 'Binding to ' + s.ldap.host + '…'
          : 'Settings changed — run a test to re-verify',
    btn: ldapStatus === 'testing' ? 'Testing…' : 'Test connection',
  }
  const sqlStatus = s.sql.status
  const sqlConn = {
    label: sqlStatus === 'connected' ? 'Connected' : sqlStatus === 'testing' ? 'Testing…' : 'Not verified',
    dot: sqlStatus === 'connected' ? 'var(--green)' : sqlStatus === 'testing' ? 'var(--blue)' : 'var(--orange)',
    meta:
      sqlStatus === 'connected'
        ? s.sql.db + ' · ' + s.sql.size + ' · ' + s.sql.rows + ' rows · next job ' + s.sql.lastJob
        : sqlStatus === 'testing'
          ? 'Opening a connection to ' + s.sql.host + '…'
          : 'Settings changed — run a test to re-verify',
    btn: sqlStatus === 'testing' ? 'Testing…' : 'Test connection',
  }

  const scorecards = agents.map((a, i) => {
    if (live) {
      const closedTickets = s.tickets.filter((t) => t.assignee === a.id && t.status === 'Resolved')
      const closed = closedTickets.length
      const metCount = closedTickets.filter((t) => !(t as any).resolvedAt || (t as any).resolvedAt <= t.due).length
      const met = closed ? Math.round((metCount / closed) * 100) : 100
      return {
        name: a.name,
        team: a.team,
        closed,
        csat: '—',
        first: '—',
        met: closed ? met + '%' : '—',
        metTint: met >= 95 ? 'var(--green)' : met >= 90 ? 'var(--orange)' : 'var(--red)',
        metPct: closed ? met : 0,
        reopen: '—',
        reopenTint: 'var(--ink-gray)',
      }
    }
    const closed = 38 + ((a.name.length * 7 + i * 11) % 46)
    const met = 88 + ((a.name.length + i * 3) % 12)
    const reopen = (2 + ((i * 5 + a.name.length) % 7)) / 2
    const csat = (4.2 + ((i * 3 + a.name.length) % 8) / 10).toFixed(1)
    return {
      name: a.name,
      team: a.team,
      closed,
      csat,
      first: (4 + ((i * 3) % 9)) + 'm',
      met: met + '%',
      metTint: met >= 95 ? 'var(--green)' : met >= 90 ? 'var(--orange)' : 'var(--red)',
      metPct: met,
      reopen: reopen.toFixed(1) + '%',
      reopenTint: reopen < 2.5 ? 'var(--green)' : reopen < 4 ? 'var(--orange)' : 'var(--red)',
    }
  })

  const auditLog = live
    ? liveAudit.map((e) => ({
        time: new Date(e.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        who: e.who,
        what: e.what,
        tint: e.tint,
      }))
    : [
        { time: '2:33 PM', who: 'Dana Whitfield', what: 'replied on RLY-2841', tint: 'var(--blue)' },
        { time: '2:26 PM', who: 'Tomás Vela', what: 'added an internal note on RLY-2841', tint: 'var(--yellow)' },
        { time: '2:21 PM', who: 'Marcus Cathey', what: 'raised RLY-2841 to P1 and escalated to Applications', tint: 'var(--red)' },
        { time: '2:14 PM', who: 'Relay auto-triage', what: 'created RLY-2841 from email and matched 3 duplicates', tint: 'var(--cyan)' },
        { time: '1:52 PM', who: 'Priya Nair', what: 'resolved RLY-2818 · first touch 6m', tint: 'var(--green)' },
        { time: '1:41 PM', who: 'Adrienne Kolb', what: 'exported the weekly SLA report', tint: 'var(--ink-gray)' },
      ]

  const exportAudit = () => {
    if (!live) {
      toast('Audit log exported to CSV — 4,218 events', 'var(--blue)')
      return
    }
    const rows = [['when', 'who', 'what'], ...liveAudit.map((e) => [new Date(e.at).toISOString(), e.who, e.what])]
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'relay-audit.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Audit log exported — ' + liveAudit.length + ' events', 'var(--blue)')
  }

  const logToggleDefs = [
    { key: 'actions', label: 'Log every ticket action', desc: 'Who opened, assigned, replied, reopened or closed — immutable audit trail.' },
    { key: 'timings', label: 'Record response timings', desc: 'First-touch and resolution clocks per agent, used for the scorecards below.' },
    { key: 'digest', label: 'Weekly manager digest', desc: 'Monday 7:00 AM email to leads with their team’s numbers and any breaches.' },
    { key: 'verbatim', label: 'Store reply text in the audit log', desc: 'Keeps full message bodies. Off by default — check with HR before enabling.' },
  ] as const

  return (
    <div style={{ padding: '22px 24px 100px', display: 'flex', gap: 26, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Nav */}
      <div style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 216, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.3px', padding: '0 10px 12px' }}>Settings</div>
        {SECTIONS.map((x) => {
          const active = sec === x
          return (
            <div
              key={x}
              className="relay-nav-hover"
              onClick={() => setState({ setSection: x })}
              style={{ position: 'relative', padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(10,132,255,.14)',
                  border: '1px solid rgba(10,132,255,.28)',
                  pointerEvents: 'none',
                  opacity: active ? 1 : 0,
                }}
              />
              <span style={{ position: 'relative', fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? 'var(--ink-1)' : 'var(--ink-2)' }}>
                {x}
              </span>
            </div>
          )
        })}
        <div onClick={() => setState({ surface: 'Desk', page: 'queue', view: 'inbox' })} style={{ fontSize: 12.5, color: 'var(--blue)', cursor: 'pointer', padding: '14px 10px 0' }}>
          ← Back to queue
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: '1 1 400px', minWidth: 'min(100%,340px)', maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Organization */}
        {sec === 'Organization' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Organization</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 16 }}>Shown on the help center and on every outbound email.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                <div>
                  <div style={fieldLabel}>Name</div>
                  <input value={s.org.name} onChange={(e) => setState({ org: { ...s.org, name: e.target.value } })} style={inputStyle} />
                </div>
                <div>
                  <div style={fieldLabel}>Mail domain</div>
                  <input value={s.org.domain} onChange={(e) => setState({ org: { ...s.org, domain: e.target.value } })} style={inputStyle} />
                </div>
                <div>
                  <div style={fieldLabel}>Business hours</div>
                  <input value={s.org.hours} onChange={(e) => setState({ org: { ...s.org, hours: e.target.value } })} style={inputStyle} />
                </div>
                <div>
                  <div style={fieldLabel}>Time zone</div>
                  <select value={s.org.tz} onChange={(e) => setState({ org: { ...s.org, tz: e.target.value } })} style={inputStyle}>
                    {tzOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {live && sampleCount > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Sample tickets</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                      {sampleCount} sample tickets were added when this workspace was created so the desk wasn’t empty.
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" shape="pill" onClick={clearSampleData}>
                    Remove sample data
                  </Button>
                </div>
              </div>
            )}

            {live ? (
              <div style={cardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Connected systems</div>
                {[
                  ['Active Directory / LDAP sync', 'Map directory groups to Relay roles automatically'],
                  ['SQL Server archive', 'Nightly export of closed tickets to your own database'],
                ].map(([t, d]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-gray)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{d}</div>
                    </div>
                    <Badge tone="purple" style={{ whiteSpace: 'nowrap' }}>Enterprise</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={cardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Connected systems</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ldapConn.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Active Directory · {s.ldap.host}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{ldapConn.meta}</div>
                  </div>
                  <Badge tone={ldapConn.tone as any} style={{ whiteSpace: 'nowrap' }}>
                    {ldapConn.label}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sqlConn.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>SQL Server · {s.sql.host}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{sqlConn.meta}</div>
                  </div>
                  <Badge tone="prime" style={{ whiteSpace: 'nowrap' }}>
                    {sqlConn.label}
                  </Badge>
                </div>
              </div>
            )}
          </>
        )}

        {/* Team & invites */}
        {sec === 'Team & invites' && (
          <>
            {live && inviteCodes && (
              <div style={cardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Invite your company</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 14 }}>
                  Anyone with a code signs up at this site, picks “I have an invite code”, and lands in this
                  workspace. Regenerating a code immediately kills the old one.
                </div>
                {(
                  [
                    ['agent', 'Agent code', 'Joins the service desk — queue, replies, on-call'],
                    ['requester', 'Requester code', 'Opens the portal — employees who need help'],
                  ] as const
                ).map(([role, label, desc]) => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--hairline-soft)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{desc}</div>
                    </div>
                    <code
                      style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.6px', padding: '7px 12px', background: 'var(--surface-inset)', border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {inviteCodes[role]}
                    </code>
                    <Button
                      size="sm"
                      variant="secondary"
                      shape="pill"
                      onClick={() => {
                        navigator.clipboard?.writeText(inviteCodes[role]).then(
                          () => toast(label + ' copied to the clipboard', 'var(--blue)'),
                          () => toast('Couldn’t copy — select it by hand', 'var(--orange)'),
                        )
                      }}
                    >
                      Copy
                    </Button>
                    <Button size="sm" variant="ghost" shape="pill" onClick={() => regenerateInvite(role)}>
                      Regenerate
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>People in this workspace</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>
                {live
                  ? 'Admins can change anyone’s role. Agents work the desk; requesters only see the portal.'
                  : 'Sample roster — in a real workspace this lists everyone who joined with an invite code.'}
              </div>
              {(live ? session.members : null)?.map((m) => (
                <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)', flexWrap: 'wrap' }}>
                  <Avatar name={m.name} size={AV.md} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {m.name}
                      {m.uid === me.id && <span style={{ color: 'var(--ink-gray)', fontWeight: 500 }}> (you)</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{m.email}</div>
                  </div>
                  {m.uid === me.id ? (
                    <Badge tone="accent">{m.role}</Badge>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => setMemberRole(m.uid, e.target.value as Role)}
                      style={{ ...inputStyle, width: 140, height: 36, fontSize: 12.5 }}
                    >
                      {['admin', 'agent', 'requester'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              {!live &&
                agents.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                    <Avatar name={a.name} size={AV.md} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>{a.team}</div>
                    </div>
                    <Badge tone="accent">agent</Badge>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Channels & categories */}
        {sec === 'Channels & categories' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Channels on New ticket</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 16 }}>
                These are the buttons an agent picks from when logging a call. Phone and Email carry almost all volume — keep the list short.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {s.channels.map((c) => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--surface-inset)', border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c}</span>
                    <span
                      className="relay-remove-hover"
                      onClick={() => {
                        setState((st) => ({
                          channels: st.channels.filter((x) => x !== c),
                          nf: { ...st.nf, channel: st.nf.channel === c ? st.channels.filter((x) => x !== c)[0] || '' : st.nf.channel },
                        }))
                        toast('Channel “' + c + '” removed from New ticket', 'var(--orange)')
                      }}
                      style={{ fontSize: 12, color: 'var(--ink-gray)', cursor: 'pointer' }}
                    >
                      Remove
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <input
                  value={s.newChannel}
                  onChange={(e) => setState({ newChannel: e.target.value })}
                  placeholder="Add a channel — e.g. Teams, Voicemail"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  shape="pill"
                  onClick={() => {
                    const v = s.newChannel.trim()
                    if (!v || s.channels.indexOf(v) >= 0) return
                    setState((st) => ({ channels: st.channels.concat([v]), newChannel: '' }))
                    toast('Channel “' + v + '” now available on New ticket', 'var(--green)')
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Categories &amp; routing</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 16 }}>
                Each category decides which on-call group Relay suggests. Retiring one keeps it on old tickets but hides it from new ones.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {s.cats.map((c) => {
                  const track = tracks.find((t) => t.id === trackForCategory(c))?.name || 'Helpdesk'
                  return (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--surface-inset)', border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500 }}>{c}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-gray)', whiteSpace: 'nowrap' }}>→ {track}</span>
                      <span
                        className="relay-remove-hover"
                        onClick={() => {
                          setState((st) => ({ cats: st.cats.filter((x) => x !== c) }))
                          toast('Category “' + c + '” retired — existing tickets keep it', 'var(--orange)')
                        }}
                        style={{ fontSize: 12, color: 'var(--ink-gray)', cursor: 'pointer' }}
                      >
                        Retire
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <input
                  value={s.newCat}
                  onChange={(e) => setState({ newCat: e.target.value })}
                  placeholder="Add a category — e.g. Printing, Telephony"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  shape="pill"
                  onClick={() => {
                    const v = s.newCat.trim()
                    if (!v || s.cats.indexOf(v) >= 0) return
                    setState((st) => ({ cats: st.cats.concat([v]), newCat: '' }))
                    toast('Category “' + v + '” added — routes to Helpdesk until mapped', 'var(--green)')
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Directory (LDAP) */}
        {sec === 'Directory (LDAP)' && live && (
          <EnterpriseUpsell
            title="Directory sync (LDAP / Active Directory)"
            body="Map your directory groups to Relay roles so nobody maintains a user list by hand. This connector ships with the Enterprise plan — your team joins with invite codes in the meantime (Settings → Team & invites)."
          />
        )}
        {sec === 'Directory (LDAP)' && !live && (
          <>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'rgba(52,199,89,.06)', borderBottom: '1px solid var(--hairline-soft)', flexWrap: 'wrap' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: ldapConn.dot, boxShadow: '0 0 0 4px rgba(52,199,89,.14)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Active Directory · {ldapConn.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{ldapConn.meta}</div>
                </div>
                <Button size="sm" variant="secondary" shape="pill" onClick={() => testConn('ldap')}>
                  {ldapConn.btn}
                </Button>
              </div>
              <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
                <div>
                  <div style={fieldLabel}>Server URL</div>
                  <input value={s.ldap.host} onChange={(e) => setLdap('host', e.target.value)} style={{ ...inputStyle, fontSize: 13, fontVariantNumeric: 'tabular-nums' }} />
                </div>
                <div>
                  <div style={fieldLabel}>Base DN</div>
                  <input value={s.ldap.baseDn} onChange={(e) => setLdap('baseDn', e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                </div>
                <div>
                  <div style={fieldLabel}>Bind account</div>
                  <input value={s.ldap.bind} onChange={(e) => setLdap('bind', e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                </div>
                <div>
                  <div style={fieldLabel}>Bind password</div>
                  <input value="••••••••••••" readOnly style={{ ...inputStyle, fontSize: 13, color: 'var(--ink-2)' }} />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Groups read from the directory</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 14 }}>
                {s.ldap.users} accounts visible. Toggle a group to grant or revoke its Relay role — no user list to maintain by hand.
              </div>
              {s.ldap.groups.map((g: any, i: number) => (
                <div key={g.dn} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: '1px solid var(--hairline-soft)', opacity: g.on ? 1 : 0.5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.dn}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-gray)' }}>
                      {g.role} · {g.members} members
                    </div>
                  </div>
                  <Toggle
                    on={g.on}
                    onToggle={() =>
                      setState((st) => ({
                        ldap: { ...st.ldap, groups: st.ldap.groups.map((x: any, j: number) => (j === i ? { ...x, on: !x.on } : x)) },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Data & archive */}
        {sec === 'Data & archive' && live && (
          <EnterpriseUpsell
            title="SQL Server archive"
            body="A nightly job that moves closed tickets into a SQL database you own, with retention and purge windows you control. Ships with the Enterprise plan; until then every ticket stays available in Relay itself."
          />
        )}
        {sec === 'Data & archive' && !live && (
          <>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'rgba(52,199,89,.06)', borderBottom: '1px solid var(--hairline-soft)', flexWrap: 'wrap' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: sqlConn.dot, boxShadow: '0 0 0 4px rgba(52,199,89,.14)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>SQL Server · {sqlConn.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{sqlConn.meta}</div>
                </div>
                <Button size="sm" variant="secondary" shape="pill" onClick={() => testConn('sql')}>
                  {sqlConn.btn}
                </Button>
              </div>
              <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
                <div>
                  <div style={fieldLabel}>Host \ instance</div>
                  <input value={s.sql.host} onChange={(e) => setSql('host', e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                </div>
                <div>
                  <div style={fieldLabel}>Archive database</div>
                  <input value={s.sql.db} onChange={(e) => setSql('db', e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                </div>
                <div>
                  <div style={fieldLabel}>Authentication</div>
                  <select value={s.sql.auth} onChange={(e) => setSql('auth', e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
                    {['Windows authentication', 'SQL login', 'Managed identity'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={fieldLabel}>Nightly job</div>
                  <input value={s.sql.lastJob} readOnly style={{ ...inputStyle, fontSize: 13, color: 'var(--ink-2)' }} />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Where old tickets go</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 16 }}>
                Closed tickets stay searchable in Relay, then move to the archive database on the nightly job. Nothing is deleted before the purge window.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={fieldLabel}>Archive after close</div>
                  <select value={s.sql.archiveAfter} onChange={(e) => setState({ sql: { ...s.sql, archiveAfter: e.target.value } })} style={{ ...inputStyle, fontSize: 13 }}>
                    {['30 days', '90 days', '6 months', '1 year'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={fieldLabel}>Purge after</div>
                  <select value={s.sql.purgeAfter} onChange={(e) => setState({ sql: { ...s.sql, purgeAfter: e.target.value } })} style={{ ...inputStyle, fontSize: 13 }}>
                    {['3 years', '5 years', '7 years', 'Never'].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid rgba(100,210,255,.28)', background: 'rgba(100,210,255,.07)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Import from {s.sql.importSource}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 2 }}>
                    One-time migration into {s.sql.db}. Legacy tickets stay read-only and searchable from the queue.
                  </div>
                </div>
                <Button size="sm" shape="pill" onClick={() => toast('Footprints import queued — 68,412 legacy tickets will land in ' + s.sql.db, 'var(--cyan)')}>
                  Run import
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Manager logging */}
        {sec === 'Manager logging' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>What gets logged</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 8 }}>Managers see their own team only. Agents can always see their own record.</div>
              {logToggleDefs.map((t) => (
                <div key={t.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '13px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-gray)', lineHeight: 1.5, marginTop: 2, textWrap: 'pretty' }}>{t.desc}</div>
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <Toggle on={(s.logging as any)[t.key]} onToggle={() => setState({ logging: { ...s.logging, [t.key]: !(s.logging as any)[t.key] } })} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, borderTop: '1px solid var(--hairline-soft)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, fontSize: 13, color: 'var(--ink-2)' }}>Keep audit events for</div>
                <select
                  value={s.logging.retention}
                  onChange={(e) => setState({ logging: { ...s.logging, retention: e.target.value } })}
                  style={{ ...inputStyle, width: 180, height: 40, fontSize: 13 }}
                >
                  {['1 year', '2 years', '5 years', 'Forever'].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{live ? 'Agent scorecards' : 'Agent scorecards · last 30 days'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 14 }}>Closed volume, first response, SLA met and reopen rate — the four numbers a lead actually asks for.</div>
              {scorecards.map((a) => (
                <div key={a.name} style={{ padding: '13px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                    <Avatar name={a.name} size={AV.md} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>{a.team}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: a.metTint }}>{a.met} SLA met</div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 9 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: a.metTint, width: a.metPct + '%' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--ink-gray)' }}>
                    <span>
                      <span style={{ color: 'var(--ink-1)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{a.closed}</span> closed
                    </span>
                    <span>
                      <span style={{ color: 'var(--ink-1)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{a.first}</span> first response
                    </span>
                    <span>
                      <span style={{ color: a.reopenTint, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{a.reopen}</span> reopened
                    </span>
                    <span>
                      <span style={{ color: 'var(--cyan)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{a.csat}</span> CSAT
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Audit trail</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>Append-only. Nothing here can be edited or removed by an agent.</div>
                </div>
                <Button size="sm" variant="secondary" shape="pill" onClick={exportAudit}>
                  Export CSV
                </Button>
              </div>
              {auditLog.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                  <span style={{ width: 3, height: 22, borderRadius: 2, background: e.tint, flexShrink: 0 }} />
                  <span style={{ width: 66, flexShrink: 0, fontSize: 11.5, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
                  <span style={{ fontSize: 12.5, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{e.who}</span> <span style={{ color: 'var(--ink-2)' }}>{e.what}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EnterpriseUpsell({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ ...cardStyle, border: '1px solid rgba(191,90,242,.3)', background: 'rgba(191,90,242,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Badge tone="purple">Enterprise add-on</Badge>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 14, textWrap: 'pretty' }}>{body}</div>
      <a href="mailto:mgcather07@gmail.com?subject=Relay%20Enterprise" style={{ display: 'inline-block' }}>
        <Button size="sm" shape="pill" variant="secondary">Contact sales</Button>
      </a>
    </div>
  )
}
