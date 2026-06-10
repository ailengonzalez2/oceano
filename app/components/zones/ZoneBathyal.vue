<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 04 — BATHYAL (about / bio)
 * Palette: #0A3A5C / #061F36 / #0E4A6E · Behaviour: light almost gone — B/W
 * silhouette imagery, contrast, minimal colour. The torch-cursor interaction
 * (brief moment #5) lives here: a portrait emerges only where the cursor lights.
 */
const { t } = useI18n()
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const stats = [
  { key: 'dives', value: '2 400+' },
  { key: 'depth', value: '−68 m' },
  { key: 'years', value: '12' }
]

onMounted(() => {
  if (reduced.value) return

  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    gsap.from('.bathyal__text > *', {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.bathyal__inner', start: 'top 75%' }
    })
  }, root.value!)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section id="about" ref="root" class="bathyal" :aria-label="t('nav.about')">
    <div class="bathyal__inner">
      <!-- Torch-revealed B/W portrait -->
      <div class="bathyal__portrait">
        <TorchCursor :radius="180">
          <PlaceholderPhoto
            src="/img/portrait.jpg"
            :w="900"
            :h="1200"
            grayscale
            :alt="t('about.title')"
          />
        </TorchCursor>
        <p class="bathyal__reveal-hint tracking-hud">{{ t('about.reveal') }}</p>
      </div>

      <!-- Bio -->
      <div class="bathyal__text">
        <p class="bathyal__zone tracking-hud">{{ t('about.zone') }}</p>
        <h2 class="bathyal__title font-display">{{ t('about.title') }}</h2>
        <p class="bathyal__body">{{ t('about.body') }}</p>

        <dl class="bathyal__stats">
          <div v-for="s in stats" :key="s.key" class="bathyal__stat">
            <dt class="bathyal__stat-value font-display">{{ s.value }}</dt>
            <dd class="bathyal__stat-label tracking-hud">{{ t(`about.stats.${s.key}`) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bathyal {
  position: relative;
  z-index: 5;
  padding: clamp(6rem, 16vh, 12rem) clamp(1.2rem, 5vw, 5rem);
}
.bathyal__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}
.bathyal__portrait :deep(.ph) {
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8);
}
.bathyal__reveal-hint {
  margin-top: 1rem;
  font-size: 0.55rem;
  color: rgba(169, 232, 242, 0.45);
  text-align: center;
}
.bathyal__zone {
  font-size: 0.6rem;
  color: rgba(169, 232, 242, 0.5);
  margin-bottom: 1rem;
}
.bathyal__title {
  font-size: clamp(2rem, 5vw, 3.4rem);
  font-weight: 300;
  color: #eafbff;
  margin-bottom: 1.4rem;
}
.bathyal__body {
  font-size: 1.05rem;
  font-weight: 300;
  line-height: 1.8;
  color: rgba(234, 251, 255, 0.78);
  max-width: 34rem;
}
.bathyal__stats {
  display: flex;
  gap: clamp(1.5rem, 4vw, 3rem);
  margin-top: 2.6rem;
}
.bathyal__stat-value {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 300;
  color: #eafbff;
}
.bathyal__stat-label {
  font-size: 0.5rem;
  color: rgba(169, 232, 242, 0.55);
  margin-top: 0.4rem;
}

@media (max-width: 800px) {
  .bathyal__inner { grid-template-columns: 1fr; }
  .bathyal__portrait { max-width: 22rem; margin: 0 auto; }
}
</style>
