"""Sudaro data/ticker.json – naujausių geriausių lietuvių pasirodymų juostai viršuje. Paleisti: python build_ticker.py"""
import json, datetime as dt
def GS(g): return g["pts"]+0.4*g["fgm"]-0.7*g["fga"]-0.4*(g["fta"]-g["ftm"])+0.5*g["reb"]+g["stl"]+0.7*g["ast"]+0.7*g["blk"]-0.4*g.get("pf",0)-g["to"]
def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d
if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]; rows = []
    for p in players:
        for g in load(f"data/games/{p['id']}.json", []):
            if g.get("min", 0) >= 10: rows.append({"id": p["id"], "name": p["name"], "team": p["team"], "date": g["date"], "opp": g["opponent"], "home": g["home"],
                "res": g.get("result"), "score": g.get("score"), "pts": g["pts"], "reb": g["reb"], "ast": g["ast"], "stl": g["stl"], "blk": g["blk"], "gs": round(GS(g), 1)})
    days = sorted({r["date"] for r in rows}, reverse=True)[:2]
    pick = sorted([r for r in rows if r["date"] in days], key=lambda r: -r["gs"])[:10]
    json.dump({"updated": dt.date.today().isoformat(), "items": pick}, open("data/ticker.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Ticker įrašų:", len(pick))
