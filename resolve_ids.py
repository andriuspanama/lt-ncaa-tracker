"""Suranda ESPN ID ir rosterio statusą žaidėjams, kuriems espn_id dar tuščias. Nieko neperrašo, kas jau užpildyta."""
import json
from common import get, norm
B = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball"
PATH = "data/players.json"
data = json.load(open(PATH, encoding="utf-8"))
todo = [p for p in data["players"] if not p.get("espn_id")]
if not todo:
    raise SystemExit("Visi ID jau yra.")
teams = [t["team"] for t in get(f"{B}/teams", limit=500)["sports"][0]["leagues"][0]["teams"]]
def find_team(name):
    n = norm(name)
    hits = [t for t in teams if norm(t.get("displayName")) == n]
    hits = hits or [t for t in teams if norm(t.get("location")) == n]
    hits = hits or [t for t in teams if norm(t.get("displayName")).startswith(n + " ")]
    return hits[0] if len(hits) == 1 else None
roster_cache = {}
for p in todo:
    t = find_team(p["team"])
    if not t:
        p["roster_status"] = "team_not_found"; print("KOMANDA NERASTA:", p["team"]); continue
    if t["id"] not in roster_cache:
        r = get(f"{B}/teams/{t['id']}/roster").get("athletes", [])
        roster_cache[t["id"]] = [a for x in r for a in (x.get("items") or [x])]
    last = norm(p["name"]).split()[-1]
    first = norm(p["name"])[0]
    full = [a for a in roster_cache[t["id"]] if norm(a.get("fullName")) == norm(p["name"])]
    part = [a for a in roster_cache[t["id"]] if norm(a.get("fullName")).split()[-1:] == [last] and norm(a.get("fullName"))[:1] == first]
    a = (full or part or [None])[0]
    if not a:
        p["roster_status"] = "not_found"; print("NERASTAS ROSTERYJE:", p["name"], p["team"]); continue
    p["espn_id"] = a["id"]; p["roster_status"] = "active"
    p["class_year"] = p.get("class_year") or (a.get("experience") or {}).get("displayValue")
    print("OK", p["name"], a["id"])
json.dump(data, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
