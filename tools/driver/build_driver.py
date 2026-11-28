"""VACCİNO referans sürücü (174 cm) — MPFB2 + MakeHuman CC0 system assets.
Kullanım: blender -b --python build_driver.py -- <assets_dir> <out_dir> [preview]
Çıktı: driver.blend, driver.glb (iskeletsiz, sabit poz), render.png
"""
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
ASSETS, OUT = argv[0], argv[1]
OPTS = dict(a.split('=', 1) for a in argv[2:] if '=' in a)
PREVIEW = 'preview' in argv[2:]
POSE = OPTS.get('pose', 'adc')                 # adc | mileage
HIP_X = float(OPTS.get('hip', 1550))           # Varsayım: kalça noktası x 1450–1600 (STEP mm)
HIP_Y = float(OPTS.get('hipy', 200))           # Varsayım: kalça noktası yüksekliği (STEP mm, boru ekseni y=0)
FOOT_X = float(OPTS.get('footx', 565))         # Varsayım: ayak merkezi x
FOOT_Z = float(OPTS.get('footz', 100))         # Varsayım: ayak merkezi z = ±100 (aralık 150–200 mm)
FRAME_GLB = OPTS.get('frame')                  # Ø30 şasi GLB (kontrol ve render için; GLB'ye girmez)
os.makedirs(OUT, exist_ok=True)

def D(x, y, z):
    """STEP mm → sürücü sahnesi (m): sürücü −Y'ye bakar; şasi GLB +90° Z döndürülerek aynı eksene oturur."""
    return Vector((z, x - 1400, y + 135)) / 1000
def STEP(v):
    return Vector((v.y * 1000 + 1400, v.z * 1000 - 135, v.x * 1000))

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

HEIGHT = 1.74
RECLINE = float(OPTS.get('recline', 34.0))  # derece, dikeyden geriye (Tahmin)

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
# Kask, yumuşatılmamış başın (pozlanmış kopyası) ölçülerinden üretilir; onaylı kask biçimi değişmez
head_ref = duplicate(body, 'HeadRef')
# r5 ile aynı: kask referansı 40 adımlık hafif yumuşatılmış baştan alınır (onaylı kask biçimi)
hr = head_ref.modifiers.new('HelmetRefSmooth', 'SMOOTH'); hr.factor = 1.0; hr.iterations = 40; hr.vertex_group = 'face_smooth'
select_only(head_ref)
bpy.ops.object.modifier_move_to_index(modifier='HelmetRefSmooth', index=0)
bpy.ops.object.modifier_apply(modifier='HelmetRefSmooth')
# Özelliksiz manken başı: baş köşeleri başın kendi ölçülerindeki düzgün bir elipsoide izdüşürülür
# (göz, burun, dudak kalmaz); boyna geçiş ağırlıkla yumuşar. Dinlenme pozunda yapılır, iskelet sonra deforme eder.
sm = body.modifiers.new('Featureless', 'SMOOTH'); sm.factor = 1.0; sm.iterations = 40; sm.vertex_group = 'face_smooth'
select_only(body)
bpy.ops.object.modifier_move_to_index(modifier='Featureless', index=0)
bpy.ops.object.modifier_apply(modifier='Featureless')
core = [i for i, w in enumerate(head_w) if w > .5]
cs = [body.data.vertices[i].co for i in core]
lo_h = Vector((min(c.x for c in cs), min(c.y for c in cs), min(c.z for c in cs)))
hi_h = Vector((max(c.x for c in cs), max(c.y for c in cs), max(c.z for c in cs)))
hc = (lo_h + hi_h) / 2; hr_ = (hi_h - lo_h) / 2
hc.z += hr_.z * .08                           # tepe biraz yukarı: ovalimsi kafatası
for i, w in enumerate(head_w):
    if w <= .2: continue
    v = body.data.vertices[i]; d = v.co - hc
    if d.z < -hr_.z * .9: continue            # boyun: dokunma (çene dahil izdüşürülür)
    n = Vector((d.x / hr_.x, d.y / hr_.y, d.z / hr_.z)); L = n.length
    if L < 1e-6: continue
    target = hc + d / L                        # elipsoid yüzeyi, aynı yönde
    t = min(1.0, (w - .2) / .5)
    v.co = v.co.lerp(target, t)
