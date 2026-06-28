import { create } from 'zustand'
import { api } from '../lib/api'

const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Session persistence using localStorage with 15-day expiry ──
const SESSION_KEY   = 'protutor_tutor_session'
const SESSION_DAYS  = 15

function saveSession(token, phone) {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, phone, expiry }))
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { token, phone, expiry } = JSON.parse(raw)
    if (Date.now() > expiry) { localStorage.removeItem(SESSION_KEY); return null }
    return { token, phone }
  } catch { return null }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export const useTutorStore = create((set, get) => ({
  // ── Auth ──
  me: null,
  token: null,

  // ── Data ──
  tuitions: [],
  attendance: {},   // { [enqId]: [...records] }
  completions: {},  // { "enqId_monthKey": { ... } }

  loading: false,
  error: null,

  // ── Login ──
  login: async (phone, password) => {
    set({ loading: true, error: null })
    try {
      const { token, tutor } = await api.tutorLogin(phone, password)
      saveSession(token, phone)
      set({ me: tutor, token, loading: false })
      await get().bootstrap()
      return tutor
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // ── Restore session (persists across page close/refresh for 15 days) ──
  restoreSession: async () => {
    const session = loadSession()
    if (!session) return false
    set({ token: session.token })
    try {
      await get().bootstrap()
      return true
    } catch {
      clearSession()
      set({ token: null })
      return false
    }
  },

  // ── Bootstrap — always fetch fresh from DB ──
  bootstrap: async () => {
    set({ loading: true })
    try {
      const tuitions = await api.getMyTuitions()
      set({ tuitions, loading: false })
      // Always load fresh attendance from DB (not cache)
      await Promise.all(tuitions.map((t) => get().loadTuitionData(t.enqId)))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // ── Load attendance + completions for one tuition — always from DB ──
  loadTuitionData: async (enqId) => {
    try {
      const [attRows, completionRows] = await Promise.all([
        api.getAttendance(enqId),
        api.getAttCompletions(enqId).catch(() => []),
      ])
      const compMap = {}
      completionRows.forEach((c) => {
        compMap[`${c.enqId}_${c.monthKey}`] = c
      })
      set((s) => ({
        attendance: { ...s.attendance, [enqId]: attRows },
        completions: { ...s.completions, ...compMap },
      }))
    } catch {
      // Silently fail — don't log sensitive data
    }
  },

  // ── Submit attendance — verify no duplicate in DB before saving ──
  addAttendance: async (enqId, record) => {
    // Refresh attendance from DB first to get latest state
    await get().loadTuitionData(enqId)

    // Check for duplicate in the freshly loaded data
    const current = get().attendance[enqId] || []
    if (current.find((a) => a.date === record.date)) {
      throw new Error(`Attendance already marked for ${record.date}. Only one entry per day is allowed.`)
    }

    const row = await api.submitAttendance({ ...record, enqId })

    // Refresh from DB after save to ensure consistency
    await get().loadTuitionData(enqId)

    return row
  },

  // ── Submit month completion ──
  completeMonth: async (enqId, monthKey) => {
    await api.submitMonthCompletion(enqId, monthKey)
    // Refresh from DB to get accurate state
    await get().loadTuitionData(enqId)
  },

  // ── Full refresh — pull everything fresh from DB ──
  refresh: async () => {
    const { tuitions } = get()
    if (!tuitions.length) return
    await Promise.all(tuitions.map((t) => get().loadTuitionData(t.enqId)))
  },

  // ── Logout ──
  logout: () => {
    clearSession()
    set({ me: null, token: null, tuitions: [], attendance: {}, completions: {} })
  },

  // ── Helpers ──
  getAttFor: (enqId) => get().attendance[enqId] || [],
  getCompletion: (enqId, monthKey) => get().completions[`${enqId}_${monthKey}`] || null,
}))

// ── Date helpers ──
export function fd(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${String(y).slice(2)}`
}

export const MN_ARR = MN
export const DN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function isMonthCompletionEnabled(monthKey) {
  if (!monthKey) return false
  const [y, m] = monthKey.split('-').map(Number)
  const now = new Date()
  const monthPassed = (now.getFullYear() > y) || (now.getFullYear() === y && now.getMonth() > m - 1)
  if (monthPassed) return true
  const lastDay = new Date(y, m, 0)
  const isLastDay = now.getFullYear() === lastDay.getFullYear() &&
    now.getMonth() === lastDay.getMonth() &&
    now.getDate() === lastDay.getDate()
  return isLastDay && now.getHours() >= 20
}

export function dateOpts() {
  const opts = []
  const today = new Date()
  ;[['Today', 0], ['Yesterday', 1], ['Day before', 2]].forEach(([lbl, off]) => {
    const d = new Date(today)
    d.setDate(today.getDate() - off)
    const iso = d.toISOString().slice(0, 10)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    opts.push({ iso, label: lbl, display: `${dd}/${mm}/${yy}`, day: DN[d.getDay()] })
  })
  return opts
}

const ABGS  = ['#FEF3C7','#DBEAFE','#FCE7F3','#D1FAE5','#EDE9FE','#FEE2E2']
const ATXTS = ['#92400E','#1E40AF','#9D174D','#065F46','#5B21B6','#B91C1C']
export function getAvatarColors(index) {
  return { bg: ABGS[index % 6], text: ATXTS[index % 6] }
}

const MOTIVES = [
  "Every class you teach changes a life. Keep going!",
  "Your patience today builds tomorrow's leaders.",
  "Great teachers leave footprints on hearts forever.",
  "You're not just teaching — you're building futures.",
  "Small moments of teaching create lifelong learnings.",
]
export function getRandomMotive() {
  return MOTIVES[Math.floor(Math.random() * MOTIVES.length)]
}

// ─────────────────────────────────────────────────────────────
// FEE CALCULATION — exact copy from admin helpers.js
// ─────────────────────────────────────────────────────────────

export function countScheduledDaysInMonth(year, month, scheduledDays) {
  if (!scheduledDays?.length) return 0
  const DOW_MAP = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
  const targetDows = scheduledDays.map((d) => DOW_MAP[d]).filter((d) => d !== undefined)
  if (!targetDows.length) return 0
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (targetDows.includes(dow)) count++
  }
  return count
}

export function getWorkingHours(tuition, monthKey, forceFixed = false) {
  const dur         = parseFloat(tuition?.duration || 0)
  const daysArr     = tuition?.days || []
  const daysPerWeek = daysArr.length
  if (!dur || !daysPerWeek) return 0

  const useFixed = forceFixed || tuition?.calcMode === 'fixed'

  if (useFixed) {
    return parseFloat((daysPerWeek * dur * 4).toFixed(4))
  }

  if (!monthKey) return 0
  const [y, m] = monthKey.split('-').map(Number)
  const scheduledDays = countScheduledDaysInMonth(y, m, daysArr)
  return parseFloat((scheduledDays * dur).toFixed(4))
}

export function calcEffHourly(fee, feeType, tuition, monthKey, forceFixed = false) {
  if (!fee || !feeType) return null
  const f = parseFloat(fee)
  if (!f) return null

  if (feeType === 'Hourly') {
    return parseFloat(f.toFixed(2))
  }

  if (feeType === 'Session') {
    const dur = parseFloat(tuition?.duration || 0)
    if (!dur) return null
    return parseFloat((f / dur).toFixed(2))
  }

  if (feeType === 'Monthly') {
    const workingHrs = getWorkingHours(tuition, monthKey, forceFixed)
    if (!workingHrs) return null
    return parseFloat((f / workingHrs).toFixed(2))
  }

  return null
}

export function calcTutorAmount(tuition, monthKey, nonDemoAtt) {
  if (!tuition || !monthKey || !nonDemoAtt?.length) return null

  const feeType = tuition.tutorFeeType || tuition.feeType
  const fee     = parseFloat(tuition.feeTutor || 0)
  if (!fee || !feeType) return null

  const actualHours = nonDemoAtt.reduce((s, a) => s + parseFloat(a.dur || 0), 0)
  if (!actualHours) return 0

  const parentType  = tuition.parentFeeType || tuition.feeType
  const bothMonthly = parentType === 'Monthly' && feeType === 'Monthly'
  const forceFixed  = feeType === 'Monthly' && !bothMonthly
  const effHourly   = calcEffHourly(fee, feeType, tuition, monthKey, forceFixed)
  if (effHourly === null) return null

  return Math.round(effHourly * actualHours)
}
