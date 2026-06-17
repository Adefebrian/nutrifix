// Vercel serverless proxy for OpenCode Zen (production).
// Mirrors the Vite dev proxy so the client can call /api/zen/* in both envs.
// Bring-your-own-key: the user's Authorization header is forwarded as-is.
// No key is stored server-side; nothing is logged.

export default async function handler(req, res) {
  const { path = [] } = req.query
  const tail = Array.isArray(path) ? path.join('/') : String(path)
  const target = `https://opencode.ai/zen/${tail}`

  const auth = req.headers['authorization']
  if (!auth) return res.status(401).json({ error: 'missing_authorization' })

  const init = {
    method: req.method,
    headers: { 'Content-Type': 'application/json', Authorization: auth },
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  }

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
