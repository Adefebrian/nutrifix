import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChefHat, Loader2, Minus, Plus, Sparkles } from 'lucide-react'
import { sumMacros, scale } from '../lib/nutrition.js'
import { chatJSON, AIError } from '../lib/ai.js'
import { MacroRow, MacroBar, Empty } from '../components/ui.jsx'
import { ViewHead } from './FoodFinder.jsx'

export default function RecipeBuilder({ items, setItems, needKey }) {
  const [servings, setServings] = useState(2)
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState(null)
  const [err, setErr] = useState('')

  const total = useMemo(() => sumMacros(items), [items])
  const perServing = useMemo(() => {
    const o = {}; for (const k in total) o[k] = Math.round((total[k] / servings) * 10) / 10; return o
  }, [total, servings])

  const setGrams = (id, grams) => setItems((p) => p.map((it) => it.id === id ? { ...it, grams: Math.max(5, grams) } : it))
  const remove = (id) => setItems((p) => p.filter((it) => it.id !== id))

  const generate = async () => {
    if (needKey() || !items.length) return
    setLoading(true); setErr(''); setRecipe(null)
    const ing = items.map((it) => ({ name: it.name, grams: it.grams }))
    try {
      const out = await chatJSON([
        { role: 'system', content: 'You are a creative, practical chef. Build ONE coherent recipe from the given ingredients (assume basic pantry: oil, salt, pepper, water). Reply ONLY JSON: {"title":string,"description":string,"time_minutes":number,"difficulty":"Easy"|"Medium"|"Hard","steps":[string],"tips":[string]}. 4-8 steps.' },
        { role: 'user', content: `Servings: ${servings}. Ingredients (grams): ${JSON.stringify(ing)}. Per-serving nutrition target ~${Math.round(perServing.kcal)} kcal.` },
      ], { temperature: 0.8 })
      setRecipe(out)
    } catch (e) {
      setErr(e instanceof AIError ? e.message : 'Recipe generation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <ViewHead kicker="Cook smart" title="Build a recipe" sub="Add ingredients, dial in grams, watch macros update live, then let AI write the method." />

      <div className="recipe-layout">
        {/* Ingredients */}
        <div>
          <div className="section-bar">
            <h3 style={{ fontSize: 18 }}>Ingredients</h3>
            <span className="pill">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>

          {items.length === 0 ? (
            <Empty icon={ChefHat} title="No ingredients yet" sub="Head to Find Food and tap “Add to recipe”, or build a meal plan and pull dishes in." />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <AnimatePresence initial={false}>
                {items.map((it) => {
                  const m = scale(it.per100g, it.grams)
                  return (
                    <motion.div
                      key={it.id}
                      layout
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, height: 0 }}
                      className="card ing-row"
                    >
                      <span className="ing-dot" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="ing-name">{it.name}</p>
                        <span className="ing-sub">{Math.round(m.kcal)} kcal · P{Math.round(m.protein)} · C{Math.round(m.carbs)} · F{Math.round(m.fat)}</span>
                      </div>
                      <div className="stepper">
                        <button onClick={() => setGrams(it.id, it.grams - 10)} aria-label="less"><Minus size={13} /></button>
                        <input
                          className="stepper-input"
                          type="number" value={it.grams}
                          onChange={(e) => setGrams(it.id, Number(e.target.value) || 5)}
                        /><span className="stepper-unit">g</span>
                        <button onClick={() => setGrams(it.id, it.grams + 10)} aria-label="more"><Plus size={13} /></button>
                      </div>
                      <button className="icon-btn icon-btn--danger" onClick={() => remove(it.id)} aria-label="remove"><Trash2 size={15} /></button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Summary + generate */}
        <div className="recipe-side">
          <div className="card nutri-panel">
            <div className="section-bar" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 18 }}>Nutrition</h3>
              <div className="serv-ctl">
                <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Servings</span>
                <div className="stepper">
                  <button onClick={() => setServings((s) => Math.max(1, s - 1))}><Minus size={13} /></button>
                  <span className="stepper-input" style={{ minWidth: 24 }}>{servings}</span>
                  <button onClick={() => setServings((s) => s + 1)}><Plus size={13} /></button>
                </div>
              </div>
            </div>

            <p className="muted mini-lbl">Per serving</p>
            <MacroRow macros={perServing} />
            <MacroBar macros={perServing} />
            <div className="total-line">
              <span className="muted">Whole recipe</span>
              <span>{Math.round(total.kcal)} kcal · {Math.round(total.protein)}g protein</span>
            </div>

            <button className="btn btn-accent gen-btn" onClick={generate} disabled={loading || !items.length}>
              {loading ? <Loader2 size={16} className="spin" /> : <ChefHat size={16} />}
              {recipe ? 'Regenerate recipe' : 'Generate recipe'}
            </button>
            {err && <p className="err-banner" style={{ marginTop: 12 }}>{err}</p>}
          </div>

          <AnimatePresence>
            {recipe && (
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card recipe-out"
              >
                <span className="pill" style={{ marginBottom: 10 }}><Sparkles size={13} /> AI recipe</span>
                <h3 style={{ fontSize: 22, marginBottom: 6 }}>{recipe.title}</h3>
                <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>{recipe.description}</p>
                <div className="meta-row">
                  <span className="pill">⏱ {recipe.time_minutes} min</span>
                  <span className="pill">{recipe.difficulty}</span>
                </div>
                <ol className="steps">
                  {(recipe.steps || []).map((s, i) => <li key={i}><span className="step-n">{i + 1}</span>{s}</li>)}
                </ol>
                {recipe.tips?.length > 0 && (
                  <div className="tips">
                    <p className="mini-lbl">Chef tips</p>
                    {recipe.tips.map((t, i) => <p key={i} className="tip">· {t}</p>)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
