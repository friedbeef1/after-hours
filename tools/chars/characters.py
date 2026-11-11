# All ten Harvest Standoff characters, sculpted in Blender by script.
#   python tools/chars/characters.py all art/characters      (or a single name: pig, cow, farmer2 ...)
# Each one is written as <name>_raw.json; tools/chars/bake.mjs then turns that into assets/chars/<name>.json.
# Axes: x left/right, y back (+) / front (-), z up. Everyone stands about 1.75 m tall in a T-pose.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_lib import Sculpt, patch, smoothstep

PI = math.pi


class Head:
    def __init__(self, z, r):
        self.c = (0.0, -0.02, z); self.r = r

    # where the front surface of the head is, for sticking a face on it
    def y(self, x, z, k=1.0):
        d = 1 - (x / self.r[0]) ** 2 - ((z - self.c[2]) / self.r[2]) ** 2
        return self.c[1] - self.r[1] * math.sqrt(max(0.0, d)) * k


def body(s, belly=(0.40, 0.355, 0.43), belly_z=0.76, chest=(0.31, 0.28, 0.26), head=(0.40, 0.365, 0.37), head_z=1.36,
         leg=(0.125, 0.13, 0.27), leg_x=0.165, foot=(0.135, 0.18, 0.08), arm=(0.27, 0.10, 0.10), hand=0.10):
    s.clay((0, 0, belly_z), belly)
    s.clay((0, 0, 1.02), chest)
    s.clay((0, -0.02, head_z), head)
    s.clay((leg_x, 0, leg[2]), leg, mirror=True)
    s.clay((leg_x, -0.045, foot[2]), foot, mirror=True)
    s.clay((0.50, 0, 1.03), arm, mirror=True)
    s.clay((0.76, 0, 1.03), (hand, hand + 0.005, hand + 0.005), mirror=True)
    return Head(head_z, head)


def eyes(s, H, x, z, size, iris=0x6b3f1d, brow=None, tilt=0.3):
    for sx in (1, -1):
        ys = H.y(x, z)
        s.part(0xffffff, (sx * x, ys + 0.004, z), (size, size * 0.46, size * 1.17))
        s.part(iris, (sx * x * 0.97, ys - 0.028, z - size * 0.08), (size * 0.67, size * 0.25, size * 0.82))
        s.part(0x1c1c22, (sx * x * 0.955, ys - 0.044, z - size * 0.1), (size * 0.41, size * 0.15, size * 0.51))
        s.part(0xffffff, (sx * x * 0.955 + size * 0.24, ys - 0.056, z + size * 0.2), (size * 0.15, size * 0.07, size * 0.15), seg=8, rings=6)
        if brow is not None:
            zb = z + size * 1.48
            s.part(brow, (sx * x * 1.1, H.y(x * 1.1, zb) - 0.004, zb), (size * 0.66, 0.014, 0.013), rot=(0, sx * tilt, 0), seg=10, rings=6)


def smile(s, y, z, w=0.085, color=0x7a3b2e):
    s.ring(color, (0, y, z), w, 0.011, rot=(-PI / 2, 0, 0), arc=0.5)


def scarf(s, color, z=1.085, r=0.305):
    s.ring(color, (0, 0.0, z), r, 0.045, rot=(0.1, 0, 0))
    s.cone(color, (0, -r - 0.025, z - 0.12), 0.17, 0.26, rot=(PI + 0.28, 0, 0), scale=(1.0, 0.3, 1.0), seg=3)
    s.part(color, (0.22, -0.2, z - 0.005), (0.05, 0.05, 0.05), seg=10, rings=8)


def blush(s, color, x, y, z, k=0.75, size=(0.1, 0.12, 0.085)):
    s.paint(color, lambda p, n: k * max(patch(p, (x, y, z), size, 0.6), patch(p, (-x, y, z), size, 0.6)))


def hooves(s, color, hand=0.725, foot=0.09):
    s.paint(color, lambda p, n: smoothstep(hand, hand + 0.02, abs(p.x)))
    s.paint(color, lambda p, n: 1 - smoothstep(foot, foot + 0.015, p.z))


