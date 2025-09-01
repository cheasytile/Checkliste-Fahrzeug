# Einsatz-Checkliste (PWA)

Installierbare Web-App (PWA) für SEW / SEW‑N Checklisten. Offline-fähig, speichert den Status pro Einsatzmittel im Browser.

## GitHub Pages Deployment
1. Neues (öffentliches oder privates) Repository anlegen, z. B. **sew-checklist**.
2. Den gesamten Inhalt dieses Ordners ins **Repo-Root** kopieren und committen.
3. Repository → **Settings** → **Pages** → **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** und **/** (root) → **Save**
4. Nach dem Build ist die Seite unter `https://<user>.github.io/<repo>/` erreichbar.

## Anpassungen
- Inhalte: `data/sew.json`, `data/sew-n.json`
- App-Name/Farben: `manifest.json`
- Icons: `assets/icon-192.png`, `assets/icon-512.png`

> Hinweis: Relative Pfade → läuft korrekt unter `/<repo>` Pfad. `.nojekyll` ist enthalten.