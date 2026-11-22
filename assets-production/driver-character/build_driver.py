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


black = material('Suit | matte carbon', (.007, .008, .010), .82, weave=True)
panel = material('Suit | graphite panels', (.022, .026, .031), .81, weave=True)
thread = material('Thread | smoke', (.043, .048, .053), .85)
trim = material('Rubber & stretch knit', (.012, .014, .017), .83)
shell = material('Helmet | satin carbon black', (.006, .007, .009), .57, 0)
glass = material('Visor | smoked polycarbonate', (.009, .012, .016), .27, 0)
glass.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.36
gold = material('Vaccino | champagne embroidery', (.55, .383, .186), .5, .25)
skin = material('Anatomy reference', (.31, .179, .125), .7)
stage = material('Cyclorama', (.014, .016, .019), .92)


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
    data.resolution_u = 1 if graphic else 5
    data.bevel_depth = radius
    data.bevel_resolution = 0 if graphic else 1
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
    smoothing.iterations = 16 if voxel > .003 else 5
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
    (.231,.007,.991,.048,.042),(.224,.025,1.035,.047,.044),
    (.221,.033,1.070,.046,.047),(.218,.029,1.106,.047,.049),
    (.210,.023,1.173,.053,.054),(.202,.018,1.246,.060,.063),
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
        parts.append(loft(name, rings, mat, collection, fold=.008 if clothed else 0))
    return fuse('One-piece racing suit' if clothed else 'Proportional anatomy blockout',
                parts, .0048, .19)


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
# Broad compression folds, localized to the flex zones of the established pose.
folds = [
    (0,1.037,.13,.013,.0019,.052),(0,1.060,.13,.015,-.0013,-.034),
    (.22,1.041,.042,.011,.0020,.16),(.22,1.060,.045,.012,-.0015,.12),
    (.22,1.077,.042,.012,.0021,.17),(.12,.434,.056,.012,.0025,-.13),
    (.12,.456,.053,.013,-.0016,-.16),(.12,.478,.054,.012,.0023,-.17),
]
for vertex in garment.data.vertices:
    x,y,z=vertex.co
    if y>=0:
        continue
    for center_x,center_z,width,height,depth,slope in folds:
        dx=abs(x)-center_x
        dz=z-center_z-slope*dx
        vertex.co.y-=depth*math.exp(-(dx/width)**2-(dz/height)**2)*min(1,-y/.035)
garment.data.update()
loft('Low neoprene collar',[(0,.009,1.424,.059,.056),(0,.009,1.436,.064,.061),
    (0,.009,1.464,.062,.058),(0,.009,1.476,.058,.055)],trim,suit)
def cloth_point(x, z, front=True, offset=.001):
    direction=1 if front else -1
    hit,point,_,_=garment.ray_cast(Vector((x,-direction,z)),Vector((0,direction,0)))
    if not hit:
        raise ValueError(f'Outside garment at {x}, {z}')
    return (x, point.y-direction*offset, z)


def profile_samples(profile, spacing=.0035):
    for a,b in zip(profile,profile[1:]):
        steps=max(1,math.ceil(math.dist(a,b)/spacing))
        for i in range(steps):
            yield tuple(x+(y-x)*i/steps for x,y in zip(a,b))
    yield profile[-1]


def cloth_trace(name, profile, radius, mat, front=True, lift=None):
    points=[cloth_point(x,z,front,radius*.67 if lift is None else lift)
            for x,z in profile_samples(profile)]
    return trace(name,points,radius,mat,suit,graphic=True)


def fabric_panel(name, side, bounds, front=True, welt=False):
    rows=list(profile_samples(bounds,.005))
    vertices=[cloth_point(side*(inner+(outer-inner)*j/8),z,front,.00135)
              for z,inner,outer in rows for j in range(9)]
    faces=[(i*9+j,i*9+j+1,(i+1)*9+j+1,(i+1)*9+j)
           for i in range(len(rows)-1) for j in range(8)]
    if (side<0)==front:
        faces=[tuple(reversed(face)) for face in faces]
    mesh(f'{name} {side:+d}',vertices,faces,panel,suit)
    if welt:
        for edge,index in [('inner',1),('outer',2)]:
            cloth_trace(f'{name} {edge} stitch {side:+d}',
                        [(side*row[index],row[0]) for row in bounds],.00053,thread,front,.00165)


