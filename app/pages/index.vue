<script setup lang="ts">
/**
 * index.vue — the dive itself.
 *
 * The five depth zones are stacked in descent order over the fixed continuous
 * gradient (defined in main.css). Each zone is self-contained and owns its own
 * GSAP timeline; this page just sequences them. Decorative parallax layers
 * (light rays, particles) live inside the zones they belong to.
 */
</script>

<template>
  <!-- The whole page is one vertical water column, surface → abyss -->
  <div class="dive">
    <ZoneSurface />
    <ZoneEpipelagic />
    <ZoneMesopelagic />
    <ZoneBathyal />
    <ZoneAbyssal />
  </div>
</template>

<style scoped>
.dive {
  position: relative;
  width: 100%;
}
</style>
