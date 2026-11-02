"""ESPN NCAA D1 top 25 pagal kategorijas. Į data/ncaa_top25.json įrašo TIK mūsų lietuvius, patekusius į top 25."""
import json, datetime
from common import get
URL = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/statistics/byathlete"
SEASON = 2027
CATS = [("ppg","Taškai per rungtynes","offensive.avgPoints"),("rpg","Atkovoti kamuoliai per rungtynes","general.avgRebounds"),
 ("apg","Rezultatyvūs perdavimai per rungtynes","offensive.avgAssists"),("spg","Perimti kamuoliai per rungtynes","defensive.avgSteals"),
 ("bpg","Blokai per rungtynes","defensive.avgBlocks"),("fgp","Metimų iš žaidimo taiklumas (FG%)","offensive.fieldGoalPct"),
 ("tpp","Tritaškių taiklumas (3P%)","offensive.threePointFieldGoalPct"),("ftp","Baudų taiklumas (FT%)","offensive.freeThrowPct")]
def flat(j, a):
    out = {}
    for d, c in zip(j.get("categories", []), a.get("categories", [])):
        for n, v in zip(d.get("names", []), c.get("values", [])): out[f'{d.get("name")}.{n}'] = v
    return out
def top25(j, key):
    rows = []
    for a in j.get("athletes", []):
        f = flat(j, a); v = f.get(key)
        if v is None: v = next((x for k, x in f.items() if k.split(".")[-1] == key.split(".")[-1]), None)
        try: rows.append((str(a["athlete"]["id"]), a["athlete"].get("displayName"), float(v)))
        except Exception: pass
    rows.sort(key=lambda r: -r[2]); return rows[:25]
if __name__ == "__main__":
    players = json.load(open("data/players.json", encoding="utf-8"))["players"]
    by_id = {str(p["espn_id"]): p["id"] for p in players if p.get("espn_id")}
    out = {"updated": datetime.date.today().isoformat(), "players": {}, "debug": {}}
    for code, label, key in CATS:
        try:
            j = get(URL, region="us", lang="en", contentorigin="espn", isqualified="true", page=1, limit=50,
                    sort=f"{key}:desc", season=SEASON, seasontype=2)
            rows = top25(j, key)
        except Exception as e:
            print("KLAIDA", code, e); continue
        out["debug"][code] = [(n, v) for _, n, v in rows[:3]]
        print(code, "-> gauta:", len(rows), "| pirmi:", out["debug"][code])
        if not rows: print("   atsakymo raktai:", list(j.keys()), "| pirmas žaidėjas:", list((j.get("athletes") or [{}])[0].keys()))
        for i, (eid, name, v) in enumerate(rows, 1):
            pid = by_id.get(eid)
            if pid: out["players"].setdefault(pid, []).append({"cat": code, "label": label, "value": v, "rank": i}); print("   LIETUVIS TOP 25:", name, code, i, v)
    json.dump(out, open("data/ncaa_top25.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
