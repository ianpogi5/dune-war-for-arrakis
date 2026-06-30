import re, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
import contourpy
SP='/tmp/claude-1000/-mnt-work-Projects-OSS-dune-war-for-arrakis/1b87ccf2-40b2-4469-91af-58e2e9e24e46/scratchpad'
src = open('src/engine/boardPositions.ts').read()
POS = {m[0]: (float(m[1]), float(m[2])) for m in re.findall(r'"([a-z0-9_]+)":\s*\[([0-9.]+),\s*([0-9.]+)\]', src)}
ids = list(POS)
im = np.asarray(Image.open('docs/images/dune-map.png').convert('RGB')).astype(float)
H,W=im.shape[:2]
lum = 0.299*im[...,0]+0.587*im[...,1]+0.114*im[...,2]
cost = np.clip(255-lum,0,255).astype(np.uint8)
markers = np.zeros((H,W), dtype=np.int16)
# dedicated label for the dark boundary lines, so no area absorbs the ridge network
LINE = len(ids)+1
markers[lum < 110] = LINE
for i,id in enumerate(ids, start=1):
    x,y=POS[id]; px,py=int(round(x*W)),int(round(y*H)); markers[py-2:py+3,px-2:px+3]=i
lab = ndimage.watershed_ift(cost, markers)

def dp(pts, eps):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; ab=(b[0]-a[0],b[1]-a[1]); L=(ab[0]**2+ab[1]**2)**.5 or 1
    dmax,idx=0,0
    for i in range(1,len(pts)-1):
        q=pts[i]; d=abs((q[0]-a[0])*ab[1]-(q[1]-a[1])*ab[0])/L
        if d>dmax: dmax,idx=d,i
    if dmax>eps:
        import sys; sys.setrecursionlimit(100000)
        return dp(pts[:idx+1],eps)[:-1]+dp(pts[idx:],eps)
    return [a,b]
def dp_closed(pts, eps):
    if pts[0]==pts[-1]: pts=pts[:-1]
    if len(pts)<4: return pts
    a=pts[0]
    far=max(range(len(pts)), key=lambda i:(pts[i][0]-a[0])**2+(pts[i][1]-a[1])**2)
    c1=pts[:far+1]; c2=pts[far:]+[pts[0]]
    return dp(c1,eps)[:-1]+dp(c2,eps)[:-1]

SHAPES={}
for i,id in enumerate(ids, start=1):
    mask=(lab==i).astype(float)
    if mask.sum()<50: continue
    gen=contourpy.contour_generator(z=mask)
    lines=gen.lines(0.5)
    if not lines: continue
    poly=max(lines, key=len)  # longest contour = outer boundary, (x,y) pixel coords
    poly=[(float(p[0]),float(p[1])) for p in poly]
    poly=dp_closed(poly, 2.2)
    if len(poly)>2 and poly[0]!=poly[-1]: poly.append(poly[0])
    SHAPES[id]=[[round(x/W,4),round(y/H,4)] for x,y in poly]

# stats
tot=sum(len(v) for v in SHAPES.values())
print('areas', len(SHAPES), 'total verts', tot, 'avg', round(tot/len(SHAPES),1), 'max', max(len(v) for v in SHAPES.values()))
json.dump(SHAPES, open(f'{SP}/shapes.json','w'))

# preview render
TERR={'desert':(227,194,129),'minor_erg':(239,220,162),'plateau':(189,123,63),'mountain':(111,90,64)}
board=open('src/engine/board.ts').read()
TER={m[0]:m[1] for m in re.findall(r'"([a-z0-9_]+)":\s*\{[^}]*terrain:\s*"([a-z_]+)"', board)}
prev=Image.new('RGB',(W,H),(243,226,189)); d=ImageDraw.Draw(prev)
for id,poly in SHAPES.items():
    pts=[(x*W,y*H) for x,y in poly]
    c=TERR.get(TER.get(id,''),(200,180,150))
    d.polygon(pts, fill=c, outline=(58,44,24))
prev.save(f'{SP}/preview.png'); print('saved preview.png')