# ------------------------------------------------------------------ the Herd
def pig():
    PINK, BELLY, SNOUT, BLUSH, HOOF, DARK = 0xf6a5b5, 0xfcd9de, 0xf08ea3, 0xf47f98, 0x9c4a5c, 0xb85c74
    s = Sculpt(); H = body(s)
    s.clay((0, -0.30, 1.28), (0.17, 0.13, 0.13))
    s.clay((0.31, -0.02, 1.67), (0.17, 0.055, 0.19), rot=(0.7, 0.6, 0.0), mirror=True)
    s.clay((0.0, 0.36, 0.62), (0.05, 0.07, 0.05))
    s.melt()
    s.paint(PINK, None, base=True)
    s.paint(BELLY, lambda p, n: patch(p, (0, -0.34, 0.74), (0.29, 0.30, 0.36)) * smoothstep(0.05, 0.5, -n.y))
    blush(s, BLUSH, 0.27, -0.29, 1.25)
    hooves(s, HOOF)
    s.paint(SNOUT, lambda p, n: 0.6 * max(patch(p, (0.33, -0.08, 1.63), (0.11, 0.09, 0.14), 0.5), patch(p, (-0.33, -0.08, 1.63), (0.11, 0.09, 0.14), 0.5)))
    s.part(SNOUT, (0, -0.405, 1.285), (0.155, 0.06, 0.118))
    s.part(DARK, (0.055, -0.458, 1.29), (0.026, 0.014, 0.036), mirror=True)
    eyes(s, H, 0.155, 1.46, 0.098, 0x6b3f1d, DARK)
    smile(s, -0.378, 1.215, 0.085, DARK)
    scarf(s, 0xe2443a)
    s.ring(SNOUT, (0.0, 0.42, 0.66), 0.06, 0.022, rot=(0, PI / 2, 0))
    return s


def chicken():
    WHITE, CREAM, ORANGE, RED = 0xffffff, 0xfff3dc, 0xf5a623, 0xe5412d
    s = Sculpt()
    H = body(s, belly=(0.37, 0.34, 0.42), belly_z=0.80, chest=(0.29, 0.27, 0.25), head=(0.35, 0.33, 0.34), head_z=1.36,
             leg=(0.05, 0.05, 0.21), leg_x=0.13, foot=(0.12, 0.17, 0.035), arm=(0.27, 0.07, 0.14), hand=0.085)
    s.clay((0, 0.3, 1.0), (0.12, 0.2, 0.26), rot=(-0.55, 0, 0))            # tail feathers
    s.clay((0.1, 0.3, 0.98), (0.09, 0.16, 0.22), rot=(-0.55, 0, 0.4), mirror=True)
    s.clay((0.62, 0.0, 0.94), (0.16, 0.05, 0.12), mirror=True)             # wing feather tips
    s.melt(voxel=0.014, tris=6000)
    s.paint(WHITE, None, base=True)
    s.paint(CREAM, lambda p, n: 0.8 * patch(p, (0, -0.33, 0.78), (0.26, 0.30, 0.34)) * smoothstep(0.05, 0.5, -n.y))
    s.paint(ORANGE, lambda p, n: 1 - smoothstep(0.36, 0.40, p.z))
    blush(s, 0xffb3bd, 0.24, -0.25, 1.28, 0.7, (0.085, 0.1, 0.07))
    eyes(s, H, 0.13, 1.44, 0.085, 0x3a2616, None)
    yb = H.y(0, 1.34)
    s.cone(0xffb02e, (0, yb - 0.07, 1.345), 0.11, 0.26, rot=(PI / 2, 0, 0), scale=(1.0, 1.0, 0.62), seg=14)   # top of beak
    s.cone(0xf08a24, (0, yb - 0.04, 1.29), 0.08, 0.18, rot=(PI / 2, 0, 0), scale=(1.0, 1.0, 0.5), seg=14)    # bottom of beak
    for y, z, r in ((-0.14, 1.73, 0.085), (-0.02, 1.775, 0.105), (0.11, 1.74, 0.09)):                         # comb
        s.part(RED, (0, y, z), (r * 0.55, r, r))
    s.part(RED, (0.045, yb + 0.02, 1.16), (0.04, 0.045, 0.085), mirror=True)                                  # wattles
    return s


