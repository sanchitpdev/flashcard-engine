import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const MASTERY_CONFIG = {
  mastered: { label: 'Mastered', color: 'var(--cm-green)',  bg: 'var(--cm-green-light)',  icon: '✓' },
  shaky:    { label: 'Shaky',    color: 'var(--cm-yellow)', bg: 'var(--cm-yellow-light)', icon: '~' },
  new:      { label: 'New',      color: 'var(--cm-text-muted)', bg: 'var(--cm-border)',   icon: '○' },
}

export default function Progress() {
  const [summary, setSummary] = useState(null)
  const [decks, setDecks] = useState([])
  const [deckProgress, setDeckProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/summary'),
      api.get('/api/decks'),
    ]).then(([s, d]) => {
      setSummary(s.data)
      setDecks(d.data.filter(deck => deck.status === 'READY'))
    }).finally(() => setLoading(false))
  }, [])

  const loadDeckProgress = async (deckId) => {
    if (deckProgress[deckId]) {
      setExpanded(expanded === deckId ? null : deckId)
      return
    }
    const res = await api.get(`/api/progress/deck/${deckId}`)
    setDeckProgress(p => ({ ...p, [deckId]: res.data }))
    setExpanded(deckId)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  const pct = (n) => summary?.totalCards ? Math.round((n / summary.totalCards) * 100) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Your Progress</h1>
      <p style={{ color: 'var(--cm-text-sub)', marginBottom: 32 }}>Track your learning journey across all decks</p>

      {/* Summary stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Total Cards',   value: summary.totalCards, color: 'var(--cm-navy)',   icon: '📚' },
            { label: 'Mastered',      value: summary.mastered,   color: 'var(--cm-green)',  icon: '✅' },
            { label: 'Shaky',         value: summary.shaky,      color: 'var(--cm-yellow)', icon: '⚡' },
            { label: 'New',           value: summary.newCards,   color: 'var(--cm-text-muted)', icon: '🆕' },
            { label: 'Due Today',     value: summary.dueToday,   color: 'var(--cm-red)',    icon: '📅' },
          ].map(stat => (
            <div key={stat.label} className="card animate-in" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cm-text-sub)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      {summary && summary.totalCards > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Overall Mastery</h3>
          <div style={{ height: 16, borderRadius: 100, overflow: 'hidden', background: 'var(--cm-bg)', display: 'flex' }}>
            <div style={{ width: `${pct(summary.mastered)}%`, background: 'var(--cm-green)', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${pct(summary.shaky)}%`, background: 'var(--cm-yellow)', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${pct(summary.newCards)}%`, background: 'var(--cm-border)', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[
              { label: `${pct(summary.mastered)}% Mastered`, color: 'var(--cm-green)' },
              { label: `${pct(summary.shaky)}% Shaky`,       color: 'var(--cm-yellow)' },
              { label: `${pct(summary.newCards)}% New`,       color: 'var(--cm-text-muted)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--cm-text-sub)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-deck breakdown */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Deck Breakdown</h2>
      {decks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--cm-text-sub)' }}>No ready decks yet. Upload a PDF to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {decks.map((deck, i) => {
            const dp = deckProgress[deck.id]
            const isOpen = expanded === deck.id
            return (
              <div key={deck.id} className="card animate-in" style={{ animationDelay: `${i * 0.05}s`, padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => loadDeckProgress(deck.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                    padding: '20px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--cm-navy)' }}>{deck.title}</div>
                    {dp && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--cm-text-sub)', marginTop: 2 }}>
                        {dp.mastered} mastered · {dp.shaky} shaky · {dp.newCards} new · {dp.dueToday} due
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'var(--cm-text-muted)', fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && dp && (
                  <div style={{ borderTop: '1px solid var(--cm-border)', padding: '16px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                      {dp.cards.map(card => {
                        const mc = MASTERY_CONFIG[card.masteryLevel] || MASTERY_CONFIG.new
                        return (
                          <div key={card.cardId} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px',
                            background: mc.bg,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                          }}>
                            <span style={{ fontWeight: 900, color: mc.color, fontSize: '1rem', width: 16 }}>{mc.icon}</span>
                            <span style={{ fontWeight: 700, color: 'var(--cm-navy)', flex: 1 }}>{card.conceptName}</span>
                            {card.nextReviewAt && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--cm-text-muted)', whiteSpace: 'nowrap' }}>
                                {new Date(card.nextReviewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
