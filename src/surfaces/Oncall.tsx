import { useRelay } from '../store'
import { Avatar, Badge, Button, Card, SegmentedControl } from '../ds'
import {
  holidays,
  monday,
  weekIndex,
  holidayIn,
  initials,
  range,
  AV,
} from '../lib/data'

export default function Oncall() {
  const { state, setState, toast, tracks, agents, dutyManagerName, onCall, contactFor } = useRelay()
  const s = state
  const mon = monday(new Date(s.now))
  const dutyManager = dutyManagerName

  const ocRange = range(mon)
  const ocHoliday = holidayIn(mon)

  /* This week cards */
  const ocCards = tracks.map((tr) => {
    const oc = { ...onCall(tr.id, mon)!, ...contactFor(onCall(tr.id, mon)!.name) }
    const e1 = contactFor(oc.next)
    const e2 = contactFor(tr.esc)
    return {
      track: tr.name,
      tint: tr.tint,
      name: oc.name,
      next: oc.next,
      ext: oc.ext,
      mobile: oc.mobile,
      startLabel: tr.late ? 'Mon 8:00 AM' : 'Mon 7:00 AM',
      weeksYtd: 4 + (weekIndex(mon) % 6) + tr.pool.length,
      ladder: [
        { level: 'Escalation 1', name: oc.next, phone: e1.mobile || e1.ext },
        { level: 'Escalation 2', name: tr.esc, phone: e2.mobile || e2.ext },
      ],
      onAssign: () => {
        const a = agents.find((x) => x.name === oc.name)
        setState((st) => ({ nf: { ...st.nf, assignee: a?.id || st.nf.assignee }, composer: true }))
        toast('New ticket pre-assigned to ' + oc.name + ' (on call, ' + tr.name + ')', 'var(--blue)')
      },
      onPage: () => toast('Paged ' + oc.name + ' on ' + oc.mobile + ' — acknowledgement expected in 15m', 'var(--orange)'),
    }
  })

  /* Next 8 weeks */
  const ocWeeks = []
  for (let w = 0; w < 8; w++) {
    const m = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + w * 7)
    const hol = holidayIn(m)
    ocWeeks.push({
      label: range(m),
      holiday: hol,
      hasHoliday: !!hol,
      isNow: w === 0,
      rowBg: w === 0 ? 'rgba(10,132,255,.10)' : w % 2 ? 'rgba(255,255,255,.02)' : 'transparent',
      labelColor: w === 0 ? 'var(--ink-1)' : 'var(--ink-2)',
      people: tracks.map((tr) => {
        const n = onCall(tr.id, m)!.name
        return { name: n, initials: initials(n), tint: tr.tint, weight: w === 0 ? 600 : 400, chipBg: w === 0 ? 'rgba(255,255,255,.07)' : 'transparent' }
      }),
    })
  }

  /* Holidays */
  const today = new Date(s.now)
  const holTrackA = tracks[0]
  const holTrackB = tracks[tracks.length - 1]
  const ocHolidays = holidays.map((h) => {
    const d = new Date(h.iso + 'T12:00:00')
    const hm = monday(d)
    const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return {
      name: h.name,
      rule: h.rule,
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
      helpdesk: holTrackA ? onCall(holTrackA.id, hm)!.name : '—',
      infra: holTrackB ? onCall(holTrackB.id, hm)!.name : '—',
      state: past ? 'Passed' : 'Covered',
      stateTone: past ? 'neutral' : 'prime',
      opacity: past ? 0.45 : 1,
      tint: past ? 'var(--ink-3)' : 'var(--purple)',
    }
  })

  /* Fairness */
  const ocFairness = tracks
    .reduce<{ name: string; track: string; tint: string; weeks: number; pct: number; label: string }[]>(
      (acc, tr) =>
        acc.concat(
          tr.pool.map((p, i) => {
            let h = 0
            for (let c = 0; c < p.length; c++) h = (h * 33 + p.charCodeAt(c)) % 997
            const n = 2 + ((h + i * 5 + tr.pool.length) % 13)
            return { name: p, track: tr.name, tint: tr.tint, weeks: n, pct: Math.min(100, (n / 14) * 100), label: n + ' wk' }
          }),
        ),
      [],
    )
    .sort((a, b) => b.weeks - a.weeks)
    .slice(0, 8)

  const ocTrackHeads = tracks.map((t) => ({ name: t.short, tint: t.tint }))
  const GRID_WEEKS = '184px repeat(5,minmax(146px,1fr)) 150px'
  const GRID_HOL = 'minmax(190px,1fr) 190px 230px minmax(170px,1fr) minmax(170px,1fr) 110px'

  return (
    <div style={{ padding: '22px 24px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.4px' }}>On-call rotation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{ocRange}</span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>new week starts Monday 7:00 AM</span>
            {!!ocHoliday && (
              <Badge tone="purple" style={{ whiteSpace: 'nowrap' }}>
                {ocHoliday}
              </Badge>
            )}
          </div>
        </div>
        <div onClick={() => setState({ page: 'queue' })} style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer' }}>
          ← Back to queue
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <SegmentedControl
          segments={['This week', 'Next 8 weeks', 'Holidays']}
          value={s.ocTab}
          onChange={(v) => setState({ ocTab: v })}
          style={{ whiteSpace: 'nowrap', maxWidth: 340 }}
        />
      </div>

      {/* This week */}
      {s.ocTab === 'This week' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
            {ocCards.map((c) => (
              <div
                key={c.track}
                style={{
                  border: '1px solid var(--border-card)',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid var(--hairline-soft)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c.tint, flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-label)',
                      color: 'var(--ink-1)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.track}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{c.startLabel}</span>
                </div>
                <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={c.name} size={AV.xl} ring />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--yellow)', textTransform: 'uppercase', marginBottom: 3 }}>
                      Primary
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {[c.mobile, c.ext].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 16px' }}>
                  {c.ladder.map((e) => (
                    <div key={e.level} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--hairline-soft)' }}>
                      <span style={{ width: 78, flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>
                        {e.level}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.name}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-gray)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{e.phone}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 16px', marginTop: 'auto' }}>
                  <Button size="sm" shape="pill" onClick={c.onAssign}>
                    New ticket
                  </Button>
                  <Button size="sm" variant="secondary" shape="pill" onClick={c.onPage}>
                    Page
                  </Button>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{c.weeksYtd} wk YTD</span>
                </div>
              </div>
            ))}
          </div>

          {/* Duty manager bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, padding: '14px 16px', border: '1px solid rgba(255,69,58,.28)', background: 'rgba(255,69,58,.07)', borderRadius: 'var(--radius-xl)', flexWrap: 'wrap' }}>
            <Avatar name={dutyManager} size={AV.lg} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--red)', textTransform: 'uppercase', marginBottom: 3 }}>
                Escalation 3 · duty manager
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{dutyManager}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {[contactFor(dutyManager).mobile || contactFor(dutyManager).ext, 'any group, any hour'].filter(Boolean).join(' · ')}
              </div>
            </div>
            <Button size="sm" variant="destructive" shape="pill" onClick={() => toast('Duty manager ' + dutyManager + ' paged — 5 minute acknowledgement', 'var(--red)')}>
              Page manager
            </Button>
          </div>

          <div style={{ marginTop: 14, padding: '14px 16px', border: '1px solid var(--border-card)', background: 'var(--surface-1)', borderRadius: 'var(--radius-xl)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, textWrap: 'pretty' }}>
            Cover runs continuously — nights, weekends and holidays. The week rolls at 7:00 AM Monday and ends 6:59 AM the following Monday; Business Apps and Custom Applications roll an hour later. If nobody answers within 15 minutes, Relay escalates one level automatically and pages the duty manager at level 3.
          </div>
        </div>
      )}

      {/* Next 8 weeks */}
      {s.ocTab === 'Next 8 weeks' && (
        <div>
          <div style={{ border: '1px solid var(--border-card)', background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)', overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID_WEEKS, minWidth: 1180, alignItems: 'center', height: 42, padding: '0 16px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid var(--hairline-soft)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>
              <div>Week</div>
              {ocTrackHeads.map((h) => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: h.tint, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                </div>
              ))}
              <div>Holiday</div>
            </div>
            {ocWeeks.map((w, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: GRID_WEEKS, minWidth: 1180, alignItems: 'center', minHeight: 54, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,.05)', background: w.rowBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: w.labelColor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{w.label}</span>
                  {w.isNow && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: '#fff', background: 'var(--blue)', borderRadius: 'var(--radius-pill)', padding: '2px 7px' }}>
                      Now
                    </span>
                  )}
                </div>
                {w.people.map((p, pi) => (
                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10, minWidth: 0, marginRight: 6, borderRadius: 'var(--radius-pill)', background: p.chipBg }}>
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 800, color: p.tint, background: 'rgba(255,255,255,.06)', border: `1px solid ${p.tint}` }}>
                      {p.initials}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: p.weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </div>
                ))}
                <div>{w.hasHoliday && <Badge tone="purple" style={{ whiteSpace: 'nowrap' }}>{w.holiday}</Badge>}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <Card caption="Rotation fairness · weeks carried this year">
              {ocFairness.map((f) => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
                  <div style={{ width: 150, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                  <div style={{ width: 190, fontSize: 11.5, color: 'var(--ink-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.track}</div>
                  <div style={{ flex: 1, minWidth: 60, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: f.tint, width: f.pct + '%' }} />
                  </div>
                  <div style={{ width: 56, textAlign: 'right', fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>{f.label}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* Holidays */}
      {s.ocTab === 'Holidays' && (
        <div style={{ border: '1px solid var(--border-card)', background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)', overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID_HOL, minWidth: 1100, alignItems: 'center', height: 42, padding: '0 16px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid var(--hairline-soft)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--ink-gray)', textTransform: 'uppercase' }}>
            <div>Holiday</div>
            <div>When</div>
            <div>Observed date</div>
            <div>{holTrackA ? holTrackA.short + ' on call' : 'On call'}</div>
            <div>{holTrackB && holTrackB !== holTrackA ? holTrackB.short : '—'}</div>
            <div style={{ textAlign: 'right' }}>Cover</div>
          </div>
          {ocHolidays.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID_HOL, minWidth: 1100, alignItems: 'center', minHeight: 54, padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,.05)', opacity: h.opacity }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ width: 4, height: 26, borderRadius: 2, background: h.tint, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-gray)', paddingRight: 12 }}>{h.rule}</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, fontVariantNumeric: 'tabular-nums', paddingRight: 12 }}>{h.date}</div>
              <div style={{ fontSize: 12.5, paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.helpdesk}</div>
              <div style={{ fontSize: 12.5, paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.infra}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Badge tone={h.stateTone as any} style={{ whiteSpace: 'nowrap' }}>
                  {h.state}
                </Badge>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--ink-gray)' }}>
            Holiday weeks pay a shift premium and page one level earlier. Dates are the observed dates the department closes.
          </div>
        </div>
      )}
    </div>
  )
}