def cow():
    WHITE, BLACK, PINK = 0xffffff, 0x2f3036, 0xf7b7c2
    s = Sculpt(); H = body(s, belly=(0.41, 0.36, 0.44))
    s.clay((0.47, 0.0, 1.5), (0.15, 0.05, 0.085), rot=(0, -0.35, 0), mirror=True)   # ears
    s.clay((0, -0.03, 1.72), (0.09, 0.09, 0.06))                                    # tuft
    s.clay((0, 0.36, 0.7), (0.035, 0.035, 0.2), rot=(0.5, 0, 0))                    # tail
    s.clay((0, 0.47, 0.5), (0.06, 0.06, 0.07))
    s.melt()
    s.paint(WHITE, None, base=True)
    s.paint(0xfff0e8, lambda p, n: 0.9 * patch(p, (0, -0.34, 0.74), (0.27, 0.30, 0.34)) * smoothstep(0.05, 0.5, -n.y))
    for c, r in (((0.3, -0.12, 0.98), (0.2, 0.26, 0.2)), ((-0.32, 0.12, 0.66), (0.22, 0.26, 0.24)), ((0.12, 0.3, 0.6), (0.2, 0.2, 0.2)),
                 ((-0.2, 0.22, 1.05), (0.16, 0.2, 0.15)), ((0.24, -0.2, 1.5), (0.16, 0.2, 0.17)), ((-0.1, 0.25, 1.5), (0.2, 0.2, 0.18)), ((0, 0.47, 0.5), (0.1, 0.1, 0.1))):
        s.paint(BLACK, lambda p, n, c=c, r=r: patch(p, c, r, 0.18))
    s.paint(PINK, lambda p, n: 0.7 * max(patch(p, (0.47, -0.04, 1.5), (0.1, 0.05, 0.06), 0.5), patch(p, (-0.47, -0.04, 1.5), (0.1, 0.05, 0.06), 0.5)))
    hooves(s, BLACK)
    s.part(PINK, (0, H.y(0, 1.25) - 0.035, 1.25), (0.215, 0.11, 0.145))             # muzzle
    s.part(0xc7798a, (0.075, H.y(0, 1.27) - 0.138, 1.275), (0.028, 0.014, 0.036), mirror=True)
    smile(s, H.y(0, 1.2) - 0.118, 1.215, 0.08, 0xc7798a)
    eyes(s, H, 0.155, 1.47, 0.09, 0x4a3320, BLACK, 0.25)
    for sx in (1, -1):
        s.cone(0xf3e6c4, (sx * 0.2, -0.02, 1.76), 0.06, 0.2, rot=(0, sx * 0.45, 0), seg=12)   # horns
    s.ring(0x8f5a2e, (0, 0.0, 1.085), 0.305, 0.035, rot=(0.1, 0, 0))                # collar
    s.part(0xffd24a, (0, -0.33, 0.98), (0.085, 0.07, 0.1))                          # cowbell
    s.part(0xc9973a, (0, -0.33, 0.87), (0.03, 0.03, 0.03), seg=10, rings=8)
    return s


