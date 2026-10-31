# LT NCAA Tracker

Neoficialus Lietuvos krepšininkų NCAA Division I sekiklis (statinė svetainė, GitHub Pages).

## Failai (visi repozitorijos šaknyje)
- Puslapiai: `index.html`, `results.html`, `charts.html`, `insights.html`, `metodika.html`, `404.html`
- Kodas: `app.js`, `results.js`, `charts.js`, `insights.js`, `theme.js`
- Stiliai: `style.css`, `extra.css`, `polish.css`
- Duomenų skriptai: `common.py`, `resolve_ids.py`, `update.py`
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

## Ribojimai
Nėra oficialaus NCAA API; naudojami viešieji ESPN endpointai, jie gali pasikeisti. Logotipai ir nuotraukos nenaudojami. Duomenys gali vėluoti.
