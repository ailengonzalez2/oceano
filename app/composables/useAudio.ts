/**
 * useAudio — opt-in ambient underwater sound.
 *
 * Hard rules from the brief:
 *   • OFF by default. We NEVER autoplay.
 *   • Sound only ever starts from an explicit user gesture (the loader opt-in or
 *     the HUD toggle), which also satisfies browser autoplay policies.
 *
 * The audio element is created lazily on first enable so nothing is fetched for
 * users who never opt in. Shared module-level state keeps the loader toggle and
 * the persistent HUD toggle in sync.
 */
const enabled = ref(false)
let audio: HTMLAudioElement | null = null

// Royalty-free ambient loop. Swap for a local /public asset for production.
const AMBIENT_SRC = 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8f8e3e1a4d.mp3?filename=underwater-ambience-6201.mp3'

export function useAudio() {
  function ensureEl() {
    if (!audio && import.meta.client) {
      audio = new Audio(AMBIENT_SRC)
      audio.loop = true
      audio.volume = 0.0 // fade in from silence
      audio.preload = 'none'
    }
  }

  function fadeTo(target: number, ms = 1200) {
    if (!audio) return
    const from = audio.volume
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      audio!.volume = from + (target - from) * t
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  async function enable() {
    ensureEl()
    if (!audio) return
    try {
      await audio.play() // requires the user gesture that called us
      enabled.value = true
      fadeTo(0.35)
    } catch {
      // Autoplay blocked or load failed — stay silent, never force it.
      enabled.value = false
    }
  }

  function disable() {
    enabled.value = false
    if (!audio) return
    fadeTo(0, 500)
    window.setTimeout(() => audio?.pause(), 520)
  }

  function toggle() {
    if (enabled.value) disable()
    else enable()
  }

  return { enabled, enable, disable, toggle }
}
