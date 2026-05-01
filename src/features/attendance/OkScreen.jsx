import { fd } from '../../store/tutorStore'

export default function OkScreen({ data, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--off)' }}>
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

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px', textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        </div>

        <div style={{ width: 40, height: 4, background: 'var(--yellow)', borderRadius: 2, marginBottom: 20 }} />
        <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>All done!</p>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
          Attendance recorded for <strong>{data?.studentName}</strong> on {fd(data?.date)}.
        </p>

        {/* Summary card */}
        <div className="card" style={{ width: '100%', textAlign: 'left', marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, fontWeight: 600, letterSpacing: '0.5px' }}>CLASS SUMMARY</p>

          {[
            ['Student', data?.studentName],
            ['Date',    fd(data?.date)],
            ['Time',    data?.time],
            ['Duration', `${data?.dur}hr`],
            ['Subject',  data?.subj],
          ].map(([label, value], i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
              paddingBottom: i < arr.length - 1 ? 9 : 0,
              marginBottom: i < arr.length - 1 ? 9 : 0,
            }}>
              <span style={{ color: 'var(--text3)', fontSize: 14 }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: label === 'Subject' ? '#1A56DB' : 'var(--text)' }}>{value}</span>
            </div>
          ))}
        </div>

        <button className="btn" onClick={onBack}>Back to students</button>
      </div>
    </div>
  )
}
