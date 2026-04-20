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

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={48} /></div>

  return (
      <div className="page">

        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', marginBottom:8 }}>📄 My PDF Library</h1>
          <p style={{ color:'var(--text-sub)', fontSize:'1.1rem', fontWeight:600 }}>Every deck gets a downloadable flashcard PDF — print it, share it, study offline.</p>
        </div>

        {error && (
            <div style={{ background:'var(--primary-light)', color:'var(--primary-dark)', padding:'14px 20px', borderRadius:'var(--radius-md)', marginBottom:24, fontWeight:800, fontSize:'1rem', border:'1px solid #F5A62345' }}>
              {error}
            </div>
        )}

        {decks.length===0 ? (
            <div style={{ textAlign:'center', padding:'80px 40px', border:'3px dashed var(--border)', borderRadius:'var(--radius-xl)', background:'white' }}>
              <div style={{ fontSize:64, marginBottom:20 }}>📭</div>
              <h3 style={{ marginBottom:12, fontSize:'1.8rem' }}>No PDFs yet</h3>
              <p style={{ color:'var(--text-sub)', marginBottom:32, fontSize:'1.1rem', fontWeight:600 }}>Upload a PDF on the Decks page — a flashcard PDF is auto-generated when your deck is ready.</p>
              <button className="btn btn-primary" onClick={() => navigate('/decks')} style={{ fontSize:'1.1rem', padding:'12px 28px' }}>Go to My Decks</button>
            </div>
        ) : (
            /* ── RESPONSIVE GRID FOR PDF CARDS ── */
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap:24 }}>
              {decks.map((deck, i) => {
                const ready = deck.hasPdf
                const dlng  = downloading[deck.id]
                const date  = deck.pdfGeneratedAt ? new Date(deck.pdfGeneratedAt).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' }) : null

                return (
                    <div key={deck.id} className="card animate-in"
                         style={{
                           animationDelay:`${i*0.05}s`, display:'flex', flexDirection:'column', gap:20, padding:'24px', opacity: ready?1:0.7,
                           transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                         }}
                         onMouseEnter={e => e.currentTarget.style.transform = ready ? 'translateY(-4px)' : 'none'}
                         onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      {/* Top Section: Icon and Title */}
                      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                        <div style={{ width:56, height:56, borderRadius:16, flexShrink:0, background: ready?'var(--primary-light)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                          {ready ? '📕' : '⏳'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.2rem', color:'var(--navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                            {deck.title}
                          </div>
                          <div style={{ fontSize:'0.95rem', color:'var(--text-sub)', fontWeight:700 }}>
                            {ready ? `PDF ready · ${date}` : 'Generating PDF…'}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section: Buttons pushed to the bottom */}
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:'auto' }}>
                        <button className="btn btn-ghost" onClick={() => navigate(`/decks/${deck.id}`)} style={{ fontSize:'1rem', padding:'10px 16px', fontWeight:800, flex:1, justifyContent:'center' }}>
                          View Deck
                        </button>
                        <button className="btn btn-primary" disabled={!ready||dlng} onClick={() => download(deck)}
                                style={{ fontSize:'1rem', padding:'10px 20px', opacity:!ready?0.5:1, cursor:!ready?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, flex:2 }}>
                          {dlng ? <><Spinner size={16} color="var(--navy)" /> Downloading…</> : ready ? '⬇ Download' : '⏳ Generating'}
                        </button>
                      </div>
                    </div>
                )
              })}
            </div>
        )}

        <div style={{ marginTop:36, padding:'20px 24px', background:'var(--primary-light)', borderRadius:'var(--radius-md)', border:'1px solid #F5A62340', fontSize:'0.95rem', color:'var(--primary-dark)', fontWeight:700, lineHeight:1.6 }}>
          💡 PDFs are auto-generated when a deck is ready. Each PDF has all flashcards with questions and answers — great for printing or offline study.
        </div>
      </div>
  )
}