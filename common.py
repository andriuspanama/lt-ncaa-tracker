import time, unicodedata, requests
H = {"User-Agent": "lt-ncaa-tracker (hobby project, low rate)"}
def get(url, **params):
    r = requests.get(url, params=params, headers=H, timeout=30)
    r.raise_for_status()
    time.sleep(0.5)  # mandagumas: ne daugiau ~2 užklausų/s
    return r.json()
def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return s.replace("'", "").replace(".", "").replace("-", " ").strip()
