import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const CAT = {
  definition:    { bg:'#E8F0FE', color:'#1A6AD4' },
  relationship:  { bg:'#F3E8FF', color:'#7B2FBE' },
  procedure:     { bg:'#FFF4DE', color:'#9A6600' },
  example:       { bg:'#E0F7F0', color:'#007A54' },
  misconception: { bg:'#FFE8E3', color:'#C5311A' },
}
const DIFF = { 1:'⬡ Foundational', 2:'⬡⬡ Intermediate', 3:'⬡⬡⬡ Advanced' }

export default function DeckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck,    setDeck]    = useState(null)
  const [cards,   setCards]   = useState([])
  const [graph,   setGraph]   = useState(null)
  const [tab,     setTab]     = useState('cards')
  const [loading, setLoading] = useState(true)
  const [flipped, setFlipped] = useState({})
  const [learned, setLearned] = useState({})
  const [marking, setMarking] = useState({})

  useEffect(() => {
    Promise.all([
      api.get(`/api/decks/${id}`),
      api.get(`/api/decks/${id}/cards`),
      api.get(`/api/decks/${id}/graph`),
      api.get(`/api/progress/deck/${id}`),
    ]).then(([d, c, g, p]) => {
      setDeck(d.data); setCards(c.data); setGraph(g.data)
      const m = {}; p.data.cards?.forEach(x => { if (x.masteryLevel==='mastered') m[x.cardId]=true }); setLearned(m)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>

  const learnedCount = Object.values(learned).filter(Boolean).length
  const total        = cards.length
  const allLearned   = total > 0 && learnedCount === total

  const mark = async (e, cardId) => {
    e.stopPropagation(); if (learned[cardId]) return
    setMarking(m => ({ ...m, [cardId]: true }))
    try { await api.post('/api/study/review', { cardId, rating: 5 }); setLearned(l => ({ ...l, [cardId]: true })) }
    finally { setMarking(m => ({ ...m, [cardId]: false })) }
  }

  return (
    <div className="page">
      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ paddingLeft:0, marginBottom:18 }}>
        ← Back to Decks
      </button>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:26, flexWrap:'wrap', gap:16 }}>
        <div style={{ minWidth:0 }}>
          <h1 style={{ marginBottom:4, wordBreak:'break-word' }}>{deck?.title}</h1>
          <p style={{ color:'var(--text-sub)', fontSize:'0.9rem' }}>{total} cards</p>
        </div>

        {/* Mastery + test unlock */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, minWidth:200 }}>
          <span style={{ fontSize:'0.82rem', fontWeight:700, color: allLearned ? 'var(--green)' : 'var(--text-sub)' }}>
            {allLearned ? '🎉 All learned!' : `${learnedCount} / ${total} learned`}
          </span>
          <div style={{ width:'100%', height:7, background:'var(--border)', borderRadius:100, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${total>0?(learnedCount/total)*100:0}%`, background: allLearned?'var(--green)':'var(--primary)', borderRadius:100, transition:'width 0.5s' }} />
          </div>
          {allLearned
            ? <button className="btn btn-primary animate-in" onClick={() => navigate(`/decks/${id}/test`)} style={{ background:'var(--green)', color:'white' }}>🎯 Take Test</button>
            : <span style={{ fontSize:'0.74rem', color:'var(--text-muted)', fontWeight:600 }}>🔒 Mark all learned to unlock test</span>
          }
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'2px solid var(--border)', marginBottom:22 }}>
        {['cards','graph'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'8px 16px', background:'none', border:'none', cursor:'pointer',
            fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9rem',
            color: t===tab ? 'var(--primary-dark)' : 'var(--text-sub)',
            borderBottom: t===tab ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom:-2, transition:'all 0.15s',
          }}>
            {t==='cards' ? '📋 Cards' : '🔗 Dependency Graph'}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {tab==='cards' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap:14, alignItems:'start' }}>
          {cards.map((card, i) => {
            const fl  = flipped[card.id]
            const lrn = learned[card.id]
            const mrk = marking[card.id]
            const cs  = CAT[card.conceptCategory] || { bg:'#F4F6FB', color:'var(--text)' }

            return (
              <div key={card.id} className="card animate-in" onClick={() => setFlipped(p => ({ ...p, [card.id]: !p[card.id] }))}
                style={{
                  animationDelay:`${i*0.04}s`, cursor:'pointer',
                  borderTop:`3px solid ${lrn ? 'var(--green)' : 'var(--primary)'}`,
                  background: lrn ? 'linear-gradient(160deg,#f0fdf4,#fff)' : '#fff',
                  transition:'background 0.4s',
                  display:'flex', flexDirection:'column', gap:10,
                }}
              >
                {/* Top row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:6 }}>
                  <span className="badge" style={{ background:cs.bg, color:cs.color }}>{card.conceptCategory||'general'}</span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>{DIFF[card.difficulty]}</span>
                </div>

                {/* Q/A label */}
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  {fl ? 'Answer' : 'Question'}
                </div>

                {/* Content */}
                <p style={{ lineHeight:1.65, color:'var(--text)', fontSize:'0.9rem', flex:1 }}>
                  {fl ? card.back : card.front}
                </p>

                {/* Bottom row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}
                  onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>tap to {fl?'flip back':'reveal'}</span>
                  {lrn
                    ? <span style={{ fontSize:'0.75rem', fontWeight:800, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>✓ Learned</span>
                    : <button onClick={e => mark(e, card.id)} disabled={mrk} style={{
                        padding:'5px 11px', background:'var(--primary)', color:'var(--navy)',
                        border:'none', borderRadius:'var(--radius-sm)', fontSize:'0.74rem',
                        fontWeight:800, cursor: mrk?'default':'pointer', opacity: mrk?0.7:1,
                        fontFamily:'inherit', transition:'opacity 0.2s',
                      }}>
                        {mrk ? '…' : '✓ Mark Learned'}
                      </button>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Graph */}
      {tab==='graph' && graph && (
        <div>
          <div className="card" style={{ marginBottom:14, background:'var(--navy)', color:'white', border:'none' }}>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
              Cards pointing <strong style={{ color:'white' }}>FROM</strong> a concept must be mastered before the concept they point <strong style={{ color:'white' }}>TO</strong> unlocks.
            </p>
          </div>
          {graph.edges.length===0
            ? <div className="card" style={{ textAlign:'center', padding:40 }}><p style={{ color:'var(--text-sub)' }}>No prerequisite relationships found.</p></div>
            : <div style={{ display:'grid', gap:10 }}>
                {graph.edges.map((edge, i) => {
                  const from = graph.nodes.find(n => n.id===edge.from)
                  const to   = graph.nodes.find(n => n.id===edge.to)
                  return (
                    <div key={i} className="card animate-in" style={{ animationDelay:`${i*0.04}s`, display:'flex', alignItems:'center', gap:12, padding:'13px 18px', flexWrap:'wrap' }}>
                      <span style={{ flex:1, fontWeight:700, color:'var(--navy)', minWidth:80 }}>{from?.conceptName}</span>
                      <span style={{ color:'var(--primary-dark)', fontSize:'1.2rem' }}>→</span>
                      <span style={{ flex:1, fontWeight:700, color:'var(--navy)', textAlign:'right', minWidth:80 }}>{to?.conceptName}</span>
                    </div>
                  )
                })}
              </div>
          }
        </div>
      )}
    </div>
  )
}
