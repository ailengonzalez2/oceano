import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * useLenis — the scroll engine for the descent.
 *
 * Sets up Lenis momentum scrolling and wires it to GSAP's ScrollTrigger so that
 * every pinned/parallax timeline in the zones stays perfectly in sync with the
 * inertia scroll. Also feeds global scroll progress into useScrollDepth so the
 * HUD instruments update from a single source.
 *
 * Reduced-motion path: we skip Lenis entirely and track native scroll. No
 * inertia, no smoothing — just a clean vertical scroll — while the HUD keeps
 * working. Zones independently disable their parallax/pinning in this mode.
 */

let lenis: Lenis | null = null
let registered = false

export function useLenis() {
  const { setProgress } = useScrollDepth()
  const reduced = useReducedMotion()

  // Recompute global descent progress from the document scroll position.
  // Works for both the Lenis and native paths because Lenis drives real scroll.
  function syncProgress() {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    setProgress(max > 0 ? window.scrollY / max : 0)
  }

  function start() {
    if (!import.meta.client) return

    if (!registered) {
      gsap.registerPlugin(ScrollTrigger)
      registered = true
    }

    // Reduced motion → no smooth scroll. Track native scroll for the HUD only.
    if (reduced.value) {
      window.addEventListener('scroll', syncProgress, { passive: true })
      syncProgress()
      return
    }

    lenis = new Lenis({
      duration: 1.1, // inertia length — higher = more "drift" after release
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4 // the descent must feel right on touch too
    })

    // Keep ScrollTrigger and the HUD in lockstep with Lenis on every scroll.
    lenis.on('scroll', () => {
      ScrollTrigger.update()
      syncProgress()
    })

    // Drive Lenis from GSAP's ticker so animation + scroll share one clock.
    gsap.ticker.add(lenisRaf)
    gsap.ticker.lagSmoothing(0)
  }

  function lenisRaf(time: number) {
    // gsap ticker time is in seconds; Lenis expects milliseconds
    lenis?.raf(time * 1000)
  }

  function stop() {
    if (lenis) {
      gsap.ticker.remove(lenisRaf)
      lenis.destroy()
      lenis = null
    }
    window.removeEventListener('scroll', syncProgress)
  }

  /** Pause/resume scrolling — used while the intro gate is up. */
  function setLocked(locked: boolean) {
    if (lenis) {
      locked ? lenis.stop() : lenis.start()
    }
    document.body.classList.toggle('is-locked', locked)
  }

  /** Smoothly scroll to a target (used by nav / "back to surface"). */
  function scrollTo(target: number | string | HTMLElement) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6 })
    } else if (typeof target !== 'number') {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      el?.scrollIntoView({ behavior: 'auto' })
    } else {
      window.scrollTo({ top: target })
    }
  }

  return { start, stop, setLocked, scrollTo }
}
