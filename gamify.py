import os

print("Applying Gamification UI Update (Fixing cardId)...")

study_path = "frontend/src/pages/Study.jsx"
study_content = """import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Study() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/study/queue').then(res => {
      // Handle both possible backend responses
      const data = Array.isArray(res.data) ? res.data : (res.data.cards || [])
      setQueue(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const currentCard = queue[currentIndex]

  // Generate Multiple Choice Options dynamically
  useEffect(() => {
    if (!currentCard || !queue.length) return
    
    // Use cardId instead of id!
    const wrongAnswers = queue
      .filter(c => c.cardId !== currentCard.cardId)
      .map(c => c.back)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      
    while (wrongAnswers.length < 3) {
      wrongAnswers.push("Alternative concept definition " + Math.floor(Math.random() * 100))
    }
    
    const allOptions = [...wrongAnswers, currentCard.back].sort(() => 0.5 - Math.random())
    setOptions(allOptions)
    setSelectedOption(null)
  }, [currentCard, queue])

  const handleSelect = async (opt) => {
    if (selectedOption) return 
    setSelectedOption(opt)
    
    const correct = (opt === currentCard.back)
    
    // Save using cardId for the DeckDetail page!
    const mastery = JSON.parse(localStorage.getItem('cardMastery') || '{}')
    mastery[currentCard.cardId] = correct ? 'green' : 'red'
    localStorage.setItem('cardMastery', JSON.stringify(mastery))

    try {
       await api.post('/api/study/review', {
         cardId: currentCard.cardId,
         rating: correct ? 4 : 1  // 4=Easy, 1=Again
       })
    } catch(e) {
       console.error("Failed to save review", e)
    }
    
    setTimeout(() => {
       if (currentIndex + 1 < queue.length) {
          setCurrentIndex(curr => curr + 1)
       } else {
          setQueue([]) 
       }
    }, 1500)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={40}/></div>
  
  if (queue.length === 0) return (
    <div style={{ maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: 20 }}>🎉</h1>
      <h2>Test Complete!</h2>
      <p style={{ color: 'var(--cm-text-sub)', marginBottom: 30 }}>Check your deck to see your red and green mastery lines.</p>
      <button onClick={() => navigate('/decks')} className="btn btn-primary">Back to Decks</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', color: 'var(--cm-text-sub)' }}>
        <span>Question {currentIndex + 1} of {queue.length}</span>
        <span>{Math.round((currentIndex / queue.length) * 100)}%</span>
      </div>
      
      <div className="card animate-in" style={{ padding: '40px 30px', marginBottom: 30, textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
        {currentCard.front}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {options.map((opt, i) => {
          let bg = 'white'
          let color = 'var(--cm-text)'
          let border = '2px solid var(--cm-border)'
          
          if (selectedOption) {
            if (opt === currentCard.back) {
              bg = 'var(--cm-green-light)'; color = 'var(--cm-green-dark)'; border = '2px solid var(--cm-green-dark)'
            } else if (opt === selectedOption) {
              bg = 'var(--cm-red-light)'; color = 'var(--cm-red-dark)'; border = '2px solid var(--cm-red-dark)'
            }
          }

          return (
            <button 
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={!!selectedOption}
              style={{
                padding: '16px 20px', borderRadius: '12px', fontSize: '1rem',
                background: bg, color: color, border: border,
                cursor: selectedOption ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.2s',
                lineHeight: '1.4'
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
"""

with open(study_path, "w", encoding="utf-8") as f:
    f.write(study_content)
print("✅ Study.jsx updated to fix the cardId mapping!")
