# dump_sizer.py — выводит размеры всех картинок из папки images
from pathlib import Path
from PIL import Image

BASE = Path(__file__).parent           # корень проекта (где лежит этот файл)
IMG_DIR = BASE / "images"
OUT_TXT = BASE / "image-dimensions.txt"

if not IMG_DIR.exists():
    raise SystemExit(f"Папка {IMG_DIR} не найдена")

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
lines = []
skipped = []

for p in sorted(IMG_DIR.rglob("*")):
    if not p.is_file() or p.suffix.lower() not in EXTS:
        continue
    rel = p.relative_to(BASE).as_posix()
    try:
        with Image.open(p) as im:
            w, h = im.size
        lines.append(f"{rel}  {w}x{h}")
    except Exception as e:
        # Pillow может не поддерживать AVIF — тогда отметим ?x?
        lines.append(f"{rel}  ?x?  # {type(e).__name__}")
        skipped.append(rel)

OUT_TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"OK: записано {len(lines)} строк -> {OUT_TXT}")
if skipped:
    print("Без точных размеров (это не ошибка):")
    for r in skipped:
        print(" -", r)