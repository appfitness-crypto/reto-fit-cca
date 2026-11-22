import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]
GT = float(sys.argv[3]) if len(sys.argv) > 3 else 6
def proc(f, piso=True):
    im = np.array(Image.open(f).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3]
    H, W = a.shape
    m = a > 110
    # 1) quitar motas sueltas
    lab, n = nd.label(m)
    if n:
        sz = nd.sum(m, lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool); keep[1:] = sz >= max(60, sz.max() * 0.002)
        m = keep[lab]
    m = nd.binary_fill_holes(m) | (m)  # cierra huecos pequeños de recorte
    # rellenar sólo huecos chicos (no espacios reales entre brazos)
    holes = nd.binary_fill_holes(m) & ~(a > 110)
    hl, hn = nd.label(holes)
    if hn:
        hs = nd.sum(holes, hl, range(1, hn + 1)); small = np.zeros(hn + 1, bool); small[1:] = hs < 40
        m = (a > 110) & m | small[hl]
    floor = np.zeros_like(m)
    if piso:
        lum = rgb.mean(-1); mx = rgb.max(-1); mn = rgb.min(-1)
        sat = (mx - mn) / (mx + 1)
        ys = np.where(m.any(1))[0]; y0, y1 = ys[0], ys[-1]
        band = np.zeros_like(m); band[int(y1 - (y1 - y0) * 0.22):, :] = True
        gl = nd.gaussian_filter(lum, 1.0); grad = np.hypot(nd.sobel(gl, 0), nd.sobel(gl, 1)) / 8
        cand = m & band & (lum > 130) & (sat < 0.18) & (grad < GT)
        # semillas: candidatos que tocan lo transparente
        loose = m & band & (lum > 130) & (sat < 0.18)
        rim = loose & nd.binary_dilation(~m, iterations=3)
        floor = nd.binary_propagation(rim, mask=cand | rim)
        # sólo si es una franja ancha y baja (un piso), no un tenis
        lab2, n2 = nd.label(floor)
        keepf = np.zeros(n2 + 1, bool)
        for i, sl in enumerate(nd.find_objects(lab2), 1):
            h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
            cnt = (lab2[sl] == i).sum()
            keepf[i] = cnt > 300 and w > 2.2 * h and w > W * 0.18
        floor = keepf[lab2]
    body = m & ~floor
    # 2) bordes: recorta 1 px el borde (halo) y suaviza el escalonado
    body = nd.binary_opening(body, iterations=1)
    lab, n = nd.label(body)
    if n:
        sz = nd.sum(body, lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sz >= max(60, sz.max() * 0.002); body = keep[lab]
    er = nd.binary_erosion(body, iterations=1)
    alpha = nd.gaussian_filter(er.astype(np.float32), 0.9)
    alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
    # 3) color: el anillo del borde toma el color del interior (sin halo blanco ni negro)
    core = nd.binary_erosion(body, iterations=3)
    if core.any():
        _, (iy, ix) = nd.distance_transform_edt(~core, return_indices=True)
        ring = ~core
        rgb2 = rgb.copy(); rgb2[ring] = rgb[iy[ring], ix[ring]]
        # mezcla suave para no perder detalle de pelo
        rgb = np.where(ring[..., None], rgb2 * 0.75 + rgb * 0.25, rgb)
    outa = alpha * 255
    # elementos finos (cuerdas, cables): se conservan como estaban, lejos del cuerpo
    thick = nd.binary_dilation(nd.binary_erosion(body, iterations=3), iterations=6)
    lum0 = im[..., :3].mean(-1); s0 = (im[..., :3].max(-1) - im[..., :3].min(-1)) / (im[..., :3].max(-1) + 1)
    ys0 = np.where(m.any(1))[0]; low = np.zeros_like(m); low[int(ys0[-1] - (ys0[-1] - ys0[0]) * 0.25):, :] = True
    thin = (a > 40) & m & ~floor & ~thick & ~(low & (lum0 > 110) & (s0 < 0.2))
    if thin.any():
        outa = np.where(thin, np.maximum(outa, a), outa)
        rgb = np.where(thin[..., None], im[..., :3], rgb)
    # piso -> sombra suave
    if floor.any():
        lum = im[..., :3].mean(-1)
        sh = nd.gaussian_filter((floor.astype(np.float32) * np.clip((245 - lum) / 70, 0.25, 1)), 2.5) * 70
        sh = np.where(outa > 0, 0, sh)
        rgbsh = np.array([18, 24, 24], np.float32)
        tot = np.maximum(outa, sh)
        rgb = np.where((outa < sh)[..., None], rgbsh, rgb)
        outa = tot
    res = np.dstack([np.clip(rgb, 0, 255), np.clip(outa, 0, 255)]).astype(np.uint8)
    return Image.fromarray(res, 'RGBA'), int(floor.sum())
for f in sorted(glob.glob(os.path.join(src, '*.webp'))):
    img, fl = proc(f)
    img.save(os.path.join(out, os.path.basename(f)), 'WEBP', quality=90, method=6)
    print(os.path.basename(f), 'piso' if fl else '', fl)
