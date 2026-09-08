<script setup lang="ts">
import * as THREE from 'three'
import { createDiveLife } from '~/utils/createDiveLife'

// Procedural sea: world-space wave intersections, sky reflection and Fresnel.
// The viewpoint floats just above the local surface, like a swimmer's eyes.
const canvas = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()
const { progress } = useScrollDepth()
const ready = ref(false)
const entry = ref(0)
const fallbackStyle = computed(() => ({
  backgroundColor: `hsl(204 80% ${Math.max(3, 34 - Math.pow(progress.value, 1.7) * 31)}%)`,
  backgroundImage: entry.value < 0.5 ? 'url(/img/hero.jpg)' : 'none'
}))
let life: ReturnType<typeof createDiveLife> | undefined
let renderer: THREE.WebGLRenderer | undefined
let geometry: THREE.PlaneGeometry | undefined
let material: THREE.ShaderMaterial | undefined
let observer: IntersectionObserver | undefined
let resizeObserver: ResizeObserver | undefined
let frame = 0
let visible = true
let elapsed = 0
let previous = 0
let depth = 0
const pointer = new THREE.Vector2()
const look = new THREE.Vector2()
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const uniforms = {
  uTime: { value: 0 },
  uDepth: { value: 0 },
  uEntry: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uLook: { value: look }
}

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uDepth;
uniform float uEntry;
uniform vec2 uResolution;
uniform vec2 uLook;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float sea(vec2 p) {
  float t = uTime;
  float h = sin(dot(p, vec2(.75, .42)) + t * .72) * .24;
  h += sin(dot(p, vec2(-.48, .83)) - t * .58) * .16;
  h += sin(dot(p, vec2(1.7, 1.15)) - t * 1.12) * .065;
  h += sin(dot(p, vec2(-3.1, 2.2)) + t * 1.37) * .028;
  return h;
}
float detail(vec2 p) {
  return sea(p) + (noise(p * 9.0 + uTime * .3) - .5) * .018
    + sin(p.x * 21.0 + sin(p.y * 16.0 + uTime)) * .004;
}
vec3 sky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec3 col = mix(vec3(.72, .84, .84), vec3(.19, .43, .59), pow(y, .48));
  vec3 sun = normalize(vec3(-.65, .32, -1.4));
  float s = max(dot(rd, sun), 0.0);
  col += vec3(1.0, .85, .62) * (pow(s, 380.0) * 1.2 + pow(s, 12.0) * .16);
  vec2 cp = rd.xz / (y + .22) * 3.0;
  float clouds = noise(cp) * .6 + noise(cp * 2.2) * .3 + noise(cp * 4.4) * .1;
  col = mix(col, vec3(.89, .91, .87), smoothstep(.51, .77, clouds) * smoothstep(.0, .15, y) * .55);
  return col;
}
vec3 aboveWater(vec2 uv) {
  float t = uTime;
  vec3 ro = vec3(t * .035, 0.0, t * -.10);
  ro.y = sea(ro.xz) + .30 - min(uEntry, 1.0) * .16 + sin(t * .8) * .045;
  float roll = sin(t * .43) * .012;
  uv = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * uv;
  vec3 rd = normalize(vec3(uv.x + uLook.x * .16, uv.y * .78 + .025 + uLook.y * .055, -1.55));
  vec3 color = sky(rd);
  // Unresolved distant intersections become hazy water, never holes of sky.
  if (rd.y < 0.0) {
    color = mix(vec3(.57, .74, .76), sky(vec3(rd.x, -rd.y, rd.z)) * .72,
                smoothstep(0.0, .12, -rd.y));
  }
  float distance = .035;
  float last = distance;
  bool hit = false;
  // Conservative marching over the bounded wave slopes; refine the crossing.
  for (int i = 0; i < 128; i++) {
    vec3 p = ro + rd * distance;
    float gap = p.y - sea(p.xz);
    if (gap < .002) { hit = true; break; }
    if (distance > 120.0 || (rd.y > .0 && p.y > .55)) break;
    last = distance;
    distance += max(.012, gap * .9 / (.65 + abs(rd.y)));
  }
  if (hit) {
    for (int i = 0; i < 5; i++) {
      float mid = (last + distance) * .5;
      vec3 p = ro + rd * mid;
      if (p.y > sea(p.xz)) last = mid; else distance = mid;
    }
    vec3 p = ro + rd * distance;
    float eps = .012 + distance * .001;
    vec3 n = normalize(vec3(detail(p.xz - vec2(eps,0)) - detail(p.xz + vec2(eps,0)),
                            2.0 * eps,
                            detail(p.xz - vec2(0,eps)) - detail(p.xz + vec2(0,eps))));
    float facing = clamp(dot(n, -rd), 0.0, 1.0);
    float fresnel = .035 + .965 * pow(1.0 - facing, 5.0);
    vec3 reflected = sky(reflect(rd, n));
    vec3 water = mix(vec3(.008, .105, .14), vec3(.025, .31, .32), clamp(p.y * .8 + .45, 0.0, 1.0));
    water += vec3(.025, .12, .105) * pow(1.0 - facing, 2.0);
    color = mix(water, reflected, fresnel);
    vec3 sun = normalize(vec3(-.65, .32, -1.4));
    float sparkle = pow(max(dot(reflect(rd, n), sun), 0.0), 190.0);
    color += vec3(1.0, .88, .65) * sparkle * .85;
    color = mix(color, vec3(.57, .74, .76), 1.0 - exp(-distance * .005));
  }
  return color;
}

