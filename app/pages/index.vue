<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <!-- The whole page is one vertical water column, surface → abyss -->
  <div class="dive">
    <OceanCanvas />
    <ZoneSurface />
    <div class="dive__entry">
      <p class="font-display">
        {{ t('surface.descent') }}
      </p>
      <span aria-hidden="true" />
    </div>
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
  isolation: isolate;
  background: none;
}
.dive__entry {
  position: relative;
  z-index: 5;
  height: 85svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  text-align: center;
  font-size: clamp(1.7rem, 4vw, 3rem);
  text-shadow: 0 2px 25px #022d46;
}
.dive__entry span {
  width: 1px;
  height: 100px;
  background: linear-gradient(#a9e8f2, transparent);
}
</style>
