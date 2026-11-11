"""Programėlės piktogramos iš ncaa-logo.png: tamsus „aikštės“ fonas su šviesos dėmėmis, tas pats logotipas centre.
Paleisti: python make_icons.py  →  icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png, favicon-32.png"""
from PIL import Image, ImageDraw, ImageFilter
import math, os
SRC = "ncaa-logo.png"
def radial(size, cx, cy, r, color, alpha):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0)); px = layer.load()
    for y in range(size):
        for x in range(size):
            d = math.hypot(x-cx, y-cy)/r
            if d < 1: px[x, y] = (*color, int(alpha*(1-d)**1.6*255))
    return layer
def make(size, safe, rounded):
    S = 1024
    bg = Image.new("RGBA", (S, S), (6, 10, 18, 255))
    top = Image.new("RGBA", (S, S), (14, 24, 41, 255)); mask = Image.linear_gradient("L").resize((S, S)).transpose(Image.FLIP_TOP_BOTTOM)
    bg = Image.composite(bg, top, mask)
    bg.alpha_composite(radial(S, S*.86, S*.04, S*.9, (39, 167, 230), .55))
    bg.alpha_composite(radial(S, S*.02, S*1.0, S*.8, (255, 122, 26), .40))
    d = ImageDraw.Draw(bg, "RGBA"); w = int(S*.006)
    d.arc((S*.5-S*.62, S*1.0-S*.62, S*.5+S*.62, S*1.0+S*.62), 180, 360, fill=(255, 255, 255, 26), width=w)      # tritaškio lanko užuomina
    d.arc((S*.5-S*.28, S*1.0-S*.28, S*.5+S*.28, S*1.0+S*.28), 180, 360, fill=(255, 255, 255, 22), width=w)
    logo = Image.open(SRC).convert("RGBA"); L = int(S*safe)
    logo = logo.resize((L, L), Image.LANCZOS)
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0)); sh.paste((39, 167, 230, 150), ((S-L)//2, (S-L)//2+int(S*.02)), logo.split()[3])
    bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S*.035)))
    ring = Image.new("RGBA", (S, S), (0, 0, 0, 0)); ImageDraw.Draw(ring).ellipse(((S-L)//2-int(S*.022), (S-L)//2-int(S*.022), (S+L)//2+int(S*.022), (S+L)//2+int(S*.022)), outline=(255, 122, 26, 235), width=int(S*.014))
    bg.alpha_composite(ring)
    bg.alpha_composite(logo, ((S-L)//2, (S-L)//2))
    out = bg.resize((size, size), Image.LANCZOS)
    if rounded:
        m = Image.new("L", (size*4, size*4), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size*4-1, size*4-1), radius=int(size*4*.22), fill=255)
        out.putalpha(m.resize((size, size), Image.LANCZOS))
    return out
if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    make(512, .56, True).save("icons/icon-512.png"); make(192, .56, True).save("icons/icon-192.png")
    make(512, .46, False).save("icons/maskable-512.png")          # maskable: logotipas saugioje zonoje (~46 %), fonas pilnas
    make(180, .56, False).save("icons/apple-touch-icon.png")      # iOS pats apvalina kampus
    make(64, .66, True).save("icons/favicon-64.png"); make(32, .66, True).save("icons/favicon-32.png")
    print("OK", sorted(os.listdir("icons")))
