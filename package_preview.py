"""Bundle the existing model and viewer into one offline HTML preview."""
from pathlib import Path
import base64

out = Path(__file__).resolve().parent / 'output'
model = base64.b64encode((out/'delster-classic.glb').read_bytes()).decode()
viewer = (out/'model-viewer.min.js').read_text().replace('</script', '<\\/script')
html = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delster Classic · 3D bottle</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eae7df;color:#29271f;font-family:Arial,sans-serif}
main{height:100dvh;min-height:520px;display:flex;flex-direction:column}
header{padding:24px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px}
h1{font-size:20px;font-weight:500;margin:0}small{display:block;color:#706c60;margin-top:7px;font-size:12px}
model-viewer{width:100%;flex:1;min-height:350px;--poster-color:transparent}
nav{display:flex;gap:8px;flex-wrap:wrap}button,a{font:inherit;font-size:13px;border:1px solid #bcb6a7;border-radius:40px;padding:10px 17px;background:transparent;color:inherit;cursor:pointer;text-decoration:none}
button:hover,a:hover{background:#fff8}footer{padding:20px 32px;font-size:12px;color:#706c60;display:flex;justify-content:space-between;gap:20px}
@media(max-width:600px){header{padding:20px;align-items:flex-start;flex-direction:column}footer{padding:18px 20px}h1{font-size:18px}}
</style></head><body><main><header><div><h1>DELSTER / CLASSIC</h1><small>3D product study · reconstructed from one photograph</small></div>
<nav><button id="front">Front view</button><button id="rotate" aria-pressed="false">Auto rotate</button><a id="download" download="delster-classic.glb">Download GLB</a></nav></header>
<model-viewer id="bottle" alt="Amber Delster Classic bottle with original front label and a silver crown cap" camera-controls touch-action="pan-y" camera-orbit="0deg 84deg auto" field-of-view="28deg" min-camera-orbit="auto 15deg auto" max-camera-orbit="auto 115deg auto" shadow-intensity="1" shadow-softness=".8" exposure="1.15" interaction-prompt="none"></model-viewer>
<footer><span id="status">Loading 3D bottle…</span><span>Estimated dimensions · plain amber reverse</span></footer></main>
<script type="module">VIEWER_CODE
const bytes=Uint8Array.from(atob('MODEL_BASE64'),c=>c.charCodeAt(0));
const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
const bottle=document.querySelector('#bottle'); bottle.src=url;
document.querySelector('#download').href=url;
bottle.addEventListener('load',()=>{document.querySelector('#status').textContent='Drag to orbit · Scroll or pinch to zoom';document.body.dataset.loaded='true'});
bottle.addEventListener('error',()=>document.querySelector('#status').textContent='Unable to load the 3D model in this browser.');
document.querySelector('#front').onclick=()=>{bottle.autoRotate=false;bottle.cameraOrbit='0deg 84deg auto';bottle.cameraTarget='auto auto auto';bottle.fieldOfView='28deg';document.querySelector('#rotate').setAttribute('aria-pressed','false');};
document.querySelector('#rotate').onclick=e=>{bottle.autoRotate=!bottle.autoRotate;e.target.setAttribute('aria-pressed',String(bottle.autoRotate));};
</script></body></html>'''
(out/'delster-classic-viewer.html').write_text(html.replace('VIEWER_CODE',viewer).replace('MODEL_BASE64',model))
(out/'README.txt').write_text('''DELSTER CLASSIC — SINGLE-IMAGE 3D RECONSTRUCTION

delster-classic.glb: Portable glTF 2.0 model, embedded texture, PBR materials.
delster-classic.blend: Editable Blender 4.3 model, packed source image, studio lights and camera.
delster-classic-viewer.html: Standalone offline preview. Open in a modern browser; drag to rotate.
delster-classic-preview.png / delster-classic-angle.png: Studio renders.

The original front artwork is projected onto curved label geometry. The supplied
600 x 600 image limits label sharpness at close zoom. The back is plain amber;
it was not visible in the source. Bottle and crown-cap geometry are inferred.
Estimated scale: 266.5 mm tall, 70.5 mm diameter. These are not measured dimensions.
Designed for websites and product visualization, not production manufacturing.
The GLB contains only the bottle and labels, not the studio floor or lights.
Glass transmission appearance varies with renderer and environment lighting.

Website use: load delster-classic.glb using a glTF-compatible viewer or renderer.
The viewer HTML embeds Google's model-viewer 4.0.0 (BSD-3-Clause license notice retained).
Rebuild: PYTHONPATH=/tmp/behnosh-model-libs python build_bottle.py
Then run: python package_preview.py
''')
print(out/'delster-classic-viewer.html')
