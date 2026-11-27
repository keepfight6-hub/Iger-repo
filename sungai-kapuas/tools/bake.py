"""Panggang tekstur peta relief Kalimantan–Jawa dari Natural Earth 1:10 jt (domain publik).
Pakai: python3 -I tools/bake.py <folder-data-geojson> <folder-keluaran>
Ketinggian gunung = perkiraan (punggung & gunung api dari koordinat), garis pantai & sungai = data asli."""
import json, sys, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

DATA, OUT = sys.argv[1], sys.argv[2]
LON0, LON1, LAT0, LAT1 = 104.0, 120.0, -9.5, 7.5

# ---------------- data -----------------
def polys_in(path, box, pad=1.0):
    d = json.load(open(path)); out = []
    for f in d['features']:
        g = f['geometry']
        ps = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for p in ps:
            r = np.array(p[0])
            if r[:,0].max() < box[0]-pad or r[:,0].min() > box[1]+pad or r[:,1].max() < box[2]-pad or r[:,1].min() > box[3]+pad: continue
            out.append(p)
    return out

LAND = polys_in(DATA + '/ne_10m_land.geojson', (LON0, LON1, LAT0, LAT1))
RIV = json.load(open(DATA + '/ne_10m_rivers_lake_centerlines.geojson'))
rivers = {}
for f in RIV['features']:
    g = f['geometry']; parts = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
    pts = [c for l in parts for c in l]
    if all(LON0 < x < LON1 and LAT0 < y < LAT1 for x, y in pts[:1] + pts[-1:]):
        rivers.setdefault(f['properties']['name'], []).extend(parts)

def chain(parts):
    parts = [list(map(tuple, p)) for p in parts]
    line = parts.pop(0)
    while parts:
        best = None
        for i, p in enumerate(parts):
            for rev in (False, True):
                q = p[::-1] if rev else p
                for end in ('head', 'tail'):
                    a = line[-1] if end == 'tail' else line[0]
                    b = q[0] if end == 'tail' else q[-1]
                    dd = math.hypot(a[0]-b[0], a[1]-b[1])
                    if best is None or dd < best[0]: best = (dd, i, rev, end)
        dd, i, rev, end = best; q = parts.pop(i); q = q[::-1] if rev else q
        line = line + q[1:] if end == 'tail' else q[:-1] + line
    return line

KAPUAS = chain(rivers['Kapuas'])
if KAPUAS[0][0] < KAPUAS[-1][0]: KAPUAS = KAPUAS[::-1]          # hulu (timur) -> muara (barat)
def km(a, b):
    la = math.radians((a[1]+b[1])/2)
    return math.hypot((a[0]-b[0])*111.32*math.cos(la), (a[1]-b[1])*110.57)
print('Kapuas titik', len(KAPUAS), 'panjang data %.0f km' % sum(km(KAPUAS[i], KAPUAS[i+1]) for i in range(len(KAPUAS)-1)), KAPUAS[0], KAPUAS[-1])

# ---------------- noise -----------------
def h2(ix, iy, s):
    h = (ix * 374761393 + iy * 668265263 + s * 1442695041) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffffff) / float(0xffffff)
def vn(x, y, s):
    ix = np.floor(x).astype(np.int64); iy = np.floor(y).astype(np.int64)
    fx = x - ix; fy = y - iy; fx = fx*fx*(3-2*fx); fy = fy*fy*(3-2*fy)
    a = h2(ix, iy, s); b = h2(ix+1, iy, s); c = h2(ix, iy+1, s); d = h2(ix+1, iy+1, s)
    return (a + (b-a)*fx) + ((c + (d-c)*fx) - (a + (b-a)*fx))*fy
def fbm(x, y, f0, oct, s, ridged=False):
    tot = 0; amp = 1; norm = 0; f = f0
    for o in range(oct):
        a = .62*o + .3; ca, sa = math.cos(a), math.sin(a)
        n = vn((x*ca - y*sa)*f + o*17.3, (x*sa + y*ca)*f - o*9.1, s+o)
        if ridged: n = 1 - abs(2*n - 1); n = n*n
        tot = tot + n*amp; norm += amp; amp *= .5; f *= 2.03
    return tot / norm

