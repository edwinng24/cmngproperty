#!/usr/bin/env python3
"""
Generates the four page banners in public/banners/.

The art is deterministic — every random draw comes from a fixed seed, so
re-running this produces byte-identical files. Change a seed to reshuffle a
scene, change the palette block to recolour everything.

    python3 scripts/generate-banners.py
"""
import os
import random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "banners")
W, H = 1600, 900

# Palette — mirrors the @theme block in src/app/globals.css.
BG     = "#041d17"   # brand-950
DEEP   = "#071f19"
NEAR   = "#0a2b21"
MID    = "#0d4231"   # brand-800
BRAND  = "#0c523b"   # brand-700
FAR    = "#1d815e"   # brand-500
PALE   = "#3f9d79"   # brand-400
SAND   = "#e0c99b"   # sand-300
ACCENT = "#c26685"   # accent-400
ACC_L  = "#dc9bb1"   # accent-300


def head(warm_x=0.9, warm_y=0.75):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="presentation">
  <defs>
    <radialGradient id="glow" cx="0.72" cy="0.06" r="0.8">
      <stop offset="0" stop-color="{PALE}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="{PALE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warm" cx="{warm_x}" cy="{warm_y}" r="0.6">
      <stop offset="0" stop-color="{ACCENT}" stop-opacity="0.24"/>
      <stop offset="1" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="{SAND}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="{SAND}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonhalo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="{SAND}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="{SAND}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="{BG}"/>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  <rect width="{W}" height="{H}" fill="url(#warm)"/>
'''


def lit(rng, accent_chance=0.16):
    """Most windows warm sand, a few accent — keeps the fields from reading flat."""
    return ACCENT if rng.random() < accent_chance else SAND


def stars(rng, n, ymax, xmin=0):
    out = []
    for _ in range(n):
        x = rng.randint(xmin, W)
        y = rng.randint(10, ymax)
        r = rng.choice([1.2, 1.6, 2.0, 2.6])
        out.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{SAND}" opacity="{rng.uniform(.2,.75):.2f}"/>')
    return out


def moon(x, y, r):
    return [
        f'<circle cx="{x}" cy="{y}" r="{r*3.2:.0f}" fill="url(#moonhalo)"/>',
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="{SAND}" opacity="0.9"/>',
        f'<circle cx="{x-r*0.42:.0f}" cy="{y-r*0.3:.0f}" r="{r*0.16:.0f}" fill="{BG}" opacity="0.12"/>',
        f'<circle cx="{x+r*0.3:.0f}" cy="{y+r*0.35:.0f}" r="{r*0.2:.0f}" fill="{BG}" opacity="0.1"/>',
    ]


def tree(x, base, scale, fill, rng):
    """Trunk plus a cluster of canopy blobs."""
    h = 54 * scale
    out = [f'<rect x="{x-3*scale:.1f}" y="{base-h:.1f}" width="{6*scale:.1f}" height="{h:.1f}" fill="{fill}"/>']
    for dx, dy, r in ((0, -h, 26), (-17, -h + 12, 19), (17, -h + 10, 21), (-6, -h - 16, 17)):
        out.append(
            f'<circle cx="{x+dx*scale:.0f}" cy="{base+dy*scale:.0f}" r="{r*scale:.0f}" fill="{fill}"/>'
        )
    return out


def street_lamp(x, base, fill, h=118):
    top = base - h
    return [
        f'<ellipse cx="{x+16}" cy="{base}" rx="70" ry="26" fill="url(#lamp)"/>',
        f'<rect x="{x-3}" y="{top}" width="6" height="{h}" fill="{fill}"/>',
        f'<path d="M{x} {top} q0 -18 20 -18 h8" stroke="{fill}" stroke-width="6" fill="none" stroke-linecap="round"/>',
        f'<circle cx="{x+30}" cy="{top-14}" r="7.5" fill="{SAND}"/>',
    ]


def bird(x, y, s=1.0):
    return (f'<path d="M{x} {y} q{7*s} {-6*s} {13*s} 0 q{6*s} {-6*s} {13*s} 0" '
            f'stroke="{PALE}" stroke-width="{2.2*s:.1f}" fill="none" '
            f'stroke-linecap="round" opacity="0.7"/>')


def window_grid(x, y, w, h, rng, cw=18, ch=24, density=0.5, accent_chance=0.16, rx=2):
    """Evenly spaced lit windows inside a rectangle."""
    out = []
    cols = max(1, int(w // (cw * 2.1)))
    rows = max(1, int(h // (ch * 2.0)))
    gx = (w - cols * cw) / (cols + 1)
    gy = (h - rows * ch) / (rows + 1)
    for c in range(cols):
        for r in range(rows):
            if rng.random() > density:
                continue
            wx = x + gx + c * (cw + gx)
            wy = y + gy + r * (ch + gy)
            out.append(
                f'<rect x="{wx:.0f}" y="{wy:.0f}" width="{cw}" height="{ch}" rx="{rx}" '
                f'fill="{lit(rng, accent_chance)}" opacity="{rng.uniform(.5,1):.2f}"/>'
            )
    return out


# ═══════════════════════════════════════════════════════════ home
def build_home():
    rng = random.Random(1071)
    out = []
    out += stars(rng, 52, 400)
    out += moon(1318, 122, 44)
    out += [bird(452, 206), bird(508, 178, 0.8), bird(556, 220, 0.7)]

    # Distant hills, behind everything.
    out.append(f'<path d="M0 452 Q230 384 480 436 Q710 482 950 424 Q1230 352 1600 428 V900 H0 Z" fill="{DEEP}"/>')
    out.append(f'<path d="M0 504 Q310 448 630 496 Q900 538 1190 482 Q1410 440 1600 486 V900 H0 Z" fill="{NEAR}" opacity="0.9"/>')
    # Far tree line along the second ridge.
    tx = -20
    while tx < W + 40:
        out += tree(tx, 512, 0.55, DEEP, rng)
        tx += rng.randint(46, 96)

    def house(x, base, w, h, fill, rng, density=0.5, porch=False):
        """Pitched roof with eaves, a chimney, windows, a door, sometimes a dormer."""
        roof_h = rng.randint(34, 54)
        eave = 10
        p = []
        p.append(f'<rect x="{x}" y="{base-h}" width="{w}" height="{h}" fill="{fill}"/>')
        cx = x + w * rng.uniform(0.18, 0.34)
        p.append(f'<rect x="{cx:.0f}" y="{base-h-roof_h-18:.0f}" width="15" height="40" fill="{fill}"/>')
        p.append(f'<rect x="{cx-3:.0f}" y="{base-h-roof_h-22:.0f}" width="21" height="7" fill="{fill}"/>')
        p.append(f'<path d="M{x-eave} {base-h} L{x+w/2:.0f} {base-h-roof_h} L{x+w+eave} {base-h} Z" fill="{fill}"/>')
        p.append(f'<path d="M{x-eave} {base-h} L{x+w/2:.0f} {base-h-roof_h} L{x+w+eave} {base-h} Z" fill="{BG}" opacity="0.2"/>')
        if h > 140 and rng.random() < 0.4:
            dx = x + w * 0.58
            p.append(f'<path d="M{dx:.0f} {base-h-10:.0f} L{dx+19:.0f} {base-h-34:.0f} L{dx+38:.0f} {base-h-10:.0f} Z" fill="{fill}"/>')
            p.append(f'<rect x="{dx+12:.0f}" y="{base-h-13:.0f}" width="15" height="13" fill="{lit(rng)}" opacity="0.8"/>')
        p += window_grid(x + 6, base - h + 12, w - 12, h - 62, rng, cw=15, ch=20, density=density)
        dw = 22
        dx = x + w / 2 - dw / 2 + rng.randint(-12, 12)
        p.append(f'<rect x="{dx:.0f}" y="{base-44}" width="{dw}" height="44" rx="3" fill="{BG}" opacity="0.55"/>')
        if rng.random() < 0.6:
            p.append(f'<rect x="{dx+3:.0f}" y="{base-50}" width="{dw-6}" height="6" rx="2" fill="{SAND}" opacity="0.75"/>')
        if porch:
            p.append(f'<rect x="{dx-14:.0f}" y="{base-58}" width="{dw+28}" height="6" rx="3" fill="{fill}"/>')
            p.append(f'<rect x="{dx-12:.0f}" y="{base-58}" width="4" height="58" fill="{fill}"/>')
            p.append(f'<rect x="{dx+dw+8:.0f}" y="{base-58}" width="4" height="58" fill="{fill}"/>')
        return p

    # Three depth layers. Houses now occupy the lower half, leaving real sky.
    layers = [
        (BRAND, 664, 96,  150, 0.55, DEEP),
        (MID,   728, 116, 176, 0.50, DEEP),
        (NEAR,  800, 132, 196, 0.44, BG),
    ]
    for fill, base, hmin, hmax, dens, tree_fill in layers:
        gaps = []
        x = -70
        while x < W + 70:
            w = rng.randint(132, 216)
            out += house(x, base, w, rng.randint(hmin, hmax), fill, rng, dens,
                         porch=rng.random() < 0.3)
            x += w + rng.randint(10, 40)
            gaps.append(x)
        # Trees drawn after the row so they read in front of it.
        for gx in gaps:
            if rng.random() < 0.34:
                out += tree(gx - 14, base, 0.7, tree_fill, rng)

    for lx in (250, 610, 980, 1330):
        out += street_lamp(lx, 800, MID, h=104)

    # Foreground: kerb, road with centre line, hedge.
    out.append(f'<rect y="800" width="{W}" height="12" fill="{DEEP}"/>')
    out.append(f'<rect y="812" width="{W}" height="88" fill="{BG}"/>')
    for dx in range(40, W, 150):
        out.append(f'<rect x="{dx}" y="862" width="70" height="5" rx="2" fill="{MID}" opacity="0.75"/>')
    hx = -30
    while hx < W + 40:
        out.append(f'<circle cx="{hx}" cy="826" r="{rng.randint(22,32)}" fill="{DEEP}"/>')
        hx += rng.randint(36, 54)
    return head() + "  " + "\n  ".join(out) + "\n</svg>\n"


# ═══════════════════════════════════════════════════════════ services
def build_services():
    rng = random.Random(2214)
    out = []
    out += stars(rng, 40, 340, xmin=380)
    out += [bird(520, 150), bird(572, 128, 0.75)]

    ground = 828

    # Far silhouette.
    x = 380
    while x < W:
        w = rng.randint(70, 130)
        h = rng.randint(180, 330)
        out.append(f'<rect x="{x}" y="{ground-h}" width="{w}" height="{h}" fill="{DEEP}"/>')
        x += w + rng.randint(6, 22)

    def tower(x, w, h, fill, crown, rng):
        top = ground - h
        p = [f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{fill}"/>']
        if crown == "parapet":
            p.append(f'<rect x="{x-7}" y="{top-13}" width="{w+14}" height="13" fill="{fill}"/>')
            for bx in range(int(x), int(x + w), 26):
                p.append(f'<rect x="{bx}" y="{top-24}" width="13" height="12" fill="{fill}"/>')
        elif crown == "setback":
            p.append(f'<rect x="{x+w*0.16:.0f}" y="{top-52}" width="{w*0.68:.0f}" height="52" fill="{fill}"/>')
            p.append(f'<rect x="{x+w*0.34:.0f}" y="{top-86}" width="{w*0.32:.0f}" height="36" fill="{fill}"/>')
        elif crown == "pitch":
            p.append(f'<path d="M{x-8} {top} L{x+w/2:.0f} {top-64} L{x+w+8} {top} Z" fill="{fill}"/>')
        elif crown == "dome":
            p.append(f'<path d="M{x+w*0.12:.0f} {top} A{w*0.38:.0f} {w*0.38:.0f} 0 0 1 {x+w*0.88:.0f} {top} Z" fill="{fill}"/>')
            p.append(f'<rect x="{x+w/2-2:.0f}" y="{top-w*0.46:.0f}" width="4" height="26" fill="{fill}"/>')
        elif crown == "mast":
            p.append(f'<rect x="{x-6}" y="{top-11}" width="{w+12}" height="11" fill="{fill}"/>')
            p.append(f'<rect x="{x+w/2-2:.0f}" y="{top-96}" width="4" height="86" fill="{fill}"/>')
            p.append(f'<circle cx="{x+w/2:.0f}" cy="{top-100}" r="6" fill="{ACCENT}"/>')
        elif crown == "watertank":
            p.append(f'<rect x="{x-6}" y="{top-10}" width="{w+12}" height="10" fill="{fill}"/>')
            tx = x + w * 0.3
            p.append(f'<rect x="{tx:.0f}" y="{top-68}" width="{w*0.4:.0f}" height="40" rx="6" fill="{fill}"/>')
            p.append(f'<path d="M{tx:.0f} {top-68} L{tx+w*0.2:.0f} {top-86} L{tx+w*0.4:.0f} {top-68} Z" fill="{fill}"/>')
            for lx2 in (tx + 4, tx + w * 0.4 - 8):
                p.append(f'<rect x="{lx2:.0f}" y="{top-28}" width="4" height="28" fill="{fill}"/>')
        # Rooftop plant.
        for bx in (x + w * 0.2, x + w * 0.6):
            if rng.random() < 0.5:
                p.append(f'<rect x="{bx:.0f}" y="{top-16}" width="22" height="16" rx="3" fill="{fill}"/>')
        # Balcony bands on some towers.
        if rng.random() < 0.45:
            by = top + 60
            while by < ground - 60:
                p.append(f'<rect x="{x-5}" y="{by}" width="{w+10}" height="5" fill="{BG}" opacity="0.45"/>')
                by += 74
        p += window_grid(x + 8, top + 18, w - 16, h - 34, rng, cw=22, ch=26,
                         density=0.46, accent_chance=0.18, rx=3)
        return p

    crowns = ["parapet", "setback", "pitch", "mast", "dome", "watertank", "parapet", "setback"]
    specs = [(430, 128, 330), (566, 104, 430), (678, 146, 300), (832, 118, 520),
             (958, 158, 386), (1124, 112, 470), (1244, 150, 350), (1402, 126, 440)]
    for i, (x, w, h) in enumerate(specs):
        fill = [BRAND, MID, FAR, NEAR][i % 4]
        out += tower(x, w, h, fill, crowns[i % len(crowns)], rng)

    # Construction crane behind the block.
    cx, cbase, ch_ = 1290, ground, 470
    ctop = cbase - ch_
    out.append(f'<rect x="{cx-5}" y="{ctop}" width="10" height="{ch_}" fill="{MID}"/>')
    for yy in range(ctop + 16, cbase, 34):
        out.append(f'<path d="M{cx-5} {yy} L{cx+5} {yy+34}" stroke="{MID}" stroke-width="3"/>')
    out.append(f'<rect x="{cx-176}" y="{ctop-8}" width="330" height="8" fill="{MID}"/>')
    out.append(f'<path d="M{cx} {ctop-46} L{cx-172} {ctop-8} M{cx} {ctop-46} L{cx+150} {ctop-8}" stroke="{MID}" stroke-width="4" fill="none"/>')
    out.append(f'<rect x="{cx-7}" y="{ctop-46}" width="14" height="40" fill="{MID}"/>')
    out.append(f'<path d="M{cx+116} {ctop} V{ctop+92}" stroke="{MID}" stroke-width="3"/>')
    out.append(f'<rect x="{cx+106}" y="{ctop+92}" width="20" height="14" rx="3" fill="{MID}"/>')
    out.append(f'<circle cx="{cx}" cy="{ctop-52}" r="5" fill="{ACCENT}"/>')

    # Street level: kerb, awnings, lamps.
    out.append(f'<rect y="{ground}" width="{W}" height="{H-ground}" fill="{NEAR}"/>')
    ax = 420
    while ax < W:
        aw = rng.randint(70, 118)
        out.append(f'<path d="M{ax} {ground} h{aw} l-9 22 h-{aw-18} Z" fill="{BRAND}" opacity="0.9"/>')
        out.append(f'<rect x="{ax+14}" y="{ground+26}" width="{aw-28}" height="20" rx="3" fill="{lit(rng)}" opacity="0.55"/>')
        ax += aw + rng.randint(26, 64)
    for lx in (470, 780, 1090, 1400):
        out += street_lamp(lx, H - 8, MID, h=96)
    out.append(f'<rect y="{H-8}" width="{W}" height="8" fill="{DEEP}"/>')
    return head(0.85, 0.8) + "  " + "\n  ".join(out) + "\n</svg>\n"


# ═══════════════════════════════════════════════════════════ about
def build_about():
    rng = random.Random(3390)
    out = []
    floor = H - 96
    plinth = floor - 30

    SPAN, CW, COL_H = 250, 42, 396
    X0 = 400
    n_cols = int((W - X0) / SPAN) + 3
    spring = plinth - COL_H          # arches spring from the capitals
    inner = (SPAN - CW) / 2          # half the clear opening
    crown = spring - inner           # highest point of each opening
    ent_y = crown - 46               # underside of the entablature

    # Back wall behind the arcade, with clerestory windows and a lit doorway.
    out.append(f'<rect x="{X0}" y="{ent_y}" width="{W-X0}" height="{floor-ent_y}" fill="{DEEP}"/>')
    for wx in range(X0 + 90, W, 168):
        out.append(f'<rect x="{wx}" y="{spring+36}" width="50" height="72" rx="5" '
                   f'fill="{SAND}" opacity="{rng.uniform(.16,.36):.2f}"/>')
    dx = 1190
    out.append(f'<path d="M{dx} {floor} V{floor-142} a44 44 0 0 1 88 0 V{floor} Z" fill="{SAND}" opacity="0.5"/>')
    out.append(f'<rect x="{dx+42}" y="{floor-142}" width="4" height="142" fill="{DEEP}" opacity="0.6"/>')

    # Floor, in perspective toward the doorway.
    out.append(f'<rect y="{floor}" width="{W}" height="{H-floor}" fill="{NEAR}"/>')
    vp_x, vp_y = dx + 44, spring + 60
    for fx in range(-240, W + 480, 108):
        out.append(f'<path d="M{fx} {H} L{vp_x} {vp_y}" stroke="{MID}" stroke-width="2" opacity="0.45"/>')
    yy, stepsz = floor + 9, 11
    while yy < H:
        out.append(f'<path d="M0 {yy:.0f} H{W}" stroke="{MID}" stroke-width="2" opacity="0.4"/>')
        stepsz *= 1.45
        yy += stepsz

    # Steps up to the colonnade.
    for i, (sy, ins) in enumerate([(floor, 0), (floor - 12, 40), (floor - 24, 80)]):
        out.append(f'<rect x="{X0-60+ins}" y="{sy-12}" width="{W-X0+60-ins}" height="14" '
                   f'fill="{MID if i % 2 else BRAND}"/>')

    # Spandrel wall: a rectangle between two columns with a semicircular
    # opening bitten out of its underside. sweep-flag 0 makes the arc bulge up.
    def spandrel(xl, xr, fill):
        r = (xr - xl) / 2
        return (f'<path d="M{xl:.0f} {spring} L{xl:.0f} {ent_y} L{xr:.0f} {ent_y} '
                f'L{xr:.0f} {spring} A{r:.0f} {r:.0f} 0 0 0 {xl:.0f} {spring} Z" fill="{fill}"/>')

    def column(x, fill):
        p = []
        top = spring
        p.append(f'<rect x="{x-10}" y="{plinth-18}" width="{CW+20}" height="18" fill="{fill}"/>')
        p.append(f'<rect x="{x-6}" y="{plinth-27}" width="{CW+12}" height="10" fill="{fill}"/>')
        p.append(f'<rect x="{x}" y="{top}" width="{CW}" height="{plinth-top-24}" fill="{fill}"/>')
        for k in range(1, 4):
            lx = x + CW * k / 4
            p.append(f'<path d="M{lx:.0f} {top+20} V{plinth-32}" stroke="{BG}" stroke-width="2" opacity="0.22"/>')
        p.append(f'<rect x="{x-8}" y="{top}" width="{CW+16}" height="12" fill="{fill}"/>')
        p.append(f'<rect x="{x-12}" y="{top-11}" width="{CW+24}" height="11" fill="{fill}"/>')
        return p

    def lantern(x, y):
        return [
            f'<path d="M{x} {y-54} V{y-18}" stroke="{MID}" stroke-width="3"/>',
            f'<rect x="{x-16}" y="{y-22}" width="32" height="7" rx="2" fill="{MID}"/>',
            f'<path d="M{x-13} {y-15} h26 l-5 36 h-16 Z" fill="{lit(rng, .22)}" opacity="0.9"/>',
            f'<circle cx="{x}" cy="{y+6}" r="40" fill="url(#lamp)"/>',
        ]

    # Arches first, then columns in front of them.
    for i in range(n_cols - 1):
        xl = X0 + i * SPAN + CW
        xr = X0 + (i + 1) * SPAN
        fill = FAR if i % 2 == 0 else BRAND
        out.append(spandrel(xl, xr, fill))
        # Keystone at the crown.
        mid = (xl + xr) / 2
        out.append(f'<rect x="{mid-14:.0f}" y="{crown-16:.0f}" width="28" height="34" rx="3" fill="{fill}"/>')
        out.append(f'<rect x="{mid-17:.0f}" y="{crown-22:.0f}" width="34" height="10" rx="2" fill="{fill}"/>')

    for i in range(n_cols):
        out += column(X0 + i * SPAN, FAR if i % 2 == 0 else BRAND)

    # Entablature and cornice.
    out.append(f'<rect x="{X0-60}" y="{ent_y-24}" width="{W-X0+60}" height="24" fill="{MID}"/>')
    out.append(f'<rect x="{X0-60}" y="{ent_y-36}" width="{W-X0+60}" height="13" fill="{BRAND}"/>')
    for dxx in range(X0 - 40, W, 46):
        out.append(f'<rect x="{dxx}" y="{ent_y-50}" width="22" height="15" fill="{MID}"/>')

    # Lanterns hung in the openings.
    for i in range(n_cols - 1):
        mid = X0 + i * SPAN + CW + (SPAN - CW) / 2
        if mid < W + 30:
            out += lantern(int(mid), int(crown + 108))

    # Planters between alternate columns.
    for i in range(0, n_cols, 2):
        px = X0 + i * SPAN + CW + 52
        if px > W:
            continue
        out.append(f'<path d="M{px-24} {plinth-12} h48 l-7 32 h-34 Z" fill="{MID}"/>')
        for dxx, dyy, r in ((0, -32, 21), (-15, -21, 14), (15, -23, 15)):
            out.append(f'<circle cx="{px+dxx}" cy="{plinth-12+dyy}" r="{r}" fill="{BRAND}"/>')

    return head(0.88, 0.7) + "  " + "\n  ".join(out) + "\n</svg>\n"


# ═══════════════════════════════════════════════════════════ contact
def build_contact():
    rng = random.Random(4417)
    out = []
    out.append(f'<rect x="380" width="{W-380}" height="{H}" fill="{DEEP}"/>')

    # River.
    out.append(f'<path d="M380 760 C620 700 700 560 900 520 C1100 480 1180 330 1330 250 L1600 120 L1600 0 L1600 0" '
               f'stroke="{BRAND}" stroke-width="58" fill="none" opacity="0.55" stroke-linecap="round"/>')
    out.append(f'<path d="M380 760 C620 700 700 560 900 520 C1100 480 1180 330 1330 250 L1600 120" '
               f'stroke="{FAR}" stroke-width="5" fill="none" opacity="0.3"/>')

    # Parks.
    for px, py, rx2, ry2 in ((560, 250, 92, 66), (1420, 620, 116, 78), (860, 760, 78, 52)):
        out.append(f'<ellipse cx="{px}" cy="{py}" rx="{rx2}" ry="{ry2}" fill="{FAR}" opacity="0.3"/>')
        for _ in range(7):
            out.append(f'<circle cx="{px+rng.randint(-rx2+18,rx2-18)}" cy="{py+rng.randint(-ry2+14,ry2-14)}" '
                       f'r="{rng.randint(7,13)}" fill="{FAR}" opacity="0.5"/>')

    # Road network: minor lanes, then arterials on top.
    for i in range(12):
        y = 48 + i * 74
        out.append(f'<path d="M400 {y} H{W}" stroke="{MID}" stroke-width="7" opacity="0.75"/>')
    for i in range(14):
        x = 430 + i * 88
        out.append(f'<path d="M{x} 0 V{H}" stroke="{MID}" stroke-width="7" opacity="0.6"/>')
    for y in (196, 530, 790):
        out.append(f'<path d="M400 {y} H{W}" stroke="{NEAR}" stroke-width="26" opacity="1"/>')
        out.append(f'<path d="M400 {y} H{W}" stroke="{MID}" stroke-width="22" opacity="1"/>')
    for x in (700, 1090, 1470):
        out.append(f'<path d="M{x} 0 V{H}" stroke="{NEAR}" stroke-width="26"/>')
        out.append(f'<path d="M{x} 0 V{H}" stroke="{MID}" stroke-width="22"/>')

    # Roundabout at a junction.
    out.append(f'<circle cx="1090" cy="530" r="46" fill="none" stroke="{MID}" stroke-width="22"/>')
    out.append(f'<circle cx="1090" cy="530" r="26" fill="{FAR}" opacity="0.45"/>')

    # City blocks.
    for _ in range(46):
        bx = rng.randint(410, W - 90)
        by = rng.randint(30, H - 90)
        out.append(f'<rect x="{bx}" y="{by}" width="{rng.randint(34,74)}" height="{rng.randint(30,60)}" '
                   f'rx="5" fill="{FAR}" opacity="{rng.uniform(.18,.5):.2f}"/>')

    # Dashed route running to the pin.
    out.append(f'<path d="M470 830 L700 790 L700 530 L1090 530 L1090 300 L1200 300" '
               f'stroke="{ACC_L}" stroke-width="6" fill="none" stroke-dasharray="20 16" '
               f'stroke-linecap="round" opacity="0.85"/>')
    out.append(f'<circle cx="470" cy="830" r="12" fill="{ACC_L}" opacity="0.9"/>')

    # Secondary pins.
    def pin(x, y, s, fill, ring):
        return [
            f'<ellipse cx="{x}" cy="{y+14*s:.0f}" rx="{26*s:.0f}" ry="{8*s:.0f}" fill="{BG}" opacity="0.4"/>',
            f'<path d="M{x} {y} C{x-58*s:.0f} {y-68*s:.0f} {x-46*s:.0f} {y-140*s:.0f} {x} {y-140*s:.0f} '
            f'C{x+46*s:.0f} {y-140*s:.0f} {x+58*s:.0f} {y-68*s:.0f} {x} {y} Z" fill="{fill}"/>',
            f'<circle cx="{x}" cy="{y-92*s:.0f}" r="{20*s:.0f}" fill="{ring}"/>',
        ]

    out += pin(760, 250, 0.5, FAR, DEEP)
    out += pin(1440, 700, 0.5, FAR, DEEP)
    out += pin(1200, 360, 1.25, ACCENT, BG)

    # Compass rose.
    ncx, ncy = 1500, 130
    out.append(f'<circle cx="{ncx}" cy="{ncy}" r="40" fill="none" stroke="{FAR}" stroke-width="3" opacity="0.6"/>')
    out.append(f'<path d="M{ncx} {ncy-34} L{ncx+11} {ncy} L{ncx} {ncy+34} L{ncx-11} {ncy} Z" fill="{SAND}" opacity="0.85"/>')
    out.append(f'<path d="M{ncx} {ncy} L{ncx+11} {ncy} L{ncx} {ncy+34} Z" fill="{BG}" opacity="0.35"/>')

    # Scale bar.
    out.append(f'<rect x="1420" y="840" width="60" height="7" fill="{SAND}" opacity="0.7"/>')
    out.append(f'<rect x="1480" y="840" width="60" height="7" fill="{FAR}" opacity="0.7"/>')
    return head(0.78, 0.35) + "  " + "\n  ".join(out) + "\n</svg>\n"


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, builder in (
        ("home", build_home),
        ("services", build_services),
        ("about", build_about),
        ("contact", build_contact),
    ):
        path = os.path.join(OUT, f"{name}.svg")
        with open(path, "w") as fh:
            fh.write(builder())
        print(f"  {name}.svg  {os.path.getsize(path):>7,} bytes")
