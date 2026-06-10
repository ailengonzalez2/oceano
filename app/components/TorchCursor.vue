<script setup lang="ts">
/**
 * TorchCursor — a light that follows the cursor through the dark.
 *
 * Wraps any content (a near-black photo) in a darkness overlay with a soft
 * transparent "hole" tracking the pointer, so moving across reveals the image
 * like a torch beam in the deep. Works for touch (drag) too.
 *
 * Reduced motion / no-pointer: the overlay lifts so the content is simply
 * visible — no torch, no chasing required.
 */
withDefaults(defineProps<{ radius?: number }>(), { radius: 170 })
const reduced = useReducedMotion()

const root = ref<HTMLElement | null>(null)
const x = ref(50) // % position of the beam
const y = ref(50)
const active = ref(false)

function onMove(e: PointerEvent) {
  if (reduced.value || !root.value) return
  const r = root.value.getBoundingClientRect()
  x.value = ((e.clientX - r.left) / r.width) * 100
  y.value = ((e.clientY - r.top) / r.height) * 100
  active.value = true
}
function onLeave() {
  active.value = false
}
</script>

<template>
  <div
    ref="root"
    class="torch"
    :class="{ 'is-revealed': reduced }"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <slot />
    <div
      class="torch__veil"
      :class="{ active }"
      :style="{
        '--x': x + '%',
        '--y': y + '%',
        '--r': radius + 'px'
      }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.torch {
  position: relative;
  overflow: hidden;
  cursor: none;
}
.torch__veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle var(--r) at var(--x) var(--y),
    transparent 0%,
    rgba(2, 10, 20, 0.6) 45%,
    rgba(2, 10, 20, 0.97) 75%
  );
  transition: background 0.12s ease-out;
}
/* When idle (no pointer yet) keep it mostly dark with a faint center glow */
.torch__veil:not(.active) {
  background: radial-gradient(
    circle calc(var(--r) * 0.7) at 50% 50%,
    rgba(2, 10, 20, 0.55) 0%,
    rgba(2, 10, 20, 0.97) 70%
  );
}
/* Reduced motion / no torch: reveal the content fully */
.torch.is-revealed {
  cursor: auto;
}
.torch.is-revealed .torch__veil {
  background: rgba(2, 10, 20, 0.15);
}
</style>
