"""Refined can mesh, two texture variants, and 4K studio renders."""
from pathlib import Path
import json
import math
import os
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output'/'tropical-can-hq'
S=.0003
BOTTOM=492
PROFILE=[(470,105),(466,109),(461,110.5),(450,111),(420,111),
         (380,111),(340,111),(300,111),(260,111),(220,111),(195,111),
         (186,110),(179,106),(171,101),(162,96),(154,92),(149,91),(140,91)]
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

silver=material('Fine brushed aluminum',(.62,.65,.67),1,.24)
silver.node_tree.nodes['Principled BSDF'].inputs['Anisotropic'].default_value=.38
dark=material('Recessed aluminum score',(.10,.12,.12),.9,.30)
ink=material('Tropical print with clear protective lacquer', (1,1,1),.04,.34)
ink.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.26
ink.node_tree.nodes['Principled BSDF'].inputs['Coat Weight'].default_value=.22
ink.node_tree.nodes['Principled BSDF'].inputs['Coat Roughness'].default_value=.24
tex=ink.node_tree.nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(OUT/'texture-enhanced.png'));tex.image.pack()
original_image=bpy.data.images.load(str(OUT/'source-original.png'));original_image.pack()
original_image.use_fake_user=True
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

def lathe(name,profile,mat,n=256,textured=False):
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

# Monotone cubic interpolation rounds transitions without overshooting the outline.
def smooth_profile(profile,step=2):
    pts=sorted(profile);xs=[p[0] for p in pts];rs=[p[1] for p in pts]
    slopes=[(rs[i+1]-rs[i])/(xs[i+1]-xs[i]) for i in range(len(xs)-1)]
    tangents=[slopes[0]]
    for a,b in zip(slopes,slopes[1:]):
        tangents.append(0 if a*b<=0 else 2*a*b/(a+b))
    tangents.append(slopes[-1]);result=[]
    for i in range(len(xs)-1):
        span=xs[i+1]-xs[i];steps=max(1,math.ceil(span/step))
        for j in range(steps):
            t=j/steps
            r=(2*t**3-3*t*t+1)*rs[i]+(t**3-2*t*t+t)*span*tangents[i]+(-2*t**3+3*t*t)*rs[i+1]+(t**3-t*t)*span*tangents[i+1]
            result.append((xs[i]+span*t,r))
    result.append(pts[-1]);return list(reversed(result))
dense=smooth_profile(PROFILE)
body=lathe('Can body — original front print and inferred striped reverse',dense,ink,textured=True)

lathe('Domed underside and standing ring',[(480,0),(480.2,20),(482,45),(486,65),
      (489,77),(491,82),(491.3,84),(491,86),(489,88),(486,90),
      (482,94),(477,99),(473,104),(470,107),(466,109)],silver)
lathe('Precision rolled double seam',[(143,90.6),(141,92),(139,93.5),
      (136,94),(133,93.8),(130,92.5),(128.4,90.8),(128.2,89.5),
      (129,88.3),(131,87.8),(134,88),(136,89),(137,90.2),(140,90.6),(143,90.6)],silver)
lathe('Recessed end panel and strengthening channel',[(139,0),(139,62),
      (139,70),(139.3,73),(140.5,76),(143,79),(144,81),
      (143.5,82),(141.5,84),(137,86.5),(133,87.8)],silver)

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
lid_z=(BOTTOM-139)*S
points=[]
for j in range(160):
    t=2*math.pi*j/160
    points.append((.0115*math.cos(t)*(1-.13*math.sin(t)),-.0105+.0077*math.sin(t),lid_z+.000025))
tube('Fine scored unopened drinking panel',points,.000055,dark)

def pull_tab():
    n=128;verts=[]
    z=lid_z+.00018
    # Eccentric opening leaves a solid nose and bridge anchored by the rivet.
    for level in [z,z+.00045]:
        for rx,ry,cy,power in [(.0075,.013,.0025,.82),(.0046,.0064,.008,1)]:
            for j in range(n):
                t=2*math.pi*j/n
                c=math.cos(t);s=math.sin(t)
                verts.append((rx*math.copysign(abs(c)**power,c),cy+ry*math.copysign(abs(s)**power,s),level))
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
    bevel=ob.modifiers.new('Rolled edges of stamped tab','BEVEL');bevel.width=.00016;bevel.segments=4
    bpy.ops.object.modifier_apply(modifier=bevel.name);ob.select_set(False)
