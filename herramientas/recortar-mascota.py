# Recorta la hoja de evolución de una mascota (5 figuras en fila, fondo liso) en img/mascotas/<id>-1..5.webp con fondo transparente.
# Uso: python3 herramientas/recortar-mascota.py hoja.png <id> img/mascotas   (requiere numpy, pillow y scipy)
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
def recortar(src, mid, outdir, n=5):
    im=Image.open(src).convert('RGB'); a=np.asarray(im).astype(np.float32); H,W,_=a.shape
    borde=np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3),a[:,:6].reshape(-1,3),a[:,-6:].reshape(-1,3)])
    bg=np.median(borde,axis=0); bgl=bg.mean()
    dist=np.sqrt(((a-bg)**2).sum(axis=2))
    lum=a.mean(axis=2); sat=a.max(axis=2)-a.min(axis=2)
    # 1) fondo = píxeles casi iguales al fondo y CONECTADOS con la orilla (el blanco del panda queda adentro)
    cand=dist<16
    lab,_=ndi.label(cand); orilla=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fondo=np.isin(lab,list(orilla))
    # 2) sombra = gris claro sin color, pegado al fondo (crece desde el fondo)
    somb_c=(sat<14)&(lum>bgl-70)&(lum<=bgl+2)&~fondo
    lab2,_=ndi.label(somb_c|fondo); conect=set(np.unique(lab2[fondo]))-{0}
    sombra=np.isin(lab2,list(conect))&somb_c
    figura=~(fondo|sombra)
    figura=ndi.binary_opening(figura,iterations=1)
    col=figura.sum(axis=0)>3
    segs=[];ini=None
    for x in range(W):
        if col[x] and ini is None: ini=x
        if not col[x] and ini is not None:
            if x-ini>8: segs.append([ini,x])
            ini=None
    if ini is not None: segs.append([ini,W])
    # quedarse con los n segmentos más anchos y unir fragmentos chicos al más cercano
    segs.sort(key=lambda s:s[1]-s[0],reverse=True); grandes=sorted(segs[:n]); 
    assert len(grandes)==n,(src,segs)
    # salida RGBA: figura opaca (borde suavizado), sombra como negro translúcido
    alpha=np.zeros((H,W),np.float32); alpha[figura]=1
    alpha=ndi.gaussian_filter(alpha,0.7)
    sh_a=np.clip((bgl-lum)/bgl*2.2,0,0.45)*sombra
    rgb=a.copy(); rgb[sombra]=0
    A=np.maximum(alpha,sh_a)
    rgba=np.dstack([np.clip(rgb,0,255).astype(np.uint8),(A*255).astype(np.uint8)])
    lab3,nl=ndi.label(figura)
    for k,(x0,x1) in enumerate(grandes,1):
        # componente principal de esta figura: el más grande cuyo centro cae en el segmento
        sub=lab3[:,x0:x1]; ids,cnt=np.unique(sub[sub>0],return_counts=True)
        keep=set(ids[cnt>=max(cnt)*0.03])     # descarta pedazos sueltos de la figura vecina
        m=np.isin(lab3,list(keep)); m[:, :x0]=False; m[:, x1:]=False
        ys,xs=np.where(m); y0,y1,xa,xb=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        # cabeza: rellena "mordidas" donde el blanco del personaje toca el fondo (solo en el 45% superior)
        r=max(6,int(0.06*(xb-xa))); yy,xx=np.ogrid[-r:r+1,-r:r+1]; disco=(xx*xx+yy*yy)<=r*r
        cerr=ndi.binary_closing(m,structure=disco); cerr=ndi.binary_fill_holes(cerr)
        sup=np.zeros_like(m); sup[y0:int(y0+0.45*(y1-y0)),:]=True
        add=cerr&~m&sup; m=m|add; figura[add]=True; rgba[add,3]=255; rgba[add,:3]=a[add].astype(np.uint8)
        yb=min(H,y1+int(0.06*(y1-y0)))          # deja espacio para la sombra
        pad=int(0.05*max(xb-xa,yb-y0))
        box=(max(0,xa-pad),max(0,y0-pad),min(W,xb+pad),min(H,yb+pad))
        c=rgba[box[1]:box[3],box[0]:box[2]].copy()
        # borrar en el recorte lo que sea figura de otros componentes
        mm=m[box[1]:box[3],box[0]:box[2]]; otro=(figura[box[1]:box[3],box[0]:box[2]])&~mm
        c[otro,3]=0
        ci=Image.fromarray(c,'RGBA'); s=max(ci.size); sq=Image.new('RGBA',(s,s),(0,0,0,0))
        sq.paste(ci,((s-ci.width)//2, s-ci.height)); sq=sq.resize((512,512),Image.LANCZOS)
        sq.save(f'{outdir}/{mid}-{k}.webp',quality=88,method=6)
    return grandes
if __name__=='__main__':
    print(recortar(sys.argv[1],sys.argv[2],sys.argv[3]))
