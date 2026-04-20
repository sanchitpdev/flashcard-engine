import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const LINKS = [
  { path: '/decks',    label: 'My Decks',    icon: '📚' },
  { path: '/study',    label: 'PDF Library', icon: '📄' },
  { path: '/progress', label: 'Progress',    icon: '📊' },
]

export default function Navbar() {
  const { accessToken, clearAuth } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  if (!accessToken) return null

  const logout = () => { clearAuth(); navigate('/login'); setOpen(false) }
  const close  = () => setOpen(false)

  const linkStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
    color:      active ? 'var(--navy)' : 'rgba(255,255,255,0.78)',
    background: active ? 'var(--primary)' : 'transparent',
    transition: 'all 0.15s',
    textDecoration: 'none',
  })

  return (
    <>
      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 300,
        height: 68,
        background: 'var(--navy)',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 64px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        gap: 8,
      }}>

        {/* Brand */}
        <Link to="/decks" onClick={close} style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: '1.45rem', letterSpacing: '0.06em',
          color: 'white', textDecoration: 'none',
          marginRight: 24, flexShrink: 0,
        }}>
          CUEMATH
        </Link>

        {/* Desktop links */}
        <div className="nav-desktop" style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
          {LINKS.map(l => {
            const active = location.pathname.startsWith(l.path)
            return (
              <Link key={l.path} to={l.path} style={linkStyle(active)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{l.icon}</span>{l.label}
              </Link>
            )
          })}
        </div>

        {/* Sign Out — desktop */}
        <button onClick={logout} className="nav-desktop" style={{
          background: 'var(--primary)', color: 'var(--navy)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '8px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--primary-dark)'; e.currentTarget.style.color='#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.color='var(--navy)' }}
        >
           Sign Out
        </button>

        {/* Hamburger — mobile */}
        <button onClick={() => setOpen(o => !o)} className="nav-mobile" style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          cursor: 'pointer', color: 'white', fontSize: '1.5rem',
          display: 'none', padding: 6, lineHeight: 1,
        }}>
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {open && (
        <div className="nav-mobile" style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 299,
          background: 'var(--navy)',
          padding: '14px 20px 22px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {LINKS.map(l => {
            const active = location.pathname.startsWith(l.path)
            return (
              <Link key={l.path} to={l.path} onClick={close} style={{
                ...linkStyle(active),
                fontSize: '1rem', padding: '12px 16px',
                background: active ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{l.icon}</span>{l.label}
              </Link>
            )
          })}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 12 }}>
            <button onClick={logout} style={{
              width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)', border: 'none', cursor: 'pointer',
              color: 'var(--navy)', fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: '1rem',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Responsive rules — injected once per render */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
        }
        @media (min-width: 641px) {
          .nav-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
