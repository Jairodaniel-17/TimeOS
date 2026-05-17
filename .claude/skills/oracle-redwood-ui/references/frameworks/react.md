# Frameworks — React

Componentes Redwood en React con hooks. Mismos tokens y clases que Vue/Svelte.
Usa `@theme` v4 para proyectos Vite → clases `redwood-*`.

---

## KPIStatCard

```tsx
// KPIStatCard.tsx
interface Props {
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  emphasis?: boolean
}

export function KPIStatCard({ title, value, subtitle, trend, emphasis }: Props) {
  return (
    <article className={[
      "min-h-[132px] rounded-lg border bg-redwood-surface px-5 py-4 shadow-rw transition-colors",
      emphasis ? "border-redwood-primary" : "border-redwood-border"
    ].join(" ")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">{title}</p>
      <p className="mt-2 text-[28px] leading-none font-bold text-redwood-text">{value}</p>
      {subtitle && <p className="mt-3 text-xs text-redwood-muted">{subtitle}</p>}
      {trend && <p className="mt-2 text-xs font-medium text-redwood-primary">{trend}</p>}
    </article>
  )
}
```

---

## RiskBadge

```tsx
// RiskBadge.tsx
type Level = "Alto" | "Medio" | "Bajo"

const classes: Record<Level, string> = {
  Alto:  "bg-badge-subtle-danger-bg  text-redwood-text border-redwood-danger/15",
  Medio: "bg-badge-subtle-warning-bg text-redwood-text border-badge-strong-warning-bg/20",
  Bajo:  "bg-badge-subtle-success-bg text-redwood-text border-redwood-green/20",
}

export function RiskBadge({ level }: { level: Level }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap ${classes[level]}`}>
      {level}
    </span>
  )
}
```

---

## FilterSelect (single dropdown)

```tsx
// FilterSelect.tsx
import { useState, useRef, useEffect } from "react"

interface Option { value: string; label: string }
interface Props {
  label: string
  value: string
  options: Option[]
  locked?: boolean
  onChange: (value: string) => void
}

export function FilterSelect({ label, value, options, locked, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabel = options.find(o => o.value === value)?.label ?? value

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button type="button"
        onClick={() => !locked && setOpen(o => !o)}
        className={[
          "inline-flex items-center gap-[5px] h-8 px-[11px] border rounded-rw-md bg-rw-surface text-xs whitespace-nowrap transition-all",
          open ? "border-rw-focus shadow-[0_0_0_3px_rgba(42,104,139,.10)]" : "border-rw-border hover:border-[#a0a0a0] hover:bg-rw-surface-soft",
          locked ? "opacity-65 cursor-default" : "cursor-pointer"
        ].join(" ")}>
        <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-rw-muted">{label}</span>
        <span className="w-px h-[10px] bg-rw-border" />
        <span className="text-xs font-medium text-rw-text">{selectedLabel}</span>
        {!locked && (
          <svg className={`w-3 h-3 text-rw-muted transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        )}
      </button>
      {open && !locked && (
        <div className="absolute z-[60] top-[calc(100%+5px)] right-0 min-w-[130px]
          bg-rw-surface border border-rw-border rounded-xl shadow-rw-md p-[5px] grid gap-0.5">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={[
                "w-full border-0 rounded-[7px] px-2.5 py-[7px] text-left text-xs font-semibold flex items-center gap-[7px] transition-colors",
                opt.value === value ? "bg-rw-selected text-rw-selected-bd" : "bg-transparent text-rw-text hover:bg-rw-hover"
              ].join(" ")}>
              <span className={`w-[5px] h-[5px] rounded-full bg-current flex-shrink-0 ${opt.value === value ? "opacity-100" : "opacity-0"}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## EmployeeMultiSelect

```tsx
// EmployeeMultiSelect.tsx
import { useState, useRef, useEffect } from "react"

interface Option { value: string; label: string }
interface Props {
  options: Option[]
  excludedIds: Set<string>
  onChange: (next: Set<string>) => void
}

export function EmployeeMultiSelect({ options, excludedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const activeCount = options.filter(o => !excludedIds.has(o.value)).length
  const allActive = excludedIds.size === 0

  function toggle(value: string) {
    const next = new Set(excludedIds)
    next.has(value) ? next.delete(value) : next.add(value)
    onChange(next)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const triggerLabel = allActive ? `Todos (${options.length})` : activeCount === 0 ? "Ninguno" : `${activeCount} de ${options.length}`

  return (
    <div ref={containerRef} className="relative w-full">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={[
          "h-9 w-full flex items-center justify-between gap-2 rounded-sm border bg-white px-3 text-sm outline-none transition",
          open ? "border-redwood-focus-ring ring-2 ring-redwood-focus-ring/20" : "border-redwood-border"
        ].join(" ")}>
        <span className="truncate text-redwood-text">{triggerLabel}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {excludedIds.size > 0 && (
            <span className="rounded-full bg-redwood-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-redwood-danger">
              -{excludedIds.size}
            </span>
          )}
          <svg className={`h-4 w-4 text-redwood-muted transition-transform duration-150 ${open ? "-rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg
          border border-redwood-border bg-white shadow-xl" style={{minWidth:"100%"}}>
          {/* search + bulk + list — estructura de components/select.md */}
        </div>
      )}
    </div>
  )
}
```

---

## CopyButton

```tsx
// CopyButton.tsx
import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy}
      className={[
        "bg-transparent border border-transparent text-rw-muted px-2 py-1 rounded-[6px] inline-flex items-center gap-1 text-xs transition-colors cursor-pointer",
        "hover:bg-rw-hover hover:text-rw-text hover:border-rw-border",
        copied ? "bg-[rgba(67,106,40,0.08)] border-[rgba(67,106,40,0.2)]" : ""
      ].join(" ")}
      title={copied ? "Copiado" : "Copiar"}>
      <span style={{animation: copied ? "icon-pop .2s cubic-bezier(.34,1.56,.64,1)" : undefined}}>
        {copied
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rw-success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        }
      </span>
    </button>
  )
}
```

---

## DashboardTabs

```tsx
// DashboardTabs.tsx
interface Tab { id: string; label: string; count?: number }
interface Props { tabs: Tab[]; activeTab: string; onChange: (id: string) => void }

export function DashboardTabs({ tabs, activeTab, onChange }: Props) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-redwood-border pb-px">
      {tabs.map(tab => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)}
          className={[
            "inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === tab.id
              ? "border-redwood-border bg-redwood-surface text-redwood-text"
              : "border-transparent text-redwood-muted hover:bg-redwood-hover-bg hover:text-redwood-text"
          ].join(" ")}>
          <span>{tab.label}</span>
          {tab.count != null && (
            <small className="rounded-full border border-redwood-border bg-redwood-hover-bg px-2 py-0.5 text-[11px] font-semibold text-redwood-muted">
              {tab.count}
            </small>
          )}
        </button>
      ))}
    </nav>
  )
}
```
