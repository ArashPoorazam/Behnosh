"""Render transparent fallback derivatives; never save or alter source .blend files."""
import bpy, sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
for name, source in [('tropical','output/tropical-can-hq/delster-tropical-can-hq.blend'),('classic','output/delster-classic.blend')]:
 bpy.ops.wm.open_mainfile(filepath=str(root/source))
 scene=bpy.context.scene
 scene.render.film_transparent=True
 scene.render.resolution_x=900
 scene.render.resolution_y=1000
 scene.render.resolution_percentage=100
 scene.cycles.samples=24
 for obj in scene.objects:
  if obj.type=='MESH' and any(s in obj.name.lower() for s in ['floor','ground','plane','backdrop']): obj.hide_render=True
 scene.render.image_settings.file_format='PNG'
 scene.render.image_settings.color_mode='RGBA'
 scene.render.filepath=str(root/f'.local/{name}-poster.png')
 bpy.ops.render.render(write_still=True)
