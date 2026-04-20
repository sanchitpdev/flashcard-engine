import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const CATEGORY_COLORS = {
  definition:    { bg: '#E8F0FE', color: '#1A6AD4' },
  relationship:  { bg: '#F3E8FF', color: '#7B2FBE' },
  procedure:     { bg: '#FFF4DE', color: '#9A6600' },
  example:       { bg: 'var(--cm-green-light)', color: '#007A54' },
  misconception: { bg: 'var(--cm-red-light)', color: 'var(--cm-red-dark)' },
}
const DIFF_LABELS = { 1: '⬡ Foundational', 2: '⬡⬡ Intermediate', 3: '⬡⬡⬡ Advanced' }

export default function DeckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [graph, setGraph] = useState(null)
  const [tab, setTab] = useState('cards')
  const [loading, setLoading] = useState(true)
  const [flipped, setFlipped] = useState({})
  // Simple green/red state — cardId → true means learned
  const [learned, setLearned] = useState({})
  const [marking, setMarking] = useState({}) // loading state per card

  useEffect(() => {
    Promise.all([
      api.get(`/api/decks/${id}`),
      api.get(`/api/decks/${id}/cards`),
      api.get(`/api/decks/${id}/graph`),
      api.get(`/api/progress/deck/${id}`),
    ]).then(([d, c, g, p]) => {
      setDeck(d.data)
      setCards(c.data)
      setGraph(g.data)
      // Seed learned state from existing mastery data
      const learnedMap = {}
      p.data.cards?.forEach(card => {
        if (card.masteryLevel === 'mastered') learnedMap[card.cardId] = true
      })
      setLearned(learnedMap)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spinner size={40} />
      </div>
  )

  const learnedCount = Object.values(learned).filter(Boolean).length
  const totalCards = cards.length
  const allLearned = totalCards > 0 && learnedCount === totalCards

  const markLearned = async (e, cardId) => {
    e.stopPropagation() // don't flip the card
    if (learned[cardId]) return // already green, nothing to do
    setMarking(m => ({ ...m, [cardId]: true }))
    try {
      // rating 5 = perfect = marks as mastered in SM-2 backend
      await api.post('/api/study/review', { cardId, rating: 5 })
      setLearned(l => ({ ...l, [cardId]: true }))
    } finally {
      setMarking(m => ({ ...m, [cardId]: false }))
    }
  }

  const toggleFlip = (cardId) => setFlipped(p => ({ ...p, [cardId]: !p[cardId] }))

  return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back */}
        <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ marginBottom: 24, paddingLeft: 0 }}>
          ← Back to Decks
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{deck?.title}</h1>
            <p style={{ color: 'var(--cm-text-sub)' }}>{totalCards} cards</p>
          </div>

          {/* Right side: progress + test button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 220 }}>
            {/* Counter */}
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: allLearned ? '#007A54' : 'var(--cm-text-sub)' }}>
              {allLearned ? '🎉 All cards learned!' : `${learnedCount} / ${totalCards} learned`}
            </div>

            {/* Progress bar */}
            <div style={{ width: 220, height: 8, background: 'var(--cm-border)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${totalCards > 0 ? (learnedCount / totalCards) * 100 : 0}%`,
                background: allLearned ? 'var(--cm-green)' : 'var(--cm-red)',
                borderRadius: 100,
                transition: 'width 0.5s ease, background 0.3s ease',
              }} />
            </div>

            {/* Test button — only shows when all green */}
            {allLearned ? (
                <button
                    className="btn btn-primary animate-in"
                    onClick={() => navigate(`/decks/${id}/test`)}
                    style={{ background: 'var(--cm-green)', borderColor: 'var(--cm-green)', marginTop: 4 }}
                >
                  🎯 Take Test
                </button>
            ) : (
                <div style={{
                  fontSize: '0.78rem', color: 'var(--cm-text-muted)', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  🔒 Mark all cards as learned to unlock test
                </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--cm-border)' }}>
          {['cards', 'graph'].map(t => (
              <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                    color: tab === t ? 'var(--cm-red)' : 'var(--cm-text-sub)',
                    borderBottom: tab === t ? '2px solid var(--cm-red)' : '2px solid transparent',
                    marginBottom: -2, transition: 'all 0.15s',
                  }}
              >{t === 'cards' ? '📋 Cards' : '🔗 Dependency Graph'}</button>
          ))}
        </div>

        {/* Cards Tab */}
        {tab === 'cards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {cards.map((card, i) => {
                const isFlipped = flipped[card.id]
                const isLearned = learned[card.id]
                const isMarking = marking[card.id]
                const catStyle = CATEGORY_COLORS[card.conceptCategory] || { bg: 'var(--cm-bg)', color: 'var(--cm-text)' }

                return (
                    <div
                        key={card.id}
                        className="card animate-in"
                        onClick={() => toggleFlip(card.id)}
                        style={{
                          animationDelay: `${i * 0.04}s`,
                          cursor: 'pointer',
                          minHeight: 200,
                          position: 'relative',
                          borderTop: `3px solid ${isLearned ? 'var(--cm-green)' : 'var(--cm-red)'}`,
                          background: isLearned ? 'linear-gradient(to bottom, #f0fdf4, white)' : 'white',
                          transition: 'background 0.4s ease, border-color 0.3s ease',
                        }}
                    >
                      {/* Top row: category + difficulty */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                    {card.conceptCategory}
                  </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--cm-text-muted)', fontWeight: 600 }}>
                    {DIFF_LABELS[card.difficulty]}
                  </span>
                      </div>

                      {/* Question / Answer label */}
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--cm-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isFlipped ? 'Answer' : 'Question'}
                      </div>

                      {/* Content */}
                      <p style={{ lineHeight: 1.6, color: 'var(--cm-text)', fontSize: '0.95rem', marginBottom: 48 }}>
                        {isFlipped ? card.back : card.front}
                      </p>

                      {/* Bottom row: flip hint + Mark as Learned button */}
                      <div
                          style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                          onClick={e => e.stopPropagation()} // prevent flip when clicking bottom row
                      >
                  <span style={{ fontSize: '0.75rem', color: 'var(--cm-text-muted)' }}>
                    tap to {isFlipped ? 'flip back' : 'reveal'}
                  </span>

                        {isLearned ? (
                            <span style={{
                              fontSize: '0.78rem', fontWeight: 800,
                              color: '#007A54', display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                      ✓ Learned
                    </span>
                        ) : (
                            <button
                                onClick={(e) => markLearned(e, card.id)}
                                disabled={isMarking}
                                style={{
                                  padding: '5px 12px',
                                  background: 'var(--cm-green)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: isMarking ? 'default' : 'pointer',
                                  opacity: isMarking ? 0.7 : 1,
                                  transition: 'opacity 0.2s',
                                  fontFamily: 'inherit',
                                }}
                            >
                              {isMarking ? '…' : '✓ Mark as Learned'}
                            </button>
                        )}
                      </div>
                    </div>
                )
              })}
            </div>
        )}

        {/* Graph Tab */}
        {tab === 'graph' && graph && (
            <div>
              <div className="card" style={{ marginBottom: 16, background: 'var(--cm-navy)', color: 'white', border: 'none' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  Cards with arrows pointing <strong style={{ color: 'white' }}>FROM</strong> a concept must be mastered before the concept they point <strong style={{ color: 'white' }}>TO</strong> appears in your study queue.
                </p>
              </div>
              {graph.edges.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--cm-text-sub)' }}>No prerequisite relationships found for this deck.</p>
                  </div>
              ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {graph.edges.map((edge, i) => {
                      const fromNode = graph.nodes.find(n => n.id === edge.from)
                      const toNode = graph.nodes.find(n => n.id === edge.to)
                      return (
                          <div key={i} className="card animate-in" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                            <span style={{ flex: 1, fontWeight: 700, color: 'var(--cm-navy)' }}>{fromNode?.conceptName}</span>
                            <span style={{ color: 'var(--cm-red)', fontSize: '1.25rem' }}>→</span>
                            <span style={{ flex: 1, fontWeight: 700, color: 'var(--cm-navy)', textAlign: 'right' }}>{toNode?.conceptName}</span>
                          </div>
                      )
                    })}
                  </div>
              )}
            </div>
        )}
      </div>
  )
}