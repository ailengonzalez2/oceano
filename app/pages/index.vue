<template>
  <div class="dive">
    <OceanCanvas />
    <ZoneSurface />
    <DiveJourney />
  </div>
</template>

<style scoped>
.dive {
  position: relative;
  width: 100%;
  isolation: isolate;
  background: none;
  overflow: clip;
}
</style>
