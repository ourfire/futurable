"""Genera techweek/index.html a partir de las diapositivas del deck "El futuro del valor humano".

Uso: python3 tools/build_techweek.py <carpeta_slides> [tokens.json]
- Quita las notas del speaker (<aside>) y los marcadores [Imagen: ...] / [VIDEO ...].
- Reemplaza la tipografía y los colores del deck por los tokens de diseño.
- Las imágenes se sirven desde techweek/img/<id>.<ext>.
"""
import json, os, re, sys, glob, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slides_dir = sys.argv[1]
tokens = {
    "bg": "#ffffff", "ink": "#111111", "muted": "#666666", "accent": "#1f5fbf",
    "font_display": "'Inter Tight', Helvetica, Arial, sans-serif",
    "font_body": "'Inter Tight', Helvetica, Arial, sans-serif",
    "font_label": "'IBM Plex Mono', ui-monospace, monospace",
    "fonts_css": "",
    "chrome_bg": "#0f1115", "chrome_ink": "#f3f1ec",
}
if len(sys.argv) > 2:
    tokens.update(json.load(open(sys.argv[2])))

deck = json.load(open(os.path.join(slides_dir, "..", "deck.json")))
imgs = {os.path.splitext(os.path.basename(p))[0]: os.path.basename(p) for p in glob.glob(os.path.join(ROOT, "techweek", "img", "*"))}

SKIP = {"video-historia"}  # el video aún no existe

def clean(sec, sid):
    sec = re.sub(r"<aside>.*?</aside>", "", sec, flags=re.S)
    sec = re.sub(r"<p[^>]*>\s*\[(?:VIDEO|Imagen)[^\]]*\]\s*</p>", "", sec)
    sec = re.sub(r"\[(?:VIDEO|Imagen)[^\]]*\]\s*·\s*", "", sec)
    sec = sec.replace("&nbsp;Fuentes", "Fuentes")
    def img(m):
        i = m.group(1)
        return 'src="img/%s" loading="lazy" decoding="async"' % imgs.get(i, i + ".png")
    sec = re.sub(r'src="/_blob/([0-9a-f]+)"', img, sec)
    # tipografía y color del sistema de diseño
    sec = re.sub(r"font-family:\s*Arial,\s*(?:Helvetica,\s*)?sans-serif", "font-family:" + tokens["font_body"], sec)
    sec = re.sub(r"(<h[12][^>]*style=\")", r"\1font-family:%s;" % tokens["font_display"].replace("\\", "\\\\"), sec)
    sec = re.sub(r"(<p[^>]*style=\"[^\"]*letter-spacing:2px)", lambda m: m.group(1) + ";font-family:" + tokens["font_label"], sec)
    sec = sec.replace("#1f5fbf", tokens["accent"]).replace("#111111", tokens["ink"]).replace("#666666", tokens["muted"]).replace("#444444", tokens["muted"])
    sec = sec.replace("background:#ffffff", "background:" + tokens["bg"])
    # la letra expandida es más ancha: títulos más contenidos y sin tracking negativo
    sec = sec.replace("font-size:168px;font-weight:800;line-height:1.0;letter-spacing:-4px", "font-size:132px;font-weight:400;line-height:1.02;letter-spacing:-2px")
    sec = re.sub(r"font-size:\s*80px;\s*font-weight:800;\s*line-height:1\.05;\s*letter-spacing:-2px", "font-size:64px;font-weight:400;line-height:1.12;letter-spacing:-1px", sec)
    sec = re.sub(r"font-size:\s*(?:26|30)px;\s*font-weight:700;\s*letter-spacing:2px", "font-size:22px;font-weight:500;letter-spacing:3px", sec)
    def mute(m):
        return m.group(0).replace("color:" + tokens["accent"], "color:" + tokens["muted"])
    sec = re.sub(r"<p[^>]*letter-spacing:3px[^>]*>", mute, sec)
    if sid == "estacion":
        sec = sec.replace("Haz tu diagnóstico en la estación interactiva de Futurable.",
                          'Haz tu diagnóstico en <a href="/arca/" style="color:%s">futurable.work/arca</a>' % tokens["accent"])
    return sec.strip()

order = [s for s in deck["order"] if s not in SKIP]
sections = []
for sid in order:
    p = os.path.join(slides_dir, sid + ".html")
    if os.path.exists(p):
        sections.append(clean(open(p).read(), sid))

tpl = open(os.path.join(ROOT, "tools", "techweek.template.html")).read()
out = tpl
for k, v in tokens.items():
    out = out.replace("{{" + k + "}}", v)
out = out.replace("{{slides}}", "\n".join(sections)).replace("{{count}}", str(len(sections)))
os.makedirs(os.path.join(ROOT, "techweek"), exist_ok=True)
open(os.path.join(ROOT, "techweek", "index.html"), "w").write(out)
print("techweek/index.html:", len(sections), "diapositivas")
