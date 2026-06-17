import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, KeyRound, Sparkles, ExternalLink, Check, Apple, Database } from 'lucide-react'
import { FREE_MODELS, PAID_MODELS, FOOD_SOURCES, loadSettings, saveSettings } from '../lib/settings.js'

const KEY_FIELDS = {
  edamam: ['edamamId', 'edamamKey'],
  nutritionix: ['nutritionixId', 'nutritionixKey'],
}

export default function SettingsModal({ open, onClose, onSaved }) {
  const [s, setS] = useState(loadSettings)
  const [revealed, setRevealed] = useState(false)

  const save = () => {
    saveSettings(s)
    onSaved?.(s)
    onClose()
  }

  const toggleSource = (id) => setS((p) => ({ ...p, sources: { ...p.sources, [id]: !p.sources[id] } }))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="card modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3 style={{ fontSize: 22 }}>Settings</h3>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Keys stay on this device · never uploaded
                </p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label className="lbl"><KeyRound size={13} style={{ verticalAlign: -2 }} /> OpenCode Zen API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="field"
                    type={revealed ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={s.apiKey}
                    onChange={(e) => setS({ ...s, apiKey: e.target.value })}
                    style={{ paddingRight: 64 }}
                  />
                  <button
                    onClick={() => setRevealed((r) => !r)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: 'var(--grass)' }}
                  >{revealed ? 'Hide' : 'Show'}</button>
                </div>
                <a
                  href="https://opencode.ai/auth" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}
                >
                  Get a free key <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="lbl"><Sparkles size={13} style={{ verticalAlign: -2 }} /> AI Model</label>
                <div className="model-grid">
                  {[['Free', FREE_MODELS], ['Premium', PAID_MODELS]].map(([group, list]) => (
                    <div key={group}>
                      <div className="model-group-label">{group}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {list.map((m) => (
                          <button
                            key={m}
                            onClick={() => setS({ ...s, model: m })}
                            className={'chip' + (s.model === m ? ' chip-on' : '')}
                          >
                            {s.model === m && <Check size={13} />}
                            {m.replace(/-free$/, '')}
                            {group === 'Free' && <span className="free-dot">free</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="lbl"><Database size={13} style={{ verticalAlign: -2 }} /> Food data sources</label>
                <div className="src-list">
                  {FOOD_SOURCES.map((src) => {
                    const on = s.sources[src.id]
                    const [idField, keyField] = KEY_FIELDS[src.id] || []
                    return (
                      <div className="src-item" key={src.id}>
                        <button type="button" className={'src-row' + (on ? ' src-row-on' : '')} onClick={() => toggleSource(src.id)}>
                          <span className="src-meta">
                            <span className="src-name">
                              {src.label}
                              {src.keyless && <span className="src-tag">no key</span>}
                            </span>
                            <span className="src-note">{src.note}</span>
                          </span>
                          <span className={'switch' + (on ? ' switch-on' : '')} aria-hidden="true"><span className="switch-dot" /></span>
                        </button>

                        {!src.keyless && on && (
                          <div className="src-keys">
                            <input
                              className="field" placeholder="App ID"
                              value={s[idField]} onChange={(e) => setS({ ...s, [idField]: e.target.value })}
                            />
                            <input
                              className="field" type="password" placeholder="App Key"
                              value={s[keyField]} onChange={(e) => setS({ ...s, [keyField]: e.target.value })}
                            />
                            {src.signup && (
                              <a href={src.signup} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                                Get free {src.label} keys <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-accent" onClick={save}>Save settings</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
