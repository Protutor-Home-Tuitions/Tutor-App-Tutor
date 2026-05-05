const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken() {
  try {
    const raw = localStorage.getItem('protutor_tutor_session')
    if (!raw) return null
    const { token, expiry } = JSON.parse(raw)
    if (Date.now() > expiry) return null
    return token
  } catch { return null }
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Tutor login — uses phone + passDigits-derived password
  tutorLogin: (phone, password) =>
    request('POST', '/auth/tutor-login', { phone, password }),

  // Get tuitions assigned to this tutor
  getMyTuitions: () => request('GET', '/tuitions/my'),

  // Get attendance for a tuition
  getAttendance: (enqId) => request('GET', `/attendance/${enqId}`),

  // Submit attendance
  submitAttendance: (data) => request('POST', '/attendance', data),

  // Get att completions for a tuition
  getAttCompletions: (enqId) =>
    request('GET', `/attendance/completions/${enqId}`),

  // Submit month completion
  submitMonthCompletion: (enqId, monthKey) =>
    request('POST', '/attendance/complete', { enqId, monthKey }),
}
