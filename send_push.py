"""Išsiunčia pranešimą per OneSignal, jei nustatyti ONESIGNAL_APP_ID ir ONESIGNAL_API_KEY (GitHub → Settings → Secrets → Actions).
Neišsiunčia, jei nauji rezultatai tie patys (data/notify_state.json) arba dar nepraėjo MIN_HOURS nuo ankstesnio pranešimo.
Paleisti po to, kai pakeitimai jau įkelti į repozitoriją (kad paspaudus pranešimą svetainė būtų atnaujinta)."""
import sys, json, os, time, sys
import requests
MIN_HOURS = 5
SITE = os.environ.get("SITE_URL", "https://andriuspanama.github.io/lt-ncaa-tracker/")
def load(p, d):
    try: return json.load(open(p, encoding="utf-8"))
    except Exception: return d
if __name__ == "__main__":
    app, key = os.environ.get("ONESIGNAL_APP_ID"), os.environ.get("ONESIGNAL_API_KEY")
    n = load("data/notify.json", None)
    if not n: print("Nėra data/notify.json – nėra ką siųsti."); sys.exit(0)
    if not app or not key: print("OneSignal raktai nenustatyti – pranešimas praleistas (puslapis ir fono tikrinimas veikia be jų)."); sys.exit(0)
    st = load("data/notify_state.json", {"id": "", "ts": 0})
    if st.get("id") == n["id"]: print("Tie patys rezultatai kaip paskutiniame pranešime – praleista."); sys.exit(0)
    if time.time() - st.get("ts", 0) < MIN_HOURS * 3600: print("Per anksti po ankstesnio pranešimo – praleista."); sys.exit(0)
    time.sleep(int(os.environ.get("PUSH_DELAY", "120")))            # kad Pages spėtų atsinaujinti
    r = requests.post("https://api.onesignal.com/notifications?c=push", timeout=30,
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
        json={"app_id": app, "included_segments": ["Subscribed Users"], "headings": {"en": n["title"], "lt": n["title"]}, "contents": {"en": n["body"], "lt": n["body"]},
              "url": SITE + n.get("url", "index.html"), "chrome_web_icon": SITE + "icons/icon-192.png", "chrome_web_badge": SITE + "icons/favicon-64.png"})
    print("OneSignal:", r.status_code, r.text[:200])
    if r.ok: json.dump({"id": n["id"], "ts": time.time()}, open("data/notify_state.json", "w"))
    else: sys.exit(1)
