// Vercel serverless proxy for Open Food Facts (production).
// Mirrors the Vite dev proxy. Sets a proper User-Agent (OFF throttles
// generic browser agents) and relays errors cleanly. Keyless, nothing logged.

export default async function handler(req, res) {
  const { path = [], ...rest } = req.query
  const tail = Array.isArray(path) ? path.join('/') : String(path)
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(rest)) {
    if (Array.isArray(v)) for (const item of v) qs.append(k, item)
    else qs.append(k, v)
  }
  const target = `https://world.openfoodfacts.org/${tail}?${qs.toString()}`

  const init = { method: req.method, headers: { 'User-Agent': 'Nutrifix/1.0 (https://nutrifix.app)' } }
  if (!['GET', 'HEAD'].includes(req.method)) init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})

  try {
    const upstream = await fetch(target, init)
    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    return res.send(text)
  } catch (e) {
    return res.status(502).json({ error: 'proxy_failed', message: String(e?.message || e) })
  }
}
