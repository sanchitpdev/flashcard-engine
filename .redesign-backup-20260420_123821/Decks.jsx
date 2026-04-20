import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const STATUS = {
  READY:      { label: 'Ready',      cls: 'badge-green'  },
  PROCESSING: { label: 'Processing', cls: 'badge-yellow' },
  FAILED:     { label: 'Failed',     cls: 'badge-red'    },
}

export default function Decks() {
  const [decks,   setDecks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error,   setError]   = useState('')
  const [progMap, setProgMap] = useState({})
  const fileRef  = useRef()
  const navigate = useNavigate()

  const load = async () => {
    try {
      const res = await api.get('/api/decks')
      setDecks(res.data)
      const ready = res.data.filter(d => d.status === 'READY')
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

  const upload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 10*1024*1024) { setError('File must be under 10 MB'); return }
    setError(''); setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post('/api/decks', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await load()
    } catch (err) { setError(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); fileRef.current.value = '' }
  }

  const del = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this deck?')) return
    try { await api.delete(`/api/decks/${id}`); setDecks(decks.filter(d => d.id !== id)) }
    catch { setError('Failed to delete deck') }
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ marginBottom:4 }}>My Decks</h1>
          <p style={{ color:'var(--text-sub)', fontSize:'0.9rem' }}>Upload a PDF to generate AI-powered flashcards</p>
        </div>
        <label style={{ cursor:'pointer', flexShrink:0 }}>
          <input type="file" accept=".pdf" ref={fileRef} onChange={upload} style={{ display:'none' }} />
          <span className="btn btn-primary" style={{ opacity: uploading ? 0.7 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
            {uploading ? <><Spinner size={15} color="var(--navy)" /> Uploading…</> : '+ Upload PDF'}
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'var(--primary-light)', color:'#9A6600', padding:'10px 14px', borderRadius:'var(--radius-sm)', marginBottom:18, fontWeight:600, fontSize:'0.875rem', border:'1px solid #F5A62345' }}>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={36} /></div>
      ) : decks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'64px 32px', border:'2px dashed var(--border)', borderRadius:'var(--radius-lg)', background:'white' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📚</div>
          <h3 style={{ marginBottom:8 }}>No decks yet</h3>
          <p style={{ color:'var(--text-sub)', marginBottom:24, fontSize:'0.9rem' }}>Upload your first PDF to get started</p>
          <label style={{ cursor:'pointer' }}>
            <input type="file" accept=".pdf" onChange={upload} style={{ display:'none' }} />
            <span className="btn btn-primary">Upload PDF</span>
          </label>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap:14 }}>
          {decks.map((deck, i) => {
            const sc  = STATUS[deck.status] || STATUS.PROCESSING
            const dp  = progMap[deck.id]
            const pct = dp && dp.totalCards > 0 ? Math.round((dp.mastered / dp.totalCards) * 100) : 0
            const all = dp && dp.mastered === dp.totalCards && dp.totalCards > 0
            const bar = all ? 'var(--green)' : pct >= 70 ? 'var(--primary)' : 'var(--red)'

            return (
              <div key={deck.id} className="card animate-in" style={{
                animationDelay:`${i*0.05}s`,
                cursor: deck.status === 'READY' ? 'pointer' : 'default',
                padding:'16px 20px',
                borderLeft: deck.status === 'READY' ? `4px solid ${bar}` : undefined,
                transition:'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { if (deck.status==='READY') { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}
                onClick={() => deck.status==='READY' && navigate(`/decks/${deck.id}`)}
              >
                {/* Row 1 */}
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background: all?'var(--green-light)':'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {all ? '🏆' : deck.status==='PROCESSING' ? '⏳' : '📄'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.95rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                      {deck.title}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                      {new Date(deck.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {deck.status==='PROCESSING' && <Spinner size={14} />}
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                    {deck.status==='READY' && (
                      all
                        ? <span className="badge badge-green" style={{ fontSize:'0.68rem' }}>🎯 Test Ready</span>
                        : dp && pct > 0
                        ? <span className="badge badge-yellow" style={{ fontSize:'0.68rem' }}>🔒 {pct}%</span>
                        : <span style={{ opacity:0.4, fontSize:'1rem' }}>🔒</span>
                    )}
                    <button onClick={e => del(e, deck.id)} title="Delete"
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', opacity:0.35, transition:'opacity 0.2s', padding:4 }}
                      onMouseEnter={e => e.currentTarget.style.opacity=1}
                      onMouseLeave={e => e.currentTarget.style.opacity=0.35}
                    >🗑️</button>
                  </div>
                </div>

                {/* Progress bar */}
                {deck.status==='READY' && dp && dp.totalCards > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ height:5, background:'var(--border)', borderRadius:100, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:bar, borderRadius:100, transition:'width 0.6s' }} />
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:4, fontWeight:600 }}>
                      {dp.mastered}/{dp.totalCards} cards learned
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
