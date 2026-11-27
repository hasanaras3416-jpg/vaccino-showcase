"""VACCİNO referans sürücü (174 cm) — MPFB2 + MakeHuman CC0 system assets.
Kullanım: blender -b --python build_driver.py -- <assets_dir> <out_dir> [preview]
Çıktı: driver.blend, driver.glb (iskeletsiz, sabit poz), render.png
"""
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
ASSETS, OUT = argv[0], argv[1]
PREVIEW = len(argv) > 2 and argv[2] == 'preview'
os.makedirs(OUT, exist_ok=True)

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

HEIGHT = 1.74
RECLINE = 34.0  # derece, dikeyden geriye (Tahmin)

# ---------------------------------------------------------------- sahne
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def select_only(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def apply_modifiers(obj):
    select_only(obj)
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)

# ---------------------------------------------------------------- gövde
macro = TargetService.get_default_macro_info_dict()
macro['gender'] = 1.0
macro['age'] = 0.5
macro['muscle'] = 0.5
macro['weight'] = 0.5
body = HumanService.create_human(scale=0.1, macro_detail_dict=macro)
body.name = 'Body'
# MakeHuman hedeflerini (shape key) mevcut karışımla tabana işle
select_only(body)
if body.data.shape_keys:
    bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
# Boy: helper geometrisi hariç yalnız "body" grubunun yüksekliği
gi = body.vertex_groups['body'].index
zs = [v.co.z for v in body.data.vertices if any(g.group == gi and g.weight > .5 for g in v.groups)]
h = max(zs) - min(zs)
select_only(body)
body.scale = (HEIGHT / h,) * 3
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
lowest = min(v.co.z for v in body.data.vertices if any(g.group == gi and g.weight > .5 for g in v.groups))
body.location.z -= lowest
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

rig = HumanService.add_builtin_rig(body, 'default', import_weights=True)
rig.name = 'Rig'
shoes = HumanService.add_mhclo_asset(os.path.join(ASSETS, 'clothes/shoes06/shoes06.mhclo'), body,
                                     asset_type='Clothes', subdiv_levels=0)
shoes.name = 'Shoes'

# helper geometrisini at, gövdeyi sadeleştir
select_only(body)
for m in list(body.modifiers):
    if m.type == 'MASK':
        bpy.ops.object.modifier_apply(modifier=m.name)
for m in list(body.modifiers):
    if m.type not in ('ARMATURE',):
        bpy.ops.object.modifier_remove(modifier=m.name)
for obj in (body, shoes):
    for m in list(obj.modifiers):
        if m.type == 'SUBSURF':
            select_only(obj); bpy.ops.object.modifier_remove(modifier=m.name)

# ---------------------------------------------------------------- bölge seçimi (ağırlık gruplarından)
HAND = ('finger', 'metacarpal', 'wrist')
FOOT = ('foot', 'toe')
HEAD = ('head', 'jaw', 'eye', 'neck03', 'tongue', 'levator', 'oculi', 'orbicularis', 'oris', 'risorius', 'temporalis', 'special0')

def region_weight(obj, prefixes):
    names = {vg.index for vg in obj.vertex_groups if vg.name.startswith(prefixes)}
    return [sum(g.weight for g in v.groups if g.group in names) for v in obj.data.vertices]

def duplicate(obj, name):
    new = obj.copy(); new.data = obj.data.copy(); new.name = name
    bpy.context.collection.objects.link(new)
    return new

def keep_vertices(obj, keep):
    bm = bmesh.new(); bm.from_mesh(obj.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep[v.index]], context='VERTS')
    bm.to_mesh(obj.data); bm.free()

def outward_normals(obj, ref):
    """Normaller gövde merkezinden dışarı baksın (MakeHuman ağı içe dönük olabilir)."""
    me = obj.data
    me.update()
    score = sum((p.center - ref).dot(p.normal) for p in me.polygons)
    if score < 0:
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    return score

def push_out(obj, ref, gap):
    """Her köşeyi referans yüzeyden en az `gap` kadar dışarıda tut (dinlenme pozunda)."""
    tree = BVHTree.FromObject(ref, bpy.context.evaluated_depsgraph_get(), deform=False)
    moved = 0
    for v in obj.data.vertices:
        loc, nor, _, _ = tree.find_nearest(v.co)
        if loc is None: continue
        d = (v.co - loc).dot(nor)
        if d < gap:
            v.co = v.co + nor * (gap - d); moved += 1
    obj.data.update()
    return moved

