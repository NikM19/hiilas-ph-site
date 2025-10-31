# make_derivatives.py — делает JPG-версии 480/740/900/1120
from pathlib import Path
from PIL import Image, ImageOps

BASE = Path(__file__).parent
SRC  = BASE / "images"
OUT  = BASE / "images"

SIZES = [480, 740, 900, 1120]   # ширины
QUALITY = 82                    # баланс качество/вес

def save_jpg(src: Path, width: int):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)        # поправка ориентации
    w, h = im.size
    if w <= width:                          # меньше не увеличиваем
        return
    new_h = int(h * (width / w))
    im = im.resize((width, new_h), Image.LANCZOS)
    stem = src.stem     # 'portrait1'
    out = OUT / f"{stem}-{width}.jpg"
    im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True, subsampling=2)

def main():
    exts = {".jpg", ".jpeg", ".png"}
    imgs = sorted([p for p in SRC.iterdir() if p.suffix.lower() in exts])
    for p in imgs:
        for w in SIZES:
            save_jpg(p, w)
    print("Done.")

if __name__ == "__main__":
    main()