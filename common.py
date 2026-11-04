import time, unicodedata, difflib, requests
H = {"User-Agent": "lt-ncaa-tracker (hobby project, low rate)"}
def get(url, **params):
    r = requests.get(url, params=params, headers=H, timeout=30)
    r.raise_for_status()
    time.sleep(0.5)  # mandagumas: ne daugiau ~2 užklausų/s
    return r.json()
def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return s.replace("'", "").replace(".", "").replace("-", " ").strip()

def _sim(a, b): return difflib.SequenceMatcher(None, a, b).ratio()
def same_person(p, name):
    """Ar ESPN vardas `name` yra mūsų žaidėjas `p`? Tikrina vardą ir `aliases` (pvz. ESPN rašo „Krianauskas“ vietoj „Križanauskas“),
    toleruoja vieną dingusią/pakeistą raidę pavardėje, bet reikalauja to paties vardo."""
    n = norm(name).split()
    if not n: return False
    for cand in [p["name"]] + list(p.get("aliases") or []):
        c = norm(cand).split()
        if not c: continue
        if c == n: return True
        if _sim(c[0], n[0]) >= 0.8 and _sim(c[-1], n[-1]) >= 0.88 and (c[0][0] == n[0][0]): return True
    return False
