import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { Salad, Search, ChefHat, CalendarRange, LayoutGrid, Settings, Sparkles, ArrowRight, Instagram, Github, Globe } from 'lucide-react'
import SettingsModal from './components/SettingsModal.jsx'
import FoodFinder from './views/FoodFinder.jsx'
import Library from './views/Library.jsx'
import RecipeBuilder from './views/RecipeBuilder.jsx'
import MealPlanner from './views/MealPlanner.jsx'
import { loadSettings } from './lib/settings.js'
import './components.css'

const TABS = [
  { id: 'find', label: 'Find Food', icon: Search },
  { id: 'library', label: 'Library', icon: LayoutGrid },
  { id: 'recipe', label: 'Recipe', icon: ChefHat },
  { id: 'plan', label: 'Meal Plan', icon: CalendarRange },
]

export default function App() {
  const [tab, setTab] = useState('find')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hasKey, setHasKey] = useState(() => !!loadSettings().apiKey)
  const [items, setItems] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const flash = (msg) => setToast(msg)

  // Gate AI features behind a key; open settings if missing.
  const needKey = useCallback(() => {
    if (!loadSettings().apiKey) { setSettingsOpen(true); flash('Add your OpenCode Zen key to use AI'); return true }
    return false
  }, [])

  const addFood = useCallback((food) => {
    setItems((p) => {
      if (p.some((it) => it.id === food.id)) { flash(`${food.name} already added`); return p }
      flash(`Added ${food.name}`)
      return [...p, { ...food, grams: 100 }]
    })
  }, [])

  const addDish = useCallback((meal) => {
    const id = 'dish-' + meal.name + meal.slot
    setItems((p) => {
      if (p.some((it) => it.id === id)) return p
      flash(`Added ${meal.name}`)
      return [...p, {
        id, name: meal.name, brand: meal.slot, image: '', grade: '', grams: 100,
        per100g: { kcal: meal.kcal || 0, protein: meal.protein || 0, carbs: null, sugar: null, fat: null, satfat: null, fiber: null, salt: null },
      }]
    })
    setTab('recipe')
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div className="brand" onClick={() => setTab('find')}>
            <span className="brand-mark"><Salad size={19} /></span>
            <span className="brand-name">Nutri<span>fix</span></span>
          </div>

          <nav className="tabs">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button key={t.id} className={'tab' + (active ? ' tab-on' : '')} onClick={() => setTab(t.id)}>
                  {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                  <span className="tab-content"><Icon size={15} /> <span className="tab-label">{t.label}</span>
                    {t.id === 'recipe' && items.length > 0 && <span className="tab-badge">{items.length}</span>}
                  </span>
                </button>
              )
            })}
          </nav>

          <button className="btn btn-ghost settings-btn" onClick={() => setSettingsOpen(true)}>
            <Settings size={15} />
            <span className={'key-dot' + (hasKey ? ' key-dot--on' : '')} title={hasKey ? 'AI connected' : 'No key'} />
          </button>
        </div>
      </header>

      {tab === 'find' && <Hero onStart={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })} hasKey={hasKey} onConnect={() => setSettingsOpen(true)} />}

      <main className="wrap main" id="work">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'find' && <FoodFinder needKey={needKey} onAdd={addFood} />}
            {tab === 'library' && <Library onAdd={addFood} />}
            {tab === 'recipe' && <RecipeBuilder items={items} setItems={setItems} needKey={needKey} />}
            {tab === 'plan' && <MealPlanner needKey={needKey} onAddDish={addDish} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="footer-inner wrap">
          <div className="footer-cols">
            <div className="footer-brand-col">
              <span className="footer-brand"><span className="footer-mark"><Salad size={17} /></span> Nutrifix</span>
              <p className="footer-tagline">Eat fresh, hit your macros. Search real foods, build balanced recipes, and plan your whole week — powered by open nutrition data.</p>
              <div className="footer-socials">
                <a href="https://instagram.com/brianeedsleep" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
                <a href="https://github.com/adefebrian" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a>
                <a href="https://adefebrian.com" target="_blank" rel="noreferrer" aria-label="Website"><Globe size={17} /></a>
              </div>
            </div>

            <nav className="footer-col" aria-label="Product">
              <h4 className="footer-col-h">Product</h4>
              <button onClick={() => setTab('find')}>Find Food</button>
              <button onClick={() => setTab('library')}>Library</button>
              <button onClick={() => setTab('recipe')}>Recipe Builder</button>
              <button onClick={() => setTab('plan')}>Meal Planner</button>
            </nav>

            <nav className="footer-col" aria-label="Data sources">
              <h4 className="footer-col-h">Data sources</h4>
              <a href="https://wger.de" target="_blank" rel="noreferrer">Wger</a>
              <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>
              <a href="https://www.edamam.com" target="_blank" rel="noreferrer">Edamam</a>
              <a href="https://www.nutritionix.com" target="_blank" rel="noreferrer">Nutritionix</a>
            </nav>

            <nav className="footer-col" aria-label="About">
              <h4 className="footer-col-h">About</h4>
              <a href="https://adefebrian.com" target="_blank" rel="noreferrer">Made by Brian</a>
              <a href="https://github.com/adefebrian" target="_blank" rel="noreferrer">Source code</a>
              <button onClick={() => setSettingsOpen(true)}>Settings</button>
            </nav>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Nutrifix. All rights reserved.</span>
            <span className="footer-built">Built with React · Vite · Framer Motion</span>
          </div>
        </div>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={(s) => { setHasKey(!!s.apiKey); flash('Settings saved') }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <Sparkles size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

function Hero({ onStart, hasKey, onConnect }) {
  return (
    <section className="hero wrap">
      <motion.div className="hero-copy" initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.08 } } }}>
        {[
          <h1 className="hero-title" key="t">Eat <em>fresh.</em><br />Hit your macros.</h1>,
          <p className="hero-sub" key="s">Search real foods by their numbers, build balanced recipes, and plan a whole week, in one calm, fresh workspace.</p>,
        ].map((el, i) => (
          <motion.div key={i} variants={{ h: { opacity: 0, y: 18 }, s: { opacity: 1, y: 0 } }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {el}
          </motion.div>
        ))}
        <motion.div className="hero-cta" variants={{ h: { opacity: 0, y: 18 }, s: { opacity: 1, y: 0 } }} transition={{ duration: 0.5 }}>
          <button className="btn btn-primary" onClick={onStart}>Start exploring <ArrowRight size={16} /></button>
          {!hasKey && <button className="btn btn-ghost" onClick={onConnect}><Sparkles size={15} /> Connect AI</button>}
        </motion.div>
        <motion.div className="hero-stats" variants={{ h: { opacity: 0 }, s: { opacity: 1 } }} transition={{ delay: 0.4 }}>
          {[['600k+', 'foods'], ['7-day', 'plans'], ['Free', 'AI models']].map(([n, l]) => (
            <div key={l}><strong>{n}</strong><span>{l}</span></div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-art"
        initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bean-ring">
          <motion.div className="bean-core" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Salad size={58} />
          </motion.div>
          {['Protein', 'Carbs', 'Fat', 'Fiber'].map((m, i) => (
            <motion.span
              key={m} className="orbit-chip" style={{ '--i': i }}
              animate={{ y: [0, i % 2 ? 8 : -8, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
            >{m}</motion.span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
