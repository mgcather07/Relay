import React from 'react'

/* Inline SVG icons in the spirit of SF Symbols (24×24 viewBox, round caps).
   Paths taken verbatim from the Relay prototype. */

export function Ico({
  d,
  s = 15,
  w = 1.9,
  fill,
}: {
  d: string
  s?: number
  w?: number
  fill?: string
}) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={fill || 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={fill ? undefined : w}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path d={d} />
    </svg>
  )
}

export const icons = {
  search: <Ico d="M11 4a7 7 0 105 12 7 7 0 00-5-12zm5.5 11.5L21 20" />,
  plus: <Ico d="M12 5v14M5 12h14" />,
  check: <Ico d="M4 12.5l5 5L20 6.5" />,
  clock: <Ico d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.5V12l3.5 2" s={13} />,
  lock: <Ico d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3" s={12} />,
  link: <Ico d="M10 14a4 4 0 006 0l2-2a4 4 0 10-6-6l-1 1M14 10a4 4 0 00-6 0l-2 2a4 4 0 106 6l1-1" s={13} />,
  user: <Ico d="M12 11a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6" />,
  inbox: <Ico d="M3 13h5l2 3h4l2-3h5M3 13l3-8h12l3 8v6H3z" />,
  warn: <Ico d="M12 4l9 16H3zM12 10v5m0 3v.5" />,
  chart: <Ico d="M4 20V9M10 20V4M16 20v-7M22 20H2" />,
  chevron: <Ico d="M9 6l6 6-6 6" s={14} />,
  ticket: <Ico d="M4 7h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4z" />,
  portal: <Ico d="M4 5h16v14H4zM4 9h16" />,
  phone: <Ico d="M8 3h8v18H8zM11 18.5h2" />,
  send: <Ico d="M4 12l16-8-6 16-3-6z" s={17} />,
  map: <Ico d="M12 21s7-6.4 7-11a7 7 0 10-14 0c0 4.6 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5" />,
  bell: <Ico d="M6 16V11a6 6 0 1112 0v5l2 3H4zM10 22h4" />,
  gear: <Ico d="M12 15a3 3 0 100-6 3 3 0 000 6zm8-3l2-1-2-3-2 1-2-1V6h-4v2L10 9 8 8 6 11l2 1v2l-2 1 2 3 2-1 2 1v2h4v-2l2-1 2 1 2-3-2-1z" w={1.5} />,
  menu: <Ico d="M4 7h16M4 12h16M4 17h16" s={18} w={1.9} />,
  close: <Ico d="M6 6l12 12M18 6L6 18" s={18} w={1.9} />,
} as const

export type IconKey = keyof typeof icons

const channelPaths: Record<string, string> = {
  Email: 'M3 7l9 6 9-6M3 6h18v12H3z',
  Portal: 'M4 5h16v14H4zM4 9h16',
  Phone: 'M5 4h4l2 5-2 1a10 10 0 005 5l1-2 5 2v4a13 13 0 01-15-15z',
  Slack: 'M8 4v10M16 10v10M4 16h10M10 8h10',
  'Walk-up': 'M12 4v4m0 0l-3 6m3-6l3 6m-4 6v-4m2 4v-4',
}

export function channelIcon(c: string) {
  const p = channelPaths[c] || 'M4 6h16v12H4z'
  return <Ico d={p} s={12} w={1.7} />
}

export const checkMark = <Ico d="M4 12.5l5 5L20 6.5" s={10} w={3} />
