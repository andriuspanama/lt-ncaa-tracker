"""Paruošia pranešimo tekstą apie naujausius rezultatus → data/notify.json. Paleisti: python build_notify.py
Pranešimas: vakaro geriausias lietuvis (pagal Game Score) ir kiek lietuvių žaidė. `id` pasikeičia, kai atsiranda naujų rungtynių."""
import sys, json, hashlib, datetime as dt
def GS(g): return g["pts"]+0.4*g["fgm"]-0.7*g["fga"]-0.4*(g["fta"]-g["ftm"])+0.5*g["reb"]+g["stl"]+0.7*g["ast"]+0.7*g["blk"]-0.4*g.get("pf",0)-g["to"]
def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d
if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]
    rec = load("data/records.json", {"players": {}})["players"]
    rows = []
    for p in players:
        for g in load(f"data/games/{p['id']}.json", []):
            if g.get("min", 0) > 0: rows.append((g["date"], p, g))
    if not rows: print("Nėra duomenų pranešimui."); sys.exit(0)
    day = max(r[0] for r in rows); today = [r for r in rows if r[0] == day]
    best = max(today, key=lambda r: GS(r[2])); _, p, g = best
    surname = p["name"].split()[-1]
    parts = [f"{g['pts']} tšk."] + ([f"{g['reb']} atk."] if g["reb"] >= 5 else []) + ([f"{g['ast']} perd."] if g["ast"] >= 4 else [])
    new = (rec.get(p["id"]) or {}).get("new") or []
    star = "🏆 " if any(n["date"] == day for n in new) else ""
    body = f"{star}{surname}: {', '.join(parts)} {'prieš' if g['home'] else '@'} {g['opponent']}. Iš viso žaidė {len({r[1]['id'] for r in today})} lietuviai."
    ids = sorted({r[2]["event_id"] for r in today})
    out = {"id": hashlib.sha1((day + "|" + ",".join(ids)).encode()).hexdigest()[:12], "date": day, "games": len(ids), "title": "LT NCAA: nauji rezultatai",
           "body": body, "url": "index.html", "updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
    json.dump(out, open("data/notify.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(out["title"], "|", body)
