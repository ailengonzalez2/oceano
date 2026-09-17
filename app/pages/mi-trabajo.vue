<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { scrollTo, setLocked } = useLenis()
const instagram = 'https://www.instagram.com/oceanomartina/'
// Provisional local imagery; replace these entries when Martina's selection arrives.
const photographs = [
  { src: '/img/shark-front.jpg', key: 'shark', shape: 'wide' },
  { src: '/img/reef.jpg', key: 'coral', shape: 'portrait' },
  { src: '/img/turtle.jpg', key: 'turtle', shape: 'portrait' },
  { src: '/img/whale.jpg', key: 'whale', shape: 'wide' },
  { src: '/img/jellyfish.jpg', key: 'jellyfish', shape: 'wide' },
  { src: '/img/kelp.jpg', key: 'kelp', shape: 'wide' }
]
const dialog = ref<HTMLDialogElement | null>(null)
const selected = ref(0)
const current = computed(() => photographs[selected.value]!)
function openPhoto(index: number) {
  selected.value = index
  dialog.value?.showModal()
  setLocked(true)
}
function step(direction: number) {
  selected.value = (selected.value + direction + photographs.length) % photographs.length
}
onBeforeUnmount(() => {
  if (dialog.value?.open) setLocked(false)
})
useSeoMeta({ title: () => t('work.meta'), description: () => t('work.intro') })
</script>