def inflate(obj, amount):
    m = obj.modifiers.new('Inflate', 'DISPLACE'); m.mid_level = 0.0; m.strength = amount
    # deformasyondan önce uygula
    select_only(obj)
    bpy.ops.object.modifier_move_to_index(modifier='Inflate', index=0)
    bpy.ops.object.modifier_apply(modifier='Inflate')

hand_w, foot_w, head_w = region_weight(body, HAND), region_weight(body, FOOT), region_weight(body, HEAD)

# Tulum: gövdeden, el/ayak/baş hariç, 5 mm dışarı
suit = duplicate(body, 'Suit')
keep_vertices(suit, [hand_w[i] < .5 and foot_w[i] < .35 and head_w[i] < .3 for i in range(len(hand_w))])
body_center = sum((v.co for v in body.data.vertices), Vector()) / len(body.data.vertices)
print('VACCINO_NORMALS suit', outward_normals(suit, body_center))
inflate(suit, .007)
# kumaş: anatomik ayrıntıyı yumuşat (göğüs, karın, kasık), sınır kenarları sabit
fab = suit.modifiers.new('Fabric', 'CORRECTIVE_SMOOTH'); fab.factor = .9; fab.iterations = 18; fab.smooth_type = 'LENGTH_WEIGHTED'; fab.use_pin_boundary = True
fab.rest_source = 'ORCO'
lap = suit.modifiers.new('FabricLap', 'LAPLACIANSMOOTH'); lap.lambda_factor = .35; lap.iterations = 6; lap.use_volume_preserve = True
select_only(suit)
bpy.ops.object.modifier_move_to_index(modifier='Fabric', index=0)
bpy.ops.object.modifier_move_to_index(modifier='FabricLap', index=1)
bpy.ops.object.modifier_apply(modifier='Fabric')
bpy.ops.object.modifier_apply(modifier='FabricLap')
print('VACCINO_PUSH suit', push_out(suit, body, .006))
# Eldiven: el + bilek, 3 mm dışarı
gloves = duplicate(body, 'Gloves')
keep_vertices(gloves, [hand_w[i] > .3 for i in range(len(hand_w))])
# eldiven: her el kendi merkezine göre
for_center = sum((v.co for v in gloves.data.vertices), Vector()) / len(gloves.data.vertices)
me = gloves.data; me.update()
score = sum(p.normal.dot(Vector((1 if p.center.x > 0 else -1, 0, 0))) for p in me.polygons)
print('VACCINO_NORMALS gloves', score)
if score < 0:
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.reverse_faces(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
inflate(gloves, .0035)
print('VACCINO_PUSH gloves', push_out(gloves, body, .003))

# Temel gövde yüzü: özellik taşımayan manken başı (kimseye benzemesin)
head_vg = body.vertex_groups.new(name='face_smooth')
head_vg.add([i for i, w in enumerate(head_w) if w > .2], 1.0, 'REPLACE')
sm = body.modifiers.new('Featureless', 'SMOOTH'); sm.factor = 1.0; sm.iterations = 40; sm.vertex_group = 'face_smooth'
select_only(body)
bpy.ops.object.modifier_move_to_index(modifier='Featureless', index=0)
bpy.ops.object.modifier_apply(modifier='Featureless')

# ---------------------------------------------------------------- oturuş pozu
select_only(rig); bpy.ops.object.mode_set(mode='POSE')
P = rig.pose.bones

def aim(name, direction):
    pb = P[name]
    cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    head = pb.matrix.translation.copy()
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ pb.matrix
    bpy.context.view_layer.update()

def rad(d): return math.radians(d)
r = rad(RECLINE)
aim('spine05', (0, math.sin(r), math.cos(r)))           # alt omurga: geriye yatık
for b in ('spine04', 'spine03', 'spine02', 'spine01'):
    aim(b, (0, math.sin(r), math.cos(r)))
aim('neck01', (0, math.sin(r - rad(20)), math.cos(r - rad(20))))   # baş öne, yola bakar
aim('head', (0, math.sin(r - rad(28)), math.cos(r - rad(28))))
for s, sign in (('L', 1), ('R', -1)):
    aim(f'upperleg01.{s}', (sign * .10, -math.cos(rad(14)), math.sin(rad(14))))   # uyluk öne, diz hafif yukarı
    aim(f'lowerleg01.{s}', (sign * .02, -math.cos(rad(22)), -math.sin(rad(22))))  # baldır pedala
    aim(f'foot.{s}', (0, -math.cos(rad(62)), math.sin(rad(62))))                  # ayak pedal üstünde
    aim(f'upperarm01.{s}', (-sign * .06, -.80, -.42))                              # kol direksiyona
    aim(f'lowerarm01.{s}', (-sign * .16, -.95, .10))
    aim(f'wrist.{s}', (-sign * .10, -.95, .25))
    # parmaklar: simidi kavrayacak şekilde hafif bük
    for f in range(2, 6):
        for seg in (1, 2, 3):
            pb = P.get(f'finger{f}-{seg}.{s}')
            if pb:
                pb.rotation_mode = 'XYZ'; pb.rotation_euler.x += rad(38 if seg > 1 else 25)
    bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode='OBJECT')
