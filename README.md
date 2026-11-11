# LT NCAA Tracker

Neoficialus Lietuvos krepšininkų NCAA Division I sekiklis (statinė svetainė, GitHub Pages).

## Failai (visi repozitorijos šaknyje)
- Puslapiai: `index.html`, `results.html`, `charts.html`, `insights.html`, `metodika.html`, `404.html`
- Kodas: `app.js`, `results.js`, `charts.js`, `insights.js`, `theme.js`
- Stiliai: `style.css`, `extra.css`, `polish.css`, `modern.css` (naujas dizainas), `insights.css` (žurnalo stilius)
- Kortelės: `share.js` (žaidėjo, Top 10 ir palyginimo PNG kortelės)
- Duomenų skriptai: `common.py`, `resolve_ids.py`, `update.py`, `build_ticker.py`, `fetch_gamephotos.py`
- SEO: `robots.txt`, `sitemap.xml`
- `.github/workflows/update.yml` – duomenų atnaujinimas
- `data/` – `players.json`, `stats.json`, `games/` (kuria Action), neprivalomi: `awards.json`, `rankings.json`, `names.json`

## Paleidimas iš planšetės
1. Settings → Pages → Deploy from a branch → `main` / root.
2. Settings → Actions → General → Workflow permissions → Read and write.
3. Actions → Atnaujinti duomenis → Run workflow (vėliau veikia pats, 2 kartus per parą).

## Žaidėjo pridėjimas
`data/players.json` → pieštukas → nukopijuok bet kurį įrašą, pakeisk `id` (mažosiomis, su brūkšneliu), vardą, komandą, konferenciją, ūgį; `espn_id` palik `null`. Paleisk Action – ID bus surastas pats. Žaidėjas pasirodys sąraše. Jei rosteryje nerastas, Action žurnale matysi „NERASTAS ROSTERYJE“.

## Rankiniai failai
- `data/awards.json`: `[{"date":"2026-11-10","player":"motiejus-krivas","text":"Big 12 savaitės žaidėjas"}]`
- `data/rankings.json`: `{"top25":["Duke Blue Devils"]}` (pavadinimai kaip ESPN)
- `data/names.json`: `{"Vardas Pavardė":"Vardo Pavardės"}` – linksnių pataisoms

## Puslapiai
- `index.html` + `home.js` – pradžia: vakaro geriausieji (5 kategorijos), ESPN nuotrauka, dienos rezultatai, savaitės kalendorius. `games.html`/`results.html` nukreipia čia.
- `players.html` + `app.js` – žaidėjų sąrašas. `players/<id>.html` – žaidėjo puslapis (žurnalas po 3 rungtynes, progreso analizė, karštas/šaltas ženkliukas).
- `pnav.js` – bendras laikotarpio pasirinkimas (Turas / Mėnuo / Sezonas + kalendorius) Žaidėjų, Lyderių ir Palyginimo puslapiuose.
- `build_form.py` → `data/form.json`: karšti / šalti žaidėjai ir tendencijos (tik žaidėjams, sužaidusiems ≥10 rungtynių; paskutinės 5 prieš sezono vidurkį).

## Vardai su ESPN klaidomis
`data/players.json` → žaidėjui pridėk `"aliases": ["Gantas Krianauskas"]` – kodas ieškos ir pagal šį vardą. Norėdamas, kad jau apdorotos rungtynės būtų perskaitytos iš naujo, įrašyk žaidėjo `id` į `data/rematch.json` (po paleidimo failas išsivalo pats).

## Nuotraukos Įžvalgose
`fetch_gamephotos.py` ieško ESPN rungtynių nuotraukų su žaidėjo vardu parašuose ir saugo tik nuorodas (`data/gamephotos.json`). Nuotraukos nesaugomos svetainėje, rodomos tiesiogiai iš ESPN su nuoroda į šaltinį.

## Ribojimai
Nėra oficialaus NCAA API; naudojami viešieji ESPN endpointai, jie gali pasikeisti. Logotipai ir nuotraukos nenaudojami. Duomenys gali vėluoti.

## Programėlė (PWA) ir pranešimai
- Svetainę galima įdiegti kaip programėlę (Android/Chrome: „Įdiegti“ juosta; iPhone: Safari → Dalintis → Pridėti į pradžios ekraną). Piktogramos: `python tools/make_icons.py` (tas pats NCAA logotipas iš `ncaa-logo.png`).
- `sw.js` – veikimas be tinklo (rodo paskutinius duomenis) ir fono tikrinimas (Android Chrome, įdiegta programėlė).
- **Momentiniai pranešimai (neprivaloma)** – per OneSignal (nemokama paskyra): 1) onesignal.com → naujas „Web“ projektas, svetainės adresas `https://andriuspanama.github.io/lt-ncaa-tracker/`; 2) `config.js` įrašyk savo App ID; 3) GitHub → Settings → Secrets and variables → Actions → pridėk `ONESIGNAL_APP_ID` ir `ONESIGNAL_API_KEY`. `send_push.py` siunčia ne dažniau nei kas 5 val. ir tik kai atsiranda nauji rezultatai. iPhone pranešimus gauna tik įdiegta programėlė (iOS 16.4+).

## Šūvių žemėlapis ir rekordai
- `fetch_shots.py` – ESPN play-by-play šūvių koordinatės → `data/shots/<id>.json` (jei ESPN koordinačių nepateikia, žemėlapis nerodomas).
- `build_records.py` → `data/records.json`: sezono rekordai, pasiekimų ženkliukai ir 🏆 „naujas rekordas“ (7 d.).
