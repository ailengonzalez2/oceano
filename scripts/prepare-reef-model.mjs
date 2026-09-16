import fs from 'node:fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Inspect world-space bounds without decoding textures, then retain the original
// materials, skeleton and animation in the output GLB.
globalThis.ProgressEvent ??= class {
  constructor(type, values) {
    Object.assign(this, { type }, values)
  }
}
const [source, target] = process.argv.slice(2)
if (!source || !target) throw new Error('Usage: node scripts/prepare-reef-model.mjs source.glb target.glb')
const input = fs.readFileSync(source)
const length = input.readUInt32LE(12)
const json = JSON.parse(input.subarray(20, 20 + length))
const binary = input.subarray(28 + length)
const inspection = structuredClone(json)
inspection.images = []
inspection.textures = []
inspection.materials = inspection.materials.map(material => ({ name: material.name }))
inspection.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`
const gltf = await new GLTFLoader().parseAsync(JSON.stringify(inspection), '')
gltf.scene.updateMatrixWorld(true)
let removed = 0
for (const [object, association] of gltf.parser.associations) {
  if (!object.isMesh || association.nodes === undefined) continue
  const bounds = new THREE.Box3().setFromObject(object)
  const looseParticles = ['blinn2', 'xiaoguo_02_blinn1'].includes(object.material.name)
  if (object.name.startsWith('beijing_') || looseParticles || bounds.min.y > 80 || bounds.max.y < -80) {
    delete json.nodes[association.nodes].mesh
    delete json.nodes[association.nodes].skin
    removed++
  }
}
const raw = Buffer.from(JSON.stringify(json))
const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32)
raw.copy(padded)
const header = Buffer.alloc(20)
header.writeUInt32LE(0x46546c67, 0)
header.writeUInt32LE(2, 4)
header.writeUInt32LE(28 + padded.length + binary.length, 8)
header.writeUInt32LE(padded.length, 12)
header.writeUInt32LE(0x4e4f534a, 16)
const binHeader = Buffer.alloc(8)
binHeader.writeUInt32LE(binary.length, 0)
binHeader.writeUInt32LE(0x004e4942, 4)
fs.writeFileSync(target, Buffer.concat([header, padded, binHeader, binary]))
console.log(`Removed ${removed} backdrop / outlying meshes.`)