<template>
  <div class="work-page">
    <header class="work-header">
      <NuxtLink
        to="/"
        class="work-brand font-display"
      >Martina Álvarez</NuxtLink>
      <nav :aria-label="t('nav.work')">
        <NuxtLink to="/">{{ t('work.back') }}</NuxtLink>
        <NuxtLink
          to="/mi-trabajo"
          aria-current="page"
        >{{ t('nav.work') }}</NuxtLink>
        <a
          :href="instagram"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('work.contact') }} ↗</a>
        <button
          type="button"
          :aria-label="t('a11y.langToggle')"
          @click="setLocale(locale === 'es' ? 'en' : 'es')"
        >
          {{ locale.toUpperCase() }} / {{ locale === 'es' ? 'EN' : 'ES' }}
        </button>
      </nav>
    </header>

    <section class="work-hero">
      <img
        src="/img/hero.jpg"
        alt=""
        fetchpriority="high"
        class="work-hero__image"
      >
      <div class="work-hero__content">
        <p class="work-label">
          {{ t('work.eyebrow') }}
        </p>
        <h1 class="font-display">
          {{ t('work.title') }}<br><em>{{ t('work.titleEm') }}</em>
        </h1>
        <p class="work-hero__intro">
          {{ t('work.intro') }}
        </p>
        <a
          href="#seleccion"
          class="work-link"
          @click.prevent="scrollTo('#seleccion')"
        >{{ t('work.explore') }} <span aria-hidden="true">↓</span></a>
      </div>
      <span
        class="work-hero__index"
        aria-hidden="true"
      >OCEANO / PORTFOLIO</span>
    </section>

    <section
      id="seleccion"
      class="work-selection work-container"
    >
      <div class="work-section-heading">
        <p class="work-label">
          {{ t('work.selected') }}
        </p>
        <h2 class="font-display">
          {{ t('work.galleryTitle') }}
        </h2>
        <p>{{ t('work.galleryIntro') }}</p>
        <small>{{ t('work.preview') }}</small>
      </div>
      <div class="work-gallery">
        <figure
          v-for="(photo, index) in photographs"
          :key="photo.key"
          :class="['work-photo', `work-photo--${photo.shape}`]"
        >
          <button
            type="button"
            :aria-label="`${t('work.open')}: ${t(`work.${photo.key}`)}`"
            @click="openPhoto(index)"
          >
            <img
              :src="photo.src"
              :alt="t(`work.${photo.key}`)"
              loading="lazy"
              decoding="async"
              width="1400"
              height="1000"
            >
            <span
              class="work-photo__expand"
              aria-hidden="true"
            >↗</span>
          </button>
          <figcaption><span>{{ t(`work.${photo.key}`) }}</span><span>0{{ index + 1 }}</span></figcaption>
        </figure>
      </div>
    </section>

    <section class="work-sharks">
      <div class="work-container work-split">
        <figure class="work-sharks__image">
          <img
            src="/img/shark-front.jpg"
            :alt="t('work.shark')"
            loading="lazy"
            width="1920"
            height="1280"
          >
        </figure>
        <div class="work-copy">
          <p class="work-label">
            {{ t('work.specialty') }}
          </p>
          <h2 class="font-display">
            {{ t('work.specialtyTitle') }}<br><em>{{ t('work.specialtyEm') }}</em>
          </h2>
          <p>{{ t('work.specialtyBody') }}</p>
          <a
            :href="instagram"
            class="work-link"
            target="_blank"
            rel="noopener noreferrer"
          >{{ t('work.instagram') }} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>

    <section class="work-container work-practice">
      <div class="work-copy">
        <p class="work-label">
          {{ t('work.practice') }}
        </p>
        <h2 class="font-display">
          {{ t('work.practiceTitle') }}<br><em>{{ t('work.practiceEm') }}</em>
        </h2>
        <p>{{ t('work.practiceBody') }}</p>
      </div>
      <div class="work-services">
        <article
          v-for="(service, index) in ['photo', 'film', 'travel']"
          :key="service"
        >
          <span class="work-label">0{{ index + 1 }}</span>
          <div>
            <h3 class="font-display">
              {{ t(`work.${service}Title`) }}
            </h3><p>{{ t(`work.${service}Body`) }}</p>
          </div>
        </article>
      </div>
    </section>

    <footer class="work-footer">
      <div class="work-container">
        <p class="work-label">
          MARTINA ÁLVAREZ / OCEANO
        </p>
        <h2 class="font-display">
          {{ t('work.footerTitle') }}
        </h2>
        <p>{{ t('work.footerBody') }}</p>
        <a
          :href="instagram"
          class="work-link"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('work.footerLink') }} <span aria-hidden="true">↗</span></a>
        <div class="work-footer__bottom">
          <span>{{ t('work.rights') }}</span><NuxtLink to="/">{{ t('work.back') }} ↑</NuxtLink>
        </div>
      </div>
    </footer>

    <dialog
      ref="dialog"
      class="work-lightbox"
      :aria-label="t('work.open')"
      data-lenis-prevent
      @close="setLocked(false)"
      @click="($event.target === dialog) && dialog?.close()"
      @keydown.left.prevent="step(-1)"
      @keydown.right.prevent="step(1)"
    >
      <button
        class="work-lightbox__close"
        type="button"
        :aria-label="t('work.close')"
        @click="dialog?.close()"
      >
        ×
      </button>
      <img
        :src="current.src"
        :alt="t(`work.${current.key}`)"
      >
      <div class="work-lightbox__nav">
        <button
          type="button"
          :aria-label="t('work.previous')"
          @click="step(-1)"
        >
          ←
        </button>
        <p aria-live="polite">
          {{ t(`work.${current.key}`) }} <span>{{ selected + 1 }} / {{ photographs.length }}</span>
        </p>
        <button
          type="button"
          :aria-label="t('work.next')"
          @click="step(1)"
        >
          →
        </button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.work-page { background: #041923; color: #eafbff; }
.work-container { width: min(1180px, 86%); margin-inline: auto; }
.work-header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding: 1.6rem 4%; background: #041923; border-bottom: 1px solid #a9e8f21c; }
.work-brand { font-size: 1.8rem; font-style: italic; white-space: nowrap; }
.work-header nav { display: flex; gap: 2rem; align-items: center; font-size: .65rem; letter-spacing: .07em; }
.work-header nav [aria-current] { color: #a9e8f2; border-bottom: 1px solid #a9e8f2; padding-bottom: .3rem; }
.work-header button { cursor: pointer; }
.work-hero { position: relative; min-height: 660px; display: flex; align-items: center; overflow: hidden; background: #073246; }
.work-hero__image { position: absolute; width: 100%; height: 100%; inset: 0; object-fit: cover; object-position: 50% 75%; opacity: .5; }
.work-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #032538e8, #03253850 75%), linear-gradient(0deg, #041923, transparent 65%); }
.work-hero__content { position: relative; z-index: 1; width: min(1180px, 86%); margin: 5rem auto 7rem; }
.work-label { color: #a9d5dc; letter-spacing: .2em; font-size: .62rem; line-height: 1.8; }
h1 { font-size: clamp(3.6rem, 6.6vw, 6.9rem); line-height: 1; max-width: 960px; margin: 1.8rem 0; }
em { color: #b5e0e5; font-weight: inherit; }
.work-hero__intro { max-width: 450px; font-size: .9rem; line-height: 1.9; color: #d1e3e9; }
.work-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 2.5rem; border: 1px solid #aedbe260; border-radius: 999px; padding: .95rem 1.65rem; margin-top: 2rem; font-size: .7rem; transition: background .2s; }
.work-link:hover { background: #a9e8f215; }
.work-hero__index { position: absolute; z-index: 1; right: 4%; bottom: 2.4rem; font-size: .55rem; letter-spacing: .22em; color: #acd2dc; }
.work-section-heading { text-align: center; max-width: 660px; margin: 0 auto 4rem; }
h2 { font-size: clamp(2.8rem, 4vw, 4rem); line-height: 1.07; margin: 1.2rem 0 1.5rem; }
.work-section-heading > p:not(.work-label), .work-copy > p:not(.work-label) { font-size: .88rem; line-height: 1.95; color: #b7ccd5; }
.work-section-heading small { display: block; margin-top: 1.6rem; font-size: .64rem; color: #86a7b4; }
.work-selection { padding-block: 7rem 9rem; scroll-margin-top: 2rem; }
.work-gallery { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: 3rem; row-gap: 4rem; align-items: start; }
.work-photo { grid-column: span 6; margin: 0; }
.work-photo:first-child { grid-column: span 8; }
.work-photo:nth-child(2) { grid-column: span 4; margin-top: 5rem; }
.work-photo:nth-child(3) { grid-column: span 4; }
.work-photo:nth-child(4) { grid-column: span 8; margin-top: 5rem; }
.work-photo:nth-child(6) { margin-top: 4rem; }
.work-photo button { display: block; width: 100%; position: relative; overflow: hidden; cursor: zoom-in; }
.work-photo img { width: 100%; aspect-ratio: 1.5; height: auto; object-fit: cover; transition: transform .6s; }
.work-photo--portrait img { aspect-ratio: .72; }
.work-photo button:hover img { transform: scale(1.025); }
.work-photo__expand { position: absolute; bottom: 1rem; right: 1rem; display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #fff5; border-radius: 50%; background: #04192366; }
.work-photo figcaption { display: flex; justify-content: space-between; padding-top: 1rem; color: #a9c7d2; font-size: .67rem; letter-spacing: .04em; }
.work-photo figcaption span:last-child { color: #7395a5; }
.work-sharks { padding-block: 6rem; background: linear-gradient(130deg, #082c40, #051e2d); }
.work-split { display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; gap: 7%; }
.work-sharks__image { margin: 0; }
.work-sharks__image img { width: 100%; aspect-ratio: .95; height: auto; object-fit: cover; object-position: 55%; }
.work-copy h2 { font-size: clamp(2.8rem, 3.7vw, 4.1rem); }
.work-practice { display: grid; grid-template-columns: 1fr 1fr; gap: 10%; padding-block: 8rem; align-items: center; }
.work-services article { display: flex; gap: 1.8rem; padding: 1.7rem 0; border-top: 1px solid #9dced22b; }
.work-services h3 { font-size: 1.9rem; line-height: 1.2; margin-bottom: .6rem; }
.work-services p { color: #b7ccd5; font-size: .8rem; line-height: 1.8; }
.work-footer { padding-top: 6rem; background: radial-gradient(ellipse at top, #0a3545, #020a14 75%); text-align: center; }
.work-footer > div > p:not(.work-label) { color: #b7ccd5; font-size: .85rem; }
.work-footer__bottom { display: flex; justify-content: space-between; gap: 1.5rem; text-align: left; padding-block: 2rem; margin-top: 6rem; border-top: 1px solid #a9e8f222; font-size: .65rem; color: #a2becb; }
.work-page :is(a, button):focus-visible { outline: 2px solid #a9e8f2; outline-offset: 5px; }
.work-lightbox { position: fixed; inset: 0; margin: auto; width: min(1100px, 94vw); max-height: 94svh; padding: 3.2rem 1.2rem 1rem; border: 1px solid #a9e8f22b; background: #031520; color: #eafbff; }
.work-lightbox::backdrop { background: #01080fef; }
.work-lightbox > img { display: block; width: 100%; height: 72svh; object-fit: contain; }
.work-lightbox__close { position: absolute; top: .3rem; right: .6rem; font-size: 2rem; width: 44px; height: 44px; cursor: pointer; }
.work-lightbox__nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1rem; }
.work-lightbox__nav button { width: 44px; height: 44px; cursor: pointer; }
.work-lightbox__nav p { font-size: .75rem; text-align: center; }
.work-lightbox__nav span { margin-left: 1rem; color: #94b7c6; }
@media (max-width: 760px) {
  .work-header { flex-wrap: wrap; padding: 1.2rem 7%; gap: 1rem; }
  .work-header nav { gap: 1.2rem; flex-wrap: wrap; font-size: .6rem; }
  .work-hero { min-height: 590px; }
  .work-hero__content { margin-block: 4rem 6rem; }
  .work-gallery { gap: 2rem 1.2rem; }
  .work-photo:first-child, .work-photo:nth-child(4) { grid-column: span 12; }
  .work-photo:nth-child(2), .work-photo:nth-child(3) { grid-column: span 6; margin-top: 0; }
  .work-photo:nth-child(4) { margin-top: 0; }
  .work-photo:nth-child(6) { margin-top: 2rem; }
  .work-photo figcaption { font-size: .6rem; }
  .work-selection { padding-block: 4.5rem; }
  .work-split, .work-practice { grid-template-columns: 1fr; gap: 3rem; }
  .work-sharks { padding-block: 3rem; }
  .work-sharks__image img { aspect-ratio: 1.2; }
  .work-practice { padding-block: 4rem; }
  .work-footer__bottom { flex-direction: column; text-align: center; align-items: center; }
}
</style>
