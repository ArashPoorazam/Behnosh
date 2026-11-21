"""Package a standalone offline viewer and the can deliverables."""
from pathlib import Path
import ast
import base64
import zipfile

root=Path(__file__).resolve().parent
out=root/'output'/'tropical-can'
tree=ast.parse((root/'package_preview.py').read_text())
html=next(ast.literal_eval(node.value) for node in tree.body
          if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='html' for t in node.targets))
for old,new in [
    ('Delster Classic · 3D bottle','Delster Tropical · 3D can'),
    ('DELSTER / CLASSIC','DELSTER / TROPICAL'),
    ('delster-classic.glb','delster-tropical-can.glb'),
    ('Amber Delster Classic bottle with original front label and a silver crown cap',
     'Green Delster Tropical can with original artwork and an aluminum pull-tab lid'),
    ('Loading 3D bottle','Loading 3D can'),
    ('plain amber reverse','inferred striped reverse'),
    ('0deg 84deg auto','0deg 80deg auto'),
    ('--poster-color:transparent','--poster-color:transparent'),
    ('</style>','model-viewer::part(default-progress-bar){display:none}</style>')]:
    html=html.replace(old,new)
viewer=(root/'output'/'model-viewer.min.js').read_text().replace('</script','<\\/script')
encoded=base64.b64encode((out/'delster-tropical-can.glb').read_bytes()).decode()
(out/'delster-tropical-can-viewer.html').write_text(html.replace('VIEWER_CODE',viewer).replace('MODEL_BASE64',encoded))
(out/'README.txt').write_text('''DELSTER TROPICAL CAN — SINGLE-IMAGE 3D RECONSTRUCTION

delster-tropical-can.glb: glTF 2.0 model with embedded original image and PBR materials.
delster-tropical-can.blend: Editable Blender 4.3 file, packed texture and studio scene.
delster-tropical-can-viewer.html: Standalone offline preview; open in a modern browser.
delster-tropical-can-preview.png / delster-tropical-can-angle.png: Studio renders.

The front print comes directly from the provided 600 x 600 photograph. Resolution
limits close-up sharpness. The unseen reverse continues the green striped edge;
no back label or regulatory text has been invented. The lid, pull tab, underside,
and physical dimensions are inferred, not measured.
Estimated size: 109 mm tall, 66.6 mm diameter. Intended for websites and rendering.
The GLB excludes studio lights and floor. Metal appearance depends on lighting.

The offline HTML embeds Google model-viewer 4.0.0; BSD-3-Clause notice retained.
Rebuild from project folder: PYTHONPATH=/tmp/behnosh-model-libs python build_can.py
Then run: python package_can.py
''')
files=['delster-tropical-can.glb','delster-tropical-can.blend',
       'delster-tropical-can-viewer.html','delster-tropical-can-preview.png',
       'delster-tropical-can-angle.png','README.txt','model-info.json']
if all((out/name).exists() for name in files):
    with zipfile.ZipFile(out/'delster-tropical-can-package.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in files:z.write(out/name,name)
print(out/'delster-tropical-can-viewer.html')
