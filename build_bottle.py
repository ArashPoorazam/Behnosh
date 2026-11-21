"""Build a renderable bottle from the supplied front reference; run with bpy 4.3."""
from pathlib import Path
import math
import json
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output'
SOURCE = Path('/home/daedalus/Pictures/behnosh/1- کلاسیک.png')
OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
S = 0.0005  # 533 image pixels -> estimated 266.5 mm height
CENTER = 299.5
BOTTOM = 568
PROFILE = [(568,0),(567,48),(565,60),(561,66),(553,69),(540,70),
           (500,70.5),(450,70.5),(400,70.5),(350,70.5),(310,70.5),
           (291,70),(277,68),(263,63),(250,56),(238,49),(226,43),
           (211,39),(193,36),(172,34),(153,32.5),(130,32),
           (106,31),(91,30.5),(80,30.5),(77,32.5),(71,33),
           (62,31),(55,29.5),(49,29),(43,29),(41,0)]

def radius(y):
    for (a,ra),(b,rb) in zip(PROFILE,PROFILE[1:]):
        if b <= y <= a:
            return rb+(ra-rb)*(y-b)/(a-b)
    return 29

def material(name, color, roughness=.3, metal=0, transmission=0):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness
    p.inputs['Metallic'].default_value=metal
    p.inputs['Transmission Weight'].default_value=transmission
    p.inputs['IOR'].default_value=1.47
    return m

amber=material('Amber brown glass',(.075,.028,.010),.20,0,.32)
silver=material('Brushed silver crown cap',(.57,.60,.63),.25,.92)
paper=material('Ivory neck wrap',(.86,.86,.82),.53)
ink=material('Original printed label', (1,1,1),.56)
ink.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.12
tex=ink.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(SOURCE))
tex.image.pack()
tex.interpolation='Linear'
ink.node_tree.links.new(tex.outputs['Color'],ink.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
model=[]

def mesh_object(name,verts,faces,mat,uvs=None):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    ob=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if uvs:
        uv=mesh.uv_layers.new(name='Reference UV')
        for poly in mesh.polygons:
            for loop in poly.loop_indices:
                uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    for p in mesh.polygons:
        p.use_smooth=True
    model.append(ob)
    return ob

def lathe(name,profile,mat,n=128,flute=None):
    verts=[]; rings=[]
    for y,r in profile:
        if r == 0:
            rings.append([len(verts)])
            verts.append((0,0,(BOTTOM-y)*S))
            continue
        rings.append(list(range(len(verts),len(verts)+n)))
        for j in range(n):
            t=2*math.pi*j/n
            rr=r+(flute(y,t) if flute else 0)
            verts.append((rr*S*math.sin(t),-rr*S*math.cos(t),(BOTTOM-y)*S))
    faces=[]
    for lower,upper in zip(rings,rings[1:]):
        for j in range(n):
            k=(j+1)%n
            if len(lower)==1:
                faces.append((lower[0],upper[k],upper[j]))
            elif len(upper)==1:
                faces.append((lower[j],lower[k],upper[0]))
            else:
                faces.append((lower[j],lower[k],upper[k],upper[j]))
    return mesh_object(name,verts,faces,mat)

body=lathe('Bottle — amber glass',PROFILE,amber,96)
sub=body.modifiers.new('Smooth bottle profile','SUBSURF')
sub.levels=1
sub.render_levels=1
bpy.context.view_layer.objects.active=body
bpy.ops.object.modifier_apply(modifier=sub.name)

# Actual crimped crown geometry, including a recessed top disk.
cap_profile=[(54,0),(54,29),(53.5,32),(52,33),(49,32.6),
             (43,31.8),(39,30.5),(36,28.6),(35.4,26.5),(35.4,22),
             (35.7,20),(35.7,1),(35.7,0)]
cap=lathe('Crown cap — 21 fluted teeth',cap_profile,silver,126,
          lambda y,t: (1.4 if y>43 else max(0,(y-36)/7)*1.4)*math.cos(21*t) if y>36 else 0)
bev=cap.modifiers.new('Soft metal edges','BEVEL')
bev.width=.00018
bev.segments=2
bpy.context.view_layer.objects.active=cap
bpy.ops.object.modifier_apply(modifier=bev.name)

# Full neck paper band; the source photograph supplies the visible front ink.
neck_profile=[(y,radius(y)+.20) for y in [158,153,145,135,125,115,105,98]]
lathe('Neck label — plain reverse',neck_profile,paper)

def label_patch(name,top_fn,bottom_fn,halfwidth_fn,nx,ny):
    verts=[]; uvs=[]
    for row in range(ny+1):
        v=row/ny
        for col in range(nx+1):
            u=2*col/nx-1
            y=bottom_fn(u)*(1-v)+top_fn(u)*v
            r=radius(y)
            x=u*halfwidth_fn(y)
            depth=math.sqrt(max(0,r*r-x*x))
            # Tiny radial offset separates paper from glass without z fighting.
            factor=1+.38/max(r,1)
            verts.append((x*S*factor,-depth*S*factor,(BOTTOM-y)*S))
            uvs.append(((CENTER+x)/600,1-y/600))
    faces=[]
    for row in range(ny):
        for col in range(nx):
            a=row*(nx+1)+col
            faces.append((a,a+1,a+nx+2,a+nx+1))
    return mesh_object(name,verts,faces,ink,uvs)

label_patch('Front label — original Delster Classic artwork',
            lambda u:305+73*(1-math.sqrt(max(0,1-u*u))),
            lambda u:532-23*(1-math.sqrt(max(0,1-u*u))),
            lambda y:min(68.2,radius(y)*.972),96,52)
label_patch('Neck label — original artwork',
            lambda u:98+1.5*u*u,lambda u:157-3*u*u,
            lambda y:radius(y)*.982,80,18)

for ob in model:
    ob['reference']='Single front image; hidden geometry inferred'
body['estimated_height_m']=.2665
body['estimated_body_diameter_m']=.0705

bpy.ops.object.select_all(action='DESELECT')
for ob in model: ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(OUT/'delster-classic.glb'),
                         export_format='GLB',use_selection=True,
                         export_apply=True,export_yup=True)

