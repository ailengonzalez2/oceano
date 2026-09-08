<script setup lang="ts">
/**
 * PlaceholderPhoto — stand-in for the photographer's real imagery.
 *
 * Renders at the correct aspect ratio so layouts are final even without final
 * assets. Shows a curated ocean / marine-life photo from `/public/img` (local,
 * so no runtime network dependency), lazy-loaded by default (the hero passes
 * `eager`), over an ocean-tinted gradient block labelled "FOTO" that covers the
 * load-in and any failure. Pass `grayscale` for the dark bathyal B/W treatment.
 * Swap the files in /public/img for the photographer's real shots for production.
 */
withDefaults(defineProps<{
  /** Image URL — typically a local /img/*.jpg asset. */
  src: string
  w: number
  h: number
  label?: string
  alt: string
  eager?: boolean
  grayscale?: boolean
}>(), {
  label: 'FOTO',
  eager: false,
  grayscale: false
})

const loaded = ref(false)
const failed = ref(false)
</script>

<template>
  <figure
    class="ph"
    :style="{ aspectRatio: `${w} / ${h}` }"
  >
    <div class="ph__block">
      <span class="ph__tag tracking-hud">{{ label }}</span>
    </div>
    <img
      v-if="!failed"
      :src="src"
      :alt="alt"
      class="ph__img"
      :class="{ loaded, grayscale }"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      @load="loaded = true"
      @error="failed = true"
    >
    <figcaption
      v-if="$slots.caption"
      class="ph__caption"
    >
      <slot name="caption" />
    </figcaption>
  </figure>
</template>

<style scoped>
.ph {
  position: relative;
  width: 100%;
  margin: 0;
  overflow: hidden;
  background: linear-gradient(160deg, #0a3a5c, #061f36);
  border-radius: 2px;
}
.ph__block {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(127, 216, 232, 0.12), transparent 60%),
    linear-gradient(160deg, #125a87, #0a3a5c);
}
.ph__tag {
  font-size: 0.62rem;
  color: rgba(169, 232, 242, 0.45);
}
.ph__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.8s ease;
}
.ph__img.loaded {
  opacity: 1;
}
.ph__img.grayscale {
  filter: grayscale(1) contrast(1.05);
}
.ph__caption {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 1.4rem 1.1rem 0.9rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: rgba(234, 251, 255, 0.85);
  background: linear-gradient(transparent, rgba(2, 10, 20, 0.7));
}
</style>
