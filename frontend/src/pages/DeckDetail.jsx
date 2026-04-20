import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import api from '../api/axios'
import Spinner from '../components/Spinner'

/* ── constants ─────────────────────────────────────────────────────────────── */
const CAT = {
  definition:    { bg:'#E8F0FE', color:'#1A6AD4',        label:'Definition'    },
  relationship:  { bg:'#F3E8FF', color:'#7B2FBE',        label:'Relationship'  },
  procedure:     { bg:'#FFF4DE', color:'#9A6600',        label:'Procedure'     },
  example:       { bg:'#E0F7F0', color:'#007A54',        label:'Example'       },
  misconception: { bg:'#FFE8E3', color:'var(--red-dark)',label:'Misconception' },
}
const DIFF = { 1:'Foundational', 2:'Intermediate', 3:'Advanced' }
const DIFF_COLOR = { 1:'#009B65', 2:'#B37A00', 3:'var(--red-dark)' }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ── component ─────────────────────────────────────────────────────────────── */
export default function DeckDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  /* data */
  const [deck,    setDeck]    = useState(null)
  const [cards,   setCards]   = useState([])
  const [ordered, setOrdered] = useState([])
  const [graph,   setGraph]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [learned, setLearned] = useState({})
  const [marking, setMarking] = useState({})

  /* UI */
  const [tab,         setTab]         = useState('flashcard')
  const [flipped,     setFlipped]     = useState(false)
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [shuffled,    setShuffled]    = useState(false)
  const [listFlipped, setListFlipped] = useState({})

  /* Gamification */
  const [xpPops, setXpPops] = useState([])

  /* Swipe Physics State */
  const [drag, setDrag] = useState({ active: false, x: 0, startX: 0 })
  const isTransiting = useRef(false)

  /* ── load data ── */
  useEffect(() => {
    Promise.all([
      api.get(`/api/decks/${id}`),
      api.get(`/api/decks/${id}/cards`),
      api.get(`/api/decks/${id}/graph`),
      api.get(`/api/progress/deck/${id}`),
    ]).then(([d, c, g, p]) => {
      setDeck(d.data)
      setCards(c.data)
      setOrdered(c.data)
      setGraph(g.data)
      const m = {}
      p.data.cards?.forEach(x => { if (x.masteryLevel === 'mastered') m[x.cardId] = true })
      setLearned(m)
    }).finally(() => setLoading(false))
  }, [id])

  /* ── navigation ── */
  const goTo = useCallback((idx) => {
    if (isTransiting.current) return
    isTransiting.current = true

    // If going to the last card, shoot confetti!
    if (idx === ordered.length - 1 && ordered.length > 1) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
    }

    setDrag({ active: false, x: 0, startX: 0 }) // Reset drag
    setTimeout(() => {
      setCurrentIdx(idx)
      setFlipped(false)
      isTransiting.current = false
    }, 150) // Fast transition for snappy feel
  }, [ordered.length])

  const goNext = useCallback(() => {
    if (currentIdx < ordered.length - 1) goTo(currentIdx + 1)
  }, [currentIdx, ordered.length, goTo])

  const goPrev = useCallback(() => {
    if (currentIdx > 0) goTo(currentIdx - 1)
  }, [currentIdx, goTo])

  /* ── Swipe Physics Handlers ── */
  const onPointerDown = (e) => {
    if (isTransiting.current) return
    e.target.setPointerCapture(e.pointerId)
    setDrag({ active: true, x: 0, startX: e.clientX })
  }
  const onPointerMove = (e) => {
    if (!drag.active) return
    setDrag(prev => ({ ...prev, x: e.clientX - prev.startX }))
  }
  const onPointerUp = (e) => {
    if (!drag.active) return
    if (drag.x > 120) { goNext() }      // Swiped right -> Next
    else if (drag.x < -120) { goPrev() } // Swiped left -> Prev
    else { setDrag({ active: false, x: 0, startX: 0 }) } // Snap back
  }

  /* ── shuffle ── */
  const toggleShuffle = () => {
    const next = !shuffled
    setShuffled(next)
    setOrdered(next ? shuffle(cards) : [...cards])
    setCurrentIdx(0)
    setFlipped(false)
  }

  /* ── mark learned ── */
  const markLearned = async (e, cardId) => {
    e?.stopPropagation()
    if (learned[cardId]) return

    // Spawn floating XP text at mouse coordinates
    const popId = Date.now()
    setXpPops(prev => [...prev, { id: popId, x: e.clientX, y: e.clientY }])
    setTimeout(() => setXpPops(prev => prev.filter(p => p.id !== popId)), 1000)

    setMarking(m => ({ ...m, [cardId]: true }))
    try {
      await api.post('/api/study/review', { cardId, rating: 5 })
      setLearned(l => ({ ...l, [cardId]: true }))
    } finally {
      setMarking(m => ({ ...m, [cardId]: false }))
    }
  }

  /* ── keyboard ── */
  useEffect(() => {
    if (tab !== 'flashcard') return
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev()
      if (e.key === ' ')  { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [tab, goNext, goPrev])

  /* ── loading ── */
  if (loading) return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh' }}>
        <div style={{ textAlign:'center' }}>
          <Spinner size={48} />
          <p style={{ marginTop:20, color:'var(--text-sub)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem' }}>Loading your flashcards…</p>
        </div>
      </div>
  )

  /* ── derived values ── */
  const card       = ordered[currentIdx]
  const total      = cards.length
  const learnedCnt = Object.values(learned).filter(Boolean).length
  const allLearned = total > 0 && learnedCnt === total
  const isLast     = currentIdx === ordered.length - 1

  return (
      <div className="page">
        {/* Render Floating XP */}
        {xpPops.map(pop => (
            <div key={pop.id} className="floating-xp" style={{ left: pop.x - 20, top: pop.y - 20 }}>
              +1 Mastery!
            </div>
        ))}

        {/* ── Page header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ paddingLeft:0, fontSize:'1.05rem', fontWeight:800 }}>
            ← Back to Decks
          </button>

          <div style={{ textAlign:'center', flex:1, minWidth:0, padding:'0 16px' }}>
            <h1 style={{ fontSize:'clamp(1.6rem, 4vw, 2.5rem)', marginBottom:6, wordBreak:'break-word', color:'var(--navy)', lineHeight:1.2 }}>
              {deck?.title}
            </h1>
            <p style={{ color:'var(--text-sub)', fontSize:'1.05rem', fontFamily:'var(--font-display)', fontWeight:700 }}>
              {total} cards &nbsp;·&nbsp;
              <span style={{ color: learnedCnt === total && total > 0 ? 'var(--green)' : 'var(--text-sub)' }}>
              {learnedCnt}/{total} learned
            </span>
            </p>
          </div>

          {/* TAKES TEST ALWAYS UNLOCKED NOW */}
          <div style={{ minWidth:120, display:'flex', justifyContent:'flex-end', alignItems:'center' }}>
            <button className="btn btn-primary animate-in" onClick={() => navigate(`/decks/${id}/test`)}
                    style={{ background:'var(--green)', color:'white', boxShadow:'0 4px 16px rgba(0,182,122,0.35)', fontSize:'1.1rem', padding:'12px 24px' }}>
              🎯 Take Test
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:6, borderBottom:'3px solid var(--border)', marginBottom:36 }}>
          {[
            { key:'flashcard', icon:'⚡', label:'Flashcards' },
            { key:'list',      icon:'📋', label:'All Cards'  },
            { key:'graph',     icon:'🔗', label:'Graph'      },
          ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding:'14px 24px', background:'none', border:'none', cursor:'pointer',
                fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem',
                color: t.key===tab ? 'var(--primary-dark)' : 'var(--text-sub)',
                borderBottom: t.key===tab ? '4px solid var(--primary)' : '4px solid transparent',
                marginBottom:-3, transition:'all 0.15s',
                display:'flex', alignItems:'center', gap:8,
              }}>
                <span style={{ fontSize:'1.3rem' }}>{t.icon}</span> {t.label}
              </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════
          FLASHCARD MODE
      ════════════════════════════════════════════ */}
        {tab === 'flashcard' && (
            <div style={{ maxWidth:920, margin:'0 auto' }}>

              {/* Controls row */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.4rem', color:'var(--navy)' }}>
                <span style={{ color:'var(--primary)' }}>{currentIdx + 1}</span>
                <span style={{ color:'var(--border-dark)', fontWeight:600 }}> / </span>
                <span style={{ color:'var(--text-sub)', fontWeight:700 }}>{ordered.length}</span>
              </span>
                  {learned[card?.id] && (
                      <span style={{ fontSize:'0.9rem', background:'var(--green-light)', color:'var(--green)', padding:'6px 14px', borderRadius:100, fontWeight:900, fontFamily:'var(--font-display)' }}>
                  ✓ Learned
                </span>
                  )}
                </div>

                <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                  <button
                      onClick={toggleShuffle}
                      className={shuffled ? 'shuffle-on' : ''}
                      style={{
                        padding:'10px 20px', borderRadius:'var(--radius-md)',
                        border:'2px solid var(--border)', background:'white',
                        color:'var(--text-sub)', fontFamily:'var(--font-display)',
                        fontWeight:800, fontSize:'1rem', cursor:'pointer',
                        transition:'all 0.2s', display:'flex', alignItems:'center', gap:8,
                      }}>
                    🔀 {shuffled ? 'Shuffled' : 'Shuffle'}
                  </button>

                  {card && !learned[card.id] && (
                      <button
                          onClick={(e) => markLearned(e, card.id)}
                          disabled={!!marking[card.id]}
                          style={{
                            padding:'10px 24px', borderRadius:'var(--radius-md)', border:'none',
                            background:'var(--primary)', color:'var(--navy)',
                            fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1rem',
                            cursor: marking[card.id] ? 'default' : 'pointer',
                            opacity: marking[card.id] ? 0.65 : 1,
                            transition:'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            boxShadow:'0 4px 14px rgba(245,166,35,0.35)',
                            transform: marking[card.id] ? 'scale(0.95)' : 'scale(1)'
                          }}>
                        {marking[card.id] ? '…' : '✓ Mark Learned'}
                      </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height:8, background:'var(--border)', borderRadius:100, overflow:'hidden', marginBottom:36 }}>
                <div style={{
                  height:'100%',
                  width:`${(learnedCnt / (total || 1)) * 100}%`,
                  background:'linear-gradient(90deg, var(--primary), var(--green))',
                  borderRadius:100,
                  transition:'width 0.6s ease',
                }} />
              </div>

              {/* ── THE PHYSICAL STACK ── */}
              <div className={`card-stack-container ${drag.active ? '' : 'is-idle'}`} style={{ marginBottom: 32 }}>
                {[2, 1, 0].map(offset => {
                  const idx = currentIdx + offset
                  if (idx >= ordered.length) return null
                  const c = ordered[idx]
                  const isTop = offset === 0
                  const cat = CAT[c.conceptCategory] || { bg:'#F4F6FB', color:'var(--navy)', label:'General' }

                  // Physics calculations for stack depth and swipe
                  const scale = isTop ? 1 : 1 - (offset * 0.05)
                  const yOffset = isTop ? 0 : offset * 12

                  // If dragging top card, apply physics
                  const dragTransform = isTop && drag.active
                      ? `translateX(${drag.x}px) rotate(${drag.x * 0.04}deg)`
                      : `translateX(0px) rotate(0deg)`

                  return (
                      <div
                          key={c.id}
                          className="stack-card fc-scene"
                          onPointerDown={isTop ? onPointerDown : undefined}
                          onPointerMove={isTop ? onPointerMove : undefined}
                          onPointerUp={isTop ? onPointerUp : undefined}
                          onPointerCancel={isTop ? onPointerUp : undefined}
                          style={{
                            zIndex: 10 - offset,
                            transform: `${dragTransform} translateY(${yOffset}px) scale(${scale})`,
                            opacity: offset === 2 ? 0.6 : 1,
                            cursor: isTop ? (drag.active ? 'grabbing' : 'grab') : 'default'
                          }}
                      >
                        <div
                            className={`fc-inner${isTop && flipped ? ' is-flipped' : ''}`}
                            style={{ minHeight:'clamp(340px, 46vh, 540px)', pointerEvents: isTop ? 'auto' : 'none', display: 'flex', flexDirection: 'column' }}
                            onClick={() => isTop && !drag.active && setFlipped(f => !f)}
                        >
                          {/* Front Face */}
                          <div className="fc-face fc-face--front" style={{ borderTop:`8px solid ${cat.color || 'var(--primary)'}`, position:'absolute', inset:0, display: 'flex', flexDirection: 'column' }}>

                            {/* Swipe Glow Feedback (Only on top card) */}
                            {isTop && <div className="swipe-glow swipe-glow-green" style={{ opacity: drag.x > 30 ? drag.x/150 : 0 }} />}
                            {isTop && <div className="swipe-glow swipe-glow-red" style={{ opacity: drag.x < -30 ? Math.abs(drag.x)/150 : 0 }} />}

                            {/* Top-right: difficulty pill */}
                            <div style={{
                              position:'absolute', top:24, right:24, fontSize:'0.85rem', fontWeight:900,
                              color: DIFF_COLOR[c.difficulty] || '#009B65',
                              background: c.difficulty === 3 ? 'var(--red-light)' : c.difficulty === 2 ? 'var(--primary-light)' : 'var(--green-light)',
                              padding:'6px 16px', borderRadius:100, fontFamily:'var(--font-display)',
                            }}>
                              {DIFF[c.difficulty] || 'Foundational'}
                            </div>

                            <span className="badge" style={{ background:cat.bg, color:cat.color, marginBottom:24, fontSize:'1rem', padding:'8px 20px', fontWeight:900, alignSelf: 'flex-start' }}>
                              {cat.label}
                            </span>

                            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                              <p style={{ fontSize:'clamp(1.4rem, 3.5vw, 2.2rem)', lineHeight:1.6, color:'var(--navy)', fontFamily:'var(--font-display)', fontWeight:800, maxWidth:720, margin:0, pointerEvents:'none' }}>
                                {c.front}
                              </p>
                            </div>

                            {/* FIXED BOTTOM ALIGNMENT FOR FRONT */}
                            <div style={{ marginTop:'auto', paddingTop: 20, display:'flex', alignItems:'center', gap:10, color:'var(--text-muted)', fontSize:'0.95rem', fontWeight:800 }}>
                              <span style={{ width:36, height:36, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', color:'var(--primary-dark)' }}>↩</span>
                              Click to flip • Swipe to navigate
                            </div>
                          </div>

                          {/* Back Face */}
                          <div className="fc-face fc-face--back" style={{ position:'absolute', inset:0, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position:'absolute', top:0, right:0, width:200, height:200, background:'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)', borderRadius:'0 var(--radius-xl) 0 100%', pointerEvents:'none' }} />
                            <div style={{ position:'absolute', bottom:0, left:0, width:160, height:160, background:'radial-gradient(circle, rgba(0,182,122,0.1) 0%, transparent 70%)', borderRadius:'0 100% 0 var(--radius-xl)', pointerEvents:'none' }} />

                            <div style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.4)', fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:28, fontFamily:'var(--font-display)' }}>✦  Answer  ✦</div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                              <p style={{ fontSize:'clamp(1.2rem, 3vw, 1.8rem)', lineHeight:1.8, color:'rgba(255,255,255,0.98)', fontFamily:'var(--font-body)', fontWeight:600, maxWidth:700, margin:0, position:'relative', zIndex:1, pointerEvents:'none' }}>
                                {c.back}
                              </p>
                            </div>

                            {/* FIXED BOTTOM ALIGNMENT FOR BACK */}
                            <div style={{ marginTop:'auto', paddingTop: 20, display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.35)', fontSize:'0.9rem', fontWeight:800 }}>
                              <span style={{ fontSize: '1.2rem' }}>↩</span> Tap to flip back
                            </div>
                          </div>
                        </div>
                      </div>
                  )
                })}
              </div>

              {/* ── Navigation row ── */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:28, marginBottom:16 }}>

                {/* Previous Button */}
                <button
                    className="fc-nav-btn"
                    onClick={goPrev}
                    disabled={currentIdx === 0}
                    style={{
                      border:'3px solid var(--border)',
                      background:'white',
                      cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                      boxShadow: currentIdx === 0 ? 'none' : 'var(--shadow-sm)',
                      color: currentIdx === 0 ? 'var(--text-muted)' : 'var(--navy)',
                      fontSize: '2rem', /* 🔥 INCREASED ARROW SIZE */
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s'
                    }}
                    title="Previous (← arrow key)"
                    onMouseDown={e => { if(currentIdx !== 0) e.currentTarget.style.transform = 'scale(0.85)' }}
                    onMouseUp={e => { if(currentIdx !== 0) e.currentTarget.style.transform = 'scale(1.1)' }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ←
                </button>

                {/* Progress Dots */}
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'center', maxWidth:300 }}>
                  {ordered.map((c, i) => {
                    const visible = Math.abs(i - currentIdx) <= 4
                    if (!visible) return null

                    const isActive = i === currentIdx;
                    const isLearned = learned[c.id];

                    return (
                        <div
                            key={i}
                            className="fc-dot"
                            onClick={() => goTo(i)}
                            style={{
                              width: isActive ? 36 : 10,
                              height: 10,
                              background: isActive ? 'var(--primary)' : isLearned ? 'var(--green)' : 'var(--border-dark)',
                              boxShadow: isActive ? '0 0 10px rgba(245,166,35,0.4)' : 'none',
                              borderRadius: 100,
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                            }}
                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = 'scale(1.5)' }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    )
                  })}
                </div>

                {/* Next Button */}
                <button
                    className="fc-nav-btn"
                    onClick={goNext}
                    disabled={isLast}
                    style={{
                      border:'none',
                      background: isLast ? 'var(--border)' : 'var(--primary)',
                      cursor: isLast ? 'not-allowed' : 'pointer',
                      color: isLast ? 'var(--text-muted)' : 'var(--navy)',
                      fontSize: '2rem', /* 🔥 INCREASED ARROW SIZE */
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight:900,
                      boxShadow: isLast ? 'none' : 'var(--primary-shadow)',
                      transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s'
                    }}
                    title="Next (→ arrow key)"
                    onMouseDown={e => { if(!isLast) e.currentTarget.style.transform = 'scale(0.85)' }}
                    onMouseUp={e => { if(!isLast) e.currentTarget.style.transform = 'scale(1.1)' }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  →
                </button>
              </div>

              {/* Beautiful Keyboard & Drag Hint */}
              <div style={{ textAlign:'center', marginTop: 12 }}>
                <p style={{ display:'flex', alignItems:'center', justifyContent:'center', flexWrap: 'wrap', gap: 10, fontSize:'0.95rem', color:'var(--text-sub)', fontWeight:700 }}>
    <span style={{ display:'flex', gap: 6 }}>
      <kbd style={{ background:'#fff', border:'1px solid var(--border)', borderBottom:'3px solid var(--border-dark)', borderRadius:6, padding:'2px 8px', fontSize:'0.9rem', color:'var(--navy)', fontFamily:'monospace', fontWeight:900 }}>←</kbd>
      <kbd style={{ background:'#fff', border:'1px solid var(--border)', borderBottom:'3px solid var(--border-dark)', borderRadius:6, padding:'2px 8px', fontSize:'0.9rem', color:'var(--navy)', fontFamily:'monospace', fontWeight:900 }}>→</kbd>
    </span>
                  <span>keys, or</span>
                  {/* 🔥 Changed to DRAG with a mouse icon */}
                  <span style={{ background:'var(--primary-light)', color:'var(--primary-dark)', padding:'4px 10px', borderRadius:100, fontSize:'0.85rem', fontWeight:800, letterSpacing:'0.03em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '1.1rem' }}>👆🏾</span> Swipe
    </span>
                  <span>to navigate</span>
                </p>
              </div>

              {/* ── Completion banner ── */}
              {isLast && (
                  <div className="card animate-in" style={{ marginTop:36, textAlign:'center', padding:'40px 32px', background: allLearned ? 'linear-gradient(135deg, #f0fdf4 0%, #e0f7f0 100%)' : 'linear-gradient(135deg, var(--primary-light) 0%, #fff8e6 100%)', border:`3px solid ${allLearned ? 'var(--green)' : 'var(--primary)'}`, boxShadow: allLearned ? '0 12px 40px rgba(0,182,122,0.2)' : '0 12px 40px rgba(245,166,35,0.2)' }}>
                    <div style={{ fontSize:56, marginBottom:16, animation:'bounceIn 0.5s ease both' }}>
                      {allLearned ? '🏆' : '🔥'}
                    </div>
                    <h3 style={{ marginBottom:10, color: allLearned ? '#009B65' : 'var(--navy)', fontSize:'1.5rem' }}>
                      {allLearned ? 'All cards mastered!' : "You've reached the end!"}
                    </h3>
                    <p style={{ color:'var(--text-sub)', fontSize:'1.05rem', marginBottom: 24, fontWeight:700 }}>
                      {allLearned ? 'Amazing work — you\'re ready to take the test.' : `${learnedCnt}/${total} cards learned. Test unlocked!`}
                    </p>

                    <button className="btn btn-primary animate-in" onClick={() => navigate(`/decks/${id}/test`)} style={{ background:'var(--green)', color:'white', boxShadow:'0 6px 20px rgba(0,182,122,0.4)', marginTop:8, fontSize:'1.15rem', padding:'14px 32px' }}>
                      🎯 Take Test Now
                    </button>
                  </div>
              )}
            </div>
        )}

        {/* ════════════════════════════════════════════
          ALL CARDS (LIST) MODE
      ════════════════════════════════════════════ */}
        {tab === 'list' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%,360px),1fr))', gap:24, alignItems:'start' }}>
              {cards.map((c, i) => {
                const lrn = learned[c.id]
                const cs  = CAT[c.conceptCategory] || { bg:'#F4F6FB', color:'var(--navy)', label:'General' }
                const fl  = !!listFlipped[c.id]
                return (
                    <div key={c.id} className="card animate-in"
                         onClick={() => setListFlipped(p => ({ ...p, [c.id]: !p[c.id] }))}
                         style={{
                           animationDelay:`${i*0.04}s`, cursor:'pointer',
                           borderTop:`4px solid ${lrn ? 'var(--green)' : cs.color}`,
                           background: lrn ? 'linear-gradient(160deg,#f0fdf4,#fff)' : '#fff',
                           transition:'background 0.4s, box-shadow 0.2s',
                           display:'flex', flexDirection:'column', gap:14, padding:'24px'
                         }}
                         onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
                         onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow-sm)'}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                        <span className="badge" style={{ background:cs.bg, color:cs.color, fontSize:'0.85rem' }}>{cs.label}</span>
                        <span style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:800 }}>{DIFF[c.difficulty] || 'Foundational'}</span>
                      </div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                        {fl ? 'Answer' : 'Question'}
                      </div>
                      <p style={{ lineHeight:1.7, color:'var(--text)', fontSize:'1.1rem', flex:1, fontWeight:600 }}>
                        {fl ? c.back : c.front}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginTop:'auto' }}
                           onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:700 }}>tap to {fl ? 'flip back' : 'reveal'}</span>
                        {lrn
                            ? <span style={{ fontSize:'0.95rem', fontWeight:900, color:'var(--green)', display:'flex', alignItems:'center', gap:6 }}>✓ Learned</span>
                            : <button
                                onClick={e => { e.stopPropagation(); markLearned(e, c.id) }}
                                disabled={!!marking[c.id]}
                                style={{ padding:'8px 16px', background:'var(--primary)', color:'var(--navy)', border:'none', borderRadius:'var(--radius-sm)', fontSize:'0.9rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                              {marking[c.id] ? '…' : '✓ Mark Learned'}
                            </button>
                        }
                      </div>
                    </div>
                )
              })}
            </div>
        )}

        {/* ════════════════════════════════════════════
          GRAPH MODE
      ════════════════════════════════════════════ */}
        {tab === 'graph' && graph && (
            <div>
              <div className="card" style={{ marginBottom:20, background:'var(--navy)', color:'white', border:'none', padding:'24px' }}>
                <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'1.05rem', fontWeight:600 }}>
                  Cards pointing <strong style={{ color:'white' }}>FROM</strong> a concept must be mastered before the concept they point <strong style={{ color:'white' }}>TO</strong> unlocks.
                </p>
              </div>
              {graph.edges.length === 0
                  ? <div className="card" style={{ textAlign:'center', padding:64 }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
                    <p style={{ color:'var(--text-sub)', fontSize:'1.1rem', fontWeight:700 }}>No prerequisite relationships found.</p>
                  </div>
                  : <div style={{ display:'grid', gap:14 }}>
                    {graph.edges.map((edge, i) => {
                      const from = graph.nodes.find(n => n.id === edge.from)
                      const to   = graph.nodes.find(n => n.id === edge.to)
                      return (
                          <div key={i} className="card animate-in" style={{ animationDelay:`${i*0.04}s`, display:'flex', alignItems:'center', gap:16, padding:'20px 28px', flexWrap:'wrap' }}>
                            <span style={{ flex:1, fontWeight:800, color:'var(--navy)', minWidth:100, fontSize:'1.1rem' }}>{from?.conceptName}</span>
                            <span style={{ background:'var(--primary-light)', color:'var(--primary-dark)', width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'1.2rem', flexShrink:0 }}>→</span>
                            <span style={{ flex:1, fontWeight:800, color:'var(--navy)', textAlign:'right', minWidth:100, fontSize:'1.1rem' }}>{to?.conceptName}</span>
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