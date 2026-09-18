// Web-sized copies only: keep Martina's original photographs untouched.
// Requires macOS sips. Run: node scripts/prepare-service-photos.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'

const names = ['reef-fish', 'squid', 'marine-detail', 'coral-texture', 'lionfish', 'reef-life', 'sand-dollar']
mkdirSync('public/img/optimized', { recursive: true })
let before = 0
let after = 0
for (const name of names) {
  const input = `public/img/martina/${name}.jpg`
  before += statSync(input).size
  for (const width of [480, 800]) {
    const output = `public/img/optimized/${name}-${width}.jpg`
    execFileSync('sips', ['-s', 'formatOptions', '80', '--resampleWidth', String(width), input, '--out', output], { stdio: 'ignore' })
    if (width === 800) after += statSync(output).size
  }
}
console.log(`Service photos: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB (800px set)`)
