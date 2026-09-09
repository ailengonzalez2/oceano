<script setup lang="ts">
/**
 * DepthHUD — the dive computer.
 *
 * Pinned to the viewport for the whole descent. Reads the shared scroll-driven
 * instruments from useScrollDepth (so it never touches scroll math itself) and
 * shows them as live readouts:
 *
 *   Profundidad: 0m → 30m     (increases as you descend)
 *   Temp: 20.0°C → 2.0°C      (decreases with depth)
 *   Progreso: 0% → 100%       (discovery meter)
 *
 * Plus a dive-computer readout block:
 *   Tiempo de inmersión        (a real running clock)
 *   Límite de no descompresión (NDL — shrinks with depth)
 *   Parada de seguridad        (appears once you've gone deep)
 *   Gestión de aire            (tank pressure, warns when low)
 *
 * Also hosts the persistent controls: ES/EN language toggle and an audio mute.
 * A frosted chip keeps everything legible over both the bright surface and the
 * black abyss.
 */
const { t, locale, setLocale } = useI18n()
const { depth, temp, discovery, ndl, safety, air, airLow } = useScrollDepth()
const { diveTime } = useDiveClock()
const { enabled: audioOn, toggle: toggleAudio } = useAudio()
const { scrollTo } = useLenis()

function toggleLang() {
  setLocale(locale.value === 'es' ? 'en' : 'es')
}

// ——— Section nav ———
// Anchors match the id on each zone's root <section>.
const navItems = [
  { id: 'surface', key: 'nav.surface' },
  { id: 'portfolio', key: 'nav.portfolio' },
  { id: 'stories', key: 'nav.stories' },
  { id: 'contact', key: 'nav.contact' }
]
const activeId = ref('surface')

function goTo(id: string) {
  scrollTo('#' + id)
}