vec3 underWater(vec2 uv) {
  float d = uDepth;
  float t = uTime;
  // Keep the first half sunlit; reserve near-darkness for the final descent.
  float darkness = smoothstep(.12, 1.0, pow(d, 1.55));
  float daylight = exp(-pow(d, 2.0) * 3.2);
  // Two slow currents deform the light field, even when scrolling stops.
  vec2 flow = vec2(
    sin(uv.y * 3.2 + t * .42) + sin(uv.x * 2.1 - t * .27),
    cos(uv.x * 2.8 + t * .34) + sin(uv.y * 2.4 - t * .31)
  ) * .035;
  vec2 waterUv = uv + flow;
  float height = clamp(vUv.y + flow.y, 0.0, 1.0);
  vec3 shallow = mix(vec3(.015, .25, .34), vec3(.07, .52, .59), pow(height, 1.25));
  vec3 deep = mix(vec3(.001, .006, .015), vec3(.003, .028, .060), height);
  vec3 color = mix(shallow, deep, darkness);

  // The bright, rippling ceiling recedes upward as the camera descends.
  vec2 ceiling = vec2(waterUv.x, 1.0) / max(.10, height - .35 + d * .3);
  float caustic = sin(ceiling.x * 5.0 + t * .45 + sin(ceiling.y * 3.0 - t * .3));
  caustic *= sin(ceiling.y * 8.0 + t * .7 + sin(ceiling.x * 2.0));
  float surface = pow(height, 5.0 + d * 12.0) * exp(-pow(d, 1.6) * 5.0);
  color += vec3(.14, .48, .46) * surface * (.4 + .6 * pow(abs(caustic), 5.0));

  // Broad shafts fan out from the moving surface, with depth-dependent scattering.
  float shaftCoord = (waterUv.x + .45 - uLook.x * .08) / (1.7 - height);
  float shafts = 0.0;
  for (int i = 0; i < 4; i++) {
    float f = float(i);
    float beam = sin(shaftCoord * (13.0 + f * 8.0) + t * (.15 + f * .025) + f * 2.3);
    shafts += pow(max(beam, 0.0), 12.0 + f * 4.0) / (4.0 + f * 2.0);
  }
  float haze = noise(waterUv * vec2(2.5, 3.5) + vec2(t * .09, d * 12.0 - t * .12));
  color *= 1.0 + (haze - .5) * .16 * daylight;
  color += vec3(.10, .38, .43) * shafts * daylight * (.35 + .65 * vUv.y) * (.6 + haze * .4);
  vec2 lightPos = vec2(-.38 + uLook.x * .06, 1.18 + d * .9);
  color += vec3(.08, .24, .27) * exp(-length(uv - lightPos) * 2.1) * daylight;

  // At depth, a soft diver's torch replaces the vanishing sunlight.
  float torch = exp(-length((uv - uLook * vec2(.65, .35)) * vec2(.85, 1.0)) * 3.0);
  color += vec3(.005, .038, .050) * torch * smoothstep(.7, 1.0, d) * (.8 + haze * .2);
  color += vec3(.0, .008, .016) * haze;
  return color;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  float crossing = smoothstep(.06, .96, uEntry);
  float line = mix(-.22, 1.25, crossing);
  line += (sin(uv.x * 3.8 + uTime * .9) * .035 + sin(uv.x * 9.0 - uTime * 1.1) * .012)
    * sin(crossing * 3.14159);
  float wet = 1.0 - smoothstep(line - .012, line + .012, vUv.y);
  vec3 color;
  // Avoid paying for the expensive ocean intersection once fully submerged.
  if (wet > .999) color = underWater(uv);
  else if (wet < .001) color = aboveWater(uv);
  else color = mix(aboveWater(uv), underWater(uv), wet);
  float lip = exp(-abs(vUv.y - line) * 180.0) * sin(crossing * 3.14159);
  color += vec3(.15, .42, .43) * lip;
  color *= 1.0 - mix(.16, .20 + .18 * pow(uDepth, 1.7), wet) * smoothstep(.3, 1.45, length(vUv - .5) * 2.0);
  gl_FragColor = vec4(pow(max(color, vec3(0)), vec3(.93)), 1.0);
}
`

function draw(now: number) {
  frame = 0
  if (!renderer || !visible || document.hidden) return
  const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0
  previous = now
  if (!reduced.value) elapsed += delta
  depth = reduced.value ? progress.value : THREE.MathUtils.lerp(depth, progress.value, 1 - Math.exp(-delta * 9))
  uniforms.uTime.value = elapsed
  uniforms.uDepth.value = depth
  uniforms.uEntry.value = entry.value
  if (reduced.value) look.set(0, 0)
  else look.lerp(pointer, 1 - Math.exp(-delta * 2))
  renderer.clear()
  renderer.render(scene, camera)
  if (life && entry.value > 0.65) {
    life.update(depth, entry.value, elapsed, look)
    renderer.clearDepth()
    renderer.render(life.scene, life.camera)
  }
  if (!reduced.value) frame = requestAnimationFrame(draw)
}
function resume() {
  cancelAnimationFrame(frame)
  previous = 0
  if (visible && !document.hidden) frame = requestAnimationFrame(draw)
}
function resize() {
  if (!canvas.value || !renderer) return
  const { width, height } = canvas.value.getBoundingClientRect()
  // Bound fragment cost on large/retina displays and phones.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25, 1500 / Math.max(width, height)))
  renderer.setSize(width, height, false)
  uniforms.uResolution.value.set(width, height)
  life?.resize(width, height, renderer.getPixelRatio())
  syncScroll()
  resume()
}
function syncScroll() {
  entry.value = Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 0.95))
  if (reduced.value) resume()
}
function move(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  pointer.set(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2)
}
function resetLook() {
  pointer.set(0, 0)
}
function contextLost(event: Event) {
  event.preventDefault()
  cancelAnimationFrame(frame)
  ready.value = false
}
function contextRestored() {
  ready.value = true
  resume()
}

onMounted(async () => {
  // Nuxt renders `.client.vue` templates only after mount, so the ref is empty until the next tick.
  await nextTick()
  if (!canvas.value) return
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: false, powerPreference: 'low-power' })
    renderer.autoClear = false
    life = createDiveLife()
    material = new THREE.ShaderMaterial({
      uniforms, fragmentShader,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      depthTest: false, depthWrite: false
    })
    geometry = new THREE.PlaneGeometry(2, 2)
    scene.add(new THREE.Mesh(geometry, material))
    resize()
    ready.value = true
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.value)
    observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      resume()
    })
    observer.observe(canvas.value)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', syncScroll, { passive: true })
    document.addEventListener('pointerleave', resetLook)
    document.addEventListener('visibilitychange', resume)
    canvas.value.addEventListener('webglcontextlost', contextLost)
    canvas.value.addEventListener('webglcontextrestored', contextRestored)
  } catch (error) {
    console.error('[OceanCanvas] WebGL init failed, using photo fallback', error)
    ready.value = false
    renderer?.dispose()
    renderer = undefined
  }
})
watch(reduced, resume)
watch(progress, () => {
  if (reduced.value) resume()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('pointermove', move)
  window.removeEventListener('scroll', syncScroll)
  document.removeEventListener('pointerleave', resetLook)
  document.removeEventListener('visibilitychange', resume)
  canvas.value?.removeEventListener('webglcontextlost', contextLost)
  canvas.value?.removeEventListener('webglcontextrestored', contextRestored)
  geometry?.dispose()
  material?.dispose()
  renderer?.dispose()
  life?.dispose()
})
</script>

<template>
  <div
    class="ocean"
    :style="fallbackStyle"
    aria-hidden="true"
  >
    <canvas
      ref="canvas"
      :class="{ 'is-ready': ready }"
    />
  </div>
</template>

<style scoped>
.ocean {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #12606a url('/img/hero.jpg') center / cover;
}
canvas { display: block; width: 100%; height: 100%; opacity: 0; transition: opacity 1s; }
canvas.is-ready { opacity: 1; }
</style>
