"""ESPN: konferencijos (su lygiais A–D) ir AP Top 25. Rašo data/conferences.json ir data/rankings.json."""
import json, datetime
from common import get
B = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball"
TIERS = [("A", ("sec","southeastern","big ten","big 12","acc","atlantic coast","big east")),
 ("B", ("pac-12","pac 12","mountain west","mwc","west coast","wcc","atlantic 10","a-10","american athletic","american","aac","missouri valley","mvc")),
 ("C", ("sun belt","conference usa","c-usa","cusa","mid-american","mac","colonial","caa","big west","western athletic","wac","summit","horizon","ivy league","ivy","metro atlantic","maac"))]
def tier(*names):
    ns = [n.lower() for n in names if n]
    for t, keys in TIERS:
        if any(n == k for n in ns for k in keys) or any(k in n for n in ns for k in keys if len(k) > 4): return t
    return "D"
def teams_of(j):
    try: return [t["team"] for t in j["sports"][0]["leagues"][0]["teams"]]
    except Exception: return []
def build_conf(confs, fetch):
    out = {}
    for gid, name, short in confs:
        for t in teams_of(fetch(gid)):
            out[t["displayName"]] = {"conf": short or name, "tier": tier(short, name), "location": t.get("location")}
    cnt = {}
    for v in list(out.values()): cnt[v["location"]] = cnt.get(v["location"], 0) + 1
    for k, v in list(out.items()):
        if v["location"] and cnt[v["location"]] == 1 and v["location"] not in out: out[v["location"]] = v
    return out
def ap_ranks(j):
    polls = j.get("rankings") or []
    poll = next((p for p in polls if "ap" in ((p.get("shortName") or "") + " " + (p.get("name") or "")).lower().split()), polls[0] if polls else None)
    ap = {}
    for r in (poll or {}).get("ranks", []):
        t = r.get("team") or {}
        if t.get("location") and r.get("current"):
            ap[f'{t["location"]} {t.get("name","")}'.strip()] = r["current"]; ap.setdefault(t["location"], r["current"])
    return ap
if __name__ == "__main__":
    today = datetime.date.today().isoformat()
    try:
        confs = [(str(c.get("groupId")), c.get("name"), c.get("shortName")) for c in get(f"{B}/scoreboard/conferences").get("conferences", []) if str(c.get("groupId")) != "50"]
        teams = build_conf(confs, lambda gid: get(f"{B}/teams", groups=gid, limit=100))
        print("Konferencijų:", len(confs), "| komandų:", len(teams))
        if teams: json.dump({"updated": today, "teams": teams}, open("data/conferences.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception as e: print("KLAIDA konferencijos:", e)
    try:
        ap = ap_ranks(get(f"{B}/rankings"))
        print("AP reitingų:", len(ap))
        if ap: json.dump({"updated": today, "ap": ap, "top25": [k for k, v in ap.items() if v <= 25 and " " in k]}, open("data/rankings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception as e: print("KLAIDA reitingai:", e)
