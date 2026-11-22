"""Blender 4.3+. Run: blender -b -t 8 -P build_driver.py -- --output ./driver-output"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--draft', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'


def group(name, parent):
    collection = bpy.data.collections.new(name)
    parent.children.link(collection)
    return collection


driver = group('Driver', scene.collection)
body, suit, helmet, visor, gloves, boots, branding = (
    group(name, driver) for name in ('Body', 'RacingSuit', 'Helmet', 'Visor', 'Gloves', 'Boots', 'Branding')
)
studio = group('Studio', scene.collection)


def place(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def material(name, color, roughness, metal=0, weave=False):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    shader = nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metal
    if weave:
        shader.inputs['Sheen Weight'].default_value = .21
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 780
        noise.inputs['Detail'].default_value = 2
        coordinates = nodes.new('ShaderNodeTexCoord')
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = .19
        bump.inputs['Distance'].default_value = .00033
        links = mat.node_tree.links
        links.new(coordinates.outputs['Object'], noise.inputs['Vector'])
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


black = material('Suit | matte carbon', (.014, .016, .020), .76, weave=True)
panel = material('Suit | graphite panels', (.030, .034, .040), .79, weave=True)
thread = material('Thread | smoke', (.093, .096, .103), .81)
trim = material('Rubber & stretch knit', (.012, .014, .017), .83)
shell = material('Helmet | satin carbon black', (.012, .015, .020), .49, .10)
glass = material('Visor | smoked polycarbonate', (.015, .022, .033), .25, .46)
gold = material('Vaccino | champagne embroidery', (.55, .383, .186), .5, .25)
skin = material('Anatomy reference', (.31, .179, .125), .7)
stage = material('Cyclorama', (.021, .023, .027), .92)


def mesh(name, vertices, faces, mat, collection):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    for poly in data.polygons:
        poly.use_smooth = True
    return obj


def apply(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def subdivide(obj, level):
    modifier = obj.modifiers.new('Surface subdivision', 'SUBSURF')
    modifier.levels = level
    apply(obj, modifier)


def loft(name, rings, mat, collection, steps=24, level=1, fold=0):
    """Closed horizontal section loft. The negative Y half is the front."""
    vertices = []
    for i, (x, y, z, width, depth) in enumerate(rings):
        for j in range(steps):
            angle = math.tau * j / steps
            wave = 1 + fold * math.sin(3 * angle + i * 1.49) * math.sin(i * 1.21)
            vertices.append((x + width * math.cos(angle) * wave,
                             y + depth * math.sin(angle) * wave, z))
    faces = [tuple(reversed(range(steps)))]
    for i in range(len(rings)-1):
        for j in range(steps):
            k = (j + 1) % steps
            faces.append((i*steps+j, i*steps+k, (i+1)*steps+k, (i+1)*steps+j))
    faces.append(tuple(range((len(rings)-1)*steps, len(rings)*steps)))
    obj = mesh(name, vertices, faces, mat, collection)
    if level:
        subdivide(obj, level)
    return obj


def trace(name, points, radius, mat, collection, graphic=False):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 5
    data.bevel_depth = radius
    data.bevel_resolution = 1
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for handle, point in zip(spline.bezier_points, points):
        handle.co = point
        handle.handle_left_type = handle.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object


def fuse(name, objects, voxel=.004, ratio=.48):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    root = objects[0]
    bpy.context.view_layer.objects.active = root
    bpy.ops.object.join()
    root.name = name
    root.data.remesh_voxel_size = voxel
    bpy.ops.object.voxel_remesh()
    smoothing = root.modifiers.new('Relax joined surfaces', 'SMOOTH')
    smoothing.factor = .8
    smoothing.iterations = 5
    apply(root, smoothing)
    reduction = root.modifiers.new('Reduce triangles', 'DECIMATE')
    reduction.ratio = ratio
    apply(root, reduction)
    for face in root.data.polygons:
        face.use_smooth = True
    return root


torso = [
    (0,.012,.831,.123,.077),(0,.015,.863,.151,.100),(0,.014,.909,.167,.107),
    (0,.012,.957,.164,.109),(0,.009,1.002,.153,.103),(0,.003,1.041,.148,.098),
    (0,.003,1.077,.148,.097),(0,.002,1.111,.151,.099),(0,.000,1.165,.166,.108),
    (0,.000,1.223,.182,.113),(0,.006,1.290,.195,.114),(0,.014,1.350,.203,.101),
    (0,.015,1.397,.207,.086),(0,.014,1.427,.179,.074),(0,.012,1.457,.094,.060),
    (0,.012,1.466,.062,.054)
]
arm = [
    (.240,-.020,.833,.032,.025),(.239,-.017,.856,.035,.029),
    (.239,-.012,.893,.036,.032),(.235,-.004,.943,.043,.037),
    (.231,.007,.991,.048,.042),(.225,.014,1.035,.047,.044),
    (.223,.016,1.070,.046,.047),(.220,.016,1.106,.047,.049),
    (.211,.016,1.173,.053,.054),(.202,.018,1.246,.060,.063),
    (.192,.017,1.313,.068,.069),(.174,.014,1.365,.067,.069),
    (.149,.012,1.403,.049,.053),(.137,.012,1.412,.028,.037)
]
leg = [
    (.132,.022,.079,.047,.044),(.132,.023,.115,.052,.049),(.130,.027,.153,.051,.049),
    (.130,.030,.208,.057,.056),(.126,.028,.268,.067,.063),(.123,.022,.323,.069,.066),
    (.119,.009,.376,.066,.060),(.118,-.003,.419,.067,.063),(.117,-.012,.454,.070,.069),
    (.110,-.006,.492,.070,.071),(.105,.001,.546,.073,.077),(.099,.012,.618,.081,.085),
    (.093,.016,.696,.087,.092),(.087,.018,.777,.091,.099),
    (.082,.016,.853,.087,.098),(.078,.016,.916,.073,.083),(.074,.016,.956,.055,.058)
]


def mirror(rings, side):
    return [(x*side,y,z,rx,ry) for x,y,z,rx,ry in rings]


def base_body(collection, mat, clothed):
    segments = [('Torso', torso)]
    for side in (-1, 1):
        segments.extend([(f'Sleeve {side}', mirror(arm, side)), (f'Trouser {side}', mirror(leg, side))])
    parts = []
    for name, rings in segments:
        if not clothed:
            rings = [(x,y,z,rx*.91,ry*.91) for x,y,z,rx,ry in rings]
        parts.append(loft(name, rings, mat, collection, fold=.024 if clothed else 0))
    return fuse('One-piece racing suit' if clothed else 'Proportional anatomy blockout',
                parts, .0054, .24)


anatomy = base_body(body, skin, False)
loft('Head | anatomical volume', [
    (0,-.025,1.481,.049,.049),(0,-.013,1.506,.061,.073),
    (0,-.001,1.544,.073,.084),(0,.008,1.605,.081,.088),
    (0,.014,1.669,.077,.081),(0,.019,1.713,.056,.059),
    (0,.019,1.728,.008,.012)
], skin, body, 32, 2)
loft('Neck | anatomy', [(0,.005,1.409,.044,.046),(0,.008,1.460,.050,.049),
    (0,.009,1.513,.053,.052),(0,.009,1.531,.039,.040)], skin, body)
garment = base_body(suit, black, True)
loft('Low neoprene collar',[(0,.009,1.424,.059,.056),(0,.009,1.436,.064,.061),
    (0,.009,1.464,.062,.058),(0,.009,1.476,.058,.055)],trim,suit)
def cloth_point(x, z, front=True, offset=.001):
    direction=1 if front else -1
    hit,point,_,_=garment.ray_cast(Vector((x,-direction,z)),Vector((0,direction,0)))
    if not hit:
        raise ValueError(f'Outside garment at {x}, {z}')
    return (x, point.y-direction*offset, z)


def cloth_trace(name, profile, radius, mat, front=True):
    return trace(name,[cloth_point(x,z,front,radius*.81) for x,z in profile],radius,mat,suit)


def side_panel(side):
    bounds=[(1.032,.115,.129),(1.065,.109,.139),(1.113,.107,.141),
            (1.177,.115,.151),(1.239,.124,.165),(1.292,.143,.170),(1.333,.158,.173)]
    vertices=[]
    for a,b in zip(bounds,bounds[1:]):
        for i in range(5):
            z,inner,outer=[low+(high-low)*i/5 for low,high in zip(a,b)]
            for j in range(9):
                vertices.append(cloth_point(side*(inner+(outer-inner)*j/8),z,offset=.0018))
    for j in range(9):
        z,inner,outer=bounds[-1]
        vertices.append(cloth_point(side*(inner+(outer-inner)*j/8),z,offset=.0018))
    faces=[(i*9+j,i*9+j+1,(i+1)*9+j+1,(i+1)*9+j) for i in range(30) for j in range(8)]
    if side<0:
        faces=[tuple(reversed(face)) for face in faces]
    mesh(f'Graphite side panel {side:+d}',vertices,faces,panel,suit)
    for tag,index in [('inner',1),('outer',2)]:
        trace(f'Panel {tag} welt {side:+d}',
              [cloth_point(side*row[index],row[0],offset=.0021) for row in bounds],.00078,trim,suit)


for side in (-1,1):
    side_panel(side)
zipper=[(0,z) for z in (.957,1.015,1.071,1.132,1.197,1.264,1.325,1.373,1.413,1.44)]
cloth_trace('Center zipper tape',zipper,.0032,trim)
trace('Zipper teeth',[cloth_point(x,z,offset=.0047) for x,z in zipper],.0011,thread,suit)
trace('Zipper pull',[cloth_point(x,z,offset=.0055) for x,z in [(0,1.438),(.003,1.430),(.002,1.424)]],
      .0015,thread,suit)
for side in (-1,1):
    def seam(name, points, radius=.00105, mat=thread, collection=suit):
        return trace(f'{name} {side:+d}',[(side*x,y,z) for x,y,z in points],radius,mat,collection)

    def suited_seam(name, points, radius=.00105, mat=thread, front=True):
        cloth_trace(f'{name} {side:+d}',[(side*x,z) for x,z in points],radius,mat,front)

    suited_seam('Shoulder stitch',[(.047,1.449),(.078,1.446),(.112,1.437),(.147,1.422),
        (.170,1.404),(.188,1.387)],.0012)
    suited_seam('Rear shoulder stitch',[(.047,1.448),(.090,1.441),(.124,1.430),(.158,1.410),
        (.187,1.387)],.0010,thread,False)
    suited_seam('Chest yoke',[(.009,1.286),(.052,1.291),(.109,1.306),(.158,1.325),(.201,1.346)])
    suited_seam('Back yoke',[(.005,1.318),(.060,1.320),(.113,1.332),(.154,1.352),(.184,1.375)],
        .00115,thread,False)
    suited_seam('Lower back gather',[(.006,1.055),(.053,1.05),(.096,1.051),(.134,1.061)],
        .00135,thread,False)
    suited_seam('Waist stitching',[(.007,1.021),(.066,1.019),(.118,1.025)])
    suited_seam('Outer knee articulation',[(.149,.437),(.159,.445),(.167,.461),(.170,.476)],.0010)
    suited_seam('Upper sleeve accent',[(.190,1.365),(.210,1.352),(.230,1.332)],.00155,gold)

    # Finger bases overlap the metacarpal volume. Their tips retain separate silhouettes.
    hand = [
        (.245,-.023,.738,.029,.016),(.246,-.021,.753,.033,.018),
        (.247,-.020,.777,.032,.021),(.243,-.017,.809,.028,.022),
        (.240,-.017,.827,.027,.021),(.239,-.016,.850,.032,.025)
    ]
    parts = [loft(f'Glove palm {side}',mirror(hand,side),trim,gloves,20)]
    for index,(offset,length,radius) in enumerate([(-.020,.059,.0084),(-.006,.069,.0087),
            (.008,.066,.0080),(.022,.052,.0071)]):
        x = .248 + offset
        z = .760 - abs(offset)*.17
        finger = [(x-.008,-.044,z-length,.0038,.0044),(x-.005,-.042,z-length+.006,radius*.83,radius*.88),
                  (x-.002,-.035,z-length*.63,radius*.77,radius),(x,-.024,z-length*.31,radius*.81,radius),
                  (x,-.020,z,radius*1.12,radius*1.1),(x,-.019,z+.012,radius*.9,radius)]
        parts.append(loft(f'Digit {index+1} {side}',mirror(finger,side),trim,gloves,14))
    thumb=[(.213,-.051,.742,.005,.005),(.210,-.045,.750,.008,.008),
           (.212,-.035,.767,.009,.010),(.220,-.027,.784,.013,.013),(.227,-.021,.802,.014,.014)]
    parts.append(loft(f'Thumb {side}',mirror(thumb,side),trim,gloves,16))
    loft(f'Hand | proportional mass {side:+d}',mirror(hand[:-1],side),skin,body,16)
    loft(f'Foot | proportional mass {side:+d}',mirror([
        (.132,-.047,.012,.043,.106),(.132,-.047,.028,.047,.108),
        (.132,-.035,.053,.043,.087),(.132,.009,.081,.040,.057),
        (.132,.020,.109,.038,.044)
    ],side),skin,body,16)
    fuse(f'Racing glove {side:+d}',parts,.0022,.38)
    loft(f'Glove cuff {side:+d}',mirror([(.240,-.018,.809,.031,.024),
        (.240,-.017,.815,.036,.029),(.239,-.017,.851,.037,.029),
        (.238,-.015,.861,.032,.026)],side),panel,gloves)
    seam('Glove knuckle stitch',[(.225,-.035,.767),(.239,-.041,.776),(.251,-.042,.778),
        (.266,-.035,.771)],.00095,thread,gloves)
    seam('Glove cuff trim',[(.216,-.035,.830),(.237,-.047,.831),(.259,-.040,.832)],.0012,gold,gloves)

    sole=[(.132,-.054,0,.043,.116),(.132,-.055,0,.049,.120),
          (.132,-.055,.005,.051,.123),(.132,-.055,.014,.051,.123),(.132,-.054,.017,.049,.120)]
    loft(f'Low rubber sole {side:+d}',mirror(sole,side),trim,boots,28,1)
    shoe=[(.132,-.055,.012,.048,.121),(.132,-.055,.024,.050,.120),
          (.132,-.050,.038,.050,.115),(.132,-.029,.056,.048,.092),
          (.132,-.005,.071,.047,.069),(.132,.014,.095,.046,.055),
          (.132,.020,.122,.047,.052),(.132,.020,.149,.046,.050),
          (.132,.021,.153,.041,.046)]
    loft(f'Ankle racing boot {side:+d}',mirror(shoe,side),black,boots,28,1)
    seam('Boot outer contrast stitching',[(.164,-.122,.041),(.177,-.081,.045),
        (.177,-.034,.060),(.177,.001,.088)],.0014,thread,boots)
    seam('Boot closure',[(.095,-.019,.115),(.131,-.037,.121),(.166,-.020,.115)],.0028,panel,boots)

# Sculpted helmet cross-sections control the chin guard and back separately.
helmet_sections = [
    (1.463,.058,-.058,.068),(1.472,.079,-.108,.087),(1.483,.095,-.128,.101),
    (1.496,.103,-.134,.105),(1.529,.106,-.130,.114),(1.565,.110,-.122,.121),
    (1.608,.111,-.117,.124),(1.644,.109,-.111,.122),(1.680,.102,-.101,.114),
    (1.713,.087,-.085,.098),(1.738,.068,-.068,.081),(1.755,.042,-.039,.053),
    (1.761,.003,.003,.012)
]


def shell_radius(z):
    for a,b in zip(helmet_sections,helmet_sections[1:]):
        if a[0] <= z <= b[0]:
            t=(z-a[0])/(b[0]-a[0])
            return [lo+(hi-lo)*t for lo,hi in zip(a[1:],b[1:])]
    raise ValueError(z)


def helmet_point(angle, z, offset=0):
    width, front, rear = shell_radius(z)
    return ((width+offset)*math.sin(angle),
            (rear+front)/2 - ((rear-front)/2+offset)*math.cos(angle), z)


loft('Full-face helmet | chin and crown',
     [(0,(front+rear)/2,z,w,(rear-front)/2) for z,w,front,rear in helmet_sections],
     shell,helmet,56,1)


def shield(name, mat, extent, offset, margin):
    columns, rows = 56, 12
    points = []
    for i in range(columns+1):
        u=2*i/columns-1
        angle=u*extent
        lower=1.549+.024*abs(u)**2.1-margin
        upper=1.636-.017*abs(u)**2.2+margin
        rounded=.009*max(0,(abs(u)-.87)/.13)**2
        for j in range(rows+1):
            z=lower+rounded+(upper-lower-2*rounded)*j/rows
            points.append(helmet_point(angle,z,offset))
    faces=[]
    for i in range(columns):
        for j in range(rows):
            a=i*(rows+1)+j
            faces.append((a,a+rows+1,a+rows+2,a+1))
    obj=mesh(name,points,faces,mat,visor)
    thickness=obj.modifiers.new('Molded thickness','SOLIDIFY')
    thickness.thickness=.0016
    apply(obj,thickness)


shield('Visor gasket',trim,1.48,.0034,.0034)
shield('Curved smoke visor',glass,1.39,.0058,0)
for side in (-1,1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(side*.110,-.026,1.594))
    pivot=place(bpy.context.object,helmet)
    pivot.name=f'Visor hinge {side:+d}'
    pivot.scale=(.005,.017,.015)
    pivot.data.materials.append(shell)
    for poly in pivot.data.polygons:
        poly.use_smooth=True
    trace(f'Chin vent {side:+d}',[helmet_point(side*t,1.515+.005*t,.0023) for t in (.12,.24,.36,.48,.60)],.0022,trim,helmet)
    trace(f'Fine lower shell accent {side:+d}',[helmet_point(side*t,1.489+.005*t,.0018) for t in (.62,.79,.98,1.19,1.40)],.00115,gold,branding)

# The two polylines retain the coordinates of the V in platform/assets/mark.svg.
def mark_stroke(name, points):
    projected=[]
    for a,b in zip(points,points[1:]):
        for i in range(7):
            u=i/7
            x,z=(a[j]+(b[j]-a[j])*u for j in range(2))
            projected.append(cloth_point(-.072+(x-32)*.00118,1.247+(32-z)*.00118,offset=.0036))
    x,z=points[-1]
    projected.append(cloth_point(-.072+(x-32)*.00118,1.247+(32-z)*.00118,offset=.0036))
    return trace(name,projected,.00235,gold,branding,graphic=True)


# Straight segments retain the corners of the logo paths.
for name, points in [('Vaccino V',[(14,17),(30,48),(50,17)]),('Vaccino inner stroke',[(36,17),(26,36)])]:
    mark_stroke(name,points)

for name,point in [('FocusHelmet',(0,-.020,1.604)),('FocusSuit',(0,-.061,1.270)),
                   ('FocusGlove',(.245,-.029,.768))]:
    obj=bpy.data.objects.new(name,None)
    obj.location=point
    obj.empty_display_size=.025
    driver.objects.link(obj)

# The reference anatomy remains editable in Blender and is excluded from preview/export.
body.hide_render=True
body.hide_viewport=True
bpy.ops.mesh.primitive_plane_add(size=2000,location=(0,0,-.001))
floor=place(bpy.context.object,studio)
floor.name='Graphite floor'
floor.data.materials.append(stage)
scene.world=bpy.data.worlds.new('Graphite ambient')
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.15,.175,.21,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.27


def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()


def light(name,loc,target,power,color,width,height):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.color=color
    data.shape='RECTANGLE'
    data.size=width
    data.size_y=height
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    aim(obj,target)


light('Soft key',(-2.4,-3.5,3.4),(0,0,1.0),410,(1,.89,.75),3,4)
light('Front fill',(2.8,-2.6,2.2),(0,0,1.1),300,(.77,.87,1),2,3.2)
light('Cool rim',(1.4,2.3,2.8),(0,0,1.1),490,(.69,.80,1),2.2,3)
light('Back bounce',(-2.7,2.5,1.8),(0,0,1.0),175,(1,.92,.8),2,3)
light('Overhead strip',(-.4,-.6,3),(0,0,1.48),83,(1,.97,.93),1.7,.42)


def camera(name, position, target, scale):
    data=bpy.data.cameras.new(name)
    data.type='ORTHO'
    data.ortho_scale=scale
    data.clip_end=1500
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=position
    aim(obj,target)
    return obj


views=[
    ('01-front',(0,-5,1.13),(0,0,.89),2.03),
    ('02-side',(5,0,1.13),(0,0,.89),2.03),
    ('03-rear',(0,5,1.13),(0,0,.89),2.03),
    ('04-helmet',(1.25,-3.8,1.96),(0,-.028,1.595),.46),
    ('05-suit',(.75,-3.8,1.47),(0,-.035,1.246),.67),
]
cameras=[camera(*view) for view in views]
scene.render.engine='CYCLES'
scene.cycles.samples=18 if args.draft else 88
scene.cycles.adaptive_threshold=.021
scene.cycles.max_bounces=5
scene.cycles.diffuse_bounces=2
scene.cycles.glossy_bounces=3
scene.cycles.caustics_reflective=False
scene.cycles.caustics_refractive=False
scene.render.image_settings.compression=35
scene.cycles.use_denoising=False
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.render.resolution_x=840
scene.render.resolution_y=1050
scene.render.resolution_percentage=46 if args.draft else 100
scene.camera=cameras[0]
scene.render.filepath='//01-front.png'
bpy.ops.object.select_all(action='DESELECT')
garment.select_set(True)
bpy.context.view_layer.objects.active=garment
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(compress=True,filepath=str(out/'vaccino-driver-3-1a.blend'))

visible_meshes=[obj for obj in driver.all_objects if obj.type=='MESH' and body not in obj.users_collection]
for obj in visible_meshes:
    obj.data.calc_loop_triangles()
stats={
    'blender':bpy.app.version_string,
    'visible_meshes':len(visible_meshes),
    'triangles':sum(len(obj.data.loop_triangles) for obj in visible_meshes),
    'materials': sorted({mat.name for obj in visible_meshes for mat in obj.data.materials if mat}),
    'bounds_m': [[min(v[i] for v in [o.matrix_world@Vector(p) for o in visible_meshes for p in o.bound_box]),
                  max(v[i] for v in [o.matrix_world@Vector(p) for o in visible_meshes for p in o.bound_box])] for i in range(3)]
}
(out/'geometry.json').write_text(json.dumps(stats,indent=2)+'\n')
for cam in cameras:
    scene.camera=cam
    scene.render.filepath=str(out/(cam.name+'.png'))
    bpy.ops.render.render(write_still=True)
