<script setup lang="ts">
import * as THREE from 'three'

/**
 * CausticsCanvas — the ONLY WebGL in the site (hero zone + its transition).
 *
 * A single full-screen fragment shader paints animated underwater caustics and
 * volumetric god rays over a transparent canvas, composited above the hero
 * image. Kept hero-only for performance; the rest of the site uses cheap CSS.
 *
 * Safeguards:
 *   • `.client.vue` → never runs on the server.
 *   • If WebGL is unavailable OR reduced-motion is requested, we tear the canvas
 *     down and show a static CSS caustics fallback instead.
 *   • Pixel ratio capped, and the render loop pauses when the tab is hidden.
 */
const reduced = useReducedMotion()
const canvas = ref<HTMLCanvasElement | null>(null)
const useFallback = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let material: THREE.ShaderMaterial | null = null
let raf = 0
let startTime = 0

// Full-screen quad: position is already in clip space, so no camera math needed.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Caustics = layered, animated Worley-ish noise; god rays = vertical light falloff.
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  // Animated caustic cells (cheap approximation of refracted surface light)
  float caustic(vec2 uv, float t) {
    vec2 p = uv * 6.0;
    float v = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 q = p + vec2(sin(t * 0.6 + fi * 1.3), cos(t * 0.5 + fi)) * 1.2;
      v += abs(sin(q.x + t) * cos(q.y - t * 0.8));
      p *= 1.7;
    }
    v = pow(1.0 - clamp(v / 3.0, 0.0, 1.0), 3.0);
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 cuv = vec2(uv.x * aspect, uv.y);

    // God rays: brightest at the surface (top), fading with depth (down)
    float depthFade = smoothstep(0.0, 1.0, uv.y);
    float rays = pow(uv.y, 1.4);
    rays *= 0.6 + 0.4 * sin(uv.x * 14.0 + uTime * 0.4);

    // Caustic shimmer concentrated near the surface
    float c = caustic(cuv, uTime) * depthFade;

    vec3 light = vec3(0.71, 0.92, 0.97); // surface light tint
    float intensity = c * 0.7 + rays * 0.12;
    intensity *= depthFade;

    gl_FragColor = vec4(light * intensity, intensity * 0.9);
  }
`

function init() {
  if (!canvas.value) return
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  } catch {
    useFallback.value = true
    return
  }

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) }
    }
  })

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  scene.add(quad)

  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)

  startTime = performance.now()
  loop()
}

function resize() {
  if (!renderer || !canvas.value || !material) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight
  renderer.setSize(w, h, false)
  material.uniforms.uResolution.value.set(w, h)
}

function loop() {
  if (!renderer || !scene || !camera || !material) return
  material.uniforms.uTime.value = (performance.now() - startTime) / 1000
  renderer.render(scene, camera)
  raf = requestAnimationFrame(loop)
}

function onVisibility() {
  if (document.hidden) {
    cancelAnimationFrame(raf)
  } else if (renderer) {
    loop()
  }
}

function dispose() {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
  material?.dispose()
  renderer?.dispose()
  renderer = null
}

onMounted(() => {
  // Reduced motion: skip the animated shader entirely, use the static fallback.
  if (reduced.value) {
    useFallback.value = true
    return
  }
  init()
})

onBeforeUnmount(dispose)
</script>

<template>
  <div class="caustics" aria-hidden="true">
    <canvas v-show="!useFallback" ref="canvas" class="caustics__canvas" />
    <!-- CSS fallback: static layered caustic glow -->
    <div v-if="useFallback" class="caustics__fallback" />
  </div>
</template>

<style scoped>
.caustics {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
}
.caustics__canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.caustics__fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 40% at 30% 0%, rgba(234, 251, 255, 0.35), transparent 70%),
    radial-gradient(50% 35% at 70% 5%, rgba(127, 216, 232, 0.25), transparent 70%),
    radial-gradient(40% 30% at 50% 0%, rgba(169, 232, 242, 0.3), transparent 75%);
}
</style>
