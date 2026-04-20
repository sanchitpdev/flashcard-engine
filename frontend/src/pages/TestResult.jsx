import { useLocation, useNavigate, useParams } from 'react-router-dom'

const CAT_COLORS = {
  definition:    { bg: '#E8F0FE', color: '#1A6AD4' },
  relationship:  { bg: '#F3E8FF', color: '#7B2FBE' },
  procedure:     { bg: '#FFF4DE', color: '#9A6600' },
  example:       { bg: 'var(--cm-green-light)', color: '#007A54' },
  misconception: { bg: 'var(--cm-red-light)', color: 'var(--cm-red-dark)' },
}

export default function TestResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const result = state?.result

  if (!result) {
    navigate(`/decks/${id}`)
    return null
  }

  const { total, correct, scorePct, results, categoryBreakdown } = result
  const wrongCards = results.filter(r => !r.correct)

  const scoreColor = scorePct >= 80 ? 'var(--cm-green)' : scorePct >= 50 ? 'var(--cm-yellow)' : 'var(--cm-red)'
  const scoreEmoji = scorePct >= 80 ? '🏆' : scorePct >= 50 ? '📈' : '💪'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      {/* Score header */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px', marginBottom: 28, background: 'var(--cm-navy)', color: 'white', border: 'none' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{scoreEmoji}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4rem', color: scoreColor, lineHeight: 1 }}>
          {Math.round(scorePct)}%
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: '1.1rem' }}>
          {correct} correct out of {total} questions
        </div>
        {scorePct < 100 && (
          <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: '0.875rem' }}>
            {wrongCards.length} card{wrongCards.length !== 1 ? 's' : ''} sent back to red for re-study
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Score by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryBreakdown.map(cat => {
              const cs = CAT_COLORS[cat.category] || { bg: 'var(--cm-bg)', color: 'var(--cm-text)' }
              const barColor = cat.pct >= 80 ? 'var(--cm-green)' : cat.pct >= 50 ? 'var(--cm-yellow)' : 'var(--cm-red)'
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="badge" style={{ background: cs.bg, color: cs.color, textTransform: 'capitalize' }}>
                      {cat.category}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--cm-text)' }}>
                      {cat.correct}/{cat.total} ({Math.round(cat.pct)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--cm-border)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: barColor, borderRadius: 100, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wrong answers */}
      {wrongCards.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 4, fontSize: '1rem', color: 'var(--cm-red-dark)' }}>❌ Incorrect Answers</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--cm-text-muted)', marginBottom: 16 }}>These cards were reset to red and will appear in your study queue.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wrongCards.map((r, i) => (
              <div key={i} style={{ background: 'var(--cm-red-light)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', borderLeft: '3px solid var(--cm-red)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-text)', marginBottom: 6 }}>{r.question}</div>
                <div style={{ fontSize: '0.8rem', color: '#007A54' }}>✓ Correct: <strong>{r.correctAnswer}</strong></div>
                {r.selectedAnswer && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--cm-red-dark)', marginTop: 2 }}>✗ Your answer: <strong>{r.selectedAnswer}</strong></div>
                )}
                {!r.selectedAnswer && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--cm-text-muted)', marginTop: 2 }}>⏱ Timed out</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct answers */}
      {results.filter(r => r.correct).length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', color: '#007A54' }}>✅ Correct Answers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.filter(r => r.correct).map((r, i) => (
              <div key={i} style={{ background: 'var(--cm-green-light)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.875rem', color: '#007A54', fontWeight: 600 }}>
                ✓ {r.question}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/decks/${id}/test`)}>
          🔁 Retake Test
        </button>
        {wrongCards.length > 0 && (
          <button className="btn btn-secondary" onClick={() => navigate('/study')}>
            📖 Study Wrong Cards
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => navigate(`/decks/${id}`)}>
          ← Back to Deck
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/progress')}>
          📊 View Progress
        </button>
      </div>
    </div>
  )
}
