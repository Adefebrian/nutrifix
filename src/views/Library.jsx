import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, LayoutGrid, Carrot, Package } from 'lucide-react'
import { searchFoods } from '../lib/nutrition.js'
import { FoodCard, FoodCardSkeleton, Empty } from '../components/ui.jsx'
import { ViewHead } from './FoodFinder.jsx'

const KINDS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'ingredient', label: 'Ingredients', icon: Carrot },
  { id: 'food', label: 'Foods', icon: Package },
]

export default function Library({ onAdd }) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)
  const ctl = useRef(null)

  const run = async (e) => {
    e?.preventDefault()
    if (!q.trim()) return
    ctl.current?.abort()
    ctl.current = new AbortController()
    setLoading(true); setErr('')
    try {
      const r = await searchFoods(q, { signal: ctl.current.signal, kind: 'all', limit: 16 })
      setAll(r); setSearched(true)
      if (!r.length) setErr('No foods found. Try another term, or enable more sources in Settings.')
    } catch (e) {
      if (e.name !== 'AbortError') setErr('Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const shown = kind === 'all' ? all : all.filter((f) => f.kind === kind)
  const counts = {
    all: all.length,
    ingredient: all.filter((f) => f.kind === 'ingredient').length,
    food: all.filter((f) => f.kind === 'food').length,
  }

  return (
    <div>
      <ViewHead
        kicker="Food library"
        title="Browse foods & ingredients"
        sub="Search every source at once, then split results into ingredients (whole foods) and prepared foods. Tap Add to send anything to your recipe."
      />

      <div className="library-bar card">
        <form onSubmit={run} className="search-bar">
          <Search size={18} className="search-lead" />
          <input
            className="search-input"
            placeholder="e.g. oats, chicken breast, granola bar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary" disabled={loading || !q.trim()}>
            {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Search
          </button>
        </form>

        <div className="kind-tabs">
          {KINDS.map((k) => {
            const Icon = k.icon
            return (
              <button
                key={k.id}
                className={'kind-tab' + (kind === k.id ? ' kind-tab-on' : '')}
                onClick={() => setKind(k.id)}
              >
                <Icon size={14} /> {k.label}
                {searched && <span className="kind-count">{counts[k.id]}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {err && <p className="err-banner">{err}</p>}

      {loading ? (
        <div className="food-grid">
          {Array.from({ length: 8 }).map((_, i) => <FoodCardSkeleton key={i} />)}
        </div>
      ) : !searched ? (
        <Empty icon={LayoutGrid} title="Search the library" sub="Whole ingredients and packaged foods from USDA, Open Food Facts, and any keyed sources you enable." />
      ) : shown.length === 0 ? (
        <Empty icon={LayoutGrid} title="Nothing in this filter" sub="No items match this category. Try “All” or a different search." />
      ) : (
        <motion.div layout className="food-grid">
          <AnimatePresence>
            {shown.map((f, i) => <FoodCard key={f.id} food={f} index={i} onAdd={onAdd} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
