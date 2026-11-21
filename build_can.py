"""Single-photo can reconstruction. Uses the original image directly as a UV texture."""
from pathlib import Path
import json
import math
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output'/'tropical-can'
S=.0003
BOTTOM=492
PROFILE=[(470,105),(466,109),(461,110.5),(450,111),(420,111),
         (380,111),(340,111),(300,111),(260,111),(220,111),(195,111),
         (186,110),(179,106),(171,101),(162,96),(154,92),(149,91),(145,91)]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
model=[]

def material(name,color,metal=0,rough=.35):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    return m

silver=material('Satin aluminum',(.56,.59,.60),.88,.28)
dark=material('Scored aluminum',(.17,.19,.19),.82,.32)
ink=material('Original tropical print', (1,1,1),.18,.40)
ink.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.24
tex=ink.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(OUT/'source.png'));tex.image.pack()
tex.interpolation='Linear'
ink.node_tree.links.new(tex.outputs['Color'],ink.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

def mesh(name,verts,faces,mat,uvs=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
    data.materials.append(mat)
    for p in data.polygons:p.use_smooth=True
    if uvs:
        layer=data.uv_layers.new(name='Photo projection')
        for poly in data.polygons:
            for loop in poly.loop_indices:
                layer.data[loop].uv=uvs[data.loops[loop].vertex_index]
    model.append(ob)
    return ob

def lathe(name,profile,mat,n=192,textured=False):
    verts=[];uvs=[];rings=[]
    # Duplicate the seam only for the textured wrap, preserving independent UVs.
    count=n+1 if textured else n
    for y,r in profile:
        if r==0:
            rings.append([len(verts)]);verts.append((0,0,(BOTTOM-y)*S));uvs.append((.5,.5));continue
        rings.append(list(range(len(verts),len(verts)+count)))
        for j in range(count):
            t=-math.pi+2*math.pi*j/n
            verts.append((r*S*math.sin(t),-r*S*math.cos(t),(BOTTOM-y)*S))
            if math.cos(t)>=0:
                # Orthographic front projection preserves the original text and emblem.
                x=300+r*.975*math.sin(t)
            else:
                # Unseen reverse continues the green striped edge of the photo.
                # Move smoothly between the two edge strips around the rear.
                edge=.975
                if t<0:x=300-r*edge
                else:x=300+r*edge
            uvs.append((x/600 if textured else j/n,1-y/600))
    faces=[]
    for a,b in zip(rings,rings[1:]):
        for j in range(n):
            k=j+1 if textured else (j+1)%n
            if len(a)==1:faces.append((a[0],b[k],b[j]))
            elif len(b)==1:faces.append((a[j],a[k],b[0]))
            else:faces.append((a[j],a[k],b[k],b[j]))
    return mesh(name,verts,faces,mat,uvs if textured else None)

# Densify vertically for clean curved texture projection and shoulder geometry.
dense=[]
for (y,r),(yn,rn) in zip(PROFILE,PROFILE[1:]):
    steps=max(1,math.ceil((y-yn)/3))
    dense.extend((y+(yn-y)*i/steps,r+(rn-r)*i/steps) for i in range(steps))
dense.append(PROFILE[-1])
body=lathe('Can body — original front print and inferred striped reverse',dense,ink,textured=True)

lathe('Bottom chime and recessed base',[(484,0),(486,50),(490,75),(491,83),
      (489,88),(485,94),(480,99),(475,104),(470,107),(466,109)],silver)
lathe('Upper rolled double seam',[(150,90),(147,92),(145,94),(140,94),
      (136,93.7),(132,92.5),(129,90.8),(128,88.7),(130,87.2),
      (133,86.8),(139,87),(143,88),(145,90)],silver)
lathe('Recessed lid with concentric channel',[(140,0),(140,72),(139.6,75),
      (140.2,78),(142,80),(142.2,82),(140.2,84),(137.5,86),(135.5,87)],silver)

def tube(name,points,r,mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D'
    curve.resolution_u=12;curve.bevel_depth=r;curve.bevel_resolution=3
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for point,xyz in zip(spline.points,points):point.co=(*xyz,1)
    spline.use_cyclic_u=True
    ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bpy.ops.object.convert(target='MESH');ob.select_set(False)
    model.append(ob)
    return ob

# Unopened lid: scored drinking panel, raised ring pull and central rivet.
lid_z=(BOTTOM-140)*S
points=[]
for j in range(96):
    t=2*math.pi*j/96
    points.append((.012*math.cos(t),-.010+.008*math.sin(t),lid_z+.00010))
tube('Scored unopened drinking panel',points,.00013,dark)

def pull_tab():
    n=96;verts=[]
    z=lid_z+.00055
    # Ring-shaped stamped metal plate, with a visible finger opening.
    for level in [z,z+.00065]:
        for rx,ry in [(.008,.014),(.0048,.0088)]:
            for j in range(n):
                t=2*math.pi*j/n
                verts.append((rx*math.cos(t),.004+ry*math.sin(t),level))
    faces=[]
    for j in range(n):
        k=(j+1)%n
        faces += [(j,k,n+k,n+j),(2*n+j,3*n+j,3*n+k,2*n+k),
                  (j,2*n+j,2*n+k,k),(n+j,n+k,3*n+k,3*n+j)]
    ob=mesh('Raised aluminum pull tab',verts,faces,silver)
    # Recalculate normals for all four ring surfaces.
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    bevel=ob.modifiers.new('Rounded stamped edges','BEVEL');bevel.width=.00025;bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name);ob.select_set(False)
pull_tab()
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=12,radius=1,location=(0,-.005,lid_z+.0009))
rivet=bpy.context.object;rivet.name='Pull tab rivet';rivet.scale=(.0023,.0023,.00065)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
rivet.data.materials.append(silver)
for p in rivet.data.polygons:p.use_smooth=True
model.append(rivet)

for ob in model:ob['reference']='Single front photo. Top, base, reverse and physical size inferred.'
body['estimated_height_mm']=109
body['estimated_diameter_mm']=66.6
bpy.ops.object.select_all(action='DESELECT')
for ob in model:ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(OUT/'delster-tropical-can.glb'),export_format='GLB',use_selection=True,export_apply=True)

