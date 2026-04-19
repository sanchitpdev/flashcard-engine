import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const RATINGS = [
  { value: 0, label: 'Blackout',   color: '#DC2626', bg: '#FEE2E2' },
  { value: 1, label: 'Wrong',      color: '#EA580C', bg: '#FFEDD5' },
  { value: 2, label: 'Hard',       color: '#D97706', bg: '#FEF3C7' },
  { value: 3, label: 'Good',       color: '#16A34A', bg: '#DCFCE7' },
  { value: 4, label: 'Easy',       color: '#2563EB', bg: '#DBEAFE' },
  { value: 5, label: 'Perfect',    color: '#7C3AED', bg: '#EDE9FE' },
]

export default function Study() {
  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/study/queue')
      setQueue(res.data)
      setIdx(0)
      setFlipped(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [])

  const card = queue[idx]

  const handleRate = async (rating) => {
    setSubmitting(true)
    try {
      const res = await api.post('/api/study/review', { cardId: card.cardId, rating })
      setLastResult(res.data)
      setTimeout(() => {
        setLastResult(null)
        setFlipped(false)
        if (idx + 1 < queue.length) setIdx(idx + 1)
        else fetchQueue() // reload queue when done
      }, 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  if (queue.length === 0) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ marginBottom: 12 }}>All caught up!</h2>
      <p style={{ color: 'var(--cm-text-sub)', marginBottom: 8 }}>
        No cards are due right now.
      </p>
      <p style={{ color: 'var(--cm-text-muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        Cards with unmastered prerequisites are held back until you've mastered the foundational concepts first — that's the Topology Gate keeping your learning in order.
      </p>
      <button className="btn btn-primary" onClick={fetchQueue}>Refresh Queue</button>
    </div>
  )

  const progress = ((idx) / queue.length) * 100

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
            Card {idx + 1} of {queue.length}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-red)' }}>
            {Math.round(progress)}% done
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--cm-border)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--cm-red), var(--cm-yellow))',
            borderRadius: 100,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => !submitting && setFlipped(!flipped)}
        style={{
          background: flipped
            ? 'linear-gradient(135deg, var(--cm-navy) 0%, var(--cm-navy-light) 100%)'
            : 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 40px',
          minHeight: 260,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--cm-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'background 0.35s ease, transform 0.15s ease',
          transform: flipped ? 'rotateY(0deg)' : 'none',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span className="badge" style={{
            background: flipped ? 'rgba(255,255,255,0.15)' : 'var(--cm-red-light)',
            color: flipped ? 'rgba(255,255,255,0.8)' : 'var(--cm-red-dark)',
          }}>
            {flipped ? 'Answer' : card.conceptCategory}
          </span>
          <span style={{ fontSize: '0.8rem', color: flipped ? 'rgba(255,255,255,0.5)' : 'var(--cm-text-muted)', fontWeight: 600 }}>
            {card.conceptName}
          </span>
        </div>

        <p style={{
          fontSize: '1.15rem',
          lineHeight: 1.7,
          color: flipped ? 'white' : 'var(--cm-text)',
          flex: 1,
        }}>
          {flipped ? card.back : card.front}
        </p>

        {!flipped && (
          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--cm-text-muted)', textAlign: 'center' }}>
            Tap card to reveal answer
          </p>
        )}
      </div>

      {/* Rating buttons — only show after flip */}
      {flipped && (
        <div className="animate-in">
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-text-sub)', marginBottom: 14 }}>
            How well did you know this?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {RATINGS.map(r => (
              <button
                key={r.value}
                className="btn"
                disabled={submitting}
                onClick={() => handleRate(r.value)}
                style={{
                  flexDirection: 'column',
                  padding: '12px 4px',
                  background: r.bg,
                  color: r.color,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  gap: 4,
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{r.value}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result flash */}
      {lastResult && (
        <div className="card animate-in" style={{
          marginTop: 20, textAlign: 'center', background: 'var(--cm-green-light)',
          border: '1px solid var(--cm-green)', padding: '16px',
        }}>
          <p style={{ color: '#007A54', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            ✓ Next review in {lastResult.newIntervalDays} day{lastResult.newIntervalDays !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
