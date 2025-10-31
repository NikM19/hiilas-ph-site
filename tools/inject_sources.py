import re, pathlib

html = pathlib.Path("index.html").read_text(encoding="utf-8")

pattern = re.compile(r'(<picture>\s*)(\s*)<img([^>]*?)src="images\/((?:portrait|couples|family|elopement)\d+)-740\.jpg"([^>]*?)>', re.S)

def repl(m):
    lead, indent, attrs_before, stem, attrs_after = m.groups()
    avif = f'{indent}<source type="image/avif" srcset="images/{stem}-480.avif 480w, images/{stem}-740.avif 740w, images/{stem}-900.avif 900w, images/{stem}-1120.avif 1120w">'
    webp = f'{indent}<source type="image/webp" srcset="images/{stem}-480.webp 480w, images/{stem}-740.webp 740w, images/{stem}-900.webp 900w, images/{stem}-1120.webp 1120w">'
    img  = f'{indent}<img{attrs_before}src="images/{stem}-740.jpg"{attrs_after}>'
    return lead + avif + "\n" + webp + "\n" + img

out = pattern.sub(repl, html)

pathlib.Path("index.html.bak").write_text(html, encoding="utf-8")
pathlib.Path("index.html").write_text(out, encoding="utf-8")
print("Готово. Резервная копия: index.html.bak")