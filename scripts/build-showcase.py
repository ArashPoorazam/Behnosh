"""Batch photo-projected products. Blender -b -t 4 --python scripts/build-showcase.py.
Original artwork is untouched. Cans use a plain lacquer shell and an oval decal,
so the photographed stripes never become part of the model. Back artwork and
physical dimensions are inferred. All products share geometry and studio setup.
"""
from pathlib import Path
import bpy, math, json, hashlib, shutil, os
from mathutils import Vector
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT/'output/showcase'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = Path(os.environ.get('BEVERAGE_SOURCE_DIR', '/home/daedalus/Pictures/behnosh'))
PRODUCTS = json.loads((ROOT/'scripts/showcase-products.json').read_text())
S = .01
CAN = [(488,0),(488,84),(485,94),(479,104),(469,110),(455,111),(185,111),(178,107),(162,97),(148,92),(133,92),(130,89)]
DADLI = [(546,0),(546,45),(542,59),(534,64),(515,65),(285,65),(269,62),(251,53),(233,43),(216,36),(195,32),(112,29),(91,29),(86,31),(76,31),(76,0)]
BOTTLE = [(572,0),(569,57),(563,69),(545,72),(300,72),(280,68),(255,55),(232,43),(204,35),(150,32),(63,30),(51,30),(51,0)]

def rgb(h):
    return tuple(((int(h[i:i+2],16)/255+.055)/1.055)**2.4 for i in (0,2,4))
def material(name,color,metal=0,rough=.25):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Coat Weight'].default_value=.4;p.inputs['Coat Roughness'].default_value=.16
    return m

def mesh(name,verts,faces,mat,uvs=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat)
    for p in data.polygons:p.use_smooth=True
    if uvs:
        uv=data.uv_layers.new(name='Original front artwork')
        for p in data.polygons:
            for k in p.loop_indices:uv.data[k].uv=uvs[data.loops[k].vertex_index]
    return ob

def lathe(name,profile,mat,center=300,photo=False,flute=False):
    verts=[];uv=[];faces=[];n=128
    for y,r in profile:
        for j in range(n+1):
            t=-math.pi+2*math.pi*j/n
            rr=r+(math.cos(t*21)*.8 if flute and r else 0)
            verts.append((rr*S*math.sin(t),-rr*S*math.cos(t),(600-y)*S))
            px=center+r*.97*math.sin(t) if math.cos(t)>=0 else center+math.copysign(r*.93,t)
            uv.append((px/600,1-y/600))
    for i in range(len(profile)-1):
        for j in range(n):
            a=i*(n+1)+j;b=a+n+1;faces.append((a,a+1,b+1,b))
    return mesh(name,verts,faces,mat,uv if photo else None)

def radius(profile,y):
    for (a,ra),(b,rb) in zip(profile,profile[1:]):
        if b<=y<=a:return rb+(ra-rb)*(y-b)/max(a-b,.001)
    return 65

def decal(profile,rect,mat):
    cx,cy,rx,ry=rect;verts=[];uv=[];faces=[]
    for i in range(25):
        for j in range(129):
            t=2*math.pi*j/128;r=max(.0001,i/24)
            x=rx*r*math.cos(t);y=cy+ry*r*math.sin(t)
            rad=radius(profile,y)
            verts.append((x*S,-math.sqrt(max(.1,rad*rad-x*x))*S-.004,(600-y)*S))
            uv.append(((cx+x)/600,1-y/600))
    for i in range(24):
        for j in range(128):
            a=i*129+j;faces.append((a,a+1,a+130,a+129))
    return mesh('Original oval label',verts,faces,mat,uv)

