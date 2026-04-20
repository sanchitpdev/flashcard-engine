import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Test() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])   // [{cardId, selectedAnswer}]
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(true)

  useEffect(() => {
    api.get(`/api/decks/${id}/test`)
      .then(res => {
        setQuestions(res.data.questions)
        setTimeLeft(30)
      })
      .catch(() => setError('Failed to load test questions.'))
      .finally(() => setLoading(false))
  }, [id])

  // Timer countdown
  useEffect(() => {
    if (!timerActive || selected !== null || questions.length === 0) return
    if (timeLeft <= 0) {
      handleNext(null) // auto-advance on timeout
      return
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, timerActive, selected, questions.length])

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setTimerActive(false)
  }

  const handleNext = useCallback((chosenOption) => {
    const q = questions[idx]
    const newAnswers = [...answers, { cardId: q.cardId, selectedAnswer: chosenOption }]
    setAnswers(newAnswers)

    if (idx + 1 < questions.length) {
      setIdx(idx + 1)
      setSelected(null)
      setTimeLeft(30)
      setTimerActive(true)
    } else {
      // Submit
      setSubmitting(true)
      api.post(`/api/decks/${id}/test/submit`, { deckId: id, answers: newAnswers })
        .then(res => navigate(`/decks/${id}/test/result`, { state: { result: res.data, deckId: id } }))
        .catch(() => setError('Failed to submit test.'))
        .finally(() => setSubmitting(false))
    }
  }, [idx, questions, answers, id, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!questions[idx]) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 4) {
        const opt = questions[idx].options[num - 1]
        if (opt) handleSelect(opt)
      }
      if (e.key === 'Enter' && selected !== null) handleNext(selected)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [questions, idx, selected, handleNext])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>
  if (error) return <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', color: 'var(--cm-red)' }}>{error}</div>
  if (submitting) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, gap: 16 }}>
      <Spinner size={40} />
      <p style={{ color: 'var(--cm-text-sub)' }}>Submitting your answers…</p>
    </div>
  )

  const q = questions[idx]
  const progress = ((idx) / questions.length) * 100
  const timerPct = (timeLeft / 30) * 100
  const timerColor = timeLeft > 15 ? 'var(--cm-green)' : timeLeft > 8 ? 'var(--cm-yellow)' : 'var(--cm-red)'

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/decks/${id}`)} style={{ paddingLeft: 0 }}>
          ← Exit Test
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--cm-text-sub)' }}>
          {idx + 1} / {questions.length}
        </span>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `conic-gradient(${timerColor} ${timerPct}%, var(--cm-border) 0%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 900, color: timerColor,
          }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: 'var(--cm-border)', borderRadius: 100, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--cm-red), var(--cm-yellow))', transition: 'width 0.4s ease', borderRadius: 100 }} />
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: 24, padding: '32px 32px', minHeight: 120 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cm-text-muted)', marginBottom: 12 }}>
          Question {idx + 1}
        </div>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: 'var(--cm-text)', fontWeight: 600 }}>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((option, oi) => {
          const isSelected = selected === option
          const isCorrect = selected !== null && option === q.options[q.correctIndex]
          const isWrong = isSelected && !isCorrect

          let bg = 'white', border = '2px solid var(--cm-border)', color = 'var(--cm-text)'
          if (selected !== null) {
            if (isCorrect) { bg = 'var(--cm-green-light)'; border = '2px solid var(--cm-green)'; color = '#007A54' }
            else if (isWrong) { bg = 'var(--cm-red-light)'; border = '2px solid var(--cm-red)'; color = 'var(--cm-red-dark)' }
            else { bg = 'white'; border = '2px solid var(--cm-border)'; color = 'var(--cm-text-muted)' }
          } else if (isSelected) {
            bg = 'var(--cm-red-light)'; border = '2px solid var(--cm-red)'
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              style={{
                background: bg, border, color,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                textAlign: 'left',
                cursor: selected !== null ? 'default' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: selected !== null
                  ? (isCorrect ? 'var(--cm-green)' : isWrong ? 'var(--cm-red)' : 'var(--cm-border)')
                  : 'var(--cm-bg)',
                color: selected !== null && (isCorrect || isWrong) ? 'white' : 'var(--cm-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '0.8rem', flexShrink: 0,
              }}>
                {selected !== null
                  ? (isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + oi))
                  : String.fromCharCode(65 + oi)}
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {/* Next / Submit button */}
      {selected !== null && (
        <div className="animate-in" style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleNext(selected)}
            style={{ minWidth: 160 }}
          >
            {idx + 1 < questions.length ? 'Next Question →' : 'See Results 🎯'}
          </button>
          <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--cm-text-muted)' }}>
            or press <kbd style={{ background: 'var(--cm-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--cm-border)', fontSize: '0.75rem' }}>Enter</kbd>
          </p>
        </div>
      )}
    </div>
  )
}
