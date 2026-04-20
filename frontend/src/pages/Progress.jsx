import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const MASTERY = {
  mastered: { label:'Mastered', color:'var(--green)',      bg:'var(--green-light)',  icon:'✓' },
  shaky:    { label:'Shaky',    color:'var(--primary)',    bg:'var(--primary-light)',icon:'~' },
  new:      { label:'New',      color:'var(--text-muted)', bg:'var(--border)',       icon:'○' },
}

export default function Progress() {
  const navigate = useNavigate()
  const [summary,  setSummary]  = useState(null)
  const [decks,    setDecks]    = useState([])
  const [dp,       setDp]       = useState({})
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/summary'),
      api.get('/api/decks'),
      api.get('/api/test/history').catch(() => ({ data: [] })),
    ]).then(([s, d, h]) => {
      setSummary(s.data)
      setDecks(d.data.filter(x => x.status==='READY'))
      setHistory(h.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const expand = async (deckId) => {
    if (dp[deckId]) { setExpanded(expanded===deckId ? null : deckId); return }
    const res = await api.get(`/api/progress/deck/${deckId}`)
    setDp(p => ({ ...p, [deckId]: res.data }))
    setExpanded(deckId)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={48} /></div>

  const pct = n => summary?.totalCards ? Math.round((n/summary.totalCards)*100) : 0
  const byDeck = {}; history.forEach(h => { if (!byDeck[h.deckId]) byDeck[h.deckId]=[]; byDeck[h.deckId].push(h) })

  return (
      <div className="page">

        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', marginBottom:8 }}>Your Progress</h1>
          <p style={{ color:'var(--text-sub)', fontSize:'1.1rem', fontWeight:600 }}>Track your learning journey across all decks</p>
        </div>

        {/* ── Top Overview Stats ── */}
        {summary && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20, marginBottom:36 }}>
              {[
                { label:'Total Cards', value:summary.totalCards, color:'var(--navy)',      icon:'📚' },
                { label:'Mastered',    value:summary.mastered,   color:'var(--green)',     icon:'✅' },
                { label:'Shaky',       value:summary.shaky,      color:'var(--primary)',   icon:'⚡' },
                { label:'New',         value:summary.newCards,   color:'var(--text-muted)',icon:'🆕' },
                { label:'Due Today',   value:summary.dueToday,   color:'var(--red-dark)',  icon:'📅' },
              ].map(s => (
                  <div key={s.label} className="card animate-in" style={{ textAlign:'center', padding:'28px 20px' }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'2.4rem', color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--text-sub)', marginTop:8 }}>{s.label}</div>
                  </div>
              ))}
            </div>
        )}

        {/* ── Mastery Bar ── */}
        {summary && summary.totalCards > 0 && (
            <div className="card" style={{ marginBottom:40, padding:'32px' }}>
              <h3 style={{ fontSize:'1.3rem', marginBottom:20 }}>Overall Mastery</h3>
              <div style={{ height:16, borderRadius:100, overflow:'hidden', background:'var(--border)', display:'flex' }}>
                <div style={{ width:`${pct(summary.mastered)}%`,  background:'var(--green)',   transition:'width 0.8s' }} />
                <div style={{ width:`${pct(summary.shaky)}%`,    background:'var(--primary)', transition:'width 0.8s' }} />
                <div style={{ width:`${pct(summary.newCards)}%`, background:'var(--border-dark)',  transition:'width 0.8s' }} />
              </div>
              <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap' }}>
                {[
                  { label:`${pct(summary.mastered)}% Mastered`, color:'var(--green)'      },
                  { label:`${pct(summary.shaky)}% Shaky`,       color:'var(--primary)'    },
                  { label:`${pct(summary.newCards)}% New`,      color:'var(--text-muted)' },
                ].map(l => (
                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.95rem', fontWeight:800, color:'var(--navy)' }}>
                      <div style={{ width:12, height:12, borderRadius:'50%', background:l.color }} />
                      {l.label}
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ── Test History (Now in a Grid!) ── */}
        {history.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <h2 style={{ fontSize:'1.5rem', marginBottom:20 }}>📊 Test History</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap:20 }}>
                {history.slice(0,10).map((h, i) => {
                  const sc = h.scorePct>=80 ? 'var(--green)' : h.scorePct>=50 ? 'var(--primary)' : 'var(--red-dark)'
                  return (
                      <div key={h.sessionId} className="card animate-in"
                           style={{ animationDelay:`${i*0.04}s`, padding:'20px 24px', display:'flex', alignItems:'center', gap:20, cursor:'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                           onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                           onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                           onClick={() => navigate(`/decks/${h.deckId}`)}>

                        <div style={{ width:56, height:56, borderRadius:14, flexShrink:0, background: h.scorePct>=80?'var(--green-light)':h.scorePct>=50?'var(--primary-light)':'var(--red-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                          {h.scorePct>=80?'🏆':h.scorePct>=50?'📈':'💪'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:900, fontSize:'1.15rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.deckTitle}</div>
                          <div style={{ fontSize:'0.95rem', color:'var(--text-sub)', marginTop:4, fontWeight:700 }}>
                            {new Date(h.takenAt).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' })}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.8rem', color:sc, lineHeight:1 }}>{Math.round(h.scorePct)}%</div>
                          <div style={{ fontSize:'0.9rem', color:'var(--text-sub)', fontWeight:700, marginTop:4 }}>{h.correct} / {h.total}</div>
                        </div>
                      </div>
                  )
                })}
              </div>
            </div>
        )}

        {/* ── Deck Breakdown (Now in a Grid!) ── */}
        <h2 style={{ fontSize:'1.5rem', marginBottom:20 }}>Deck Breakdown</h2>
        {decks.length===0 ? (
            <div className="card" style={{ textAlign:'center', padding:64 }}><p style={{ color:'var(--text-sub)', fontSize:'1.1rem', fontWeight:600 }}>No ready decks yet.</p></div>
        ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', alignItems:'start', gap:20 }}>
              {decks.map((deck, i) => {
                const d      = dp[deck.id]
                const isOpen = expanded===deck.id
                const dh     = byDeck[deck.id]||[]
                const last   = dh[0]

                return (
                    <div key={deck.id} className="card animate-in" style={{ animationDelay:`${i*0.05}s`, padding:0, overflow:'hidden' }}>
                      <button onClick={() => expand(deck.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'24px 28px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.2rem', color:'var(--navy)' }}>{deck.title}</div>
                          {d && (
                              <div style={{ fontSize:'0.95rem', color:'var(--text-sub)', marginTop:6, fontWeight:700, lineHeight: 1.5 }}>
                                <span style={{ color:'var(--green)' }}>{d.mastered} mastered</span> · <span style={{ color:'var(--primary-dark)' }}>{d.shaky} shaky</span> · {d.newCards} new<br/>
                                {last && <span style={{ color:'var(--text-muted)' }}>Last test: {Math.round(last.scorePct)}%</span>}
                              </div>
                          )}
                        </div>
                        <span style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>{isOpen?'▲':'▼'}</span>
                      </button>

                      {isOpen && d && (
                          <div style={{ borderTop:'2px solid var(--border)', padding:'24px 28px', background:'#fafafc' }}>
                            {dh.length>0 && (
                                <div style={{ marginBottom:24 }}>
                                  <div style={{ fontSize:'0.85rem', fontWeight:800, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Test History</div>
                                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                                    {dh.slice(0,5).map(h => {
                                      const c = h.scorePct>=80?'var(--green)':h.scorePct>=50?'var(--primary-dark)':'var(--red-dark)'
                                      return (
                                          <div key={h.sessionId} style={{ padding:'6px 14px', borderRadius:'var(--radius-md)', background:'white', border:`2px solid ${c}`, fontSize:'0.95rem', fontWeight:800, color:c }}>
                                            {Math.round(h.scorePct)}%
                                            <span style={{ color:'var(--text-muted)', fontWeight:600, marginLeft:6 }}>
                                  {new Date(h.takenAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                                </span>
                                          </div>
                                      )
                                    })}
                                  </div>
                                </div>
                            )}
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                              {d.cards.map(card => {
                                const mc = MASTERY[card.masteryLevel]||MASTERY.new
                                return (
                                    <div key={card.cardId} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:mc.bg, borderRadius:'var(--radius-md)', fontSize:'0.95rem', border: `1px solid ${mc.color}30` }}>
                                      <span style={{ fontWeight:900, color:mc.color, fontSize:'1.1rem', width:18, textAlign:'center' }}>{mc.icon}</span>
                                      <span style={{ fontWeight:800, color:'var(--navy)', flex:1 }}>{card.conceptName}</span>
                                      {card.nextReviewAt && (
                                          <span style={{ fontSize:'0.85rem', color:'var(--text-sub)', whiteSpace:'nowrap', fontWeight:700 }}>
                                {new Date(card.nextReviewAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                              </span>
                                      )}
                                    </div>
                                )
                              })}
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