for side in (-1,1):
    fabric_panel('Graphite side insert',side,[
        (1.026,.122,.126),(1.061,.109,.135),(1.131,.108,.141),
        (1.197,.116,.149),(1.249,.132,.159),(1.291,.157,.173),(1.32,.178,.181)
    ],welt=True)
    shoulder=[
        (1.355,.183,.207),(1.382,.159,.201),(1.408,.116,.175),
        (1.430,.082,.145),(1.446,.061,.111),(1.454,.052,.079),
    ]
    fabric_panel('Layered shoulder facing',side,shoulder,welt=True)
    fabric_panel('Rear shoulder facing',side,shoulder,front=False,welt=True)
zipper=[(0,z) for z in (.957,1.015,1.071,1.132,1.197,1.264,1.325,1.373,1.413,1.44)]
cloth_trace('Recessed zipper tape',zipper,.0023,trim)
for edge in (-1,1):
    cloth_trace(f'Zipper edge {edge:+d}',[(edge*.0011,z) for _,z in zipper],
                .0005,thread,lift=.0018)
cloth_trace('Zipper pull',[(0,1.431),(.003,1.425),(.003,1.418)],.00135,thread,lift=.0027)
for side in (-1,1):
    def seam(name, points, radius=.00105, mat=thread, collection=suit):
        return trace(f'{name} {side:+d}',[(side*x,y,z) for x,y,z in points],radius,mat,collection)

    def suited_seam(name, points, radius=.00105, mat=thread, front=True):
        cloth_trace(f'{name} {side:+d}',[(side*x,z) for x,z in points],radius,mat,front)

    suited_seam('Chest yoke',[(.004,1.291),(.052,1.294),(.105,1.310),(.151,1.332),(.176,1.349)],.00068)
    suited_seam('Back yoke',[(.0,1.317),(.060,1.321),(.111,1.338),(.145,1.356),(.167,1.374)],
        .00072,thread,False)
    suited_seam('Lower back gather',[(.0,1.052),(.053,1.051),(.096,1.052),(.134,1.061)],
        .00072,thread,False)
    suited_seam('Waist stitching',[(.004,1.021),(.062,1.018),(.111,1.023)],.00068)
    suited_seam('Outer knee articulation',[(.148,.437),(.159,.447),(.167,.464),(.168,.480)],.00075)
    suited_seam('Upper sleeve accent',[(.207,1.358),(.222,1.349),(.231,1.339)],.0010,gold)

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
    glove=fuse(f'Racing glove {side:+d}',parts,.0018,.31)
    for finger_index,(offset,length) in enumerate([(-.020,.059),(-.006,.069),(.008,.066),(.022,.052)]):
        z_base=.760-abs(offset)*.17
        for joint,center in enumerate((.33,.62)):
            at=z_base-length*center
            points=[]
            for dx in (-.0029,0,.0029):
                x=side*(.248+offset-.003+dx)
                hit,point,_,_=glove.ray_cast(Vector((x,-1,at)),Vector((0,1,0)))
                if hit:
                    points.append((x,point.y-.00055,at-.0003*abs(dx)/.0029))
            if len(points)==3:
                trace(f'Finger hinge stitching {side:+d} {finger_index}.{joint}',points,
                      .00046,thread,gloves)

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
    shoe_surface=loft(f'Ankle racing boot {side:+d}',mirror(shoe,side),black,boots,28,1)
    # Closure straps follow the instep and sit above the low-profile sole.
    for index,(z,width) in enumerate([(.063,.026),(.081,.032),(.101,.034)]):
        ribbon=[]
        for height in (z-.004,z+.004):
            for j in range(13):
                x=side*(.132+width*(j/6-1))
                hit,point,_,_=shoe_surface.ray_cast(Vector((x,-1,height)),Vector((0,1,0)))
                if not hit:
                    raise ValueError('Boot strap left its host surface')
                ribbon.append((x,point.y-.001,height))
        faces=[(j,j+1,14+j,13+j) for j in range(12)]
        if side<0:
            faces=[tuple(reversed(face)) for face in faces]
        mesh(f'Instep strap {side:+d}.{index}',ribbon,faces,panel,boots)