// Highlight whichever section is crossing the viewport centre. A narrow
// rootMargin band keeps exactly one item active even with tall zones.
let observer: IntersectionObserver | null = null
onMounted(() => {
  const ratios = new Map<string, number>()
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) ratios.set(e.target.id, e.intersectionRatio)
    let best = activeId.value
    let bestRatio = -1
    for (const item of navItems) {
      const r = ratios.get(item.id) ?? 0
      if (r > bestRatio) {
        bestRatio = r
        best = item.id
      }
    }
    activeId.value = best
  }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-45% 0px -45% 0px' })

  for (const item of navItems) {
    const el = document.getElementById(item.id)
    if (el) observer.observe(el)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    class="hud"
    aria-live="polite"
  >
    <!-- Instruments (top-left) -->
    <div class="hud__computer">
      <div
        class="hud__bezel-label"
        aria-hidden="true"
      >
        OCEANO <span>DIVE COMPUTER</span>
      </div>
      <dl class="hud__instruments">
        <div class="hud__row">
          <dt class="hud__label tracking-hud">
            {{ t('hud.depth') }}
          </dt>
          <dd class="hud__value font-display">
            {{ depth }}<span class="hud__unit">m</span>
          </dd>
        </div>
        <div class="hud__row">
          <dt class="hud__label tracking-hud">
            {{ t('hud.temp') }}
          </dt>
          <dd class="hud__value font-display">
            {{ temp }}<span class="hud__unit">°C</span>
          </dd>
        </div>
        <div class="hud__row">
          <dt class="hud__label tracking-hud">
            {{ t('hud.progress') }}
          </dt>
          <dd class="hud__value font-display">
            {{ discovery }}<span class="hud__unit">%</span>
          </dd>
        </div>
        <!-- Discovery meter -->
        <div
          class="hud__meter"
          aria-hidden="true"
        >
          <div
            class="hud__meter-fill"
            :style="{ width: discovery + '%' }"
          />
        </div>

        <div
          class="hud__divider"
          aria-hidden="true"
        />

        <!-- Dive-computer readouts -->
        <div class="hud__sub-row">
          <dt class="hud__sub-label tracking-hud">
            {{ t('hud.diveTime') }}
          </dt>
          <dd class="hud__sub-value">
            {{ diveTime }}
          </dd>
        </div>
        <div class="hud__sub-row">
          <dt class="hud__sub-label tracking-hud">
            {{ t('hud.ndl') }}
          </dt>
          <dd class="hud__sub-value">
            {{ ndl }}
          </dd>
        </div>
        <div class="hud__sub-row">
          <dt class="hud__sub-label tracking-hud">
            {{ t('hud.safety') }}
          </dt>
          <dd class="hud__sub-value">
            {{ safety }}
          </dd>
        </div>
        <div class="hud__sub-row">
          <dt class="hud__sub-label tracking-hud">
            {{ t('hud.air') }}
          </dt>
          <dd
            class="hud__sub-value"
            :class="{ 'is-warn': airLow }"
          >
            {{ air }}<span class="hud__unit">bar</span>
          </dd>
        </div>
      </dl>
      <div
        class="hud__bezel-grip"
        aria-hidden="true"
      >
        <i /><i /><i />
      </div>
    </div>

    <!-- Controls (top-right) -->
    <div class="hud__controls">
      <!-- Section nav — same frosted-pill UI as the language toggle -->
      <nav
        class="hud__btn hud__nav tracking-hud"
        :aria-label="t('nav.surface')"
      >
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="hud__nav-link"
          :class="{ active: activeId === item.id }"
          :aria-current="activeId === item.id ? 'true' : undefined"
          @click="goTo(item.id)"
        >
          {{ t(item.key) }}
        </button>
      </nav>

      <button
        class="hud__btn tracking-hud"
        type="button"
        :aria-label="t('a11y.langToggle')"
        @click="toggleLang"
      >
        <span :class="{ active: locale === 'es' }">ES</span>
        <span class="hud__sep">/</span>
        <span :class="{ active: locale === 'en' }">EN</span>
      </button>

      <button
        class="hud__btn hud__btn--icon"
        type="button"
        :aria-label="t('a11y.audioToggle')"
        :aria-pressed="audioOn"
        @click="toggleAudio"
      >
        <UIcon
          :name="audioOn ? 'i-lucide-volume-2' : 'i-lucide-volume-x'"
          class="size-4"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.hud {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none; /* let scroll pass through; re-enable on interactive bits */
  font-variant-numeric: tabular-nums;
}

.hud__computer {
  position: fixed;
  top: 1.4rem;
  left: 1.4rem;
  width: 15rem;
  max-width: calc(100vw - 2rem);
  padding: .65rem .65rem .5rem;
  border-radius: 1.6rem;
  border: 1px solid #54717b;
  background: linear-gradient(145deg, #34454d, #14272f 45%, #091c25);
  box-shadow: inset 0 1px 1px #b7d4db55, inset 0 -3px 5px #0008, 0 8px 24px #00131b55;
}
.hud__computer::before,
.hud__computer::after {
  content: '';
  position: absolute;
  right: -.3rem;
  width: .3rem;
  height: 1.6rem;
  border-radius: 0 .2rem .2rem 0;
  background: linear-gradient(90deg, #183039, #6b8a92, #2b424b);
  border: 1px solid #213841;
}
.hud__computer::before { top: 3.6rem; }
.hud__computer::after { bottom: 3.6rem; }
.hud__bezel-label {
  display: flex;
  justify-content: space-between;
  padding: 0 .4rem .55rem;
  font: 500 .47rem / 1.2 ui-monospace, monospace;
  letter-spacing: .2em;
  color: #b0c8cf;
}
.hud__bezel-label span { color: #7f9da7; letter-spacing: .08em; }
.hud__bezel-grip { display: flex; justify-content: center; gap: .22rem; padding-top: .5rem; }
.hud__bezel-grip i { width: 1.2rem; height: 2px; border-radius: 2px; background: #68838b66; }
.hud__instruments {
  display: flex;
  flex-direction: column;
  gap: .55rem;
  margin: 0;
  padding: .9rem .85rem;
  border-radius: .85rem;
  background: linear-gradient(145deg, #102f3c, #041721);
  border: 1px solid #749ca333;
  box-shadow: inset 0 2px 8px #0007, 0 1px 0 #a9e8f21a;
}
.hud__row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: 0.6rem;
}
.hud__label {
  font-size: 0.52rem;
  color: rgba(190, 228, 237, 0.85);
}
.hud__value {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 1.15rem;
  line-height: 1;
  color: #eafbff;
  text-align: right;
  text-shadow: 0 1px 8px rgba(2, 10, 20, 0.5);
}
.hud__row:first-child { padding-bottom: .45rem; border-bottom: 1px solid #a9e8f21c; }
.hud__row:first-child .hud__value { font-size: 2rem; color: #b4f7e5; font-weight: 500; }
.hud__unit {
  font-size: 0.62rem;
  margin-left: 0.12rem;
  color: rgba(169, 232, 242, 0.7);
}
.hud__meter {
  margin-top: 0.3rem;
  height: 3px;
  width: 100%;
  background: rgba(169, 232, 242, 0.15);
  border-radius: 999px;
  overflow: hidden;
}
.hud__meter-fill {
  height: 100%;
  /* width is set inline from discovery% */
  background: linear-gradient(90deg, #5fc8e0, var(--color-biolum));
  transition: width 0.1s linear;
}

/* ——— Dive-computer readout block ——— */
.hud__divider {
  height: 1px;
  margin: 0.25rem 0 0.1rem;
  background: rgba(169, 232, 242, 0.16);
}
.hud__sub-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 0.6rem;
}
.hud__sub-label {
  font-size: 0.46rem;
  line-height: 1.3;
  color: rgba(190, 228, 237, 0.8);
}
.hud__sub-value {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1;
  color: #eafbff;
  white-space: nowrap;
  text-shadow: 0 1px 8px rgba(2, 10, 20, 0.5);
}
.hud__sub-value.is-warn {
  color: #ffc663; /* low-air / reserve warning */
}

.hud__controls {
  position: fixed;
  top: 1.4rem;
  right: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: calc(100vw - 2.8rem);
  pointer-events: auto;
}

/* Section nav — frosted pill matching .hud__btn, links inside like ES/EN */
.hud__nav {
  gap: 1.05rem;
  padding: 0.65rem 1.25rem;
  font-size: 0.74rem;
}
.hud__nav-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: rgba(234, 251, 255, 0.6);
  cursor: pointer;
  transition: color 0.25s ease;
}
.hud__nav-link:hover,
.hud__nav-link:focus-visible {
  color: #eafbff;
  outline: none;
}
.hud__nav-link.active {
  color: var(--color-biolum);
}
.hud__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.8rem;
  font-size: 0.6rem;
  color: rgba(234, 251, 255, 0.7);
  background: rgba(6, 31, 54, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(169, 232, 242, 0.14);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease;
}
.hud__btn:hover,
.hud__btn:focus-visible {
  color: #eafbff;
  border-color: rgba(169, 232, 242, 0.4);
  outline: none;
}
.hud__btn .active {
  color: var(--color-biolum);
}
.hud__sep {
  opacity: 0.4;
}
.hud__btn--icon {
  padding: 0.5rem;
}

/* Tablet: keep the nav but tighten it so it shares the row with ES/EN + audio */
@media (max-width: 1024px) {
  .hud__nav { gap: 0.7rem; padding: 0.55rem 0.9rem; font-size: 0.62rem; }
}

@media (max-width: 640px) {
  .hud__computer { top: 1rem; left: .75rem; width: 14rem; }
  .hud__instruments { padding: .75rem .65rem; gap: .4rem; }
  .hud__row:first-child .hud__value { font-size: 1.7rem; }
  .hud__value { font-size: 1rem; }
  .hud__controls { top: 1rem; right: 1rem; }
  /* The text nav can't fit a phone alongside ES/EN + audio; on phones the
     descent scroll is the primary navigation, so the section nav is hidden here. */
  .hud__nav { display: none; }
}
</style>
