<script setup lang="ts">
/**
 * Particles — suspended marine snow / plankton drifting in the water column.
 *
 * Lightweight DOM dots (count kept small) with CSS drift. Used in the deeper
 * zones to sell "suspended particles" and depth. The parent zone can parallax
 * the whole layer; individual dots also drift on their own for life.
 */
withDefaults(defineProps<{ count?: number, color?: string }>(), {
  count: 28,
  color: 'rgba(169, 232, 242, 0.5)'
})
const reduced = useReducedMotion()

// Deterministic pseudo-random so particle positions stay stable across renders.
function rand(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
</script>

<template>
  <div
    class="particles"
    aria-hidden="true"
  >
    <span
      v-for="i in count"
      :key="i"
      class="particle"
      :class="{ still: reduced }"
      :style="{
        'left': rand(i, 1) * 100 + '%',
        'top': rand(i, 2) * 100 + '%',
        'width': (1 + rand(i, 3) * 3) + 'px',
        'height': (1 + rand(i, 3) * 3) + 'px',
        'background': color,
        '--dur': (8 + rand(i, 4) * 10) + 's',
        '--delay': (rand(i, 5) * -12) + 's',
        '--drift': (rand(i, 6) * 30 - 15) + 'px'
      }"
    />
  </div>
</template>

<style scoped>
.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.7;
  animation: float var(--dur) ease-in-out infinite alternate;
  animation-delay: var(--delay);
}
.particle.still { animation: none; }
@keyframes float {
  from { transform: translate(0, 0); opacity: 0.25; }
  to { transform: translate(var(--drift), -24px); opacity: 0.8; }
}
</style>
