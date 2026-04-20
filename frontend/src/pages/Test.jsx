import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Test() {
  const { id } = useParams(); const navigate = useNavigate()
  const [questions,  setQuestions]  = useState([])
  const [idx,        setIdx]        = useState(0)
  const [answers,    setAnswers]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [timeLeft,   setTimeLeft]   = useState(30)
  const [timerOn,    setTimerOn]    = useState(true)

  useEffect(() => {
    api.get(`/api/decks/${id}/test`)
        .then(r => { setQuestions(r.data.questions); setTimeLeft(30) })
        .catch(() => setError('Failed to load test questions.'))
        .finally(() => setLoading(false))
  }, [id])

  const next = useCallback((ans) => {
    const q = questions[idx]
    const na = [...answers, { cardId: q.cardId, selectedAnswer: ans }]
    setAnswers(na)
    if (idx+1 < questions.length) {
      setIdx(idx+1); setSelected(null); setTimeLeft(30); setTimerOn(true)
    } else {
      setSubmitting(true)
      api.post(`/api/decks/${id}/test/submit`, { deckId:id, answers:na })
          .then(r => navigate(`/decks/${id}/test/result`, { state:{ result:r.data } }))
          .catch(() => setError('Failed to submit test.'))
          .finally(() => setSubmitting(false))
    }
  }, [idx, questions, answers, id, navigate])

  useEffect(() => {
    if (!timerOn || selected!==null || questions.length===0) return
    if (timeLeft<=0) { next(null); return }
    const t = setTimeout(() => setTimeLeft(x => x-1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, timerOn, selected, questions.length])

  useEffect(() => {
    const h = (e) => {
      if (!questions[idx]) return
      const n = parseInt(e.key)
      if (n>=1 && n<=4) { const o=questions[idx].options[n-1]; if(o && selected===null){ setSelected(o); setTimerOn(false) } }
      if (e.key==='Enter' && selected!==null) next(selected)
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [questions, idx, selected, next])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={48} /></div>
  if (error)   return <div style={{ maxWidth:800, margin:'80px auto', textAlign:'center', color:'var(--red-dark)', fontWeight:800, fontSize:'1.2rem', padding:24 }}>{error}</div>
  if (submitting) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:20 }}>
        <Spinner size={48} /><p style={{ color:'var(--text-sub)', fontSize:'1.2rem', fontWeight:800 }}>Submitting your answers…</p>
      </div>
  )

  const q    = questions[idx]
  const prog = (idx/questions.length)*100
  const tpct = (timeLeft/30)*100
  const tc   = timeLeft>15 ? 'var(--green)' : timeLeft>8 ? 'var(--primary)' : 'var(--red-dark)'

  return (
      <div style={{ maxWidth:860, margin:'0 auto', padding:'clamp(24px,4vw,48px) clamp(16px,4vw,32px)' }}>
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/decks/${id}`)} style={{ paddingLeft:0, fontSize:'1.05rem', fontWeight:800 }}>← Exit Test</button>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.2rem', color:'var(--text-sub)' }}>{idx+1} / {questions.length}</span>
          <div style={{ width:56, height:56, borderRadius:'50%', background:`conic-gradient(${tc} ${tpct}%, var(--border) 0%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:900, color:tc, boxShadow:'0 4px 12px rgba(0,0,0,0.05)' }}>
            {timeLeft}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:8, background:'var(--border)', borderRadius:100, overflow:'hidden', marginBottom:36 }}>
          <div style={{ height:'100%', width:`${prog}%`, background:'linear-gradient(90deg,var(--primary),var(--green))', borderRadius:100, transition:'width 0.4s' }} />
        </div>

        {/* Question */}
        <div className="card" style={{ marginBottom:28, padding:'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 48px)' }}>
          <div style={{ fontSize:'1rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:16 }}>Question {idx+1}</div>
          <p style={{ fontSize:'clamp(1.2rem, 3vw, 1.6rem)', lineHeight:1.7, color:'var(--navy)', fontWeight:800 }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {q.options.map((opt, oi) => {
            const isSel     = selected===opt
            const isCorrect = selected!==null && opt===q.options[q.correctIndex]
            const isWrong   = isSel && !isCorrect
            let bg='white', border='2px solid var(--border)', color='var(--text)'
            if (selected!==null) {
              if (isCorrect)   { bg='var(--green-light)'; border='2px solid var(--green)';   color='#007A54' }
              else if (isWrong){ bg='var(--red-light)';   border='2px solid var(--red-dark)';color='var(--red-dark)' }
              else             { bg='white';              border='2px solid var(--border)';  color='var(--text-muted)' }
            }
            return (
                <button key={oi} disabled={selected!==null}
                        onClick={() => { if(selected===null){ setSelected(opt); setTimerOn(false) } }}
                        style={{ background:bg, border, color, borderRadius:'var(--radius-md)', padding:'18px 24px', textAlign:'left', cursor:selected!==null?'default':'pointer', fontFamily:'inherit', fontSize:'1.15rem', lineHeight:1.6, display:'flex', alignItems:'center', gap:16, transition:'all 0.18s', fontWeight:700 }}
                >
              <span style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'1.1rem', background: selected!==null?(isCorrect?'var(--green)':isWrong?'var(--red-dark)':'var(--border)'):'var(--border)', color: selected!==null&&(isCorrect||isWrong)?'white':'var(--text-sub)' }}>
                {selected!==null?(isCorrect?'✓':isWrong?'✗':String.fromCharCode(65+oi)):String.fromCharCode(65+oi)}
              </span>
                  {opt}
                </button>
            )
          })}
        </div>

        {selected!==null && (
            <div className="animate-in" style={{ marginTop:36, textAlign:'center' }}>
              <button className="btn btn-primary" onClick={() => next(selected)} style={{ minWidth:200, padding:'16px 32px', fontSize:'1.2rem' }}>
                {idx+1<questions.length ? 'Next Question →' : 'See Results 🎯'}
              </button>
              <p style={{ marginTop:12, fontSize:'1rem', color:'var(--text-muted)', fontWeight:700 }}>or press Enter</p>
            </div>
        )}
      </div>
  )
}