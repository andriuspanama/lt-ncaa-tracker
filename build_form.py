"""Karšti / šalti žaidėjai ir tendencijos → data/form.json. Paleisti: python build_form.py
Skaičiuojama tik žaidėjams, sužaidusiems bent MIN_G rungtynių. Palyginama paskutinės WIN rungtynės su sezono vidurkiu."""
import json, datetime as dt, os
MIN_G, WIN = 10, 5

def GS(g): return g["pts"]+0.4*g["fgm"]-0.7*g["fga"]-0.4*(g["fta"]-g["ftm"])+0.5*g["reb"]+g["stl"]+0.7*g["ast"]+0.7*g["blk"]-0.4*g.get("pf",0)-g["to"]
def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d
def agg(gs):
    n = len(gs); a = lambda f: sum(f(g) for g in gs)/n
    return {"ppg": a(lambda g: g["pts"]), "mpg": a(lambda g: g["min"]), "rpg": a(lambda g: g["reb"]), "apg": a(lambda g: g["ast"]), "imp": a(GS), "fga": a(lambda g: g["fga"])}
r1 = lambda d: {k: round(v, 1) for k, v in d.items()}

def analyze(games):
    games = sorted(games, key=lambda g: g["date"])
    n = len(games)
    if n < MIN_G: return None
    last, prev = games[-WIN:], games[:-WIN]
    se, l5, pv = agg(games), agg(last), agg(prev)
    d_imp, d_prev = l5["imp"]-se["imp"], l5["imp"]-pv["imp"]
    best = max(agg(games[i:i+WIN])["imp"] for i in range(0, n-WIN+1))
    tags = []
    if d_prev >= 3 and l5["ppg"] > pv["ppg"]: tags.append("progress")
    if l5["imp"] >= best-1e-9 and d_imp >= 1: tags.append("best")
    if l5["mpg"] <= se["mpg"]-3: tags.append("role_down")
    if l5["mpg"] >= se["mpg"]+3: tags.append("minutes_up")
    return {"gp": n, "season": r1(se), "last5": r1(l5), "prev": r1(pv), "d_imp": round(d_imp, 1), "d_ppg": round(l5["ppg"]-se["ppg"], 1),
            "d_mpg": round(l5["mpg"]-se["mpg"], 1), "tags": tags, "spark": [g["pts"] for g in games[-10:]]}

def build(players, games_of):
    out, mx = {}, 0
    for p in players:
        g = games_of(p["id"]); mx = max(mx, len(g))
        a = analyze(g)
        if a: out[p["id"]] = a
    ranked = sorted(out, key=lambda i: -out[i]["d_imp"])
    hot = [i for i in ranked if out[i]["d_imp"] >= 2][:5]
    cold = [i for i in reversed(ranked) if out[i]["d_imp"] <= -2][:5]
    tags = {t: [i for i in ranked if t in out[i]["tags"]] for t in ("progress", "best", "role_down", "minutes_up")}
    return {"updated": dt.date.today().isoformat(), "min_games": MIN_G, "window": WIN, "max_gp": mx, "eligible": len(out), "players": out, "hot": hot, "cold": cold, "tags": tags}

if __name__ == "__main__":
    players = load("data/players.json", {"players": []})["players"]
    res = build(players, lambda i: load(f"data/games/{i}.json", []))
    json.dump(res, open("data/form.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Žaidėjų su ≥%d rungtynėmis: %d | karšti: %s | šalti: %s | daugiausia rungtynių: %d" % (MIN_G, res["eligible"], res["hot"], res["cold"], res["max_gp"]))
