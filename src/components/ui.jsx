import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Beef, Wheat, Droplet, Plus, Sparkles, Salad } from 'lucide-react'

const GRADE_COLOR = { A: '#16a34a', B: '#65a30d', C: '#ca8a04', D: '#ea7317', E: '#dc2626' }

export function NutriScore({ grade, size = 22 }) {
  if (!grade || !GRADE_COLOR[grade]) return null
  return (
    <span title={`Nutri-Score ${grade}`} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: size * 0.32, fontSize: size * 0.55, fontWeight: 800,
      color: '#fff', background: GRADE_COLOR[grade],
    }}>{grade}</span>
  )
}

const MACROS = [
  { k: 'kcal', label: 'kcal', icon: Flame, unit: '', color: '#2e9e4f' },
  { k: 'protein', label: 'Protein', icon: Beef, unit: 'g', color: '#16a34a' },
  { k: 'carbs', label: 'Carbs', icon: Wheat, unit: 'g', color: '#f59e0b' },
  { k: 'fat', label: 'Fat', icon: Droplet, unit: 'g', color: '#fb7185' },
]

export function MacroRow({ macros, compact = false }) {
  return (
    <div className="macro-row" style={{ gap: compact ? 8 : 12 }}>
      {MACROS.map(({ k, label, icon: Icon, unit, color }) => (
        <div className="macro-cell" key={k}>
          <span className="macro-ico" style={{ color }}><Icon size={compact ? 13 : 15} /></span>
          <span className="macro-val">{macros[k] == null ? '·' : Math.round(macros[k])}<small>{unit}</small></span>
          {!compact && <span className="macro-lbl">{label}</span>}
        </div>
      ))}
    </div>
  )
}

// Stacked macro bar by calories (4/4/9 kcal per g).
export function MacroBar({ macros }) {
  const p = (macros.protein || 0) * 4
  const c = (macros.carbs || 0) * 4
  const f = (macros.fat || 0) * 9
  const tot = p + c + f || 1
  const seg = [
    { w: (p / tot) * 100, color: '#16a34a', label: 'P' },
    { w: (c / tot) * 100, color: '#f59e0b', label: 'C' },
    { w: (f / tot) * 100, color: '#fb7185', label: 'F' },
  ]
  return (
    <div className="macrobar">
      {seg.map((s, i) => (
        <motion.span
          key={s.label}
          initial={{ width: 0 }}
          animate={{ width: `${s.w}%` }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: s.color }}
          title={`${s.label} ${Math.round(s.w)}%`}
        />
      ))}
    </div>
  )
}

export function KindBadge({ kind }) {
  const ingredient = kind === 'ingredient'
  return (
    <span className={'kind-badge ' + (ingredient ? 'kind-ingredient' : 'kind-food')}>
      {ingredient ? 'Ingredient' : 'Food'}
    </span>
  )
}

// Shared, image-led food card used by Find Food + Library.
export function FoodCard({ food: f, score, reason, onAdd, index = 0 }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = f.image && !imgFailed
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      className="card food-card"
    >
      <div className="food-media">
        {showImg
          ? <img src={f.image} alt={f.name} loading="lazy" className="food-img" onError={() => setImgFailed(true)} />
          : <div className="food-img food-img--ph"><Salad size={30} /></div>}
        <KindBadge kind={f.kind} />
        {f.grade && <span className="grade-slot"><NutriScore grade={f.grade} size={30} /></span>}
        {score != null && <span className="match-slot">{Math.round(score)}<small>% match</small></span>}
      </div>

      <div className="food-body">
        <div className="food-head">
          <span className="food-src"><i className="src-dot" /> {f.source}{f.brand ? ` · ${f.brand}` : ''}</span>
          <p className="food-name">{f.name}</p>
        </div>
        <div className="food-macros">
          <MacroRow macros={f.per100g} compact />
          <MacroBar macros={f.per100g} />
          <span className="per-note">per 100 g</span>
        </div>
        {reason && <p className="ai-reason"><Sparkles size={12} /> {reason}</p>}
        {onAdd && (
          <button className="btn btn-ghost food-add" onClick={() => onAdd(f)}>
            <Plus size={14} /> Add to recipe
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function FoodCardSkeleton() {
  return (
    <div className="card food-card food-card--skel">
      <div className="food-media skel" />
      <div className="food-body">
        <div className="skel" style={{ height: 12, width: '40%', borderRadius: 6 }} />
        <div className="skel" style={{ height: 16, width: '80%', borderRadius: 6, marginTop: 8 }} />
        <div className="skel" style={{ height: 34, width: '100%', borderRadius: 8, marginTop: 14 }} />
        <div className="skel" style={{ height: 8, width: '100%', borderRadius: 99, marginTop: 12 }} />
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="empty">
      {Icon && <span className="empty-ico"><Icon size={28} /></span>}
      <p className="empty-title">{title}</p>
      {sub && <p className="muted" style={{ fontSize: 14, maxWidth: 360 }}>{sub}</p>}
    </div>
  )
}
