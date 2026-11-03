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
def conf_map(confs): return {gid: (name, short) for gid, name, short in confs}
def team_groups(j):
    g = (j.get("team") or {}).get("groups") or {}
    ids = [str(g.get("id"))] if g.get("id") is not None else []
    if g.get("parent") and g["parent"].get("id") is not None: ids.append(str(g["parent"]["id"]))
    return ids
def add_aliases(out):
    cnt = {}
    for v in out.values(): cnt[v["location"]] = cnt.get(v["location"], 0) + 1
    for k, v in list(out.items()):
        if v["location"] and cnt[v["location"]] == 1 and v["location"] not in out: out[v["location"]] = v
    return out
def build_by_team(teams, cmap, fetch_team):
    """Kiekvienai komandai paklausia jos pačios aprašo (team.groups) – tai patikima, nes užklausa konkreti."""
    out = {}
    for t in teams:
        try: ids = team_groups(fetch_team(t["id"]))
        except Exception: continue
        gid = next((i for i in ids if i in cmap and i != "50"), None)
        if gid:
            name, short = cmap[gid]
            out[t["displayName"]] = {"conf": short or name, "tier": tier(short, name), "location": t.get("location"), "color": t.get("color"), "alt": t.get("alternateColor")}
    return add_aliases(out)
def from_standings(j):
    out = {}
    for c in j.get("children", []):
        name, short = c.get("name"), c.get("abbreviation")
        for e in (c.get("standings") or {}).get("entries", []):
            t = e.get("team") or {}
            if t.get("displayName"): out[t["displayName"]] = {"conf": short or name, "tier": tier(short, name), "location": t.get("location")}
    return add_aliases(out)
def valid(out):  # apsauga: jei visos komandos vienoje konferencijoje – duomenys blogi
    return len(out) >= 100 and len({v["conf"] for v in out.values()}) >= 8
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
    out = {}
    try:
        confs = [(str(c.get("groupId")), c.get("name"), c.get("shortName")) for c in get(f"{B}/scoreboard/conferences").get("conferences", []) if str(c.get("groupId")) != "50"]
        cmap = conf_map(confs); teams = teams_of(get(f"{B}/teams", limit=500))
        print("Konferencijų:", len(confs), "| komandų sąraše:", len(teams))
        out = build_by_team(teams, cmap, lambda tid: get(f"{B}/teams/{tid}"))
        print("1 būdas (komandų aprašai):", len(out), "komandų,", len({v['conf'] for v in out.values()}), "konferencijų")
    except Exception as e: print("KLAIDA 1 būdas:", e)
    if not valid(out):
        for params in ({"level": 3}, {}):
            try:
                out = from_standings(get("https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings", **params))
                print("2 būdas (standings):", len(out), "komandų,", len({v['conf'] for v in out.values()}), "konferencijų")
                if valid(out): break
            except Exception as e: print("KLAIDA 2 būdas:", e)
    if valid(out): json.dump({"updated": today, "teams": out}, open("data/conferences.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("conferences.json įrašytas")
    else: print("NEPAVYKO gauti patikimų konferencijų – failas neperrašytas (senas, jei buvo, gali būti blogas: ištrink data/conferences.json)")
    try:
        ap = ap_ranks(get(f"{B}/rankings"))
        print("AP reitingų:", len(ap))
        if ap: json.dump({"updated": today, "ap": ap, "top25": [k for k, v in ap.items() if v <= 25 and " " in k]}, open("data/rankings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception as e: print("KLAIDA reitingai:", e)
