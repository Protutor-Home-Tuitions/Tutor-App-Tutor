import { useState, useEffect } from 'react'
import { useTutorStore, fd, MN_ARR, currentMonthKey, isMonthCompletionEnabled, getAvatarColors, getRandomMotive, calcTutorAmount } from '../../store/tutorStore'
import AttModal from '../attendance/AttModal'

const MN_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function HomeScreen({ onLogout, onAttSuccess }) {
  const [selId,      setSelId]      = useState(null)
  const [activeMonth, setActiveMonth] = useState('all')
  const [attOpen,    setAttOpen]    = useState(false)
  const [confirmMonthKey, setConfirmMonthKey] = useState(null)
  const [toastMsg,   setToastMsg]   = useState('')

  const me            = useTutorStore((s) => s.me)
  const tuitions      = useTutorStore((s) => s.tuitions)
  const getAttFor     = useTutorStore((s) => s.getAttFor)
  const getCompletion = useTutorStore((s) => s.getCompletion)
  const completeMonth = useTutorStore((s) => s.completeMonth)
  const refresh       = useTutorStore((s) => s.refresh)
  const logout        = useTutorStore((s) => s.logout)

  const motive = getRandomMotive()

  // Refresh from DB when tab becomes visible again (handles deactivation, new data)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Sorted tuitions — active first (by recent startDate), inactive after
  const myTuitions = [...tuitions].sort((a, b) => {
    const aActive = a.active || a.status === 'idle'
    const bActive = b.active || b.status === 'idle'
    if (aActive !== bActive) return aActive ? -1 : 1
    return (b.start || '').localeCompare(a.start || '')
  })

  const selTuition = myTuitions.find((t) => t.id === selId) || null
  const selEnqId   = selTuition?.enqId

  // Greeting
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,'

  function handleLogout() { logout(); onLogout() }

  function showToast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  async function handleCompleteMonth(tuitionId, enqId, monthKey) {
    try {
      await completeMonth(enqId, monthKey)
      setConfirmMonthKey(null)
      showToast('✓ Attendance Submitted Successfully')
    } catch (err) {
      alert('Failed: ' + err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 22, padding: '7px 16px', fontSize: 13, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Blue header */}
      <div style={{ background: 'var(--blue)', padding: '14px 16px 0' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)' }}>{greet}</p>
        <p style={{ fontSize: 22, fontWeight: 600, color: 'white', marginTop: 2, marginBottom: 12 }}>{me?.name}</p>

        {/* Motive banner */}
        <div style={{ marginBottom: 13 }}>
          <div style={{ background: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--yellow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#78350F" strokeWidth="2.3" strokeLinecap="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, fontStyle: 'italic' }}>{motive}</p>
          </div>
        </div>

        {/* Student tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px' }}>MY STUDENTS</p>
          <span style={{ fontSize: 11, background: 'var(--yellow)', color: '#78350F', padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>
            {myTuitions.length} students
          </span>
        </div>
        <div className="stabs-row">
          {myTuitions.map((t, i) => {
            const { bg, text } = getAvatarColors(i)
            return (
              <button key={t.id}
                className={`stab${selId === t.id ? ' sel' : ''}${(!t.active && t.status !== 'idle') ? ' dimmed' : ''}`}
                onClick={() => { setSelId(t.id); setActiveMonth('all') }}
              >
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: text }}>
                  {t.studentName?.[0] || '?'}
                </span>
                {t.studentName?.split(' ')[0]}
                {(!t.active && t.status !== 'idle') && <span style={{ fontSize: 10, opacity: 0.55 }}>✕</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16, flex: 1 }}>
        {/* Toast */}
        {toastMsg && (
          <div style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#15803D' }}>Attendance Submitted Successfully</p>
              <p style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Admin has been notified to generate billing. Attendance cannot be edited.</p>
            </div>
          </div>
        )}

        {!selTuition ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 68, height: 68, borderRadius: 22, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.6" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Select a student</p>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>Tap a name above to view details</p>
          </div>
        ) : (
          <StudentDetail
            tuition={selTuition}
            activeMonth={activeMonth}
            setActiveMonth={setActiveMonth}
            onMarkAtt={() => setAttOpen(true)}
            confirmMonthKey={confirmMonthKey}
            setConfirmMonthKey={setConfirmMonthKey}
            onConfirmSubmit={handleCompleteMonth}
          />
        )}
      </div>

      {/* Attendance modal */}
      {attOpen && selTuition && (
        <AttModal
          tuition={selTuition}
          onClose={() => setAttOpen(false)}
          onSuccess={(data) => { setAttOpen(false); onAttSuccess(data) }}
        />
      )}
    </div>
  )
}

// ── Student Detail Card ──
function StudentDetail({ tuition: t, activeMonth, setActiveMonth, onMarkAtt, confirmMonthKey, setConfirmMonthKey, onConfirmSubmit }) {
  const getAttFor     = useTutorStore((s) => s.getAttFor)
  const getCompletion = useTutorStore((s) => s.getCompletion)

  const allAtt = getAttFor(t.enqId).sort((a, b) => b.date.localeCompare(a.date))
  const nowKey = currentMonthKey()
  const nowDate = new Date()

  // ── Pending submission logic ──
  // Find oldest month that has attendance + not submitted + window open
  const pendingMonth = (() => {
    const monthsWithAtt = new Set()
    allAtt.forEach(a => {
      if (!a.isDemo) monthsWithAtt.add(a.date.substring(0, 7))
    })
    const sorted = [...monthsWithAtt].sort()
    for (const mk of sorted) {
      if (!getCompletion(t.enqId, mk) && isMonthCompletionEnabled(mk)) {
        return mk
      }
    }
    return null
  })()

  const pendingMonthLabel = pendingMonth
    ? MN_FULL[parseInt(pendingMonth.split('-')[1]) - 1]
    : null

  // Current month submitted?
  const currentMonthSubmitted = getCompletion(t.enqId, nowKey)

  // Block marking if:
  // 1. Pending month exists AND current month is AFTER it (must submit old first)
  // 2. Current month is already submitted (can't add to submitted month)
  const isBlockedForFutureMonth = pendingMonth && nowKey > pendingMonth
  const markBlocked = isBlockedForFutureMonth || !!currentMonthSubmitted

  // ── Current month earnings ──
  const currentMonthAtt = allAtt.filter(a => !a.isDemo && a.date.startsWith(nowKey))
  const currentMonthEarning = calcTutorAmount(t, nowKey, currentMonthAtt)
  const currentMonthName = MN_FULL[nowDate.getMonth()]

  // ── Build month list ──
  const mm = new Map()
  allAtt.forEach((a) => {
    const [y, mo] = a.date.split('-')
    const k = `${y}-${mo}`
    if (!mm.has(k)) mm.set(k, MN_FULL[parseInt(mo) - 1] + ' ' + y)
  })
  if (!mm.has(nowKey)) mm.set(nowKey, MN_FULL[nowDate.getMonth()] + ' ' + nowDate.getFullYear())
  const months = [['all', 'Recent'], ...[...mm.entries()].sort((a, b) => b[0].localeCompare(a[0]))]

  const fil = activeMonth === 'all' ? allAtt : allAtt.filter((a) => a.date.startsWith(activeMonth))

  const tuitionStatus = t.status || (t.active ? 'active' : 'inactive')
  const statusBadge = tuitionStatus === 'active'
    ? <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>Active</span>
    : tuitionStatus === 'idle'
    ? <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>⏸ Idle</span>
    : <span style={{ fontSize: 11, background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>Inactive</span>

  return (
    <>
      {/* Info card */}
      <div className="card" style={{ marginBottom: 12 }}>
        {/* Student header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {t.studentName?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.studentName}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', margin: '2px 0 0' }}>Parent: {t.parentName || '—'}</p>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              {t.standard} {t.board} · <span style={{ color: '#1A56DB', fontWeight: 600 }}>{t.enqId}</span>
            </p>
          </div>
          {statusBadge}
        </div>

        {/* Info grid */}
        <div className="info2" style={{ marginBottom: 9 }}>
          <div className="icell" style={{ background: '#EBF1FF' }}>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Demo class</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A56DB' }}>{fd(t.demo)}</p>
          </div>
          <div className="icell" style={{ background: '#FFFBEB' }}>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Start date</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#D97706' }}>{fd(t.start)}</p>
          </div>
          <div className="icell" style={{ background: '#F0FDF4' }}>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Schedule</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>{t.days?.join(', ')}</p>
          </div>
          <div className="icell" style={{ background: '#EDE9FE' }}>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Hrs / day</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED' }}>{t.duration} hr</p>
          </div>
        </div>

        {/* Fee — uses tutorFeeType with fallback */}
        <div className="icell" style={{ background: '#FDF4FF', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Fee</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#9333EA' }}>₹{t.feeTutor} / {t.tutorFeeType || t.feeType}</p>
        </div>

        {/* Subjects */}
        <div style={{ background: '#F7F9FF', borderRadius: 10, padding: '11px 13px', marginBottom: 14, borderLeft: '3px solid #1A56DB' }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.3px' }}>SUBJECTS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {t.subjects?.map((s) => (
              <span key={s} style={{ fontSize: 13, background: '#EBF1FF', color: '#1E40AF', padding: '4px 12px', borderRadius: 9 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* ── Mark Attendance / Block / Inactive section ── */}
        {(t.active || t.status === 'idle') ? (
          markBlocked ? (
            isBlockedForFutureMonth ? (
              // Blocked — must submit old month first
              <div style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>Submit {pendingMonthLabel} attendance first</p>
                  <p style={{ fontSize: 12, color: '#A16207', marginTop: 2 }}>Submit {pendingMonthLabel} to mark new classes</p>
                </div>
              </div>
            ) : (
              // Blocked — current month already submitted
              <div style={{ background: '#FEF9C3', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>{currentMonthName} attendance submitted</p>
                  <p style={{ fontSize: 12, color: '#A16207', marginTop: 2 }}>No further attendance can be marked for {currentMonthName}</p>
                </div>
              </div>
            )
          ) : (
            // Mark attendance enabled
            <button onClick={onMarkAtt}
              style={{ width: '100%', padding: 14, background: '#1A56DB', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Mark attendance
            </button>
          )
        ) : (
          // Inactive tuition
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #FECACA', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#B91C1C', marginBottom: 5 }}>🚫 Class Stopped / Over</p>
            <p style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.6 }}>Attendance cannot be marked.<br />Please contact your coordinator.</p>
          </div>
        )}

        {/* ── Submit Attendance section ── */}
        <div style={{ marginTop: 10 }}>
          {pendingMonth ? (
            <>
              {/* Submit button */}
              <button
                onClick={() => setConfirmMonthKey(confirmMonthKey === pendingMonth ? null : pendingMonth)}
                style={{ width: '100%', padding: 13, background: '#0369A1', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                Submit Attendance — {pendingMonthLabel}
              </button>
              {/* Confirm panel */}
              {confirmMonthKey === pendingMonth && (
                <ConfirmPanel
                  tuition={t}
                  monthKey={pendingMonth}
                  monthLabel={pendingMonthLabel}
                  allAtt={allAtt}
                  onCancel={() => setConfirmMonthKey(null)}
                  onConfirm={() => onConfirmSubmit(t.id, t.enqId, pendingMonth)}
                />
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Attendance history card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Attendance history</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Monthly earning — always current month */}
            {currentMonthEarning !== null && currentMonthEarning > 0 && (
              <div style={{ border: '1.5px solid #D1FAE5', borderRadius: 8, padding: '4px 10px', background: '#F0FDF4' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>
                  {currentMonthName} earnings — ₹{currentMonthEarning.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            <span style={{
              fontSize: 13, padding: '4px 11px', borderRadius: 9, fontWeight: 600,
              background: activeMonth === 'all' ? '#F1F5F9' : '#1A56DB',
              color: activeMonth === 'all' ? '#64748B' : 'white',
            }}>
              {fil.length} classes
            </span>
          </div>
        </div>

        {/* Month pills — full month name + full year */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {months.map(([k, l]) => (
            <button key={k} className={`mpill${activeMonth === k ? ' sel' : ''}`} onClick={() => setActiveMonth(k)}>
              {l}
            </button>
          ))}
        </div>

        {/* Attendance rows */}
        {fil.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No classes this period.</p>
        ) : (
          fil.map((a, i) => (
            <div key={a.id} className="arow">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 36 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EBF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M9 11l3 3L22 4"/>
                  </svg>
                </div>
                {i < fil.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 8, background: '#EBF1FF', borderRadius: 1 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fd(a.date)}</span>
                  <span style={{ fontSize: 12, background: '#EBF1FF', color: '#1E40AF', padding: '3px 9px', borderRadius: 8 }}>{a.dur}hr · {a.time}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, background: '#1A56DB', color: 'white', padding: '3px 10px', borderRadius: 8 }}>{a.subj}</span>
                  {a.topic && <span style={{ fontSize: 12, background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 8 }}>{a.topic}</span>}
                </div>
                {a.parentComment && (
                  <div style={{ marginTop: 7, background: '#FFF7ED', borderLeft: '3px solid #FCD34D', borderRadius: '0 8px 8px 0', padding: '7px 10px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#92400E', letterSpacing: '0.4px', margin: '0 0 2px', textTransform: 'uppercase' }}>Parent Comment</p>
                    <p style={{ fontSize: 12, color: '#78350F', margin: 0, lineHeight: 1.5 }}>{a.parentComment}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function ConfirmPanel({ tuition, monthKey, monthLabel, allAtt, onCancel, onConfirm }) {
  const monthAtt   = allAtt.filter((a) => a.date.startsWith(monthKey))
  const classes    = monthAtt.length
  const totalHours = monthAtt.reduce((s, a) => s + parseFloat(a.dur || 0), 0)
  const hoursDisplay = totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)

  return (
    <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
      <p style={{ fontSize: 13, color: '#1E40AF', margin: '0 0 6px' }}>
        <strong>{monthLabel}</strong> &nbsp;·&nbsp;
        <span style={{ color: '#0369A1', fontWeight: 700 }}>{classes} class{classes !== 1 ? 'es' : ''}</span> &nbsp;·&nbsp;
        <span style={{ color: '#7C3AED', fontWeight: 700 }}>{hoursDisplay} hrs</span>
      </p>
      <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 10px' }}>Once submitted, attendance cannot be edited or added.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: 10, borderRadius: 9, background: 'white', border: '1.5px solid #CBD5E1', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          style={{ flex: 1, padding: 10, borderRadius: 9, background: '#0369A1', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Confirm Submit
        </button>
      </div>
    </div>
  )
}
