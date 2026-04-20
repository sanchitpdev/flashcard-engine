import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const STATUS = {
  READY:      { label:'Ready',      cls:'badge-green'  },
  PROCESSING: { label:'Processing', cls:'badge-yellow' },
  FAILED:     { label:'Failed',     cls:'badge-red'    },
}

/* Circular progress ring SVG */
function ProgressRing({ pct, size = 64, stroke = 6, color = 'var(--primary)' }) {
  const r   = (size - stroke) / 2
  const c   = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" style={{ opacity: 0.15 }} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off}
                strokeLinecap="round"
                className="progress-ring-circle"
                style={{ transition:'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
  )
}

export default function Decks() {
  const [decks,     setDecks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [progMap,   setProgMap]   = useState({})
  const [dragOver,  setDragOver]  = useState(false)
  const fileRef  = useRef()
  const navigate = useNavigate()

  const load = async () => {
    try {
      const res = await api.get('/api/decks')
      setDecks(res.data)
      const ready   = res.data.filter(d => d.status === 'READY')
      const results = await Promise.allSettled(ready.map(d => api.get(`/api/progress/deck/${d.id}`)))
      const map = {}
      ready.forEach((d, i) => { if (results[i].status === 'fulfilled') map[d.id] = results[i].value.data })
      setProgMap(map)
    } catch { setError('Failed to load decks') }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    load()
    const id = setInterval(() => { if (decks.some(d => d.status === 'PROCESSING')) load() }, 4000)
    return () => clearInterval(id)
  }, [decks.length])

  const doUpload = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Only PDF files are supported'); return }
    if (file.size > 10 * 1024 * 1024)   { setError('File must be under 10 MB'); return }
    setError(''); setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post('/api/decks', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await load()
    } catch (err) { setError(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const upload = (e) => doUpload(e.target.files[0])

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    doUpload(e.dataTransfer.files[0])
  }

  const del = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this deck?')) return
    try { await api.delete(`/api/decks/${id}`); setDecks(decks.filter(d => d.id !== id)) }
    catch { setError('Failed to delete deck') }
  }

  /* ── summary stats ── */
  const readyDecks  = decks.filter(d => d.status === 'READY')
  const totalCards  = readyDecks.reduce((sum, d) => sum + (progMap[d.id]?.totalCards || 0), 0)
  const totalLearn  = readyDecks.reduce((sum, d) => sum + (progMap[d.id]?.mastered  || 0), 0)

  return (
      <div className="page">

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:36, gap:20, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ marginBottom:8, fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)' }}>My Decks</h1>
            <p style={{ color:'var(--text-sub)', fontSize:'1.1rem', fontWeight:600 }}>Upload a PDF to generate AI-powered flashcards</p>
          </div>
          <label style={{ cursor:'pointer', flexShrink:0 }}>
            <input type="file" accept=".pdf" ref={fileRef} onChange={upload} style={{ display:'none' }} />
            <span className="btn btn-primary" style={{ opacity: uploading ? 0.7 : 1, pointerEvents: uploading ? 'none' : 'auto', fontSize:'1.1rem', padding:'14px 28px' }}>
            {uploading ? <><Spinner size={18} color="var(--navy)" /> Uploading…</> : '+ Upload PDF'}
          </span>
          </label>
        </div>

        {/* ── Summary strip (if decks exist) ── */}
        {readyDecks.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%,180px), 1fr))', gap:16, marginBottom:36 }}>
              {[
                { label:'Decks',         value:readyDecks.length,             icon:'📚', color:'var(--navy)' },
                { label:'Total Cards',   value:totalCards,                    icon:'🃏', color:'var(--navy)' },
                { label:'Cards Learned', value:totalLearn,                    icon:'✅', color:'var(--green)' },
                { label:'Remaining',     value:Math.max(0,totalCards-totalLearn), icon:'🎯', color:'var(--primary-dark)' },
              ].map(s => (
                  <div key={s.label} className="card" style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
                    <span style={{ fontSize:28 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.8rem', color:s.color, lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:'0.95rem', color:'var(--text-sub)', fontWeight:800, marginTop:4 }}>{s.label}</div>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {/* ── Error ── */}
        {error && (
            <div style={{ background:'var(--primary-light)', color:'#9A6600', padding:'14px 20px', borderRadius:'var(--radius-sm)', marginBottom:24, fontWeight:700, fontSize:'1rem', border:'1px solid #F5A62345' }}>
              {error}
            </div>
        )}

        {/* ── Content ── */}
        {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={44} /></div>

        ) : decks.length === 0 ? (
            /* ── Empty / drop zone ── */
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  textAlign:'center', padding:'80px 40px',
                  border:`3px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius:'var(--radius-xl)',
                  background: dragOver ? 'var(--primary-light)' : 'white',
                  transition:'all 0.2s',
                }}>
              <div style={{ fontSize:64, marginBottom:20 }}>📚</div>
              <h3 style={{ marginBottom:12, fontSize:'1.8rem' }}>No decks yet</h3>
              <p style={{ color:'var(--text-sub)', marginBottom:32, fontSize:'1.1rem', fontWeight:600 }}>
                Upload your first PDF to auto-generate AI flashcards
              </p>
              <label style={{ cursor:'pointer' }}>
                <input type="file" accept=".pdf" onChange={upload} style={{ display:'none' }} />
                <span className="btn btn-primary" style={{ padding:'14px 32px', fontSize:'1.1rem' }}>+ Upload PDF</span>
              </label>
              <p style={{ marginTop:20, fontSize:'0.95rem', color:'var(--text-muted)', fontWeight:600 }}>or drag & drop a PDF anywhere here</p>
            </div>

        ) : (
            /* ── Deck grid ── */
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%,360px), 1fr))', gap:24 }}>
              {decks.map((deck, i) => {
                const sc   = STATUS[deck.status] || STATUS.PROCESSING
                const dp   = progMap[deck.id]
                const pct  = dp && dp.totalCards > 0 ? Math.round((dp.mastered / dp.totalCards) * 100) : 0
                const all  = dp && dp.mastered === dp.totalCards && dp.totalCards > 0
                const ring = all ? 'var(--green)' : pct >= 70 ? 'var(--primary)' : pct > 0 ? 'var(--red)' : 'var(--border-dark)'
                const isReady = deck.status === 'READY'

                return (
                    <div
                        key={deck.id}
                        className="deck-card-tile animate-in"
                        style={{ animationDelay:`${i*0.06}s`, opacity: isReady ? 1 : 0.8 }}
                        onClick={() => isReady && navigate(`/decks/${deck.id}`)}
                    >
                      {/* Coloured top stripe */}
                      <div className="deck-stripe" style={{
                        height:8,
                        background: all
                            ? 'linear-gradient(90deg, var(--green), #00e6a0)'
                            : pct > 0
                                ? `linear-gradient(90deg, var(--primary), var(--primary-dark))`
                                : 'var(--border)',
                      }} />

                      {/* Card body */}
                      <div style={{ padding:'24px 28px', flex:1, display:'flex', flexDirection:'column', gap:20 }}>

                        {/* Top row: icon + title + badges */}
                        <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                          {/* Icon */}
                          <div className="deck-icon" style={{
                            width:56, height:56, borderRadius:16, flexShrink:0,
                            background: all ? 'var(--green-light)' : 'var(--primary-light)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:26,
                          }}>
                            {all ? '🏆' : deck.status === 'PROCESSING' ? '⏳' : '📄'}
                          </div>

                          {/* Title + date */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className="deck-title" style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.25rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                              {deck.title}
                            </div>
                            <div className="deck-date" style={{ fontSize:'0.9rem', color:'var(--text-muted)', fontWeight:700 }}>
                              {new Date(deck.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                            </div>
                          </div>

                          {/* Delete */}
                          <button className="deck-delete-btn" onClick={e => del(e, deck.id)} title="Delete"
                                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:'2rem', opacity:1, transition:'opacity 0.2s', padding:4, flexShrink:0 }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >🗑️</button>
                        </div>

                        {/* Progress row */}
                        {isReady && dp && dp.totalCards > 0 ? (
                            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
                              {/* Ring */}
                              <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
                                <ProgressRing pct={pct} color={ring} size={64} />
                                <div className="deck-pct-text" style={{
                                  position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                                  fontFamily:'var(--font-display)', fontWeight:900, fontSize:'0.95rem',
                                  color: all ? 'var(--green)' : 'var(--navy)',
                                }}>
                                  {pct}%
                                </div>
                              </div>
                              <div style={{ flex:1 }}>
                                <div className="deck-progress-text" style={{ fontSize:'0.95rem', color:'var(--text-sub)', fontWeight:800, marginBottom:8 }}>
                                  {dp.mastered}/{dp.totalCards} cards mastered
                                </div>
                                {/* Bar */}
                                <div className="deck-bar-bg" style={{ height:8, background:'var(--border)', borderRadius:100, overflow:'hidden' }}>
                                  <div className="deck-bar-fill" style={{ height:'100%', width:`${pct}%`, background: all ? 'var(--green)' : 'var(--primary)', borderRadius:100, transition:'width 0.6s' }} />
                                </div>
                              </div>
                            </div>
                        ) : (
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              {deck.status === 'PROCESSING' && <Spinner size={18} />}
                              <span className={`badge ${sc.cls}`}>{sc.label}</span>
                              {isReady && <span className="deck-date" style={{ fontSize:'0.95rem', color:'var(--text-muted)' }}>No cards yet</span>}
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8 }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <span className={`badge ${sc.cls}`}>{sc.label}</span>
                            {isReady && all && (
                                <span className="badge badge-green" style={{ fontSize:'0.8rem' }}>🎯 Test Ready</span>
                            )}
                            {isReady && !all && pct > 0 && (
                                <span className="badge badge-yellow" style={{ fontSize:'0.8rem' }}>🔒 In Progress</span>
                            )}
                          </div>
                          {isReady && (
                              <span className="deck-study-btn" style={{ fontSize:'1rem', fontFamily:'var(--font-display)', fontWeight:800, color:'var(--primary-dark)', display:'flex', alignItems:'center', gap:6 }}>
                        Study →
                      </span>
                          )}
                        </div>
                      </div>
                    </div>
                )
              })}

              {/* Upload tile */}
              <label
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    borderRadius:'var(--radius-xl)',
                    border:`3px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                    background: dragOver ? 'var(--primary-light)' : 'white',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    padding:'48px 32px', cursor:'pointer', transition:'all 0.2s', minHeight:240,
                    gap:14,
                  }}>
                <input type="file" accept=".pdf" onChange={upload} style={{ display:'none' }} />
                {uploading ? (
                    <><Spinner size={36} /><span style={{ fontSize:'1rem', color:'var(--text-sub)', fontWeight:700 }}>Uploading…</span></>
                ) : (
                    <>
                      <div style={{ width:64, height:64, borderRadius:18, background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>+</div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'var(--navy)', fontSize:'1.2rem' }}>New Deck</div>
                      <div style={{ fontSize:'0.95rem', color:'var(--text-muted)', textAlign:'center', fontWeight:600 }}>Drop a PDF or click to upload</div>
                    </>
                )}
              </label>
            </div>
        )}
      </div>
  )
}