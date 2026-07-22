import { useState, useEffect, useMemo } from 'react'
import { useTutorStore, MN_ARR, getAvatarColors } from '../../store/tutorStore'

const MN_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  return `${dd} ${MN_ARR[d.getMonth()]} ${d.getFullYear()}`
}

function monthLabel(monthKey) {
  if (!monthKey) return ''
  const [y, m] = monthKey.split('-')
  return `${MN_FULL[parseInt(m) - 1]} ${y}`
}

// Derive a tutor-friendly status label + color from Payment fields
function deriveStatus(p) {
  const t = p.transferStatus || ''
  if (t === 'Completed') return { label: 'Paid',       bg: '#DCFCE7', fg: '#166534' }
  if (t === 'Settled')   return { label: 'Settled',    bg: '#DBEAFE', fg: '#1E40AF' }
  if (t === 'Initiated' || t === 'Created') return { label: 'Processing', bg: '#FEF3C7', fg: '#92400E' }
  if (t === 'NA')        return { label: 'N/A',        bg: '#F1F5F9', fg: '#64748B' }
  // No transfer yet
  if (p.paymentStatus === 'Success') return { label: 'Awaiting payout', bg: '#FEF3C7', fg: '#92400E' }
  return { label: 'Awaiting parent payment', bg: '#F1F5F9', fg: '#64748B' }
}

