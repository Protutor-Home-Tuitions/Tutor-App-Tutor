import { create } from 'zustand'
import { api } from '../lib/api'

const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export const useTutorStore = create((set, get) => ({
  // ── Auth ──
  me: null,       // { id, name, phone, active, passDigits, ... }
  token: null,

  // ── Data ──
  tuitions: [],   // my assigned tuitions
  attendance: {}, // { [enqId]: [...records] }
  completions: {}, // { "enqId_monthKey": { completedAt, completedBy, tutorPhone } }

  loading: false,
  error: null,

  // ── Login ──
  login: async (phone, password) => {
    set({ loading: true, error: null })
    try {
      const { token, tutor } = await api.tutorLogin(phone, password)
      sessionStorage.setItem('protutor_tutor_token', token)
      sessionStorage.setItem('protutor_tutor_phone', phone)
      set({ me: tutor, token, loading: false })
      await get().bootstrap()
      return tutor
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // ── Restore session ──
  restoreSession: async () => {
    const token = sessionStorage.getItem('protutor_tutor_token')
    const phone = sessionStorage.getItem('protutor_tutor_phone')
    if (!token || !phone) return false
    set({ token })
    try {
      await get().bootstrap()
      return true
    } catch {
      sessionStorage.removeItem('protutor_tutor_token')
      sessionStorage.removeItem('protutor_tutor_phone')
      return false
    }
  },

  // ── Bootstrap — load all tuitions + attendance ──
  bootstrap: async () => {
    set({ loading: true })
    try {
      const tuitions = await api.getMyTuitions()
      set({ tuitions, loading: false })

      // Load attendance for all tuitions in parallel
      await Promise.all(tuitions.map((t) => get().loadTuitionData(t.enqId)))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // ── Load attendance + completions for one tuition ──
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
    } catch (err) {
      console.error('loadTuitionData error:', err)
    }
  },

  // ── Submit attendance ──
  addAttendance: async (enqId, record) => {
    const row = await api.submitAttendance({ ...record, enqId })
    set((s) => ({
      attendance: {
        ...s.attendance,
        [enqId]: [row, ...(s.attendance[enqId] || [])],
      },
    }))
    return row
  },

  // ── Submit month completion ──
  completeMonth: async (enqId, monthKey) => {
    await api.submitMonthCompletion(enqId, monthKey)
    const key = `${enqId}_${monthKey}`
    set((s) => ({
      completions: {
        ...s.completions,
        [key]: {
          completedAt: new Date().toISOString(),
          completedBy: s.me?.name || 'Tutor',
          tutorPhone: s.me?.phone || '',
          enqId, monthKey,
        },
      },
    }))
  },

  // ── Logout ──
  logout: () => {
    sessionStorage.removeItem('protutor_tutor_token')
    sessionStorage.removeItem('protutor_tutor_phone')
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
  const monthPassed = (now.getFullYear() > y) ||
    (now.getFullYear() === y && now.getMonth() > m - 1)
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

const ABGS = ['#FEF3C7','#DBEAFE','#FCE7F3','#D1FAE5','#EDE9FE','#FEE2E2']
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
