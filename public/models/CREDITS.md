# Marine model credits

## Corals by Rayaa

- Author: Rayaa — https://sketchfab.com/blondel.lisa
- Source: https://sketchfab.com/3d-models/corals-by-rayaa-8e1e9eec16094494967b9a6d731cde3b
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- License URL: https://creativecommons.org/licenses/by-sa/4.0/
- File: corals_by_rayaa.glb (original download, unchanged)
- Scene adaptation: individual coral groups extracted in memory, reoriented, scaled and arranged with underwater lighting and gentle motion. The adaptation of this model is provided under CC BY-SA 4.0.

## Soft Coral Set

- Author: Kanna-Nakajima — https://sketchfab.com/Kanna-nakajima
- Source: https://sketchfab.com/3d-models/soft-coral-set-256355f15fcb4095af17b75ae572bff0
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License URL: https://creativecommons.org/licenses/by/4.0/
- File: soft_coral_set.glb (original download, unchanged)
- Scene adaptation: individual pieces extracted in memory, scaled and arranged into colonies with underwater lighting and gentle motion.

Attribution and license information above are preserved from each GLB's embedded asset metadata. Model licenses apply to their respective assets and adaptations.

## School Of Fish

- Author: seth the yutyrannus — https://sketchfab.com/slang107123456789
- Source: https://sketchfab.com/3d-models/school-of-fish-7d2d816ab3a34130b51e0bb42247700c
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License URL: https://creativecommons.org/licenses/by/4.0/
- File: school_of_fish.glb
- Adaptation: legacy specular/glossiness materials approximated with metallic/roughness materials; diffuse, normal, occlusion and emissive textures retained. Unused specular maps removed. Geometry, skin weights and original swimming animation preserved. Six schools are arranged and lit for the underwater scene.
- Reproduction: run `python3 scripts/prepare-fish-model.py /path/to/original/school_of_fish.glb` from the repository root.

## Model 99A - Whale Shark

- Author: DigitalLife3D — https://sketchfab.com/DigitalLife3D
- Source: https://sketchfab.com/3d-models/model-99a-whale-shark-8893d07e44964a8a934521e06cf51854
- License: Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)
- License URL: https://creativecommons.org/licenses/by-nc/4.0/
- File: whale_shark.glb (original download, unchanged; currently inactive in the site)
- Scene adaptation: scaled and positioned in the foreground directly below the banner, retaining the original Swim Cycle animation with underwater shading and a slow, close swimming path.

## Model 73A - Great Hammerhead Shark

- Author: DigitalLife3D — https://sketchfab.com/DigitalLife3D
- Source: https://sketchfab.com/3d-models/model-73a-great-hammerhead-shark-77d52f2b0e084fe7bcefbc86b920f080
- License: Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)
- License URL: https://creativecommons.org/licenses/by-nc/4.0/
- File: hammerhead_shark.glb (original download, unchanged)
- Scene adaptation: scaled, given underwater shading and a foreground swimming path that crosses the shark chapter and approaches the camera. The original skeletal animation is retained.

## Wreckage of the Linda Rose

- Author: MBARI — https://sketchfab.com/mbari
- Source: https://sketchfab.com/3d-models/wreckage-of-the-linda-rose-e8cd4cfbfe5e44c79ccd7a7b1f01d86d
- License: Creative Commons Attribution 4.0 (CC BY 4.0)
- License URL: https://creativecommons.org/licenses/by/4.0/
- File: linda_rose.glb
- Adaptation: legacy materials converted, geometry and textures optimized for the web, scaled and lit with an interactive flashlight in the footer.
- Reproduction: `python3 scripts/prepare-wreck-model.py /path/to/wreckage_of_the_linda_rose.glb /tmp/wreck-materials.glb`, then `npx --yes @gltf-transform/cli@4.5.0 optimize /tmp/wreck-materials.glb public/models/linda_rose.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify-ratio 0.15 --simplify-error 0.002`. See https://gltf-transform.dev/cli.

## Coral Piece

- Author: [Sharon Kunne](https://sketchfab.com/sharonkunne)
- Source: https://sketchfab.com/3d-models/coral-piece-bd879158d2c9496fa40eb9a8fd8e75f8
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- File: `coral_piece.glb`, supplied by the user; original GLB preserved.
- Display adaptations: normalized scale, repeated placements and rotations, underwater lighting, subtle current deformation and alpha masking for textured planes.