body.data.update()
sm2 = body.modifiers.new('FeaturelessBlend', 'SMOOTH'); sm2.factor = .7; sm2.iterations = 14; sm2.vertex_group = 'face_smooth'
bpy.ops.object.modifier_move_to_index(modifier='FeaturelessBlend', index=0)
bpy.ops.object.modifier_apply(modifier='FeaturelessBlend')
print('VACCINO_HEAD_ELLIPSOID', tuple(round(c, 3) for c in hr_))
# Baş bölgesindeki açık delikleri (göz, ağız) kapat: kask kapatılınca yüz özelliği görünmesin
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
holes = [e for e in bm.edges if e.is_boundary and all(head_w[v.index] > .2 for v in e.verts)]
bmesh.ops.holes_fill(bm, edges=holes, sides=0)
bm.to_mesh(body.data); bm.free()
print('VACCINO_FACE_HOLES_FILLED', len(holes))

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
# Kalça noktası hedefe taşınır (yalnız öteleme); bacak ve kollar iki kemikli IK ile hedef noktalara.
hip_now = (P['upperleg01.L'].head + P['upperleg01.R'].head) / 2
OFFSET = D(HIP_X, HIP_Y, 0) - (rig.matrix_world @ hip_now)
def T_(x, y, z): return D(x, y, z) - OFFSET          # STEP mm → iskelet uzayı
IK_LOG = {}

def aim_vec(name, cur_vec, target_vec):
    pb = P[name]
    q = cur_vec.normalized().rotation_difference(target_vec.normalized())
    head = pb.matrix.translation.copy()
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ pb.matrix
    bpy.context.view_layer.update()

def two_bone(root, mid, end, target, pole, key):
    """root/mid/end: kemik adları (başları eklem). target: uç eklemin hedefi. pole: dirsek/diz yönü."""
    H, K, A0 = P[root].head.copy(), P[mid].head.copy(), P[end].head.copy()
    L1, L2 = (K - H).length, (A0 - K).length
    d_vec = target - H; d = d_vec.length; dirn = d_vec.normalized()
    short = max(0.0, d - (L1 + L2) * .999)
    d = min(d, (L1 + L2) * .999)
    a_ = (L1 * L1 - L2 * L2 + d * d) / (2 * d); h_ = math.sqrt(max(L1 * L1 - a_ * a_, 0))
    perp = (pole - dirn * pole.dot(dirn)).normalized()
    knee = H + dirn * a_ + perp * h_
    aim_vec(root, P[mid].head - P[root].head, knee - H)
    aim_vec(mid, P[end].head - P[mid].head, (H + dirn * d) - knee)
    IK_LOG[key] = {'reach_short_mm': round(short * 1000), 'L1_mm': round(L1 * 1000), 'L2_mm': round(L2 * 1000)}

