import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

/** Additional animated schools. Existing procedural fish remain independent. */
export function createSwimmingSchools(scene: THREE.Scene, onReady?: () => void) {
  const root = new THREE.Group()
  root.name = 'Animated fish schools'
  root.visible = false
  scene.add(root)
  const wetness = { value: 0 }
  const darkness = { value: 0 }
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.MeshStandardMaterial>()
  const textures = new Set<THREE.Texture>()
  const skeletons = new Set<THREE.Skeleton>()
  const schools: { group: THREE.Group, mixer: THREE.AnimationMixer, model: THREE.Object3D, depth: number, phase: number }[] = []
  let disposed = false
  let started = false
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
      const gltf = await new GLTFLoader().loadAsync('/models/school_of_fish.glb')
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
        material.customProgramCacheKey = () => 'animated-school-water-v1'
      })
      gltf.scene.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(gltf.scene)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const scale = 7.5 / Math.max(size.x, size.y, size.z)
      for (let i = 0; i < 6; i++) {
        const model = clone(gltf.scene)
        const pivot = new THREE.Group()
        model.position.sub(center)
        pivot.add(model)
        pivot.scale.setScalar(scale * (i % 2 ? 0.8 : 1))
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
        schools.push({ group, model, mixer, depth: -8 - i * 14, phase: i * 1.9 })
      }
      onReady?.()
    } catch (error) {
      if (!disposed) console.warn('[SwimmingSchools] Model unavailable; procedural fish remain active', error)
    }
  }

  return {
    resize(width: number, height: number) {
      aspect = width / height
    },
    update(depth: number, wet: number, time: number) {
      // Begin the larger asset download as the visitor enters the water.
      if (!started && wet > 0) {
        started = true
        void load()
      }
      wetness.value = wet
      darkness.value = depth
      root.visible = wet > 0 && schools.length > 0
      const cameraY = -depth * 82
      schools.forEach((school, i) => {
        const phase = time * (0.065 + i * 0.003) + school.phase
        const span = Math.min(11, Math.max(4, aspect * 6))
        school.group.position.set(Math.sin(phase) * span, school.depth + Math.sin(time * 0.22 + i) * 0.45, -13 - (i % 2) * 5 + Math.cos(phase) * 2)
        school.group.rotation.y = Math.atan2(Math.cos(phase) * span, -Math.sin(phase) * 2)
        school.group.visible = wet > 0 && Math.abs(cameraY - school.depth) < 29
        if (school.group.visible) school.mixer.setTime(time * 0.85 + i * 5.7)
      })
    },
    dispose() {
      disposed = true
      schools.forEach(({ mixer, model }) => {
        mixer.stopAllAction()
        mixer.uncacheRoot(model)
      })
      releaseResources()
      root.clear()
      scene.remove(root)
    }
  }
}
