# LT NCAA Tracker

## Įkėlimas į GitHub (iš planšetės)
1. github.com → **New repository** → pavadinimas `lt-ncaa-tracker`, Public.
2. **Add file → Upload files**: įkelk `index.html`, `style.css`, `app.js`, `README.md`.
3. Dar kartą Upload files: aplanke `data/` turi būti `players.json` ir `stats.json` (įkelk per **Create new file**, rašyk kelią `data/stats.json`, arba įkelk visą aplanką).
4. **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
5. Po 1–2 min svetainė: `https://TAVO-VARDAS.github.io/lt-ncaa-tracker/`

## Kaip veikia
- Žaidėjai: `data/players.json` (redaguok per github.com, pieštuko ikona).
- Statistika: `data/stats.json`. Formatas:
  `{"updated":"2026-11-10","periods":{"season":{"motiejus-krivas":{"gp":5,"pts":60,"reb":40,"ast":5,"stl":3,"blk":10}}}}`
  Raktas = žaidėjo `id` iš players.json, reikšmės = sumos, svetainė pati dalija iš `gp`.
  `periods`: `week`, `month`, `season`.
- Jei žaidėjo nėra rosteryje: pridėk jo įrašui `"roster_status": "not_found"`, ir jis bus paslėptas.

## Automatinis atnaujinimas (2 etapas)
1. Failus `scripts/common.py`, `scripts/resolve_ids.py`, `scripts/update.py` įkelk į aplanką `scripts/`.
2. Failą `update.yml` sukurk per **Add file → Create new file** su keliu `.github/workflows/update.yml` ir įklijuok turinį.
3. **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**.
4. **Actions → Atnaujinti duomenis → Run workflow**. Pirmą kartą suras ESPN ID, vėliau atsisiųs rungtynes.
5. Peržiūrėk Action žurnalą: eilutės „NERASTAS ROSTERYJE“ / „KOMANDA NERASTA“ rodo, ką reikia pataisyti `players.json`.
Savaitė = savaitė (pirmadienis–sekmadienis), kurioje buvo paskutinės rungtynės; mėnuo = to paties mėnesio rungtynės.
