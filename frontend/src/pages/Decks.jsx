import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const STATUS_CONFIG = {
  READY:      { label: 'Ready',      cls: 'badge-green'  },
  PROCESSING: { label: 'Processing', cls: 'badge-yellow' },
  FAILED:     { label: 'Failed',     cls: 'badge-red'    },
}

export default function Decks() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const navigate = useNavigate()

  const fetchDecks = async () => {
    try {
      const res = await api.get('/api/decks')
      setDecks(res.data)
    } catch {
      setError('Failed to load decks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecks()
    // Poll while any deck is PROCESSING
    const id = setInterval(() => {
      if (decks.some(d => d.status === 'PROCESSING')) fetchDecks()
    }, 4000)
    return () => clearInterval(id)
  }, [decks.length])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post('/api/decks', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchDecks()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const handleDelete = async (e, deckId) => {
    e.stopPropagation() // Prevents the click from opening the deck details
    if (!window.confirm('Are you sure you want to delete this deck?')) return

    try {
      await api.delete(`/api/decks/${deckId}`)
      // Remove it from the screen immediately
      setDecks(decks.filter(d => d.id !== deckId))
    } catch (err) {
      setError('Failed to delete deck')
    }
  }

  return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>My Decks</h1>
            <p style={{ color: 'var(--cm-text-sub)' }}>
              Upload a PDF to generate AI-powered flashcards
            </p>
          </div>
          <label style={{ cursor: 'pointer' }}>
            <input type="file" accept=".pdf" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
            <span className="btn btn-primary" style={{ pointerEvents: uploading ? 'none' : 'auto', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <><Spinner size={16} color="white" /> Uploading…</> : '+ Upload PDF'}
          </span>
          </label>
        </div>

        {error && (
            <div style={{
              background: 'var(--cm-red-light)', color: 'var(--cm-red-dark)',
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              marginBottom: 20, fontWeight: 600, fontSize: '0.875rem',
            }}>{error}</div>
        )}

        {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Spinner size={36} />
            </div>
        ) : decks.length === 0 ? (
            <div className="card" style={{
              textAlign: 'center', padding: '60px 40px',
              border: '2px dashed var(--cm-border)',
              boxShadow: 'none', background: 'white',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <h3 style={{ marginBottom: 8, color: 'var(--cm-navy)' }}>No decks yet</h3>
              <p style={{ color: 'var(--cm-text-sub)', marginBottom: 24 }}>
                Upload your first PDF to get started
              </p>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
                <span className="btn btn-primary">Upload PDF</span>
              </label>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {decks.map((deck, i) => {
                const sc = STATUS_CONFIG[deck.status] || STATUS_CONFIG.PROCESSING
                return (
                    <div
                        key={deck.id}
                        className="card animate-in"
                        style={{
                          animationDelay: `${i * 0.05}s`,
                          cursor: deck.status === 'READY' ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '20px 24px',
                          transition: 'box-shadow 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={e => { if (deck.status === 'READY') { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
                        onClick={() => deck.status === 'READY' && navigate(`/decks/${deck.id}`)}
                    >
                      <div style={{
                        width: 48, height: 48,
                        background: 'var(--cm-red-light)',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {deck.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--cm-text-muted)' }}>
                          {new Date(deck.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        {deck.status === 'PROCESSING' && <Spinner size={16} />}
                        <span className={`badge ${sc.cls}`}>{sc.label}</span>

                        {/* Delete Button */}
                        <button
                            onClick={(e) => handleDelete(e, deck.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: '1.1rem', opacity: 0.5, transition: 'opacity 0.2s',
                              padding: '4px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                            title="Delete Deck"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                )
              })}
            </div>
        )}
      </div>
  )
}