def sheep():
    WOOL, DARK, HOOF = 0xfdf6e3, 0x4a4038, 0x2a2420
    s = Sculpt()
    H = body(s, belly=(0.36, 0.33, 0.4), chest=(0.29, 0.27, 0.25), head=(0.35, 0.33, 0.34), head_z=1.37, arm=(0.27, 0.09, 0.09), hand=0.095)
    for x, y, z, r in ((0.3, 0.05, 0.98, 0.2), (0.33, -0.1, 0.7, 0.2), (0.3, 0.16, 0.62, 0.2), (0.0, 0.3, 0.86, 0.22), (0.0, 0.26, 0.56, 0.2), (0.14, -0.3, 0.9, 0.17),
                       (0.15, -0.32, 0.62, 0.18), (0.0, -0.36, 0.76, 0.17), (0.18, 0.28, 1.05, 0.17), (0.2, 0.0, 0.46, 0.2), (0.0, -0.22, 0.45, 0.18), (0.0, -0.25, 1.06, 0.15)):
        s.clay((x, y, z), (r, r, r), mirror=x != 0)                                 # wool body
        if x == 0: pass
    for x, y, z, r in ((0, -0.06, 1.71, 0.16), (0.16, 0.0, 1.67, 0.14), (0, 0.14, 1.64, 0.17), (0.14, 0.18, 1.52, 0.14), (0, 0.27, 1.45, 0.15)):
        s.clay((x, y, z), (r, r, r), mirror=x != 0)                                 # wool cap
    s.clay((0.42, 0.0, 1.36), (0.15, 0.055, 0.075), rot=(0, 0.45, 0), mirror=True)  # droopy ears
    s.melt(voxel=0.017, smooth=10, tris=7000)
    s.paint(WOOL, None, base=True)
    face = lambda p: patch(p, (0, -0.06, 1.34), (0.37, 0.36, 0.3), 0.12)
    cap = lambda p: max(smoothstep(1.55, 1.6, p.z), smoothstep(0.08, 0.14, p.y) * smoothstep(1.3, 1.38, p.z))
    s.paint(DARK, lambda p, n: face(p) * (1 - cap(p)))
    s.paint(DARK, lambda p, n: max(patch(p, (0.44, 0.0, 1.35), (0.2, 0.09, 0.12), 0.25), patch(p, (-0.44, 0.0, 1.35), (0.2, 0.09, 0.12), 0.25)))   # ears
    s.paint(DARK, lambda p, n: smoothstep(0.5, 0.54, abs(p.x)) * (1 - smoothstep(1.2, 1.25, p.z)))    # forearms
    s.paint(DARK, lambda p, n: 1 - smoothstep(0.27, 0.31, p.z))                                       # legs
    hooves(s, HOOF, 0.74, 0.08)
    s.part(0x655a50, (0, H.y(0, 1.27) - 0.02, 1.27), (0.13, 0.085, 0.1))            # muzzle
    s.part(0xe79aa6, (0, H.y(0, 1.3) - 0.1, 1.3), (0.04, 0.02, 0.028))              # nose
    smile(s, H.y(0, 1.23) - 0.092, 1.245, 0.055, HOOF)
    eyes(s, H, 0.135, 1.44, 0.085, 0x6b3f1d, None)
    scarf(s, 0x4f9f42, 1.1, 0.27)
    return s


def goat():
    TAN, CREAM, HOOF, HORN = 0xd9b88a, 0xf3e2c4, 0x4a3a2c, 0x8d8478
    s = Sculpt(); H = body(s, belly=(0.38, 0.34, 0.43), head=(0.37, 0.35, 0.36))
    s.clay((0, -0.3, 1.27), (0.18, 0.15, 0.14))                                     # muzzle
    s.clay((0.5, 0.02, 1.45), (0.19, 0.05, 0.075), rot=(0, 0.3, 0), mirror=True)    # sideways ears
    s.clay((0, 0.36, 0.72), (0.05, 0.08, 0.06))                                     # stubby tail
    s.melt()
    s.paint(TAN, None, base=True)
    s.paint(CREAM, lambda p, n: patch(p, (0, -0.34, 0.74), (0.27, 0.30, 0.35)) * smoothstep(0.05, 0.5, -n.y))
    s.paint(CREAM, lambda p, n: patch(p, (0, -0.36, 1.25), (0.2, 0.16, 0.16), 0.35))
    s.paint(0xf2c5b0, lambda p, n: 0.7 * max(patch(p, (0.5, -0.03, 1.45), (0.13, 0.05, 0.05), 0.5), patch(p, (-0.5, -0.03, 1.45), (0.13, 0.05, 0.05), 0.5)))
    blush(s, 0xeeb090, 0.26, -0.27, 1.3, 0.6)
    hooves(s, HOOF)
    s.part(0x6b4a3a, (0, -0.455, 1.3), (0.05, 0.022, 0.032))                        # nose
    smile(s, -0.415, 1.235, 0.06, 0x6b4a3a)
    s.cone(0xffffff, (0, -0.33, 1.07), 0.07, 0.22, rot=(PI, 0, 0), scale=(1.0, 0.7, 1.0), seg=12)   # beard
    eyes(s, H, 0.15, 1.46, 0.09, 0xc9973a, 0x8a6a45, 0.25)
    for sx in (1, -1):                                                              # two-piece curved horns
        s.cone(HORN, (sx * 0.15, 0.02, 1.76), 0.065, 0.22, rot=(-0.45, sx * 0.2, 0), seg=12)
        s.cone(HORN, (sx * 0.185, 0.13, 1.87), 0.045, 0.17, rot=(-1.2, sx * 0.25, 0), seg=12)
    scarf(s, 0x9b6fd0)
    return s


