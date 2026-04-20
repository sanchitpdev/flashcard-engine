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

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={36} /></div>

  const pct = n => summary?.totalCards ? Math.round((n/summary.totalCards)*100) : 0
  const byDeck = {}; history.forEach(h => { if (!byDeck[h.deckId]) byDeck[h.deckId]=[]; byDeck[h.deckId].push(h) })

  return (
    <div className="page">
      <h1 style={{ marginBottom:6 }}>Your Progress</h1>
      <p style={{ color:'var(--text-sub)', marginBottom:28, fontSize:'0.9rem' }}>Track your learning journey across all decks</p>

      {/* Stats */}
      {summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,160px),1fr))', gap:14, marginBottom:28 }}>
          {[
            { label:'Total Cards', value:summary.totalCards, color:'var(--navy)',      icon:'📚' },
            { label:'Mastered',    value:summary.mastered,   color:'var(--green)',     icon:'✅' },
            { label:'Shaky',       value:summary.shaky,      color:'var(--primary)',   icon:'⚡' },
            { label:'New',         value:summary.newCards,   color:'var(--text-muted)',icon:'🆕' },
            { label:'Due Today',   value:summary.dueToday,   color:'var(--red)',       icon:'📅' },
          ].map(s => (
            <div key={s.label} className="card animate-in" style={{ textAlign:'center', padding:'20px 14px' }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.85rem', color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-sub)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      {summary && summary.totalCards > 0 && (
        <div className="card" style={{ marginBottom:28 }}>
          <h3 style={{ fontSize:'0.95rem', marginBottom:14 }}>Overall Mastery</h3>
          <div style={{ height:14, borderRadius:100, overflow:'hidden', background:'var(--border)', display:'flex' }}>
            <div style={{ width:`${pct(summary.mastered)}%`,  background:'var(--green)',   transition:'width 0.8s' }} />
            <div style={{ width:`${pct(summary.shaky)}%`,    background:'var(--primary)', transition:'width 0.8s' }} />
            <div style={{ width:`${pct(summary.newCards)}%`, background:'var(--border)',  transition:'width 0.8s' }} />
          </div>
          <div style={{ display:'flex', gap:18, marginTop:10, flexWrap:'wrap' }}>
            {[
              { label:`${pct(summary.mastered)}% Mastered`, color:'var(--green)'      },
              { label:`${pct(summary.shaky)}% Shaky`,       color:'var(--primary)'    },
              { label:`${pct(summary.newCards)}% New`,      color:'var(--text-muted)' },
            ].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', fontWeight:700, color:'var(--text-sub)' }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test history */}
      {history.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:'1.15rem', marginBottom:14 }}>📊 Test History</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {history.slice(0,10).map((h, i) => {
              const sc = h.scorePct>=80 ? 'var(--green)' : h.scorePct>=50 ? 'var(--primary)' : 'var(--red)'
              return (
                <div key={h.sessionId} className="card animate-in" style={{ animationDelay:`${i*0.04}s`, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}
                  onClick={() => navigate(`/decks/${h.deckId}`)}>
                  <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background: h.scorePct>=80?'var(--green-light)':h.scorePct>=50?'var(--primary-light)':'var(--red-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                    {h.scorePct>=80?'🏆':h.scorePct>=50?'📈':'💪'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:'0.92rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.deckTitle}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                      {new Date(h.takenAt).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.4rem', color:sc, lineHeight:1 }}>{Math.round(h.scorePct)}%</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{h.correct}/{h.total}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deck breakdown */}
      <h2 style={{ fontSize:'1.15rem', marginBottom:14 }}>Deck Breakdown</h2>
      {decks.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:40 }}><p style={{ color:'var(--text-sub)' }}>No ready decks yet.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {decks.map((deck, i) => {
            const d      = dp[deck.id]
            const isOpen = expanded===deck.id
            const dh     = byDeck[deck.id]||[]
            const last   = dh[0]
            return (
              <div key={deck.id} className="card animate-in" style={{ animationDelay:`${i*0.05}s`, padding:0, overflow:'hidden' }}>
                <button onClick={() => expand(deck.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'18px 22px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.95rem', color:'var(--navy)' }}>{deck.title}</div>
                    {d && (
                      <div style={{ fontSize:'0.78rem', color:'var(--text-sub)', marginTop:2 }}>
                        {d.mastered} mastered · {d.shaky} shaky · {d.newCards} new · {d.dueToday} due
                        {last && <span style={{ marginLeft:10, color:'var(--text-muted)' }}>· Last test: {Math.round(last.scorePct)}%</span>}
                      </div>
                    )}
                  </div>
                  <span style={{ color:'var(--text-muted)', fontSize:'1.1rem' }}>{isOpen?'▲':'▼'}</span>
                </button>

                {isOpen && d && (
                  <div style={{ borderTop:'1px solid var(--border)', padding:'14px 22px' }}>
                    {dh.length>0 && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:'0.73rem', fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Test History</div>
                        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                          {dh.slice(0,5).map(h => {
                            const c = h.scorePct>=80?'var(--green)':h.scorePct>=50?'var(--primary)':'var(--red)'
                            return (
                              <div key={h.sessionId} style={{ padding:'5px 10px', borderRadius:'var(--radius-sm)', background:'white', border:`1px solid ${c}`, fontSize:'0.78rem', fontWeight:700, color:c }}>
                                {Math.round(h.scorePct)}%
                                <span style={{ color:'var(--text-muted)', fontWeight:400, marginLeft:4 }}>
                                  {new Date(h.takenAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap:7 }}>
                      {d.cards.map(card => {
                        const mc = MASTERY[card.masteryLevel]||MASTERY.new
                        return (
                          <div key={card.cardId} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', background:mc.bg, borderRadius:'var(--radius-sm)', fontSize:'0.83rem' }}>
                            <span style={{ fontWeight:900, color:mc.color, fontSize:'0.95rem', width:14 }}>{mc.icon}</span>
                            <span style={{ fontWeight:700, color:'var(--navy)', flex:1 }}>{card.conceptName}</span>
                            {card.nextReviewAt && (
                              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
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
