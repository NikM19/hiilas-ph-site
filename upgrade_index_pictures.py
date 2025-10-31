# upgrade_index_pictures.py — переписывает IMG в <picture> в .iso-box
import re, shutil
from pathlib import Path

root = Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")

pattern = re.compile(
    r'(<div class="iso-box[^>]*?>)\s*'
    r'<img\s+src="images/((?:portrait|couples|family|elopement)\d+)\.jpg"\s+alt="([^"]*)">\s*'
    r'</div>',
    re.IGNORECASE
)

def repl(m):
    open_div, basename, alt = m.groups()
    return (f'{open_div}<picture>\n'
            f'  <img\n'
            f'    src="images/{basename}-740.jpg"\n'
            f'    srcset="images/{basename}-480.jpg 480w, images/{basename}-740.jpg 740w, '
            f'images/{basename}-900.jpg 900w, images/{basename}-1120.jpg 1120w"\n'
            f'    sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 368px"\n'
            f'    alt="{alt}" loading="lazy" decoding="async">\n'
            f'</picture></div>')

new_html, n = pattern.subn(repl, html)

if n == 0:
    print("Ничего не заменено. Проверь, что разметка такая, как в галерее, и что включён правильный файл.")
else:
    backup = root / "index.backup.html"
    shutil.copy2(root / "index.html", backup)
    (root / "index.optimized.html").write_text(new_html, encoding="utf-8")
    print(f"Готово: замен {n}. Создано: index.optimized.html (и бэкап index.backup.html)")