# gövde ekseni: pozlanmış kemik başları (kemer ve V yerleşimi için)
J = {n: rig.matrix_world @ P[n].head for n in ('spine05', 'spine03', 'neck01', 'clavicle.L', 'clavicle.R') + tuple(f'{b}.{s}' for b in ('upperleg01', 'lowerleg01', 'foot', 'upperarm01', 'lowerarm01', 'wrist') for s in 'LR')}
print('VACCINO_JOINTS', {k: tuple(round(c, 3) for c in v) for k, v in J.items()})

# pozu sabitle, iskeleti kaldır
for obj in (body, suit, gloves, shoes):
    apply_modifiers(obj)
    obj.parent = None
    obj.vertex_groups.clear()
bpy.data.objects.remove(rig)


# ---------------------------------------------------------------- kask (pozlanmış baştan)
def head_points():
    bm = bmesh.new(); bm.from_mesh(body.data)
    pts = [v.co.copy() for v in bm.verts if head_w[v.index] > .5]
    bm.free(); return pts

def smooth01(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

hp = head_points()
up = Vector((0, math.sin(r - rad(28)), math.cos(r - rad(28)))).normalized()
fwd = Vector((0, -math.cos(r - rad(28)), math.sin(r - rad(28)))).normalized()
side = fwd.cross(up).normalized()
R3 = Matrix((side, fwd, up)).transposed()          # yerel (x yan, y ön, z üst) → dünya
basis = R3.to_4x4()
loc = [R3.transposed() @ p for p in hp]
lo3 = Vector((min(q.x for q in loc), min(q.y for q in loc), min(q.z for q in loc)))
hi3 = Vector((max(q.x for q in loc), max(q.y for q in loc), max(q.z for q in loc)))
cL = (lo3 + hi3) / 2; ext3 = (hi3 - lo3) / 2
center = R3 @ cL
ax, ay, az = ext3.x + .034, ext3.y + .040, ext3.z + .030   # kafa + köpük + kabuk payı
print('VACCINO_HEAD extents', tuple(round(c, 3) for c in ext3))

def L2W(x, y, z): return center + R3 @ Vector((x, y, z))

# Kabuk: elipsoit + öne çıkan çene + arkaya uzanan kabuk
me = bpy.data.meshes.new('HelmetShell'); shell = bpy.data.objects.new('HelmetShell', me)
bpy.context.collection.objects.link(shell)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1.0)
for v in bm.verts:
    x, y, z = v.co
    chin = .040 * smooth01(y / .55) * smooth01((-z - .10) / .65)      # alt-ön: çene çıkıntısı
    back = .026 * smooth01(-y / .6) * smooth01(1 - abs(z + .05) / .75)  # arka: hafif uzama
    crown = .006 * smooth01(z)                                          # tepe hafif yüksek
    v.co = L2W(x * ax, y * ay + chin - back, z * az - chin * .45 + crown)
bm.to_mesh(me); bm.free()
# alt açıklık: boyun hizasında kes (doldurma yok, gerçek kask gibi açık)
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=L2W(0, 0, -(ext3.z + .012)), plane_no=up, clear_inner=True)
bm.to_mesh(me); bm.free()
print('VACCINO_PUSH helmet', push_out(shell, body, .020))
Hs = BVHTree.FromObject(shell, bpy.context.evaluated_depsgraph_get())