WHEEL_C = (HIP_X - 200, 540, 0)                         # Mileage: simit merkezi (Temsili)
DEVICE = lambda sg: (HIP_X - 120, 150, sg * 255)        # ADC: güvenlik cihazı tabanı (Aday konum)
for s, sign in (('L', 1), ('R', -1)):
    # Bacak: ayak merkezi (FOOT_X, z=±FOOT_Z); ayak bileği 23 mm geride, 125 mm yukarıda (ayakkabı merkezine göre ayarlı)
    ankle = T_(FOOT_X + 23, 125, sign * FOOT_Z)   # ölçülen ayakkabı merkezi ≈ FOOT_X olacak şekilde
    two_bone(f'upperleg01.{s}', f'lowerleg01.{s}', f'foot.{s}', ankle, Vector((sign * .12, 0, 1)), f'leg.{s}')
    aim(f'foot.{s}', (0, -math.cos(rad(60)), math.sin(rad(60))))                       # ayak pedal açısında
    if POSE == 'mileage':
        grip = T_(WHEEL_C[0] + 35, WHEEL_C[1] - 10, sign * 150)
        two_bone(f'upperarm01.{s}', f'lowerarm01.{s}', f'wrist.{s}', grip, Vector((sign * .6, .1, -1)), f'arm.{s}')
        aim(f'wrist.{s}', (-sign * .10, -.95, .25))
        curl = (38, 25)
    else:
        dev = DEVICE(sign)
        grip = T_(dev[0] + 30, dev[1] + 105, dev[2])
        two_bone(f'upperarm01.{s}', f'lowerarm01.{s}', f'wrist.{s}', grip, Vector((sign * .5, .7, -.4)), f'arm.{s}')
        aim(f'wrist.{s}', (sign * .05, -.55, -.85))
        curl = (55, 35)
    for f in range(2, 6):
        for seg in (1, 2, 3):
            pb = P.get(f'finger{f}-{seg}.{s}')
            if pb:
                pb.rotation_mode = 'XYZ'; pb.rotation_euler.x += rad(curl[0] if seg > 1 else curl[1])
    bpy.context.view_layer.update()
print('VACCINO_IK', IK_LOG)
bpy.ops.object.mode_set(mode='OBJECT')
# gövde ekseni: pozlanmış kemik başları (kemer ve V yerleşimi için)
J = {n: rig.matrix_world @ P[n].head for n in ('spine05', 'spine03', 'neck01', 'clavicle.L', 'clavicle.R') + tuple(f'{b}.{s}' for b in ('upperleg01', 'lowerleg01', 'foot', 'upperarm01', 'lowerarm01', 'wrist') for s in 'LR')}
J = {k: v + OFFSET for k, v in J.items()}
print('VACCINO_JOINTS', {k: tuple(round(c, 3) for c in v) for k, v in J.items()})

# pozu sabitle, iskeleti kaldır
for obj in (body, suit, gloves, shoes, head_ref):
    apply_modifiers(obj)
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    obj.vertex_groups.clear()
    obj.data.transform(Matrix.Translation(OFFSET)); obj.data.update()
bpy.data.objects.remove(rig)


# ---------------------------------------------------------------- kask (pozlanmış baştan)
def head_points():
    bm = bmesh.new(); bm.from_mesh(head_ref.data)
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
print('VACCINO_PUSH helmet', push_out(shell, head_ref, .020))   # r5 referans başına göre
bpy.data.objects.remove(head_ref)
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
seal_pts = [on_shell(x, ay, z + EYE_Z, .0035)[0] for x, z in rounded_rect(VW + .022, VH + .022, VR + .011, 12)]   # vizörün dış kenarı
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
    # yol ve normalleri yumuşat (buruşukluk olmasın); uçlar sabit
    for _ in range(4):
        hits = [hits[0]] + [(((hits[i - 1][0] + hits[i][0] * 2 + hits[i + 1][0]) / 4), (hits[i - 1][1] + hits[i][1] * 2 + hits[i + 1][1]).normalized())
                            for i in range(1, len(hits) - 1)] + [hits[-1]] if len(hits) > 2 else hits
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
    strips.append(limb_strip(f'ShoulderPanel{sd}', [neck_c + lat * .075, J[f'upperarm01.{sd}'] + lat * .015], axis_up, .05, n=10, out=.0022))
select_only(panels)
for st in strips: st.select_set(True)
bpy.context.view_layer.objects.active = panels
bpy.ops.object.join()
print('VACCINO_PANELS faces', len(panels.data.polygons))

