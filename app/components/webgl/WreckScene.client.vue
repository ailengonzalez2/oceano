<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const host = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const hovering = ref(false)
const cursor = reactive({ x: 0, y: 0 })
const reduced = useReducedMotion()
const { t } = useI18n()
let renderer: THREE.WebGLRenderer | undefined
let observer: IntersectionObserver | undefined
let resizeObserver: ResizeObserver | undefined
let model: THREE.Object3D | undefined
let active = false
let started = false
let disposed = false
let frame = 0
let previous = 0
const scene = new THREE.Scene()
scene.background = null
scene.fog = new THREE.FogExp2(0x000000, 0.025)
const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100)
const pointer = new THREE.Vector2(0, 0)
const ray = new THREE.Raycaster()
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const aim = new THREE.Vector3()
const projectedLight = new THREE.Vector3()
let viewportWidth = 1
let viewportHeight = 1
const lamp = new THREE.SpotLight(0xc4e7f2, 200, 60, 0.22, 0.85, 1)
scene.add(lamp, lamp.target)

function disposeModel(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    geometries.add(node.geometry)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value)
      })
    }
  })
  geometries.forEach(value => value.dispose())
  materials.forEach(value => value.dispose())
  textures.forEach((value) => {
    value.dispose()
    if (typeof ImageBitmap !== 'undefined' && value.source.data instanceof ImageBitmap) value.source.data.close()
  })
}

function draw(now: number) {
  frame = 0
  if (!renderer || !active || document.hidden || disposed) return
  const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0.05
  previous = now
  ray.setFromCamera(pointer, camera)
  if (ray.ray.intersectPlane(floor, aim)) {
    lamp.target.position.lerp(aim, reduced.value ? 1 : 1 - Math.exp(-delta * 8))
  }
  // Project the actual smoothed beam, so the lettering follows the torch
  // for pointer, touch and keyboard input alike.
  projectedLight.copy(lamp.target.position).project(camera)
  const radius = Math.tan(lamp.angle) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * viewportHeight / 2
  host.value?.style.setProperty('--beam-x', `${(projectedLight.x + 1) * viewportWidth / 2}px`)
  host.value?.style.setProperty('--beam-y', `${(1 - projectedLight.y) * viewportHeight / 2}px`)
  host.value?.style.setProperty('--beam-radius', `${radius}px`)
  renderer.render(scene, camera)
  if (!reduced.value && ready.value) frame = requestAnimationFrame(draw)
}
function resume() {
  cancelAnimationFrame(frame)
  previous = 0
  if (active && !document.hidden && !disposed) frame = requestAnimationFrame(draw)
}
function resize() {
  if (!renderer || !host.value) return
  const { width, height } = host.value.getBoundingClientRect()
  viewportWidth = width
  viewportHeight = height
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5, 1500 / Math.max(width, height)))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  const distance = camera.aspect < 1 ? 29 : 20
  camera.position.set(0, distance * 0.22, distance)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
  lamp.position.copy(camera.position)
  resume()
}
function move(event: PointerEvent) {
  if (!host.value) return
  const rect = host.value.getBoundingClientRect()
  cursor.x = event.clientX - rect.left
  cursor.y = event.clientY - rect.top
  pointer.set(cursor.x / rect.width * 2 - 1, 1 - cursor.y / rect.height * 2)
  hovering.value = event.pointerType === 'mouse'
  if (reduced.value) resume()
}
function keyMove(event: KeyboardEvent) {
  const directions: Record<string, [number, number]> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }
  const step = directions[event.key]
  if (!step) return
  event.preventDefault()
  pointer.set(THREE.MathUtils.clamp(pointer.x + step[0], -1, 1), THREE.MathUtils.clamp(pointer.y + step[1], -1, 1))
  if (reduced.value) resume()
}
async function load() {
  if (started || disposed) return
  started = true
  try {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/linda_rose.glb')
    if (disposed) {
      disposeModel(gltf.scene)
      return
    }
    model = gltf.scene
    model.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(model)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = 30 / Math.max(size.x, size.z)
    const group = new THREE.Group()
    model.position.sub(center)
    group.add(model)
    group.scale.setScalar(scale)
    group.rotation.y = -Math.PI / 2
    scene.add(group)
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.setRGB(0.8, 0.85, 0.88)
          material.roughness = 1
          material.metalness = 0
          material.emissive.set(0x000000)
        }
      })
    })
    ready.value = true
    resume()
  } catch (error) {
    failed.value = true
    console.warn('[WreckScene] Unable to load wreck', error)
  }
}
function contextLost(event: Event) {
  event.preventDefault()
  cancelAnimationFrame(frame)
}
function contextRestored() {
  resize()
}
onMounted(async () => {
  await nextTick()
  if (!canvas.value || !host.value) return
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true, powerPreference: 'low-power' })
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
    observer = new IntersectionObserver(([entry]) => {
      active = !!entry?.isIntersecting
      if (active) void load()
      resume()
    }, { rootMargin: '300px' })
    observer.observe(host.value)
    document.addEventListener('visibilitychange', resume)
    canvas.value.addEventListener('webglcontextlost', contextLost)
    canvas.value.addEventListener('webglcontextrestored', contextRestored)
    resize()
  } catch { failed.value = true }
})
watch(reduced, resume)
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  observer?.disconnect()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', resume)
  canvas.value?.removeEventListener('webglcontextlost', contextLost)
  canvas.value?.removeEventListener('webglcontextrestored', contextRestored)
  if (model) disposeModel(model)
  renderer?.dispose()
  scene.clear()
})
</script>

