import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarRange, Loader2, Sparkles, Target, Sunrise, Sun, Moon, Apple, Beef, Utensils } from 'lucide-react'
import { chatJSON, AIError } from '../lib/ai.js'
import { ViewHead } from './FoodFinder.jsx'
import { Empty } from '../components/ui.jsx'

const PROGRAMS = [
  { id: 'cut', label: 'Fat loss', kcal: 1800 },
  { id: 'maintain', label: 'Maintain', kcal: 2200 },
  { id: 'bulk', label: 'Lean bulk', kcal: 2800 },
  { id: 'endurance', label: 'Endurance', kcal: 2600 },
]
const DIETS = ['No restriction', 'Vegetarian', 'Vegan', 'High protein', 'Low carb', 'Mediterranean']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const SLOT_META = {
  Breakfast: { icon: Sunrise, cls: 'breakfast', color: '#f59e0b' },
  Lunch: { icon: Sun, cls: 'lunch', color: '#2e9e4f' },
  Dinner: { icon: Moon, cls: 'dinner', color: '#0d9488' },
  Snack: { icon: Apple, cls: 'snack', color: '#8b5cf6' },
}

// Donut ring: calories split by meal type.
function Donut({ segments, center, sub }) {
  const r = 54
  const C = 2 * Math.PI * r
  let off = 0
  return (
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Calories by meal type">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e9f1e0" strokeWidth="15" />
      {segments.map((s, i) => {
        const len = Math.max(0, (s.pct / 100) * C)
        const el = (
          <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="15"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
        )
        off += len
        return el
      })}
      <text x="70" y="67" textAnchor="middle" className="donut-num">{center}</text>
      <text x="70" y="85" textAnchor="middle" className="donut-sub">{sub}</text>
    </svg>
  )
}

