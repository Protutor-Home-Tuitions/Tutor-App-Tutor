import { useState } from 'react'
import { useTutorStore } from '../../store/tutorStore'

export default function LoginScreen({ onSuccess }) {
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const login = useTutorStore((s) => s.login)

  async function doLogin() {
    setError('')
    if (!phone.trim()) { setError('Please enter your mobile number.'); return }
    if (!password.trim()) { setError('Please enter your password.'); return }
    setLoading(true)
    try {
      await login(phone.trim(), password.trim())
      onSuccess()
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) { if (e.key === 'Enter') doLogin() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'white' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13"/><path d="M4 19h16"/>
              <path d="M9 10h6"/><path d="M9 14h4"/>
            </svg>
          </div>
          <span className="brand-name">ProTutor</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--blue)', padding: '30px 22px 34px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -28, left: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(251,191,36,0.12)' }} />
        <p style={{ fontSize: 30, fontWeight: 600, color: 'white', marginBottom: 8 }}>Welcome back!</p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)' }}>Sign in to your tutor account</p>
        <div style={{ marginTop: 18, display: 'flex', gap: 6 }}>
          <div style={{ height: 4, width: 36, background: 'var(--yellow)', borderRadius: 2 }} />
          <div style={{ height: 4, width: 16, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
          <div style={{ height: 4, width: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '28px 20px', flex: 1 }}>
        {/* Phone */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, letterSpacing: '0.5px' }}>MOBILE NUMBER</p>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8" strokeLinecap="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
              </svg>
            </div>
            <input
              type="tel" value={phone} maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="10-digit number"
              style={{ paddingLeft: 42 }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, letterSpacing: '0.5px' }}>PASSWORD</p>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <input
              type={showPass ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your password"
              style={{ paddingLeft: 42, paddingRight: 48 }}
            />
            <button
              onClick={() => setShowPass((v) => !v)}
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 26 }}></p>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 14, padding: '12px 15px', borderRadius: 12, marginBottom: 16, borderLeft: '3px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <button className="btn" onClick={doLogin} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </div>
    </div>
  )
}
