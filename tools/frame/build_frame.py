"""Ø30 boru şasi: ham GLB (cascadio) → parçalara ayrılmış, metre, Y-yukarı, merkezli GLB + temsili katmanlar.
Kullanım: blender -b --factory-startup --python build_frame.py -- <raw.glb> <out_dir>
STEP eksenleri: X boyuna (0 = burun), Y düşey, Z yanal. Blender içe aktarımı: bx = X, by = -Z, bz = Y.
Borular STEP'te dolu çubuk; bu model kütle hesabında kullanılmaz (iskelet ≈ 17 kg, Tahmin).
"""
import bpy, bmesh, sys, os, math, json
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
RAW, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=RAW)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes:
    bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.join() if len(meshes) > 1 else None
src = bpy.context.view_layer.objects.active or meshes[0]
bpy.ops.object.select_all(action='DESELECT'); src.select_set(True); bpy.context.view_layer.objects.active = src
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in [o for o in bpy.context.scene.objects if o.type != 'MESH']: bpy.data.objects.remove(o)

vs = [v.co for v in src.data.vertices]
lo = Vector((min(c.x for c in vs), min(c.y for c in vs), min(c.z for c in vs)))
hi = Vector((max(c.x for c in vs), max(c.y for c in vs), max(c.z for c in vs)))
ext = hi - lo
RAW = 1.0 if ext.x > 100 else .001     # ham birim başına mm: ham mm ise 1, ham metre ise .001 (mm → ham)
TO_M = .001 if RAW == 1.0 else 1.0     # ham → metre
print('FRAME_RAW_EXTENT', tuple(round(e, 3) for e in ext), 'raw_is_mm', RAW == 1.0)
def S(b):   # Blender (ham) koordinatı → STEP mm
    return Vector((b.x, b.z, -b.y)) / RAW

# ---------------------------------------------------------------- parçalara ayır (kaynakla, gevşek parçalar)
bm = bmesh.new(); bm.from_mesh(src.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=.02 * RAW)
bm.to_mesh(src.data); bm.free()
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
pieces = [o for o in bpy.context.scene.objects if o.type == 'MESH']
print('FRAME_LOOSE_PARTS', len(pieces))

def step_box(o):
    pts = [S(o.matrix_world @ v.co) for v in o.data.vertices]
    a = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    b = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return a, b

groups = {'Frame': [], 'BatteryBox': [], 'UnknownPartL': [], 'UnknownPartR': []}
for o in pieces:
    a, b = step_box(o); c = (a + b) / 2
    # Devir kaydındaki aralıklar: akü x 2100–2320, y 15–105, |z| ≤ 170; belirsiz parçalar x 945–1268, y 440–940, |z| 290–440
    if 2080 <= a.x and b.x <= 2340 and a.y >= 0 and b.y <= 125 and abs(c.z) < 60 and (b.x - a.x) > 150:
        groups['BatteryBox'].append(o)
    elif 930 <= a.x and b.x <= 1285 and a.y >= 420 and b.y <= 960 and 270 <= abs(c.z) <= 460 and (b - a).length < 700:
        groups['UnknownPartL' if c.z > 0 else 'UnknownPartR'].append(o)
    else:
        groups['Frame'].append(o)
parts = {}
for name, objs in groups.items():
    if not objs: print('FRAME_MISSING', name); continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = name; ob.data.name = name; parts[name] = ob
    a, b = step_box(ob)
    print('FRAME_PART', name, 'pieces', len(objs), 'x', round(a.x), round(b.x), 'y', round(a.y), round(b.y), 'z', round(a.z), round(b.z))

# ---------------------------------------------------------------- ölçüler (STEP mm)
fa, fb = step_box(parts['Frame'])
size = fb - fa
nose = [S(parts['Frame'].matrix_world @ v.co) for v in parts['Frame'].data.vertices]
nose_z = [p.z for p in nose if p.x < fa.x + 20]
measure = {'extent_mm': {'x_length': round(size.x), 'y_height': round(size.y), 'z_width': round(size.z)},
           'nose_width_outer_mm': round(max(nose_z) - min(nose_z)) if nose_z else None,
           'frame_min': [round(c) for c in fa], 'frame_max': [round(c) for c in fb]}
print('FRAME_MEASURE', json.dumps(measure))

# ---------------------------------------------------------------- temsili katmanlar (çizimde yok)
WHEEL_R, WHEEL_W, WHEEL_Y = 250, 90, 115        # 16" varsayım, teker merkezi Y=115 (devir kaydı 15.2)
XF, XR, TF, TR = 550, 2825, 1010, 875           # ÖNCEKİ aday dingil/iz (devir kaydı 15.3). Site 1900 adayını gösterir (platform/src/layout-1900.js);
                                                # buradaki fırınlanmış Rep* katmanları sahnede kullanılmaz. STEP girdisi depoda yok, GLB yeniden üretilmedi.
def B(x, y, z):   # STEP mm → Blender (ham)
    return Vector((x, -z, y)) * RAW
def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob
def rod(bm, p, q, r, seg=10):
    p, q = Vector(p), Vector(q); d = q - p; L = d.length
    ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=L)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p + q) / 2) @ rot, verts=ret['verts'])