<template>
  <div
    ref="host"
    class="wreck"
    :class="{ 'is-ready': ready }"
    tabindex="0"
    role="region"
    :aria-label="t('journey.wreck.instructions')"
    @pointermove="move"
    @pointerdown="move"
    @pointerleave="hovering = false"
    @keydown="keyMove"
  >
    <canvas
      ref="canvas"
      aria-hidden="true"
    />
    <div class="wreck__illuminated-text">
      <slot />
    </div>
    <div class="wreck__caption">
      <p>{{ failed ? t('journey.wreck.unavailable') : ready ? t('journey.wreck.instructions') : t('journey.wreck.loading') }}</p>
    </div>
    <span
      v-if="ready && hovering"
      class="wreck__cursor"
      :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.wreck { position: relative; width: 100%; height: 95svh; min-height: 32rem; background: transparent; outline: none; touch-action: pan-y; }
.wreck:focus-visible { outline: 1px solid #6aa0ae; outline-offset: -3px; }
.wreck canvas { width: 100%; height: 100%; display: block; mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 85%, transparent); }
.wreck__illuminated-text { position: absolute; inset: 0; display: grid; place-items: center; padding: 8svh 7vw; pointer-events: none; opacity: 0; mask-image: radial-gradient(circle var(--beam-radius, 0px) at var(--beam-x, 50%) var(--beam-y, 50%), #000 0%, #000e 20%, #0008 55%, transparent 100%); }
.wreck.is-ready .wreck__illuminated-text { opacity: 1; }
.wreck__caption { position: absolute; bottom: 2.5rem; inset-inline: 1rem; color: #7a949b; pointer-events: none; }
.wreck__caption p { margin-top: .7rem; font-size: .75rem; }
.wreck__cursor { position: absolute; left: 0; top: 0; width: 20px; height: 20px; margin: -10px; border: 1px solid #c4e7f266; border-radius: 50%; pointer-events: none; }
.wreck__cursor::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: #dbf5ff; }
@media (pointer: fine) { .wreck.is-ready { cursor: none; } }
@media (max-width: 640px) { .wreck { height: 80svh; min-height: 28rem; } }
</style>
