import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { createReefRockMaterial } from './createReefRockMaterial'
import { createCoralReef } from './createCoralReef'

/** Small, shared-draw-call reef and swimming rays inside the existing water column. */
export function createDiveHabitat(scene: THREE.Scene, onReady?: () => void) {
  const group = new THREE.Group()
  scene.add(group)
  const corals = createCoralReef(group, onReady)
  const uniforms = { uTime: { value: 0 }, uWet: { value: 0 }, uReefWet: { value: 0 } }
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vColor;
      varying float vLight, vDistance;
      void main() {
        vec3 p = position;
        vec4 world = instanceMatrix * vec4(p, 1.0);
        vec3 n = normalize(mat3(instanceMatrix) * normal);
        vLight = .35 + .65 * max(dot(n, normalize(vec3(-.4, 1., .8))), 0.);
        vColor = instanceColor;
        vec4 view = modelViewMatrix * world;
        vDistance = length(view.xyz);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReefWet;
      varying vec3 vColor;
      varying float vLight, vDistance;
      void main() {
        vec3 color = mix(vColor * vLight, vec3(.015, .16, .21), 1. - exp(-vDistance * .035));
        gl_FragColor = vec4(color, uReefWet * (1. - smoothstep(26., 48., vDistance)));
      }
    `
  })
  let seed = 47
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646
  const branchGeometry = new THREE.CylinderGeometry(0.7, 1, 1, 8)
  const rockSource = new THREE.IcosahedronGeometry(1, 7)
  rockSource.deleteAttribute('normal')
  rockSource.deleteAttribute('uv')
  const rockGeometry = mergeVertices(rockSource)
  rockSource.dispose()
  const rockPosition = rockGeometry.getAttribute('position')
  for (let i = 0; i < rockPosition.count; i++) {
    const x = rockPosition.getX(i), y = rockPosition.getY(i), z = rockPosition.getZ(i)
    const erosion = Math.sin(x * 5.7 + z * 2.3) * Math.cos(y * 4.1 - z * 3.8) * 0.12
      + Math.sin(x * 13.1 + y * 9.2) * Math.sin(z * 11.4 - y * 5.3) * 0.035
    const radius = 1 + erosion
    rockPosition.setXYZ(i, x * radius, y * radius, z * radius)
  }
  rockGeometry.computeVertexNormals()
  const rockMaterial = createReefRockMaterial(uniforms.uReefWet)
  const tipGeometry = new THREE.SphereGeometry(1, 6, 4)
  const tips = new THREE.InstancedMesh(tipGeometry, material, 700)
  const branches = new THREE.InstancedMesh(branchGeometry, material, 700)
  const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, corals.banks.length * 3)
  const dummy = new THREE.Object3D()
  const up = new THREE.Vector3(0, 1, 0)
  const color = new THREE.Color()
  let branchIndex = 0
  function branch(start: THREE.Vector3, direction: THREE.Vector3, length: number, radius: number, level: number, hue: number) {
    if (branchIndex >= 700) return
    const end = start.clone().addScaledVector(direction, length)
    dummy.position.copy(start).add(end).multiplyScalar(0.5)
    dummy.quaternion.setFromUnitVectors(up, direction)
    dummy.scale.set(radius, length, radius)
    dummy.updateMatrix()
    branches.setMatrixAt(branchIndex, dummy.matrix)
    color.setHSL(hue, 0.32 + random() * 0.15, 0.23 + (3 - level) * 0.07)
    branches.setColorAt(branchIndex, color)
    dummy.position.copy(end)
    dummy.scale.setScalar(radius * 0.85 + 0.025)
    dummy.updateMatrix()
    tips.setMatrixAt(branchIndex, dummy.matrix)
    tips.setColorAt(branchIndex++, color)
    if (!level) return
    for (let i = 0; i < 3; i++) {
      const next = direction.clone().add(new THREE.Vector3((random() - 0.5) * 1.5, 0.2, (random() - 0.5) * 0.65)).normalize()
      branch(end, next, length * (0.62 + random() * 0.12), radius * 0.64, level - 1, hue)
    }
  }
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1
    branch(new THREE.Vector3(side * (6 + random() * 10), -6 - random() * 2, -10 - random() * 12),
      new THREE.Vector3(-side * 0.18, 1, 0).normalize(), 1.5 + random() * 1.2, 0.07 + random() * 0.06, 3, i % 3 ? 0.025 : 0.46)
  }
  branches.count = branchIndex
  tips.count = branchIndex
  function arrangeRocks() {
    corals.banks.forEach((bank, i) => {
      for (let piece = 0; piece < 3; piece++) {
        const phase = i * 1.37 + piece * 2.1
        const main = piece === 0
        // Smaller, partly buried stones break up the outline of each broad ledge.
        dummy.position.set(
          (bank.x + (main ? 0 : Math.cos(phase) * 2)) * corals.spread,
          bank.y - (main ? 0 : 0.45),
          bank.z + (main ? 0 : Math.sin(phase) * 1.7)
        )
        dummy.rotation.set(Math.sin(phase) * 0.13, phase, Math.cos(phase) * 0.12)
        dummy.scale.set(
          (main ? 2.7 : 1.25) * Math.sqrt(corals.spread),
          main ? 1.2 : 0.85,
          main ? 2.6 : 1.4
        )
        dummy.updateMatrix()
        rocks.setMatrixAt(i * 3 + piece, dummy.matrix)
      }
    })
    rocks.instanceMatrix.needsUpdate = true
    rocks.computeBoundingSphere()
  }
  arrangeRocks()
  group.add(rocks, branches, tips)

  // Curved wing sections form a volumetric manta silhouette; the wings flap in the shader.
  const rayGeometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const indices: number[] = []
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps * 2 - 1) * 3
    const span = Math.abs(x) / 3
    const front = -0.85 + span * 1.2
    const back = 1.1 - span * 0.65
    vertices.push(x, Math.sin(span * Math.PI) * 0.2, front, x, -0.1, back)
    if (i < steps) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  vertices.push(-0.14, 0, 0.8, 0.14, 0, 0.8, 0, -0.1, 3.8)
  indices.push(vertices.length / 3 - 3, vertices.length / 3 - 2, vertices.length / 3 - 1)
  rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  rayGeometry.setIndex(indices)
  rayGeometry.computeVertexNormals()
  const rayMaterial = new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vShade;
      void main() {
        vec3 p = position;
        p.y += sin(abs(p.x) * .8 - uTime * 1.25) * pow(abs(p.x) / 3., 1.4) * .95;
        vShade = .5 + .5 * sin(abs(p.x) * .8 - uTime * 1.25);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uWet;
      varying float vShade;
      void main() {
        gl_FragColor = vec4(mix(vec3(.012, .07, .09), vec3(.06, .19, .22), vShade), uWet * .85);
      }
    `
  })
  const rays = [new THREE.Mesh(rayGeometry, rayMaterial), new THREE.Mesh(rayGeometry, rayMaterial)]
  rays.forEach((ray, i) => {
    ray.scale.setScalar(i ? 0.6 : 1)
    ray.rotation.set(0.65, -0.4, 0.15)
    scene.add(ray)
  })
  // Distant shadows introduce marine life just below the surface.
  const entryRays = Array.from({ length: 3 }, (_, i) => {
    const shadow = rayMaterial.clone()
    shadow.uniforms = { uTime: { value: 0 }, uWet: { value: 0 } }
    const ray = new THREE.Mesh(rayGeometry, shadow)
    ray.scale.setScalar([1.15, 0.85, 0.7][i]!)
    ray.visible = false
    // Shader-driven fins extend beyond the undeformed geometry bounds.
    ray.frustumCulled = false
    scene.add(ray)
    return ray
  })
  let entryStart = 0
  let entryEnd = 0
  let aspect = 1
  let reefDepth = 0.2
  let openDepth = 0.4
  let passageStart = 0.2
  let passageEnd = 0.4
  let viewportDepth = 0.08
  return {
    resize() {
      aspect = window.innerWidth / window.innerHeight
      corals.resize(aspect)
      arrangeRocks()
      const max = document.documentElement.scrollHeight - window.innerHeight
      const anchorDepth = (id: string, fallback: number) => {
        const el = document.getElementById(id)
        return el && max > 0 ? Math.max(0, (el.getBoundingClientRect().top + window.scrollY + el.offsetHeight * 0.35 - window.innerHeight * 0.5) / max) : fallback
      }
      const entry = document.querySelector<HTMLElement>('.journey .entry')
      if (entry && max > 0) {
        entryStart = (entry.getBoundingClientRect().top + window.scrollY) / max
        entryEnd = entryStart + entry.offsetHeight / max
      }
      const reef = document.getElementById('portfolio')
      if (reef && max > 0) {
        passageStart = (reef.getBoundingClientRect().top + window.scrollY) / max
        passageEnd = passageStart + Math.max(1, reef.offsetHeight - window.innerHeight) / max
        viewportDepth = window.innerHeight / max
      }
      reefDepth = anchorDepth('portfolio', 0.2)
      openDepth = anchorDepth('open-water', 0.4)
      group.position.y = -reefDepth * 82
    },
    update(depth: number, wet: number, time: number, reduced: boolean) {
      uniforms.uTime.value = time
      uniforms.uWet.value = wet * (1 - THREE.MathUtils.smoothstep(Math.abs(depth - openDepth), 0.1, 0.2))
      uniforms.uReefWet.value = wet * (1 - THREE.MathUtils.smoothstep(Math.abs(depth - reefDepth), 0.045, 0.13))
      if (!reduced) {
        const approach = THREE.MathUtils.smootherstep(depth, passageStart - viewportDepth, passageStart)
        const progress = THREE.MathUtils.clamp((depth - passageStart) / Math.max(0.001, passageEnd - passageStart), 0, 1)
        // Moving the habitat toward the lens gives a true perspective fly-through,
        // while the other ocean zones retain their existing camera coordinates.
        group.position.y = THREE.MathUtils.lerp(-reefDepth * 82, -depth * 82 + 3.8, approach)
        group.position.z = progress * 29
        uniforms.uReefWet.value = wet * approach * (1 - THREE.MathUtils.smoothstep(progress, 0.86, 1))
      } else {
        group.position.set(0, -reefDepth * 82, 0)
      }
      corals.update(time, uniforms.uReefWet.value)
      branches.visible = !corals.ready
      tips.visible = !corals.ready
      group.visible = uniforms.uReefWet.value > 0.001
      const entryVisibility = wet
        * THREE.MathUtils.smoothstep(depth, entryStart - viewportDepth * 0.25, entryStart + viewportDepth * 0.15)
        * (1 - THREE.MathUtils.smoothstep(depth, entryEnd - viewportDepth * 0.4, entryEnd + viewportDepth * 0.1))
      entryRays.forEach((ray, i) => {
        const phase = time * (0.075 + i * 0.012) + i * 2.3
        const distance = 14 + i * 5
        const halfWidth = Math.tan(THREE.MathUtils.degToRad(29)) * distance * aspect
        ray.material.uniforms.uTime!.value = time + i * 2.7
        ray.material.uniforms.uWet!.value = entryVisibility * (0.9 - i * 0.1)
        ray.visible = entryVisibility > 0.001
        ray.position.set(
          Math.sin(phase) * halfWidth * 0.85,
          -depth * 82 + [3.5, -3.2, 5][i]! + Math.sin(phase * 1.4) * 0.7,
          -distance
        )
        ray.rotation.set(0.65, -0.4, Math.sin(time * 0.18 + i) * 0.14)
      })
      rays.forEach((ray, i) => {
        ray.visible = wet > 0 && Math.abs(depth - openDepth) < 0.2
        ray.position.set(Math.sin(time * 0.09 + i * 2) * 8, -openDepth * 82 + i * 3 + Math.sin(time * 0.3) * 0.4, -13 - i * 9)
        ray.rotation.z = Math.sin(time * 0.18 + i) * 0.14
      })
    },
    dispose() {
      corals.dispose()
      branchGeometry.dispose()
      tipGeometry.dispose()
      tips.dispose()
      rockGeometry.dispose()
      rockMaterial.dispose()
      rayGeometry.dispose()
      material.dispose()
      rayMaterial.dispose()
      entryRays.forEach(ray => ray.material.dispose())
      branches.dispose()
      rocks.dispose()
      scene.remove(group, ...rays, ...entryRays)
    }
  }
}
