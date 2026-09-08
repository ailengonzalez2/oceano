<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const { t } = useI18n()
const { scrollTo } = useLenis()
const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const selected = ref<string | null>(null)
const photoOpen = computed({
  get: () => selected.value !== null,
  set: (value: boolean) => {
    if (!value) selected.value = null
  }
})
const reefPhotos = [
  { key: 'reef-texture', drift: 100 },
  { key: 'reef-squid', drift: -70 },
  { key: 'reef-window', drift: 65 }
]
const photoKeys = [...reefPhotos.map(photo => photo.key), 'shark', 'whale', 'jellyfish']
const photoTitle = computed(() => selected.value ? t(`journey.photos.${selected.value}`) : '')
let context: gsap.Context | undefined
let media: gsap.MatchMedia | undefined

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  media = gsap.matchMedia()
  media.add('(prefers-reduced-motion: no-preference)', () => {
    context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-drift]').forEach((el) => {
        const distance = Number(el.dataset.drift)
        gsap.fromTo(el, { y: distance }, {
          y: -distance, ease: 'none',
          scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 0.8 }
        })
      })
      gsap.utils.toArray<HTMLElement>('.chapter__copy').forEach((el) => {
        // Only the drift tween owns y. Measure entry against the stationary section,
        // so the reveal cannot overwrite the parallax or measure its moving target.
        gsap.fromTo(el, { opacity: 0.2 }, {
          opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section'),
            start: () => `top+=${el.offsetTop} 90%`,
            end: () => `top+=${el.offsetTop} 58%`,
            scrub: true,
            invalidateOnRefresh: true
          }
        })
      })
      gsap.fromTo('.whale__image', { xPercent: 10, scale: 0.91 }, {
        xPercent: -9, scale: 1.1, ease: 'none',
        scrollTrigger: { trigger: '#stories', start: 'top bottom', end: 'bottom top', scrub: 1 }
      })
    }, root.value!)
    return () => context?.revert()
  })
  ScrollTrigger.refresh()
})
onBeforeUnmount(() => media?.revert())
</script>

