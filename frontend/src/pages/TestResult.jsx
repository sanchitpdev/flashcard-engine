import { useLocation, useNavigate, useParams } from 'react-router-dom'

const CAT = {
  definition:    { bg:'#E8F0FE', color:'#1A6AD4' },
  relationship:  { bg:'#F3E8FF', color:'#7B2FBE' },
  procedure:     { bg:'#FFF4DE', color:'#9A6600' },
  example:       { bg:'var(--green-light)', color:'#009B65' },
  misconception: { bg:'var(--red-light)',   color:'var(--red-dark)' },
}

export default function TestResult() {
  const { id } = useParams(); const navigate = useNavigate()
  const { state } = useLocation(); const result = state?.result
  if (!result) { navigate(`/decks/${id}`); return null }

  const { total, correct, scorePct, results, categoryBreakdown } = result
  const wrong  = results.filter(r => !r.correct)
  const sc     = scorePct>=80 ? 'var(--green)' : scorePct>=50 ? 'var(--primary)' : 'var(--red-dark)'
  const emoji  = scorePct>=80 ? '🏆' : scorePct>=50 ? '📈' : '💪'

  return (
      <div style={{ maxWidth:860, margin:'0 auto', padding:'clamp(24px,4vw,48px) clamp(16px,4vw,32px)' }}>
        {/* Score */}
        <div className="card" style={{ textAlign:'center', padding:'56px 32px', marginBottom:32, background:'var(--navy)', border:'none' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>{emoji}</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'4.5rem', color:sc, lineHeight:1 }}>{Math.round(scorePct)}%</div>
          <div style={{ color:'rgba(255,255,255,0.8)', marginTop:12, fontSize:'1.2rem', fontWeight:600 }}>{correct} correct out of {total}</div>
          {scorePct<100 && <div style={{ color:'rgba(255,255,255,0.5)', marginTop:8, fontSize:'1.05rem', fontWeight:600 }}>{wrong.length} card{wrong.length!==1?'s':''} reset for re-study</div>}
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length>0 && (
            <div className="card" style={{ marginBottom:28, padding:'32px' }}>
              <h3 style={{ marginBottom:20, fontSize:'1.5rem' }}>Score by Category</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {categoryBreakdown.map(cat => {
                  const cs  = CAT[cat.category]||{ bg:'var(--border)', color:'var(--navy)' }
                  const bar = cat.pct>=80?'var(--green)':cat.pct>=50?'var(--primary)':'var(--red-dark)'
                  return (
                      <div key={cat.category}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <span className="badge" style={{ background:cs.bg, color:cs.color, textTransform:'capitalize', fontSize:'1rem', padding:'6px 16px' }}>{cat.category}</span>
                          <span style={{ fontWeight:900, fontSize:'1.1rem', color:'var(--navy)' }}>{cat.correct}/{cat.total} ({Math.round(cat.pct)}%)</span>
                        </div>
                        <div style={{ height:8, background:'var(--border)', borderRadius:100, overflow:'hidden' }}>
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
            <div className="card" style={{ marginBottom:28, padding:'32px' }}>
              <h3 style={{ marginBottom:8, fontSize:'1.4rem', color:'var(--red-dark)' }}>❌ Incorrect Answers</h3>
              <p style={{ fontSize:'1.05rem', color:'var(--text-muted)', marginBottom:20, fontWeight:600 }}>These cards were reset and will appear in your study queue.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {wrong.map((r,i) => (
                    <div key={i} style={{ background:'var(--red-light)', borderRadius:'var(--radius-md)', padding:'16px 20px', borderLeft:'4px solid var(--red-dark)' }}>
                      <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--navy)', marginBottom:8 }}>{r.question}</div>
                      <div style={{ fontSize:'1rem', color:'#009B65', fontWeight:700 }}>✓ Correct: <strong>{r.correctAnswer}</strong></div>
                      {r.selectedAnswer && <div style={{ fontSize:'1rem', color:'var(--red-dark)', marginTop:4, fontWeight:700 }}>✗ You chose: <strong>{r.selectedAnswer}</strong></div>}
                      {!r.selectedAnswer && <div style={{ fontSize:'1rem', color:'var(--text-sub)', marginTop:4, fontWeight:700 }}>⏱ Timed out</div>}
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Correct */}
        {results.filter(r=>r.correct).length>0 && (
            <div className="card" style={{ marginBottom:36, padding:'32px' }}>
              <h3 style={{ marginBottom:16, fontSize:'1.4rem', color:'#009B65' }}>✅ Correct Answers</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {results.filter(r=>r.correct).map((r,i) => (
                    <div key={i} style={{ background:'var(--green-light)', borderRadius:'var(--radius-md)', padding:'14px 20px', fontSize:'1.05rem', color:'#009B65', fontWeight:800 }}>✓ {r.question}</div>
                ))}
              </div>
            </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/decks/${id}/test`)} style={{ fontSize:'1.1rem', padding:'14px 28px' }}>🔁 Retake Test</button>
          <button className="btn btn-ghost"   onClick={() => navigate(`/decks/${id}`)} style={{ fontSize:'1.1rem', padding:'14px 28px' }}>← Back to Deck</button>
          <button className="btn btn-ghost"   onClick={() => navigate('/progress')} style={{ fontSize:'1.1rem', padding:'14px 28px' }}>📊 Progress</button>
        </div>
      </div>
  )
}