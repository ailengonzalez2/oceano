<script setup lang="ts">
const { t } = useI18n()
const sunset = useState('ocean-sunset', () => false)
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="sunset"
    :aria-label="t('surface.sunsetToggle')"
    class="light-switch"
    @click="sunset = !sunset"
  >
    <span :class="{ 'is-active': !sunset }">{{ t('surface.day') }}</span>
    <span
      class="light-switch__track"
      aria-hidden="true"
    ><span /></span>
    <span :class="{ 'is-active': sunset }">{{ t('surface.sunset') }}</span>
  </button>
</template>

<style scoped>
.light-switch {
  position: fixed;
  right: clamp(1.2rem, 4vw, 4rem);
  bottom: max(3.2rem, env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  align-items: center;
  gap: .75rem;
  min-height: 44px;
  padding: .6rem 1rem;
  border: 1px solid #eafbff40;
  border-radius: 999px;
  background: #071e2b85;
  backdrop-filter: blur(12px);
  color: #d8e6ec;
  font-size: .65rem;
  letter-spacing: .08em;
  cursor: pointer;
}
.light-switch .is-active { color: #fff3dc; }
.light-switch:focus-visible { outline: 2px solid #fff3dc; outline-offset: 5px; }
.light-switch__track {
  width: 34px;
  height: 20px;
  padding: 3px;
  border-radius: 999px;
  background: #5b96a7;
  transition: background .4s;
}
.light-switch__track > span {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff3dc;
  transition: transform .4s;
}
.light-switch[aria-checked="true"] .light-switch__track { background: #bd744f; }
.light-switch[aria-checked="true"] .light-switch__track > span { transform: translateX(14px); }
@media (max-width: 640px) {
  .light-switch { bottom: calc(1rem + env(safe-area-inset-bottom)); right: 1rem; white-space: nowrap; }
}
@media (prefers-reduced-motion: reduce) {
  .light-switch__track, .light-switch__track > span { transition: none; }
}
</style>
