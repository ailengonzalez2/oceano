/**
 * Reactive `prefers-reduced-motion` flag.
 *
 * Single source of truth used across the site to decide whether to run the
 * cinematic timeline (parallax, pinning, looping shader) or fall back to a calm
 * vertical scroll with simple fades. Shared module-level state so every consumer
 * sees the same value and we attach only one media-query listener.
 */
const prefersReduced = ref(false)
let initialised = false

export function useReducedMotion() {
  if (import.meta.client && !initialised) {
    initialised = true
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReduced.value = mq.matches
    mq.addEventListener('change', (e) => {
      prefersReduced.value = e.matches
    })
  }
  return prefersReduced
}
