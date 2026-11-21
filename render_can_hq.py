"""Render final 4K deliverables from the saved, verified scene."""
from pathlib import Path
import bpy
from mathutils import Vector

out=Path(__file__).resolve().parent/'output'/'tropical-can-hq'
bpy.ops.wm.open_mainfile(filepath=str(out/'delster-tropical-can-hq.blend'))
scene=bpy.context.scene
scene.view_settings.view_transform='Khronos PBR Neutral'
scene.render.resolution_percentage=100
scene.render.filepath=str(out/'delster-tropical-can-hq-front.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'delster-tropical-can-hq.blend'))
camera=scene.camera
front_location=camera.location.copy();front_rotation=camera.rotation_euler.copy()
camera.location=(.15,-.40,.18)
camera.rotation_euler=(Vector((0,0,.055))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_percentage=25
scene.render.filepath=str(out/'check-neutral.png')
bpy.ops.render.render(write_still=True)
scene.render.resolution_percentage=100
scene.render.filepath=str(out/'delster-tropical-can-hq-angle.png')
bpy.ops.render.render(write_still=True)
camera.location=front_location;camera.rotation_euler=front_rotation
scene.render.filepath=str(out/'delster-tropical-can-hq-front.png')
bpy.ops.render.render(write_still=True)
