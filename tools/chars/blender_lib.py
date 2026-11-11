# Helpers for sculpting a character in Blender by script (no screen needed).
#
# The idea: lay out simple rounded shapes (the "clay lumps") in a T-pose, melt them into ONE smooth skin,
# paint soft colour areas onto that skin, then add crisp extras (eyes, hooves, scarf...) on top.
# Everything is written out as plain lists that tools/chars/bake.mjs turns into a game character.
#
# Blender's axes: x = left/right, y = back (+) / front (-), z = up.  Sizes are in metres.
import bpy, bmesh, json, math
from mathutils import Matrix, Vector, Euler


def hexcol(h):
    return ((h >> 16) & 255, (h >> 8) & 255, h & 255)


def _lump(bm, pos, radii, rot=(0, 0, 0), seg=24, rings=14):
    m = Matrix.Translation(Vector(pos)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*radii, 1.0))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0, matrix=m)


def _torus(bm, pos, major, minor, rot=(0, 0, 0), arc=1.0, seg=28, ring=8):
    # a ring (or part of one) lying flat in the x/y plane before rotation
    base = Matrix.Translation(Vector(pos)) @ Euler(rot).to_matrix().to_4x4()
    n = max(3, int(seg * arc))
    rows = []
    for i in range(n + (0 if arc >= 1.0 else 1)):
        a = (i / seg) * 2 * math.pi
        row = []
        for j in range(ring):
            b = (j / ring) * 2 * math.pi
            r = major + minor * math.cos(b)
            row.append(bm.verts.new(base @ Vector((r * math.cos(a), r * math.sin(a), minor * math.sin(b)))))
        rows.append(row)
    count = len(rows)
    for i in range(count if arc >= 1.0 else count - 1):
        a, b = rows[i], rows[(i + 1) % count]
        for j in range(ring):
            bm.faces.new((a[j], b[j], b[(j + 1) % ring], a[(j + 1) % ring]))


class Sculpt:
    def __init__(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.skin = bmesh.new()
        self.extras = []  # (bmesh, colour)

    # a lump of clay that will be melted into the skin
    def clay(self, pos, radii, rot=(0, 0, 0), mirror=False):
        _lump(self.skin, pos, radii, rot)
        if mirror:
            _lump(self.skin, (-pos[0], pos[1], pos[2]), radii, (rot[0], -rot[1], -rot[2]))

    # a crisp separate piece with its own flat colour
    def part(self, color, pos, radii, rot=(0, 0, 0), mirror=False, seg=14, rings=9):
        bm = bmesh.new()
        _lump(bm, pos, radii, rot, seg, rings)
        if mirror:
            _lump(bm, (-pos[0], pos[1], pos[2]), radii, (rot[0], -rot[1], -rot[2]), seg, rings)
        self.extras.append((bm, hexcol(color)))

    def box(self, color, pos, size, rot=(0, 0, 0)):
        bm = bmesh.new()
        m = Matrix.Translation(Vector(pos)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1.0))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(size) * 0.22, segments=2, affect='EDGES')
        self.extras.append((bm, hexcol(color)))

    def ring(self, color, pos, major, minor, rot=(0, 0, 0), arc=1.0):
        bm = bmesh.new()
        _torus(bm, pos, major, minor, rot, arc)
        self.extras.append((bm, hexcol(color)))

    def cone(self, color, pos, radius, depth, rot=(0, 0, 0), scale=(1, 1, 1), seg=14):
        bm = bmesh.new()
        m = Matrix.Translation(Vector(pos)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1.0))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=radius, radius2=0.0, depth=depth, matrix=m)
        self.extras.append((bm, hexcol(color)))

    # melt the clay into one skin: voxel remesh joins the lumps, smoothing softens the joins, decimate keeps it light
    def melt(self, voxel=0.018, smooth=14, tris=5600):
        me = bpy.data.meshes.new('clay')
        self.skin.to_mesh(me)
        ob = bpy.data.objects.new('clay', me)
        bpy.context.scene.collection.objects.link(ob)
        rm = ob.modifiers.new('join', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
        ls = ob.modifiers.new('soften', 'LAPLACIANSMOOTH'); ls.iterations = smooth; ls.lambda_factor = 1.2; ls.use_volume_preserve = True
        dg = bpy.context.evaluated_depsgraph_get()
        full = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        ratio = min(1.0, tris / max(1, sum(len(p.vertices) - 2 for p in full.polygons)))
        dc = ob.modifiers.new('lighten', 'DECIMATE'); dc.ratio = ratio
        dg = bpy.context.evaluated_depsgraph_get()
        self.mesh = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        self.colors = [None] * len(self.mesh.vertices)
        return self.mesh

    # paint: fn(position, normal) -> 0..1 strength; blends the given colour over what is already there
    def paint(self, color, fn, base=False):
        c = hexcol(color)
        for v in self.mesh.vertices:
            k = 1.0 if base else max(0.0, min(1.0, fn(v.co, v.normal)))
            if k <= 0:
                continue
            old = self.colors[v.index] or c
            self.colors[v.index] = tuple(old[i] + (c[i] - old[i]) * k for i in range(3))

    # write everything out in the game's axes: x right, y up, z back (front is -z), character's right hand on +x
    def export(self, path):
        P, N, C, I = [], [], [], []

        def push(mesh, colour_of):
            mesh.calc_loop_triangles()
            base = len(P) // 3
            for v in mesh.vertices:
                P.extend((-v.co.x, v.co.z, v.co.y)); N.extend((-v.normal.x, v.normal.z, v.normal.y)); C.extend(int(round(x)) for x in colour_of(v.index))
            for t in mesh.loop_triangles:
                I.extend(base + i for i in t.vertices)

        push(self.mesh, lambda i: self.colors[i] or (255, 0, 255))
        for bm, col in self.extras:
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            me = bpy.data.meshes.new('part'); bm.to_mesh(me)
            for p in me.polygons:
                p.use_smooth = True
            push(me, lambda i, col=col: col)
        json.dump({'P': [round(x, 4) for x in P], 'N': [round(x, 3) for x in N], 'C': C, 'I': I}, open(path, 'w'))
        return {'verts': len(P) // 3, 'tris': len(I) // 3}


def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# how far a point is inside an ellipse-shaped patch (1 in the middle, 0 at the edge and beyond)
def patch(co, centre, radii, soft=0.35):
    d = math.sqrt(sum(((co[i] - centre[i]) / radii[i]) ** 2 for i in range(3) if radii[i] > 0))
    return 1 - smoothstep(1 - soft, 1.0, d)
