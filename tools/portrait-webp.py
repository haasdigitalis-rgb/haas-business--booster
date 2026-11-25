#!/usr/bin/env python3
"""Génère les deux WebP du portrait fondateur (décision HAA-306 du 25/11/2026).

Usage : python3 tools/portrait-webp.py <portrait-source.(jpg|png|webp)>
Sortie : src/assets/olivier-haas-fondateur.webp (640x640) et -320.webp (320x320), recadrage carré centré, qualité 82.
"""
import sys, pathlib
from PIL import Image, ImageOps

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / "src" / "assets"
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
side = min(im.size)
im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
for size, name in ((640, "olivier-haas-fondateur.webp"), (320, "olivier-haas-fondateur-320.webp")):
    im.resize((size, size), Image.LANCZOS).save(out / name, "WEBP", quality=82, method=6)
    print(name, (out / name).stat().st_size, "octets")
