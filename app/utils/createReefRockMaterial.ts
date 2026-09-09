import * as THREE from 'three'

/** Solid, porous stone with texture evaluated in rock space, so it never swims. */
export function createReefRockMaterial(opacity: { value: number }) {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: opacity },
    transparent: true,
    depthWrite: true,
    vertexShader: /* glsl */ `
      varying vec3 vStone, vNormal;
      varying float vDistance;
      void main() {
        vec4 stone = instanceMatrix * vec4(position, 1.0);
        vStone = stone.xyz;
        mat3 im = mat3(instanceMatrix);
        vec3 n = normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]));
        vNormal = normalize(im * n);
        vec4 view = modelViewMatrix * stone;
        vDistance = length(view.xyz);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vStone, vNormal;
      varying float vDistance;
      float hash(vec3 p) {
        p = fract(p * .1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      float relief(vec3 p) {
        return noise(p * 3.0) * .65 + noise(p * 11.0) * .25 + noise(p * 32.0) * .1;
      }
      void main() {
        vec3 n = normalize(vNormal);
        float grain = relief(vStone);
        // Object-space relief changes the lighting as well as the colour.
        const float e = .018;
        vec3 gradient = vec3(relief(vStone + vec3(e,0,0)),
                             relief(vStone + vec3(0,e,0)),
                             relief(vStone + vec3(0,0,e))) - grain;
        n = normalize(n - (gradient - n * dot(gradient, n)) * 9.0);
        float patches = noise(vStone * .8);
        float pores = 1.0 - smoothstep(.2, .34, noise(vStone * 24.0));
        float strata = abs(sin(vStone.y * 8.0 + noise(vStone * 1.5) * 5.0));
        float crevice = 1.0 - smoothstep(.035, .16, strata);
        vec3 stone = mix(vec3(.16, .20, .19), vec3(.40, .43, .36), patches);
        stone *= .72 + grain * .55;
        stone *= 1.0 - pores * .38 - crevice * .20;
        // Muted algae on upward-facing ledges, not a uniform green coating.
        float algae = smoothstep(.48, .75, patches) * smoothstep(.1, .85, n.y);
        stone = mix(stone, vec3(.18, .25, .18), algae * .5);
        float light = .42 + .58 * max(dot(n, normalize(vec3(-.4, 1., .8))), 0.0);
        vec3 color = stone * light;
        color = mix(color, vec3(.015, .12, .16), 1.0 - exp(-vDistance * .025));
        float alpha = uOpacity * (1.0 - smoothstep(36., 55., vDistance));
        if (alpha < .005) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `
  })
}
