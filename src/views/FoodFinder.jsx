import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { searchFoods } from '../lib/nutrition.js'
import { chatJSON, AIError } from '../lib/ai.js'
import { FoodCard, FoodCardSkeleton, Empty } from '../components/ui.jsx'

const GOALS = [
  { id: 'balanced', label: 'Balanced diet' },
  { id: 'lose', label: 'Lose weight' },
  { id: 'muscle', label: 'Build muscle' },
  { id: 'lowcarb', label: 'Low carb' },
  { id: 'heart', label: 'Heart healthy' },
  { id: 'energy', label: 'Endurance / energy' },
]

export default function FoodFinder({ needKey, onAdd }) {
  const [goal, setGoal] = useState('balanced')
  const [q, setQ] = useState('')
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [err, setErr] = useState('')
  const [matched, setMatched] = useState(null) // {name: {score, reason}}
  const ctl = useRef(null)

  const run = async (e) => {
    e?.preventDefault()
    if (!q.trim()) return
    ctl.current?.abort()
    ctl.current = new AbortController()
    setLoading(true); setErr(''); setMatched(null)
    try {
      const r = await searchFoods(q, { signal: ctl.current.signal })
      setFoods(r)
      if (!r.length) setErr('No foods found. Try another term.')
    } catch (e) {
      if (e.name !== 'AbortError') setErr('Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const aiMatch = async () => {
    if (needKey()) return
    setAiLoading(true); setErr('')
    const goalLabel = GOALS.find((g) => g.id === goal).label
    const list = foods.slice(0, 18).map((f) => ({
      name: f.name,
      kcal: f.per100g.kcal, protein: f.per100g.protein, carbs: f.per100g.carbs,
      fat: f.per100g.fat, sugar: f.per100g.sugar, fiber: f.per100g.fiber,
    }))
    try {
      const out = await chatJSON([
        { role: 'system', content: 'You are a precise nutrition coach. Rank foods for a goal. Reply ONLY with JSON: {"items":[{"name":string,"score":number(0-100),"reason":string(max 14 words)}]}. Use the exact names given.' },
        { role: 'user', content: `Goal: ${goalLabel}. Rank these foods (per 100g):\n${JSON.stringify(list)}` },
      ], { temperature: 0.4 })
      const map = {}
      for (const it of out.items || []) map[it.name] = { score: it.score, reason: it.reason }
      setMatched(map)
      setFoods((prev) => [...prev].sort((a, b) => (map[b.name]?.score || 0) - (map[a.name]?.score || 0)))
    } catch (e) {
      setErr(e instanceof AIError ? e.message : 'AI match failed.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <div className="finder-panel card">
        <div className="finder-goals">
          <label className="lbl">Choose your goal</label>
          <div className="goal-chips">
            {GOALS.map((g) => (
              <button
                key={g.id}
                className={'chip' + (goal === g.id ? ' chip-on' : '')}
                onClick={() => setGoal(g.id)}
              >{g.label}</button>
            ))}
          </div>
        </div>

        <div className="finder-search">
          <label className="lbl">Search a food</label>
          <form onSubmit={run} className="search-bar">
            <Search size={18} className="search-lead" />
            <input
              className="search-input"
              placeholder="e.g. greek yogurt, oats, salmon"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-primary" disabled={loading || !q.trim()}>
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Search
            </button>
          </form>
        </div>
      </div>

      {foods.length > 0 && (
        <div className="ai-match-row">
          <button className="btn btn-accent" onClick={aiMatch} disabled={aiLoading}>
            {aiLoading ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
            {matched ? 'Re-rank with AI' : 'AI match for goal'}
          </button>
          {matched && <span className="pill"><Sparkles size={13} /> Ranked for {GOALS.find((g) => g.id === goal).label}</span>}
        </div>
      )}

      {err && <p className="err-banner">{err}</p>}

      {loading ? (
        <div className="food-grid">
          {Array.from({ length: 6 }).map((_, i) => <FoodCardSkeleton key={i} />)}
        </div>
      ) : foods.length === 0 ? (
        <Empty icon={Search} title="Start with a search" sub="Try “tofu”, “peanut butter”, or “whole grain bread”." />
      ) : (
        <motion.div layout className="food-grid">
          <AnimatePresence>
            {foods.map((f, i) => {
              const m = matched?.[f.name]
              return (
                <FoodCard
                  key={f.id || f.name + i}
                  food={f}
                  index={i}
                  score={m?.score}
                  reason={m?.reason}
                  onAdd={onAdd}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export function ViewHead({ kicker, title, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="view-head"
    >
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      <p className="muted view-sub">{sub}</p>
    </motion.div>
  )
}
