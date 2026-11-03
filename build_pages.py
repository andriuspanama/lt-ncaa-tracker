"""Sukuria atskirą puslapį kiekvienam žaidėjui (players/<id>.html) ir atnaujina sitemap.xml. Paleisti: python build_pages.py"""
import json, os, html
BASE = "https://andriuspanama.github.io/lt-ncaa-tracker"
T = '''<!doctype html>
<html lang="lt">
<head>
<base href="../">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} · LT NCAA Tracker</title>
<meta name="description" content="{name} ({team}) – lietuvis NCAA Division I: statistika, forma ir rungtynių žurnalas.">
<meta name="theme-color" content="#07090c">
<link rel="canonical" href="{base}/players/{id}.html">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8F%80%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="profile"><meta property="og:locale" content="lt_LT">
<meta property="og:title" content="{name} · LT NCAA Tracker"><meta property="og:description" content="{name} ({team}) – statistika ir rungtynės."><meta property="og:url" content="{base}/players/{id}.html">
<script src="theme.js"></script>
<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="extra.css"><link rel="stylesheet" href="polish.css">
</head>
<body data-id="{id}">
<header><div><h1>{name_up}</h1><p class="sub">{team} · {conf}</p></div></header>
<div class="tabs"></div>
<main id="pf" class="pf"><p class="empty">Kraunama…</p></main>
<footer><a href="index.html">← Visi žaidėjai</a> · Neoficialus projektas, nesusijęs su NCAA ar ESPN.</footer>
<script src="media.js"></script>
<script src="player.js"></script>
</body>
</html>
'''
if __name__ == "__main__":
    players = json.load(open("data/players.json", encoding="utf-8"))["players"]
    os.makedirs("players", exist_ok=True)
    for p in players:
        open(f"players/{p['id']}.html", "w", encoding="utf-8").write(T.format(
            id=p["id"], name=html.escape(p["name"]), name_up=html.escape(p["name"].upper()),
            team=html.escape(p["team"]), conf=html.escape(p["conference"]), base=BASE))
    urls = [BASE + "/"] + [f"{BASE}/{s}.html" for s in ("games", "charts", "compare", "insights", "metodika")] + [f"{BASE}/players/{p['id']}.html" for p in players]
    open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    print("Sukurta puslapių:", len(players))
