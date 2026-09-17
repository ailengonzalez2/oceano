<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 01 — SURFACE (hero)
 * Eye-level procedural ocean with a floating camera and reflective waves.
 * Photographer name + tagline sit above the hero's Three.js canvas.
 * Motion: a parallax + dissolve handoff to the portfolio as you start to descend.
 */
const { t } = useI18n()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

onMounted(() => {
  if (reduced.value) return // reduced motion: no parallax, no dissolve

  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // ——— Parallax + dissolve handoff ———
    // As the surface scrolls away (top→bottom of this section), the hero image
    // drifts slower than the page (parallax) and the whole hero fades, dissolving
    // continuously into the portfolio below — never a hard cut.
    //   scrub: ties progress directly to scroll position
    //   Tune `yPercent` for parallax strength; tune the fade `end` for handoff timing.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
    tl.to(content.value, { yPercent: -10, opacity: 0, ease: 'none' }, 0)
  }, root.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section
    id="surface"
    ref="root"
    class="surface"
    :aria-label="t('nav.surface')"
  >
    <!-- Name + tagline -->
    <div
      ref="content"
      class="surface__content"
    >
      <p class="surface__role tracking-hud">
        {{ t('surface.role') }}
      </p>
      <h1 class="surface__name font-display">
        {{ t('surface.name') }}
      </h1>
      <p class="surface__tagline font-display">
        {{ t('surface.tagline') }}
      </p>
    </div>

    <!-- Scroll-to-descend hint -->
    <div
      class="surface__scroll tracking-hud"
      aria-hidden="true"
    >
      {{ t('hud.scrollHint') }}
      <span class="surface__scroll-line" />
    </div>
  </section>
</template>

<style scoped>
.surface {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
}
.surface__content {
  position: relative;
  z-index: 4;
  text-align: center;
  padding: 1.5rem;
  padding-top: 18vh;
}
.surface__role {
  font-size: 0.66rem;
  color: #eafbff;
  margin-bottom: 1.4rem;
  text-shadow: 0 1px 18px rgba(2, 10, 20, 0.6);
}
.surface__name {
  font-size: clamp(3rem, 11vw, 8rem);
  font-style: italic;
  font-weight: 300;
  line-height: 0.95;
  color: #eafbff;
  /* Layered shadow keeps thin white type legible over the bright horizon
     without dimming the photo itself (no scrim / no transparency on the image). */
  text-shadow: 0 2px 24px rgba(2, 10, 20, 0.55), 0 0 60px rgba(2, 10, 20, 0.45);
}
.surface__tagline {
  margin-top: 1.2rem;
  font-size: clamp(1.1rem, 2.4vw, 1.7rem);
  font-style: italic;
  font-weight: 300;
  color: #eafbff;
  text-shadow: 0 1px 20px rgba(2, 10, 20, 0.6);
}
.surface__scroll {
  position: absolute;
  bottom: 1.6rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  font-size: 0.55rem;
  color: #eafbff;
  text-shadow: 0 1px 12px rgba(2, 10, 20, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.surface__scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(rgba(234, 251, 255, 0.9), transparent);
  animation: drip 2.2s ease-in-out infinite;
}
@keyframes drip {
  0%, 100% { transform: scaleY(0.5); transform-origin: top; opacity: 0.4; }
  50% { transform: scaleY(1); transform-origin: top; opacity: 1; }
}
</style>
