"""Surenka lietuvių komandų tvarkaraštį iš ESPN į data/schedule.json (data UTC, rezultatai, varžovo reitingas jei yra)."""
import json
from common import get, norm
B = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball"
SEASON = 2027
def score(c):
    s = c.get("score"); return s.get("displayValue") if isinstance(s, dict) else s
def parse(j, team, tid):
    out = []
    for ev in j.get("events", []):
        comp = (ev.get("competitions") or [{}])[0]; cs = comp.get("competitors", [])
        me = next((c for c in cs if str((c.get("team") or {}).get("id")) == str(tid)), None); op = next((c for c in cs if c is not me), None)
        if not me or not op: continue
        r = (op.get("curatedRank") or {}).get("current"); r = r if isinstance(r, int) and 0 < r <= 25 else None
        out.append({"event_id": str(ev.get("id")), "date": ev.get("date"), "team": team, "opponent": (op.get("team") or {}).get("displayName"),
                    "home": me.get("homeAway") == "home", "state": ((comp.get("status") or {}).get("type") or {}).get("state"),
                    "for": score(me), "against": score(op), "opp_rank": r})
    return out
if __name__ == "__main__":
    teams = sorted({p["team"] for p in json.load(open("data/players.json", encoding="utf-8"))["players"]})
    all_t = [t["team"] for t in get(f"{B}/teams", limit=500)["sports"][0]["leagues"][0]["teams"]]
    def find(n):
        n = norm(n); h = [t for t in all_t if norm(t.get("displayName")) == n] or [t for t in all_t if norm(t.get("location")) == n] or [t for t in all_t if norm(t.get("displayName")).startswith(n + " ")]
        return h[0] if len(h) == 1 else None
    out = []
    for name in teams:
        t = find(name)
        if not t: print("KOMANDA NERASTA:", name); continue
        try: out += parse(get(f"{B}/teams/{t['id']}/schedule", season=SEASON), name, t["id"])
        except Exception as e: print("KLAIDA", name, e)
    json.dump(sorted(out, key=lambda g: g["date"] or ""), open("data/schedule.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Rungtynių:", len(out))
