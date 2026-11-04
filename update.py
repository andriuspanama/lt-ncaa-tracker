"""Parsisiunčia kiekvieno žaidėjo rungtynių žurnalą (ESPN), išsaugo data/games/<id>.json ir PATS apskaičiuoja agregatus data/stats.json."""
import json, os, time, datetime as dt
from common import get, norm
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

SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary"
def fuzzy(a, b):
    a, b = norm(a).split(), norm(b).split()
    return bool(a and b) and (a == b or (a[-1] == b[-1] and a[0][0] == b[0][0]))
def box_rows(j):
    """ESPN summary → [(athlete_id, vardas, komanda, {etiketė: reikšmė})]"""
    out = []
    for t in (j.get("boxscore") or {}).get("players", []):
        tm = (t.get("team") or {}).get("displayName")
        for st in t.get("statistics", []):
            labels = st.get("labels", [])
            for a in st.get("athletes", []):
                if a.get("didNotPlay") or not a.get("stats"): continue
                at = a.get("athlete") or {}
                out.append((str(at.get("id")), at.get("displayName") or "", tm, dict(zip(labels, a["stats"]))))
    return out
def game_from_row(row, m):
    fgm, fga = pair(row.get("FG")); tpm, tpa = pair(row.get("3PT")); ftm, fta = pair(row.get("FT"))
    return {"event_id": m["event_id"], "date": m["date"], "opponent": m["opponent"], "home": m["home"], "result": m["result"], "score": m["score"],
            "min": num(row.get("MIN")), "pts": num(row.get("PTS")), "reb": num(row.get("REB")), "ast": num(row.get("AST")), "stl": num(row.get("STL")),
            "blk": num(row.get("BLK")), "to": num(row.get("TO")), "pf": num(row.get("PF")), "fgm": fgm, "fga": fga, "tpm": tpm, "tpa": tpa, "ftm": ftm, "fta": fta}
def meta_of(s):
    f, a = num(s.get("for")), num(s.get("against"))
    return {"event_id": s["event_id"], "date": us_date(s.get("date") or ""), "opponent": s.get("opponent"), "home": bool(s.get("home")),
            "result": "W" if f > a else "L" if f < a else None, "score": f"{f}-{a}"}
def load(path, default):
    try: return json.load(open(path, encoding="utf-8"))
    except Exception: return default

if __name__ == "__main__":
    os.makedirs("data/games", exist_ok=True)
    players = load("data/players.json", {"players": []})["players"]
    sched = load("data/schedule.json", []); done = set(load("data/box_done.json", []))
    pby = {}
    for p in players: pby.setdefault(p["team"], []).append(p)
    ev = {}
    for s in sched:
        if s.get("state") == "post" and s.get("team") in pby and s.get("event_id"): ev.setdefault(s["event_id"], {})[s["team"]] = s
    todo = [e for e in ev if e not in done]
    print("Tvarkaraštyje baigtų rungtynių (mūsų komandos):", len(ev), "| naujų boxscore apdoroti:", len(todo))
    games = {p["id"]: load(f'data/games/{p["id"]}.json', []) for p in players}
    found, learned = 0, {}
    for e in todo:
        try: j = get(SUMMARY, event=e)
        except Exception as ex: print("KLAIDA boxscore", e, str(ex)[:70]); continue
        rows = box_rows(j)
        if not rows: print("Boxscore dar tuščias:", e); continue
        for team, s in ev[e].items():
            m = meta_of(s)
            mine = [r for r in rows if r[2] != m["opponent"]]  # tik savo komandos žaidėjai
            for p in pby[team]:
                r = next((x for x in mine if p.get("espn_id") and x[0] == str(p["espn_id"])), None)
                if r is None:
                    r = next((x for x in mine if fuzzy(p["name"], x[1])), None)
                    if r is not None and not p.get("espn_id"): learned[p["id"]] = r[0]
                if not r or num(r[3].get("MIN")) <= 0 or any(g["event_id"] == e for g in games[p["id"]]): continue
                games[p["id"]].append(game_from_row(r[3], m)); found += 1
                print("OK", p["name"], "|", team, "prieš" if m["home"] else "@", m["opponent"], "|", r[3].get("PTS"), "tšk.", r[3].get("REB"), "atk.", r[3].get("AST"), "perd.")
        done.add(e)
    all_games = {}
    for pid, g in games.items():
        if g:
            g.sort(key=lambda x: x["date"]); all_games[pid] = g
            json.dump(g, open(f"data/games/{pid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(sorted(done), open("data/box_done.json", "w", encoding="utf-8"))
    if learned:  # žaidėjas rastas boxscore pagal vardą – įsimenam jo ESPN ID (nuotraukai, rosteriui)
        full = load("data/players.json", {"players": []})
        for q in full["players"]:
            if q["id"] in learned: q["espn_id"] = learned[q["id"]]; q["roster_status"] = "active"
        json.dump(full, open("data/players.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("Išmokti ESPN ID:", learned)
    json.dump(build(all_games), open("data/stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Baigta: rasta naujų žaidėjų įrašų:", found, "| žaidėjų su rungtynėmis:", len(all_games))
