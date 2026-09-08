// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n'
  ],

  // SPA mode: Lenis, GSAP ScrollTrigger and Three.js all touch `window` on init.
  // Rendering client-only sidesteps SSR hydration / "window is not defined" issues
  // and suits a non-SEO-critical immersive experience.
  ssr: false,

  // Flat component names regardless of subfolder: ZoneSurface, not ZonesZoneSurface.
  components: [{ path: '~/components', pathPrefix: false }],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // Thin serif headlines (Cormorant) + light spaced sans (Inter)
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@200;300;400;500&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Bilingual ES/EN, default Spanish. `no_prefix` keeps it a single-page URL.
  i18n: {
    defaultLocale: 'es',
    strategy: 'no_prefix',
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    bundle: {
      optimizeTranslationDirective: false
    }
  }
})
