<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 03 — MESOPELAGIC (stories)
 * Palette: #125A87 / #0A3A5C / #1E6E9E · Behaviour: full-bleed photo pins while
 * editorial text passes over it; suspended particles drift throughout.
 *
 * Each documentary project is a tall panel: the photo pins (CSS sticky — cheap
 * and jank-free) for the length of the story while the editorial copy scrolls up
 * and over it, then the next story takes over with a continuous dissolve.
 */
const { t } = useI18n()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const stories = [
  { src: '/img/whale.jpg', key: '1', w: 1600, h: 1000 }, // twilight zone / migration
  { src: '/img/coral.jpg', key: '2', w: 1600, h: 1000 }, // coral bleaching
  { src: '/img/biolum.jpg', key: '3', w: 1600, h: 1000 } // bioluminescence
]

onMounted(() => {
  if (reduced.value) return // reduced motion: static stacked layout, no reveals

  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // Editorial copy fades + rises as each story enters; pinned photo eases its
    // scale slightly for a subtle "drifting closer" feel during the pin.
    gsap.utils.toArray<HTMLElement>('.meso__copy').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      })
    })
    gsap.utils.toArray<HTMLElement>('.meso__media').forEach((el) => {
      gsap.fromTo(
        el.querySelector('.ph'),
        { scale: 1.08 },
        {
          scale: 1,
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
    id="stories"
    ref="root"
    class="meso"
    :class="{ 'is-reduced': reduced }"
    :aria-label="t('nav.stories')"
  >
    <header class="meso__header">
      <p class="meso__zone tracking-hud">
        {{ t('stories.zone') }}
      </p>
      <h2 class="meso__title font-display">
        {{ t('stories.title') }}
      </h2>
    </header>

    <article
      v-for="(s, i) in stories"
      :key="s.src"
      class="meso__story"
    >
      <!-- Pinned full-bleed photo -->
      <div class="meso__media">
        <PlaceholderPhoto
          :src="s.src"
          :w="s.w"
          :h="s.h"
          :alt="t(`stories.items.${s.key}.title`)"
        />
        <div class="meso__scrim" />
      </div>

      <!-- Editorial copy that passes over the pinned photo -->
      <div
        class="meso__copy"
        :class="{ left: i % 2 === 0 }"
      >
        <p class="meso__kicker tracking-hud">
          {{ t(`stories.items.${s.key}.kicker`) }}
        </p>
        <h3 class="meso__story-title font-display">
          {{ t(`stories.items.${s.key}.title`) }}
        </h3>
        <p class="meso__body">
          {{ t(`stories.items.${s.key}.body`) }}
        </p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.meso {
  position: relative;
  z-index: 5;
  padding-top: clamp(4rem, 10vh, 8rem);
}
.meso__particles { z-index: 0; }
.meso__header {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 40rem;
  margin: 0 auto clamp(3rem, 8vh, 6rem);
  padding: 0 1.2rem;
}
.meso__zone {
  font-size: 0.6rem;
  color: rgba(169, 232, 242, 0.6);
  margin-bottom: 1rem;
}
.meso__title {
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 300;
  color: #eafbff;
}

/* Each story is tall; the media pins (sticky) for its duration */
.meso__story {
  position: relative;
  min-height: 150svh;
  padding: 8svh clamp(1rem, 6vw, 7rem);
}
.meso__media {
  position: sticky;
  top: 18svh;
  width: min(66vw, 1000px);
  height: 66svh;
  overflow: hidden;
  margin-left: auto;
  opacity: 0.78;
  mask-image: radial-gradient(ellipse, #000 35%, transparent 73%);
}
.meso__story:nth-of-type(even) .meso__media {
  margin-left: 0;
}
.meso__media :deep(.ph) {
  height: 100%;
  border-radius: 0;
}
.meso__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 58, 92, 0.35), rgba(6, 31, 54, 0.65));
}
.meso__copy {
  position: relative;
  z-index: 3;
  /* Start the copy below the first viewport so it scrolls up over the pinned photo */
  margin-top: -28svh;
  max-width: 30rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  margin-left: auto;
  margin-right: clamp(1rem, 8vw, 8rem);
  background: radial-gradient(ellipse, rgba(2, 15, 28, 0.65), transparent 75%);
}
.meso__copy.left {
  margin-left: clamp(1rem, 8vw, 8rem);
  margin-right: auto;
}
.meso__kicker {
  font-size: 0.6rem;
  color: var(--color-biolum);
  opacity: 0.85;
  margin-bottom: 1rem;
}
.meso__story-title {
  font-size: clamp(1.8rem, 4.5vw, 3rem);
  font-weight: 300;
  color: #eafbff;
  line-height: 1.05;
  margin-bottom: 1.2rem;
  text-shadow: 0 2px 24px rgba(2, 10, 20, 0.6);
}
.meso__body {
  font-size: 1.02rem;
  font-weight: 300;
  line-height: 1.7;
  color: rgba(234, 251, 255, 0.85);
}

/* Reduced motion: no pinning — stack photo then copy as a clean document flow */
.meso.is-reduced .meso__story { min-height: auto; }
.meso.is-reduced .meso__media { position: static; height: 70vh; }
.meso.is-reduced .meso__copy { margin-top: 2rem; margin-bottom: 4rem; }
@media (max-width: 640px) {
  .meso__media { width: 100%; height: 55svh; }
  .meso__copy { margin-top: -10svh; margin-left: 0; margin-right: 0; }
  .meso__copy.left { margin-left: 0; }
}
</style>