# ------------------------------------------------------------------ the Hands
LOOKS = [
    dict(shirt=0xd9463e, skin=0xf2c9a0, hair=0x6b4426, hat='straw', extra='moustache', blush=0xf2a08c, iris=0x5a3a22),
    dict(shirt=0xf2c84b, skin=0xf7d7b5, hair=0xd9783a, hat='bandana', extra='ponytail', blush=0xf7a59a, iris=0x3f7a4a),
    dict(shirt=0x58a55c, skin=0xc98f62, hair=0xe4e4e4, hat='cap', extra='beard', blush=0xc0714f, iris=0x4a3320),
    dict(shirt=0xff9a3c, skin=0x9a6b45, hair=0x2e2420, hat='straw', extra='curls', blush=0xb0623f, iris=0x3a2616),
    dict(shirt=0x9b6fd0, skin=0xf2c9a0, hair=0xf0f0f0, hat='sun', extra='bun', blush=0xf2a08c, iris=0x5a7a9a),
]
DENIM, BIB, BOOT = 0x3d6fb5, 0x4f84cf, 0x6b4426


def farmer(look):
    L = LOOKS[look]
    s = Sculpt()
    H = body(s, belly=(0.35, 0.31, 0.4), belly_z=0.74, chest=(0.31, 0.27, 0.26), head=(0.36, 0.34, 0.35), head_z=1.38,
             leg=(0.13, 0.135, 0.27), foot=(0.14, 0.2, 0.09), arm=(0.27, 0.095, 0.095), hand=0.095)
    s.clay((0, H.y(0, 1.33) - 0.015, 1.33), (0.055, 0.055, 0.05))                   # nose
    s.clay((0.355, 0.0, 1.37), (0.05, 0.045, 0.075), mirror=True)                   # ears
    s.melt()
    s.paint(L['skin'], None, base=True)
    s.paint(DENIM, lambda p, n: 1 - smoothstep(1.0, 1.03, p.z))                                        # overalls
    s.paint(L['shirt'], lambda p, n: smoothstep(0.98, 1.01, p.z) * (1 - smoothstep(1.13, 1.16, p.z)))  # shirt collar and shoulders
    s.paint(L['shirt'], lambda p, n: smoothstep(0.3, 0.34, abs(p.x)) * smoothstep(0.86, 0.9, p.z) * (1 - smoothstep(1.2, 1.24, p.z)))   # sleeves
    s.paint(L['skin'], lambda p, n: smoothstep(0.7, 0.72, abs(p.x)))                                   # hands
    s.paint(BOOT, lambda p, n: 1 - smoothstep(0.15, 0.17, p.z))                                        # boots
    blush(s, L['blush'], 0.22, -0.27, 1.3, 0.55, (0.085, 0.1, 0.07))
    # bib with buttons, straps and a pocket
    s.box(BIB, (0, -0.29, 0.93), (0.36, 0.07, 0.27), rot=(-0.12, 0, 0))
    s.box(DENIM, (0, -0.33, 0.9), (0.17, 0.03, 0.11), rot=(-0.12, 0, 0))
    for sx in (1, -1):
        s.box(BIB, (sx * 0.145, -0.16, 1.13), (0.065, 0.3, 0.035), rot=(0.62, 0, 0))
        s.part(0xffd24a, (sx * 0.145, -0.325, 1.03), (0.03, 0.02, 0.03), seg=10, rings=8)
    eyes(s, H, 0.118, 1.445, 0.078, L['iris'], 0x9a9a9a if L['hair'] in (0xe4e4e4, 0xf0f0f0) else L['hair'], 0.2)
    if L['extra'] not in ('moustache', 'beard'):
        smile(s, H.y(0, 1.23) - 0.01, 1.265, 0.075)
    hair, hat = L['hair'], L['hat']
    if hat in ('straw', 'sun'):
        wide = 0.54 if hat == 'sun' else 0.47
        s.part(0xf2cc5c, (0, -0.02, 1.63), (wide, wide, 0.03), seg=28, rings=10)    # brim
        s.part(0xf2cc5c, (0, -0.02, 1.71), (0.27, 0.27, 0.17))                      # crown
        s.ring(0xff6f91 if hat == 'sun' else 0xb5452f, (0, -0.02, 1.665), 0.262, 0.03)
    elif hat == 'cap':
        s.part(0x2f6fb0, (0, -0.01, 1.56), (0.375, 0.36, 0.21))
        s.part(0x2f6fb0, (0, -0.36, 1.57), (0.24, 0.2, 0.025))                      # peak
        s.part(0xffffff, (0, -0.01, 1.775), (0.035, 0.035, 0.02), seg=10, rings=8)
    else:
        s.part(0xe2443a, (0, 0.0, 1.565), (0.372, 0.36, 0.2))                       # bandana
        s.part(0xe2443a, (0.3, 0.2, 1.58), (0.08, 0.08, 0.07), seg=10, rings=8)
    ex = L['extra']
    if ex == 'moustache':
        for sx in (1, -1):
            s.part(hair, (sx * 0.065, H.y(0.065, 1.26) - 0.012, 1.26), (0.085, 0.03, 0.04), rot=(0, sx * 0.3, 0))
        s.part(hair, (0, 0.24, 1.42), (0.3, 0.13, 0.17))                            # hair at the back
    elif ex == 'beard':
        s.part(hair, (0, H.y(0, 1.17, 0.78), 1.16), (0.24, 0.16, 0.17))
        for sx in (1, -1):
            s.part(hair, (sx * 0.07, H.y(0.07, 1.27) - 0.012, 1.27), (0.09, 0.03, 0.04), rot=(0, sx * 0.3, 0))
    elif ex == 'ponytail':
        s.part(hair, (0, 0.33, 1.3), (0.11, 0.11, 0.26), rot=(-0.5, 0, 0))
        for sx in (1, -1):
            s.part(hair, (sx * 0.2, H.y(0.2, 1.53) + 0.02, 1.535), (0.11, 0.05, 0.05), rot=(0, sx * 0.35, 0))
    elif ex == 'curls':
        for x, y in ((0.3, -0.12), (0.34, 0.08), (0.24, 0.26), (0.0, 0.33), (0.13, 0.31)):
            for sx in ((1, -1) if x else (1,)):
                s.part(hair, (sx * x, y, 1.45), (0.09, 0.09, 0.09), seg=12, rings=8)
    elif ex == 'bun':
        s.part(hair, (0, 0.34, 1.42), (0.15, 0.15, 0.15))
        s.part(hair, (0, 0.2, 1.45), (0.31, 0.2, 0.2))
        for sx in (1, -1):
            s.part(hair, (sx * 0.33, 0.06, 1.47), (0.06, 0.14, 0.12))
    return s


MAKERS = {'pig': pig, 'chicken': chicken, 'cow': cow, 'sheep': sheep, 'goat': goat}
for i in range(5):
    MAKERS[f'farmer{i}'] = (lambda i=i: farmer(i))

if __name__ == '__main__':
    which, out = sys.argv[-2], sys.argv[-1]
    for name in (MAKERS if which == 'all' else [which]):
        print(name, MAKERS[name]().export(os.path.join(out, f'{name}_raw.json')))