export default function PaymentsScreen({ onBack }) {
  const me                = useTutorStore((s) => s.me)
  const tuitions          = useTutorStore((s) => s.tuitions)
  const payments          = useTutorStore((s) => s.payments)
  const submitBankDetails = useTutorStore((s) => s.submitBankDetails)
  const loadMyPayments    = useTutorStore((s) => s.loadMyPayments)

  // "Locked" if bank was submitted through the app OR seeded by admin
  // (backend synthesises bankSubmittedAt when accountNumber/panNumber exist).
  const bankSubmitted = !!me?.bankSubmittedAt

  // Form state
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [holderName, setHolderName] = useState('')
  const [accNumber,  setAccNumber]  = useState('')
  const [ifsc,       setIfsc]       = useState('')
  const [pan,        setPan]        = useState('')
  const [email,      setEmail]      = useState('')

  const [fieldErrors, setFieldErrors] = useState({})

  // Sorted tuitions — MUST match HomeScreen ordering exactly
  const sortedTuitions = useMemo(() => {
    return [...tuitions].sort((a, b) => {
      const aActive = a.active || a.status === 'idle'
      const bActive = b.active || b.status === 'idle'
      if (aActive !== bActive) return aActive ? -1 : 1
      return (b.start || '').localeCompare(a.start || '')
    })
  }, [tuitions])

  // Selected student for payout history
  const [selEnqId, setSelEnqId] = useState(null)

  // Load payments on mount — DISABLED while payout history shows "Coming soon"
  // Uncomment when enabling the full payout history card below.
  // useEffect(() => {
  //   setPaymentsLoading(true)
  //   loadMyPayments()
  //     .catch(() => {})
  //     .finally(() => setPaymentsLoading(false))
  // }, [])

  // Pick first sorted tuition as default selection once tuitions arrive
  useEffect(() => {
    if (!selEnqId && sortedTuitions.length) {
      setSelEnqId(sortedTuitions[0].enqId)
    }
  }, [sortedTuitions, selEnqId])

  const studentPayments = useMemo(() => {
    return payments
      .filter((p) => p.enqId === selEnqId)
      .sort((a, b) => (b.monthKey || '').localeCompare(a.monthKey || ''))
  }, [payments, selEnqId])

  function validate() {
    const errs = {}
    if (!holderName.trim()) errs.holderName = 'Required'
    else if (!/^[A-Za-z\s]+$/.test(holderName.trim()))
      errs.holderName = 'Letters and spaces only'

    if (!accNumber.trim()) errs.accNumber = 'Required'
    else if (!/^\d{9,18}$/.test(accNumber.trim()))
      errs.accNumber = '9–18 digits required'

    if (!ifsc.trim()) errs.ifsc = 'Required'
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase()))
      errs.ifsc = 'Invalid format (e.g. HDFC0001234)'

    if (!pan.trim()) errs.pan = 'Required'
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase()))
      errs.pan = 'Invalid format (e.g. ABCDE1234F)'

    if (!email.trim()) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Invalid email'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    setError('')
    try {
      await submitBankDetails({
        accountHolderName: holderName.trim(),
        accountNumber:     accNumber.trim(),
        ifscCode:          ifsc.trim().toUpperCase(),
        panNumber:         pan.trim().toUpperCase(),
        email:             email.trim().toLowerCase(),
      })
      setSuccess(true)
      setShowForm(false)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--off)' }}>
      {/* Header */}
      <div className="topbar">
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <p style={{ fontSize: 17, fontWeight: 600, color: 'white', margin: '0 0 0 12px', flex: 1 }}>Payments</p>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        {/* Success toast */}
        {success && (
          <div style={{ background: '#DCFCE7', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>
              Bank details submitted successfully
            </p>
          </div>
        )}

        {/* Bank Details card */}
        <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#E6F1FB', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth="2" strokeLinecap="round">
                <path d="M3 21h18"/><path d="M3 10h18"/>
                <path d="M5 6l7-3 7 3"/>
                <path d="M4 10v11"/><path d="M20 10v11"/>
                <path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/>
              </svg>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0C447C', margin: 0 }}>Bank details</p>
            </div>
            {bankSubmitted && (
              <span style={{ fontSize: 11, color: '#0C447C', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Locked
              </span>
            )}
          </div>

          {bankSubmitted ? (
            <>
              <DetailRow label="Account holder" value={me?.accountHolderName || '—'} />
              <DetailRow label="Account number" value={me?.accountNumber || '—'} mono />
              <DetailRow label="IFSC" value={me?.ifscCode || '—'} mono />
              <DetailRow label="PAN" value={me?.panNumber || '—'} mono />
              <DetailRow label="Email" value={me?.email || '—'} />
              <DetailRow label="Submitted" value={formatDate(me?.bankSubmittedAt)} last />

              <div style={{ margin: 14, padding: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                  Bank details cannot be changed after submission. To update, contact <strong>contact@protutor.in</strong>.
                </p>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <p style={{ fontSize: 13, color: '#64748B', margin: '10px 0 14px' }}>No bank details added yet</p>
              <button onClick={() => setShowForm(true)}
                style={{ background: '#185FA5', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add bank details
              </button>
            </div>
          )}
        </div>

        {/* Payout History card — Coming Soon (code retained, rendering deferred) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ background: '#E6F1FB', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0C447C', margin: 0 }}>Payout history</p>
          </div>
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 10px' }}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Coming soon</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
              Your monthly payout details will appear here.
            </p>
          </div>
        </div>

        {/* ── PAYOUT HISTORY (full implementation — hidden for now, enable later) ──
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ background: '#E6F1FB', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0C447C', margin: 0 }}>Payout history</p>
          </div>

          {sortedTuitions.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 12px', margin: 0 }}>
              No students assigned yet.
            </p>
          ) : (
            <>
              <div style={{ padding: '10px 12px', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid #F1F5F9', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {sortedTuitions.map((t, i) => {
                  const { bg, text } = getAvatarColors(i)
                  const active = t.enqId === selEnqId
                  const dimmed = !t.active && t.status !== 'idle'
                  return (
                    <button key={t.id}
                      onClick={() => setSelEnqId(t.enqId)}
                      style={{
                        background: active ? '#1A56DB' : 'white',
                        color:      active ? 'white'   : '#475569',
                        border:     active ? 'none'    : '1px solid #E2E8F0',
                        borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 500,
                        fontFamily: 'inherit', whiteSpace: 'nowrap', cursor: 'pointer',
                        opacity: dimmed ? 0.55 : 1,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.25)' : bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: active ? 'white' : text }}>
                        {t.studentName?.[0] || '?'}
                      </span>
                      {t.studentName?.split(' ')[0]}
                      {dimmed && <span style={{ fontSize: 9, opacity: 0.6 }}>✕</span>}
                    </button>
                  )
                })}
              </div>

              {paymentsLoading ? (
                <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 12px', margin: 0 }}>
                  Loading payouts…
                </p>
              ) : studentPayments.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '8px 0 0' }}>No payouts yet</p>
                </div>
              ) : (
                studentPayments.map((p) => <PaymentRow key={p.id} p={p} />)
              )}

              {studentPayments.length > 0 && (
                <div style={{ margin: 12, padding: 10, background: '#E6F1FB', borderRadius: 8, display: 'flex', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C447C" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                  <p style={{ fontSize: 11, color: '#0C447C', margin: 0, lineHeight: 1.5 }}>
                    Payments appear under the name "Razorpay". Allow 1–2 working days after transfer. Match UTR for confirmation.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        ── END PAYOUT HISTORY (hidden) ── */}
      </div>

      {/* Bottom-sheet form */}
      {showForm && (
        <div onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '8px 0 20px' }}>
            <div style={{ width: 40, height: 4, background: '#CBD5E1', borderRadius: 2, margin: '4px auto 12px' }} />
            <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Add bank details</p>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '14px 16px 0' }}>
              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#991B1B', margin: 0 }}>{error}</p>
                </div>
              )}

              <FormField label="Account holder name" required value={holderName} onChange={setHolderName}
                placeholder="As per bank records" error={fieldErrors.holderName} />

              <FormField label="Account number" required value={accNumber}
                onChange={(v) => setAccNumber(v.replace(/\D/g, '').slice(0, 18))}
                placeholder="9–18 digits" inputMode="numeric" error={fieldErrors.accNumber} />

              <FormField label="IFSC code" required value={ifsc}
                onChange={(v) => setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                placeholder="HDFC0001234" autoCapitalize="characters" error={fieldErrors.ifsc} />

              <FormField label="PAN number" required value={pan}
                onChange={(v) => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                placeholder="ABCDE1234F" autoCapitalize="characters" error={fieldErrors.pan} />

              <FormField label="Email" required value={email} onChange={setEmail}
                placeholder="tutor@email.com" type="email" error={fieldErrors.email} />

              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 12px', marginTop: 4, marginBottom: 16, display: 'flex', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                  Bank details cannot be changed after submission. Contact <strong>contact@protutor.in</strong> to update.
                </p>
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                style={{ width: '100%', padding: 14, background: submitting ? '#93C5FD' : '#1A56DB', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? 'Submitting…' : 'Submit bank details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Payment row ──
function PaymentRow({ p }) {
  const feeTutor    = p.billing?.snapAmountT ?? p.transferAmtOriginal ?? 0
  const transferAmt = p.transferAmt ?? 0
  // "Deducted" only makes sense once a transfer actually happened (transferAmt > 0)
  // AND the transferred amount was less than the tutor's fee — the difference is
  // what was held back. Before transfer, showing "deducted" would be misleading.
  const hasTransfer = transferAmt > 0 || !!p.transferStatus
  const deducted    = hasTransfer && feeTutor > transferAmt ? feeTutor - transferAmt : 0
  const status      = deriveStatus(p)

  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{monthLabel(p.monthKey)}</p>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: status.bg, color: status.fg, fontWeight: 600 }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        {feeTutor > 0 && (
          <Line label="Fee to tutor" value={`₹${Number(feeTutor).toLocaleString('en-IN')}`} />
        )}
        {deducted > 0 && (
          <Line label="Deducted" value={`−₹${Number(deducted).toLocaleString('en-IN')}`} valueColor="#A32D2D" />
        )}
        {transferAmt > 0 && (
          <Line label="Transfer amount" value={`₹${Number(transferAmt).toLocaleString('en-IN')}`} bold />
        )}
        {p.utr && <Line label="UTR" value={p.utr} mono />}
        {p.transferCreatedAt && <Line label="Transferred" value={formatDate(p.transferCreatedAt)} />}
      </div>
    </div>
  )
}

function Line({ label, value, valueColor, mono, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{
        color: valueColor || '#1E293B',
        fontWeight: bold ? 700 : 500,
        fontFamily: mono ? 'monospace' : 'inherit',
        fontSize: mono ? 11 : 12,
      }}>{value}</span>
    </div>
  )
}

// ── Detail row for the bank card ──
function DetailRow({ label, value, mono, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderBottom: last ? 'none' : '1px solid #F1F5F9',
    }}>
      <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  )
}

// ── Reusable form field ──
function FormField({ label, required, value, onChange, placeholder, type, inputMode, autoCapitalize, error }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <input
        type={type || 'text'}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px',
          border: `1.5px solid ${error ? '#FECACA' : '#E2E8F0'}`,
          borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1E293B',
          background: error ? '#FEF2F2' : '#F8FAFC', outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = error ? '#F87171' : '#1A56DB'; e.target.style.background = 'white' }}
        onBlur={(e)  => { e.target.style.borderColor = error ? '#FECACA' : '#E2E8F0'; e.target.style.background = error ? '#FEF2F2' : '#F8FAFC' }}
      />
      {error && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0 2px' }}>{error}</p>}
    </div>
  )
}
