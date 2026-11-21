"""Bundle HQ can assets and an offline viewer with a texture comparison toggle."""
from pathlib import Path
import ast
import base64
import zipfile

root=Path(__file__).resolve().parent
out=root/'output'/'tropical-can-hq'
tree=ast.parse((root/'package_preview.py').read_text())
html=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign)
          and any(isinstance(t,ast.Name) and t.id=='html' for t in n.targets))
for old,new in [
    ('Delster Classic · 3D bottle','Delster Tropical · HQ 3D can'),
    ('DELSTER / CLASSIC','DELSTER / TROPICAL'),
    ('3D product study · reconstructed from one photograph','Refined 3D model · compare the two texture versions'),
    ('delster-classic.glb','delster-tropical-can-hq.glb'),
    ('Amber Delster Classic bottle with original front label and a silver crown cap',
     'Delster Tropical can with a detailed aluminum lid and refined print'),
    ('Loading 3D bottle','Loading 3D can'),
    ('Estimated dimensions · plain amber reverse','Enhanced artwork is reconstructed · dimensions estimated'),
    ('0deg 84deg auto','0deg 76deg auto'),
    ('</style>','model-viewer::part(default-progress-bar){display:none}button[aria-pressed="true"]{background:#ddd7c7}</style>'),
    ('<nav>','<nav><button id="art" aria-pressed="true">Texture: enhanced</button>'),
    ('</script></body>', '''
const originalBytes=Uint8Array.from(atob('ORIGINAL_BASE64'),c=>c.charCodeAt(0));
const originalUrl=URL.createObjectURL(new Blob([originalBytes],{type:'model/gltf-binary'}));
let enhanced=true;
document.querySelector('#art').onclick=e=>{
  enhanced=!enhanced;bottle.src=enhanced?url:originalUrl;
  e.target.textContent=enhanced?'Texture: enhanced':'Texture: original photo';
  e.target.setAttribute('aria-pressed',String(enhanced));
  const download=document.querySelector('#download');download.href=bottle.src;
  download.download=enhanced?'delster-tropical-can-hq.glb':'delster-tropical-can-original-art.glb';
};
</script></body>''')]:html=html.replace(old,new)
viewer=(root/'output'/'model-viewer.min.js').read_text().replace('</script','<\\/script')
html=html.replace('VIEWER_CODE',viewer)
html=html.replace('MODEL_BASE64',base64.b64encode((out/'delster-tropical-can-hq.glb').read_bytes()).decode())
html=html.replace('ORIGINAL_BASE64',base64.b64encode((out/'delster-tropical-can-original-art.glb').read_bytes()).decode())
(out/'delster-tropical-can-hq-viewer.html').write_text(html)
(out/'README.txt').write_text('''DELSTER TROPICAL — REFINED 3D MODEL

delster-tropical-can-hq.glb: Refined geometry with an AI-reconstructed sharper texture.
delster-tropical-can-original-art.glb: The SAME geometry with the untouched original photograph.
delster-tropical-can-hq.blend: Editable model, both packed images, and studio scene.
delster-tropical-can-hq-viewer.html: Offline browser preview; the Texture button compares versions.
delster-tropical-can-hq-front.png and delster-tropical-can-hq-angle.png: 3600 x 4000 studio renders.

Improvements: smoothly interpolated shoulder profile; detailed double seam and base;
recessed lid with strengthening channel; stamped pull tab with eccentric finger opening,
solid bridge, rolled edges, and fastening rivet; fine score line; brushed aluminum;
clear lacquer over print; revised lighting; adaptive 64-sample Cycles rendering.

TEXTURE ACCURACY
The original source is 600 x 600, with the can about 220 pixels wide. The enhanced
1254 x 1254 image was reconstructed using the built-in image-generation tool.
It is sharper but some small print, logo, and illustration details differ. It is
not recovered original print artwork. Use the original-art GLB for source fidelity.
For production-accurate close-ups, replace the texture with a supplied high-resolution
label or original vector artwork. Both versions estimate hidden surfaces and dimensions.
Estimated size: 109 mm high, 66.6 mm diameter. Intended for websites and rendering.

The Blender file includes microscopic procedural brushing; the GLB uses a portable
PBR approximation. The GLBs exclude the studio floor and lights.
The viewer embeds Google model-viewer 4.0.0; license notice retained.

Texture generation used the built-in image_gen tool. Prompt: Faithfully restore the
supplied front image at higher resolution, keeping its composition, logo, lettering,
Persian flavor name, fruit illustration and striped green background; use flat lighting
for 3D projection. No redesign. This reconstruction is supplied as an optional variant.

Rebuild: PYTHONPATH=/tmp/behnosh-model-libs python build_can_hq.py
Package: python package_can_hq.py
''')
files=['delster-tropical-can-hq.glb','delster-tropical-can-original-art.glb',
       'delster-tropical-can-hq.blend','delster-tropical-can-hq-viewer.html',
       'delster-tropical-can-hq-front.png','delster-tropical-can-hq-angle.png',
       'texture-enhanced.png','source-original.png','texture-prompt.txt','README.txt','model-info.json']
if all((out/name).exists() for name in files):
    with zipfile.ZipFile(out/'delster-tropical-can-hq-package.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in files:z.write(out/name,name)
print(out/'delster-tropical-can-hq-viewer.html')
