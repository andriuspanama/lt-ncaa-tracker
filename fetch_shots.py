"""Šūvių vietos iš ESPN rungtynių play-by-play → data/shots/<žaidėjo id>.json. Paleisti: python fetch_shots.py
Koordinatės suvedamos į vieną pusę aikštės (krepšys ties x=25, y=5,25 pėdų), žiūrint iš puolančiojo pusės.
Jei ESPN konkrečioms rungtynėms koordinačių neteikia – tos rungtynės praleidžiamos (žemėlapis nerodomas)."""
import json, os, math
from common import get, norm, same_person
SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary"
HOOP = (25.0, 5.25)

def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d

def fold(x, y):
    """Visi metimai – į apatinį krepšį: jei metimas atliktas į tolimą krepšį (y > 47), pasukam aikštę 180°."""
    return (50 - x, 94 - y) if y > 47 else (x, y)

def parse(j, players):
    """-> {player_id: [šūvis,...]} iš summary JSON. players – [{id,name,aliases,espn_id}] šios komandos žaidėjai."""
    out, seen = {}, {"plays": 0, "with_xy": 0}
    for pl in (j.get("plays") or []):
        if not pl.get("shootingPlay"): continue
        seen["plays"] += 1
        text = (pl.get("text") or ""); low = (text + " " + ((pl.get("type") or {}).get("text") or "")).lower()
        if "free throw" in low or "freethrow" in low: continue
        c = pl.get("coordinate") or {}
        try: x, y = float(c.get("x")), float(c.get("y"))
        except (TypeError, ValueError): continue
        if not (0 <= x <= 50 and 0 <= y <= 94): continue       # ESPN trūkstamą reikšmę žymi didžiuliu neigiamu skaičiumi
        seen["with_xy"] += 1
        pid = None
        parts = pl.get("participants") or []
        aid = str((((parts[0] or {}).get("athlete") or {}).get("id")) or "") if parts else ""
        for p in players:
            if (aid and str(p.get("espn_id") or "") == aid) or (not aid and norm(text).startswith(norm(p["name"]))):
                pid = p["id"]; break
            if not pid:
                nm = " ".join(text.split(" ")[:2])
                if same_person(p, nm): pid = p["id"]; break
        if not pid: continue
        fx, fy = fold(x, y)
        made = bool(pl.get("scoringPlay"))
        d = math.hypot(fx - HOOP[0], fy - HOOP[1])
        pa = pl.get("pointsAttempted")
        three = (pa == 3) if pa in (1, 2, 3) else (d > 22.2 or "three point" in low)
        out.setdefault(pid, []).append({"x": round(fx, 1), "y": round(fy, 1), "m": int(made), "v": 3 if three else 2})
    return out, seen

if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]
    done = set(load("data/shots_done.json", []))
    events = {}
    for p in players:
        for g in load(f"data/games/{p['id']}.json", []):
            events.setdefault(g["event_id"], {"date": g["date"], "opp": g["opponent"], "home": g["home"], "team": p["team"], "players": []})["players"].append(p)
    todo = [e for e in events if e not in done]
    print("Rungtynių su lietuviais:", len(events), "| naujų šūvių skaitymui:", len(todo))
    os.makedirs("data/shots", exist_ok=True)
    new_total, xr = 0, [999, -999, 999, -999]
    for eid in todo:
        try: j = get(SUMMARY, event=eid)
        except Exception as ex: print("KLAIDA", eid, str(ex)[:70]); continue
        res, seen = parse(j, events[eid]["players"])
        for pid, shots in res.items():
            f = f"data/shots/{pid}.json"; cur = [s for s in load(f, []) if s.get("e") != eid]
            e = events[eid]
            for s in shots:
                s.update({"e": eid, "d": e["date"], "o": e["opp"], "h": int(e["home"])}); xr = [min(xr[0], s["x"]), max(xr[1], s["x"]), min(xr[2], s["y"]), max(xr[3], s["y"])]
            cur += shots; cur.sort(key=lambda s: s["d"])
            json.dump(cur, open(f, "w", encoding="utf-8"), separators=(",", ":")); new_total += len(shots)
        print("OK" if res else "–", eid, "metimų su koordinatėmis:", seen["with_xy"], "/", seen["plays"], "| mūsų žaidėjų:", {k: len(v) for k, v in res.items()})
        if seen["plays"]: done.add(eid)          # jei play-by-play dar tuščias – bandysim vėliau
    json.dump(sorted(done), open("data/shots_done.json", "w"))
    print("Baigta. Šūvių:", new_total, "| x:", xr[0:2], "y:", xr[2:4])
