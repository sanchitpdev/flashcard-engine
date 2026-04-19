import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_LINKS = [
  { path: '/decks',    label: 'My Decks' },
  { path: '/study',    label: 'Study' },
  { path: '/progress', label: 'Progress' },
]

export default function Navbar() {
  const { accessToken, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  if (!accessToken) return null

  return (
    <nav style={{
      background: 'var(--cm-navy)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      height: '64px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/decks" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 40 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--cm-red)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, color: 'white', fontSize: 18
        }}>C</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>
          Flashcard Engine
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {NAV_LINKS.map(link => {
          const active = location.pathname.startsWith(link.path)
          return (
            <Link key={link.path} to={link.path} style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              color: active ? 'white' : 'rgba(255,255,255,0.65)',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}>{link.label}</Link>
          )
        })}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Sign Out
      </button>
    </nav>
  )
}
