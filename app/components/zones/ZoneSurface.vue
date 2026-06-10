<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 01 — SURFACE (hero)
 * Palette: #7FD8E8 / #A9E8F2 / #EAFBFF · Behaviour: WebGL god rays + caustics.
 *
 * The arrival. Photographer name + tagline over a full-bleed, fully-opaque hero
 * image (the ocean surface), with the only WebGL in the site layered on top.
 * Motion: a parallax + dissolve handoff to the portfolio as you start to descend.
 */
const { t } = useI18n()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
const hero = ref<HTMLElement | null>(null)
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
    tl.to(hero.value, { yPercent: 18, ease: 'none' }, 0) // background drifts down slowly
      .to(content.value, { yPercent: -10, opacity: 0, ease: 'none' }, 0) // text lifts + fades
      .to(root.value, { opacity: 0.35, ease: 'none' }, 0) // dissolve into next zone
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
    <!-- Full-bleed hero photo (fully opaque) -->
    <div ref="hero" class="surface__hero">
      <PlaceholderPhoto
        src="/img/hero.jpg"
        :w="1600"
        :h="2000"
        eager
        :alt="t('surface.tagline')"
      />
    </div>

    <!-- WebGL caustics + god rays (hero only) -->
    <CausticsCanvas class="surface__caustics" />
    <LightRays :opacity="0.4" class="surface__rays" />

    <!-- Name + tagline -->
    <div ref="content" class="surface__content">
      <p class="surface__role tracking-hud">{{ t('surface.role') }}</p>
      <h1 class="surface__name font-display">{{ t('surface.name') }}</h1>
      <p class="surface__tagline font-display">{{ t('surface.tagline') }}</p>
    </div>

    <!-- Scroll-to-descend hint -->
    <div class="surface__scroll tracking-hud" aria-hidden="true">
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
.surface__hero {
  position: absolute;
  inset: -8% 0;
  z-index: 1;
}
.surface__hero :deep(.ph) {
  height: 100%;
  border-radius: 0;
}
.surface__caustics {
  z-index: 2;
  opacity: 0.5; /* toned down so it doesn't wash out the bright surface photo */
}
.surface__rays { z-index: 2; }
.surface__content {
  position: relative;
  z-index: 4;
  text-align: center;
  padding: 1.5rem;
}
.surface__role {
  font-size: 0.66rem;
  color: #eafbff;
  margin-bottom: 1.4rem;
  text-shadow: 0 1px 18px rgba(2, 10, 20, 0.6);
}
.surface__name {
  font-size: clamp(3rem, 11vw, 8rem);
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
