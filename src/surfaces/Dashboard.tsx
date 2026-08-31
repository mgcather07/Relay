import { useRelay } from '../store'
import { Card, Avatar } from '../ds'
import { sla, prioColor, agents, AV } from '../lib/data'

const CHART_RAW: [string, number, number][] = [
  ['Mon', 34, 2],
  ['Tue', 41, 1],
  ['Wed', 28, 4],
  ['Thu', 46, 0],
  ['Fri', 52, 3],
  ['Sat', 12, 0],
  ['Sun', 9, 1],
]
const MAX_C = 52

export default function Dashboard() {
  const { state, setState, visible, agent, openDetail, slaWarnMinutes } = useRelay()
  const s = state

  const metricsOpen = s.tickets.filter((x) => visible(x))
  const atRiskT = metricsOpen.filter((x) => x.due - s.now < 60 * 60000).sort((a, b) => a.due - b.due)
  const breached = metricsOpen.filter((x) => x.due - s.now <= 0).length

  const metrics = [
    { label: 'Open tickets', value: metricsOpen.length, unit: 'in queue', tint: 'var(--ink-1)', delta: '↓ 8 vs yesterday', deltaTint: 'var(--green)' },
    { label: 'Past SLA', value: breached, unit: 'breached', tint: breached ? 'var(--red)' : 'var(--green)', delta: breached ? 'Escalate now' : 'Clean board', deltaTint: breached ? 'var(--red)' : 'var(--green)' },
    { label: 'First response', value: '6m', unit: 'median', tint: 'var(--green)', delta: '↑ 22% faster than Footprints', deltaTint: 'var(--green)' },
    { label: 'Satisfaction', value: '4.7', unit: '/ 5 · 96 replies', tint: 'var(--cyan)', delta: '+0.3 this month', deltaTint: 'var(--green)' },
  ]

  const chart = CHART_RAW.map(([day, r, b]) => ({
    day,
    resolvedPct: Math.round((r / MAX_C) * 100),
    breachedPct: Math.max(3, Math.round((b / MAX_C) * 100 * 3)),
  }))

  const atRisk = atRiskT.slice(0, 6).map((x) => {
    const sl = sla(x, s.now, slaWarnMinutes)
    const a = agent(x.assignee)
    return { id: x.id, subj: x.subj, slaText: sl.text, slaColor: sl.color, priorityColor: prioColor(x.priority), assigneeShort: a ? a.short : 'Unassigned' }
  })

  const agentLoad = agents.map((a) => {
    const n = s.tickets.filter((x) => x.assignee === a.id && visible(x)).length + a.load
    const pct = Math.min(100, (n / 18) * 100)
    return { name: a.name, team: a.team, pct, loadText: n + ' open', tint: n > 14 ? 'var(--red)' : n > 9 ? 'var(--orange)' : 'var(--green)' }
  })

  return (
    <div style={{ padding: '22px 24px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.4px' }}>SLA &amp; queue health</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>Service desk · rolling 7 days · updated live</div>
        </div>
        <div onClick={() => setState({ page: 'queue' })} style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer' }}>
          ← Back to queue
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 16 }}>
        {metrics.map((m) => (
          <Card key={m.label} caption={m.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.2px', fontVariantNumeric: 'tabular-nums', color: m.tint }}>
                {m.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-gray)' }}>{m.unit}</div>
            </div>
            <div style={{ fontSize: 11.5, color: m.deltaTint, marginTop: 6, fontWeight: 600 }}>{m.delta}</div>
          </Card>
        ))}
      </div>

      {/* Chart + at-risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <Card caption="Tickets resolved vs breached">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, paddingTop: 14 }}>
            {chart.map((d) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%' }}>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: '5px 5px 2px 2px',
                      background: 'linear-gradient(180deg,var(--green) 0%, rgba(52,199,89,.35) 100%)',
                      height: d.resolvedPct + '%',
                    }}
                  />
                  <div style={{ flex: 1, borderRadius: '5px 5px 2px 2px', background: 'rgba(255,69,58,.7)', height: d.breachedPct + '%' }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-gray)', fontWeight: 600 }}>{d.day}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11.5, color: 'var(--ink-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--green)' }} />
              Resolved
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--red)' }} />
              SLA breached
            </span>
          </div>
        </Card>

        <Card caption="At risk in the next hour">
          {atRisk.map((r) => (
            <div
              key={r.id}
              onClick={() => openDetail(r.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--hairline-soft)', cursor: 'pointer' }}
            >
              <span style={{ width: 4, height: 26, borderRadius: 2, background: r.priorityColor }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subj}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-gray)' }}>{r.id} · {r.assigneeShort}</div>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: r.slaColor }}>{r.slaText}</span>
            </div>
          ))}
          {atRiskT.length === 0 && <div style={{ padding: '22px 0', fontSize: 12.5, color: 'var(--ink-2)' }}>Nothing breaching in the next hour.</div>}
        </Card>
      </div>

      {/* Agent load */}
      <div style={{ marginTop: 14 }}>
        <Card caption="Agent load">
          {agentLoad.map((a) => (
            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <Avatar name={a.name} size={AV.md} />
              <div style={{ width: 150, fontSize: 13, fontWeight: 500 }}>{a.name}</div>
              <div style={{ width: 132, fontSize: 11.5, color: 'var(--ink-gray)' }}>{a.team}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: a.tint, width: a.pct + '%' }} />
              </div>
              <div style={{ width: 96, textAlign: 'right', fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: a.tint }}>
                {a.loadText}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
