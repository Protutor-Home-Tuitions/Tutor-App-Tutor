import { useState, useEffect } from 'react'
import { useTutorStore } from './store/tutorStore'
import LoginScreen from './features/auth/LoginScreen'
import HomeScreen from './features/home/HomeScreen'
import OkScreen from './features/attendance/OkScreen'

const SPLASH_LINES = [
  'Empowering tutors, shaping futures',
  'Only the best get selected. You\'re one of them.',
  'Your skill. Their future. Our mission.',
]

export default function App() {
  const [screen, setScreen] = useState('loading') // loading | login | home | ok
  const [okData, setOkData] = useState(null)
  const [splashLine] = useState(() => SPLASH_LINES[Math.floor(Math.random() * SPLASH_LINES.length)])
  const restoreSession = useTutorStore((s) => s.restoreSession)
  const me = useTutorStore((s) => s.me)

  // Restore session on mount
  useEffect(() => {
    restoreSession()
      .then((restored) => { setScreen(restored ? 'home' : 'login') })
      .catch(() => { setScreen('login') })
  }, [])

  function goHome() { setScreen('home') }
  function goOk(data) { setOkData(data); setScreen('ok') }
  function goLogin() { setScreen('login') }

  if (screen === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1A56DB' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13"/><path d="M4 19h16"/>
            <path d="M9 10h6"/><path d="M9 14h4"/>
          </svg>
        </div>
        <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>ProTutor</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '0 0 20px', fontStyle: 'italic' }}>{splashLine}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <span className="dot d1" /><span className="dot d2" /><span className="dot d3" />
        </div>
        <style>{`
          .dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.5); display:inline-block; animation:bounce 1.2s infinite ease-in-out }
          .d1 { animation-delay:0s } .d2 { animation-delay:0.2s } .d3 { animation-delay:0.4s }
          @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        `}</style>
      </div>
    </div>
  )

  if (screen === 'login') return <LoginScreen onSuccess={goHome} />
  if (screen === 'ok')    return <OkScreen data={okData} onBack={goHome} />
  return <HomeScreen onLogout={goLogin} onAttSuccess={goOk} />
}
