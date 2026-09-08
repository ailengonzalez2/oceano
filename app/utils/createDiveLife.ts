import * as THREE from 'three'
import { createDiveHabitat } from './createDiveHabitat'

/** World-space marine snow, bubbles, fish and deep-water jellyfish.
 * Camera descent is reversible; ambient swimming uses a separate clock.
 * Everything is procedural, with deterministic placement and no asset fetches.
 */
export function createDiveLife(onReady?: () => void) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 90)
  const uniforms = {
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uWet: { value: 0 },
    uPixelRatio: { value: 1 }
  }
  const resources: (THREE.BufferGeometry | THREE.Material)[] = []
  let seed = 21
  function random() {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const particles = new THREE.BufferGeometry()
  const positions = new Float32Array(1200 * 3)
  const sizes = new Float32Array(1200)
  for (let i = 0; i < 1200; i++) {
    positions.set([(random() - 0.5) * 50, random() * 115 - 100, -2 - random() * 42], i * 3)
    sizes[i] = random()
  }
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particles.setAttribute('aSeed', new THREE.BufferAttribute(sizes, 1))
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uWet, uPixelRatio;
      varying float vSeed, vAlpha;
      void main() {
        vec3 p = position;
        float bubble = step(.91, aSeed);
        p.y = mod(p.y + 100.0 + uTime * mix(.08, .8, bubble), 115.0) - 100.0;
        p.x += sin(uTime * .24 + aSeed * 70.0) * .3;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(mix(20.0, 170.0, bubble) * uPixelRatio / max(1.0, -view.z), 1.0, 32.0);
        vSeed = aSeed;
        vAlpha = uWet * exp(view.z * .036) * smoothstep(.5, 3.0, -view.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDepth, uTime;
      varying float vSeed, vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        float bubble = step(.91, vSeed);
        float snow = exp(-r * r * 5.0) * .36;
        float rim = exp(-pow((r - .77) * 13.0, 2.0)) * .3;
        float glint = exp(-length(p - vec2(-.35, .4)) * 12.0) * .65;
        float alpha = mix(snow, rim + glint, bubble) * vAlpha;
        vec3 color = mix(vec3(.54, .79, .9), vec3(.12, .85, .65), smoothstep(.6, 1.0, uDepth));
        float pulse = .7 + .3 * sin(uTime * 1.1 + vSeed * 100.0);
        gl_FragColor = vec4(color, alpha * pulse);
      }
    `
  })
  const snow = new THREE.Points(particles, particleMaterial)
  snow.frustumCulled = false // Shader moves particles independently of CPU bounds.
  scene.add(snow)
  resources.push(particles, particleMaterial)

  // A low-poly fish silhouette with an articulated tail; all fish share a draw call.
  const fishGeometry = new THREE.BufferGeometry()
  fishGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0.52, 0, 0, -0.2, 0.17, 0, -0.3, -0.1, 0,
    -0.2, 0.17, 0, -0.3, -0.1, 0, -0.58, 0, 0,
    -0.47, 0, 0, -0.88, 0.24, 0, -0.88, -0.22, 0,
    0, 0.12, 0, -0.24, 0.32, 0, -0.32, 0.07, 0
  ], 3))
  const fishMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vFog;
      void main() {
        vec3 p = position;
        float seed = instanceMatrix[3].x;
        p.z += sin(uTime * 4.0 + seed + p.x * 3.0) * .2 * (1.0 - smoothstep(-.9, .1, p.x));
        vec4 world = instanceMatrix * vec4(p, 1.0);
        world.x += sin(uTime * .15 + world.y * .04) * 4.0;
        world.y += sin(uTime * .8 + seed) * .12;
        vec4 view = modelViewMatrix * world;
        vFog = exp(view.z * .025);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uWet, uDepth;
      varying float vFog;
      void main() {
        gl_FragColor = vec4(.012, .105, .14, uWet * vFog * (1.0 - smoothstep(.55, .85, uDepth)) * .8);
      }
    `
  })
  const fish = new THREE.InstancedMesh(fishGeometry, fishMaterial, 100)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 100; i++) {
    const school = Math.floor(i / 25)
    dummy.position.set((random() - 0.5) * 22, -8 - school * 12 + (random() - 0.5) * 5, -12 - random() * 18)
    dummy.scale.setScalar(0.25 + random() * 0.5)
    dummy.rotation.set(0, school % 2 ? Math.PI : 0, (random() - 0.5) * 0.2)
    dummy.updateMatrix()
    fish.setMatrixAt(i, dummy.matrix)
  }
  fish.frustumCulled = false
  scene.add(fish)
  resources.push(fishGeometry, fishMaterial)

  const jellyGeometry = new THREE.BufferGeometry()
  const jellyPositions = new Float32Array(24 * 3)
  for (let i = 0; i < 24; i++) {
    jellyPositions.set([(random() - 0.5) * 42, -42 - random() * 52, -7 - random() * 24], i * 3)
  }
  jellyGeometry.setAttribute('position', new THREE.BufferAttribute(jellyPositions, 3))
  const jellyMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uPixelRatio;
      varying float vPhase, vFog;
      void main() {
        vec3 p = position;
        vPhase = p.x * 2.0;
        p.y += sin(uTime * .5 + vPhase) * .6;
        p.x += sin(uTime * .16 + vPhase) * .4;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(900.0 * uPixelRatio / max(1.0, -view.z), 4.0, 160.0);
        vFog = exp(view.z * .03);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uWet, uDepth;
      varying float vPhase, vFog;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float pulse = sin(uTime * 1.5 + vPhase);
        vec2 bell = vec2(p.x / (.68 + pulse * .035), (p.y + .18) / .57);
        float radius = length(bell);
        float dome = exp(-abs(radius - 1.0) * 24.0) * step(p.y, -.12);
        float fill = max(0.0, 1.0 - radius) * .12 * step(p.y, -.12);
        float rim = exp(-abs(p.y + .12) * 65.0) * (1.0 - smoothstep(.5, .69, abs(p.x)));
        float strands = 0.0;
        for (int i = 0; i < 5; i++) {
          float x = (float(i) - 2.0) * .18 + sin(p.y * 8.0 - uTime * 1.2 + float(i) + vPhase) * .06;
          strands += exp(-abs(p.x - x) * 105.0) * smoothstep(-.15, .02, p.y) * (1.0 - smoothstep(.3, .93, p.y));
        }
        float alpha = (dome * .4 + rim * .25 + fill + strands * .24) * vFog * uWet;
        alpha *= smoothstep(.4, .65, uDepth) * (.75 + pulse * .2);
        gl_FragColor = vec4(.23, .8, .72, alpha);
      }
    `
  })
  const jellyfish = new THREE.Points(jellyGeometry, jellyMaterial)
  jellyfish.frustumCulled = false
  scene.add(jellyfish)
  resources.push(jellyGeometry, jellyMaterial)

  const habitat = createDiveHabitat(scene, onReady)

  return {
    scene, camera,
    resize(width: number, height: number, pixelRatio: number) {
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      uniforms.uPixelRatio.value = pixelRatio
      habitat.resize()
    },
    update(depth: number, entry: number, time: number, look: THREE.Vector2) {
      uniforms.uTime.value = time
      uniforms.uDepth.value = depth
      uniforms.uWet.value = THREE.MathUtils.smoothstep(entry, 0.65, 1)
      habitat.update(depth, uniforms.uWet.value, time)
      camera.position.set(look.x * 0.3, -depth * 82, 0)
      camera.lookAt(look.x * 0.65, camera.position.y + look.y * 0.25, -15)
    },
    dispose() {
      resources.forEach(resource => resource.dispose())
      fish.dispose()
      habitat.dispose()
      scene.clear()
    }
  }
}
