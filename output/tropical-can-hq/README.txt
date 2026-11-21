DELSTER TROPICAL — REFINED 3D MODEL

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
