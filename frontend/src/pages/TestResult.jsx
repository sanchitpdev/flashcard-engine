import { useLocation, useNavigate, useParams } from 'react-router-dom'

const CAT = {
  definition:    { bg:'#E8F0FE', color:'#1A6AD4' },
  relationship:  { bg:'#F3E8FF', color:'#7B2FBE' },
  procedure:     { bg:'#FFF4DE', color:'#9A6600' },
  example:       { bg:'var(--green-light)', color:'#007A54' },
  misconception: { bg:'var(--red-light)',   color:'var(--red-dark)' },
}

export default function TestResult() {
  const { id } = useParams(); const navigate = useNavigate()
  const { state } = useLocation(); const result = state?.result
  if (!result) { navigate(`/decks/${id}`); return null }

  const { total, correct, scorePct, results, categoryBreakdown } = result
  const wrong  = results.filter(r => !r.correct)
  const sc     = scorePct>=80 ? 'var(--green)' : scorePct>=50 ? 'var(--primary)' : 'var(--red)'
  const emoji  = scorePct>=80 ? '🏆' : scorePct>=50 ? '📈' : '💪'

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'clamp(20px,4vw,40px) clamp(14px,4vw,24px)' }}>
      {/* Score */}
      <div className="card" style={{ textAlign:'center', padding:'44px 28px', marginBottom:22, background:'var(--navy)', border:'none' }}>
        <div style={{ fontSize:56, marginBottom:10 }}>{emoji}</div>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'3.5rem', color:sc, lineHeight:1 }}>{Math.round(scorePct)}%</div>
        <div style={{ color:'rgba(255,255,255,0.7)', marginTop:8, fontSize:'1rem' }}>{correct} correct out of {total}</div>
        {scorePct<100 && <div style={{ color:'rgba(255,255,255,0.45)', marginTop:4, fontSize:'0.83rem' }}>{wrong.length} card{wrong.length!==1?'s':''} reset for re-study</div>}
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length>0 && (
        <div className="card" style={{ marginBottom:18 }}>
          <h3 style={{ marginBottom:14, fontSize:'0.95rem' }}>Score by Category</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {categoryBreakdown.map(cat => {
              const cs  = CAT[cat.category]||{ bg:'var(--border)', color:'var(--text)' }
              const bar = cat.pct>=80?'var(--green)':cat.pct>=50?'var(--primary)':'var(--red)'
              return (
                <div key={cat.category}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span className="badge" style={{ background:cs.bg, color:cs.color, textTransform:'capitalize' }}>{cat.category}</span>
                    <span style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--text)' }}>{cat.correct}/{cat.total} ({Math.round(cat.pct)}%)</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${cat.pct}%`, background:bar, borderRadius:100, transition:'width 0.8s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wrong */}
      {wrong.length>0 && (
        <div className="card" style={{ marginBottom:18 }}>
          <h3 style={{ marginBottom:4, fontSize:'0.95rem', color:'var(--red-dark)' }}>❌ Incorrect Answers</h3>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:14 }}>These cards were reset and will appear in your study queue.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {wrong.map((r,i) => (
              <div key={i} style={{ background:'var(--red-light)', borderRadius:'var(--radius-sm)', padding:'12px 14px', borderLeft:'3px solid var(--red)' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text)', marginBottom:5 }}>{r.question}</div>
                <div style={{ fontSize:'0.78rem', color:'#007A54' }}>✓ Correct: <strong>{r.correctAnswer}</strong></div>
                {r.selectedAnswer && <div style={{ fontSize:'0.78rem', color:'var(--red-dark)', marginTop:2 }}>✗ You chose: <strong>{r.selectedAnswer}</strong></div>}
                {!r.selectedAnswer && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>⏱ Timed out</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct */}
      {results.filter(r=>r.correct).length>0 && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ marginBottom:12, fontSize:'0.95rem', color:'#007A54' }}>✅ Correct Answers</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {results.filter(r=>r.correct).map((r,i) => (
              <div key={i} style={{ background:'var(--green-light)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'0.85rem', color:'#007A54', fontWeight:600 }}>✓ {r.question}</div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/decks/${id}/test`)}>🔁 Retake Test</button>
        <button className="btn btn-ghost"   onClick={() => navigate(`/decks/${id}`)}>← Back to Deck</button>
        <button className="btn btn-ghost"   onClick={() => navigate('/progress')}>📊 Progress</button>
      </div>
    </div>
  )
}
