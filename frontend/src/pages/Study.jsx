import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

export default function Study() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/decks')
      .then(res => {
        // Only show READY decks
        setDecks(res.data.filter(d => d.status === 'READY'))
      })
      .catch(() => setError('Failed to load decks'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (deck) => {
    if (!deck.hasPdf) return
    setDownloading(d => ({ ...d, [deck.id]: true }))
    try {
      const res = await api.get(`/api/decks/${deck.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${deck.title}_flashcards.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Try again.')
    } finally {
      setDownloading(d => ({ ...d, [deck.id]: false }))
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>📄 My PDF Library</h1>
        <p style={{ color: 'var(--cm-text-sub)' }}>
          Every deck you create gets a downloadable flashcard PDF — print it, share it, study offline.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--cm-red-light)', color: 'var(--cm-red-dark)',
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          marginBottom: 20, fontWeight: 600, fontSize: '0.875rem',
        }}>{error}</div>
      )}

      {decks.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center', padding: '60px 40px',
          border: '2px dashed var(--cm-border)', boxShadow: 'none', background: 'white',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
          <h3 style={{ marginBottom: 8, color: 'var(--cm-navy)' }}>No PDFs yet</h3>
          <p style={{ color: 'var(--cm-text-sub)', marginBottom: 24 }}>
            Upload a PDF on the Decks page — a flashcard PDF is auto-generated when your deck is ready.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/decks')}>
            Go to My Decks
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {decks.map((deck, i) => {
            const isReady = deck.hasPdf
            const isDownloading = downloading[deck.id]
            const generatedDate = deck.pdfGeneratedAt
              ? new Date(deck.pdfGeneratedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
              <div
                key={deck.id}
                className="card animate-in"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 24px',
                  opacity: isReady ? 1 : 0.6,
                }}
              >
                {/* PDF icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: isReady ? 'var(--cm-red-light)' : 'var(--cm-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {isReady ? '📕' : '⏳'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '1rem', color: 'var(--cm-navy)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}>
                    {deck.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cm-text-muted)' }}>
                    {isReady
                      ? `PDF ready · Generated ${generatedDate}`
                      : 'PDF is being generated…'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  {/* View deck */}
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate(`/decks/${deck.id}`)}
                    style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                  >
                    View Deck
                  </button>

                  {/* Download */}
                  <button
                    className="btn btn-primary"
                    disabled={!isReady || isDownloading}
                    onClick={() => handleDownload(deck)}
                    style={{
                      fontSize: '0.85rem', padding: '8px 16px',
                      opacity: !isReady ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: !isReady ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDownloading
                      ? <><Spinner size={14} color="white" /> Downloading…</>
                      : isReady
                      ? '⬇ Download PDF'
                      : '⏳ Generating…'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 32, padding: '16px 20px',
        background: 'var(--cm-bg)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--cm-border)', fontSize: '0.82rem',
        color: 'var(--cm-text-muted)', lineHeight: 1.6,
      }}>
        💡 PDFs are generated automatically when a deck is ready. Each PDF contains all flashcards with questions and answers — great for printing or studying offline.
      </div>
    </div>
  )
}
