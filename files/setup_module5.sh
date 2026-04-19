#!/bin/bash
set -euo pipefail

echo "=============================================="
echo " Module 5: React Frontend (Cuemath Design)   "
echo "=============================================="

# ─── Scaffold Vite + React project ───────────────────────────────────────────
cd "$(git rev-parse --show-toplevel)"

if [ ! -d "frontend" ]; then
  npm create vite@latest frontend -- --template react
fi

cd frontend
npm install
npm install axios react-router-dom zustand

# ─── .env.example ─────────────────────────────────────────────────────────────
cat > .env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:8080
EOF

# ─── vercel.json ──────────────────────────────────────────────────────────────
cat > vercel.json << 'EOF'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
EOF

# ─── index.html (Nunito font from Google Fonts) ───────────────────────────────
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
    <title>Cuemath Flashcard Engine</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ─── src/index.css (Cuemath brand tokens) ────────────────────────────────────
mkdir -p src
cat > src/index.css << 'EOF'
/* ── Cuemath Brand Tokens ─────────────────────────────────────────────────── */
:root {
  --cm-red:        #E84427;
  --cm-red-dark:   #C5311A;
  --cm-red-light:  #FFE8E3;
  --cm-navy:       #1A2B4A;
  --cm-navy-light: #243560;
  --cm-green:      #00B67A;
  --cm-green-light:#E0F7F0;
  --cm-yellow:     #F5A623;
  --cm-yellow-light:#FFF4DE;
  --cm-white:      #FFFFFF;
  --cm-bg:         #F7F8FC;
  --cm-surface:    #FFFFFF;
  --cm-border:     #E5E8F0;
  --cm-text:       #1A2B4A;
  --cm-text-sub:   #5A6A85;
  --cm-text-muted: #8A95A8;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  --shadow-sm: 0 2px 8px rgba(26,43,74,0.08);
  --shadow-md: 0 4px 20px rgba(26,43,74,0.12);
  --shadow-lg: 0 8px 40px rgba(26,43,74,0.16);
  --shadow-red: 0 4px 20px rgba(232,68,39,0.30);

  --font-display: 'Nunito', sans-serif;
  --font-body:    'Nunito Sans', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  background: var(--cm-bg);
  color: var(--cm-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5 {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--cm-navy);
}

a { text-decoration: none; color: inherit; }

/* ── Global Utilities ─────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}
.btn-primary {
  background: var(--cm-red);
  color: white;
  box-shadow: var(--shadow-red);
}
.btn-primary:hover { background: var(--cm-red-dark); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(232,68,39,0.40); }
.btn-primary:active { transform: translateY(0); }
.btn-secondary {
  background: white;
  color: var(--cm-navy);
  border: 2px solid var(--cm-border);
}
.btn-secondary:hover { border-color: var(--cm-red); color: var(--cm-red); }
.btn-ghost {
  background: transparent;
  color: var(--cm-text-sub);
  padding: 8px 16px;
}
.btn-ghost:hover { background: var(--cm-bg); color: var(--cm-navy); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

.card {
  background: var(--cm-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--cm-border);
  padding: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: var(--font-display);
}
.badge-green  { background: var(--cm-green-light);  color: #007A54; }
.badge-yellow { background: var(--cm-yellow-light); color: #9A6600; }
.badge-red    { background: var(--cm-red-light);    color: var(--cm-red-dark); }
.badge-blue   { background: #E8F0FE;                color: #1A6AD4; }

/* ── Animations ───────────────────────────────────────────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-in { animation: fadeInUp 0.35s ease both; }

/* ── Scrollbar ────────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cm-bg); }
::-webkit-scrollbar-thumb { background: var(--cm-border); border-radius: 4px; }
EOF

# ─── src/main.jsx ─────────────────────────────────────────────────────────────
cat > src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
EOF

# ─── src/store/authStore.js ───────────────────────────────────────────────────
mkdir -p src/store
cat > src/store/authStore.js << 'EOF'
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}))

export default useAuthStore
EOF

# ─── src/api/axios.js ─────────────────────────────────────────────────────────
mkdir -p src/api
cat > src/api/axios.js << 'EOF'
import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

// Request interceptor — attach Bearer token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = refreshRes.data.accessToken
        useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
EOF

# ─── src/components/Navbar.jsx ───────────────────────────────────────────────
mkdir -p src/components
cat > src/components/Navbar.jsx << 'EOF'
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
EOF

# ─── src/components/Spinner.jsx ──────────────────────────────────────────────
cat > src/components/Spinner.jsx << 'EOF'
export default function Spinner({ size = 24, color = 'var(--cm-red)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}20`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
EOF

# ─── src/pages/Login.jsx ──────────────────────────────────────────────────────
mkdir -p src/pages
cat > src/pages/Login.jsx << 'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Spinner from '../components/Spinner'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      setAuth(res.data.accessToken, { email: form.email })
      navigate('/decks')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--cm-navy) 0%, var(--cm-navy-light) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div className="animate-in" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 440,
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--cm-red)',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, color: 'white', fontSize: 28,
            marginBottom: 16,
            boxShadow: 'var(--shadow-red)',
          }}>C</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--cm-text-sub)', fontSize: '0.95rem' }}>
            Sign in to continue learning
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--cm-red-light)',
            color: 'var(--cm-red-dark)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 20,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
              Email address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--cm-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cm-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--cm-border)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--cm-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cm-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--cm-border)'}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px' }}>
            {loading ? <Spinner size={18} color="white" /> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--cm-text-sub)' }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--cm-red)', fontWeight: 700 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
EOF

# ─── src/pages/Register.jsx ───────────────────────────────────────────────────
cat > src/pages/Register.jsx << 'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Spinner from '../components/Spinner'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', form)
      // Auto-login after register
      const res = await api.post('/api/auth/login', form)
      setAuth(res.data.accessToken, { email: form.email })
      navigate('/decks')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--cm-navy) 0%, var(--cm-navy-light) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div className="animate-in" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 440,
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--cm-red)',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, color: 'white', fontSize: 28,
            marginBottom: 16,
            boxShadow: 'var(--shadow-red)',
          }}>C</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 6 }}>Start learning</h1>
          <p style={{ color: 'var(--cm-text-sub)', fontSize: '0.95rem' }}>
            Create your free account
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--cm-red-light)',
            color: 'var(--cm-red-dark)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 20,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
              Email address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: '2px solid var(--cm-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cm-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--cm-border)'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="min. 8 characters"
              required
              style={{
                width: '100%', padding: '12px 16px',
                border: '2px solid var(--cm-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cm-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--cm-border)'}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px' }}>
            {loading ? <Spinner size={18} color="white" /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--cm-text-sub)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cm-red)', fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
EOF

# ─── src/pages/Decks.jsx ──────────────────────────────────────────────────────
cat > src/pages/Decks.jsx << 'EOF'
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
EOF

# ─── src/pages/DeckDetail.jsx ─────────────────────────────────────────────────
cat > src/pages/DeckDetail.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const CATEGORY_COLORS = {
  definition:    { bg: '#E8F0FE', color: '#1A6AD4' },
  relationship:  { bg: '#F3E8FF', color: '#7B2FBE' },
  procedure:     { bg: '#FFF4DE', color: '#9A6600' },
  example:       { bg: 'var(--cm-green-light)', color: '#007A54' },
  misconception: { bg: 'var(--cm-red-light)', color: 'var(--cm-red-dark)' },
}
const DIFF_LABELS = { 1: '⬡ Foundational', 2: '⬡⬡ Intermediate', 3: '⬡⬡⬡ Advanced' }

export default function DeckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [graph, setGraph] = useState(null)
  const [tab, setTab] = useState('cards')
  const [loading, setLoading] = useState(true)
  const [flipped, setFlipped] = useState({})

  useEffect(() => {
    Promise.all([
      api.get(`/api/decks/${id}`),
      api.get(`/api/decks/${id}/cards`),
      api.get(`/api/decks/${id}/graph`),
    ]).then(([d, c, g]) => {
      setDeck(d.data)
      setCards(c.data)
      setGraph(g.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  const toggleFlip = (cardId) => setFlipped(p => ({ ...p, [cardId]: !p[cardId] }))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      {/* Back + Header */}
      <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ marginBottom: 24, paddingLeft: 0 }}>
        ← Back to Decks
      </button>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{deck?.title}</h1>
        <p style={{ color: 'var(--cm-text-sub)' }}>{cards.length} cards generated</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--cm-border)', paddingBottom: 0 }}>
        {['cards', 'graph'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: tab === t ? 'var(--cm-red)' : 'var(--cm-text-sub)',
              borderBottom: tab === t ? '2px solid var(--cm-red)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >{t === 'cards' ? '📋 Cards' : '🔗 Dependency Graph'}</button>
        ))}
      </div>

      {/* Cards Tab */}
      {tab === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {cards.map((card, i) => {
            const isFlipped = flipped[card.id]
            const catStyle = CATEGORY_COLORS[card.conceptCategory] || { bg: 'var(--cm-bg)', color: 'var(--cm-text)' }
            return (
              <div
                key={card.id}
                className="card animate-in"
                style={{ animationDelay: `${i * 0.04}s`, cursor: 'pointer', minHeight: 180, position: 'relative' }}
                onClick={() => toggleFlip(card.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                    {card.conceptCategory}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cm-text-muted)', fontWeight: 600 }}>
                    {DIFF_LABELS[card.difficulty]}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--cm-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isFlipped ? 'Answer' : 'Question'}
                </div>
                <p style={{ lineHeight: 1.6, color: 'var(--cm-text)', fontSize: '0.95rem' }}>
                  {isFlipped ? card.back : card.front}
                </p>
                <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: '0.75rem', color: 'var(--cm-text-muted)' }}>
                  tap to {isFlipped ? 'flip back' : 'reveal'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Graph Tab */}
      {tab === 'graph' && graph && (
        <div>
          <div className="card" style={{ marginBottom: 16, background: 'var(--cm-navy)', color: 'white', border: 'none' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
              Cards with arrows pointing <strong style={{ color: 'white' }}>FROM</strong> a concept must be mastered before the concept they point <strong style={{ color: 'white' }}>TO</strong> appears in your study queue.
            </p>
          </div>
          {graph.edges.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--cm-text-sub)' }}>No prerequisite relationships found for this deck.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {graph.edges.map((edge, i) => {
                const fromNode = graph.nodes.find(n => n.id === edge.from)
                const toNode = graph.nodes.find(n => n.id === edge.to)
                return (
                  <div key={i} className="card animate-in" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                    <span style={{ flex: 1, fontWeight: 700, color: 'var(--cm-navy)' }}>{fromNode?.conceptName}</span>
                    <span style={{ color: 'var(--cm-red)', fontSize: '1.25rem' }}>→</span>
                    <span style={{ flex: 1, fontWeight: 700, color: 'var(--cm-navy)', textAlign: 'right' }}>{toNode?.conceptName}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
EOF

# ─── src/pages/Study.jsx ──────────────────────────────────────────────────────
cat > src/pages/Study.jsx << 'EOF'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const RATINGS = [
  { value: 0, label: 'Blackout',   color: '#DC2626', bg: '#FEE2E2' },
  { value: 1, label: 'Wrong',      color: '#EA580C', bg: '#FFEDD5' },
  { value: 2, label: 'Hard',       color: '#D97706', bg: '#FEF3C7' },
  { value: 3, label: 'Good',       color: '#16A34A', bg: '#DCFCE7' },
  { value: 4, label: 'Easy',       color: '#2563EB', bg: '#DBEAFE' },
  { value: 5, label: 'Perfect',    color: '#7C3AED', bg: '#EDE9FE' },
]

export default function Study() {
  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/study/queue')
      setQueue(res.data)
      setIdx(0)
      setFlipped(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [])

  const card = queue[idx]

  const handleRate = async (rating) => {
    setSubmitting(true)
    try {
      const res = await api.post('/api/study/review', { cardId: card.cardId, rating })
      setLastResult(res.data)
      setTimeout(() => {
        setLastResult(null)
        setFlipped(false)
        if (idx + 1 < queue.length) setIdx(idx + 1)
        else fetchQueue() // reload queue when done
      }, 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  if (queue.length === 0) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ marginBottom: 12 }}>All caught up!</h2>
      <p style={{ color: 'var(--cm-text-sub)', marginBottom: 8 }}>
        No cards are due right now.
      </p>
      <p style={{ color: 'var(--cm-text-muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        Cards with unmastered prerequisites are held back until you've mastered the foundational concepts first — that's the Topology Gate keeping your learning in order.
      </p>
      <button className="btn btn-primary" onClick={fetchQueue}>Refresh Queue</button>
    </div>
  )

  const progress = ((idx) / queue.length) * 100

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-text-sub)' }}>
            Card {idx + 1} of {queue.length}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-red)' }}>
            {Math.round(progress)}% done
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--cm-border)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--cm-red), var(--cm-yellow))',
            borderRadius: 100,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => !submitting && setFlipped(!flipped)}
        style={{
          background: flipped
            ? 'linear-gradient(135deg, var(--cm-navy) 0%, var(--cm-navy-light) 100%)'
            : 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 40px',
          minHeight: 260,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--cm-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'background 0.35s ease, transform 0.15s ease',
          transform: flipped ? 'rotateY(0deg)' : 'none',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span className="badge" style={{
            background: flipped ? 'rgba(255,255,255,0.15)' : 'var(--cm-red-light)',
            color: flipped ? 'rgba(255,255,255,0.8)' : 'var(--cm-red-dark)',
          }}>
            {flipped ? 'Answer' : card.conceptCategory}
          </span>
          <span style={{ fontSize: '0.8rem', color: flipped ? 'rgba(255,255,255,0.5)' : 'var(--cm-text-muted)', fontWeight: 600 }}>
            {card.conceptName}
          </span>
        </div>

        <p style={{
          fontSize: '1.15rem',
          lineHeight: 1.7,
          color: flipped ? 'white' : 'var(--cm-text)',
          flex: 1,
        }}>
          {flipped ? card.back : card.front}
        </p>

        {!flipped && (
          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--cm-text-muted)', textAlign: 'center' }}>
            Tap card to reveal answer
          </p>
        )}
      </div>

      {/* Rating buttons — only show after flip */}
      {flipped && (
        <div className="animate-in">
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--cm-text-sub)', marginBottom: 14 }}>
            How well did you know this?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {RATINGS.map(r => (
              <button
                key={r.value}
                className="btn"
                disabled={submitting}
                onClick={() => handleRate(r.value)}
                style={{
                  flexDirection: 'column',
                  padding: '12px 4px',
                  background: r.bg,
                  color: r.color,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  gap: 4,
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{r.value}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result flash */}
      {lastResult && (
        <div className="card animate-in" style={{
          marginTop: 20, textAlign: 'center', background: 'var(--cm-green-light)',
          border: '1px solid var(--cm-green)', padding: '16px',
        }}>
          <p style={{ color: '#007A54', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            ✓ Next review in {lastResult.newIntervalDays} day{lastResult.newIntervalDays !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
EOF

# ─── src/pages/Progress.jsx ───────────────────────────────────────────────────
cat > src/pages/Progress.jsx << 'EOF'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'

const MASTERY_CONFIG = {
  mastered: { label: 'Mastered', color: 'var(--cm-green)',  bg: 'var(--cm-green-light)',  icon: '✓' },
  shaky:    { label: 'Shaky',    color: 'var(--cm-yellow)', bg: 'var(--cm-yellow-light)', icon: '~' },
  new:      { label: 'New',      color: 'var(--cm-text-muted)', bg: 'var(--cm-border)',   icon: '○' },
}

export default function Progress() {
  const [summary, setSummary] = useState(null)
  const [decks, setDecks] = useState([])
  const [deckProgress, setDeckProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/summary'),
      api.get('/api/decks'),
    ]).then(([s, d]) => {
      setSummary(s.data)
      setDecks(d.data.filter(deck => deck.status === 'READY'))
    }).finally(() => setLoading(false))
  }, [])

  const loadDeckProgress = async (deckId) => {
    if (deckProgress[deckId]) {
      setExpanded(expanded === deckId ? null : deckId)
      return
    }
    const res = await api.get(`/api/progress/deck/${deckId}`)
    setDeckProgress(p => ({ ...p, [deckId]: res.data }))
    setExpanded(deckId)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={40} />
    </div>
  )

  const pct = (n) => summary?.totalCards ? Math.round((n / summary.totalCards) * 100) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Your Progress</h1>
      <p style={{ color: 'var(--cm-text-sub)', marginBottom: 32 }}>Track your learning journey across all decks</p>

      {/* Summary stats */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Total Cards',   value: summary.totalCards, color: 'var(--cm-navy)',   icon: '📚' },
            { label: 'Mastered',      value: summary.mastered,   color: 'var(--cm-green)',  icon: '✅' },
            { label: 'Shaky',         value: summary.shaky,      color: 'var(--cm-yellow)', icon: '⚡' },
            { label: 'New',           value: summary.newCards,   color: 'var(--cm-text-muted)', icon: '🆕' },
            { label: 'Due Today',     value: summary.dueToday,   color: 'var(--cm-red)',    icon: '📅' },
          ].map(stat => (
            <div key={stat.label} className="card animate-in" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cm-text-sub)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      {summary && summary.totalCards > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Overall Mastery</h3>
          <div style={{ height: 16, borderRadius: 100, overflow: 'hidden', background: 'var(--cm-bg)', display: 'flex' }}>
            <div style={{ width: `${pct(summary.mastered)}%`, background: 'var(--cm-green)', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${pct(summary.shaky)}%`, background: 'var(--cm-yellow)', transition: 'width 0.8s ease' }} />
            <div style={{ width: `${pct(summary.newCards)}%`, background: 'var(--cm-border)', transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[
              { label: `${pct(summary.mastered)}% Mastered`, color: 'var(--cm-green)' },
              { label: `${pct(summary.shaky)}% Shaky`,       color: 'var(--cm-yellow)' },
              { label: `${pct(summary.newCards)}% New`,       color: 'var(--cm-text-muted)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--cm-text-sub)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-deck breakdown */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Deck Breakdown</h2>
      {decks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--cm-text-sub)' }}>No ready decks yet. Upload a PDF to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {decks.map((deck, i) => {
            const dp = deckProgress[deck.id]
            const isOpen = expanded === deck.id
            return (
              <div key={deck.id} className="card animate-in" style={{ animationDelay: `${i * 0.05}s`, padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => loadDeckProgress(deck.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                    padding: '20px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--cm-navy)' }}>{deck.title}</div>
                    {dp && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--cm-text-sub)', marginTop: 2 }}>
                        {dp.mastered} mastered · {dp.shaky} shaky · {dp.newCards} new · {dp.dueToday} due
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'var(--cm-text-muted)', fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && dp && (
                  <div style={{ borderTop: '1px solid var(--cm-border)', padding: '16px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                      {dp.cards.map(card => {
                        const mc = MASTERY_CONFIG[card.masteryLevel] || MASTERY_CONFIG.new
                        return (
                          <div key={card.cardId} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px',
                            background: mc.bg,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                          }}>
                            <span style={{ fontWeight: 900, color: mc.color, fontSize: '1rem', width: 16 }}>{mc.icon}</span>
                            <span style={{ fontWeight: 700, color: 'var(--cm-navy)', flex: 1 }}>{card.conceptName}</span>
                            {card.nextReviewAt && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--cm-text-muted)', whiteSpace: 'nowrap' }}>
                                {new Date(card.nextReviewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
EOF

# ─── src/App.jsx ──────────────────────────────────────────────────────────────
cat > src/App.jsx << 'EOF'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Study from './pages/Study'
import Progress from './pages/Progress'

function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/decks" element={<PrivateRoute><Decks /></PrivateRoute>} />
        <Route path="/decks/:id" element={<PrivateRoute><DeckDetail /></PrivateRoute>} />
        <Route path="/study" element={<PrivateRoute><Study /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
      </Routes>
    </>
  )
}
EOF

# ─── Remove boilerplate files ─────────────────────────────────────────────────
rm -f src/App.css src/assets/react.svg public/vite.svg 2>/dev/null || true

# ─── Go back to repo root and commit ──────────────────────────────────────────
cd ..

git add .
git commit -m "feat: Module 5 - React Frontend"
git push origin main

echo ""
echo "================================================================"
echo " Module 5 setup complete!"
echo ""
echo " EXIT CONDITION TO VERIFY:"
echo "   cd frontend && cp .env.example .env && npm run dev"
echo "   1. /register → creates account → redirects to /decks"
echo "   2. Upload PDF → status PROCESSING → polls to READY"
echo "   3. Click deck → Cards tab shows flip cards"
echo "   4. Graph tab shows dependency arrows"
echo "   5. /study → flip card → rate 0-5 → progress to next"
echo "   6. /progress → mastery bar + per-deck breakdown"
echo "================================================================"
