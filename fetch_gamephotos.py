"""Ieško ESPN rungtynių nuotraukų (recap straipsnių / naujienų iliustracijų), kuriose minimas mūsų žaidėjas.
Išsaugo TIK nuorodas ir parašus į data/gamephotos.json (pačių nuotraukų nesaugo) – Įžvalgų puslapis jas rodo tiesiogiai iš ESPN.
Paleisti: python fetch_gamephotos.py"""
import json, re, datetime as dt
from common import get, norm, same_person
SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary"
OUT = "data/gamephotos.json"
RECHECK_DAYS = 4   # naujų rungtynių recap'ai su nuotraukomis dažnai atsiranda vėliau, todėl kelias dienas tikrinam kartotinai

def load(path, default):
    try: return json.load(open(path, encoding="utf-8"))
    except Exception: return default

def images_of(j):
    """Surenka visus paveikslėlius su parašais iš summary JSON (article, news, gamePackageArticle, header ir pan.)."""
    found = []
    def walk(o, ctx):
        if isinstance(o, dict):
            head = o.get("headline") or o.get("title") or ctx
            for im in (o.get("images") or []):
                if isinstance(im, dict) and im.get("url"):
                    found.append({"url": im["url"], "caption": " ".join(filter(None, [im.get("caption"), im.get("alt"), im.get("name")])),
                                  "credit": im.get("credit"), "w": im.get("width"), "h": im.get("height"), "headline": head,
                                  "link": ((o.get("links") or {}).get("web") or {}).get("href")})
            for k, v in o.items():
                if k in ("images",): continue
                walk(v, head)
        elif isinstance(o, list):
            for v in o: walk(v, ctx)
    for key in ("article", "gamePackageArticle", "news", "videos"):
        if key in j: walk(j[key], None)
    return found

def mentions(p, text):
    """Ar parašas mini žaidėją? Pilnas vardas, alias arba pavardė (leidžiam vienos raidės praradimą: Križanauskas→Krianauskas)."""
    t = norm(text)
    if not t: return False
    words = re.findall(r"[a-z']+", t)
    for cand in [p["name"]] + list(p.get("aliases") or []):
        c = norm(cand).split()
        if not c: continue
        if " ".join(c) in t: return True
        last = c[-1]
        if len(last) >= 4 and any(same_person({"name": " ".join(c)}, f"{c[0]} {w}") for w in words) and c[0] in words: return True
        if len(last) >= 5 and last in words: return True   # tik pavardė (komanda jau sutampa, nes tikrinam tos komandos rungtynes)
    return False

def usable(im):
    u = im["url"].lower()
    if any(x in u for x in ("logo", "default", "placeholder", "headshot")): return False
    w = im.get("w") or 0
    return not w or w >= 400

if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]
    out = load(OUT, {"photos": {}, "checked": {}})
    today = dt.date.today()
    events = {}
    for p in players:
        for g in load(f"data/games/{p['id']}.json", []):
            events.setdefault(g["event_id"], {"date": g["date"], "players": []})["players"].append(p)
    todo = []
    for eid, e in events.items():
        last = out["checked"].get(eid)
        age = (today - dt.date.fromisoformat(e["date"])).days if e["date"] else 99
        if last is None or age <= RECHECK_DAYS: todo.append(eid)
    print("Rungtynių su lietuviais:", len(events), "| tikrinsim:", len(todo))
    new = 0
    for eid in todo:
        try: j = get(SUMMARY, event=eid)
        except Exception as ex: print("KLAIDA", eid, str(ex)[:70]); continue
        imgs = [i for i in images_of(j) if usable(i)]
        got = {}
        for im in imgs:
            for p in events[eid]["players"]:
                if p["id"] in got: continue
                if mentions(p, im["caption"]) or mentions(p, im.get("headline") or ""):
                    got[p["id"]] = {"url": im["url"], "caption": (im["caption"] or im.get("headline") or "")[:240], "credit": im.get("credit"),
                                    "w": im.get("w"), "h": im.get("h"), "link": im.get("link"), "player": p["id"]}
        if got:
            out["photos"][eid] = list(got.values())
            new += len(got); print("OK", eid, [p for p in got])
        else:
            out["photos"].pop(eid, None)
        out["checked"][eid] = today.isoformat()
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Baigta. Nuotraukų su lietuviais rasta:", new)
