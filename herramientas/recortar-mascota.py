# Recorta la hoja de evolución de una mascota (5 figuras en fila, fondo liso) en img/mascotas/<id>-1..5.webp
# con fondo transparente y sombra suave.
# Uso: python3 herramientas/recortar-mascota.py hoja.png <id> img/mascotas   (requiere numpy, pillow y scipy)
#
# Cómo separa las figuras: quita el fondo conectado con las orillas (el blanco del personaje queda adentro),
# convierte la sombra gris en negro translúcido, y agrupa las piezas conectadas (personaje + su objeto:
# barra, cuerda, tapete…) en 5 grupos según su posición horizontal. Así funciona aunque los objetos de
# figuras vecinas se encimen por columnas.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

def recortar(src, mid, outdir, n=5):
    im=Image.open(src).convert('RGB'); a=np.asarray(im).astype(np.float32); H,W,_=a.shape
    borde=np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3),a[:,:6].reshape(-1,3),a[:,-6:].reshape(-1,3)])
    bg=np.median(borde,axis=0); bgl=bg.mean()
    dist=np.sqrt(((a-bg)**2).sum(axis=2))
    lum=a.mean(axis=2); sat=a.max(axis=2)-a.min(axis=2)
    # 1) fondo: casi igual al fondo y conectado con la orilla
    # tono: si el fondo es azulado, un blanco cálido (pelo de panda) no se confunde con el fondo
    azul=a[:,:,2]-a[:,:,0]; bg_azul=bg[2]-bg[0]
    tono_fondo=(azul>bg_azul*0.55) if bg_azul>8 else np.ones_like(dist,bool)
    lab,_=ndi.label((dist<16)&tono_fondo)
    orilla=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    fondo=np.isin(lab,list(orilla))
    # fondo encerrado (dentro de una cuerda, un brazo en jarra…): huecos grandes del color exacto del fondo
    lab_e,ne=ndi.label((dist<11)&tono_fondo&~fondo)
    if ne:
        ar_e=ndi.sum(np.ones_like(dist),lab_e,index=np.arange(1,ne+1))
        grandes=[i+1 for i in range(ne) if ar_e[i]>H*W*0.0006]
        if grandes: fondo|=np.isin(lab_e,grandes)
    # 2) sombra: tono del fondo un poco más oscuro, pegado al fondo
    somb_c=(sat<22)&(lum>bgl-75)&(lum<=bgl+2)&(dist<70)&~fondo
    if bg_azul>8: somb_c&=(azul>bg_azul*0.4)   # la sombra sobre fondo azulado conserva el tinte; el pelo blanco es cálido
    lab2,_=ndi.label(somb_c|fondo); conect=set(np.unique(lab2[fondo]))-{0}
    sombra=np.isin(lab2,list(conect))&somb_c
    figura=ndi.binary_opening(~(fondo|sombra),iterations=1)
    # 3) separaciones: las n-1 columnas más vacías de la imagen, a más de 0.55 de figura entre sí.
    #    Cada pieza conectada (personaje + su objeto) va al tramo donde cae su centro; una pieza demasiado
    #    ancha (barra o cuerda que toca a la vecina) se corta en esa separación.
    slot=W/n
    dens=ndi.uniform_filter1d(figura.sum(axis=0).astype(np.float32),15)
    cortes=[]
    for c in np.argsort(dens,kind='stable'):
        if c<0.5*slot or c>W-0.5*slot: continue
        if all(abs(int(c)-x)>=0.55*slot for x in cortes): cortes.append(int(c))
        if len(cortes)==n-1: break
    cortes.sort(); lim=[0]+cortes+[W]
    lab3,nl=ndi.label(figura)
    for k,sl in enumerate(ndi.find_objects(lab3),1):
        if sl is None or (sl[1].stop-sl[1].start)<1.5*slot: continue
        for c in cortes:
            if sl[1].start<c<sl[1].stop: figura[:,c]&=~(lab3[:,c]==k)
    lab3,nl=ndi.label(figura)
    areas=ndi.sum(figura,lab3,index=np.arange(1,nl+1))
    cx=ndi.center_of_mass(figura,lab3,index=np.arange(1,nl+1))
    total=areas.sum(); piezas=[(i+1,areas[i],cx[i][1]) for i in range(nl) if areas[i]>=total*0.002]
    asign=[max(0,min(n-1,int(np.searchsorted(lim,x)-1))) for _,_,x in piezas]
    grupos=[[i for (i,_,_),g in zip(piezas,asign) if g==k] for k in range(n)]
    # en cada grupo, se descartan pedacitos sueltos (menos del 4% de su pieza principal): restos de la vecina
    ar_d={i:ar for i,ar,_ in piezas}
    sls=ndi.find_objects(lab3)
    # un pedazo chico que nació de un corte (toca la columna del corte) pertenece a la figura del otro lado
    for g in range(n):
        if not grupos[g]: continue
        top=max(ar_d[j] for j in grupos[g])
        for i in list(grupos[g]):
            xs=sls[i-1][1]
            if ar_d[i]>=0.15*top: continue
            if g>0 and abs(xs.start-(cortes[g-1]+1))<=2: grupos[g].remove(i); grupos[g-1].append(i)
            elif g<n-1 and abs(xs.stop-cortes[g])<=2: grupos[g].remove(i); grupos[g+1].append(i)
    def conservar(g):
        top=max(g,key=lambda j:ar_d[j]); x0,x1=sls[top-1][1].start,sls[top-1][1].stop
        out=[]
        for i in g:
            xs=sls[i-1][1]; dentro=xs.stop>x0 and xs.start<x1
            if i==top or (ar_d[i]>=0.04*ar_d[top] and (dentro or ar_d[i]>=0.15*ar_d[top])): out.append(i)
        return out
    grupos=[conservar(g) for g in grupos]
    assert all(grupos), (src,'grupo vacío')
    # 4) salida RGBA
    alpha=ndi.gaussian_filter(figura.astype(np.float32),0.7)
    sh_a=np.clip((bgl-lum)/bgl*2.2,0,0.45)*sombra
    rgb=a.copy(); rgb[sombra]=0
    rgba=np.dstack([np.clip(rgb,0,255).astype(np.uint8),(np.maximum(alpha,sh_a)*255).astype(np.uint8)])
    cajas=[]
    for k,ids in enumerate(grupos,1):
        m=np.isin(lab3,ids)
        ys,xs=np.where(m); y0,y1,xa,xb=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        # cabeza: rellena "mordidas" donde el blanco del personaje toca el fondo (45% superior, solo en su caja)
        r=max(8,int(0.07*(xb-xa))); yy,xx=np.ogrid[-r:r+1,-r:r+1]; disco=(xx*xx+yy*yy)<=r*r
        pad0=r+2; Y0,Y1,X0,X1=max(0,y0-pad0),min(H,y1+pad0),max(0,xa-pad0),min(W,xb+pad0)
        sub=m[Y0:Y1,X0:X1]; cerr=ndi.binary_fill_holes(ndi.binary_closing(sub,structure=disco))
        sup=np.zeros_like(sub); sup[:int((y0-Y0)+0.45*(y1-y0)),:]=True
        add=cerr&~sub&sup&~fondo[Y0:Y1,X0:X1]
        sub=sub|add; m[Y0:Y1,X0:X1]=sub
        loc=rgba[Y0:Y1,X0:X1]; loc[add,3]=255
        yb=min(H,y1+int(0.06*(y1-y0))); pad=int(0.05*max(xb-xa,yb-y0))
        box=(max(0,xa-pad),max(0,y0-pad),min(W,xb+pad),min(H,yb+pad))
        c=rgba[box[1]:box[3],box[0]:box[2]].copy()
        otro=figura[box[1]:box[3],box[0]:box[2]]&~m[box[1]:box[3],box[0]:box[2]]
        c[otro,3]=0
        # sombra de figuras vecinas: solo se queda la que está debajo de esta figura
        sx=sombra[box[1]:box[3],box[0]:box[2]].copy(); cols=m[box[1]:box[3],box[0]:box[2]].any(axis=0)
        sx[:,cols]=False; c[sx,3]=0
        ci=Image.fromarray(c,'RGBA'); s=max(ci.size); sq=Image.new('RGBA',(s,s),(0,0,0,0))
        sq.paste(ci,((s-ci.width)//2, s-ci.height)); sq=sq.resize((512,512),Image.LANCZOS)
        sq.save(f'{outdir}/{mid}-{k}.webp',quality=88,method=6)
        cajas.append([int(xa),int(xb)])
    return cajas

if __name__=='__main__':
    print(recortar(sys.argv[1],sys.argv[2],sys.argv[3]))