bm = bmesh.new()
for x, t in ((XF, TF), (XF, -TF), (XR, TR), (XR, -TR)):
    c = B(x, WHEEL_Y, t / 2)
    for r, w in ((WHEEL_R, WHEEL_W), (WHEEL_R * .66, WHEEL_W * 1.05)):
        ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=r * RAW, radius2=r * RAW, depth=w * RAW)
        bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Rotation(math.pi / 2, 4, 'X'), verts=ret['verts'])
wheels = new_obj('RepWheels', bm)

bm = bmesh.new()
for x, t, fx in ((XF, TF, (420, 700)), (XR, TR, (2650, 2790))):
    for s in (1, -1):
        hub = t / 2 - 70
        for hy, fy in ((WHEEL_Y - 60, 0), (WHEEL_Y + 75, 250 if x == XF else 300)):
            for f in fx:
                rod(bm, B(x, hy, s * hub), B(f, fy, s * 250), 10 * RAW)
susp = new_obj('RepSuspension', bm)

bm = bmesh.new()
ret = bmesh.ops.create_cube(bm, size=1.0)
bmesh.ops.transform(bm, matrix=Matrix.Translation(B(2640, WHEEL_Y + 20, 0)) @ Matrix.Diagonal((220 * RAW, 260 * RAW, 200 * RAW, 1)), verts=ret['verts'])
for s in (1, -1):
    rod(bm, B(2640, WHEEL_Y, s * 120), B(XR, WHEEL_Y, s * (TR / 2 - 60)), 13 * RAW)
diff = new_obj('RepDrivetrain', bm)

bm = bmesh.new()
ret = bmesh.ops.create_cube(bm, size=1.0)       # oturak
bmesh.ops.transform(bm, matrix=Matrix.Translation(B(1700, 70, 0)) @ Matrix.Diagonal((420 * RAW, 440 * RAW, 60 * RAW, 1)), verts=ret['verts'])
ret = bmesh.ops.create_cube(bm, size=1.0)       # sırtlık, dikeyden ≈34° geriye (Tahmin)
a = math.radians(34)
bmesh.ops.transform(bm, matrix=Matrix.Translation(B(1930 + 160 * math.sin(a), 70 + 300 * math.cos(a), 0)) @ Matrix.Rotation(-a, 4, 'Y') @ Matrix.Diagonal((50 * RAW, 440 * RAW, 620 * RAW, 1)), verts=ret['verts'])
seat = new_obj('RepSeat', bm)

# Kabuk: iskelet + tekerlek üstlerinin dışbükey zarfı, biraz büyütülmüş (yarı saydam gösterilir)
bm = bmesh.new()
for v in list(parts['Frame'].data.vertices)[::7]: bm.verts.new(parts['Frame'].matrix_world @ v.co)
for x, t in ((XF, TF), (XF, -TF), (XR, TR), (XR, -TR)):
    for ang in range(0, 181, 30):
        r = math.radians(ang)
        bm.verts.new(B(x + WHEEL_R * 1.08 * math.cos(r), WHEEL_Y + WHEEL_R * 1.08 * math.sin(r), t / 2 + math.copysign(WHEEL_W * .6, t)))
bmesh.ops.convex_hull(bm, input=bm.verts[:])
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
cen = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
for v in bm.verts: v.co = cen + (v.co - cen) * 1.02
shell = new_obj('RepShell', bm)

# ---------------------------------------------------------------- metre, merkez, zemin = 0
allobj = [o for o in bpy.context.scene.objects if o.type == 'MESH']
fa_b, fb_b = B(fa.x, fa.y, fa.z), B(fb.x, fb.y, fb.z)
center = (fa_b + fb_b) / 2
ground = (WHEEL_Y - WHEEL_R) * RAW
for o in allobj:
    o.data.transform(Matrix.Diagonal((TO_M,) * 3 + (1,)) @ Matrix.Translation(Vector((-center.x, -center.y, -ground))))
    o.data.update()
mat = {}
for name, col in (('Frame', (.78, .80, .82)), ('BatteryBox', (.10, .11, .12)), ('UnknownPartL', (.85, .55, .25)), ('UnknownPartR', (.85, .55, .25)),
                  ('RepWheels', (.12, .12, .13)), ('RepSuspension', (.45, .47, .5)), ('RepDrivetrain', (.35, .37, .4)), ('RepSeat', (.25, .27, .3)), ('RepShell', (.9, .9, .9))):
    m = bpy.data.materials.new('M_' + name); m.diffuse_color = (*col, 1); mat[name] = m
for o in allobj:
    o.data.materials.clear(); o.data.materials.append(mat[o.name])
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'frame-step.glb'), export_format='GLB', use_selection=True, export_apply=True,
                          export_yup=True, export_normals=True, export_texcoords=False, export_materials='EXPORT', export_animations=False)
stats = {o.name: len(o.data.polygons) for o in allobj}
measure['parts_faces'] = stats
json.dump(measure, open(os.path.join(OUT, 'frame-measure.json'), 'w'), indent=1)
print('FRAME_STATS', stats, 'bytes', os.path.getsize(os.path.join(OUT, 'frame-step.glb')))
