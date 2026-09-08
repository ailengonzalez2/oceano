import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** An animated hammerhead encounter in the shark chapter. */
export function createHammerheadShark(scene: THREE.Scene, onReady?: () => void) {
  const root = new THREE.Group()
  root.name = 'Hammerhead encounter'
  root.visible = false
  scene.add(root)
  const wetness = { value: 0 }
  const darkness = { value: 0 }
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.MeshStandardMaterial>()
  const textures = new Set<THREE.Texture>()
  const skeletons = new Set<THREE.Skeleton>()
  let encounter: { group: THREE.Group, mixer: THREE.AnimationMixer, model: THREE.Object3D } | undefined
  let swimTime = 5
  let started = false
  let section: HTMLElement | null = null
  let twilight: HTMLElement | null = null
  let previousTime: number | undefined
  let disposed = false
  const path = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-12, 2, -15),
    new THREE.Vector3(10, 2, -15),
    new THREE.Vector3(0, 1, -10),
    new THREE.Vector3(0, -0.4, 8)
  )
  const position = new THREE.Vector3()
  const tangent = new THREE.Vector3()

  function track(model: THREE.Object3D) {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton)
      const list = Array.isArray(object.material) ? object.material : [object.material]
      list.forEach((material: THREE.MeshStandardMaterial) => {
        materials.add(material)
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value)
        })
      })
    })
  }

  function releaseResources() {
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    skeletons.forEach(skeleton => skeleton.dispose())
    textures.forEach((texture) => {
      texture.dispose()
      if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close()
    })
    geometries.clear()
    materials.clear()
    skeletons.clear()
    textures.clear()
  }

  async function load() {
    try {
      const gltf = await new GLTFLoader().loadAsync('/models/hammerhead_shark.glb')
      track(gltf.scene)
      if (disposed) {
        releaseResources()
        return
      }
      materials.forEach((material) => {
        material.emissiveIntensity = 0.08
        material.transparent = true
        material.depthWrite = true
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uSchoolWet = wetness
          shader.uniforms.uSchoolDepth = darkness
          shader.vertexShader = `varying float vSchoolDistance; varying float vSharkViewDepth;\n${shader.vertexShader}`
          shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvSchoolDistance = length(mvPosition.xyz); vSharkViewDepth = -mvPosition.z;')
          shader.fragmentShader = `uniform float uSchoolWet; uniform float uSchoolDepth; varying float vSchoolDistance; varying float vSharkViewDepth;\n${shader.fragmentShader}`
          shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
            // Local water lighting uses the model's normal maps without adding
            // scene lights that would change the existing coral materials.
            float fishLight = .4 + .6 * max(dot(normal, normalize(vec3(-.4, .7, .8))), 0.0);
            outgoingLight = diffuseColor.rgb * fishLight * exp(-uSchoolDepth * 2.0);
            outgoingLight = mix(outgoingLight, vec3(.006, .035, .055), 1.0 - exp(-vSchoolDistance * .026));
            diffuseColor.a *= smoothstep(0.4, 2.5, vSharkViewDepth) * uSchoolWet * (1.0 - smoothstep(24.0, 38.0, vSchoolDistance));
            #include <opaque_fragment>
          `)
        }
        material.customProgramCacheKey = () => 'hammerhead-water-v2'
      })
      gltf.scene.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(gltf.scene)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const scale = 10 / Math.max(size.x, size.y, size.z)
      const model = gltf.scene
      const pivot = new THREE.Group()
      model.position.sub(center)
      pivot.add(model)
      pivot.scale.setScalar(scale)
      const group = new THREE.Group()
      group.add(pivot)
      group.visible = false
      root.add(group)
      model.traverse((object) => {
        if (object instanceof THREE.SkinnedMesh) {
          object.frustumCulled = false // Animated fins and bones leave the rest-pose bounds.
          skeletons.add(object.skeleton)
        }
      })
      const mixer = new THREE.AnimationMixer(model)
      gltf.animations.forEach(clip => mixer.clipAction(clip).play())
      encounter = { group, model, mixer }
      onReady?.()
    } catch (error) {
      if (!disposed) console.warn('[HammerheadShark] Model unavailable; other marine life remains active', error)
    }
  }

  return {
    resize(width: number, height: number) {
      const span = Math.max(5, Math.min(13, width / height * 7))
      path.v0.x = -span
      path.v1.x = span * 0.8
      path.v2.x = 0
    },
    update(depth: number, wet: number, time: number) {
      section ??= document.getElementById('open-water')
      twilight ??= document.getElementById('stories')
      const delta = previousTime === undefined ? 0 : Math.min(0.05, Math.max(0, time - previousTime))
      previousTime = time
      const height = window.innerHeight
      const top = section?.getBoundingClientRect().top ?? Infinity
      const end = twilight?.getBoundingClientRect().top ?? Infinity
      if (!started && wet > 0 && top < height * 2 && end > 0) {
        started = true
        void load()
      }
      const arrival = 1 - THREE.MathUtils.smoothstep(top / height, 0.2, 0.95)
      const departure = THREE.MathUtils.smoothstep(end / height, 0.5, 1.05)
      const visibility = wet * arrival * departure
      wetness.value = visibility
      darkness.value = depth
      root.visible = visibility > 0 && !!encounter
      if (encounter && root.visible) {
        swimTime += delta
        // Cross the chapter, turn toward the viewer, then pass the camera.
        // Restart only once the entire shark has left the view, with a short pause.
        const pass = Math.floor(swimTime / 32)
        const progress = Math.min(1, (swimTime % 32) / 27)
        const direction = pass % 2 ? -1 : 1
        path.getPoint(progress, position)
        path.getTangent(progress, tangent)
        encounter.group.position.set(position.x * direction, -depth * 82 + position.y, position.z)
        encounter.group.rotation.set(
          -Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z)),
          Math.atan2(tangent.x * direction, tangent.z),
          Math.sin(progress * Math.PI) * direction * 0.035,
          'YXZ'
        )
        encounter.group.visible = progress < 1
        encounter.mixer.setTime(swimTime * 0.75)
      }
    },
    dispose() {
      disposed = true
      if (encounter) {
        encounter.mixer.stopAllAction()
        encounter.mixer.uncacheRoot(encounter.model)
      }
      releaseResources()
      root.clear()
      scene.remove(root)
    }
  }
}
