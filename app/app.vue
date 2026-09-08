<script setup lang="ts">
/**
 * App shell — owns the scroll engine and the descent's persistent chrome.
 *
 * No intro gate: the page opens straight on the hero. We start the scroll engine
 * and the dive clock on mount; the HUD stays pinned for the whole dive and
 * NuxtPage holds the 5 zones. Audio remains opt-in via the HUD toggle (never
 * autoplays).
 */
const { t, locale } = useI18n()

const { start, stop } = useLenis()
const { begin: beginDiveClock } = useDiveClock()

useSeoMeta({
  title: () => t('meta.title'),
  description: () => t('meta.description'),
  ogTitle: () => t('meta.title'),
  ogDescription: () => t('meta.description'),
  twitterCard: 'summary_large_image'
})

// Keep <html lang> in sync with the active locale for a11y.
useHead({
  htmlAttrs: { lang: () => locale.value }
})

onMounted(() => {
  start()
  beginDiveClock() // dive time runs from arrival now that there's no gate
})

onBeforeUnmount(() => stop())
</script>

<template>
  <UApp>
    <a
      href="#contenido"
      class="skip-link"
    >{{ t('a11y.skip') }}</a>

    <!-- Persistent HUD: depth / temp / progress + nav + language toggle -->
    <DepthHUD />

    <main id="contenido">
      <NuxtPage />
    </main>
  </UApp>
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: -100px;
  left: 1rem;
  z-index: 100;
  padding: 0.6rem 1rem;
  background: var(--color-biolum);
  color: #020a14;
  border-radius: 0.4rem;
  letter-spacing: 0.08em;
  transition: top 0.2s ease;
}
.skip-link:focus {
  top: 1rem;
}
</style>
