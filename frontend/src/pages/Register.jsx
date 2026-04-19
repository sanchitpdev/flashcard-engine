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