# Section profile references generic closed-cockpit motorsport helmets:
# extended lower chin, steep brow, rounded crown and compact rear overhang.
helmet_sections=[
    (1.462,.050,-.071,.066),(1.469,.071,-.112,.085),(1.482,.091,-.142,.102),
    (1.497,.099,-.158,.111),(1.516,.103,-.157,.117),(1.536,.106,-.143,.120),
    (1.552,.108,-.125,.121),(1.573,.110,-.121,.122),(1.607,.110,-.119,.120),
    (1.625,.110,-.123,.119),(1.641,.108,-.116,.116),(1.666,.103,-.110,.110),
    (1.693,.096,-.099,.101),(1.718,.084,-.083,.091),(1.738,.066,-.065,.077),
    (1.752,.042,-.041,.055),(1.758,.020,-.015,.031),(1.760,.003,.003,.014),
]


def shell_section(z):
    for i,(a,b) in enumerate(zip(helmet_sections,helmet_sections[1:])):
        if a[0] <= z <= b[0]:
            previous=helmet_sections[max(i-1,0)]
            following=helmet_sections[min(i+2,len(helmet_sections)-1)]
            h=b[0]-a[0]
            t=(z-a[0])/h
            result=[]
            for j in (1,2,3):
                m0=(b[j]-previous[j])/(b[0]-previous[0])
                m1=(following[j]-a[j])/(following[0]-a[0])
                value=((2*t**3-3*t*t+1)*a[j]+(t**3-2*t*t+t)*h*m0
                       +(-2*t**3+3*t*t)*b[j]+(t**3-t*t)*h*m1)
                result.append(value)
            return result
    raise ValueError(z)


def helmet_point(angle,z,offset=0):
    width,front,rear=shell_section(z)
    cosine=math.cos(angle)
    if cosine>0:
        cosine=cosine*(1+.18*(1-cosine*cosine))
    return ((width+offset)*math.sin(angle),
            (rear+front)/2-((rear-front)/2+offset)*cosine,z)


columns=96
cut_columns=21
eye_extent=math.tau*cut_columns/columns


def eye_bounds(angle):
    u=min(1,abs(angle)/eye_extent)
    return (1.554+.019*u**1.9,1.626-.015*u**2.4)


chin_steps,eye_steps,crown_steps=17,8,23


def shell_rows(angle):
    lower,upper=eye_bounds(angle)
    levels=(helmet_sections[0][0],lower,upper,helmet_sections[-1][0])
    steps=(chin_steps,eye_steps,crown_steps)
    return [left+(right-left)*i/count
            for left,right,count in zip(levels,levels[1:],steps)
            for i in range(count)]+[levels[-1]]


angles=[math.tau*i/columns-math.pi for i in range(columns)]
row_size=len(shell_rows(0))
vertices=[helmet_point(angle,z) for angle in angles for z in shell_rows(angle)]
faces=[]
for i in range(columns):
    for j in range(row_size-1):
        if columns//2-cut_columns<=i<columns//2+cut_columns and chin_steps<=j<chin_steps+eye_steps:
            continue
        a=i*row_size+j
        b=((i+1)%columns)*row_size+j
        faces.append((a,b,b+1,a+1))
faces.extend([tuple(i*row_size for i in range(columns-1,-1,-1)),
              tuple(i*row_size+row_size-1 for i in range(columns))])
helmet_shell=mesh('Full-face composite shell | open eyeport',vertices,faces,shell,helmet)
wall=helmet_shell.modifiers.new('Eyeport return and shell wall','SOLIDIFY')
wall.thickness=.0019
apply(helmet_shell,wall)


