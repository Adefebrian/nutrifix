// Persisted user settings (API keys + model + food-source toggles).
// Keys stay in localStorage only, never bundled, never committed.
const KEY = 'nutrifix.settings.v1'

export const FREE_MODELS = [
  'deepseek-v4-flash-free',
  'qwen3.6-plus-free',
  'minimax-m3-free',
  'nemotron-3-ultra-free',
  'mimo-v2.5-free',
  'big-pickle',
]

export const PAID_MODELS = [
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'gpt-5.4-mini',
  'gemini-3.5-flash',
  'deepseek-v4-flash',
]

// Food data sources. usda + off are keyless (always available);
// edamam + nutritionix need a free app id/key pair.
export const FOOD_SOURCES = [
  { id: 'wger', label: 'Wger Nutrition DB', keyless: true, note: 'Open ingredient & food database · no key' },
  { id: 'off', label: 'Open Food Facts', keyless: true, note: 'Packaged & local products + photos · global' },
  { id: 'edamam', label: 'Edamam', keyless: false, note: 'Generic + packaged foods + photos', signup: 'https://developer.edamam.com/edamam-food-and-grocery-database-api' },
  { id: 'nutritionix', label: 'Nutritionix', keyless: false, note: 'Branded products + photos', signup: 'https://developer.nutritionix.com/' },
]

const DEFAULTS = {
  apiKey: '',
  model: 'deepseek-v4-flash-free',
  edamamId: '',
  edamamKey: '',
  nutritionixId: '',
  nutritionixKey: '',
  sources: { wger: true, off: true, edamam: true, nutritionix: true },
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...DEFAULTS, ...saved, sources: { ...DEFAULTS.sources, ...(saved.sources || {}) } }
  } catch {
    return { ...DEFAULTS, sources: { ...DEFAULTS.sources } }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}