def aim(ob,p):ob.rotation_euler=(Vector(p)-ob.location).to_track_quat('-Z','Y').to_euler()
def studio(height,center):
    scene=bpy.context.scene
    for name,loc,power,w,h in [('Large softbox',(-5,-7,8),900,4,8),('Silver edge',(5,-2,6),1100,1.2,7),('Rim',(-3,4,7),1300,3,6),('Fill',(0,-8,2),180,5,5)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE';data.size=w;data.size_y=h
        ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,center))
    bpy.ops.object.camera_add(location=(.6,-18,center+3.0 if height<4 else center+1.8))
    cam=bpy.context.object;aim(cam,(0,0,center));cam.data.type='ORTHO';cam.data.ortho_scale=height*1.2;scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
    scene.cycles.max_bounces=6;scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.65,.75,.9,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25
    scene.render.film_transparent=True;scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='AgX'

for product in PRODUCTS:
    name=product['id'];source=OUT/'source'/f'{name}.png';source.parent.mkdir(exist_ok=True)
    if not source.exists():shutil.copyfile(SOURCE/product['source'],source)
    digest=hashlib.sha256(source.read_bytes()+Path(__file__).read_bytes()+json.dumps(product,sort_keys=True).encode()).hexdigest()
    stamp=OUT/f'{name}.sha256'
    if stamp.exists() and stamp.read_text()==digest and (OUT/f'{name}.glb').exists() and (OUT/f'{name}.png').exists():
        print('Cached:',name,flush=True);continue
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    kind=product['kind'];color=rgb(product['color']);profile=CAN if kind=='can' else DADLI if kind=='dadli' else BOTTLE
    shell=material('Smooth lacquer' if kind=='can' else 'Glossy glass sleeve',color,.52 if kind=='can' else .05,.23)
    silver=material('Polished aluminium',(.67,.71,.75),1,.2)
    ink=material('Original product artwork',(1,1,1),.1 if kind=='can' else 0,.3)
    tex=ink.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(source));tex.image.pack()
    ink.node_tree.links.new(tex.outputs['Color'],ink.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    lathe('Product shell',profile,shell if kind=='can' else ink,product['center'],kind!='can')
    if kind=='can':
        decal(CAN,product['label'],ink)
        lathe('Rolled upper seam',[(139,90),(135,94),(131,95),(127,93),(127,89),(132,88),(139,90)],silver)
        lathe('Recessed lid',[(136,0),(136,75),(139,80),(135,88)],silver)
        lathe('Lower silver ring',[(488,81),(490,85),(488,91),(483,96),(480,97)],silver)
        bpy.ops.mesh.primitive_torus_add(major_radius=.18,minor_radius=.045,major_segments=48,minor_segments=12,location=(0,.09,4.66))
        tab=bpy.context.object;tab.name='Aluminium pull tab';tab.scale=(.78,1.45,.45);tab.data.materials.append(silver)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.055,location=(0,-.12,4.67));bpy.context.object.data.materials.append(silver)
    else:
        top=76 if kind=='dadli' else 51
        cap=material('Crown cap',rgb('283e73') if name in ['dadli-orange','dadli-blue'] else color,.7,.24)
        lathe('Crimped crown',[(top+6,29),(top+3,32),(top-4,32),(top-10,29),(top-11,0)],cap,flute=True)
    # Low-poly surface condensation beads, deterministic placement.
    import random
    rand=random.Random(12);water=material('Condensation',(.75,.9,1),.05,.08)
    water.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.85
    for i in range(32):
        y=rand.uniform(170,465) if kind=='can' else rand.uniform(110,515)
        theta=rand.uniform(-1.35,1.35);r=radius(profile,y)*S+.012
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=rand.uniform(.012,.035),location=(r*math.sin(theta),-r*math.cos(theta),(600-y)*S))
        ob=bpy.context.object;ob.name='Condensation bead';ob.scale=(1,.6,1.2);ob.data.materials.append(water)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',use_selection=True,export_apply=True)
    lo=min(y for y,r in profile);hi=max(y for y,r in profile);height=(hi-lo)*S;center=(600-(hi+lo)/2)*S
    studio(height,center)
    bpy.context.scene.render.filepath=str(OUT/f'{name}.png')
    bpy.ops.render.render(write_still=True)
    stamp.write_text(digest);print('Completed:',name,flush=True)
