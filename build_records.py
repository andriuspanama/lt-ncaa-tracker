"""Sezono rekordai ir ženkliukai → data/records.json. Paleisti: python build_records.py
Rekordas = geriausios sezono rungtynės pagal kiekvieną rodiklį. „Naujas“ = naujausios rungtynės viršijo visas ankstesnes (ir praėjo minimali riba)."""
import json, datetime as dt
STATS = {"pts": 12, "reb": 7, "ast": 5, "stl": 3, "blk": 3, "tpm": 3}   # rodiklis: minimali reikšmė, kad būtų verta „naujo rekordo“ ženklo
RECENT_DAYS = 7
def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d

def analyze(games, newest):
    games = sorted([g for g in games if g.get("min", 0) > 0], key=lambda g: g["date"])
    if not games: return None
    rec, new = {}, []
    for k in STATS:
        best = max(games, key=lambda g: (g.get(k, 0), g["date"]))
        if best.get(k, 0) > 0:
            rec[k] = {"v": best[k], "date": best["date"], "eid": best["event_id"], "opp": best["opponent"], "home": best["home"]}
        last = games[-1]
        if len(games) >= 3 and last.get(k, 0) >= STATS[k] and last.get(k, 0) > max(g.get(k, 0) for g in games[:-1]):
            age = (dt.date.fromisoformat(newest) - dt.date.fromisoformat(last["date"])).days
            if age <= RECENT_DAYS: new.append({"stat": k, "v": last[k], "prev": max(g.get(k, 0) for g in games[:-1]), "date": last["date"], "opp": last["opponent"]})
    c = {"dd": 0, "td": 0, "p20": 0, "p30": 0, "t3": 0, "b3": 0, "s3": 0, "ft": 0}
    for g in games:
        d10 = sum(1 for k in ("pts", "reb", "ast", "stl", "blk") if g.get(k, 0) >= 10)
        c["dd"] += d10 >= 2; c["td"] += d10 >= 3; c["p20"] += g["pts"] >= 20; c["p30"] += g["pts"] >= 30
        c["t3"] += g.get("tpm", 0) >= 3; c["b3"] += g.get("blk", 0) >= 3; c["s3"] += g.get("stl", 0) >= 3
        c["ft"] += g.get("fta", 0) >= 6 and g.get("ftm", 0) == g.get("fta", 0)
    return {"gp": len(games), "records": rec, "counts": {k: v for k, v in c.items() if v}, "new": new}

if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]
    data = {p["id"]: load(f"data/games/{p['id']}.json", []) for p in players}
    dates = [g["date"] for gs in data.values() for g in gs]
    newest = max(dates) if dates else dt.date.today().isoformat()
    out = {}
    for pid, gs in data.items():
        a = analyze(gs, newest)
        if a: out[pid] = a
    json.dump({"updated": dt.date.today().isoformat(), "newest": newest, "players": out}, open("data/records.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Žaidėjų su rekordais:", len(out), "| nauji rekordai:", sum(len(v["new"]) for v in out.values()))
