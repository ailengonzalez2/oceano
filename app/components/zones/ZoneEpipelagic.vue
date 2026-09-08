<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 02 — EPIPELAGIC (portfolio)
 * Palette: #3FB5D6 / #1E80B0 / #5FC8E0 · Behaviour: parallax + scroll reveal.
 *
 * The portfolio is the protagonist: a curated grid of photographs that reveal as
 * you descend, with columns drifting at different speeds for depth. Ultra-thin
 * type, lots of negative space (water).
 */
const { t } = useI18n()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

// Curated grid — varied aspect ratios so the layout reads like a real edit.
// `src` images match each caption; `speed` drives per-item parallax depth.
const photos = [
  { src: '/img/fish.jpg', w: 800, h: 1100, key: '1', speed: 1.0 },
  { src: '/img/reef.jpg', w: 900, h: 700, key: '2', speed: 0.6 },
  { src: '/img/turtle.jpg', w: 800, h: 1000, key: '3', speed: 1.3 },
  { src: '/img/kelp.jpg', w: 900, h: 1200, key: '4', speed: 0.8 },
  { src: '/img/jellyfish.jpg', w: 800, h: 800, key: '5', speed: 1.2 },
  { src: '/img/shark-front.jpg', w: 1920, h: 1280, key: '6', speed: 0.5 }
]

onMounted(() => {
  if (reduced.value) return // reduced motion: grid is simply present, no parallax

  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // ——— Scroll reveal ———
    // Each photo fades + rises into place as it enters the viewport.
    gsap.utils.toArray<HTMLElement>('.epi__item').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      })

      // ——— Per-item parallax ———
      // While the item is in view, drift it vertically by its `speed`. Tie to
      // scroll with scrub so it feels physically anchored to the descent.
      const speed = Number(el.dataset.speed) || 1
      gsap.fromTo(
        el.querySelector('.epi__media'),
        { yPercent: 8 * speed },
        {
          yPercent: -8 * speed,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      )
    })
  }, root.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section
    id="portfolio"
    ref="root"
    class="epi"
    :aria-label="t('nav.portfolio')"
  >
    <header class="epi__header">
      <p class="epi__zone tracking-hud">
        {{ t('portfolio.zone') }}
      </p>
      <h2 class="epi__title font-display">
        {{ t('portfolio.title') }}
      </h2>
      <p class="epi__intro">
        {{ t('portfolio.intro') }}
      </p>
    </header>

    <div class="epi__grid">
      <div
        v-for="p in photos"
        :key="p.src"
        class="epi__item"
        :data-speed="p.speed"
      >
        <div class="epi__media">
          <PlaceholderPhoto
            :src="p.src"
            :w="p.w"
            :h="p.h"
            :alt="t(`portfolio.items.${p.key}`)"
          >
            <template #caption>
              {{ t(`portfolio.items.${p.key}`) }}
            </template>
          </PlaceholderPhoto>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.epi {
  position: relative;
  z-index: 5;
  padding: clamp(5rem, 14vh, 11rem) clamp(1.2rem, 5vw, 5rem) clamp(6rem, 16vh, 12rem);
  max-width: 1500px;
  margin: 0 auto;
}
.epi__header {
  max-width: 38rem;
  margin: 0 auto clamp(3rem, 8vh, 6rem);
  text-align: center;
}
.epi__zone {
  font-size: 0.6rem;
  color: rgba(169, 232, 242, 0.7);
  margin-bottom: 1.2rem;
}
.epi__title {
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 300;
  color: #eafbff;
  line-height: 1.05;
}
.epi__intro {
  margin-top: 1.2rem;
  font-size: 0.95rem;
  font-weight: 300;
  color: rgba(234, 251, 255, 0.7);
  letter-spacing: 0.02em;
}

/* Curated columns; items keep their own aspect ratios via PlaceholderPhoto */
.epi__grid {
  columns: 2;
  column-gap: clamp(3rem, 12vw, 12rem);
  max-width: 1100px;
  margin: 0 auto;
}
.epi__item {
  break-inside: avoid;
  margin-bottom: clamp(5rem, 20vh, 12rem);
}
.epi__media {
  will-change: transform;
}
.epi__media :deep(.ph) {
  box-shadow: 0 20px 50px -20px rgba(2, 10, 20, 0.6);
  mask-image: linear-gradient(transparent, #000 7%, #000 90%, transparent);
}

@media (max-width: 900px) {
  .epi__grid { columns: 2; }
}
@media (max-width: 560px) {
  .epi__grid { columns: 1; }
}
</style>