export default function MealPlanner({ needKey, onAddDish }) {
  const [program, setProgram] = useState('maintain')
  const [diet, setDiet] = useState('No restriction')
  const [kcal, setKcal] = useState(2200)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const pickProgram = (p) => { setProgram(p.id); setKcal(p.kcal) }

  const generate = async () => {
    if (needKey()) return
    setLoading(true); setErr(''); setPlan(null)
    const pLabel = PROGRAMS.find((p) => p.id === program).label
    try {
      const out = await chatJSON([
        { role: 'system', content: 'You are a meal-planning dietitian. Build a 7-day plan. Reply ONLY JSON: {"days":[{"day":string,"meals":[{"slot":"Breakfast"|"Lunch"|"Dinner"|"Snack","name":string,"kcal":number,"protein":number}]}]}. Exactly 7 days (Mon..Sun), each with Breakfast/Lunch/Dinner/Snack. Keep names short (max 6 words). Daily kcal should sum near the target.' },
        { role: 'user', content: `Program: ${pLabel}. Diet: ${diet}. Daily target: ${kcal} kcal. Vary meals across the week.` },
      ], { temperature: 0.85 })
      setPlan(out.days || [])
    } catch (e) {
      setErr(e instanceof AIError ? e.message : 'Plan generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const dayTotal = (d) => Math.round((d.meals || []).reduce((s, m) => s + (m.kcal || 0), 0))

  const summary = useMemo(() => {
    if (!plan || !plan.length) return null
    let totalKcal = 0, totalProtein = 0, meals = 0
    const bySlot = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 }
    for (const d of plan) for (const m of (d.meals || [])) {
      totalKcal += m.kcal || 0; totalProtein += m.protein || 0; meals++
      if (bySlot[m.slot] != null) bySlot[m.slot] += m.kcal || 0
    }
    const days = plan.length || 1
    const segments = MEALS.map((s) => ({ slot: s, pct: totalKcal ? (bySlot[s] / totalKcal) * 100 : 0, color: SLOT_META[s].color }))
    return { avgKcal: Math.round(totalKcal / days), avgProtein: Math.round(totalProtein / days), meals, days, segments }
  }, [plan])

  const programLabel = PROGRAMS.find((p) => p.id === program).label

  return (
    <div>
      <ViewHead kicker="Plan the week" title="A 7-day program, built for you" sub="Choose a goal and diet, and AI lays out every meal. Tap a dish to send it to your recipe builder." />

      <div className="planner-controls card">
        <div className="ctl-group">
          <label className="lbl"><Target size={13} style={{ verticalAlign: -2 }} /> Program</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROGRAMS.map((p) => (
              <button key={p.id} className={'chip' + (program === p.id ? ' chip-on' : '')} onClick={() => pickProgram(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ctl-group">
          <label className="lbl">Diet</label>
          <select className="field" value={diet} onChange={(e) => setDiet(e.target.value)}>
            {DIETS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="ctl-group" style={{ maxWidth: 160 }}>
          <label className="lbl">Daily kcal</label>
          <input className="field" type="number" step="50" value={kcal} onChange={(e) => setKcal(Number(e.target.value) || 0)} />
        </div>
        <button className="btn btn-accent" style={{ alignSelf: 'flex-end', height: 48 }} onClick={generate} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <CalendarRange size={16} />}
          {plan ? 'Regenerate' : 'Generate plan'}
        </button>
      </div>

      {err && <p className="err-banner">{err}</p>}

      {summary && (
        <motion.div className="mp-bento" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="bento-hero">
            <div className="bento-hero-info">
              <span className="bento-kicker">Daily average</span>
              <div className="bento-bignum">{summary.avgKcal}<span>kcal</span></div>
              <div className="bento-legend">
                {summary.segments.map((s) => (
                  <span key={s.slot} className="bento-leg"><i style={{ background: s.color }} /> {s.slot}<b>{Math.round(s.pct)}%</b></span>
                ))}
              </div>
            </div>
            <Donut segments={summary.segments} center={summary.avgKcal} sub="avg kcal" />
          </div>

          <div className="bento-tile">
            <span className="bento-tile-ico"><Beef size={16} /></span>
            <div className="bento-tile-num">{summary.avgProtein}<span>g</span></div>
            <div className="bento-tile-lbl">Protein / day</div>
          </div>
          <div className="bento-tile">
            <span className="bento-tile-ico"><Utensils size={16} /></span>
            <div className="bento-tile-num">{summary.meals}</div>
            <div className="bento-tile-lbl">Meals planned</div>
          </div>
          <div className="bento-tile bento-tile--accent">
            <span className="bento-tile-ico bento-tile-ico--on"><Target size={16} /></span>
            <div className="bento-tile-num bento-tile-num--sm">{programLabel}</div>
            <div className="bento-tile-lbl">{diet}</div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="week-grid">
          {DAYS.map((d) => <div key={d} className="card day-col skel" style={{ height: 320 }} />)}
        </div>
      ) : !plan ? (
        <Empty icon={CalendarRange} title="No plan yet" sub="Set your program and hit Generate. Your week appears here." />
      ) : (
        <motion.div layout className="week-grid">
          {plan.map((d, di) => (
            <motion.div
              key={di}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: di * 0.05 }}
              className="card day-col"
            >
              <div className="day-head">
                <span className="day-name">{d.day || DAYS[di]}</span>
                <span className="day-kcal">{dayTotal(d)} kcal</span>
              </div>
              <div className="meal-list">
                {(d.meals || []).map((m, mi) => {
                  const meta = SLOT_META[m.slot] || SLOT_META.Snack
                  const Icon = meta.icon
                  return (
                    <button key={mi} className={'meal-card meal-' + meta.cls} onClick={() => onAddDish?.(m)} title="Add to recipe builder">
                      <span className="meal-cardtop">
                        <span className="meal-ico"><Icon size={13} /></span>
                        <span className="meal-slot">{m.slot}</span>
                      </span>
                      <span className="meal-name">{m.name}</span>
                      <span className="meal-stats">
                        <span className="meal-stat">{Math.round(m.kcal)} kcal</span>
                        <span className="meal-stat meal-stat--p">{Math.round(m.protein)}g P</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {plan && <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}><Sparkles size={12} style={{ verticalAlign: -2 }} /> Tap any meal to send it to the recipe builder.</p>}
    </div>
  )
}