# punggung gunung (titik lon,lat), tinggi m, lebar derajat  — perkiraan
PUNGGUNG = [
  ([(112.9,0.35),(113.6,0.55),(114.2,0.9),(114.7,1.3)], 1800, .32),     # Pegunungan Müller
  ([(110.9,-0.75),(111.8,-0.75),(112.7,-0.67),(113.5,-0.4)], 1900, .30), # Schwaner (Bukit Raya)
  ([(110.4,1.15),(111.3,1.3),(112.2,1.45),(113.2,1.7),(114.1,2.2),(114.8,2.9),(115.4,3.8)], 1500, .30),  # Kapuas Hulu / perbatasan
  ([(114.6,1.0),(115.3,1.8),(115.6,2.8)], 1200, .45),                    # dataran tinggi Apo Kayan
  ([(115.5,4.2),(116.0,5.0),(116.4,5.7),(116.6,6.3)], 1900, .24),        # Crocker
  ([(115.25,-3.9),(115.5,-3.0),(115.75,-2.2)], 1300, .20),               # Meratus
  ([(109.6,1.2),(110.0,0.6),(110.5,0.2)], 700, .25),                     # bukit Kalbar barat
  ([(116.8,1.5),(117.3,2.6)], 900, .3),
  ([(104.0,-4.0),(104.7,-5.0),(105.3,-5.8)], 1700, .22),                 # Bukit Barisan (Lampung)
  ([(119.55,-5.6),(119.75,-3.6),(119.95,-2.0),(120.0,0.5)], 2200, .30),  # Sulawesi barat
  ([(117.0,4.5),(117.8,5.2)], 700, .3),
]
GUNUNG = [(106.73,-6.72,2211),(106.98,-6.78,3019),(107.6,-6.77,2084),(107.73,-7.32,2665),(108.4,-6.89,3078),
  (109.21,-7.24,3428),(109.99,-7.3,3136),(110.07,-7.38,3371),(110.44,-7.45,3145),(110.44,-7.54,2930),(111.19,-7.63,3265),
  (112.31,-7.93,1731),(112.59,-7.76,3339),(112.92,-8.11,3676),(112.95,-7.94,2329),(113.57,-7.97,3088),(114.04,-8.12,3332),
  (114.24,-8.06,2769),(115.51,-8.34,3031),(115.38,-8.24,1717),(116.46,-8.41,3726),(105.42,-6.1,800),(118.0,-8.3,2850),
  (116.55,6.07,4095),(112.68,-0.67,2278),(119.94,-5.3,2830),(120.0,-3.4,3478),(117.0,-8.6,1600),(118.6,-8.5,1900)]
# paparan Sunda (laut dangkal) — poligon perkiraan
PAPARAN = [(103,8.5),(117.3,8.5),(117.6,5.6),(118.8,4.4),(118.4,2.0),(117.9,0.6),(117.5,-1.0),(116.8,-2.6),(116.7,-4.0),
  (116.9,-5.2),(116.1,-6.9),(115.4,-7.7),(114.5,-7.95),(114.35,-8.35),(113,-8.5),(111,-8.35),(109,-7.95),(107,-7.65),
  (105.8,-7.05),(105.1,-6.9),(104.5,-6.05),(103.8,-5.9),(103,-5)]
# Danau Sentarum: gumpalan danau rawa perkiraan (tidak ada di data 1:10 jt)
DANAU = [(112.05,0.86,.075,.045),(112.17,0.92,.065,.04),(112.29,0.85,.085,.05),(112.12,0.77,.06,.032),(112.37,0.93,.05,.032),
  (111.98,0.79,.045,.028),(112.22,0.99,.04,.026),(112.44,0.86,.04,.03),(111.93,0.86,.03,.022),(112.31,0.76,.035,.022)]

def seg_dist(lon, lat, pts):
    d = np.full(lon.shape, 1e9)
    for (x0,y0),(x1,y1) in zip(pts[:-1], pts[1:]):
        vx, vy = x1-x0, y1-y0; L = vx*vx+vy*vy
        t = np.clip(((lon-x0)*vx + (lat-y0)*vy)/L, 0, 1)
        d = np.minimum(d, np.hypot(lon-(x0+t*vx), lat-(y0+t*vy)))
    return d
