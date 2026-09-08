<script setup lang="ts">
/**
 * LightRays — cheap CSS "god rays" for the upper zones.
 *
 * Pure CSS so it costs almost nothing (the expensive WebGL rays live only in the
 * hero). Several skewed light beams shimmer slowly. The parent zone is
 * responsible for any parallax translation via GSAP; this component only paints.
 */
withDefaults(defineProps<{ opacity?: number }>(), { opacity: 0.5 })
const reduced = useReducedMotion()
</script>

<template>
  <div
    class="rays"
    :style="{ opacity }"
    aria-hidden="true"
  >
    <span
      v-for="i in 6"
      :key="i"
      class="ray"
      :class="{ still: reduced }"
      :style="{ '--i': i }"
    />
  </div>
</template>

<style scoped>
.rays {
  position: absolute;
  inset: -10% 0 0 0;
  overflow: hidden;
  pointer-events: none;
  mix-blend-mode: screen;
}
.ray {
  position: absolute;
  top: -20%;
  left: calc(var(--i) * 16% - 10%);
  width: clamp(40px, 8vw, 120px);
  height: 130%;
  background: linear-gradient(
    180deg,
    rgba(234, 251, 255, 0.42),
    rgba(127, 216, 232, 0.12) 45%,
    transparent 80%
  );
  transform: rotate(8deg) skewX(-6deg);
  filter: blur(6px);
  transform-origin: top center;
  animation: sway calc(9s + var(--i) * 1.3s) ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * -1.1s);
}
.ray.still {
  animation: none;
}
@keyframes sway {
  from { transform: rotate(6deg) skewX(-6deg) translateX(-8px); opacity: 0.5; }
  to { transform: rotate(11deg) skewX(-9deg) translateX(14px); opacity: 0.9; }
}
</style>
