'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isPending) return <div className="auth-shell"><div className="spinner" /></div>
  if (session) {
    if (typeof window !== 'undefined') window.location.href = '/schedule'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = mode === 'signup'
        ? await authClient.signUp.email({ email, password, name: email.split('@')[0] })
        : await authClient.signIn.email({ email, password })
      if (result.error) setError(result.error.message || 'Something went wrong')
      else window.location.href = '/schedule'
    } catch (err) {
      setError(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">Yoga Schedule</div>
        <div className="auth-subtitle">Find your flow. Book your class.</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <div style={{ background: 'var(--error)', color: 'white', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          {mode === 'login' ? <>New here? <button className="btn btn-ghost btn-sm" onClick={() => {setMode('signup');setError('')}}>Sign up</button></>
            : <>Have an account? <button className="btn btn-ghost btn-sm" onClick={() => {setMode('login');setError('')}}>Sign in</button></>}
        </p>
      </div>
    </div>
  )
}