def on_shell(x, y, z, out=0.0):
    """Merkezden yerel yöne ışın → kabuğun dış yüzeyi."""
    d = (R3 @ Vector((x, y, z))).normalized()
    p, n, _, _ = Hs.ray_cast(center, d, 1.0)
    if p is None: return center + d * .15, d
    if n.dot(d) < 0: n = -n
    return p + n * out, n

# Vizör açıklığı: geniş, yumuşak köşeli dikdörtgen (yerel x-z düzleminde)
EYE_Z = .012; VW, VH, VR = .238, .084, .034
def rounded_rect(w, h, rr, seg=10):
    pts = []
    for cx, cz, a0 in ((w/2 - rr, h/2 - rr, 0), (-w/2 + rr, h/2 - rr, 90), (-w/2 + rr, -h/2 + rr, 180), (w/2 - rr, -h/2 + rr, 270)):
        for k in range(seg + 1):
            t = rad(a0 + 90 * k / seg); pts.append((cx + rr * math.cos(t), cz + rr * math.sin(t)))
    return pts
def in_rect(x, z, w, h, rr):
    dx = max(abs(x) - (w/2 - rr), 0); dz = max(abs(z - EYE_Z) - (h/2 - rr), 0)
    return dx * dx + dz * dz <= rr * rr

# Vizör: kabuğun açıklık bölgesi (biraz taşkın), dışa 2 mm, 3 mm cam
visor = duplicate(shell, 'Visor')
bm = bmesh.new(); bm.from_mesh(visor.data)
Rt = R3.transposed()
def keep_face(f):
    q = Rt @ (f.calc_center_median() - center)
    return q.y > 0 and in_rect(q.x, q.z, VW + .016, VH + .016, VR + .008)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep_face(f)], context='FACES')
bm.to_mesh(visor.data); bm.free()
vd = visor.modifiers.new('Lift', 'DISPLACE'); vd.mid_level = 0; vd.strength = .002
vs = visor.modifiers.new('Glass', 'SOLIDIFY'); vs.thickness = .003; vs.offset = 1
vb = visor.modifiers.new('Chamfer', 'BEVEL'); vb.limit_method = 'ANGLE'; vb.angle_limit = rad(30); vb.width = .0025; vb.segments = 1
apply_modifiers(visor)

def tube(name, pts, radius, seg=10, closed=True):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    n = len(pts)
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if closed or i > 0 else p; b2 = pts[(i + 1) % n] if closed or i < n - 1 else p
        tng = (b2 - a).normalized()
        ref = up if abs(tng.dot(up)) < .9 else side
        u = tng.cross(ref).normalized(); w = tng.cross(u).normalized()
        rings.append([bm.verts.new(p + (u * math.cos(2 * math.pi * k / seg) + w * math.sin(2 * math.pi * k / seg)) * radius) for k in range(seg)])
    for i in range(n if closed else n - 1):
        A, B = rings[i], rings[(i + 1) % n]
        for k in range(seg): bm.faces.new((A[k], A[(k + 1) % seg], B[(k + 1) % seg], B[k]))
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob

# Conta (HelmetSeal): açıklık kenarında kauçuk halka
seal_pts = [on_shell(x, ay, z + EYE_Z, .0015)[0] for x, z in rounded_rect(VW + .006, VH + .006, VR + .003, 12)]
seal = tube('HelmetSeal', seal_pts, .0045, 10)

# Şerit (HelmetStripe): tepe orta hattı boyunca ince bant (site tarafında şampanya)
def band(name, dirs, width, thick=.0012):
    pts = [on_shell(*d, out=.0012) for d in dirs]
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rows = []
    for i, (p, n) in enumerate(pts):
        tng = (pts[min(i + 1, len(pts) - 1)][0] - pts[max(i - 1, 0)][0]).normalized()
        wv = tng.cross(n).normalized() * width / 2
        rows.append([bm.verts.new(p - wv), bm.verts.new(p + wv), bm.verts.new(p + wv + n * thick), bm.verts.new(p - wv + n * thick)])
    for A, B in zip(rows, rows[1:]):
        for k in range(4): bm.faces.new((A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]))
    bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob
stripe_dirs = []
for k in range(41):
    a_ = rad(62 - 170 * k / 40)            # ön-üstten tepe üzerinden arkaya
    stripe_dirs.append((0, math.cos(a_), math.sin(a_)))
stripe = band('HelmetStripe', stripe_dirs, .016)

