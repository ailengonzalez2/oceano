# Océano — immersive descent portfolio

A single-page, scroll-driven immersive website for a marine photographer &
underwater documentarian. Scrolling **is a dive**: the page descends from the
sunlit surface to the pitch-black abyss across five depth zones, with the
portfolio photography as the protagonist.

Built with **Nuxt 4 (SPA) · Nuxt UI 4 · Tailwind CSS v4 · GSAP + ScrollTrigger ·
Lenis · Three.js · @nuxtjs/i18n** (bilingual ES/EN, default Spanish).

## Run

```bash
npm install
npm run dev      # → http://localhost:3000
```

> **macOS note:** `dev` runs as `TMPDIR=/tmp nuxt dev`. This sidesteps a Nuxt 4.4
> bug where the vite-node unix-socket path under the long default `$TMPDIR`
> (`/var/folders/…`) exceeds the OS socket-path limit and crashes on boot.

```bash
npm run build    # production build (client + node server)
npm run preview  # preview the build
```

## The five depth zones

| # | Component | Zone | Role | Behaviour |
|---|-----------|------|------|-----------|
| 01 | `ZoneSurface` | Surface | Hero: name + tagline + hero photo | WebGL god rays + caustics, press-and-hold reveal |
| 02 | `ZoneEpipelagic` | Epipelagic | Portfolio grid | Parallax + scroll reveal |
| 03 | `ZoneMesopelagic` | Mesopelagic | Documentary stories | Pinned full-bleed photo + editorial, particles |
| 04 | `ZoneBathyal` | Bathyal | About / bio | B/W portrait revealed by a torch-cursor |
| 05 | `ZoneAbyssal` | Abyssal | Contact | Bioluminescent glowing CTA on black |

The continuous depth gradient (surface → abyss) is a single fixed background in
`app/assets/css/main.css`; the zones scroll over it and cross-fade.

## How the dive works

- **`useLenis`** — Lenis momentum scrolling wired to GSAP ScrollTrigger so every
  pinned/parallax timeline stays in sync. Reduced-motion users get native scroll.
- **`useScrollDepth`** — maps global scroll progress (0→1) to the HUD instruments:
  depth `0→1000 m`, temp `20→2 °C`, discovery `0→100 %`. **Tune the dive** by
  editing `MAX_DEPTH`, `SURFACE_TEMP`, `ABYSS_TEMP` at the top of that file.
- **`useReducedMotion`** — single source of truth; every zone disables its
  parallax/pinning and the shader when `prefers-reduced-motion: reduce`.
- **`useAudio`** — opt-in ambient sound. **OFF by default, never autoplays**;
  only starts from a user gesture (loader opt-in or HUD toggle).

Each zone's GSAP timeline is commented inline so the depth↔scroll mapping is easy
to retune.

## Customising

- **Copy / translations:** `i18n/locales/es.json` and `en.json`. Default `es`.
- **Photographer name, tagline, stats, email, Instagram:** in the locale files
  and `ZoneAbyssal.vue` (`PHOTOGRAPHER_EMAIL`, `INSTAGRAM_URL`).
- **Photos:** curated ocean / marine-life images live in `public/img/`
  (`hero`, `fish`, `reef`, `turtle`, `kelp`, `jellyfish`, `shark`, `whale`,
  `coral`, `biolum`, `portrait`). Each zone passes a `src` to `PlaceholderPhoto`,
  which renders it at the right aspect ratio over a "FOTO" fallback block; the
  hero is `eager`, the rest lazy-load. Replace the files in `public/img/` with the
  photographer's real shots (same names) and the layout is unchanged. Current
  placeholders are free-licensed photos from Wikimedia Commons.
- **Palette tokens:** `app/assets/css/main.css` (`@theme`). The bioluminescent
  accent `--color-biolum` (#3FE0BC) is reserved for the abyssal zone + CTAs.
- **Ambient audio track:** `AMBIENT_SRC` in `app/composables/useAudio.ts`.

## Performance & accessibility

- WebGL is **hero-only** (`CausticsCanvas.client.vue`); the rest is cheap CSS/GSAP
  parallax. Pixel ratio capped; the shader pauses when the tab is hidden.
- Lazy-loaded images, semantic landmarks, alt text, keyboard-navigable loader /
  CTA / toggles, visible focus states, a skip link, and a full reduced-motion
  fallback (calm vertical scroll, simple fades, no shader/audio).
