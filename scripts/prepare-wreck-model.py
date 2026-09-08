"""Adapt the supplied legacy specular/glossiness GLB for the web renderer.
Usage: python3 scripts/prepare-wreck-model.py /path/to/original.glb /tmp/wreck-materials.glb
Geometry and texture buffers are preserved before the optimization stage.
"""
import json
import struct
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_bytes()
json_length = struct.unpack_from('<I', source, 12)[0]
model = json.loads(source[20:20 + json_length])
binary_start = 20 + json_length
binary_length = struct.unpack_from('<I', source, binary_start)[0]
binary = source[binary_start + 8:binary_start + 8 + binary_length]
for material in model['materials']:
    legacy = material.get('extensions', {}).pop('KHR_materials_pbrSpecularGlossiness', None)
    if legacy:
        material['pbrMetallicRoughness'] = {
            'baseColorFactor': legacy.get('diffuseFactor', [1, 1, 1, 1]),
            'baseColorTexture': legacy['diffuseTexture'],
            'metallicFactor': 0,
            'roughnessFactor': 0.95,
        }
    if not material.get('extensions'):
        material.pop('extensions', None)
for key in ('extensionsUsed', 'extensionsRequired'):
    if key in model:
        model[key] = [item for item in model[key] if item != 'KHR_materials_pbrSpecularGlossiness']
        if not model[key]:
            del model[key]

# Remove only texture images no longer referenced after the material conversion.
texture_refs = []
def collect(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if key.endswith('Texture') and isinstance(child, dict) and 'index' in child:
                texture_refs.append(child)
            else:
                collect(child)
    elif isinstance(value, list):
        for child in value:
            collect(child)
collect(model['materials'])
texture_ids = sorted({ref['index'] for ref in texture_refs})
texture_map = {old: new for new, old in enumerate(texture_ids)}
for ref in texture_refs:
    ref['index'] = texture_map[ref['index']]
model['textures'] = [model['textures'][i] for i in texture_ids]
image_ids = sorted({texture['source'] for texture in model['textures']})
image_map = {old: new for new, old in enumerate(image_ids)}
unused_views = {image['bufferView'] for i, image in enumerate(model['images']) if i not in image_map}
model['images'] = [model['images'][i] for i in image_ids]
for texture in model['textures']:
    texture['source'] = image_map[texture['source']]
view_map = {}
new_binary = bytearray()
new_views = []
for i, view in enumerate(model['bufferViews']):
    if i in unused_views:
        continue
    new_binary.extend(b'\0' * (-len(new_binary) % 4))
    offset = view.get('byteOffset', 0)
    copied = dict(view, byteOffset=len(new_binary))
    new_binary.extend(binary[offset:offset + view['byteLength']])
    view_map[i] = len(new_views)
    new_views.append(copied)
def remap(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if key == 'bufferView':
                value[key] = view_map[child]
            else:
                remap(child)
    elif isinstance(value, list):
        for child in value:
            remap(child)
remap(model['accessors'])
remap(model['images'])
model['bufferViews'] = new_views
model['buffers'][0]['byteLength'] = len(new_binary)
model['asset'].setdefault('extras', {})['adaptation'] = 'Diffuse textures retained; legacy specular/glossiness materials approximated with nonmetallic roughness 0.95. Unused specular textures removed. Original geometry and textures preserved before optimization.'
encoded = json.dumps(model, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
new_binary.extend(b'\0' * (-len(new_binary) % 4))
result = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(encoded) + 8 + len(new_binary))
result += struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
result += struct.pack('<II', len(new_binary), 0x004E4942) + new_binary
output = Path(sys.argv[2])
output.write_bytes(result)
print(f'{output}: {len(source) / 1e6:.1f} MB → {len(result) / 1e6:.1f} MB')
