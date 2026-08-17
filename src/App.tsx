import { useState, useRef, useEffect, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import bgImage from './imports/20260810165555_543Aicy.png'
import myMelodyImg from './imports/_83475EFC-4669-4B9B-87A2-45317E16C83A_.png'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'eq' | 'presets' | 'social' | 'tabs' | 'more'

interface Band {
  gain: number
  type: string
  q: number
  enabled: boolean
}

interface Preset {
  name: string
  isDefault?: boolean
  gains: number[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = "'Silkscreen', Consolas, monospace"

const C = {
  bgPrimary: '#A03060',   // hồng đậm – nền ngoài
  bgCard: '#CC6888',      // hồng vừa – card/header/nav
  bgElevated: '#EFB0C8',  // hồng nhạt – bề mặt nổi
  accentMain: '#E8357A',  // hồng rực – nhấn tương tác
  accentDim: '#F5C0D4',   // hồng phấn – nhấn mờ
  text: '#E8357A',
  textDim: '#FFE8F2',     // trắng hồng – chữ phụ
  border: '#F8C8D8',      // hồng rất nhạt – viền
  warn: '#FFD166',
} as const

const DB_AXIS_W = 34
const BAND_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
const FREQ_TICKS = ['5', '10', '20', '40', '80', '160', '320', '640', '1.3k', '2.6k', '5.1k', '10k', '20k']
const DB_LABELS = ['+50', '+40', '+30', '+20', '+10', '0', '-10', '-20', '-30', '-40', '-50']
const FILTER_TYPES = ['Bell', 'Low Shelf', 'High Shelf', 'Low Pass', 'High Pass', 'Notch', 'Band Pass']
const SLOPE_OPTS = ['6 dB/oct', '12 dB/oct', '24 dB/oct', '48 dB/oct']
const NEEDS_SLOPE = new Set(['Low Pass', 'High Pass', 'Low Shelf', 'High Shelf'])

const INIT_BANDS: Band[] = BAND_FREQS.map((_, i) => ({
  gain: [2, 5, 7, 3, -2, -4, 1, 3, 5, 2][i],
  type: i === 2 ? 'Low Shelf' : i === 8 ? 'High Shelf' : 'Bell',
  q: i === 2 || i === 8 ? 0.7 : 1.0,
  enabled: true,
}))

const INIT_PRESETS: Preset[] = [
  { name: 'Flat (Default)', isDefault: true, gains: Array(10).fill(0) },
  { name: 'Bass Boost', gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'Vocal Clarity', gains: [0, 0, -2, 0, 3, 5, 4, 2, 0, 0] },
  { name: 'Bright Air', gains: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8] },
  { name: 'Deep House', gains: [7, 5, 3, 1, -2, -1, 0, 2, 3, 4] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flog(f: number): number {
  const lo = Math.log10(20), hi = Math.log10(20000)
  return (Math.log10(Math.max(20, Math.min(f, 20000))) - lo) / (hi - lo)
}

function gY(gain: number, h: number): number {
  return ((50 - gain) / 100) * h
}

function spline(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[i]
    const c = pts[i + 1]
    const e = pts[Math.min(pts.length - 1, i + 2)]
    const cx1 = b.x + (c.x - a.x) / 6
    const cy1 = b.y + (c.y - a.y) / 6
    const cx2 = c.x - (e.x - b.x) / 6
    const cy2 = c.y - (e.y - b.y) / 6
    d += ` C${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
  }
  return d
}

// ─── Style helpers ───────────────────────────────────────────────────────────

function iconBtn(active: boolean): CSSProperties {
  return {
    width: '34px',
    height: '34px',
    background: active ? C.accentMain : C.bgElevated,
    border: `1px solid ${C.border}`,
    color: C.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
    borderRadius: 0,
    padding: 0,
  }
}

const feLabel: CSSProperties = {
  fontSize: '9.5px',
  color: C.textDim,
  marginBottom: '4px',
  fontFamily: FONT,
  letterSpacing: '0.04em',
}

const feBase: CSSProperties = {
  width: '100%',
  height: '30px',
  background: C.bgCard,
  color: C.text,
  border: `1px solid ${C.border}`,
  fontFamily: FONT,
  fontSize: '10px',
  padding: '0 6px',
  outline: 'none',
  borderRadius: 0,
}

const feSecBtn: CSSProperties = {
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: '10px',
  cursor: 'pointer',
  letterSpacing: '0.03em',
  height: '32px',
  borderRadius: 0,
}

const fePrimaryBtn: CSSProperties = {
  background: C.accentMain,
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: '10.5px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
  height: '46px',
  borderRadius: 0,
}

// ─── WaveformCanvas ───────────────────────────────────────────────────────────

function WaveformCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const draw = (ts: number) => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      if (!w || !h) { raf.current = requestAnimationFrame(draw); return }
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      ctx.clearRect(0, 0, w, h)

      const cy = h / 2
      const t = ts * 0.0015
      const pts: [number, number][] = []
      for (let x = 0; x < w; x++) {
        const n = (x / w) * 10 * Math.PI
        pts.push([
          x,
          cy
            + cy * 0.4 * Math.sin(n + t)
            + cy * 0.18 * Math.sin(n * 2.5 + t * 1.3)
            + cy * 0.1 * Math.sin(n * 5.8 + t * 0.8)
            + cy * 0.06 * Math.sin(n * 11 + t * 2.2),
        ])
      }

      ctx.beginPath()
      ctx.strokeStyle = C.accentMain
      ctx.lineWidth = 1.5
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()

      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(232,53,122,0.35)')
      grad.addColorStop(1, 'rgba(232,53,122,0)')
      ctx.fillStyle = grad
      ctx.fill()

      raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%', border: '1px solid rgb(238, 0, 255)' }} />
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>('eq')
  const [showFE, setShowFE] = useState(false)
  const [selBand, setSelBand] = useState(0)
  const [eqOn, setEqOn] = useState(true)
  const [showWave, setShowWave] = useState(true)
  const [showAxis, setShowAxis] = useState(true)
  const [vol, setVol] = useState(0)
  const [bands, setBands] = useState<Band[]>(INIT_BANDS)
  const [presets] = useState<Preset[]>(INIT_PRESETS)
  const [selPreset, setSelPreset] = useState(0)

  // Chart dimensions tracked via ResizeObserver
  const chartRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [cw, setCw] = useState(500)
  const [ch, setCh] = useState(200)

  useEffect(() => {
    if (!chartRef.current) return
    const obs = new ResizeObserver(([e]) => {
      setCw(e.contentRect.width)
      setCh(e.contentRect.height)
    })
    obs.observe(chartRef.current)
    return () => obs.disconnect()
  }, [])

  // EQ curve
  const zeroY = gY(0, ch)
  const bpts = BAND_FREQS.map((f, i) => ({ x: flog(f) * cw, y: gY(bands[i].gain, ch) }))
  const allPts = [{ x: 0, y: zeroY }, ...bpts, { x: cw, y: zeroY }]
  const linePath = spline(allPts)
  const fillPath = linePath + ` L${cw},${ch} L0,${ch} Z`

  // Band dot dragging
  const drag = useCallback((bi: number, e: { preventDefault(): void; stopPropagation(): void }) => {
    e.preventDefault()
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mv = (me: PointerEvent) => {
      const gain = Math.max(-50, Math.min(50, 50 - ((me.clientY - rect.top) / ch) * 100))
      setBands(p => {
        const n = [...p]
        n[bi] = { ...n[bi], gain: Math.round(gain * 10) / 10 }
        return n
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }, [ch])

  // Master volume drag
  const volRef = useRef<HTMLDivElement>(null)
  const volDrag = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const el = volRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mv = (me: PointerEvent) => {
      const v = Math.max(-50, Math.min(50, Math.round(50 - ((me.clientY - rect.top) / rect.height) * 100)))
      setVol(v)
    }
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  const volPct = gY(vol, 100) // % from top
  const presetName = presets[selPreset]?.name ?? 'None'
  const curBand = bands[selBand] ?? bands[0]

  const navTabs: { id: Tab; btnId: string; label: string; icon: ReactNode }[] = [
    {
      id: 'eq', btnId: 'NavEqButton', label: 'EQ',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 9h1.5M6.5 9H15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="10" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 5h7M13 5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="6" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 13h3M9 13h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </svg>
      ),
    },
    {
      id: 'presets', btnId: 'NavPresetsButton', label: 'Presets',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="7" width="9" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="11" width="11" height="2" rx="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'social', btnId: 'NavSocialButton', label: 'SOCIAL',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.8 7.2L10.2 5M5.8 8.8L10.2 11" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'tabs', btnId: 'NavTabsButton', label: 'Tabs',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'more', btnId: 'NavMoreButton', label: 'More',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="13" cy="8" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bgPrimary, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ width: '700px', minWidth: '620px', minHeight: '700px', display: 'flex', flexDirection: 'column', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: 'rgba(255,255,255,0)', marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px', opacity: 1, padding: 0, position: 'relative' }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', flexShrink: 0, marginLeft: '12px', marginRight: '12px' }}>
              <img src={myMelodyImg} alt="My Melody" style={{ position: 'absolute', top: '-10px', left: '16px', width: '90px', height: '90px', objectFit: 'contain', mixBlendMode: 'multiply', zIndex: 999, borderStyle: 'none', borderColor: 'rgba(0,0,0,0)', pointerEvents: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', color: 'rgb(255, 255, 255)', fontWeight: 700, letterSpacing: '0.05em', fontStyle: 'italic' }}>KATER1 Equalizer </div>
              <div id="PresetSubtitleText" style={{ fontSize: '11px', color: C.textDim, marginTop: '6px' }}>Preset: {presetName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button id="CompactViewButton" onClick={() => setShowAxis(v => !v)} title="Compact View" style={{ ...iconBtn(showAxis), background: 'rgb(204, 104, 136)', borderColor: 'rgb(247, 0, 255)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" stroke="rgb(255, 255, 255)" strokeWidth="1.5" />
                <rect x="8" y="1" width="5" height="5" stroke="rgb(255, 255, 255)" strokeWidth="1.5" />
                <rect x="1" y="8" width="5" height="5" stroke="rgb(255, 255, 255)" strokeWidth="1.5" />
                <rect x="8" y="8" width="5" height="5" stroke="rgb(255, 255, 255)" strokeWidth="1.5" />
              </svg>
            </button>
            <button id="ToggleWaveformButton" onClick={() => setShowWave(v => !v)} title="Waveform" style={{ ...iconBtn(showWave), background: 'rgb(204, 104, 136)', color: 'rgb(255, 255, 255)', borderColor: 'rgb(247, 0, 255)' }}>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M0 5h2L4 1l3.5 8.5L10 0l2.5 8.5L14 4H16" stroke="rgb(255, 255, 255)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, opacity: 1 }}>

          {tab === 'social' ? (
            /* SOCIAL PANEL */
            <div id="SocialPanel" style={{ margin: '16px 24px 10px', background: 'rgba(204, 104, 136, 0)', borderRadius: '12px', border: `1px solid ${C.border}`, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ fontSize: '15px', color: 'rgb(232, 53, 122)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>SOCIAL</div>
              <div style={{ fontSize: '12px', color: 'rgb(232, 53, 122)', marginBottom: '16px', lineHeight: 1.9 }}>
                Connect with the developer — follow for updates, releases, and more audio tools.
              </div>
              {(([
                { id: 'FacebookRow', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, name: 'Facebook', sub: 'fb.com/kater1eq' },
                { id: 'InstagramRow', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#C13584"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, name: 'Instagram', sub: '@kater1eq' },
                { id: 'GitHubRow', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#333333"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>, name: 'GitHub', sub: 'github.com/kater1' },
                { id: 'TikTokRow', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>, name: 'TikTok', sub: '@kater1eq' },
                { id: 'SteamRow', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#1b2838"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.718L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.298-.232-1.886-.033l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.447 1.015zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/></svg>, name: 'Steam', sub: 'kater1' },
              ] as { id: string; icon: ReactNode; name: string; sub: string }[])).map(s => (
                <div key={s.id} id={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', cursor: 'pointer', padding: '4px 4px', borderRadius: '4px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: C.text, fontWeight: 700, flexShrink: 0, paddingLeft: '2px', paddingRight: '2px' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgb(109, 103, 108)', fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgb(255, 0, 242)', marginTop: '3px' }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EQ AREA */
            <div style={{ flex: 1, display: 'flex', margin: '16px 24px 10px', minHeight: 0, overflow: 'hidden' }}>

              {/* MASTER VOLUME */}
              <div style={{ width: '64px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '28px', borderStyle: 'solid', fontSize: '16px', color: 'rgb(109, 103, 108)' }}>
                <div id="MasterVolumeText" style={{ fontSize: '11px', color: 'rgb(255, 0, 242)', fontWeight: 700, marginBottom: '8px' }}>
                  {vol >= 0 ? '+' : ''}{vol.toFixed(1)}
                </div>
                <div ref={volRef} onPointerDown={volDrag} style={{ width: '20px', height: '280px', position: 'relative', cursor: 'ns-resize', flexShrink: 0 }}>
                  {/* Track */}
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: '4px', background: C.bgElevated, borderRadius: '2px' }} />
                  {/* Fill toward center */}
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${Math.min(50, volPct)}%`, height: `${Math.abs(50 - volPct)}%`, width: '4px', background: C.accentMain, borderRadius: '2px' }} />
                  {/* Thumb */}
                  <div id="MasterVolumeSlider" style={{ position: 'absolute', left: '50%', top: `${volPct}%`, transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'rgb(204, 104, 136)', border: `2px solid ${C.border}`, cursor: 'ns-resize' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'rgb(255, 0, 242)', marginTop: '10px' }}>VOL</div>
              </div>

              {/* EQ CARD */}
              <div style={{ flex: 1, background: 'rgba(0,0,0,0)', border: 'none', padding: '14px 14px 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: 0 }}>

                {/* Group labels */}
                {showAxis && (
                  <div id="GroupLabelsRow" style={{ display: 'flex', marginLeft: `${DB_AXIS_W}px`, marginBottom: '6px', flexShrink: 0 }}>
                    {['BASS', 'MIDS', 'TREBLE', 'AIR'].map(l => (
                      <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: '9.5px', color: 'rgb(255, 0, 242)', fontWeight: 700, letterSpacing: '0.05em' }}>{l}</div>
                    ))}
                  </div>
                )}

                {/* Chart row */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                  {showAxis && (
                    <div id="DbAxisPanel" style={{ width: `${DB_AXIS_W}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '4px' }}>
                      {DB_LABELS.map(l => (
                        <div key={l} style={{ fontSize: '9px', color: 'rgb(255, 0, 242)', opacity: 0.9, textAlign: 'right', paddingRight: '4px' }}>{l}</div>
                      ))}
                    </div>
                  )}
                  {/* SVG curve */}
                  <div ref={chartRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block', border: '1px solid rgb(238, 0, 255)' }}>
                      <defs>
                        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.accentMain} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={C.accentMain} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid */}
                      {DB_LABELS.map((_, i) => {
                        const y = (i / (DB_LABELS.length - 1)) * ch
                        return (
                          <line key={i} x1={0} y1={y} x2={cw} y2={y}
                            stroke={C.textDim}
                            strokeWidth={i === 5 ? 1 : 0.4}
                            strokeDasharray={i === 5 ? '6 3' : '3 4'}
                            opacity={i === 5 ? 0.5 : 0.15}
                          />
                        )
                      })}
                      {/* EQ fill + line */}
                      <path d={fillPath} fill="url(#eqGrad)" />
                      <path d={linePath} fill="none" stroke={C.accentMain} strokeWidth={2} opacity={eqOn ? 1 : 0.35} />
                      {/* Band dots */}
                      {bpts.map((p, i) => {
                        const sel = selBand === i && showFE
                        const r = sel ? 8 : 6
                        return (
                          <g key={i}>
                            <circle
                              cx={p.x} cy={p.y} r={r}
                              fill={sel ? C.accentMain : C.bgCard}
                              stroke={C.accentMain}
                              strokeWidth={sel ? 2.4 : 1.6}
                              style={{ cursor: 'grab' }}
                              onPointerDown={ev => { drag(i, ev); setSelBand(i); setShowFE(true) }}
                            />
                            <text x={p.x} y={p.y - r - 3} textAnchor="middle" fill={C.textDim}
                              style={{ fontSize: '9px', fontFamily: FONT, pointerEvents: 'none', userSelect: 'none' }}>
                              {i + 1}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>

                {/* Waveform */}
                {showWave && (
                  <div style={{ height: '130px', flexShrink: 0, marginLeft: `${DB_AXIS_W}px`, marginTop: '10px', background: 'transparent', border: 'none', overflow: 'hidden' }}>
                    <WaveformCanvas />
                  </div>
                )}

                {/* Freq ticks */}
                <div style={{ display: 'flex', marginLeft: `${DB_AXIS_W}px`, marginTop: '4px', marginBottom: '8px', flexShrink: 0 }}>
                  {FREQ_TICKS.map(t => (
                    <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'rgb(109, 103, 108)', opacity: 0.8 }}>{t}</div>
                  ))}
                </div>

                {/* ── FILTER EDITOR OVERLAY ── */}
                {showFE && (
                  <div id="FilterEditorPanel" style={{ position: 'absolute', top: '14px', right: '14px', width: '230px', background: C.bgElevated, border: `2px solid ${C.border}`, padding: '14px', boxShadow: '2px 2px 4px rgba(0,0,0,0.3)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: C.text, fontWeight: 700, letterSpacing: '0.04em' }}>FILTER EDITOR</span>
                      <button onClick={() => setShowFE(false)} style={{ width: '20px', height: '20px', background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '16px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ ...feLabel, marginBottom: 0 }}>BAND</span>
                      <span id="FilterEditorBandLabel" style={{ fontSize: '13px', color: C.accentMain, fontWeight: 700 }}>{String(selBand + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <div style={feLabel}>TYPE</div>
                      <select id="FilterEditorTypeCombo" value={curBand.type} onChange={e => setBands(p => { const n = [...p]; n[selBand] = { ...n[selBand], type: e.target.value }; return n })} style={{ ...feBase, cursor: 'pointer', appearance: 'none' as const }}>
                        {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={feLabel}>FREQUENCY (Hz)</div>
                      <input id="FilterEditorFreqBox" type="number" value={BAND_FREQS[selBand]} readOnly style={feBase} />
                    </div>
                    <div>
                      <div style={feLabel}>GAIN (dB)</div>
                      <input id="FilterEditorGainBox" type="number" step="0.1" value={curBand.gain} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setBands(p => { const n = [...p]; n[selBand] = { ...n[selBand], gain: v }; return n }) }} style={feBase} />
                    </div>
                    <div>
                      <div style={feLabel}>Q</div>
                      <input id="FilterEditorQBox" type="number" step="0.1" min="0.1" value={curBand.q} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setBands(p => { const n = [...p]; n[selBand] = { ...n[selBand], q: v }; return n }) }} style={feBase} />
                    </div>
                    {NEEDS_SLOPE.has(curBand.type) && (
                      <div id="FilterEditorSlopeRow">
                        <div style={feLabel}>SLOPE</div>
                        <select id="FilterEditorSlopeCombo" style={{ ...feBase, cursor: 'pointer', appearance: 'none' as const }}>
                          {SLOPE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                      <input id="FilterEditorEnabledCheck" type="checkbox" checked={curBand.enabled} onChange={e => setBands(p => { const n = [...p]; n[selBand] = { ...n[selBand], enabled: e.target.checked }; return n })} style={{ accentColor: C.accentMain, cursor: 'pointer', width: '12px', height: '12px' }} />
                      <span style={{ fontSize: '10px', color: C.textDim, fontFamily: FONT }}>Band Enabled</span>
                    </label>
                    <button onClick={() => setBands(p => { const n = [...p]; n[selBand] = { gain: 0, type: 'Bell', q: 1.0, enabled: true }; return n })} style={{ ...feSecBtn, marginTop: '4px', width: '100%' }}>
                      RESET BAND
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── WARNING ─────────────────────────────────────────────────────── */}
        <div id="WarningPanel" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: 0, marginBottom: '10px', marginLeft: '26px', marginRight: '26px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', color: C.warn }}>⚠</span>
          <span style={{ fontSize: '13px', color: 'rgba(255, 0, 242, 0.97)', lineHeight: 1.6, fontWeight: 700, textAlign: 'center', fontStyle: 'normal', borderWidth: 0, borderStyle: 'none', borderColor: 'rgba(0,0,0,0)' }}>
            Loud audio can harm your hearing, so keep it sensible
          </span>
        </div>

        {/* ── ACTION BAR ──────────────────────────────────────────────────── */}
        <div style={{ padding: '0 24px 14px', flexShrink: 0 }}>
          {(tab === 'eq' || tab === 'tabs' || tab === 'more') && (
            <div id="EqActionsPanel" style={{ display: 'flex', gap: '10px' }}>
              <button id="EqToggleButton" onClick={() => setEqOn(v => !v)} style={{ ...fePrimaryBtn, flex: 1, background: 'rgb(204, 104, 136)', color: 'rgb(255, 255, 255)' }}>
                <span id="EqToggleText">⏻ {eqOn ? 'Stop' : 'Start'} EQ · <span id="SourceNameText">Realtek HD Audio</span></span>
              </button>
              <button onClick={() => setBands(INIT_BANDS)} style={{ ...feSecBtn, height: '46px', padding: '0 18px', whiteSpace: 'nowrap', color: 'rgb(255, 255, 255)', background: 'rgb(204, 104, 136)' }}>
                ↺ Reset
              </button>
            </div>
          )}
          {tab === 'presets' && (
            <div id="PresetsActionsPanel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button id="OverwritePresetButton" style={{ ...feSecBtn, flex: 1, height: '34px', color: 'rgb(255, 255, 255)' }}>Overwrite</button>
                <button id="RenamePresetButton" style={{ ...feSecBtn, flex: 1, height: '34px', color: 'rgb(255, 255, 255)' }}>Rename</button>
                <button id="DeletePresetButton" style={{ ...feSecBtn, flex: 1, height: '34px', color: 'rgb(255, 255, 255)' }}>Delete</button>
              </div>
              <div id="PresetListBox" style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {presets.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelPreset(i); setBands(INIT_BANDS.map((b, bi) => ({ ...b, gain: p.gains[bi] ?? 0 }))) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: `${selPreset === i ? 2 : 1}px solid ${selPreset === i ? C.accentMain : C.border}`, borderRadius: '7px', background: selPreset === i ? C.accentDim : 'transparent', cursor: 'pointer' }}
                  >
                    {p.isDefault && <span style={{ color: C.accentMain, fontSize: '13px' }}>★</span>}
                    <span style={{ fontSize: '11px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                  </div>
                ))}
              </div>
              <button id="AddPresetButton" style={{ ...fePrimaryBtn, width: '100%', color: 'rgb(255, 255, 255)' }}>+ ADD PRESET</button>
            </div>
          )}
        </div>

        {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
        <div style={{ background: C.bgCard, borderTop: '1px solid rgb(247, 0, 255)', padding: '8px 0', display: 'flex', flexShrink: 0 }}>
          {navTabs.map(({ id, btnId, label, icon }) => (
            <button key={id} id={btnId} onClick={() => setTab(id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0', color: tab === id ? C.accentMain : C.textDim, fontFamily: FONT, fontSize: '10px', transition: 'color 0.15s' }}>
              {icon}
              <span style={{ letterSpacing: '0.03em', fontSize: '12px' }}>{label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
