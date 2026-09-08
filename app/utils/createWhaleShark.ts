import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** A large animated whale shark greeting the visitor directly below the surface. */
export function createWhaleShark(scene: THREE.Scene, onReady?: () => void) {
  const root = new THREE.Group()
  root.name = 'Whale shark encounter'
  root.visible = false
  scene.add(root)
  const wetness = { value: 0 }
  const darkness = { value: 0 }
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.MeshStandardMaterial>()
  const textures = new Set<THREE.Texture>()
  const skeletons = new Set<THREE.Skeleton>()
  let encounter: { group: THREE.Group, mixer: THREE.AnimationMixer, model: THREE.Object3D } | undefined
  let swimTime = 7
  let previousTime: number | undefined
  let disposed = false
  let aspect = 1.5

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
      const gltf = await new GLTFLoader().loadAsync('/models/whale_shark.glb')
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
          shader.vertexShader = `varying float vSchoolDistance;\n${shader.vertexShader}`
          shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvSchoolDistance = length(mvPosition.xyz);')
          shader.fragmentShader = `uniform float uSchoolWet; uniform float uSchoolDepth; varying float vSchoolDistance;\n${shader.fragmentShader}`
          shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
            // Local water lighting uses the model's normal maps without adding
            // scene lights that would change the existing coral materials.
            float fishLight = .4 + .6 * max(dot(normal, normalize(vec3(-.4, .7, .8))), 0.0);
            outgoingLight = diffuseColor.rgb * fishLight * exp(-uSchoolDepth * 2.0);
            outgoingLight = mix(outgoingLight, vec3(.006, .035, .055), 1.0 - exp(-vSchoolDistance * .026));
            diffuseColor.a *= uSchoolWet * (1.0 - smoothstep(24.0, 38.0, vSchoolDistance));
            #include <opaque_fragment>
          `)
        }
        material.customProgramCacheKey = () => 'whale-shark-water-v1'
      })
      gltf.scene.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(gltf.scene)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const scale = 11 / Math.max(size.x, size.y, size.z)
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
      if (!disposed) console.warn('[WhaleShark] Model unavailable; other marine life remains active', error)
    }
  }

  // Preload while the banner is visible so the first underwater encounter is ready.
  void load()

  return {
    resize(width: number, height: number) {
      aspect = width / height
    },
    update(depth: number, wet: number, time: number, textBottom = 0.45) {
      const delta = previousTime === undefined ? 0 : Math.min(0.05, Math.max(0, time - previousTime))
      previousTime = time
      const visibility = wet * (1 - THREE.MathUtils.smoothstep(depth, 0.18, 0.25))
      wetness.value = visibility
      darkness.value = depth
      root.visible = visibility > 0 && !!encounter
      if (encounter && root.visible) {
        swimTime += delta
        // Alternate crossings, with a pause outside the frame between passes.
        const pass = Math.floor(swimTime / 28)
        const progress = Math.min(1, (swimTime % 28) / 24)
        const direction = pass % 2 ? -1 : 1
        const approach = THREE.MathUtils.smoothstep(progress, 0.55, 1)
        const z = -13 + approach * 7
        const halfHeight = -z * Math.tan(THREE.MathUtils.degToRad(29))
        const span = 13 * Math.tan(THREE.MathUtils.degToRad(29)) * aspect + 7
        const x = direction * THREE.MathUtils.lerp(-span, span, progress)
        // Keep the silhouette below the entry copy, including its scroll drift.
        const screenY = Math.max(0.73, textBottom + 0.19 + approach * 0.16)
        const y = -depth * 82 + (1 - 2 * screenY) * halfHeight
        encounter.group.position.set(x, y + Math.sin(swimTime * 0.3) * 0.12, z)
        const approachT = THREE.MathUtils.clamp((progress - 0.55) / 0.45, 0, 1)
        const dz = 7 * 6 * approachT * (1 - approachT) / 0.45
        encounter.group.rotation.y = Math.atan2(direction * span * 2, dz)
        encounter.group.rotation.z = direction * Math.sin(progress * Math.PI) * 0.025
        encounter.group.visible = progress < 1
        encounter.mixer.setTime(swimTime * 0.7)
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