def seg_dist_t(lon, lat, pts):
    """jarak + posisi sepanjang garis (0..1) — untuk tinggi punggung yang naik-turun"""
    d = np.full(lon.shape, 1e9); u = np.zeros(lon.shape); n = len(pts)-1
    for k,((x0,y0),(x1,y1)) in enumerate(zip(pts[:-1], pts[1:])):
        vx, vy = x1-x0, y1-y0; L = vx*vx+vy*vy
        t = np.clip(((lon-x0)*vx + (lat-y0)*vy)/L, 0, 1)
        dd = np.hypot(lon-(x0+t*vx), lat-(y0+t*vy)); m = dd < d
        d = np.where(m, dd, d); u = np.where(m, (k+t)/n, u)
    return d, u

def raster(polys, box, W, H, ss=2):
    lon0, lon1, lat0, lat1 = box
    im = Image.new('L', (W*ss, H*ss), 0); dr = ImageDraw.Draw(im)
    tx = lambda r: [((x-lon0)/(lon1-lon0)*W*ss, (lat1-y)/(lat1-lat0)*H*ss) for x, y in r]
    for p in polys:
        dr.polygon(tx(p[0]), fill=255)
        for hole in p[1:]: dr.polygon(tx(hole), fill=0)
    return np.asarray(im.resize((W, H), Image.BOX), dtype=np.float32)/255

def hexc(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)], np.float32)/255
def ramp(v, stops):
    xs = np.array([s[0] for s in stops], np.float32); cs = np.stack([hexc(s[1]) for s in stops])
    return np.stack([np.interp(v, xs, cs[:,i]) for i in range(3)], -1)
def mix(a, b, k): k = np.clip(k,0,1)[...,None]; return a*(1-k) + b*k

