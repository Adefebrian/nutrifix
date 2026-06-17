import { loadSettings } from './settings.js'

// Multi-source food search. Each source normalizes to one shape:
//   { id, source, kind, name, brand, image, grade, nova, per100g{8 keys} }
// kind: 'ingredient' (whole/raw foods, bahan) | 'food' (prepared/branded, makanan)
// Sources run in parallel; a failing source is skipped, never fatal.

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null)
const toNum = (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null }
const titleCase = (s) =>
  String(s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/,\s*$/, '').trim()
const upGrade = (g) => {
  const u = String(g || '').toUpperCase()
  return 'ABCDE'.includes(u) ? u : ''
}
const saltFromSodiumMg = (mg) => (mg == null ? null : Math.round(mg * 2.5) / 1000)

// ---------- Wger Nutrition DB (keyless, CORS-enabled, open-source) ----------
// Per-100g values; energy in kcal, sodium in grams. Items with a brand are
// packaged foods, the rest are whole-food ingredients.
const WGER = 'https://wger.de/api/v2/ingredient/'
async function searchWger(query, { signal, limit }) {
  const url = `${WGER}?format=json&language=2&limit=${limit}&name=${encodeURIComponent(query)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Wger ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((it) => {
    const sodium = toNum(it.sodium) // grams per 100g
    return {
      id: 'wger-' + it.id,
      source: 'Wger',
      kind: it.brand && String(it.brand).trim() ? 'food' : 'ingredient',
      name: titleCase(it.name || ''),
      brand: (it.brand || '').toString().trim(),
      image: '',
      grade: upGrade(it.nutriscore),
      nova: null,
      per100g: {
        kcal: toNum(it.energy),
        protein: toNum(it.protein), carbs: toNum(it.carbohydrates), sugar: toNum(it.carbohydrates_sugar),
        fat: toNum(it.fat), satfat: toNum(it.fat_saturated), fiber: toNum(it.fiber),
        salt: sodium == null ? null : Math.round(sodium * 2.5 * 1000) / 1000,
      },
    }
  }).filter((f) => f.name && f.per100g.kcal != null)
}

// ---------- Open Food Facts (keyless, via /api/off proxy for UA + clean CORS) ----------
async function searchOFF(query, { signal, limit }) {
  const url = '/api/off/cgi/search.pl' +
    `?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1` +
    `&page_size=${Math.min(limit, 12)}&fields=code,product_name,brands,image_front_small_url,nutriscore_grade,nova_group,nutriments`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`OFF ${res.status}`)
  const data = await res.json()
  return (data.products || []).map((p) => {
    const n = p.nutriments || {}
    let kcal = num(n['energy-kcal_100g'])
    if (kcal == null && n['energy_100g'] != null) kcal = Math.round(n['energy_100g'] / 4.184)
    return {
      id: 'off-' + (p.code || p.product_name),
      source: 'Open Food Facts',
      kind: p.nova_group === 1 ? 'ingredient' : 'food',
      name: titleCase(p.product_name || ''),
      brand: (p.brands || '').split(',')[0].trim(),
      image: p.image_front_small_url || '',
      grade: upGrade(p.nutriscore_grade),
      nova: p.nova_group || null,
      per100g: {
        kcal,
        protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), sugar: num(n.sugars_100g),
        fat: num(n.fat_100g), satfat: num(n['saturated-fat_100g']), fiber: num(n.fiber_100g),
        salt: num(n.salt_100g),
      },
    }
  }).filter((f) => f.name && f.per100g.kcal != null)
}

// ---------- Edamam Food Database (keyed, via /api/edamam proxy) ----------
async function searchEdamam(query, { signal, limit, id, key }) {
  const url = `/api/edamam/api/food-database/v2/parser?app_id=${encodeURIComponent(id)}` +
    `&app_key=${encodeURIComponent(key)}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Edamam ${res.status}`)
  const data = await res.json()
  const seen = new Set()
  const out = []
  for (const h of data.hints || []) {
    const fo = h.food || {}
    if (!fo.foodId || seen.has(fo.foodId)) continue
    seen.add(fo.foodId)
    const nu = fo.nutrients || {}
    const cat = fo.category || ''
    out.push({
      id: 'edm-' + fo.foodId,
      source: 'Edamam',
      kind: /generic/i.test(cat) ? 'ingredient' : 'food',
      name: titleCase(fo.label || ''),
      brand: (fo.brand || '').trim(),
      image: fo.image || '',
      grade: '', nova: null,
      per100g: {
        kcal: num(nu.ENERC_KCAL), protein: num(nu.PROCNT), carbs: num(nu.CHOCDF), sugar: num(nu.SUGAR),
        fat: num(nu.FAT), satfat: num(nu.FASAT), fiber: num(nu.FIBTG), salt: saltFromSodiumMg(num(nu.NA)),
      },
    })
    if (out.length >= limit) break
  }
  return out.filter((f) => f.name && f.per100g.kcal != null)
}

// ---------- Nutritionix (keyed, via /api/nutritionix proxy) ----------
// Branded instant results carry full_nutrients for serving_weight_grams; scale to /100g.
const NIX = { kcal: 208, protein: 203, carbs: 205, sugar: 269, fat: 204, satfat: 606, fiber: 291, sodium: 307 }
async function searchNutritionix(query, { signal, limit, id, key }) {
  const res = await fetch(`/api/nutritionix/v2/search/instant?query=${encodeURIComponent(query)}&detailed=true`, {
    signal,
    headers: { 'x-app-id': id, 'x-app-key': key, 'x-remote-user-id': '0' },
  })
  if (!res.ok) throw new Error(`Nutritionix ${res.status}`)
  const data = await res.json()
  return (data.branded || []).slice(0, limit).map((b) => {
    const w = num(b.serving_weight_grams)
    if (!w) return null
    const by = {}
    for (const x of b.full_nutrients || []) by[x.attr_id] = x.value
    const per = (attr) => (by[attr] == null ? null : Math.round((by[attr] * 100 / w) * 10) / 10)
    let kcal = per(NIX.kcal)
    if (kcal == null && b.nf_calories != null) kcal = Math.round(b.nf_calories * 100 / w)
    return {
      id: 'ntx-' + (b.nix_item_id || b.food_name),
      source: 'Nutritionix',
      kind: 'food',
      name: titleCase(b.food_name || ''),
      brand: (b.brand_name || '').trim(),
      image: b.photo?.thumb || '',
      grade: '', nova: null,
      per100g: {
        kcal, protein: per(NIX.protein), carbs: per(NIX.carbs), sugar: per(NIX.sugar),
        fat: per(NIX.fat), satfat: per(NIX.satfat), fiber: per(NIX.fiber),
        salt: by[NIX.sodium] == null ? null : saltFromSodiumMg(by[NIX.sodium] * 100 / w),
      },
    }
  }).filter((f) => f && f.name && f.per100g.kcal != null)
}

// Drop near-duplicates across sources; keep the richest (image > grade).
function dedupe(list) {
  const seen = new Map()
  const richness = (x) => (x.image ? 2 : 0) + (x.grade ? 1 : 0)
  for (const f of list) {
    const k = f.kind + '|' + f.name.toLowerCase().replace(/\s+/g, ' ').trim()
    const prev = seen.get(k)
    if (!prev || richness(f) > richness(prev)) seen.set(k, f)
  }
  return [...seen.values()]
}

// Interleave by source so the grid isn't dominated by one provider.
function interleave(groups) {
  const out = []
  const max = Math.max(0, ...groups.map((g) => g.length))
  for (let i = 0; i < max; i++) for (const g of groups) if (g[i]) out.push(g[i])
  return out
}

/**
 * Search every enabled source in parallel.
 * @param {string} query
 * @param {{signal?:AbortSignal, kind?:'all'|'ingredient'|'food', limit?:number}} opts
 */
export async function searchFoods(query, { signal, kind = 'all', limit = 16 } = {}) {
  if (!query?.trim()) return []
  const s = loadSettings()
  const tasks = []
  if (s.sources.wger) tasks.push(searchWger(query, { signal, limit }))
  if (s.sources.off) tasks.push(searchOFF(query, { signal, limit }))
  if (s.sources.edamam && s.edamamId.trim() && s.edamamKey.trim())
    tasks.push(searchEdamam(query, { signal, limit, id: s.edamamId.trim(), key: s.edamamKey.trim() }))
  if (s.sources.nutritionix && s.nutritionixId.trim() && s.nutritionixKey.trim())
    tasks.push(searchNutritionix(query, { signal, limit, id: s.nutritionixId.trim(), key: s.nutritionixKey.trim() }))

  const settled = await Promise.allSettled(tasks)
  const groups = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  let foods = dedupe(interleave(groups))
  if (kind === 'ingredient' || kind === 'food') foods = foods.filter((f) => f.kind === kind)
  return foods.slice(0, 48)
}

// Scale per-100g macros to an arbitrary gram amount.
export function scale(per100g, grams) {
  const f = grams / 100
  const out = {}
  for (const k in per100g) out[k] = per100g[k] == null ? null : Math.round(per100g[k] * f * 10) / 10
  return out
}

export function sumMacros(items) {
  const keys = ['kcal', 'protein', 'carbs', 'sugar', 'fat', 'satfat', 'fiber', 'salt']
  const total = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const it of items) {
    const m = scale(it.per100g, it.grams)
    for (const k of keys) total[k] += m[k] || 0
  }
  for (const k of keys) total[k] = Math.round(total[k] * 10) / 10
  return total
}
