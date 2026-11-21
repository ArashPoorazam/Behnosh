DELSTER CLASSIC — SINGLE-IMAGE 3D RECONSTRUCTION

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
