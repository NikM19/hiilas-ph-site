from PIL import Image, ImageOps
from pillow_avif import AvifImagePlugin  # регистрирует AVIF

src = "images/header-bg.jpg"
sizes = [2000, 1400, 800]

with Image.open(src) as im:
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    for s in sizes:
        s = min(s, w)
        imr = im.resize((s, int(h*s/w)), Image.LANCZOS)
        imr.save(f"images/header-bg-{s}.jpg",  "JPEG", quality=82, optimize=True, progressive=True)
        imr.save(f"images/header-bg-{s}.webp", "WEBP", quality=76, method=6)
        imr.save(f"images/header-bg-{s}.avif", "AVIF", quality=50)
print("done")