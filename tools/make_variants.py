import os, re
from pathlib import Path
from PIL import Image, ImageOps

# Подключаем AVIF-плагин (он просто регистрирует формат в Pillow)
try:
    from pillow_avif import AvifImagePlugin  # noqa: F401
except Exception:
    pass

ROOT = Path("images")
SIZES = [480, 740, 900, 1120]
ALLOW_EXT = (".jpg", ".jpeg", ".png")  # исходники
STEM_RE = re.compile(r"^(.*?)-(480|740|900|1120)$", re.I)

def is_generated(name: str) -> bool:
    """Пропускаем уже сгенеренные -480/-740/-900/-1120.* файлы"""
    stem = Path(name).stem
    return STEM_RE.match(stem) is not None

def make_one_variant(img: Image.Image, out_path: Path, fmt: str, width: int):
    """Сохраняем один вариант нужного формата/ширины"""
    im = ImageOps.exif_transpose(img)  # уважаем EXIF-ориентацию
    w, h = im.size
    if width >= w:   # не апскейлим
        width = w
    new_h = int(h * (width / w))
    im_resized = im.convert("RGB").resize((width, new_h), Image.LANCZOS)

    out_path.parent.mkdir(parents=True, exist_ok=True)

    if fmt == "JPEG":
        im_resized.save(out_path, "JPEG", quality=82, optimize=True, progressive=True)
    elif fmt == "WEBP":
        im_resized.save(out_path, "WEBP", quality=76, method=6)
    elif fmt == "AVIF":
        # качество 45–55 обычно даёт хороший баланс
        im_resized.save(out_path, "AVIF", quality=50)
    else:
        raise ValueError("Unknown format: " + fmt)

def process():
    if not ROOT.exists():
        print("Папка 'images' не найдена.")
        return

    src_files = []
    for p in ROOT.rglob("*"):
        if p.is_file() and p.suffix.lower() in ALLOW_EXT and not is_generated(p.name):
            src_files.append(p)

    if not src_files:
        print("Исходников не нашли.")
        return

    print(f"Найдено {len(src_files)} исходных изображений.")
    for src in sorted(src_files):
        try:
            with Image.open(src) as im:
                w, _ = im.size
                # только те размеры, что не больше оригинала
                eff_sizes = [s for s in SIZES if s <= w]
                base = src.with_suffix("")  # images/portrait1
                stem = base.name            # portrait1

                for s in eff_sizes:
                    targets = [
                        (src.parent / f"{stem}-{s}.jpg",  "JPEG"),
                        (src.parent / f"{stem}-{s}.webp", "WEBP"),
                        (src.parent / f"{stem}-{s}.avif", "AVIF"),
                    ]
                    for out_path, fmt in targets:
                        if out_path.exists():
                            # уже есть — пропускаем
                            continue
                        make_one_variant(im, out_path, fmt, s)
                        print("✓", out_path)
        except Exception as e:
            print("ERROR:", src, e)

if __name__ == "__main__":
    process()