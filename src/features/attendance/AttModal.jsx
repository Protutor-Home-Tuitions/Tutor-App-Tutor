import { useState, useEffect } from 'react'
import { useTutorStore, fd, dateOpts, currentMonthKey } from '../../store/tutorStore'

const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AttModal({ tuition: t, onClose, onSuccess }) {
  const [selDate, setSelDate] = useState(new Date().toISOString().slice(0, 10))
  const [hour,    setHour]    = useState(String(new Date().getHours() % 12 || 12))
  const [minute,  setMinute]  = useState('00')
  const [ampm,    setAmpm]    = useState(new Date().getHours() < 12 ? 'AM' : 'PM')
  const [dur,     setDur]     = useState(String(t.duration || '1'))
  const [subj,    setSubj]    = useState(t.subjects?.[0] || '')
  const [topic,   setTopic]   = useState('')
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const getAttFor     = useTutorStore((s) => s.getAttFor)
  const getCompletion = useTutorStore((s) => s.getCompletion)
  const addAttendance = useTutorStore((s) => s.addAttendance)
  const me            = useTutorStore((s) => s.me)

  const opts  = dateOpts()
  const allAtt = getAttFor(t.enqId)

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  async function submitAtt() {
    setError('')

    if (!selDate) { setError('Please select a class date.'); return }
    if (!subj.trim()) { setError('Subject covered is required.'); return }

    if (!t.active) {
      setError('This class is no longer active. Please contact your coordinator.')
      return
    }

    // Rule: can't mark next month if prev month unsubmitted
    const dateMk    = selDate.slice(0, 7)
    const [dY, dM]  = dateMk.split('-').map(Number)
    const prevMonth = dM === 1 ? `${dY - 1}-12` : `${dY}-${String(dM - 1).padStart(2, '0')}`
    const prevMonthName = MN[parseInt(prevMonth.split('-')[1]) - 1]
    const prevMonthAtt  = allAtt.filter((a) => a.date.startsWith(prevMonth))
    const prevSubmitted = getCompletion(t.enqId, prevMonth)

    if (prevMonthAtt.length > 0 && !prevSubmitted) {
      setError(`⚠️ Submit ${prevMonthName} attendance first\n\nYou have attendance marked in ${prevMonthName} that hasn't been submitted yet. Please submit ${prevMonthName} attendance before marking for ${MN[dM - 1]}.\n\nHow to submit:\n1. Close this form\n2. Scroll to the ${prevMonthName} section\n3. Tap "Submit Attendance — ${prevMonthName}"\n4. Confirm — then come back to mark ${MN[dM - 1]}`)
      return
    }

    // Rule: month already submitted
    if (getCompletion(t.enqId, dateMk)) {
      setError('Attendance for this month has already been submitted and cannot be edited or added.')
      return
    }

    // Rule: one per day
    if (allAtt.find((a) => a.date === selDate)) {
      setError(`Attendance already marked for ${fd(selDate)}. Only one entry per day is allowed.`)
      return
    }

    setSaving(true)
    try {
      const time = `${hour}:${minute} ${ampm}`
      const monthKey = selDate.slice(0, 7)
      const record = {
        date: selDate, time, dur, subj: subj.trim(), topic: topic.trim(),
        monthKey, markedBy: me?.name || 'Tutor',
        byAdmin: false, isDemo: false, parentComment: '',
        tutorId: me?.id || null,
      }
      const saved = await addAttendance(t.enqId, record)
      onSuccess({
        studentName: t.studentName,
        date: selDate, time, dur, subj: subj.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to submit attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay open" onClick={handleOverlayClick}>
      <div className="sheet">
        <div className="handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.studentName}</p>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{t.standard} {t.board}</p>
            <p style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, marginTop: 3 }}>{t.enqId}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2.8" strokeLinecap="round">
              <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ProTip */}
          <div style={{ background: '#FFFBEB', borderRadius: 11, border: '1.5px solid #FDE68A', padding: '11px 13px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 26, height: 26, background: 'var(--yellow)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#78350F" strokeWidth="2.3" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#B45309', letterSpacing: '0.4px', marginBottom: 3 }}>PRO TIP</p>
              <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.55 }}>Wrong or delayed attendance marking can cause payment delays and affect coordination with parents.</p>
            </div>
          </div>

          {/* Date pills */}
          <div className="card">
            <div className="card-head">
              <div className="card-icon" style={{ background: 'var(--blue-light)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Class date <span style={{ color: 'var(--danger)' }}>*</span></span>
            </div>
            <div className="date-pills">
              {opts.map((o) => (
                <button key={o.iso} className={`dpill${selDate === o.iso ? ' sel' : ''}`}
                  onClick={() => setSelDate(o.iso)}>
                  <span>{o.label}</span>
                  <span className="dsub">{o.day} · {o.display}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration */}
          <div className="card">
            <div className="card-head">
              <div className="card-icon" style={{ background: 'var(--yellow-light)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--yellow-dark)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Time & duration <span style={{ color: 'var(--danger)' }}>*</span></span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <p className="fl">Starting time</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px', gap: 7 }}>
                  <select value={hour} onChange={(e) => setHour(e.target.value)}>
                    {['1','2','3','4','5','6','7','8','9','10','11','12'].map((h) => <option key={h}>{h}</option>)}
                  </select>
                  <select value={minute} onChange={(e) => setMinute(e.target.value)}>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <select value={ampm} onChange={(e) => setAmpm(e.target.value)}>
                    <option>AM</option><option>PM</option>
                  </select>
                </div>
              </div>
              <div style={{ width: 100, flexShrink: 0 }}>
                <p className="fl">Duration</p>
                <select value={dur} onChange={(e) => setDur(e.target.value)}>
                  <option value="1">1 hr</option>
                  <option value="1.5">1.5 hr</option>
                  <option value="2">2 hr</option>
                  <option value="2.5">2.5 hr</option>
                  <option value="3">3+ hr</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subject + Topic */}
          <div className="card">
            <div className="card-head">
              <div className="card-icon" style={{ background: '#EDE9FE' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 19V6a2 2 0 012-2h12a2 2 0 012 2v13"/><path d="M4 19h16"/>
                  <path d="M9 10h6"/><path d="M9 14h4"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>What was covered</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p className="fl">Subject covered <span style={{ color: 'var(--danger)' }}>*</span></p>
              <input type="text" value={subj} onChange={(e) => setSubj(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <p className="fl">Topic covered <span style={{ fontSize: 11, color: 'var(--text3)' }}>optional</span></p>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Quadratic equations" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', color: 'var(--danger)', fontSize: 13, padding: '12px 14px', borderRadius: 11, borderLeft: '3px solid var(--danger)', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
              {error}
            </div>
          )}

          <button className="btn" onClick={submitAtt} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting…' : 'Submit attendance →'}
          </button>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  )
}