<template>
  <div
    ref="root"
    class="journey"
    :class="{ 'is-reduced': reduced }"
  >
    <section
      class="entry"
      :aria-label="t('journey.entry.label')"
    >
      <div
        class="entry__copy"
        data-drift="60"
      >
        <p class="eyebrow">
          {{ t('journey.entry.label') }}
        </p>
        <h2 class="font-display">
          {{ t('journey.entry.title') }}<br><em>{{ t('journey.entry.end') }}</em>
        </h2>
        <p class="entry__note">
          {{ t('journey.entry.note') }}
        </p>
        <span
          class="descent-line"
          aria-hidden="true"
        />
      </div>
    </section>

    <section
      id="portfolio"
      class="chapter reef"
      :aria-label="t('journey.reef.title')"
    >
      <div
        class="chapter__copy reef__copy"
        data-drift="55"
      >
        <p class="eyebrow">
          01 / {{ t('journey.reef.label') }}
        </p>
        <h2 class="chapter__title font-display">
          {{ t('journey.reef.title') }}<br><em>{{ t('journey.reef.end') }}</em>
        </h2>
        <p class="chapter__body">
          {{ t('journey.reef.body') }}
        </p>
        <p class="field-note">
          <span />{{ t('journey.reef.note') }}
        </p>
      </div>
      <div class="reef__photos">
        <button
          v-for="photo in reefPhotos"
          :key="photo.key"
          class="photo reef__photo"
          :data-drift="photo.drift"
          :aria-label="t('journey.view', { photo: t(`journey.photos.${photo.key}`) })"
          @click="selected = photo.key"
        >
          <img
            :src="`/img/${photo.key}.jpg`"
            :alt="t(`journey.photos.${photo.key}`)"
            width="1200"
            height="800"
            loading="lazy"
          >
          <span class="photo__caption"><span>{{ t(`journey.photos.${photo.key}`) }}</span><span aria-hidden="true">↗</span></span>
        </button>
      </div>
      <span
        class="chapter__word font-display"
        aria-hidden="true"
        data-drift="-35"
      >{{ t('journey.reef.word') }}</span>
    </section>

    <section
      id="open-water"
      class="chapter open-water"
      :aria-label="t('journey.open.title')"
    >
      <div class="open-water__label eyebrow">
        02 / {{ t('journey.open.label') }}
      </div>
      <button
        class="photo open-water__photo"
        data-drift="95"
        :aria-label="t('journey.view', { photo: t('journey.photos.shark') })"
        @click="selected = 'shark'"
      >
        <img
          src="/img/shark-front-cutout.png"
          :alt="t('journey.photos.shark')"
          width="1536"
          height="1024"
          loading="lazy"
        >
        <span class="photo__caption"><span>{{ t('journey.open.caption') }}</span><span aria-hidden="true">↗</span></span>
      </button>
      <div
        class="chapter__copy open-water__copy"
        data-drift="-55"
      >
        <h2 class="chapter__title font-display">
          {{ t('journey.open.title') }}<br><em>{{ t('journey.open.end') }}</em>
        </h2>
        <p class="chapter__body">
          {{ t('journey.open.body') }}
        </p>
        <p class="field-note">
          <span />{{ t('journey.open.note') }}
        </p>
        <a
          class="story-link"
          href="https://www.instagram.com/oceanomartina/reel/DSVPFHQEXGj/"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('journey.open.project') }} <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section
      id="stories"
      class="chapter whale"
      :aria-label="t('journey.whale.label')"
    >
      <div class="whale__stage">
        <button
          class="whale__image"
          :aria-label="t('journey.view', { photo: t('journey.photos.whale') })"
          @click="selected = 'whale'"
        >
          <img
            src="/img/whale.jpg"
            :alt="t('journey.photos.whale')"
            width="1034"
            height="594"
            loading="lazy"
          >
        </button>
        <p class="whale__annotation eyebrow">
          {{ t('journey.whale.caption') }} <span aria-hidden="true">↗</span>
        </p>
      </div>
      <div
        class="chapter__copy whale__copy"
        data-drift="100"
      >
        <p class="eyebrow">
          03 / {{ t('journey.whale.label') }}
        </p>
        <h2 class="chapter__title font-display">
          {{ t('journey.whale.title') }}<br><em>{{ t('journey.whale.end') }}</em>
        </h2>
        <p class="chapter__body">
          {{ t('journey.whale.body') }}
        </p>
      </div>
    </section>

    <section
      id="about"
      class="chapter perspective"
      :aria-label="t('journey.about.label')"
    >
      <div
        class="perspective__orb"
        aria-hidden="true"
      />
      <div
        class="chapter__copy perspective__copy"
        data-drift="55"
      >
        <p class="eyebrow">
          04 / {{ t('journey.about.label') }}
        </p>
        <h2 class="chapter__title font-display">
          {{ t('journey.about.title') }}<br><em>{{ t('journey.about.end') }}</em>
        </h2>
        <p class="chapter__body">
          {{ t('journey.about.body') }}
        </p>
        <div class="perspective__signature">
          <span class="font-display">{{ t('surface.name') }}</span>
          <span class="eyebrow">{{ t('journey.about.role') }}</span>
        </div>
      </div>
      <button
        class="photo perspective__photo"
        data-drift="-65"
        :aria-label="t('journey.view', { photo: t('journey.photos.jellyfish') })"
        @click="selected = 'jellyfish'"
      >
        <img
          src="/img/jellyfish.jpg"
          :alt="t('journey.photos.jellyfish')"
          width="900"
          height="1100"
          loading="lazy"
        >
        <span class="photo__caption"><span>{{ t('journey.about.caption') }}</span><span aria-hidden="true">↗</span></span>
      </button>
    </section>

    <section
      id="contact"
      class="journey-end"
      :aria-label="t('journey.contact.title')"
    >
      <WreckScene class="journey-end__wreck" />
      <h2 class="font-display">
        {{ t('journey.contact.title') }}<br><em>{{ t('journey.contact.end') }}</em>
      </h2>
      <div class="journey-end__disciplines eyebrow">
        <span>{{ t('journey.contact.editorial') }}</span><span>{{ t('journey.contact.expeditions') }}</span><span>{{ t('journey.contact.conservation') }}</span>
      </div>
      <a
        class="contact-link font-display"
        href="https://www.instagram.com/oceanomartina/"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('journey.contact.instagram') }} <span aria-hidden="true">↗</span></a>
      <button
        class="surface-link"
        @click="scrollTo(0)"
      >
        <span aria-hidden="true">↑</span>{{ t('contact.back') }}
      </button>
      <p class="journey-end__footer eyebrow">
        {{ t('surface.name') }} <span>·</span> {{ t('journey.about.role') }}
      </p>
      <details class="model-credits">
        <summary>{{ t('journey.modelCredits') }}</summary>
        <p>
          <a
            href="https://sketchfab.com/3d-models/corals-by-rayaa-8e1e9eec16094494967b9a6d731cde3b"
            target="_blank"
            rel="noopener noreferrer"
          >Corals by Rayaa — Rayaa</a>
          · <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >CC BY-SA 4.0</a>
        </p>
        <p>
          <a
            href="https://sketchfab.com/3d-models/soft-coral-set-256355f15fcb4095af17b75ae572bff0"
            target="_blank"
            rel="noopener noreferrer"
          >Soft Coral Set — Kanna-Nakajima</a>
          · <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >CC BY 4.0</a>
        </p>
        <p>
          <a
            href="https://sketchfab.com/3d-models/school-of-fish-7d2d816ab3a34130b51e0bb42247700c"
            target="_blank"
            rel="noopener noreferrer"
          >School Of Fish — seth the yutyrannus</a>
          · <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >CC BY 4.0</a>
        </p>
        <p>
          <a
            href="https://sketchfab.com/3d-models/model-73a-great-hammerhead-shark-77d52f2b0e084fe7bcefbc86b920f080"
            target="_blank"
            rel="noopener noreferrer"
          >Great Hammerhead Shark — DigitalLife3D</a>
          · <a
            href="https://creativecommons.org/licenses/by-nc/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >CC BY-NC 4.0</a>
        </p>
        <p>
          <a
            href="https://sketchfab.com/3d-models/wreckage-of-the-linda-rose-e8cd4cfbfe5e44c79ccd7a7b1f01d86d"
            target="_blank"
            rel="noopener noreferrer"
          >Wreckage of the Linda Rose — MBARI</a>
          · <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >CC BY 4.0</a>
        </p>
        <a
          href="/models/CREDITS.md"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('journey.modelAdaptations') }}</a>
      </details>
    </section>

    <UModal
      v-model:open="photoOpen"
      :title="photoTitle"
      :description="t('journey.photoDescription')"
      :ui="{ overlay: 'z-[80]', content: 'max-w-5xl z-[90]', body: 'p-2 sm:p-3' }"
    >
      <template #close>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="absolute top-4 end-4"
          :aria-label="t('journey.close')"
        />
      </template>
      <template #body>
        <img
          v-if="selected && photoKeys.includes(selected)"
          class="full-photo"
          :src="selected === 'shark' ? '/img/shark-front.jpg' : `/img/${selected}.jpg`"
          :alt="photoTitle"
        >
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.journey { position: relative; z-index: 5; color: #eafbff; }
.eyebrow { font-size: .62rem; line-height: 1.7; letter-spacing: .23em; text-transform: uppercase; color: #b4dce1; }
.entry { min-height: 105svh; display: grid; place-items: center; padding: 15svh 1.5rem 8svh; text-align: center; }
.entry h2 { margin: 1.6rem 0; font-size: clamp(2.8rem, 6vw, 6rem); line-height: 1.02; }
em { font-weight: 300; color: #b4e6e7; }
.entry__note { font-size: .85rem; color: #c0dbe0; }
.descent-line { display: block; width: 1px; height: 14svh; margin: 3rem auto 0; background: linear-gradient(#b4e6e7, transparent); }
.chapter { position: relative; min-height: 170svh; padding: 22svh 7vw 12svh; }
.chapter__title { font-size: clamp(3.5rem, 6.8vw, 7rem); line-height: .95; letter-spacing: -.045em; margin: 1.6rem 0 2rem; }
.chapter__body { max-width: 26rem; font-size: clamp(.95rem, 1.3vw, 1.1rem); line-height: 1.85; color: #d4e8eb; text-wrap: pretty; }
.chapter__copy { position: relative; z-index: 3; text-shadow: 0 2px 30px #062e3f; }
.field-note { display: flex; align-items: center; gap: .75rem; margin-top: 2.3rem; max-width: 22rem; font-size: .7rem; line-height: 1.7; color: #b4dce1; }
.field-note > span { width: 24px; height: 1px; flex-shrink: 0; background: #91c1c6; }
.photo { position: relative; display: block; padding: 0; border: 0; text-align: left; cursor: zoom-in; background: transparent; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo__caption { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-top: 1.2rem; color: #c5e0e4; font-size: .6rem; letter-spacing: .17em; text-transform: uppercase; }
.photo__caption > span:last-child { font-size: 1.15rem; }
.photo:focus-visible, .whale__image:focus-visible, .surface-link:focus-visible { outline: 2px solid #b4e6e7; outline-offset: 8px; }
.photo img { transition: filter .5s; }
.photo:hover img { filter: brightness(1.1); }
.reef__copy { margin-left: 17vw; max-width: 39rem; }
.reef__photos { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8svh 8vw; align-items: start; margin-top: 12svh; padding-bottom: 12svh; }
.reef__photo img { height: auto; aspect-ratio: 3 / 2; mask-image: linear-gradient(180deg, transparent, #000 6%, #000 95%, transparent); }
.reef__photo:nth-child(1) { grid-column: 2; grid-row: 1; width: 85%; justify-self: end; }
.reef__photo:nth-child(2) { grid-column: 1; grid-row: 1 / 3; margin-top: 24svh; }
.reef__photo:nth-child(3) { grid-column: 2; grid-row: 2; width: 88%; justify-self: end; }
.chapter__word { position: absolute; bottom: 0; left: 24vw; font-size: 16vw; line-height: 1; color: #c1f0e6; opacity: .08; pointer-events: none; }
.open-water { min-height: 155svh; display: grid; grid-template-columns: 1fr 1fr; gap: 8vw; align-items: center; }
.open-water__label { position: absolute; top: 18svh; left: 25vw; }
.open-water__photo { width: 116%; margin-left: -8%; height: auto; aspect-ratio: 3 / 2; }
.open-water__photo img {
  object-fit: contain;
  opacity: .76;
  filter: saturate(.55) brightness(.85) blur(.35px);
  mask-image: linear-gradient(to right, transparent, #000 24%, #000 78%, transparent), radial-gradient(ellipse at 55% 49%, #000 30%, transparent 73%);
  mask-composite: intersect;
}
.open-water__photo .photo__caption { padding-left: 10%; }
.open-water__copy { padding-top: 24svh; }
.whale { min-height: 190svh; padding-top: 0; }
.whale__stage { position: sticky; top: 12svh; height: 80svh; margin: 0 -7vw; pointer-events: none; }
.whale__image { position: absolute; width: 90vw; height: 80svh; left: 8vw; top: 0; cursor: zoom-in; pointer-events: auto; border: 0; background: transparent; padding: 0; }
.whale__image img { width: 100%; height: 100%; object-fit: cover; mask-image: radial-gradient(ellipse, #000 24%, transparent 70%); opacity: .85; }
.whale__annotation { position: absolute; right: 12vw; bottom: 7svh; }
.whale__copy { margin-top: -4svh; margin-left: 15vw; max-width: 45rem; padding-bottom: 15svh; }
.whale__copy .chapter__body { background: radial-gradient(ellipse at left, #03263c99, transparent); }
.perspective { min-height: 150svh; display: grid; grid-template-columns: 1.2fr .8fr; gap: 7vw; align-items: center; padding-left: 22vw; }
.perspective__copy .chapter__title { font-size: clamp(3.2rem, 5.8vw, 6rem); }
.perspective__signature { margin-top: 2.5rem; display: flex; flex-direction: column; gap: .65rem; }
.perspective__signature .font-display { font-size: 1.65rem; }
.perspective__signature .eyebrow { font-size: .5rem; }
.perspective__photo { width: 100%; height: 65svh; }
.perspective__photo img { mask-image: radial-gradient(ellipse, #000 22%, transparent 71%); }
.perspective__orb { position: absolute; inset: 10% 0; background: radial-gradient(ellipse at 70% 50%, #1c897719, transparent 65%); pointer-events: none; }
.journey-end { min-height: 110svh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 1.5rem 3rem; background: linear-gradient(to bottom, transparent, #0005 40svh, #000d 95svh, #000 140svh); }
.journey-end__wreck { width: calc(100% + 3rem); flex-shrink: 0; }
.journey-end h2 { max-width: 65rem; font-size: clamp(3rem, 6vw, 6rem); line-height: 1.05; margin: 2rem 0; }
.journey-end__disciplines { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin-top: 2.5rem; font-size: .5rem; }
.surface-link { margin-top: 4rem; display: flex; align-items: center; gap: 1.1rem; font-size: .7rem; letter-spacing: .14em; cursor: pointer; }
.surface-link > span { display: grid; place-items: center; border: 1px solid #9fcbd366; border-radius: 50%; width: 3rem; height: 3rem; font-size: 1.2rem; transition: transform .3s; }
.surface-link:hover > span { transform: translateY(-5px); }
.journey-end__footer { margin-top: 12svh; font-size: .48rem; }
.journey-end__footer span { margin: 0 1rem; }
.story-link { display: inline-flex; align-items: center; gap: 1rem; margin-top: 1.6rem; padding-bottom: .4rem; border-bottom: 1px solid #b4dce155; font-size: .75rem; color: #d4e8eb; }
.contact-link { display: inline-flex; gap: 1rem; align-items: center; margin-top: 2.8rem; font-size: 1.8rem; border-bottom: 1px solid #b4dce177; padding-bottom: .45rem; }
.story-link:hover, .contact-link:hover { color: #b4e6e7; }
.story-link:focus-visible, .contact-link:focus-visible { outline: 2px solid #b4e6e7; outline-offset: 6px; }
.model-credits { margin-top: 1.4rem; max-width: 36rem; font-size: .65rem; line-height: 1.9; color: #b4dce1; }
.model-credits summary { cursor: pointer; }
.model-credits p { margin-top: .6rem; }
.model-credits a { text-decoration: underline; text-underline-offset: 3px; }
.full-photo { display: block; width: 100%; max-height: 75svh; object-fit: contain; }
@media (max-width: 800px) {
  .chapter { padding: 32svh 6vw 12svh; }
  .chapter__title { font-size: clamp(3rem, 10vw, 5rem); }
  .reef { min-height: 175svh; }
  .reef__copy { margin-left: 10vw; }
  .reef__photos { column-gap: 5vw; grid-template-columns: 1fr 1.2fr; }
  .open-water { min-height: 165svh; gap: 4vw; }
  .open-water__label { top: 28svh; left: 16vw; }

  .open-water__copy { padding-top: 15svh; }
  .whale { padding-top: 0; }
  .whale__copy { margin-left: 10vw; }
  .whale__image { width: 115vw; left: -5vw; }
  .perspective { padding-left: 12vw; gap: 3vw; }
}
@media (max-width: 560px) {
  .entry { padding-top: 32svh; }
  .entry h2 { font-size: 3rem; }
  .chapter { padding-top: 38svh; }
  .reef { min-height: 185svh; }
  .reef__copy { margin-left: 0; }
  .reef__photos { display: flex; flex-direction: column; gap: 18svh; margin-top: 12svh; }
  .reef__photo:nth-child(1) { width: 78%; align-self: flex-end; }
  .reef__photo:nth-child(2) { width: 82%; margin-top: 0; }
  .reef__photo:nth-child(3) { width: 94%; align-self: flex-end; }
  .chapter__word { bottom: 2svh; left: 15vw; }
  .open-water { display: flex; flex-direction: column; min-height: 165svh; }
  .open-water__label { left: 6vw; top: 32svh; }
  .open-water__photo { width: 116%; height: auto; flex-shrink: 0; margin-left: 0; }
  .open-water__copy { padding-top: 4svh; align-self: flex-start; }
  .whale { padding-top: 0; min-height: 175svh; }
  .whale__stage { top: 25svh; height: 62svh; }
  .whale__image { height: 62svh; width: 140vw; left: -20vw; }
  .whale__copy { margin: 8svh 0 0; }
  .whale__annotation { right: 7vw; bottom: 4svh; font-size: .5rem; }
  .perspective { display: flex; flex-direction: column; min-height: 175svh; padding-left: 6vw; }
  .perspective__photo { height: 48svh; width: 75vw; align-self: flex-end; margin-top: 8svh; }
  .journey-end { padding-top: 0; }
  .journey-end h2 { font-size: 3.2rem; }
}
.is-reduced .whale__stage { position: relative; top: 0; }
.is-reduced .whale__copy { margin-top: 0; }
</style>