# ---------------------------------------------------------------- ADC güvenlik cihazları (Madde 412f; Aday konum)
devices = None
if POSE == 'adc':
    bm_d = bmesh.new()
    for sg in (1, -1):
        bx, by, bz = DEVICE(sg)
        base = D(bx, by, bz)
        ret = bmesh.ops.create_cone(bm_d, cap_ends=True, segments=20, radius1=.013, radius2=.013, depth=.06)
        bmesh.ops.translate(bm_d, verts=ret['verts'], vec=base + Vector((0, 0, .03)))
        ret = bmesh.ops.create_uvsphere(bm_d, u_segments=20, v_segments=12, radius=.024)
        bmesh.ops.translate(bm_d, verts=ret['verts'], vec=base + Vector((0, 0, .075)))
        ret = bmesh.ops.create_cone(bm_d, cap_ends=True, segments=20, radius1=.03, radius2=.03, depth=.008)
        bmesh.ops.translate(bm_d, verts=ret['verts'], vec=base)
    me_d = bpy.data.meshes.new('SafetyDevices'); bm_d.to_mesh(me_d); bm_d.free()
    devices = bpy.data.objects.new('SafetyDevices', me_d); bpy.context.collection.objects.link(devices)

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
    'SafetyDevices': material('M_SafetyDevices', srgb('C0392B'), .5),
}
for ob in [o for o in (body, suit, panels, gloves, shoes, helmet, seal, stripe, visor, harness, emblem, devices) if o]:
    ob.data.materials.clear(); ob.data.materials.append(mats[ob.name])
    select_only(ob); bpy.ops.object.shade_smooth()
for ob in (helmet, seal, stripe, visor, harness, emblem, panels):
    ob.data.shade_auto_smooth if hasattr(ob.data, 'shade_auto_smooth') else None
    select_only(ob)
    try: bpy.ops.object.shade_smooth_by_angle(angle=rad(40))
    except Exception: pass

# ---------------------------------------------------------------- dışa aktarım (iskeletsiz sabit GLB, yalnız sürücü)
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and o.name not in mats]:
    bpy.data.objects.remove(ob)
driver_objs = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for ob in driver_objs: ob.select_set(True)
glb_path = os.path.join(OUT, f'driver-{POSE}.glb')
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True, export_texcoords=True, export_normals=True,
                          export_materials='EXPORT', export_animations=False, export_skins=False, export_morph=False)

# ---------------------------------------------------------------- şasi (yalnız kontrol ve render için)
import json
frame_objs = []
if FRAME_GLB:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=FRAME_GLB)
    frame_objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in [o for o in bpy.data.objects if o not in before and o.type != 'MESH']:
        bpy.data.objects.remove(o)
    for o in frame_objs:
        o.matrix_world = Matrix.Rotation(math.pi / 2, 4, 'Z') @ o.matrix_world
        select_only(o); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    print('VACCINO_FRAME_OBJS', [o.name for o in frame_objs])

