"""Ieško žaidėjų nuotraukų keliuose šaltiniuose ir įrašo nuorodas į data/photos.json.
Eilė: 1) ESPN  2) Wikipedia (lt, en)  3) komandos oficiali svetainė (rosterio puslapis).
Naudojimas: python fetch_photos.py"""
import json, re, time, unicodedata, requests
from urllib.parse import urljoin, unquote
H = {"User-Agent": "lt-ncaa-tracker/1.0 (https://github.com/andriuspanama/lt-ncaa-tracker; fan stats project)"}
ESPN = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/{}"
ESPN_IMG = "https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/{}.png"
SITES = {"Arizona Wildcats":"arizonawildcats.com","Arizona State Sun Devils":"thesundevils.com","Florida Gators":"floridagators.com",
 "VMI Keydets":"vmikeydets.com","Clemson Tigers":"clemsontigers.com","Stephen F. Austin":"sfajacks.com","Utah Valley":"uvuathletics.com",
 "UT Martin":"utmsports.com","South Carolina":"gamecocksonline.com","Buffalo":"ubbulls.com","Boise State":"broncosports.com",
 "Campbell":"gocamels.com","South Dakota":"goyotes.com","Quinnipiac":"quinnipiacbobcats.com","UMBC":"umbcretrievers.com",
 "California":"calbears.com","Rhode Island":"gorhody.com","FIU":"fiusports.com","Kansas City":"kcroos.com","Northern Kentucky":"nkunorse.com",
 "Saint Mary's":"smcgaels.com","Longwood":"longwoodlancers.com","Western Michigan":"wmubroncos.com","Portland State":"goviks.com",
 "Texas":"texassports.com","UT Arlington":"utamavs.com","Mercer":"mercerbears.com","New Mexico":"golobos.com","Iowa State":"cyclones.com",
 "Lipscomb":"lipscombsports.com","Georgia State":"georgiastatesports.com","California Baptist":"cbulancers.com",
 "Wright State Raiders":"wsuraiders.com","Northern Illinois Huskies":"niuhuskies.com","Dartmouth Big Green":"dartmouthsports.com"}
def norm(s): return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
def get(url, **kw):
    r = requests.get(url, headers=H, timeout=30, **kw); time.sleep(0.7); return r
def is_image(url):
    try:
        r = get(url, stream=True); ok = r.status_code == 200 and r.headers.get("content-type", "").startswith("image"); r.close(); return ok
    except Exception: return False
def espn(p):
    if not p.get("espn_id"): return None
    try:
        h = (get(ESPN.format(p["espn_id"])).json().get("athlete", {}).get("headshot") or {}).get("href")
        if h and is_image(h): return h
    except Exception: pass
    u = ESPN_IMG.format(p["espn_id"]); return u if is_image(u) else None
def wiki(p):
    for lang in ("lt", "en"):
        try:
            pg = get(f"https://{lang}.wikipedia.org/w/api.php", params={"action":"query","format":"json","formatversion":2,"redirects":1,
                "titles":p["name"],"prop":"pageimages|extracts","piprop":"original","exintro":1,"explaintext":1}).json()["query"]["pages"][0]
            txt = (pg.get("extract") or "").lower()
            if "original" in pg and ("basketball" in txt or "krepš" in txt): return pg["original"]["source"]
        except Exception: pass
    return None
def find_img(html, last, base):
    for tag in re.findall(r"<img[^>]+>", html, flags=re.I):
        t = norm(unquote(tag))
        if last in t and "logo" not in t:
            for attr in ("data-src", "src"):
                m = re.search(attr + r'=["\']([^"\']+)', tag)
                if m and not m.group(1).startswith("data:"): return urljoin(base, m.group(1).replace("&amp;", "&"))
    return None
PATHS = ("mens-basketball/roster", "mbkb/roster", "mbasketball/roster", "mbball/roster", "mens-basketball/roster/2026-27")
def site(p):
    d = SITES.get(p["team"])
    if not d: return None
    last = norm(p["name"].split()[-1])
    for path in PATHS:  # Sidearm svetainės kelias skiriasi
        try: html = get(f"https://{d}/sports/{path}").text
        except Exception: continue
        u = find_img(html, last, f"https://{d}/")
        if u and is_image(u): return u
    return None
if __name__ == "__main__":
    players = json.load(open("data/players.json", encoding="utf-8"))["players"]
    try: out = json.load(open("data/photos.json", encoding="utf-8"))
    except Exception: out = {}
    for p in players:
        if out.get(p["id"], {}).get("url"): continue
        for name, fn in (("ESPN", espn), ("Wikipedia", wiki), ("komandos svetainė", site)):
            try: u = fn(p)
            except Exception: u = None
            if u: out[p["id"]] = {"url": u, "source": name}; print("OK", p["name"], name); break
        else: print("NERASTA", p["name"])
    json.dump(out, open("data/photos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