# Studio setup remains editable in the .blend, but is excluded from the GLB.
floor_mat=material('Studio warm white',(.72,.70,.65),.75)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.0007))
floor=bpy.context.object
floor.name='Studio floor (not exported)'
floor.data.materials.append(floor_mat)

def aim(ob,point):
    ob.rotation_euler=(Vector(point)-ob.location).to_track_quat('-Z','Y').to_euler()

def area(name,loc,power,size,color=(1,1,1),size_y=None):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power*.16; data.color=color
    data.shape='RECTANGLE'; data.size=size; data.size_y=size_y or size
    ob=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(ob)
    ob.location=loc; aim(ob,(0,0,.14))

area('Left tall softbox',(-.23,-.24,.30),12,.12,(1,.91,.78),.38)
area('Right strip',(.19,-.08,.24),8,.055,(.84,.91,1),.32)
area('Rear rim',(-.08,.16,.30),15,.15,(1,.82,.60),.30)
area('Front fill',(0,-.42,.17),2,.25)
bpy.ops.object.camera_add(location=(.012,-.58,.19))
camera=bpy.context.object; camera.name='Product camera'
aim(camera,(0,0,.134))
camera.data.type='ORTHO';camera.data.ortho_scale=.318
scene=bpy.context.scene;scene.camera=camera
scene.unit_settings.system='METRIC'
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.65,.65,.65,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.render.resolution_x=1000;scene.render.resolution_y=1200
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX'
scene.render.filepath=str(OUT/'delster-classic-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'delster-classic.blend'))
bpy.ops.render.render(write_still=True)
camera.location=(.37,-.49,.22);aim(camera,(0,0,.134))
scene.render.filepath=str(OUT/'delster-classic-angle.png')
bpy.ops.render.render(write_still=True)
stats={'objects':len(model),'vertices':sum(len(o.data.vertices) for o in model),
       'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in model),
       'estimated_height_mm':266.5,'estimated_diameter_mm':70.5}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2))
print(json.dumps(stats))
