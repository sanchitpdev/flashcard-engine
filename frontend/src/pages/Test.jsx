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

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={40} /></div>
  if (error)   return <div style={{ maxWidth:600, margin:'80px auto', textAlign:'center', color:'var(--red)', padding:24 }}>{error}</div>
  if (submitting) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:80, gap:16 }}>
      <Spinner size={40} /><p style={{ color:'var(--text-sub)' }}>Submitting your answers…</p>
    </div>
  )

  const q    = questions[idx]
  const prog = (idx/questions.length)*100
  const tpct = (timeLeft/30)*100
  const tc   = timeLeft>15 ? 'var(--green)' : timeLeft>8 ? 'var(--primary)' : 'var(--red)'

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'clamp(20px,4vw,40px) clamp(14px,4vw,24px)' }}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/decks/${id}`)} style={{ paddingLeft:0 }}>← Exit Test</button>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.88rem', color:'var(--text-sub)' }}>{idx+1} / {questions.length}</span>
        <div style={{ width:38, height:38, borderRadius:'50%', background:`conic-gradient(${tc} ${tpct}%, var(--border) 0%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:900, color:tc }}>
          {timeLeft}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:5, background:'var(--border)', borderRadius:100, overflow:'hidden', marginBottom:28 }}>
        <div style={{ height:'100%', width:`${prog}%`, background:'linear-gradient(90deg,var(--primary),var(--green))', borderRadius:100, transition:'width 0.4s' }} />
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom:20, padding:'28px' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:10 }}>Question {idx+1}</div>
        <p style={{ fontSize:'1.1rem', lineHeight:1.7, color:'var(--text)', fontWeight:600 }}>{q.question}</p>
      </div>

      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {q.options.map((opt, oi) => {
          const isSel     = selected===opt
          const isCorrect = selected!==null && opt===q.options[q.correctIndex]
          const isWrong   = isSel && !isCorrect
          let bg='white', border='2px solid var(--border)', color='var(--text)'
          if (selected!==null) {
            if (isCorrect)   { bg='var(--green-light)'; border='2px solid var(--green)';   color='#007A54' }
            else if (isWrong){ bg='var(--red-light)';   border='2px solid var(--red)';     color='var(--red-dark)' }
            else             { bg='white';              border='2px solid var(--border)';  color='var(--text-muted)' }
          }
          return (
            <button key={oi} disabled={selected!==null}
              onClick={() => { if(selected===null){ setSelected(opt); setTimerOn(false) } }}
              style={{ background:bg, border, color, borderRadius:'var(--radius-md)', padding:'14px 18px', textAlign:'left', cursor:selected!==null?'default':'pointer', fontFamily:'inherit', fontSize:'0.92rem', lineHeight:1.5, display:'flex', alignItems:'center', gap:12, transition:'all 0.18s' }}
            >
              <span style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.78rem', background: selected!==null?(isCorrect?'var(--green)':isWrong?'var(--red)':'var(--border)'):'var(--border)', color: selected!==null&&(isCorrect||isWrong)?'white':'var(--text-muted)' }}>
                {selected!==null?(isCorrect?'✓':isWrong?'✗':String.fromCharCode(65+oi)):String.fromCharCode(65+oi)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {selected!==null && (
        <div className="animate-in" style={{ marginTop:22, textAlign:'center' }}>
          <button className="btn btn-primary" onClick={() => next(selected)} style={{ minWidth:160 }}>
            {idx+1<questions.length ? 'Next Question →' : 'See Results 🎯'}
          </button>
          <p style={{ marginTop:7, fontSize:'0.77rem', color:'var(--text-muted)' }}>or press Enter</p>
        </div>
      )}
    </div>
  )
}
