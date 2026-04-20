import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Spinner from '../components/Spinner'

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth }  = useAuthStore()
  const navigate     = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      setAuth(res.data.accessToken, { email: form.email })
      navigate('/decks')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div className="animate-in" style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        padding: 'clamp(28px,5vw,48px) clamp(20px,5vw,40px)',
        width: '100%', maxWidth: 420,
        boxShadow: '0 8px 48px rgba(26,43,74,0.13)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--navy)', borderRadius: 14,
            width: 56, height: 56, marginBottom: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: '1rem', letterSpacing: '0.04em', color: 'white',
            }}>CM</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Sign in to continue learning</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--primary-light)', color: '#9A6600',
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem', fontWeight: 600, marginBottom: 18,
            border: '1px solid #F5A62345',
          }}>{error}</div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'email',    type: 'email',    label: 'Email address', placeholder: 'you@example.com' },
            { key: 'password', type: 'password', label: 'Password',      placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:'block', fontWeight:700, marginBottom:5, fontSize:'0.83rem', color:'var(--text-sub)' }}>
                {f.label}
              </label>
              <input
                type={f.type} value={form[f.key]} required placeholder={f.placeholder}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={{
                  width:'100%', padding:'11px 14px',
                  border:'2px solid var(--border)', borderRadius:'var(--radius-sm)',
                  fontSize:'0.95rem', outline:'none', background:'#FAFBFC',
                  transition:'border-color 0.18s',
                }}
                onFocus={e => e.target.style.borderColor='var(--primary)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width:'100%', justifyContent:'center', marginTop:6, padding:'13px' }}>
            {loading ? <Spinner size={18} color="var(--navy)" /> : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:'0.9rem', color:'var(--text-sub)' }}>
          New here?{' '}
          <Link to="/register" style={{ color:'var(--primary-dark)', fontWeight:700 }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
