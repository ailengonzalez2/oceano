import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

/** A complete, life-size reef: its original floor and colonies stay connected. */
export function createCoralReef(parent: THREE.Group, onReady?: () => void) {
  const group = new THREE.Group()
  group.name = 'Coral reef passage'
  parent.add(group)
  const materials = new Set<THREE.MeshStandardMaterial>()
  const geometries = new Set<THREE.BufferGeometry>()
  const textures = new Set<THREE.Texture>()
  let horizontalSpread = 1
  let disposed = false
  let ready = false
  let started = false
  let mixer: THREE.AnimationMixer | undefined
  const visibility = { value: 0 }
  const currentTime = { value: 0 }
  const evening = { value: 0 }
  const daySun = new THREE.Color(0xc4f2ef)
  const duskSun = new THREE.Color(0xffbc80)
  const dayFill = new THREE.Color(0xb6e9ed)
  const duskFill = new THREE.Color(0x8099b5)
  const fill = new THREE.HemisphereLight(0xb6e9ed, 0x183645, 1.2)
  const sun = new THREE.DirectionalLight(0xc4f2ef, 2.7)
  sun.position.set(-8, 14, 5)
  sun.target.position.set(0, -4, -14)
  group.add(fill, sun, sun.target)

  // Three staggered shelves on each side form an open channel through the reef.
  const banks = Array.from({ length: 12 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const row = Math.floor(i / 4)
    const outer = Math.floor(i / 2) % 2
    return {
      x: side * (6.8 + outer * 4 + row * 0.4),
      y: -7.2 - row * 0.65,
      z: -11 - row * 11 - outer * 2,
      side
    }
  })

  // Shared with the ground mesh: planted coral bases follow the same relief,
  // including when the channel narrows on mobile.
  function floorHeight(x: number, z: number) {
    let elevation = -9.7 + Math.sin(x * 0.32 + z * 0.14) * 0.18
      + Math.cos(z * 0.43 - x * 0.16) * 0.12
    banks.forEach((bank) => {
      const dx = (x - bank.x * horizontalSpread) / (4.8 * Math.sqrt(horizontalSpread))
      const dz = (z - bank.z) / 7
      const mound = Math.exp(-(dx * dx + dz * dz))
      elevation = Math.max(elevation, -9.7 + (bank.y - 0.35 + 9.7) * mound)
    })
    return elevation
  }

  function releaseResources() {
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    textures.forEach((texture) => {
      texture.dispose()
      if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close()
    })
  }

  // Optimized meshes contain many colonies. Find each connected piece so the
  // bend starts at its own roots instead of moving the entire reef together.
  function addCurrentWeights(mesh: THREE.Mesh) {
    const geometry = mesh.geometry
    if (geometry.hasAttribute('reefCurrent')) return
    const positions = geometry.getAttribute('position')
    const weights = new Float32Array(positions.count * 2)
    const names = [mesh.name, ...(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(material => material.name)].join(' ')
    const flexible = !(mesh instanceof THREE.SkinnedMesh)
      && /fanCoral|huanghua|shuicao|xiaohaizao|Tree|ttip|lef|bod1|lvcao/i.test(names)
    if (flexible) {
      const roots = Int32Array.from({ length: positions.count }, (_, i) => i)
      const find = (index: number): number => {
        while (roots[index] !== index) {
          roots[index] = roots[roots[index]!]!
          index = roots[index]!
        }
        return index
      }
      const join = (a: number, b: number) => {
        roots[find(a)] = find(b)
      }
      const seams = new Map<string, number>()
      const world = new THREE.Vector3()
      for (let i = 0; i < positions.count; i++) {
        const key = `${positions.getX(i)},${positions.getY(i)},${positions.getZ(i)}`
        const previous = seams.get(key)
        if (previous !== undefined) join(i, previous)
        else seams.set(key, i)
      }
      const index = geometry.getIndex()
      for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
        const a = index ? index.getX(i) : i
        join(a, index ? index.getX(i + 1) : i + 1)
        join(a, index ? index.getX(i + 2) : i + 2)
      }
      const bounds = new Map<number, { min: number, max: number, phase: number }>()
      for (let i = 0; i < positions.count; i++) {
        world.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
        const root = find(i)
        const bound = bounds.get(root)
        if (bound) {
          bound.min = Math.min(bound.min, world.y)
          bound.max = Math.max(bound.max, world.y)
        } else bounds.set(root, { min: world.y, max: world.y, phase: world.x * 0.13 + world.z * 0.09 })
      }
      for (let i = 0; i < positions.count; i++) {
        world.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
        const bound = bounds.get(find(i))!
        const height = bound.max - bound.min
        weights[i * 2] = height > 0.1 ? Math.pow(THREE.MathUtils.smoothstep(world.y, bound.min + height * 0.15, bound.max), 1.5) : 0
        weights[i * 2 + 1] = bound.phase
      }
      mesh.frustumCulled = false
    }
    geometry.setAttribute('reefCurrent', new THREE.BufferAttribute(weights, 2))
  }

  function preload() {
    if (started || disposed) return
    started = true
    void new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/coral_reef_small.glb').then((gltf) => {
      gltf.scene.updateMatrixWorld(true)
      gltf.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        addCurrentWeights(object)
        geometries.add(object.geometry)
        const list = Array.isArray(object.material) ? object.material : [object.material]
        list.forEach((material: THREE.MeshStandardMaterial) => {
          if (materials.has(material)) return
          materials.add(material)
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) textures.add(value)
          })
          material.metalness = 0
          material.roughness = Math.max(0.7, material.roughness)
          material.transparent = false
          material.opacity = 1
          material.depthWrite = true
          material.onBeforeCompile = (shader) => {
            shader.uniforms.uReefVisibility = visibility
            shader.uniforms.uReefEvening = evening
            shader.uniforms.uReefTime = currentTime
            shader.vertexShader = `uniform float uReefTime; attribute vec2 reefCurrent; varying float vReefDistance;\n${shader.vertexShader}`
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
            vec4 reefWorld = modelMatrix * vec4(transformed, 1.0);
            float phase = uReefTime * .7 + reefCurrent.y;
            reefWorld.x += (sin(phase) * .18 + sin(phase * .57 + 1.2) * .045) * reefCurrent.x;
            reefWorld.z += cos(phase * .73) * .10 * reefCurrent.x;
            vec4 mvPosition = viewMatrix * reefWorld;
            gl_Position = projectionMatrix * mvPosition;
            vReefDistance = length(mvPosition.xyz);
          `)
            shader.fragmentShader = `uniform float uReefEvening; uniform float uReefVisibility; varying float vReefDistance;\n${shader.fragmentShader}`
            shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
            outgoingLight = mix(outgoingLight, mix(vec3(.009, .085, .115), vec3(.015, .045, .08), uReefEvening), 1.0 - exp(-vReefDistance * .009));
            diffuseColor.a *= uReefVisibility;
            #include <opaque_fragment>
          `)
          }
          material.customProgramCacheKey = () => 'complete-reef-current-v3'
        })
      })
      if (disposed) {
        releaseResources()
        return
      }
      // Use the seabed's dimensions, not the decorative scene bounds. A uniform
      // scale keeps rocks and coral proportions intact on every viewport.
      // Mirror across the swim lane, keeping both banks at the same depth.
      // Turning the copy 180 degrees also reversed its near/far arrangement,
      // which placed the largest foreground rocks on the left of the camera.
      // Reuse geometry/textures, leave the original connected floor in place and
      // keep the animated vegetation on the original bank only.
      gltf.scene.updateMatrixWorld(true)
      const oppositeBank = new THREE.Group()
      oppositeBank.name = 'Additional reef colonies'
      gltf.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object instanceof THREE.SkinnedMesh) return
        const list = Array.isArray(object.material) ? object.material : [object.material]
        if (list.some(material => material.name === 'useBackground2')) return
        const colony = new THREE.Mesh(object.geometry, object.material)
        colony.frustumCulled = object.frustumCulled
        colony.matrixAutoUpdate = false
        colony.matrix.copy(object.matrixWorld)
        oppositeBank.add(colony)
      })
      oppositeBank.scale.set(-0.52, 0.52, 0.52)
      oppositeBank.position.set(1.04, -10.5, -34)
      group.add(oppositeBank)
      gltf.scene.scale.setScalar(0.52)
      gltf.scene.position.set(-1.04, -10.5, -34)
      group.add(gltf.scene)
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(gltf.scene)
        gltf.animations.forEach(clip => mixer!.clipAction(clip).play())
      }
      ready = true
      onReady?.()
    }).catch(error => console.warn('[CoralReef] Could not load reef; retaining fallback', error))
  }

  return {
    banks,
    preload,
    floorHeight,
    get spread() { return horizontalSpread },
    resize(aspect: number) {
      horizontalSpread = THREE.MathUtils.clamp(aspect / 1.5, 0.38, 1)
    },
    get ready() { return ready },
    update(time: number, opacity: number, sunset = 0) {
      evening.value = sunset
      sun.color.copy(daySun).lerp(duskSun, sunset)
      sun.intensity = THREE.MathUtils.lerp(2.7, 1.8, sunset)
      sun.position.set(THREE.MathUtils.lerp(-8, -18, sunset), THREE.MathUtils.lerp(14, 7, sunset), 5)
      fill.color.copy(dayFill).lerp(duskFill, sunset)
      fill.intensity = THREE.MathUtils.lerp(1.2, 0.85, sunset)
      visibility.value = opacity
      currentTime.value = time
      // Blend only while entering/leaving the chapter. Inside the reef, use the
      // opaque depth pass so overlapping colonies remain solid and correctly sorted.
      const transitioning = opacity < 0.999
      materials.forEach((material) => {
        if (material.transparent !== transitioning) {
          material.transparent = transitioning
          material.needsUpdate = true
        }
      })
      group.visible = opacity > 0.001 && ready
      if (group.visible) mixer?.setTime(time * 0.65)
    },
    dispose() {
      disposed = true
      mixer?.stopAllAction()
      if (mixer) mixer.uncacheRoot(mixer.getRoot())
      releaseResources()
      parent.remove(group)
      group.clear()
    }
  }
}