def optical_skin(name,mat,extent,offset,margin,eye_trim=False):
    width,height=52,10
    if eye_trim:
        perimeter=[(i/width,0) for i in range(width)]+[(1,j/height) for j in range(height)]
        perimeter += [(1-i/width,1) for i in range(width)]+[(0,1-j/height) for j in range(height)]
        def frame_point(u,v,rim):
            angle=(2*u-1)*(extent+rim*.044)
            lower,upper=eye_bounds(angle)
            return helmet_point(angle,lower+(upper-lower)*v+rim*margin*(2*v-1),offset)
        points=[frame_point(u,v,rim) for rim in (0,1) for u,v in perimeter]
        n=len(perimeter)
        quads=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    else:
        points=[]
        for i in range(width+1):
            angle=(2*i/width-1)*extent
            lower,upper=eye_bounds(angle)
            corner=.006*(abs(angle)/extent)**7
            for j in range(height+1):
                v=j/height
                z=lower+(upper-lower)*v+(margin-corner)*(2*v-1)
                points.append(helmet_point(angle,z,offset))
        quads=[(i*(height+1)+j,(i+1)*(height+1)+j,(i+1)*(height+1)+j+1,i*(height+1)+j+1)
               for i in range(width) for j in range(height)]
    obj=mesh(name,points,quads,mat,visor)
    solid=obj.modifiers.new('Molded edge','SOLIDIFY')
    solid.thickness=.0018
    apply(obj,solid)


optical_skin('Black eyeport gasket',trim,eye_extent-.034,.0017,.0053,eye_trim=True)
optical_skin('Smoked visor | nonmetallic polycarbonate',glass,eye_extent+.024,.0032,.0016)
for side in (-1,1):
    pos=helmet_point(side*1.452,1.593,.003)
    for name,scale,mat in [('Low-profile hinge',(.007,.017,.014),trim),
                           ('Captive hinge fastener',(.008,.006,.0055),shell)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,location=pos)
        part=place(bpy.context.object,helmet)
        part.name=f'{name} {side:+d}'
        part.scale=scale
        part.data.materials.append(mat)
        for face in part.data.polygons:
            face.use_smooth=True
    for i in range(3):
        start=.24+.18*i
        points=[]
        for j in range(12):
            angle=math.tau*j/12
            u=start+.073*math.cos(angle)
            points.append(helmet_point(side*u,1.519+.007*u+.0036*math.sin(angle),.00125))
        mesh(f'Flush chin vent {side:+d}.{i}',points,
             [tuple(range(len(points))) if side>0 else tuple(reversed(range(len(points))))],
             trim,helmet)
    angles_detail=[.66+.53*i/30 for i in range(31)]
    trace(f'Inlaid lower shell accent {side:+d}',
          [helmet_point(side*t,1.493+.009*t,.00074) for t in angles_detail],
          .00076,gold,branding,graphic=True)

# The two polylines retain the coordinates of the V in platform/assets/mark.svg.
def mark_stroke(name, points):
    projected=[]
    for a,b in zip(points,points[1:]):
        for i in range(7):
            u=i/7
            x,z=(a[j]+(b[j]-a[j])*u for j in range(2))
            projected.append(cloth_point(-.072+(x-32)*.00124,1.247+(32-z)*.00124,offset=.00165))
    x,z=points[-1]
    projected.append(cloth_point(-.072+(x-32)*.00124,1.247+(32-z)*.00124,offset=.00165))
    return trace(name,projected,.00185,gold,branding,graphic=True)


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
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.19


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


light('Soft key',(-2.4,-3.5,3.4),(0,0,1.0),340,(1,.92,.82),2.45,3.5)
light('Front fill',(2.8,-2.6,2.2),(0,0,1.1),128,(.82,.90,1),2.5,3.35)
light('Cool rim',(1.4,2.3,2.8),(0,0,1.1),380,(.71,.82,1),1.65,2.8)
light('Back bounce',(-2.7,2.5,1.8),(0,0,1.0),126,(1,.93,.85),2,3)
light('Overhead strip',(-.4,-.6,3),(0,0,1.48),42,(1,.97,.93),1.7,.70)


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
    ('06-three-quarter',(2.42,-4.35,1.24),(0,0,.89),2.03),
]
cameras=[camera(*view) for view in views]
scene.render.engine='CYCLES'
scene.cycles.samples=18 if args.draft else 60
scene.cycles.adaptive_threshold=.031
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
bpy.ops.wm.save_as_mainfile(compress=True,filepath=str(out/'vaccino-driver-3-1b.blend'))

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