floor_mat=material('Warm studio floor',(.66,.68,.64),0,.8)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0))
bpy.context.object.name='Studio floor (not exported)';bpy.context.object.data.materials.append(floor_mat)
def aim(ob,point):ob.rotation_euler=(Vector(point)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,size,size_y,color=(1,1,1)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE'
    data.size=size;data.size_y=size_y;data.color=color
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,.055))
area('Key softbox',(-.18,-.22,.25),1.6,.14,.25)
area('Right strip',(.18,-.05,.15),1.0,.045,.23,(.88,.96,1))
area('Rear rim',(-.09,.15,.20),2.2,.13,.22)
area('Front fill',(0,-.3,.10),.5,.20,.20)
bpy.ops.object.camera_add(location=(.005,-.40,.105))
camera=bpy.context.object;aim(camera,(0,0,.055));camera.data.type='ORTHO';camera.data.ortho_scale=.151
scene=bpy.context.scene;scene.camera=camera;scene.unit_settings.system='METRIC'
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.7,.7,.7,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
scene.render.filepath=str(OUT/'delster-tropical-can-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'delster-tropical-can.blend'))
bpy.ops.render.render(write_still=True)
camera.location=(.19,-.38,.19);aim(camera,(0,0,.055))
scene.render.filepath=str(OUT/'delster-tropical-can-angle.png');bpy.ops.render.render(write_still=True)
stats={'objects':len(model),'vertices':sum(len(o.data.vertices) for o in model),
       'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in model),
       'estimated_height_mm':109,'estimated_diameter_mm':66.6}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2))
print(json.dumps(stats))
