/**
 * useDiveClock — the dive's elapsed-time counter ("Tiempo de inmersión").
 *
 * Unlike the other instruments (which are scroll-driven), this is a real running
 * clock. It starts when the user enters the dive (app.vue calls `begin()` from
 * the loader hand-off) and ticks once a second, formatted M:SS.
 *
 * Shared module-level state so the HUD reads the same clock everywhere; only one
 * interval ever runs.
 */
const startMs = ref<number | null>(null)
const now = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function useDiveClock() {
  /** Start (or restart) the dive clock — called once when the dive begins. */
  function begin() {
    if (!import.meta.client) return
    startMs.value = performance.now()
    now.value = startMs.value
    if (!timer) {
      timer = setInterval(() => {
        now.value = performance.now()
      }, 1000)
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // "0:00" before the dive starts, then M:SS counting up.
  const diveTime = computed(() => {
    if (startMs.value == null) return '0:00'
    const secs = Math.max(0, Math.floor((now.value - startMs.value) / 1000))
    return `${Math.floor(secs / 60)}:${pad(secs % 60)}`
  })

  return { begin, stop, diveTime }
}
