import { loadSettings } from './settings.js'

// OpenCode Zen: OpenAI-compatible chat completions.
// Dev: routed through Vite proxy (/api/zen) to dodge CORS.
// Prod: set VITE_ZEN_BASE to your own proxy/edge function.
const BASE = import.meta.env.VITE_ZEN_BASE || '/api/zen/v1'

export class AIError extends Error {}

async function post(body, apiKey, signal) {
  try {
    return await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new AIError('Network error reaching OpenCode Zen. Check your connection.')
  }
}

export async function chat(messages, { json = false, temperature = 0.7, signal } = {}) {
  const { apiKey, model } = loadSettings()
  if (!apiKey) throw new AIError('NO_KEY')

  const base = { model, messages, temperature }
  let res = await post(json ? { ...base, response_format: { type: 'json_object' } } : base, apiKey, signal)

  // Some models reject response_format with a 400 -> retry plain, lean on the prompt + parser.
  if (!res.ok && res.status === 400 && json) {
    res = await post(base, apiKey, signal)
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new AIError('Invalid API key. Update it in Settings.')
    if (res.status === 429) throw new AIError('Rate limited. Wait a moment or pick another free model.')
    throw new AIError(`Zen error ${res.status}: ${txt.slice(0, 160)}`)
  }

  const data = await res.json().catch(() => null)
  return data?.choices?.[0]?.message?.content ?? ''
}

// Robust JSON extraction: models sometimes wrap in prose / fences.
export function parseJSON(text) {
  if (!text) throw new AIError('Empty AI response.')
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1] : text
  const start = raw.search(/[[{]/)
  if (start === -1) throw new AIError('No JSON found in AI response.')
  // walk to matching close
  const open = raw[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0, end = -1
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === open) depth++
    else if (raw[i] === close) { depth--; if (depth === 0) { end = i; break } }
  }
  const slice = end === -1 ? raw.slice(start) : raw.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch {
    throw new AIError('Could not parse AI JSON. Try regenerating.')
  }
}

export async function chatJSON(messages, opts = {}) {
  const txt = await chat(messages, { ...opts, json: true })
  return parseJSON(txt)
}