checks = {'recline_deg': RECLINE, 'pose': POSE, 'hip_x': HIP_X, 'hip_y': HIP_Y, 'foot_x_target': FOOT_X, 'foot_z_target': FOOT_Z, 'ik': IK_LOG}
def step_pts(ob): return [STEP(ob.matrix_world @ v.co) for v in ob.data.vertices]
sh = step_pts(shoes)
checks['toe_min_x'] = round(min(p.x for p in sh))
checks['toe_to_nose_mm'] = round(min(p.x for p in sh) - (-15))                       # (a) ≥ 100, Madde 25a-ii
left = [p for p in sh if p.z > 0]; right = [p for p in sh if p.z < 0]
fc = lambda ps: Vector((sum(p.x for p in ps), sum(p.y for p in ps), sum(p.z for p in ps))) / len(ps)
checks['foot_center_L'] = [round(c) for c in fc(left)]; checks['foot_center_R'] = [round(c) for c in fc(right)]
checks['foot_center_spacing_mm'] = round(fc(left).z - fc(right).z)
checks['feet_inner_gap_mm'] = round(min(p.z for p in left) - max(p.z for p in right))
hl = step_pts(helmet)
checks['helmet_top_y'] = round(max(p.y for p in hl)); checks['helmet_back_x'] = round(max(p.x for p in hl))
checks['helmet_to_roof_plane_mm'] = round(935 - max(p.y for p in hl))                 # (b1) çatı borusu altı y = 950 − 15
checks['helmet_to_rear_hoop_mm'] = round(2135 - max(p.x for p in hl))                # (b2) arka halka ön yüzü x = 2150 − 15
kn = [STEP(J[f'lowerleg01.{sd}']) for sd in 'LR']
checks['knee_L'] = [round(c) for c in kn[0]]; checks['knee_R'] = [round(c) for c in kn[1]]
frame = next((o for o in frame_objs if o.name.startswith('Frame')), None)
if frame:
    tree = BVHTree.FromObject(frame, bpy.context.evaluated_depsgraph_get())
    def clearance(obs, xmax=None, xmin=None):
        best = (1e9, None)
        for ob in obs:
            for v in ob.data.vertices:
                w = ob.matrix_world @ v.co; sp = STEP(w)
                if xmax is not None and sp.x > xmax: continue
                if xmin is not None and sp.x < xmin: continue
                loc_, nor_, _, dist = tree.find_nearest(w)
                if loc_ is None: continue
                sd = dist if (w - loc_).dot(nor_) >= 0 else -dist
                if sd < best[0]: best = (sd, sp)
        return round(best[0] * 1000), [round(c) for c in best[1]] if best[1] else None
    checks['legs_min_clearance_mm'], checks['legs_min_at'] = clearance([suit, shoes], xmax=HIP_X - 150)  # (c) diz/bacak–boru
    checks['helmet_min_clearance_mm'], checks['helmet_min_at'] = clearance([helmet])
    checks['driver_min_clearance_mm'], checks['driver_min_at'] = clearance([o for o in driver_objs if o.name not in ('Body',)])
    checks['knee_vs_nose_post_x770'] = 'önünde değil' if min(k.x for k in kn) > 800 else 'yakın, kontrol et'
json.dump(checks, open(os.path.join(OUT, f'checks-{POSE}.json'), 'w'), indent=1, ensure_ascii=False)
print('VACCINO_CHECKS', json.dumps(checks, ensure_ascii=False))

# ---------------------------------------------------------------- inceleme renderı: önden ve yandan, şasinin içinde
for o in frame_objs:
    o.data.materials.clear()
    o.data.materials.append(material('M_F_' + o.name, srgb('C9CDD0') if o.name.startswith('Frame') else srgb('9AA0A6'), .4, metal=.5))
    if o.name.startswith('RepShell'): o.hide_render = True
cam_data = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cam_data); bpy.context.collection.objects.link(cam)
cam_data.lens = 50
scene.camera = cam
target = D(1300, 450, 0)
bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0))
floor = bpy.context.active_object; floor.data.materials.append(material('M_Floor', srgb('C9CBCD'), .85))
world = bpy.data.worlds.new('W'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.55, .56, .57, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .9
for lpos, energy, size in (((3.0, -2.5, 3.2), 520, 1.0), ((-3.0, -1.0, 2.0), 200, 3.0), ((0.5, 3.0, 3.0), 200, 2.0)):
    bpy.ops.object.light_add(type='AREA', location=lpos); Lt = bpy.context.active_object
    Lt.data.energy = energy; Lt.data.size = size
    Lt.rotation_euler = (target - Vector(lpos)).to_track_quat('-Z', 'Y').to_euler()
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
scene.cycles.samples = 24 if PREVIEW else 64; scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = (960, 640) if PREVIEW else (1400, 900)
scene.view_settings.view_transform = 'AgX'; scene.view_settings.exposure = 0.0
for name, dvec, dist in ((('front', Vector((.18, -1.0, .32)), 4.6), ('side', Vector((1.0, .0, .12)), 5.2)) if OPTS.get('render', '1') != '0' else ()):
    cam.location = target + dvec.normalized() * dist
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, f'render_{POSE}_{name}.png')
    bpy.ops.render.render(write_still=True)
if OPTS.get('render', '1') != '0': bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'driver-{POSE}.blend'))

stats = {ob.name: len(ob.data.vertices) for ob in bpy.data.objects if ob.type == 'MESH'}
print('VACCINO_STATS', stats, 'height_scale', HEIGHT / h)