# Kuyruk çıkıntısı: arka alt kabukta küçük kanatçık (kask parçası)
tail_p, tail_n = on_shell(0, -1, .12, -.004)
me = bpy.data.meshes.new('Tail'); tail = bpy.data.objects.new('Tail', me); bpy.context.collection.objects.link(tail)
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
for v in bm.verts:
    v.co.x *= .10; v.co.y *= .032; v.co.z *= .016
    if v.co.y > 0: v.co.z *= .45                 # arkaya doğru incelen kama
bm.to_mesh(me); bm.free()
tail.matrix_world = Matrix.Translation(tail_p - tail_n * .004) @ Matrix((side, -fwd, up)).transposed().to_4x4()   # yerel +y = geriye
tb = tail.modifiers.new('Chamfer', 'BEVEL'); tb.width = .004; tb.segments = 1; tb.limit_method = 'ANGLE'
apply_modifiers(tail); select_only(tail); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Kesiciler: vizör açıklığı + çenede 3 hava deliği
def prism(name, outline, depth, origin_y):
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    bm = bmesh.new()
    a1 = [bm.verts.new(L2W(x, origin_y, z)) for x, z in outline]
    a2 = [bm.verts.new(L2W(x, origin_y + depth, z)) for x, z in outline]
    n = len(outline)
    bm.faces.new(a1[::-1]); bm.faces.new(a2)
    for i in range(n): bm.faces.new((a1[i], a1[(i + 1) % n], a2[(i + 1) % n], a2[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free(); return ob
cutters = [prism('VisorCut', [(x, z + EYE_Z) for x, z in rounded_rect(VW, VH, VR)], .30, 0.0)]
chin_z = -(ext3.z * .62)
for vx in (-.022, 0.0, .022):
    cutters.append(prism('Vent', [(vx + x, chin_z + z) for x, z in rounded_rect(.007, .022, .0034, 4)], .25, .02))
select_only(cutters[0])
for c in cutters[1:]: c.select_set(True)
bpy.ops.object.join(); cutter = bpy.context.view_layer.objects.active

helmet = shell; helmet.name = 'Helmet'
sol = helmet.modifiers.new('Shell', 'SOLIDIFY'); sol.thickness = .006; sol.offset = -1
bv = helmet.modifiers.new('Opening', 'BOOLEAN'); bv.operation = 'DIFFERENCE'; bv.object = cutter; bv.solver = 'EXACT'
bev = helmet.modifiers.new('Chamfer', 'BEVEL'); bev.limit_method = 'ANGLE'; bev.angle_limit = rad(30); bev.width = .007; bev.segments = 1; bev.harden_normals = True
apply_modifiers(helmet)
bpy.data.objects.remove(cutter)
select_only(helmet); tail.select_set(True); bpy.context.view_layer.objects.active = helmet
bpy.ops.object.join()

# ---------------------------------------------------------------- 5 noktalı emniyet kemeri
bvh = BVHTree.FromObject(suit, bpy.context.evaluated_depsgraph_get())

axis_lo, axis_hi = J['spine05'], J['neck01']
axis_up = (axis_hi - axis_lo).normalized()
fwd0 = Vector((0, -1, 0))
fwd_t = (fwd0 - axis_up * fwd0.dot(axis_up)).normalized()
side = Vector((1, 0, 0))

def hit(t, xoff=0.0, kf=1.0, ku=0.0, ks=0.0, sign=1, out=.006):
    """Gövde ekseninden (yana kaydırılmış) dışarı ışın; yüzey noktası ve normali. Kollar araya giremez."""
    origin = axis_lo.lerp(axis_hi, t) + side * sign * xoff
    d = (fwd_t * kf + axis_up * ku + side * sign * ks).normalized()
    loc, nor, _, _ = bvh.ray_cast(origin, d, 1.0)
    if loc is None:
        return origin + d * .12, d
    if nor.dot(d) < 0: nor = -nor
    return loc + nor * out, nor

def surf(t, ks=0.0, kf=1.0, ku=0.0, sign=1, out=.009, xoff=0.0):
    return hit(t, xoff, kf, ku, ks, sign, out)[0]

def dense(spec, n):
    """Kontrol değerleri arasında doğrusal ara değerleme; her örnek yeniden yüzeye atılır."""
    out = []
    for i in range(n):
        u = i / (n - 1) * (len(spec) - 1); k = min(int(u), len(spec) - 2); f = u - k
        out.append(tuple(a + (b - a) * f for a, b in zip(spec[k], spec[k + 1])))
    return out

def ribbon(name, samples, sign=1, width=.048, thick=.004):
    """Yüzeye düz yatan şerit: genişlik yönü = teğet × yüzey normali."""
    pts = [hit(*smp, sign=sign) for smp in samples]
    P = [p for p, _ in pts]; N = [n for _, n in pts]
    for _ in range(2):  # normalleri komşularla yumuşat
        N = [(N[max(i-1, 0)] + N[i] * 2 + N[min(i+1, len(N)-1)]).normalized() for i in range(len(N))]
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rows = []
    for i, (p, n) in enumerate(zip(P, N)):
        tng = (P[min(i+1, len(P)-1)] - P[max(i-1, 0)]).normalized()
        w = tng.cross(n).normalized() * (width / 2)
        rows.append([bm.verts.new(p - w), bm.verts.new(p + w), bm.verts.new(p + w + n * thick), bm.verts.new(p - w + n * thick)])
    for a, b in zip(rows, rows[1:]):
        for k in range(4):
            bm.faces.new((a[k], a[(k+1) % 4], b[(k+1) % 4], b[k]))
    bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    return ob

BUCKLE_T = .26
straps = []
# (t, yana kaydırma m, öne, yukarı, yana): omuz kemerleri göğüs ortasından ~8 cm uzakta iner
SHOULDER = [(.74, .09, -1.0, .2, 0), (.90, .09, -.5, 1.0, 0), (1.0, .09, .2, 1.0, 0), (.93, .088, 1.0, .45, 0),
            (.80, .085, 1.0, 0, 0), (.62, .08, 1.0, 0, 0), (.46, .07, 1.0, 0, 0), (.35, .045, 1.0, 0, 0), (BUCKLE_T + .03, .02, 1.0, 0, 0)]
LAP = [(.06, 0, .15, 0, 1.0), (.11, .02, .65, 0, .75), (.17, .075, 1.0, 0, .12), (.22, .05, 1.0, 0, 0), (BUCKLE_T - .02, .025, 1.0, 0, 0)]
CROTCH = [(-.10, 0, 1.0, -.9, 0), (-.02, 0, 1.0, -.35, 0), (.10, 0, 1.0, 0, 0), (BUCKLE_T - .04, 0, 1.0, 0, 0)]
for sign in (1, -1):
    straps.append(ribbon(f'ShoulderStrap{sign}', dense(SHOULDER, 40), sign))
    straps.append(ribbon(f'LapStrap{sign}', dense(LAP, 24), sign))
straps.append(ribbon('CrotchStrap', dense(CROTCH, 16)))
# toka (döner kilit), gövdeye teğet
buckle = surf(BUCKLE_T, out=.016)
me = bpy.data.meshes.new('Buckle'); bk = bpy.data.objects.new('Buckle', me); bpy.context.collection.objects.link(bk)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=.034, radius2=.034, depth=.010); bm.to_mesh(me); bm.free()
bk.matrix_world = Matrix.Translation(buckle) @ Vector((0, 0, 1)).rotation_difference(fwd_t).to_matrix().to_4x4()
bv2 = bk.modifiers.new('Chamfer', 'BEVEL'); bv2.width = .002; bv2.segments = 2; apply_modifiers(bk)
select_only(bk); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
select_only(straps[0])
for st in straps[1:] + [bk]: st.select_set(True)
bpy.ops.object.join(); harness = bpy.context.view_layer.objects.active; harness.name = 'Harness'

# ---------------------------------------------------------------- VACCİNO "V" (göğüs ortası, kemerler arasında)
me = bpy.data.meshes.new('Emblem'); emblem = bpy.data.objects.new('Emblem', me); bpy.context.collection.objects.link(emblem)
w, hgt, t = .056, .048, .011
outline = [(-w/2, hgt/2), (-w/2 + t*1.6, hgt/2), (0, -hgt/2 + t*1.9), (w/2 - t*1.6, hgt/2), (w/2, hgt/2), (t*.55, -hgt/2), (-t*.55, -hgt/2)]
bm = bmesh.new()
vs = [bm.verts.new((x, y, 0)) for x, y in outline]
f = bm.faces.new(vs)
ext = bmesh.ops.extrude_face_region(bm, geom=[f])
for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.z += .0015
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.to_mesh(me); bm.free()
spot = surf(.66, out=.0025)
emb_x = side.copy()
emb_up = (axis_up - fwd_t * axis_up.dot(fwd_t)).normalized()
emb_n = emb_x.cross(emb_up).normalized()
if emb_n.dot(fwd_t) < 0: emb_x = -emb_x; emb_n = -emb_n
emblem.matrix_world = Matrix.Translation(spot) @ Matrix((emb_x, emb_up, emb_n)).transposed().to_4x4()
select_only(emblem); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------------------------------------------------------------- tulum panelleri (SuitPanels): omuz, yan şerit, yaka
neck_c = J['neck01']
bm = bmesh.new(); bm.from_mesh(suit.data); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
neck_edge = [v.co.copy() for v in bm.verts if v.is_boundary and (v.co - neck_c).length < .16]
def collar(f):
    return bool(neck_edge) and min((f.calc_center_median() - q).length for q in neck_edge) < .032
keep = {f.index for f in bm.faces if collar(f)}
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.normal_update()
for v in bm.verts: v.co += v.normal * .0018
panels_me = bpy.data.meshes.new('SuitPanels'); bm.to_mesh(panels_me); bm.free()
panels = bpy.data.objects.new('SuitPanels', panels_me); bpy.context.collection.objects.link(panels)
ps = panels.modifiers.new('Thick', 'SOLIDIFY'); ps.thickness = .0012; ps.offset = 1
apply_modifiers(panels)

def limb_strip(name, path, outward, width, n=14, out=.0016, thick=.0012):
    """Eklem çizgisi boyunca, dışa bakan yüzeye düz yatan bant (yan şerit, omuz)."""
    axis_pts = []
    for A, B in zip(path, path[1:]):
        axis_pts += [A.lerp(B, k / n) for k in range(n)]
    axis_pts.append(path[-1])
    hits = []
    for p in axis_pts:
        loc_, nor_, _, _ = bvh.ray_cast(p, outward, .5)
        if loc_ is None: continue
        if nor_.dot(outward) < 0: nor_ = -nor_
        hits.append((loc_ + nor_ * out, nor_))
    me = bpy.data.meshes.new(name); bm2 = bmesh.new(); rows = []
    for i, (p, nn) in enumerate(hits):
        tng = (hits[min(i + 1, len(hits) - 1)][0] - hits[max(i - 1, 0)][0]).normalized()
        wv = tng.cross(nn).normalized() * width / 2
        rows.append([bm2.verts.new(p - wv), bm2.verts.new(p + wv), bm2.verts.new(p + wv + nn * thick), bm2.verts.new(p - wv + nn * thick)])
    for A_, B_ in zip(rows, rows[1:]):
        for k in range(4): bm2.faces.new((A_[k], A_[(k + 1) % 4], B_[(k + 1) % 4], B_[k]))
    if rows: bm2.faces.new(rows[0][::-1]); bm2.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm2, faces=bm2.faces[:]); bm2.to_mesh(me); bm2.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob

strips = []
for sgn, sd in ((1, 'L'), (-1, 'R')):
    lat = side * sgn
    strips.append(limb_strip(f'LegStripe{sd}', [J[f'foot.{sd}'], J[f'lowerleg01.{sd}'], J[f'upperleg01.{sd}']], lat, .030))
    strips.append(limb_strip(f'TorsoStripe{sd}', [axis_lo.lerp(axis_hi, .04), axis_lo.lerp(axis_hi, .72)], lat, .030))
    strips.append(limb_strip(f'ArmStripe{sd}', [J[f'upperarm01.{sd}'], J[f'lowerarm01.{sd}'], J[f'wrist.{sd}']], lat, .024))
    strips.append(limb_strip(f'ShoulderPanel{sd}', [neck_c + lat * .07, J[f'upperarm01.{sd}'] + lat * .02], axis_up, .055))
select_only(panels)
for st in strips: st.select_set(True)
bpy.context.view_layer.objects.active = panels
bpy.ops.object.join()
print('VACCINO_PANELS faces', len(panels.data.polygons))

# ---------------------------------------------------------------- malzemeler
def material(name, color, rough, metal=0.0, clearcoat=0.0, alpha=1.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = clearcoat
    b.inputs['Sheen Weight'].default_value = sheen
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m

def srgb(hexv):
    c = [int(hexv[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in c)

# Blender'da boyama yok: site katman bazında malzeme verir. Burada yalnız ayırt edici nötr inceleme tonları.
mats = {
    'Body': material('M_Body', srgb('9A9DA0'), .65),
    'Suit': material('M_Suit', srgb('5E6266'), .85),
    'SuitPanels': material('M_SuitPanels', srgb('B9BCBF'), .7),
    'Gloves': material('M_Gloves', srgb('8E9195'), .6),
    'Shoes': material('M_Shoes', srgb('4A4D50'), .6),
    'Helmet': material('M_Helmet', srgb('D8D9DA'), .35, clearcoat=.6),
    'HelmetSeal': material('M_HelmetSeal', srgb('2A2C2E'), .8),
    'HelmetStripe': material('M_HelmetStripe', srgb('A9ACAF'), .4),
    'Visor': material('M_Visor', srgb('0A0B0C'), .05, alpha=.88),
    'Harness': material('M_Harness', srgb('8A8D90'), .7),
    'Emblem': material('M_Emblem', srgb('C8C8C8'), .4),
}
for ob in (body, suit, panels, gloves, shoes, helmet, seal, stripe, visor, harness, emblem):
    ob.data.materials.clear(); ob.data.materials.append(mats[ob.name])
    select_only(ob); bpy.ops.object.shade_smooth()
for ob in (helmet, seal, stripe, visor, harness, emblem, panels):
    ob.data.shade_auto_smooth if hasattr(ob.data, 'shade_auto_smooth') else None
    select_only(ob)
    try: bpy.ops.object.shade_smooth_by_angle(angle=rad(40))
    except Exception: pass

# ---------------------------------------------------------------- dışa aktarım (iskeletsiz sabit GLB)
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and o.name not in mats]:
    bpy.data.objects.remove(ob)
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects: ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'driver.glb'), export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True, export_texcoords=True, export_normals=True,
                          export_materials='EXPORT', export_animations=False, export_skins=False, export_morph=False)

# ---------------------------------------------------------------- inceleme renderı: açık nötr gri, üç açı
cam_data = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cam_data); bpy.context.collection.objects.link(cam)
cam_data.lens = 62
allv = [v.co for ob in (body, shoes, helmet) for v in ob.data.vertices]
lo = Vector((min(c.x for c in allv), min(c.y for c in allv), min(c.z for c in allv)))
hi = Vector((max(c.x for c in allv), max(c.y for c in allv), max(c.z for c in allv)))
bbox_c = (lo + hi) / 2; radius = (hi - lo).length / 2
scene.camera = cam
wheel_c = (sum((v.co for v in gloves.data.vertices), Vector()) / len(gloves.data.vertices))
bpy.ops.mesh.primitive_torus_add(major_radius=.15, minor_radius=.012, location=wheel_c)
tor = bpy.context.active_object; tor.rotation_euler = (rad(90) - rad(25), 0, 0)
tor.data.materials.append(material('M_Prop', srgb('6A6E72'), .5))
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, min(v.co.z for v in shoes.data.vertices) - .02))
floor = bpy.context.active_object; floor.data.materials.append(material('M_Floor', srgb('C9CBCD'), .85))
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.55, .56, .57, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .9
for lpos, energy, size in (((3.0, -1.2, 2.6), 380, .5), ((-2.6, -2.8, 1.6), 120, 3.0), ((-0.6, 2.8, 2.8), 150, 1.5)):
    bpy.ops.object.light_add(type='AREA', location=lpos); Lt = bpy.context.active_object
    Lt.data.energy = energy; Lt.data.size = size
    Lt.rotation_euler = (bbox_c - Vector(lpos)).to_track_quat('-Z', 'Y').to_euler()
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
scene.cycles.samples = 24 if PREVIEW else 80; scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 640 if PREVIEW else 1000
scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = 0.0
dist = radius / math.tan(math.atan(18 / cam_data.lens)) * 1.12
views = {'front34': Vector((-.62, -.72, .30)), 'side': Vector((-1.0, .02, .12)), 'front': Vector((0, -1.0, .16))}
for name, d in views.items():
    cam.location = bbox_c + d.normalized() * dist
    cam.rotation_euler = (bbox_c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, f'render_{name}.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'driver.blend'))

stats = {ob.name: len(ob.data.vertices) for ob in bpy.data.objects if ob.type == 'MESH'}
print('VACCINO_STATS', stats, 'height_scale', HEIGHT / h)