def bake(box, ppd, name, want_height=False):
    lon0, lon1, lat0, lat1 = box
    W, H = int(round((lon1-lon0)*ppd)), int(round((lat1-lat0)*ppd))
    print(name, W, H)
    lon = lon0 + (np.arange(W)+.5)/ppd; lat = lat1 - (np.arange(H)+.5)/ppd
    lon, lat = np.meshgrid(lon, lat)
    land = raster(LAND, box, W, H)
    pkm = 111.0/ppd
    dland = ndi.distance_transform_edt(land > .5) * pkm      # km ke pantai (di darat)
    dsea = ndi.distance_transform_edt(land <= .5) * pkm      # km ke pantai (di laut)
    # ---- tinggi darat
    hgt = 6 + 30*(1-np.exp(-dland/70)) + 140*fbm(lon, lat, 1.5, 5, 3)*(1-np.exp(-dland/35))
    hills = fbm(lon, lat, 6, 7, 11, ridged=True)
    for pts, Hm, w in PUNGGUNG:
        d, u = seg_dist_t(lon, lat, pts)
        prof = .7 + .3*np.sin(u*math.pi*2.3 + Hm*.01)
        k = np.exp(-(d/w)**2)
        hgt += Hm*k*prof*(.45 + .75*hills)
    for x, y, Hm in GUNUNG:
        d = np.hypot(lon-x, lat-y)
        cone = np.exp(-d/.1)*.62 + np.exp(-(d/.28)**2)*.38
        hgt += Hm*cone*(.9 + .2*fbm(lon, lat, 30, 3, 5)) - Hm*.08*np.exp(-(d/.012)**2)
    hgt += 260*fbm(lon, lat, 14, 6, 21, ridged=True)*np.clip(hgt/900, 0, 1)
    # lembah sungai
    rivd = np.full(lon.shape, 1e9)
    for nm, parts in rivers.items():
        for p in parts:
            p = [(a, b) for a, b in p]
            if len(p) > 1: rivd = np.minimum(rivd, seg_dist(lon, lat, p))
    kd = seg_dist(lon, lat, KAPUAS)
    valley = np.exp(-(kd/.38)**2)*.88 + np.exp(-(rivd/.12)**2)*.5
    hgt = hgt*(1-np.clip(valley, 0, .93)) + 4
    # danau
    lake = np.zeros(lon.shape, np.float32)
    for x, y, a, b in DANAU:
        r = np.hypot((lon-x)/a, (lat-y)/b) + .55*(fbm(lon, lat, 30, 4, 7)-.5)
        lake = np.maximum(lake, np.clip((1-r)*6, 0, 1))
    hgt = hgt*(1-lake*.9)
    hgt = hgt*land
    # ---- kedalaman laut
    shelf = raster([[PAPARAN]], box, W, H, 1) > .5
    dout = ndi.distance_transform_edt(~shelf)*pkm
    din = ndi.distance_transform_edt(shelf)*pkm
    depth = 12 + 55*(1-np.exp(-dsea/45)) + 18*fbm(lon, lat, 3, 4, 31)
    depth = np.where(shelf, depth + 40*np.exp(-din/25), 130 + 4600*(1-np.exp(-dout/110)) + 600*fbm(lon, lat, 2, 4, 41))
    depth = np.where(lat < -8.7, depth + 1200*np.clip((-8.7-lat)/.6, 0, 1), depth)
    depth = depth*(1 - np.exp(-dsea/3))   # mulus ke pantai
    # ---- warna laut
    sea = ramp(depth, [(0,'#6ccdc6'),(20,'#4fb7bd'),(55,'#2e95ab'),(100,'#1f7f9c'),(500,'#165c87'),(1800,'#0f3c66'),(5000,'#0a2547')])
    sea *= (.94 + .1*fbm(lon, lat, 8, 4, 51))[...,None]
    foam = hexc('#d9f4ee')
    for r, a in ((4.5, .16), (10, .11), (18, .07)):
        sea = mix(sea, foam[None,None,:], a*np.exp(-((dsea-r)/(.55*ppd**0 + pkm*.9))**2))
    sea = mix(sea, foam[None,None,:], .45*np.exp(-dsea/(pkm*1.2+.4)))
    # ---- warna darat
    n1 = fbm(lon, lat, 9, 5, 61); n2 = fbm(lon, lat, 22, 4, 71); n3 = fbm(lon, lat, 3.5, 4, 81)
    forest = mix(np.broadcast_to(hexc('#2b5226'), lon.shape+(3,)).copy(), np.broadcast_to(hexc('#41702d'), lon.shape+(3,)), n1*1.3-.15)
    java = (lat < -5.7) & (lon < 115.0) & (lon > 105.0)
    low = np.clip(1 - hgt/350, 0, 1)
    kebun = np.clip((n3-.55)*5, 0, 1)*low*np.where(java, 1.0, .55)
    col = mix(forest, hexc('#8a9450')[None,None,:], kebun*.75)
    sawah = np.clip((n2-.38)*3, 0, 1)*low*java
    col = mix(col, hexc('#9aa65a')[None,None,:], sawah*.8)
    swamp = np.exp(-dland/25)*(hgt < 40)*(~java)
    col = mix(col, hexc('#4b6b33')[None,None,:], swamp*.6)
    col = mix(col, hexc('#6d6447')[None,None,:], np.clip((hgt-1300)/900, 0, 1)*.85)
    col = mix(col, hexc('#7d7260')[None,None,:], np.clip((hgt-2600)/900, 0, 1)*.7)
    col = mix(col, hexc('#d8c99a')[None,None,:], np.exp(-dland/(pkm*.8+.3))*.55*java + np.exp(-dland/(pkm*.8+.3))*.25)
    # hillshade, matahari sore dari barat daya
    EX = 5.0
    gy, gx = np.gradient(hgt*EX, pkm*1000)
    nx, ny, nz = -gx, gy, np.ones_like(gx)  # baris naik = selatan; dy positif ke utara
    nl = np.sqrt(nx*nx+ny*ny+nz*nz)
    el = math.radians(38); az = math.radians(225)  # dari barat daya
    L = (math.sin(az)*math.cos(el), math.cos(az)*math.cos(el), math.sin(el))
    sh = (nx*L[0] + ny*L[1] + nz*L[2])/nl
    rel = np.clip(sh/L[2], 0, 2)
    shade = 1 + (rel-1)*2.2
    # bayangan jatuh
    hs = hgt*EX; cast = np.zeros_like(hs); step = max(1, int(ppd/60))
    dxp, dyp = -L[0], L[1]   # arah ke matahari dalam piksel (kolom, baris)
    for k in range(1, 40):
        sx, sy = int(round(-dxp*k*step*-1)), int(round(dyp*k*step))
        sx = int(round(L[0]*k*step)); sy = int(round(-L[1]*k*step))
        sh2 = np.roll(np.roll(hs, -sy, 0), -sx, 1)
        cast = np.maximum(cast, (sh2 - hs - k*step*pkm*1000*math.tan(el)) )
    shadow = np.clip(cast/600, 0, 1)
    shade = shade*(1 - .45*shadow)
    ao = np.clip((ndi.gaussian_filter(hgt, 6) - hgt)/400, -1, 1)
    shade = shade*(1 - .25*np.clip(ao, 0, 1)) 
    col = col*np.clip(shade, .35, 1.38)[...,None]
    # sungai & danau
    water = hexc('#3f8f96')
    col = mix(col, water[None,None,:], np.exp(-(rivd/(1.1/ppd + .006))**2)*.75)
    col = mix(col, hexc('#5a8a7a')[None,None,:], np.exp(-(kd/(1.3/ppd + .009))**2)*.85)
    col = mix(col, hexc('#4a8f8c')[None,None,:], lake*.9)
    out = mix(sea, col, land)
    img = (np.clip(out, 0, 1)*255).astype(np.uint8)
    Image.fromarray(img).save(f'{OUT}/{name}.jpg', quality=90, optimize=True)
    if want_height:
        hh = np.clip(hgt/4500, 0, 1)*65535
        hh = ndi.gaussian_filter(hh, 1.0)
        im = Image.fromarray(np.stack([(hh//256).astype(np.uint8), (hh % 256).astype(np.uint8), (land*255).astype(np.uint8)], -1))
        im.resize((W//2, H//2), Image.BILINEAR).save(f'{OUT}/tinggi.png')
    return W, H

BASE = (LON0, LON1, LAT0, LAT1)
DET = (108.7, 114.9, -1.7, 2.0)
ONLY_DATA = '--data' in sys.argv
if not ONLY_DATA:
    bake(BASE, 128, 'peta', want_height=True)
    bake(DET, 300, 'detail')

# ---------------- bola dunia -----------------
if not ONLY_DATA:
  GW, GH = 2048, 1024
  land_w = polys_in(DATA + '/ne_50m_land.geojson', (-180, 180, -90, 90), 0)
  m = raster(land_w, (-180, 180, -90, 90), GW, GH)
  lon = -180 + (np.arange(GW)+.5)*360/GW; lat = 90 - (np.arange(GH)+.5)*180/GH
  lon, lat = np.meshgrid(lon, lat)
  ds = ndi.distance_transform_edt(m <= .5)*(40000/GW)
  alat = np.abs(lat)
  landc = ramp(alat, [(0,'#2f5a2a'),(15,'#4a7034'),(24,'#b3a06a'),(32,'#9a9a62'),(50,'#56703c'),(62,'#6e7a5a'),(72,'#c9cfc9'),(90,'#eef2f2')])
  landc *= (.88 + .24*fbm(lon, lat, .15, 5, 91))[...,None]
  seac = ramp(ds, [(0,'#3aa5b5'),(60,'#1f7f9c'),(300,'#123f6b'),(2000,'#0b2a52')])
  g = mix(seac, landc, m)
  Image.fromarray((np.clip(g,0,1)*255).astype(np.uint8)).save(f'{OUT}/bumi.jpg', quality=88)

# ---------------- data js -----------------
def simplify(pts, eps):
    # Douglas-Peucker
    if len(pts) < 3: return pts
    a, b = np.array(pts[0]), np.array(pts[-1]); P = np.array(pts)
    v = b - a; L = np.hypot(*v) or 1e-9
    d = np.abs(v[0]*(P[:,1]-a[1]) - v[1]*(P[:,0]-a[0]))/L; i = int(np.argmax(d))
    if d[i] > eps: return simplify(pts[:i+1], eps)[:-1] + simplify(pts[i:], eps)
    return [pts[0], pts[-1]]
other = {}
for nm, parts in rivers.items():
    if nm == 'Kapuas': continue
    other[nm] = [[[round(x,3), round(y,3)] for x, y in simplify([tuple(c) for c in p], .01)] for p in parts]
js = 'window.PETA=' + json.dumps({
  'box': BASE, 'det': DET, 'kapuas': [[round(x,4), round(y,4)] for x, y in KAPUAS],
  'sungai': other, 'danau': DANAU}, separators=(',', ':')) + ';\n'
open(f'{OUT}/data.js', 'w').write(js)
print('selesai')
