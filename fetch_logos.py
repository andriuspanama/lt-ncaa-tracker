"""Suranda komandų logotipus per Wikipedia/Wikimedia API ir įrašo nuorodas + licencijas į data/teams.json.
Nieko neatsisiunčia – tik išsaugo nuorodas. Paleisti: python fetch_logos.py"""
import json, time, requests
API = "https://en.wikipedia.org/w/api.php"
H = {"User-Agent": "lt-ncaa-tracker/1.0 (https://github.com/andriuspanama/lt-ncaa-tracker; fan stats project)"}
# Wikipedia straipsnių pavadinimai (jei komandos čia nėra, bandoma ieškoti pagal pavadinimą)
TITLES = {
 "Arizona Wildcats":"Arizona Wildcats","Arizona State Sun Devils":"Arizona State Sun Devils","Florida Gators":"Florida Gators",
 "VMI Keydets":"VMI Keydets","Clemson Tigers":"Clemson Tigers","Stephen F. Austin":"Stephen F. Austin Lumberjacks",
 "Utah Valley":"Utah Valley Wolverines","UT Martin":"UT Martin Skyhawks","South Carolina":"South Carolina Gamecocks",
 "Buffalo":"Buffalo Bulls","Boise State":"Boise State Broncos","Campbell":"Campbell Fighting Camels","South Dakota":"South Dakota Coyotes",
 "Quinnipiac":"Quinnipiac Bobcats","UMBC":"UMBC Retrievers","California":"California Golden Bears","Rhode Island":"Rhode Island Rams",
 "FIU":"FIU Panthers","Kansas City":"Kansas City Roos","Northern Kentucky":"Northern Kentucky Norse","Saint Mary's":"Saint Mary's Gaels",
 "Longwood":"Longwood Lancers","Western Michigan":"Western Michigan Broncos","Portland State":"Portland State Vikings","Texas":"Texas Longhorns",
 "UT Arlington":"UT Arlington Mavericks","Mercer":"Mercer Bears","New Mexico":"New Mexico Lobos","Iowa State":"Iowa State Cyclones",
 "Lipscomb":"Lipscomb Bisons","Georgia State":"Georgia State Panthers","California Baptist":"California Baptist Lancers",
 "NCAA":"NCAA","Wright State Raiders":"Wright State Raiders","Northern Illinois Huskies":"Northern Illinois Huskies"}
def api(**p):
    r = requests.get(API, params={"format": "json", "formatversion": 2, **p}, headers=H, timeout=30)
    r.raise_for_status(); time.sleep(1)  # mandagiai: 1 užklausa/s
    return r.json()
def page_image(title):
    pg = api(action="query", titles=title, redirects=1, prop="pageimages", piprop="original|name")["query"]["pages"][0]
    return None if pg.get("missing") or "original" not in pg else (pg["pageimage"], pg["original"]["source"])
import re
BAD = ("wordmark","word_mark","big_12","big 12","_colors","_conference","conference","sun_belt","mw_logo","sec_logo","acc_logo","mountain_west","icon","flag","commons-logo","edit-","question","wikiquote","ambox","symbol_support","stub","map","stadium","arena","mascot","uniform","cap_","baseball","football","womens","_wbb")
STOP = {"the","of","university","state","college"}
def score(fn, title):
    n = fn.lower().replace(" ", "_")
    if not n.endswith((".svg", ".png")) or "logo" not in n: return -99
    sc = 3 + (1 if n.endswith(".svg") else 0)
    toks = [t for t in re.split(r"\W+", title.lower()) if len(t) > 2 and t not in STOP]
    sc += 2 * sum(t in n for t in toks)
    sc -= 5 * sum(b in n for b in BAD)
    return sc
def best_image(title):
    j = api(action="query", titles=title, redirects=1, prop="images", imlimit=500)["query"]["pages"][0]
    cands = [(score(i["title"][5:], title), i["title"][5:]) for i in j.get("images", [])]
    cands = [c for c in cands if c[0] >= 5]
    return max(cands)[1] if cands else None
def file_info(fn):
    info = (api(action="query", titles="File:" + fn, prop="imageinfo", iiprop="url|extmetadata")["query"]["pages"][0].get("imageinfo") or [{}])[0]
    md = info.get("extmetadata", {}); lic = (md.get("LicenseShortName") or {}).get("value")
    free = bool(lic) and any(lic.lower().startswith(x) for x in ("cc", "public domain", "pd"))
    return {"logo_url": info.get("url"), "file_page": info.get("descriptionurl"), "license": lic or "nežinoma", "free_to_reuse": free}
def logo(team):
    fn = best_image(TITLES.get(team, team))
    return file_info(fn) if fn else None  # geriau nerasta nei neteisinga komanda
if __name__ == "__main__":
    teams = sorted({p["team"] for p in json.load(open("data/players.json", encoding="utf-8"))["players"]} | {"NCAA"})
    out = {}
    for t in teams:
        try: out[t] = logo(t) or {"logo_url": None, "license": "nerasta"}
        except Exception as e: out[t] = {"logo_url": None, "license": f"klaida: {e}"}
        print(t, "->", out[t].get("license"))
    json.dump(out, open("data/teams.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
