// Vercel serverless proxy for the Edamam Food Database API (production).
// Mirrors the Vite dev proxy so the client can call /api/edamam/* in both envs.
// Bring-your-own-key: app_id/app_key travel in the query string the client builds.
// No key is stored server-side; nothing is logged.

export default async function handler(req, res) {
  const { path = [], ...rest } = req.query
  const tail = Array.isArray(path) ? path.join('/') : String(path)
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(rest)) {
    if (Array.isArray(v)) for (const item of v) qs.append(k, item)
    else qs.append(k, v)
  }
  const target = `https://api.edamam.com/${tail}?${qs.toString()}`

  const init = { method: req.method }
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