pull_tab()
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=20,radius=1,location=(0,-.0048,lid_z+.00065))
rivet=bpy.context.object;rivet.name='Cold formed fastening rivet';rivet.scale=(.00185,.00185,.0004)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
rivet.data.materials.append(silver)
for p in rivet.data.polygons:p.use_smooth=True
model.append(rivet)

# Slight stamped ridges provide readable highlights at grazing angles.
for name,rx,ry,cy in [('Tab rolled outer edge',.0069,.0124,.0025),('Tab finger opening edge',.0049,.0067,.008)]:
    points=[(rx*math.cos(t),cy+ry*math.sin(t),lid_z+.00069) for t in [2*math.pi*j/128 for j in range(128)]]
    tube(name,points,.000095,silver)

for ob in model:ob['reference']='Single front photo. Top, base, reverse and physical size inferred.'
body['estimated_height_mm']=109
body['estimated_diameter_mm']=66.6
bpy.ops.object.select_all(action='DESELECT')
for ob in model:ob.select_set(True)
bpy.context.view_layer.objects.active=body
enhanced_image=tex.image
silver.node_tree.nodes['Principled BSDF'].inputs['Anisotropic'].default_value=0
tex.image=original_image
bpy.ops.export_scene.gltf(filepath=str(OUT/'delster-tropical-can-original-art.glb'),export_format='GLB',use_selection=True,export_apply=True)
tex.image=enhanced_image
bpy.ops.export_scene.gltf(filepath=str(OUT/'delster-tropical-can-hq.glb'),export_format='GLB',use_selection=True,export_apply=True)
silver.node_tree.nodes['Principled BSDF'].inputs['Anisotropic'].default_value=.38

# Microscopic brushing is render-only; portable GLB uses the matching PBR finish.
nodes=silver.node_tree.nodes;links=silver.node_tree.links
coord=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(2400,2400,160)
noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1;noise.inputs['Detail'].default_value=2
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.000003
links.new(coord.outputs['Object'],mapping.inputs[0]);links.new(mapping.outputs['Vector'],noise.inputs['Vector']);links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes['Principled BSDF'].inputs['Normal'])

floor_mat=material('Soft ivory studio floor',(.54,.57,.53),0,.85)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0))
bpy.context.object.name='Studio floor (not exported)';bpy.context.object.data.materials.append(floor_mat)
def aim(ob,point):ob.rotation_euler=(Vector(point)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,size,size_y,color=(1,1,1)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE'
    data.size=size;data.size_y=size_y;data.color=color
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,.055))
area('Key softbox',(-.18,-.22,.25),1.0,.12,.25)
area('Right strip',(.18,-.05,.15),.7,.035,.23,(.94,.98,1))
area('Rear rim',(-.09,.15,.20),1.7,.09,.22)
area('Front fill',(0,-.3,.10),.3,.20,.20)
bpy.ops.object.camera_add(location=(.005,-.40,.105))
camera=bpy.context.object;aim(camera,(0,0,.055));camera.data.type='ORTHO';camera.data.ortho_scale=.151
scene=bpy.context.scene;scene.camera=camera;scene.unit_settings.system='METRIC'
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
scene.cycles.adaptive_threshold=.04;scene.cycles.adaptive_min_samples=8
scene.cycles.max_bounces=6
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.7,.7,.7,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.24
scene.render.resolution_x=3600;scene.render.resolution_y=4000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='Khronos PBR Neutral'
scene.render.filepath=str(OUT/'delster-tropical-can-hq-front.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'delster-tropical-can-hq.blend'))
if os.environ.get('HQ_PREVIEW'):
    scene.render.resolution_percentage=25;scene.cycles.samples=24
    scene.render.filepath=str(OUT/'check-front.png')
bpy.ops.render.render(write_still=True)
camera.location=(.15,-.40,.18);aim(camera,(0,0,.055))
scene.render.filepath=str(OUT/('check-angle.png' if os.environ.get('HQ_PREVIEW') else 'delster-tropical-can-hq-angle.png'));bpy.ops.render.render(write_still=True)
stats={'objects':len(model),'vertices':sum(len(o.data.vertices) for o in model),
       'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in model),
       'estimated_height_mm':109,'estimated_diameter_mm':66.6}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2))
print(json.dumps(stats))
