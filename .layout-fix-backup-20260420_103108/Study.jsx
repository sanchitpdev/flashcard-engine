import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Study() {
  const navigate = useNavigate()
  const [decks,       setDecks]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [downloading, setDownloading] = useState({})
  const [error,       setError]       = useState('')

  useEffect(() => {
    api.get('/api/decks')
      .then(r => setDecks(r.data.filter(d => d.status==='READY')))
      .catch(() => setError('Failed to load decks'))
      .finally(() => setLoading(false))
  }, [])

  const download = async (deck) => {
    if (!deck.hasPdf) return
    setDownloading(d => ({ ...d, [deck.id]: true }))
    try {
      const res = await api.get(`/api/decks/${deck.id}/pdf`, { responseType:'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }))
      const a   = document.createElement('a'); a.href=url; a.download=`${deck.title}_flashcards.pdf`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { setError('Download failed. Try again.') }
    finally  { setDownloading(d => ({ ...d, [deck.id]: false })) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={36} /></div>

  return (
    <div className="page">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ marginBottom:6 }}>📄 My PDF Library</h1>
        <p style={{ color:'var(--text-sub)', fontSize:'0.9rem' }}>Every deck gets a downloadable flashcard PDF — print it, share it, study offline.</p>
      </div>

      {error && (
        <div style={{ background:'var(--primary-light)', color:'#9A6600', padding:'10px 14px', borderRadius:'var(--radius-sm)', marginBottom:18, fontWeight:600, fontSize:'0.875rem', border:'1px solid #F5A62345' }}>
          {error}
        </div>
      )}

      {decks.length===0 ? (
        <div style={{ textAlign:'center', padding:'64px 32px', border:'2px dashed var(--border)', borderRadius:'var(--radius-lg)', background:'white' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
          <h3 style={{ marginBottom:8 }}>No PDFs yet</h3>
          <p style={{ color:'var(--text-sub)', marginBottom:24, fontSize:'0.9rem' }}>Upload a PDF on the Decks page — a flashcard PDF is auto-generated when your deck is ready.</p>
          <button className="btn btn-primary" onClick={() => navigate('/decks')}>Go to My Decks</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {decks.map((deck, i) => {
            const ready = deck.hasPdf
            const dlng  = downloading[deck.id]
            const date  = deck.pdfGeneratedAt ? new Date(deck.pdfGeneratedAt).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' }) : null
            return (
              <div key={deck.id} className="card animate-in" style={{ animationDelay:`${i*0.05}s`, display:'flex', alignItems:'center', gap:16, padding:'18px 20px', opacity: ready?1:0.65 }}>
                <div style={{ width:48, height:48, borderRadius:12, flexShrink:0, background: ready?'var(--primary-light)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                  {ready ? '📕' : '⏳'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.95rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{deck.title}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                    {ready ? `PDF ready · ${date}` : 'Generating PDF…'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => navigate(`/decks/${deck.id}`)} style={{ fontSize:'0.85rem', padding:'7px 13px' }}>
                    View Deck
                  </button>
                  <button className="btn btn-primary" disabled={!ready||dlng} onClick={() => download(deck)}
                    style={{ fontSize:'0.85rem', padding:'7px 15px', opacity:!ready?0.5:1, cursor:!ready?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    {dlng ? <><Spinner size={13} color="var(--navy)" /> Downloading…</> : ready ? '⬇ Download PDF' : '⏳ Generating…'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop:28, padding:'14px 18px', background:'var(--primary-light)', borderRadius:'var(--radius-sm)', border:'1px solid #F5A62340', fontSize:'0.82rem', color:'#9A6600', lineHeight:1.6 }}>
        💡 PDFs are auto-generated when a deck is ready. Each PDF has all flashcards with questions and answers — great for printing or offline study.
      </div>
    </div>
  )
}
