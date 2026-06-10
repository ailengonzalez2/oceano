<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ZONE 05 — ABYSSAL (contact)
 * Palette: #061F36 / #020A14 · accent #3FE0BC.
 *
 * The bottom of the dive: near-total darkness with a single point of biolumines-
 * cent light. This is the ONLY place the teal accent is used at full strength —
 * a glowing CTA on black. Contact links: email / Instagram / commission.
 */
const { t } = useI18n()
const reduced = useReducedMotion()
const { scrollTo } = useLenis()

const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const PHOTOGRAPHER_EMAIL = 'hola@ailengonzalez.com' // placeholder — swap for real
const INSTAGRAM_URL = 'https://instagram.com/'

onMounted(() => {
  if (reduced.value) return

  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // The point of light blooms as the abyss enters; the CTA rises out of black.
    gsap.from('.abyss__bloom', {
      scale: 0.3,
      opacity: 0,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: root.value, start: 'top 70%' }
    })
    gsap.from('.abyss__content > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: root.value, start: 'top 55%' }
    })
  }, root.value!)
})

onBeforeUnmount(() => ctx?.revert())

function backToSurface() {
  scrollTo(0)
}
</script>

<template>
  <section id="contact" ref="root" class="abyss" :aria-label="t('nav.contact')">
    <!-- The single point of light -->
    <div class="abyss__bloom" aria-hidden="true" />

    <div class="abyss__content">
      <p class="abyss__zone tracking-hud">{{ t('contact.zone') }}</p>
      <h2 class="abyss__title font-display">{{ t('contact.title') }}</h2>
      <p class="abyss__body">{{ t('contact.body') }}</p>

      <!-- Glowing primary CTA -->
      <a
        class="abyss__cta font-display"
        :href="`mailto:${PHOTOGRAPHER_EMAIL}`"
      >
        {{ t('contact.email') }}
      </a>

      <!-- Secondary contact links -->
      <div class="abyss__links">
        <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" class="abyss__link tracking-hud">
          {{ t('contact.instagram') }}
        </a>
        <a
          :href="`mailto:${PHOTOGRAPHER_EMAIL}?subject=${encodeURIComponent(t('contact.commission'))}`"
          class="abyss__link tracking-hud"
        >
          {{ t('contact.commission') }}
        </a>
      </div>

      <button type="button" class="abyss__back tracking-hud" @click="backToSurface">
        ↑ {{ t('contact.back') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.abyss {
  position: relative;
  z-index: 5;
  min-height: 100svh;
  display: grid;
  place-items: center;
  text-align: center;
  padding: clamp(6rem, 16vh, 12rem) 1.5rem;
  background: radial-gradient(120% 80% at 50% 60%, #061f36 0%, #020a14 55%, #000 100%);
  overflow: hidden;
}
.abyss__bloom {
  position: absolute;
  top: 38%;
  left: 50%;
  width: min(60vw, 520px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(63, 224, 188, 0.4) 0%, rgba(63, 224, 188, 0.08) 35%, transparent 65%);
  filter: blur(10px);
  animation: pulse 5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}
.abyss__content {
  position: relative;
  z-index: 2;
  max-width: 36rem;
}
.abyss__zone {
  font-size: 0.6rem;
  color: rgba(63, 224, 188, 0.6);
  margin-bottom: 1.4rem;
}
.abyss__title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 300;
  line-height: 1.05;
  color: #eafbff;
  margin-bottom: 1.4rem;
}
.abyss__body {
  font-size: 1.05rem;
  font-weight: 300;
  color: rgba(234, 251, 255, 0.75);
  margin-bottom: 3rem;
}

/* The glowing bioluminescent CTA — accent reserved for exactly this */
.abyss__cta {
  display: inline-block;
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: #020a14;
  background: var(--color-biolum);
  padding: 1rem 3rem;
  border-radius: 999px;
  box-shadow: 0 0 30px rgba(63, 224, 188, 0.5), 0 0 80px rgba(63, 224, 188, 0.25);
  transition: box-shadow 0.4s ease, transform 0.3s ease;
  animation: glow 4s ease-in-out infinite;
}
.abyss__cta:hover,
.abyss__cta:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 0 44px rgba(63, 224, 188, 0.8), 0 0 120px rgba(63, 224, 188, 0.4);
  outline: none;
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 26px rgba(63, 224, 188, 0.45), 0 0 70px rgba(63, 224, 188, 0.2); }
  50% { box-shadow: 0 0 38px rgba(63, 224, 188, 0.65), 0 0 100px rgba(63, 224, 188, 0.35); }
}

.abyss__links {
  margin-top: 2.4rem;
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}
.abyss__link {
  font-size: 0.62rem;
  color: rgba(234, 251, 255, 0.7);
  border-bottom: 1px solid transparent;
  padding-bottom: 0.2rem;
  transition: color 0.3s ease, border-color 0.3s ease;
}
.abyss__link:hover,
.abyss__link:focus-visible {
  color: var(--color-biolum);
  border-color: var(--color-biolum);
  outline: none;
}
.abyss__back {
  display: block;
  margin: 4rem auto 0;
  font-size: 0.55rem;
  color: rgba(169, 232, 242, 0.5);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
}
.abyss__back:hover,
.abyss__back:focus-visible {
  color: #eafbff;
  outline: none;
}
</style>
