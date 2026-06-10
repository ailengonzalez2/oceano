/**
 * useScrollDepth — maps global scroll progress to the dive instruments.
 *
 * The whole page is a vertical dive. We treat the document's scroll position
 * (0 at top → 1 at bottom) as the descent and derive the three HUD readouts
 * from it:
 *
 *   progress (0–1)   ← driven by Lenis / native scroll (see useLenis)
 *   depth    (m)     ← 0 m at the surface → MAX_DEPTH at the abyss
 *   temp     (°C)    ← SURFACE_TEMP at the top, cooling to ABYSS_TEMP
 *   discovery(%)     ← progress as a 0–100 "discovery meter"
 *
 * Plus four dive-computer style readouts, also derived from the descent:
 *   ndl      (min)   ← no-decompression limit, shrinks as you go deeper ("∞" up top)
 *   safety   (m)     ← recommended safety stop, appears once you've gone deep
 *   air      (bar)   ← tank pressure, bled down across the dive (with low-air flag)
 *   (dive time is a real running clock — see useDiveClock)
 *
 * Shared module-level state so the HUD, zones and decorations all read the same
 * descent value without prop-drilling. Tune the mapping constants below to
 * recalibrate the dive without touching any component.
 */

// ——— Tunable depth/temperature mapping ———
const MAX_DEPTH = 1000 // metres at the very bottom (abyss)
const SURFACE_TEMP = 20 // °C at the surface
const ABYSS_TEMP = 2 // °C at the bottom

// ——— Tunable dive-computer mapping ———
const START_AIR = 220 // bar in the tank at the surface
const END_AIR = 60 // bar left at the abyss
const LOW_AIR = 80 // bar threshold for the reserve / low-air warning
const MAX_NDL = 99 // minutes of no-deco time near the surface

const progress = ref(0) // 0 (surface) → 1 (abyss)

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

export function useScrollDepth() {
  /** Called by the scroll driver (Lenis or native fallback) every frame. */
  function setProgress(p: number) {
    progress.value = clamp01(p)
  }

  // Whole metres descending: "Profundidad: 0m" → "1000m"
  const depth = computed(() => Math.round(progress.value * MAX_DEPTH))

  // Temperature drops with depth, one decimal: "20.0°C" → "2.0°C"
  const temp = computed(() =>
    (SURFACE_TEMP - progress.value * (SURFACE_TEMP - ABYSS_TEMP)).toFixed(1)
  )

  // Discovery meter: "Progreso: 0%" → "100%"
  const discovery = computed(() => Math.round(progress.value * 100))

  // No-decompression limit: unlimited near the surface, then falls off fast with
  // depth (real NDL curves drop steeply). "∞" until you're properly under.
  const ndl = computed(() => {
    if (depth.value < 6) return '∞'
    const mins = Math.max(0, Math.round(MAX_NDL * Math.pow(1 - progress.value, 1.4)))
    return `${mins}'`
  })

  // Safety stop: none in the shallows; recommended once you've gone deep, and
  // shown as a mandatory timed stop deep in the dive.
  const safety = computed(() => {
    if (depth.value < 10) return '—'
    return progress.value > 0.6 ? '5 m · 3:00' : '5 m'
  })

  // Air management: tank pressure bled down linearly across the descent.
  const air = computed(() => Math.round(START_AIR - progress.value * (START_AIR - END_AIR)))
  const airLow = computed(() => air.value <= LOW_AIR)

  return { progress, setProgress, depth, temp, discovery, ndl, safety, air, airLow }
}
