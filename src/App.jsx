import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useTutorStore } from './store/tutorStore'
import LoginScreen from './features/auth/LoginScreen'
import HomeScreen from './features/home/HomeScreen'
import OkScreen from './features/attendance/OkScreen'

export default function App() {
  const [screen, setScreen] = useState('login') // login | home | ok
  const [okData, setOkData] = useState(null)
  const restoreSession = useTutorStore((s) => s.restoreSession)
  const me = useTutorStore((s) => s.me)

  // Restore session on mount
  useEffect(() => {
    restoreSession().then((restored) => {
      if (restored) setScreen('home')
    })
  }, [])

  function goHome() { setScreen('home') }
  function goOk(data) { setOkData(data); setScreen('ok') }
  function goLogin() { setScreen('login') }

  if (screen === 'login') return (
    <>
      <LoginScreen onSuccess={goHome} />
      <Analytics />
    </>
  )
  if (screen === 'ok')    return (
    <>
      <OkScreen data={okData} onBack={goHome} />
      <Analytics />
    </>
  )
  return (
    <>
      <HomeScreen onLogout={goLogin} onAttSuccess={goOk} />
      <Analytics />
    </>
  )
}
