"""Parsisiunčia kiekvieno žaidėjo rungtynių žurnalą (ESPN), išsaugo data/games/<id>.json ir PATS apskaičiuoja agregatus data/stats.json."""
import json, os, datetime as dt
from common import get
G = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/{}/gamelog"
SEASON = 2027  # ESPN sezonas = baigimosi metai (2026–27 -> 2027)

def us_date(iso):
    """ESPN laikas UTC; atimam 6 val., kad vakarinės JAV rungtynės liktų savo dienoje."""
    try: return (dt.datetime.fromisoformat(iso.replace("Z", "+00:00")) - dt.timedelta(hours=6)).date().isoformat()
    except Exception: return (iso or "")[:10]
def pair(s):
    try: a, b = str(s).split("-"); return int(a), int(b)
    except Exception: return 0, 0
def num(x):
    try: return int(float(x))
    except Exception: return 0

def parse_gamelog(j):
    labels, events, out = j.get("labels", []), j.get("events", {}), {}
    for stype in j.get("seasonTypes", []):
        for cat in stype.get("categories", []):
            for ev in cat.get("events", []):
                row = dict(zip(labels, ev.get("stats", [])))
                mins = num(row.get("MIN"))
                if mins <= 0: continue  # nežaidė
                m = events.get(ev["eventId"], {})
                fgm, fga = pair(row.get("FG")); tpm, tpa = pair(row.get("3PT")); ftm, fta = pair(row.get("FT"))
                out[ev["eventId"]] = {
                    "event_id": ev["eventId"], "date": us_date(m.get("gameDate") or ""),
                    "opponent": (m.get("opponent") or {}).get("displayName"),
                    "home": m.get("atVs") == "vs", "result": m.get("gameResult"),
                    "score": f'{m.get("homeTeamScore")}-{m.get("awayTeamScore")}',
                    "min": mins, "pts": num(row.get("PTS")), "reb": num(row.get("REB")), "ast": num(row.get("AST")),
                    "stl": num(row.get("STL")), "blk": num(row.get("BLK")), "to": num(row.get("TO")), "pf": num(row.get("PF")),
                    "fgm": fgm, "fga": fga, "tpm": tpm, "tpa": tpa, "ftm": ftm, "fta": fta}
    return sorted(out.values(), key=lambda g: g["date"])

KEYS = ["min","pts","reb","ast","stl","blk","to","fgm","fga","tpm","tpa","ftm","fta"]
def aggregate(games, start=None, end=None):
    sel = [g for g in games if g["date"] and (not start or start <= g["date"] <= end)]
    if not sel: return None
    a = {"gp": len(sel), **{k: sum(g[k] for g in sel) for k in KEYS}}
    a["fg_pct"] = round(100*a["fgm"]/a["fga"], 1) if a["fga"] else None
    a["tp_pct"] = round(100*a["tpm"]/a["tpa"], 1) if a["tpa"] else None
    a["ft_pct"] = round(100*a["ftm"]/a["fta"], 1) if a["fta"] else None
    return a

def build(all_games):
    dates = [g["date"] for gs in all_games.values() for g in gs if g["date"]]
    if not dates: return {"updated": dt.date.today().isoformat(), "periods": {"week": {}, "month": {}, "season": {}}}
    last = dt.date.fromisoformat(max(dates))
    mon = last - dt.timedelta(days=last.weekday()); sun = mon + dt.timedelta(days=6)
    rng = {"week": (mon.isoformat(), sun.isoformat()),
           "month": (last.replace(day=1).isoformat(), last.isoformat()), "season": (None, None)}
    per = {k: {pid: a for pid, gs in all_games.items() if (a := aggregate(gs, *r))} for k, r in rng.items()}
    return {"updated": dt.date.today().isoformat(), "week_range": list(rng["week"]), "month": last.strftime("%Y-%m"), "periods": per}

if __name__ == "__main__":
    os.makedirs("data/games", exist_ok=True)
    players = json.load(open("data/players.json", encoding="utf-8"))["players"]
    all_games = {}
    for p in players:
        if not p.get("espn_id") or p.get("roster_status") == "not_found": continue
        try:
            games = parse_gamelog(get(G.format(p["espn_id"]), season=SEASON))
        except Exception as e:
            print("KLAIDA", p["name"], e); continue
        all_games[p["id"]] = games
        json.dump(games, open(f'data/games/{p["id"]}.json', "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(build(all_games), open("data/stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Baigta:", len(all_games), "žaidėjų")
