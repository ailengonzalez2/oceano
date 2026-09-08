import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** Imported coral pieces, normalized independently and planted on shared rock banks. */
export function createCoralReef(parent: THREE.Group, onReady?: () => void) {
  const group = new THREE.Group()
  group.name = 'Imported coral reef'
  parent.add(group)
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.MeshStandardMaterial>()
  const textures = new Set<THREE.Texture>()
  const instances: THREE.InstancedMesh[] = []
  const layouts: { mesh: THREE.InstancedMesh, matrices: Float32Array }[] = []
  let horizontalSpread = THREE.MathUtils.clamp(window.innerWidth / window.innerHeight / 1.5, 0.38, 1)
  function arrange(layout: typeof layouts[number]) {
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < layout.mesh.count; i++) {
      matrix.fromArray(layout.matrices, i * 16)
      matrix.elements[12]! *= horizontalSpread
      layout.mesh.setMatrixAt(i, matrix)
    }
    layout.mesh.instanceMatrix.needsUpdate = true
    layout.mesh.computeBoundingSphere()
    if (layout.mesh.boundingSphere) layout.mesh.boundingSphere.radius += 0.3
  }
  const clock = { value: 0 }
  let disposed = false
  let loadedSets = 0
  let visibility = 0

  const fill = new THREE.HemisphereLight(0xb6e9ed, 0x183645, 1.6)
  const sun = new THREE.DirectionalLight(0xc4f2ef, 2.4)
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

  function trackTextures(material: THREE.Material) {
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value)
    })
  }

  function releaseSource(root: THREE.Object3D) {
    const sourceGeometries = new Set<THREE.BufferGeometry>()
    const sourceMaterials = new Set<THREE.Material>()
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      sourceGeometries.add(object.geometry)
      const list = Array.isArray(object.material) ? object.material : [object.material]
      list.forEach((material) => {
        trackTextures(material)
        sourceMaterials.add(material)
      })
    })
    sourceGeometries.forEach(geometry => geometry.dispose())
    sourceMaterials.forEach(material => material.dispose())
  }

  function makeMaterial(source: THREE.MeshStandardMaterial, soft: boolean) {
    const material = source.clone()
    material.metalness = 0
    material.roughness = Math.max(0.75, material.roughness)
    material.transparent = true
    material.opacity = visibility
    material.depthWrite = true
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uCoralTime = clock
      shader.vertexShader = `uniform float uCoralTime; varying float vCoralDistance;\n${shader.vertexShader}`
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        // Each normalized piece has its base at y=0: the current never lifts its roots.
        float flexibility = pow(clamp(position.y, 0.0, 1.0), 2.0);
        transformed.x += sin(uCoralTime * .65 + position.y * 2.5 + instanceMatrix[3].x) * flexibility * ${soft ? '0.055' : '0.012'};
        transformed.z += cos(uCoralTime * .43 + instanceMatrix[3].z) * flexibility * ${soft ? '0.025' : '0.005'};
      `).replace('#include <project_vertex>', '#include <project_vertex>\nvCoralDistance = length(mvPosition.xyz);')
      shader.fragmentShader = `varying float vCoralDistance;\n${shader.fragmentShader}`
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        outgoingLight = mix(outgoingLight, vec3(.009, .085, .115), 1.0 - exp(-vCoralDistance * .025));
        diffuseColor.a *= 1.0 - smoothstep(30.0, 52.0, vCoralDistance);
        #include <opaque_fragment>
      `)
    }
    material.customProgramCacheKey = () => soft ? 'soft-coral-current-v1' : 'branch-coral-current-v1'
    materials.add(material)
    return material
  }

  async function loadSet(url: string, soft: boolean) {
    const gltf = await new GLTFLoader().loadAsync(url)
    if (disposed) {
      releaseSource(gltf.scene)
      textures.forEach((texture) => {
        texture.dispose()
        if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close()
      })
      return
    }
    gltf.scene.updateMatrixWorld(true)
    const root = gltf.scene.getObjectByName(soft ? 'RootNode' : 'GLTF_SceneRootNode')
    if (!root) {
      releaseSource(gltf.scene)
      throw new Error(`Coral collection root missing: ${url}`)
    }
    // Rayaa's first nodes are the display plinth; numbered groups are the usable corals.
    const pieces = soft ? root.children : root.children.filter(child => child.name.startsWith('node_group_'))
    const materialCache = new Map<THREE.Material, THREE.MeshStandardMaterial>()
    const dummy = new THREE.Object3D()
    pieces.forEach((piece, pieceIndex) => {
      const bounds = new THREE.Box3().setFromObject(piece)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const extent = Math.max(size.x, size.y, size.z)
      if (extent < 0.00001) return
      const normalization = new THREE.Matrix4().makeScale(1 / extent, 1 / extent, 1 / extent)
        .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z))
      piece.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const geometry = object.geometry.clone().applyMatrix4(normalization.clone().multiply(object.matrixWorld))
        geometries.add(geometry)
        const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material]
        const mapped = sourceMaterials.map((source) => {
          if (!materialCache.has(source)) materialCache.set(source, makeMaterial(source as THREE.MeshStandardMaterial, soft))
          return materialCache.get(source)!
        })
        const count = soft ? 3 : 4
        const mesh = new THREE.InstancedMesh(geometry, mapped.length === 1 ? mapped[0]! : mapped, count)
        mesh.name = `${soft ? 'Soft' : 'Rayaa'} / ${piece.name}`
        for (let copy = 0; copy < count; copy++) {
          const bank = banks[(pieceIndex * (soft ? 5 : 3) + copy * 5 + (soft ? 0 : 1)) % banks.length]!
          const phase = pieceIndex * 2.399 + copy * 1.7
          const spread = soft ? 1.25 : 0.85
          const scale = soft ? 1.6 + (pieceIndex % 5) * 0.25 : 2.8 + (pieceIndex % 3) * 0.8
          dummy.position.set(bank.x + Math.sin(phase) * spread, bank.y + 1.1, bank.z + Math.cos(phase) * spread)
          dummy.rotation.set(0, phase, bank.side * -0.04)
          dummy.scale.setScalar(scale * (1 - Math.floor((pieceIndex + copy) % 3) * 0.1))
          dummy.updateMatrix()
          mesh.setMatrixAt(copy, dummy.matrix)
        }
        const layout = { mesh, matrices: new Float32Array(mesh.instanceMatrix.array) }
        layouts.push(layout)
        arrange(layout)
        group.add(mesh)
        instances.push(mesh)
      })
    })
    releaseSource(gltf.scene)
    loadedSets++
    onReady?.()
  }

  // Start after the hero has mounted; neither download blocks the ocean's first frame.
  void Promise.allSettled([
    loadSet('/models/corals_by_rayaa.glb', false),
    loadSet('/models/soft_coral_set.glb', true)
  ]).then((results) => {
    if (disposed) return
    results.forEach((result) => {
      if (result.status === 'rejected') console.warn('[CoralReef] Could not load collection; retaining available reef', result.reason)
    })
  })

  return {
    banks,
    get spread() {
      return horizontalSpread
    },
    resize(aspect: number) {
      horizontalSpread = THREE.MathUtils.clamp(aspect / 1.5, 0.38, 1)
      layouts.forEach(arrange)
    },
    get ready() {
      return loadedSets > 0
    },
    update(time: number, opacity: number) {
      clock.value = time
      visibility = opacity
      group.visible = opacity > 0.001 && loadedSets > 0
      materials.forEach((material) => {
        material.opacity = opacity
      })
    },
    dispose() {
      disposed = true
      instances.forEach(mesh => mesh.dispose())
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      textures.forEach((texture) => {
        texture.dispose()
        if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close()
      })
      parent.remove(group)
      group.clear()
    }
  }
}
