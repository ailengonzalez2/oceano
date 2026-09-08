<script setup lang="ts">
import * as THREE from 'three'

// Procedural sea: world-space wave intersections, sky reflection and Fresnel.
// The viewpoint floats just above the local surface, like a swimmer's eyes.
const canvas = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()
const ready = ref(false)
let renderer: THREE.WebGLRenderer | undefined
let geometry: THREE.PlaneGeometry | undefined
let material: THREE.ShaderMaterial | undefined
let observer: IntersectionObserver | undefined
let resizeObserver: ResizeObserver | undefined
let frame = 0
let visible = true
let elapsed = 0
let previous = 0
const pointer = new THREE.Vector2()
const look = new THREE.Vector2()
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uLook: { value: look }
}

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
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
void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  float t = uTime;
  vec3 ro = vec3(t * .035, 0.0, t * -.10);
  ro.y = sea(ro.xz) + .30 + sin(t * .8) * .045;
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
  // Gentle photographic contrast and edge shading, without a photo texture.
  color *= 1.0 - .16 * smoothstep(.35, 1.5, length(vUv - .5) * 2.0);
  color = pow(max(color, vec3(0)), vec3(.93));
  gl_FragColor = vec4(color, 1.0);
}
`

function draw(now: number) {
  frame = 0
  if (!renderer || !visible || document.hidden) return
  const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0
  previous = now
  if (!reduced.value) elapsed += delta
  uniforms.uTime.value = elapsed
  look.lerp(reduced.value ? new THREE.Vector2() : pointer, 0.025)
  renderer.render(scene, camera)
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
  resume()
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

onMounted(() => {
  if (!canvas.value) return
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: false, powerPreference: 'low-power' })
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
    document.addEventListener('pointerleave', resetLook)
    document.addEventListener('visibilitychange', resume)
    canvas.value.addEventListener('webglcontextlost', contextLost)
    canvas.value.addEventListener('webglcontextrestored', contextRestored)
  } catch {
    ready.value = false
    renderer?.dispose()
    renderer = undefined
  }
})
watch(reduced, resume)
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('pointermove', move)
  document.removeEventListener('pointerleave', resetLook)
  document.removeEventListener('visibilitychange', resume)
  canvas.value?.removeEventListener('webglcontextlost', contextLost)
  canvas.value?.removeEventListener('webglcontextrestored', contextRestored)
  geometry?.dispose()
  material?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div
    class="ocean"
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
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: #12606a url('/img/hero.jpg') center / cover;
}
canvas { display: block; width: 100%; height: 100%; opacity: 0; transition: opacity 1s; }
canvas.is-ready { opacity: 1; }
</style>
